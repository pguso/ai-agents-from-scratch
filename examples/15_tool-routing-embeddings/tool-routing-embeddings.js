/**
 * Example 15: Tool routing with embeddings - IT helpdesk agent
 *
 * An agent with 12 tools uses a small embedding model to pre-filter
 * which tools are exposed to the chat LLM for each user request.
 * Routing is "RAG for tools": exemplar phrases are the documents,
 * the user message is the query, and cosine similarity is retrieval.
 *
 * Run:
 *   node examples/15_tool-routing-embeddings/tool-routing-embeddings.js
 */
import { defineChatSessionFunction, getLlama, LlamaChatSession, QwenChatWrapper } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const MODELS_DIR = path.join(__dirname, "..", "..", "models");
const CHAT_MODEL_PATH = path.join(MODELS_DIR, "Qwen3-1.7B-Q8_0.gguf");
const EMBED_MODEL_PATH = path.join(MODELS_DIR, "bge-small-en-v1.5-q8_0.gguf");

/** @typedef {{ toolKey: string, exemplarText: string, embedding: import("node-llama-cpp").LlamaEmbedding }} ExemplarRow */

/**
 * Compute the max cosine similarity between the query and every exemplar for each tool.
 * Using max (not mean) means a single strong exemplar match keeps a tool competitive.
 * @param {import("node-llama-cpp").LlamaEmbedding} queryEmbedding
 * @param {ExemplarRow[]} exemplarRows
 * @returns {Map<string, number>} toolKey → highest cosine similarity
 */
function scoreTools(queryEmbedding, exemplarRows) {
    /** @type {Map<string, number>} */
    const maxByTool = new Map();
    for (const row of exemplarRows) {
        const sim = queryEmbedding.calculateCosineSimilarity(row.embedding);
        const prev = maxByTool.get(row.toolKey) ?? -Infinity;
        if (sim > prev) maxByTool.set(row.toolKey, sim);
    }
    return maxByTool;
}

/**
 * Select which tool keys to expose: top-k by score plus the always-include set.
 * Always-include tools do not consume a retrieval slot.
 * @param {Map<string, number>} scores from scoreTools()
 * @param {number} k tools to retrieve by similarity
 * @param {ReadonlySet<string>} alwaysInclude tool keys merged unconditionally
 * @returns {Set<string>}
 */
function selectToolKeys(scores, k, alwaysInclude) {
    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key);
    const out = new Set(alwaysInclude);
    for (const key of ranked) {
        if (out.size >= alwaysInclude.size + k) break;
        if (alwaysInclude.has(key)) continue;
        out.add(key);
    }
    return out;
}

/**
 * @param {ReadonlySet<string>} keys
 * @param {Record<string, ReturnType<typeof defineChatSessionFunction>>} allFns
 */
function pickFunctions(keys, allFns) {
    /** @type {Record<string, ReturnType<typeof defineChatSessionFunction>>} */
    const functions = {};
    for (const key of keys) {
        const fn = allFns[key];
        if (!fn) throw new Error(`Unknown tool key: ${key}`);
        functions[key] = fn;
    }
    return functions;
}

// ─── Tool catalog (12 IT helpdesk tools) ────────────────────────────────────

const checkNetworkConnectivity = defineChatSessionFunction({
    description: "Run a network connectivity diagnostic: ping test, packet loss, latency to a target host.",
    params: {
        type: "object",
        properties: {
            target: { type: "string", description: "IP or hostname to test (default: 8.8.8.8)" },
        },
    },
    async handler({ target = "8.8.8.8" } = {}) {
        return JSON.stringify({ target, ping_ms: 24, packet_loss_pct: 0, dns_resolution: "ok", status: "connected" });
    },
});

