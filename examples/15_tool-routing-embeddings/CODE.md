# Code explanation: `tool-routing-embeddings.js`

This example loads **two** GGUF models with one `getLlama()` instance: a **chat** model (Qwen3) and a **dedicated embedding** model (bge-small-en). Only the embedding model uses `createEmbeddingContext()`.

## Run

```bash
node examples/15_tool-routing-embeddings/tool-routing-embeddings.js
```

Requires both files under `models/` (see [DOWNLOAD.md](../../DOWNLOAD.md)): `Qwen3-1.7B-Q8_0.gguf` and `bge-small-en-v1.5-q8_0.gguf`.

---

## 1) Two routing functions: `scoreTools` and `selectToolKeys`

The routing logic is deliberately split into two small, inspectable functions. You can unit-test them independently and swap either one without touching the other.

**`scoreTools`** - query vs. all exemplars, return a score per tool:

```javascript
function scoreTools(queryEmbedding, exemplarRows) {
    const maxByTool = new Map();
    for (const row of exemplarRows) {
        const sim = queryEmbedding.calculateCosineSimilarity(row.embedding);
        const prev = maxByTool.get(row.toolKey) ?? -Infinity;
        if (sim > prev) maxByTool.set(row.toolKey, sim);
    }
    return maxByTool; // Map<toolKey, maxCosineSimilarity>
}
```

Each tool can have several exemplar strings. The score used is the **maximum** across all of them, not the mean. A single strong exemplar match keeps a tool competitive even if the other phrasings miss - this is the same "max-sim" strategy used in late-interaction retrieval models.

**`selectToolKeys`** - pick the top-k tools plus any pinned tools:

```javascript
function selectToolKeys(scores, k, alwaysInclude) {
    const ranked = [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => key);

    const out = new Set(alwaysInclude);          // start with pinned tools
    for (const key of ranked) {
        if (out.size >= alwaysInclude.size + k) break;
        if (alwaysInclude.has(key)) continue;    // pinned tools don't use a slot
        out.add(key);
    }
    return out;
}
```

Pinned tools are added first and do **not** consume a retrieval slot. Requesting `k=1` with one pinned tool yields two tools total, not one.

---

## 2) Tool catalog (12 IT helpdesk tools)

Every tool is a `defineChatSessionFunction` entry with a description, a JSON schema, and a handler. The handlers return canned JSON so the lesson stays focused on routing, not business logic.

```javascript
const checkVPNStatus = defineChatSessionFunction({
    description: "Check VPN client status, the active profile, and tunnel health for a user.",
    params: {
        type: "object",
        properties: {
            username: { type: "string", description: "Username to look up (optional)" },
        },
    },
    async handler({ username = "current_user" } = {}) {
        return JSON.stringify({
            username,
            vpn_client: "Cisco AnyConnect 4.10",
            connected: false,
            last_connected: "2026-05-14T09:31:00Z",
            error: "Authentication timeout - check MFA token or try reconnecting",
            profile: "Corp-HQ",
        });
    },
});
```

The twelve tools cover five distinct semantic clusters. Distinct clusters matter: routing works because embedding similarity separates them.

| Cluster | Tools |
|---|---|
| Connectivity | `checkNetworkConnectivity`, `checkVPNStatus` |
| System health | `getSystemLogs`, `runDiagnostic`, `getHardwareInfo` |
| Storage / software | `checkDiskSpace`, `getInstalledSoftware` |
| Account / access | `getUserAccount`, `resetPassword` |
| Operations | `restartService`, `createSupportTicket`, `escalateToSpecialist` |

---

## 3) `EXEMPLARS` and cold-start embedding

`EXEMPLARS` is a flat list of `{ toolKey, text }` pairs - three phrasings per tool (36 total):

```javascript
const EXEMPLARS = [
    // checkVPNStatus
    { toolKey: "checkVPNStatus", text: "remote tunnel to corporate network not establishing from outside office" },
    { toolKey: "checkVPNStatus", text: "VPN client shows disconnected even after entering valid credentials" },
    { toolKey: "checkVPNStatus", text: "AnyConnect auth keeps timing out when working remotely" },

    // getUserAccount
    { toolKey: "getUserAccount", text: "account suspended or locked in Active Directory after failed logins" },
    { toolKey: "getUserAccount", text: "verify user permissions and group membership in the directory" },
    { toolKey: "getUserAccount", text: "sign-in blocked, need to confirm account standing" },
    // ...
];
```

The strings are **not** copied from the demo prompts - they are paraphrases. If exemplars were near-identical to live queries, routing would look "magic" but you would be testing verbatim recall, not semantic generalization.

At startup, every exemplar is embedded once and cached:

```javascript
const exemplarRows = [];
for (const { toolKey, text } of EXEMPLARS) {
    const embedding = await embedContext.getEmbeddingFor(text);
    exemplarRows.push({ toolKey, exemplarText: text, embedding });
}
```

In a production service you would persist these vectors and rebuild them only when the tool catalog changes.

---

