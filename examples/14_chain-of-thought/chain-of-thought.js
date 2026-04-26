/**
 * Example 14: Chain of Thought (CoT) — Return decision
 *
 * Run:
 *   node examples/14_chain-of-thought/chain-of-thought.js
 */

import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";
import { JsonParser } from "../../helper/json-parser.js";
import { writeCoTReturnVisualization } from "../../helper/visualization-writers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const RETURN_CASE = {
    request_id: "RET-2026-0414",
    customer_id: "CUST-90871",
    product: "Wireless Noise Cancelling Headphones X2",
    order_date: "2026-03-29",
    delivery_date: "2026-04-01",
    request_date: "2026-04-24",
    claimed_reason: "Right ear cup has intermittent sound dropouts",
    claim_timing_days_after_delivery: 23,
    order_value_eur: 189.0,
    return_count_last_12_months: 3,
    previous_high_value_returns: 2,
    account_age_months: 46,
    payment_method: "credit_card_verified",
    shipping_address_matches_payment: true,
    diagnostic_log_uploaded: true,
    photo_evidence_uploaded: false,
    replacement_requested: true
};

const RETURN_POLICY = {
    return_window_days: 30,
    max_high_value_returns_12m_before_manual_review: 2,
    mandatory_manual_review_amount_eur: 250,
    allowed_outcomes: ["approve", "reject", "manual_review"]
};

const systemPrompt = `You are a careful e-commerce risk analyst.
You must follow the requested phase exactly and return valid JSON only.
No markdown, no code fences, no text outside JSON.`;

const factsSchema = {
    type: "object",
    properties: {
        extracted_facts: {
            type: "array",
            items: { type: "string" },
            minItems: 6
        },
        missing_information: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["extracted_facts", "missing_information"]
};

const redFlagsSchema = {
    type: "object",
    properties: {
        checkpoints: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    check: { type: "string" },
                    status: { type: "string", enum: ["present", "not_present", "unclear"] },
                    evidence: { type: "string" }
                },
                required: ["check", "status", "evidence"]
            },
            minItems: 5
        },
        fraud_score: { type: "number" },
        fraud_rationale: { type: "string" }
    },
    required: ["checkpoints", "fraud_score", "fraud_rationale"]
};

const legitimacySchema = {
    type: "object",
    properties: {
        customer_supporting_points: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    point: { type: "string" },
                    strength: { type: "string", enum: ["high", "medium", "low"] },
                    evidence: { type: "string" }
                },
                required: ["point", "strength", "evidence"]
            },
            minItems: 4
        },
        legitimacy_score: { type: "number" },
        legitimacy_rationale: { type: "string" }
    },
    required: ["customer_supporting_points", "legitimacy_score", "legitimacy_rationale"]
};

const policySchema = {
    type: "object",
    properties: {
        policy_checks: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    rule: { type: "string" },
                    status: { type: "string", enum: ["pass", "fail", "manual_review_trigger"] },
                    reason: { type: "string" }
                },
                required: ["rule", "status", "reason"]
            },
            minItems: 4
        },
        policy_outcome: {
            type: "string",
            enum: ["approve", "reject", "manual_review"]
        }
    },
    required: ["policy_checks", "policy_outcome"]
};

const decisionSchema = {
    type: "object",
    properties: {
        final_decision: {
            type: "string",
            enum: ["approve", "reject", "manual_review"]
        },
        confidence: { type: "number" },
        decision_reasoning: { type: "string" },
        customer_message: { type: "string" },
        internal_note: { type: "string" }
    },
    required: ["final_decision", "confidence", "decision_reasoning", "customer_message", "internal_note"]
};

const llama = await getLlama({ debug });
const model = await llama.loadModel({
    modelPath: path.join(__dirname, "..", "..", "models", "Qwen3-1.7B-Q8_0.gguf")
});
const context = await model.createContext({ contextSize: 8192 });
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt
});

async function promptJson(schema, userText) {
    session.resetChatHistory();
    const grammar = await llama.createGrammarForJsonSchema(schema);
    const raw = await session.prompt(userText, {
        grammar,
        maxTokens: 1400,
        temperature: 0.2
    });
    return JsonParser.parse(raw, { debug, expectObject: true, repairAttempts: true });
}

async function extractFacts(returnCase) {
    return promptJson(
        factsSchema,
        `Phase 1 of 5: FACTS ONLY.
Extract facts from the return request without evaluation, suspicion, or judgment.
Do not infer intent. Do not score. Just capture what is explicitly known.

Return request JSON:
${JSON.stringify(returnCase, null, 2)}

Return JSON:
{
  "extracted_facts": ["fact 1", "fact 2", "fact 3"],
  "missing_information": ["missing point 1", "missing point 2"]
}`
    );
}

async function screenRedFlags(returnCase, facts) {
    return promptJson(
        redFlagsSchema,
        `Phase 2 of 5: RED FLAG SCREENING.
Evaluate potential fraud indicators one by one.
Be explicit for each checkpoint whether it is present, not present, or unclear.

Use these checkpoints:
1) Frequent recent return behavior
2) High-value return pattern
3) Inconsistent payment/shipping identity
4) Weak or missing defect evidence
5) Timing pattern that looks strategic
6) Account behavior anomaly

Known case data:
${JSON.stringify(returnCase, null, 2)}

Facts from phase 1:
${JSON.stringify(facts.extracted_facts, null, 2)}

Return JSON:
{
  "checkpoints": [
    { "check": "Frequent recent return behavior", "status": "present", "evidence": "..." }
  ],
  "fraud_score": 6.0,
  "fraud_rationale": "..."
}`
    );
}

