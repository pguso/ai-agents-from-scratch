# Code explanation: `chain-of-thought.js`

This walkthrough maps each CoT phase to the actual functions in the file.

## Run

```bash
node examples/14_chain-of-thought/chain-of-thought.js
```

---

## 1) Setup: model, input case, and schemas

At the top of the file:

- `RETURN_CASE` defines the customer request.
- `RETURN_POLICY` defines hard business constraints.
- `factsSchema`, `redFlagsSchema`, `legitimacySchema`, `policySchema`, `decisionSchema` define the JSON contract for each phase.
- `promptJson(schema, userText)` is the shared utility that:
  - resets chat history,
  - enforces schema grammar,
  - parses and repairs JSON safely.

This gives each phase function a strict output shape.

```js
const RETURN_CASE = {
    request_id: "RET-2026-0414",
    claimed_reason: "Right ear cup has intermittent sound dropouts",
    claim_timing_days_after_delivery: 23,
    order_value_eur: 189.0
    // ...
};

const RETURN_POLICY = {
    return_window_days: 30,
    max_high_value_returns_12m_before_manual_review: 2,
    mandatory_manual_review_amount_eur: 250
};

async function promptJson(schema, userText) {
    session.resetChatHistory();
    const grammar = await llama.createGrammarForJsonSchema(schema);
    const raw = await session.prompt(userText, { grammar, maxTokens: 1400, temperature: 0.2 });
    return JsonParser.parse(raw, { debug, expectObject: true, repairAttempts: true });
}
```

---

## 2) Phase 1 (Facts): `extractFacts()`

`extractFacts(returnCase)` asks for:

- only explicit facts,
- no scoring,
- no judgment.

It returns:

- `extracted_facts`
- `missing_information`

This protects against early bias before risk reasoning starts.

```js
async function extractFacts(returnCase) {
    return promptJson(
        factsSchema,
        `Phase 1 of 5: FACTS ONLY.
Extract facts from the return request without evaluation, suspicion, or judgment.
Do not infer intent. Do not score. Just capture what is explicitly known.

Return request JSON:
${JSON.stringify(returnCase, null, 2)}`
    );
}
```

---

## 3) Phase 2 (Red Flags): `screenRedFlags()`

`screenRedFlags(returnCase, facts)` performs explicit fraud screening with fixed checkpoints.

Output:

- `checkpoints[]` with `present/not_present/unclear`
- `fraud_score`
- `fraud_rationale`

The important part is checklist coverage, not just one final score.

```js
async function screenRedFlags(returnCase, facts) {
    return promptJson(
        redFlagsSchema,
        `Phase 2 of 5: RED FLAG SCREENING.
Evaluate potential fraud indicators one by one.

Use these checkpoints:
1) Frequent recent return behavior
2) High-value return pattern
3) Inconsistent payment/shipping identity
4) Weak or missing defect evidence
5) Timing pattern that looks strategic
6) Account behavior anomaly`
    );
}
```

---

## 4) Phase 3 (Legitimacy): `assessLegitimacy()`

`assessLegitimacy(returnCase, facts)` builds the customer-side argument:

- plausible defect indicators,
- fairness/context factors,
- supporting evidence quality.

Output:

- `customer_supporting_points[]`
- `legitimacy_score`
- `legitimacy_rationale`

Without this phase, risk logic tends to dominate every borderline case.

```js
async function assessLegitimacy(returnCase, facts) {
    return promptJson(
        legitimacySchema,
        `Phase 3 of 5: LEGITIMACY VIEW.
Now build the customer-side case.
List reasons why this may be a legitimate return.
Do not reference fraud score. Focus on fairness and plausible product failure.`
    );
}
```

---

## 5) Phase 4 (Policy): `checkPolicy()`

`checkPolicy(returnCase, policy, redFlags, legitimacy)` applies hard rules:

- return window
- value thresholds
- return-history triggers

Output:

- per-rule statuses in `policy_checks[]`
- `policy_outcome` (`approve`, `reject`, `manual_review`)

This is the governance gate between analysis and action.

```js
async function checkPolicy(returnCase, policy, redFlags, legitimacy) {
    return promptJson(
        policySchema,
        `Phase 4 of 5: POLICY CHECK.
Apply policy strictly. Do not invent rules.

Policy JSON:
${JSON.stringify(policy, null, 2)}

Fraud score: ${redFlags.fraud_score}
Legitimacy score: ${legitimacy.legitimacy_score}`
    );
}
```

---

## 6) Phase 5 (Decision): `makeDecision()`

`makeDecision(...)` can decide only after all prior phases.

Output:

- `final_decision`
- `confidence`
- `decision_reasoning`
- `customer_message`
- `internal_note`

The prompt explicitly references conflict handling (for example fraud 6/10 vs legitimacy 7/10), so the result must explain how policy resolves the tension.

```js
async function makeDecision(returnCase, phase1Facts, redFlags, legitimacy, policyResult) {
    return promptJson(
        decisionSchema,
        `Phase 5 of 5: FINAL DECISION.
You can decide only now. Use all prior phases.
Explain trade-offs clearly. If conflict exists (e.g., fraud 6/10 vs legitimacy 7/10),
show how policy resolves it.`
    );
}
```

---

## 7) Orchestration flow: `runChainOfThoughtReturnDecision()`