## 4) Model setup: one `llama` instance, two models

Both models are loaded through the same `llama` handle but each gets its own context type:

```javascript
const llama = await getLlama({ debug });

// Chat model - uses a LlamaChatSession
const chatModel = await llama.loadModel({ modelPath: CHAT_MODEL_PATH });
const chatContext = await chatModel.createContext({ contextSize: 4096 });
const session = new LlamaChatSession({
    contextSequence: chatContext.getSequence(),
    chatWrapper: new QwenChatWrapper({ thoughts: "discourage" }),
    systemPrompt: `You are a concise IT helpdesk assistant. ...`,
});

// Embedding model - uses createEmbeddingContext, not a chat context
const embedModel = await llama.loadModel({ modelPath: EMBED_MODEL_PATH });
const embedContext = await embedModel.createEmbeddingContext();
```

`QwenChatWrapper({ thoughts: "discourage" })` prevents the Qwen3 model from writing the post-tool answer inside internal "thought" segments, which would make `session.prompt()` return an empty string.

---

## 5) `runWithRouting` - routing + prompt + logging

Each demo case calls this function. It runs the full pipeline and appends a record to `routingLog` for the visualization:

```javascript
async function runWithRouting(userPrompt, { retrievalK, alwaysInclude = new Set(), label }) {
    // 1. Embed the live query
    const queryEmbedding = await embedContext.getEmbeddingFor(userPrompt);

    // 2. Score all tools and select the subset
    const scores = scoreTools(queryEmbedding, exemplarRows);
    const selectedKeys = selectToolKeys(scores, retrievalK, alwaysInclude);

    // 3. Print a ranked similarity table (top 6)
    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    for (const [key, sim] of ranked.slice(0, 6)) {
        const tick = selectedKeys.has(key) ? "✓" : " ";
        const bar = "█".repeat(Math.round(sim * 24)).padEnd(24);
        console.log(`  [${tick}] ${key.padEnd(28)} ${sim.toFixed(4)}  ${bar}`);
    }

    // 4. Pass only the selected subset to session.prompt
    const functions = pickFunctions(selectedKeys, allFunctions);
    const answer = await session.prompt(userPrompt, { functions, maxTokens: 1200, temperature: 0 });

    // 5. Reset history so each case is independent
    session.resetChatHistory();

    // 6. Store for visualization
    routingLog.push({ label, userPrompt, scores: Object.fromEntries(scores),
                      selectedKeys: [...selectedKeys], alwaysInclude: [...alwaysInclude],
                      retrievalK, answer: answer.trim() });
}
```

The similarity table is the key teaching output. The `✓` mark shows exactly which tools the LLM can see. Every other tool is invisible to it for that turn.

---

## 6) Demo cases (read the console)

Cases are called in order. The first four establish baselines; cases 5 and 6 are the **same prompt** with different routing parameters to demonstrate recall failure and how pinning fixes it:

```javascript
// Cases 1-2: single intent, k=1 - one tool cluster dominates
await runWithRouting(DEMO_VPN,    { retrievalK: 1, label: "Single intent - VPN failure ..." });
await runWithRouting(DEMO_LOCKED, { retrievalK: 1, label: "Single intent - locked account ..." });

// Cases 3-4: dual intent, k=2 - two clusters both needed
await runWithRouting(DEMO_CRASHING_PC,      { retrievalK: 2, label: "Dual intent - crashing PC ..." });
await runWithRouting(DEMO_DISK_AND_SOFTWARE, { retrievalK: 2, label: "Dual intent - disk full + software ..." });

// Case 5: dual intent, k=1 - recall failure: VPN dominates, account tool is cut
await runWithRouting(DEMO_VPN_AND_LOCKED_K1, {
    retrievalK: 1,
    label: "Dual intent - VPN + locked account, k=1: recall failure ...",
});

// Case 6: same prompt, k=1 + pinned getUserAccount - both intents covered without raising k
await runWithRouting(DEMO_VPN_AND_LOCKED_K1, {
    retrievalK: 1,
    alwaysInclude: new Set(["getUserAccount"]),
    label: "Dual intent - same query, k=1 + pinned getUserAccount ...",
});
```

| # | Intent | k | Pinned | Expected tools exposed |
|---|---|---|---|---|
| 1 | VPN failure | 1 | - | `checkVPNStatus` |
| 2 | Locked account | 1 | - | `getUserAccount` or `resetPassword` |
| 3 | Crashing PC | 2 | - | `getSystemLogs` + `runDiagnostic` |
| 4 | Disk full + software | 2 | - | `checkDiskSpace` + `getInstalledSoftware` |
| 5 | VPN + locked account | 1 | - | VPN only - **account tool missing** |
| 6 | VPN + locked account | 1 | `getUserAccount` | Both covered |

---

## 7) Disposal

Resources are disposed in reverse dependency order:

```javascript
session.dispose();
chatContext.dispose();
chatModel.dispose();
embedContext.dispose();
embedModel.dispose();
llama.dispose();
```