async function assessLegitimacy(returnCase, facts) {
    return promptJson(
        legitimacySchema,
        `Phase 3 of 5: LEGITIMACY VIEW.
Now build the customer-side case.
List reasons why this may be a legitimate return.
Do not reference fraud score. Focus on fairness and plausible product failure.

Known case data:
${JSON.stringify(returnCase, null, 2)}

Facts from phase 1:
${JSON.stringify(facts.extracted_facts, null, 2)}

Return JSON:
{
  "customer_supporting_points": [
    { "point": "point text", "strength": "high", "evidence": "..." }
  ],
  "legitimacy_score": 7.0,
  "legitimacy_rationale": "..."
}`
    );
}

async function checkPolicy(returnCase, policy, redFlags, legitimacy) {
    return promptJson(
        policySchema,
        `Phase 4 of 5: POLICY CHECK.
Apply policy strictly. Do not invent rules.
Use both risk and legitimacy context, but final status must be policy-compliant.

Policy JSON:
${JSON.stringify(policy, null, 2)}

Case JSON:
${JSON.stringify(returnCase, null, 2)}

Fraud score: ${redFlags.fraud_score}
Legitimacy score: ${legitimacy.legitimacy_score}

Return JSON:
{
  "policy_checks": [
    { "rule": "Return window <= 30 days", "status": "pass", "reason": "..." }
  ],
  "policy_outcome": "manual_review"
}`
    );
}

async function makeDecision(returnCase, phase1Facts, redFlags, legitimacy, policyResult) {
    return promptJson(
        decisionSchema,
        `Phase 5 of 5: FINAL DECISION.
You can decide only now. Use all prior phases.
Explain trade-offs clearly. If conflict exists (e.g., fraud 6/10 vs legitimacy 7/10), show how policy resolves it.

Case:
${JSON.stringify(returnCase, null, 2)}

Phase 1 facts:
${JSON.stringify(phase1Facts, null, 2)}

Phase 2 red flags:
${JSON.stringify(redFlags, null, 2)}

Phase 3 legitimacy:
${JSON.stringify(legitimacy, null, 2)}

Phase 4 policy:
${JSON.stringify(policyResult, null, 2)}

Return JSON:
{
  "final_decision": "manual_review",
  "confidence": 0.79,
  "decision_reasoning": "...",
  "customer_message": "...",
  "internal_note": "..."
}`
    );
}

async function runChainOfThoughtReturnDecision(returnCase, policy) {
    console.log("\nChain of Thought: Return decision (fraud vs legitimate)");
    console.log(`Case ID: ${returnCase.request_id}`);
    console.log(`Reason: "${returnCase.claimed_reason}"\n`);

    console.log("Phase 1: Facts - extract only, no judgment");
    const facts = await extractFacts(returnCase);
    (facts.extracted_facts || []).slice(0, 6).forEach((fact) => {
        console.log(`  - ${fact}`);
    });

    console.log("\nPhase 2: Red Flags - explicit fraud screening");
    const redFlags = await screenRedFlags(returnCase, facts);
    console.log(`  Fraud score: ${Number(redFlags.fraud_score).toFixed(1)}/10`);
    (redFlags.checkpoints || []).slice(0, 6).forEach((cp) => {
        console.log(`  - ${cp.check}: ${cp.status}`);
    });

    console.log("\nPhase 3: Legitimacy - customer-side balancing");
    const legitimacy = await assessLegitimacy(returnCase, facts);
    console.log(`  Legitimacy score: ${Number(legitimacy.legitimacy_score).toFixed(1)}/10`);
    (legitimacy.customer_supporting_points || []).slice(0, 4).forEach((p) => {
        console.log(`  - ${p.point} (${p.strength})`);
    });

    console.log("\nPhase 4: Policy Check - rule-constrained outcome");
    const policyResult = await checkPolicy(returnCase, policy, redFlags, legitimacy);
    console.log(`  Policy outcome: ${policyResult.policy_outcome}`);
    (policyResult.policy_checks || []).slice(0, 4).forEach((r) => {
        console.log(`  - ${r.rule}: ${r.status}`);
    });

    console.log("\nPhase 5: Decision - final judgment with full chain");
    const decision = await makeDecision(returnCase, facts, redFlags, legitimacy, policyResult);

    console.log("\n" + "=".repeat(72));
    console.log("RETURN DECISION (Chain of Thought)");
    console.log("=".repeat(72));
    console.log(`\nFraud score:      ${Number(redFlags.fraud_score).toFixed(1)}/10`);
    console.log(`Legitimacy score: ${Number(legitimacy.legitimacy_score).toFixed(1)}/10`);
    console.log(`Policy outcome:   ${policyResult.policy_outcome}`);
    console.log(`Final decision:   ${decision.final_decision}`);
    console.log(`Confidence:       ${Number(decision.confidence).toFixed(2)}`);

    console.log(`\nDecision reasoning:\n${decision.decision_reasoning}`);
    console.log(`\nCustomer message:\n${decision.customer_message}`);
    console.log(`\nInternal note:\n${decision.internal_note}`);

    writeCoTReturnVisualization(__dirname, {
        returnCase,
        policy,
        facts,
        redFlags,
        legitimacy,
        policyResult,
        decision
    });

    return { returnCase, policy, facts, redFlags, legitimacy, policyResult, decision };
}

await runChainOfThoughtReturnDecision(RETURN_CASE, RETURN_POLICY);

session.dispose();
context.dispose();
model.dispose();
llama.dispose();