The main controller executes phases in strict order:

1. facts
2. red flags
3. legitimacy
4. policy check
5. final decision

Then it prints a compact report and writes a browser visualization via:

- `writeCoTReturnVisualization(...)`

This keeps the core file focused on CoT logic.

```js
async function runChainOfThoughtReturnDecision(returnCase, policy) {
    const facts = await extractFacts(returnCase);
    const redFlags = await screenRedFlags(returnCase, facts);
    const legitimacy = await assessLegitimacy(returnCase, facts);
    const policyResult = await checkPolicy(returnCase, policy, redFlags, legitimacy);
    const decision = await makeDecision(returnCase, facts, redFlags, legitimacy, policyResult);

    writeCoTReturnVisualization(__dirname, {
        returnCase, policy, facts, redFlags, legitimacy, policyResult, decision
    });
}
```

---

## 8) Adapting the implementation per model class

The current code uses `Qwen3-1.7B-Q8_0.gguf`, which can run as both a reasoning and a non-reasoning model. The 5-phase scaffolding is designed to work for either class - but the way you tune it differs.

For the conceptual side of this distinction, see the "CoT with reasoning vs non-reasoning LLMs" section in [CONCEPT.md](CONCEPT.md).

### What the current code assumes

- A hybrid model that may or may not reason internally.
- Per-phase JSON schemas via `promptJson(...)`.
- Low `temperature` (0.2) and a generous `maxTokens` budget per phase.
- One isolated chat history per phase via `session.resetChatHistory()`.

This is intentionally a middle-ground configuration so the example works without forcing readers to download a specific model.

### Tuning for non-reasoning models

If you swap in a base/chat model without internal reasoning (Llama-3 chat, Phi, Mistral-instruct, Qwen3 with `thoughts: "discourage"`):

```js
const raw = await session.prompt(userText, {
    grammar,
    maxTokens: 1800,
    temperature: 0.1
});
```

- Lower `temperature` further (0.05 - 0.15). Borderline cases regress badly with creative sampling.
- Increase `maxTokens` per phase. The model often needs room to "talk to itself" inside the JSON before it commits to scores.
- Keep schemas strict. Avoid wide free-form fields; replace them with enums, fixed-length arrays, or short bounded strings.
- Add explicit examples to phase prompts ("Example checkpoint: { check, status, evidence }"). Non-reasoning models latch on to format examples much faster than abstract specs.

### Tuning for reasoning models

If you swap in a reasoning-tuned model (o3, DeepSeek-R1, Qwen3 with `thoughts: "auto"`, Claude Extended Thinking via API):

```js
const raw = await session.prompt(userText, {
    grammar,
    maxTokens: 900,
    temperature: 0.3
});
```

- Shorten phase prompts. The model already reasons internally; verbose instructions add noise.
- Lower `maxTokens` for purely structural phases (Facts, Policy Check). They do not need long thinking budgets.
- Keep schemas as a **contract**, not as a reasoning crutch. Their main job here is downstream interoperability.
- If the runtime supports it, log the internal reasoning trace for debugging only - never as part of the audit trail.

### Qwen3 specifics

For `node-llama-cpp`, the clean switch for Qwen thought behavior is the wrapper option:

```js
import { QwenChatWrapper } from "node-llama-cpp";

const reasoningWrapper = new QwenChatWrapper({
    thoughts: "auto",
    keepOnlyLastThought: true
});

const nonReasoningWrapper = new QwenChatWrapper({
    thoughts: "discourage"
});
```

Then create the chat session with the wrapper you want for that phase/run:

```js
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
    chatWrapper: reasoningWrapper // or nonReasoningWrapper
});
```

A useful pattern is mixing wrapper modes per phase:

- `thoughts: "discourage"` on Phase 1 (Facts) and Phase 4 (Policy Check) - mechanical work.
- `thoughts: "auto"` on Phase 2 (Red Flags), Phase 3 (Legitimacy), and Phase 5 (Decision) - judgment work.

This keeps total latency low while preserving reasoning where it matters.

### Per-phase callouts

- **Phase 1 (Facts)** - non-reasoning models often hallucinate fact entries that look plausible but were never in the input. Tighten the schema (`minItems`, enum-like fields) and instruct explicitly: "Do not infer."
- **Phase 2 (Red Flags)** - reasoning models tend to over-suspect when given a fraud framing. Anchor them with the fixed checkpoint list rather than open-ended red flag generation.
- **Phase 3 (Legitimacy)** - this phase exists exactly to counter Phase 2's bias. Do not collapse it into Phase 2 to save tokens, regardless of model class. It is a structural counterweight.
- **Phase 4 (Policy Check)** - both classes benefit from injecting the policy as inline JSON rather than describing it in prose. Reduces drift and silent rule invention.
- **Phase 5 (Decision)** - confidence calibration differs sharply between classes. A `confidence: 0.79` from a reasoning model is not directly comparable to `0.79` from a base model. Treat confidence as model-internal; route on `final_decision` and `policy_outcome` instead.

---

## Suggested code-reading order

1. `promptJson`
2. `extractFacts`
3. `screenRedFlags`
4. `assessLegitimacy`
5. `checkPolicy`
6. `makeDecision`
7. `runChainOfThoughtReturnDecision`

That sequence mirrors runtime and makes the example easy to reason about.