const checkVPNStatus = defineChatSessionFunction({
    description: "Check VPN client status, the active profile, and tunnel health for a user.",
    params: {
        type: "object",
        properties: { username: { type: "string", description: "Username to look up (optional)" } },
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

const getSystemLogs = defineChatSessionFunction({
    description: "Fetch recent system event logs or application crash logs for a given severity.",
    params: {
        type: "object",
        properties: {
            severity: { type: "string", description: "'error', 'warning', or 'info' (default: 'error')" },
            last_hours: { type: "number", description: "Hours of history to fetch (default: 24)" },
        },
    },
    async handler({ severity = "error", last_hours = 24 } = {}) {
        return JSON.stringify({
            severity,
            last_hours,
            log_count: 7,
            top_events: [
                { time: "2026-05-15T06:12Z", source: "Kernel-Power", id: 41, message: "System did not shut down cleanly" },
                { time: "2026-05-15T07:44Z", source: "Application Error", id: 1000, message: "nvlddmkm.sys - display driver crash" },
                { time: "2026-05-15T11:02Z", source: "Disk", id: 11, message: "I/O error on drive C:" },
            ],
        });
    },
});

const checkDiskSpace = defineChatSessionFunction({
    description: "Check disk usage on all local drives and flag any that are critically full.",
    params: { type: "object", properties: {} },
    async handler() {
        return JSON.stringify({
            drives: [
                { drive: "C:", total_gb: 256, used_gb: 238, free_gb: 18, pct_used: 93 },
                { drive: "D:", total_gb: 1024, used_gb: 310, free_gb: 714, pct_used: 30 },
            ],
            warning: "C: is critically full (93%). Cleanup or expansion required.",
        });
    },
});

const getInstalledSoftware = defineChatSessionFunction({
    description: "List installed applications and their current version numbers.",
    params: {
        type: "object",
        properties: { filter: { type: "string", description: "Optional name filter (e.g. 'Microsoft')" } },
    },
    async handler({ filter = "" } = {}) {
        const all = [
            { name: "Microsoft 365", version: "16.0.17231.20194" },
            { name: "Google Chrome", version: "124.0.6367.82" },
            { name: "Zoom", version: "5.17.6" },
            { name: "Adobe Acrobat", version: "24.002.20857" },
            { name: "Slack", version: "4.36.142" },
            { name: "7-Zip", version: "24.06" },
        ];
        const apps = filter ? all.filter((x) => x.name.toLowerCase().includes(filter.toLowerCase())) : all;
        return JSON.stringify({ filter: filter || "none", apps });
    },
});

const getUserAccount = defineChatSessionFunction({
    description: "Look up user account status in Active Directory: active/locked, last login, group memberships.",
    params: {
        type: "object",
        properties: { username: { type: "string", description: "Username or email" } },
        required: ["username"],
    },
    async handler({ username }) {
        return JSON.stringify({
            username,
            status: "locked",
            locked_reason: "Failed login attempts exceeded (5/5)",
            last_login: "2026-05-15T08:17Z",
            groups: ["Domain Users", "VPN_Access", "Office365_E3"],
            mfa_enabled: true,
        });
    },
});

const resetPassword = defineChatSessionFunction({
    description: "Initiate a password reset for a user and send a reset link via email or SMS.",
    params: {
        type: "object",
        properties: {
            username: { type: "string", description: "Username or email" },
            method: { type: "string", description: "'email' or 'sms' (default: 'email')" },
        },
        required: ["username"],
    },
    async handler({ username, method = "email" }) {
        return JSON.stringify({
            username,
            reset_initiated: true,
            method,
            sent_to: "j***@company.com",
            expires_in_minutes: 30,
            also_unlocked: true,
        });
    },
});

const runDiagnostic = defineChatSessionFunction({
    description: "Run a named hardware or software diagnostic: 'memory', 'gpu', 'startup', or 'storage'.",
    params: {
        type: "object",
        properties: { test: { type: "string", description: "Test name: 'memory', 'gpu', 'startup', 'storage'" } },
        required: ["test"],
    },
    async handler({ test }) {
        const results = {
            memory: { passed: true, errors: 0, tested_mb: 16384 },
            gpu: { passed: false, driver: "nvlddmkm.sys", recommendation: "Update or roll back GPU driver" },
            startup: { passed: true, boot_time_s: 38, top_slow: ["antivirus_service (12s)", "teams_updater (8s)"] },
            storage: { passed: false, bad_sectors: 3, drive: "C:", recommendation: "Back up data and replace drive soon" },
        };
        return JSON.stringify({ test, result: results[test] ?? { error: "Unknown test name" } });
    },
});

const getHardwareInfo = defineChatSessionFunction({
    description: "Return hardware specs: CPU, RAM, GPU, storage, OS version, and asset serial number.",
    params: { type: "object", properties: {} },
    async handler() {
        return JSON.stringify({
            cpu: "Intel Core i7-12700H",
            ram_gb: 16,
            gpu: "NVIDIA GeForce RTX 3060 (driver 551.61)",
            storage: [{ type: "NVMe SSD", model: "Samsung PM9A1", size_gb: 256 }],
            os: "Windows 11 Pro 23H2",
            serial: "5CG2291RTY",
        });
    },
});

const restartService = defineChatSessionFunction({
    description: "Restart a named Windows service or background process (e.g. 'print spooler', 'DNS client').",
    params: {
        type: "object",
        properties: { service_name: { type: "string", description: "Service display name or key name" } },
        required: ["service_name"],
    },
    async handler({ service_name }) {
        return JSON.stringify({
            service_name,
            restarted: true,
            previous_state: "running",
            new_state: "running",
            message: `Service "${service_name}" stopped and restarted successfully`,
        });
    },
});

const createSupportTicket = defineChatSessionFunction({
    description: "Open a helpdesk incident ticket with a summary, priority, and category for tracking.",
    params: {
        type: "object",
        properties: {
            summary: { type: "string" },
            priority: { type: "string", description: "'low', 'medium', 'high', or 'critical'" },
            category: { type: "string", description: "e.g. 'network', 'hardware', 'software', 'access'" },
        },
        required: ["summary", "priority", "category"],
    },
    async handler({ summary, priority, category }) {
        const ticketId = "INC-" + (100000 + Math.floor(Math.random() * 900000));
        return JSON.stringify({
            ticket_id: ticketId,
            summary,
            priority,
            category,
            assigned_to: "IT Support Queue",
            estimated_response_hours: priority === "critical" ? 1 : priority === "high" ? 4 : 24,
            status: "open",
        });
    },
});

const escalateToSpecialist = defineChatSessionFunction({
    description: "Escalate an issue to a specialist team: 'security', 'networking', 'hardware', 'cloud', or 'accounts'.",
    params: {
        type: "object",
        properties: {
            team: { type: "string", description: "Team name: 'security', 'networking', 'hardware', 'cloud', 'accounts'" },
            reason: { type: "string", description: "Brief escalation reason" },
        },
        required: ["team", "reason"],
    },
    async handler({ team, reason }) {
        return JSON.stringify({
            escalated: true,
            team,
            reason,
            contact: `${team}-team@company.com`,
            response_sla_hours: 2,
        });
    },
});

const allFunctions = {
    checkNetworkConnectivity,
    checkVPNStatus,
    getSystemLogs,
    checkDiskSpace,
    getInstalledSoftware,
    getUserAccount,
    resetPassword,
    runDiagnostic,
    getHardwareInfo,
    restartService,
    createSupportTicket,
    escalateToSpecialist,
};

// ─── Exemplars ───────────────────────────────────────────────────────────────
// Short paraphrased intents per tool - deliberately different from the demo prompts
// so routing demonstrates semantic generalization rather than near-duplicate recall.

const EXEMPLARS = [
    { toolKey: "checkNetworkConnectivity", text: "browser not loading any sites, ethernet or wifi down" },
    { toolKey: "checkNetworkConnectivity", text: "ping test to verify DNS and packet loss to the gateway" },
    { toolKey: "checkNetworkConnectivity", text: "internet completely unresponsive on this workstation" },

    { toolKey: "checkVPNStatus", text: "remote tunnel to corporate network not establishing from outside office" },
    { toolKey: "checkVPNStatus", text: "VPN client shows disconnected even after entering valid credentials" },
    { toolKey: "checkVPNStatus", text: "AnyConnect auth keeps timing out when working remotely" },

    { toolKey: "getSystemLogs", text: "machine rebooting spontaneously, check windows event viewer errors" },
    { toolKey: "getSystemLogs", text: "application crash dump and kernel panic trace from yesterday" },
    { toolKey: "getSystemLogs", text: "blue screen stop code recorded in system event log" },

    { toolKey: "checkDiskSpace", text: "C drive almost full, showing low storage warning in taskbar" },
    { toolKey: "checkDiskSpace", text: "not enough free space to download and install a software update" },
    { toolKey: "checkDiskSpace", text: "disk capacity usage across all local volumes" },

    { toolKey: "getInstalledSoftware", text: "which Office version is on this PC, need version number" },
    { toolKey: "getInstalledSoftware", text: "check if a specific application is installed and its build" },
    { toolKey: "getInstalledSoftware", text: "software inventory audit listing all installed programs" },

    { toolKey: "getUserAccount", text: "account suspended or locked in Active Directory after failed logins" },
    { toolKey: "getUserAccount", text: "verify user permissions and group membership in the directory" },
    { toolKey: "getUserAccount", text: "sign-in blocked, need to confirm account standing" },

    { toolKey: "resetPassword", text: "forgot domain credentials and cannot log into Windows workstation" },
    { toolKey: "resetPassword", text: "send password reset link to user to restore access" },
    { toolKey: "resetPassword", text: "credentials expired or unknown, need to set a new passphrase" },

    { toolKey: "runDiagnostic", text: "full hardware test to scan memory modules for bit errors" },
    { toolKey: "runDiagnostic", text: "GPU driver keeps crashing, need diagnostic to confirm fault" },
    { toolKey: "runDiagnostic", text: "identify hardware faults on this machine with diagnostic tool" },

    { toolKey: "getHardwareInfo", text: "retrieve processor and RAM specs for a compatibility check" },
    { toolKey: "getHardwareInfo", text: "serial number and graphics card model for asset management" },
    { toolKey: "getHardwareInfo", text: "full hardware spec sheet of this laptop" },

    { toolKey: "restartService", text: "print spooler stuck in hung state, needs to be cycled" },
    { toolKey: "restartService", text: "Windows Update service is frozen and won't respond" },
    { toolKey: "restartService", text: "kill and restart a misbehaving background system daemon" },

    { toolKey: "createSupportTicket", text: "open a new helpdesk incident so this issue gets tracked" },
    { toolKey: "createSupportTicket", text: "log a ticket to queue this for formal resolution and follow-up" },
    { toolKey: "createSupportTicket", text: "create a formal IT request documenting the problem" },

    { toolKey: "escalateToSpecialist", text: "first-line support cannot fix this, needs specialist team" },
    { toolKey: "escalateToSpecialist", text: "hand off to security team for potential intrusion investigation" },
    { toolKey: "escalateToSpecialist", text: "escalate to networking engineer for deep infrastructure issue" },
];

// ─── Demo prompts (phrased unlike any EXEMPLAR line) ─────────────────────────

/** Single intent: VPN failure */
const DEMO_VPN =
    "Working from the café today and the Cisco client just spins on 'Connecting…' then times out. " +
    "Office Wi-Fi was fine yesterday.";

/** Single intent: locked account */
const DEMO_LOCKED =
    "I typed my Windows password incorrectly a few too many times this morning. " +
    "Now it refuses to accept any credentials at all.";

/** Dual intent: crashing machine needs both logs and hardware diagnostic */
const DEMO_CRASHING_PC =
    "Laptop crashed twice today with a flash of blue then auto-restart. " +
    "I want to see what errors were recorded AND run a hardware check to rule out a physical fault.";

/** Dual intent: disk full + software version - balanced so k=2 can retrieve both */
const DEMO_DISK_AND_SOFTWARE =
    "The quarterly security patch installer fails immediately with an insufficient-space error. " +
    "On a separate note, can you confirm which version of Microsoft Office I currently have installed?";

/**
 * Dual intent: VPN + locked account.
 * Day-heavy phrasing toward VPN so k=1 only surfaces checkVPNStatus (recall failure demo).
 */
const DEMO_VPN_AND_LOCKED_K1 =
    "My VPN keeps rejecting my authentication since early this morning - I desperately need that tunnel back up for a call. " +
    "Also, separately, Windows won't accept my login password anymore.";

// ─── Initialise models ───────────────────────────────────────────────────────

const llama = await getLlama({ debug });

const chatModel = await llama.loadModel({ modelPath: CHAT_MODEL_PATH });
const chatContext = await chatModel.createContext({ contextSize: 4096 });
const session = new LlamaChatSession({
    contextSequence: chatContext.getSequence(),
    chatWrapper: new QwenChatWrapper({ thoughts: "discourage" }),
    systemPrompt: `You are a concise IT helpdesk assistant. When a tool can diagnose or resolve the issue, call it immediately.
Report tool results clearly in 2-3 sentences and recommend the next step.
If a tool needed to answer part of the request is not available, say so in one sentence without guessing.
Do not invent diagnostic results.`,
});

const embedModel = await llama.loadModel({ modelPath: EMBED_MODEL_PATH });
const embedContext = await embedModel.createEmbeddingContext();

// ─── Pre-compute exemplar embeddings ─────────────────────────────────────────

console.log(`Embedding ${EXEMPLARS.length} exemplars with ${EMBED_MODEL_PATH.split("/").pop()} …`);
/** @type {ExemplarRow[]} */
const exemplarRows = [];
for (const { toolKey, text } of EXEMPLARS) {
    const embedding = await embedContext.getEmbeddingFor(text);
    exemplarRows.push({ toolKey, exemplarText: text, embedding });
}
const allKeys = Object.keys(allFunctions);
console.log(`Indexed ${exemplarRows.length} exemplars across ${allKeys.length} tools.\n`);

// ─── Routing runner ───────────────────────────────────────────────────────────

/**
 * @param {string} userPrompt
 * @param {{ retrievalK: number, alwaysInclude?: ReadonlySet<string>, label: string }} opts
 */
async function runWithRouting(userPrompt, opts) {
    const { retrievalK, alwaysInclude = new Set(), label } = opts;
    console.log("─".repeat(72));
    console.log(`Case: ${label}`);
    console.log(`User: ${userPrompt}\n`);

    const queryEmbedding = await embedContext.getEmbeddingFor(userPrompt);
    const scores = scoreTools(queryEmbedding, exemplarRows);
    const selectedKeys = selectToolKeys(scores, retrievalK, alwaysInclude);

    // Print similarity table sorted by score (top 6 shown)
    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    console.log("Similarity scores:");
    for (const [key, sim] of ranked.slice(0, 6)) {
        const tick = selectedKeys.has(key) ? "✓" : " ";
        const bar = "█".repeat(Math.round(sim * 24)).padEnd(24);
        const alwaysMark = alwaysInclude.has(key) ? " [pinned]" : "";
        console.log(`  [${tick}] ${key.padEnd(28)} ${sim.toFixed(4)}  ${bar}${alwaysMark}`);
    }
    if (ranked.length > 6) console.log(`       … (${ranked.length - 6} more tools not shown)`);

    const selectedList = [...selectedKeys];
    console.log(
        `\n[routing] k=${retrievalK}  alwaysInclude=[${[...alwaysInclude].join(", ") || "none"}]` +
            `  →  ${selectedList.length}/${allKeys.length} tools exposed: ${selectedList.join(", ")}\n`
    );

    const functions = pickFunctions(selectedKeys, allFunctions);
    const answer = await session.prompt(userPrompt, { functions, maxTokens: 1200, temperature: 0 });
    const trimmed = answer.trim();
    console.log("ASSISTANT:", trimmed || "(empty - check QwenChatWrapper thoughts setting)");
    console.log();

    session.resetChatHistory();
}

// ─── Demo cases ───────────────────────────────────────────────────────────────

await runWithRouting(DEMO_VPN, {
    retrievalK: 1,
    label: "Single intent - VPN failure (k=1 exposes only best-match tool)",
});

await runWithRouting(DEMO_LOCKED, {
    retrievalK: 1,
    label: "Single intent - locked account (k=1, different semantic cluster)",
});

await runWithRouting(DEMO_CRASHING_PC, {
    retrievalK: 2,
    label: "Dual intent - crashing PC: k=2 retrieves logs + hardware diagnostic",
});

await runWithRouting(DEMO_DISK_AND_SOFTWARE, {
    retrievalK: 2,
    label: "Dual intent - disk full + software version: k=2 retrieves both clusters",
});

await runWithRouting(DEMO_VPN_AND_LOCKED_K1, {
    retrievalK: 1,
    label: "Dual intent - VPN + locked account, k=1: recall failure (account tool missing)",
});

await runWithRouting(DEMO_VPN_AND_LOCKED_K1, {
    retrievalK: 1,
    alwaysInclude: new Set(["getUserAccount"]),
    label: "Dual intent - same query, k=1 + pinned getUserAccount: both intents covered",
});

// ─── Disposal ─────────────────────────────────────────────────────────────────

session.dispose();
chatContext.dispose();
chatModel.dispose();
embedContext.dispose();
embedModel.dispose();
llama.dispose();
