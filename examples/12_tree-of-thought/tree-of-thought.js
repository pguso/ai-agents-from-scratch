/**
 * Example 12: Tree of Thought (ToT) — Motivation analysis
 *
 * Run:
 *   node examples/12_tree-of-thought/tree-of-thought.js
 */

import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";
import { JsonParser } from "../../helper/json-parser.js";
import { writeToTMotivationVisualization } from "../../helper/visualization-writers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const HYPOTHESIS_TYPES = [
    "Avoidance motivation (escaping something negative)",
    "Burnout and emotional exhaustion",
    "Growth motivation (moving toward something better)",
    "External social pressure (family, partner, society)"
];

const BEHAVIOR_INPUT =
    "A 34-year-old woman resigns from a secure office job, withdraws from friends, and starts taking long solo walks daily without explaining why.";

const systemPrompt = `You are a careful psychology analysis assistant.
You always return valid JSON only, matching the provided schema.
No markdown, no code fences, no text outside JSON.`;

const hypothesisSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        argument: { type: "string" },
        signals: { type: "array", items: { type: "string" } },
        counter_evidence: { type: "array", items: { type: "string" } }
    },
    required: ["name", "argument", "signals", "counter_evidence"]
};

const scoreSchema = {
    type: "object",
    properties: {
        explanatory_power: { type: "number" },
        plausibility: { type: "number" },
        falsifiability: { type: "number" },
        total: { type: "number" },
        reasoning: { type: "string" },
        blind_spot: { type: "string" }
    },
    required: ["explanatory_power", "plausibility", "falsifiability", "total", "reasoning", "blind_spot"]
};

const rankingSchema = {
    type: "object",
    properties: {
        ranking: {
            type: "array",
            items: { type: "integer" },
            minItems: 4,
            maxItems: 4
        },
        rationale: { type: "string" }
    },
    required: ["ranking", "rationale"]
};

const analysisSchema = {
    type: "object",
    properties: {
        summary: { type: "string" },
        psychological_background: { type: "string" },
        recommendation: { type: "string" },
        open_questions: { type: "array", items: { type: "string" } }
    },
    required: ["summary", "psychological_background", "recommendation", "open_questions"]
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
        maxTokens: 1200,
        temperature: 0.2
    });
    return JsonParser.parse(raw, { debug, expectObject: true, repairAttempts: true });
}

async function developHypothesis(behavior, hypothesisType) {
    return promptJson(
        hypothesisSchema,
        `You are an experienced psychologist. Analyze this behavior strictly through one lens:
"${hypothesisType}".

Behavior:
"${behavior}"

Develop one coherent explanation.
Think only in this direction and ignore other possible explanations.

Return JSON:
{
  "name": "${hypothesisType}",
  "argument": "2-3 sentence psychological explanation",
  "signals": ["Signal that supports it", "Signal 2", "Signal 3"],
  "counter_evidence": ["What weakens this hypothesis 1", "What weakens this hypothesis 2"]
}`
    );
}

async function scoreHypothesis(behavior, hypothesis) {
    const scored = await promptJson(
        scoreSchema,
        `You are a critical psychologist. Score this hypothesis.

Behavior:
"${behavior}"

Hypothesis argument:
"${hypothesis.argument}"

Supporting signals: ${hypothesis.signals.join(", ")}
Counter evidence: ${hypothesis.counter_evidence.join(", ")}

Scoring criteria:
- explanatory_power (1-10): how much behavior this explains
- plausibility (1-10): how psychologically grounded it is
- falsifiability (1-10): how testable/challengeable it is
Use decimal scores (one decimal place) for all criteria and total.
Compute total with this formula:
total = 0.45 * explanatory_power + 0.35 * plausibility + 0.20 * falsifiability
Use score variety where justified. Avoid giving identical totals unless two hypotheses are truly indistinguishable.

Return JSON:
{
  "explanatory_power": 7.4,
  "plausibility": 8.1,
  "falsifiability": 6.5,
  "total": 7.0,
  "reasoning": "why this score",
  "blind_spot": "what this hypothesis fundamentally cannot explain"
}`
    );

    return {
        hypothesis,
        score: Number(scored.total),
        reasoning: scored.reasoning,
        blindSpot: scored.blind_spot,
        details: {
            explanatory_power: Number(scored.explanatory_power),
            plausibility: Number(scored.plausibility),
            falsifiability: Number(scored.falsifiability)
        }
    };
}

function pruneHypotheses(scoredHypotheses) {
    const sorted = [...scoredHypotheses].sort((a, b) => b.score - a.score);
    return { winner: sorted[0], discarded: sorted.slice(1), sorted };
}

async function rerankHypotheses(behavior, scoredHypotheses) {
    const indexed = scoredHypotheses.map((s, i) => ({
        idx: i,
        name: s.hypothesis.name,
        argument: s.hypothesis.argument,
        score: s.score
    }));
    const payload = indexed
        .map((x) => `#${x.idx + 1}: ${x.name}\nscore=${x.score}\nargument=${x.argument}`)
        .join("\n\n");

    const ranked = await promptJson(
        rankingSchema,
        `Rank these hypotheses from strongest to weakest.
You must return a strict ranking with no ties.

Behavior:
"${behavior}"

Hypotheses:
${payload}

Return JSON:
{
  "ranking": [2, 1, 4, 3],
  "rationale": "short reason"
}`
    );

    const order = Array.isArray(ranked.ranking) ? ranked.ranking : [];
    const valid = order.length === scoredHypotheses.length && new Set(order).size === scoredHypotheses.length;
    if (!valid) return scoredHypotheses;

    const base = 8.8;
    const step = 0.7;
    const adjusted = [...scoredHypotheses];
    order.forEach((rankedId, pos) => {
        const idx = Number(rankedId) - 1;
        if (idx >= 0 && idx < adjusted.length) adjusted[idx].score = Number((base - pos * step).toFixed(1));
    });
    return adjusted;
}

async function createConclusion(behavior, winner) {
    return promptJson(
        analysisSchema,
        `You are an experienced psychologist writing a case analysis.
Base this analysis only on the strongest hypothesis.

Behavior:
"${behavior}"

Leading hypothesis:
"${winner.hypothesis.name}"

Core argument:
"${winner.hypothesis.argument}"

Strengths:
${winner.hypothesis.signals.join(", ")}

Return JSON:
{
  "summary": "2-3 sentences: most likely motivation",
  "psychological_background": "3-4 sentences: deeper mechanism",
  "recommendation": "2-3 sentences: what could help this person now",
  "open_questions": ["Open question 1", "Open question 2", "Open question 3"]
}`
    );
}


async function runTreeOfThoughtMotivationAnalysis(behavior) {
    console.log("\nTree of Thought: Motivation analysis of a person");
    console.log(`Behavior: "${behavior}"\n`);

    console.log("Phase 1: Branch - develop 4 competing hypotheses");
    const hypotheses = [];
    for (const type of HYPOTHESIS_TYPES) {
        process.stdout.write(`  Developing "${type.split("(")[0].trim()}" ... `);
        const h = await developHypothesis(behavior, type);
        hypotheses.push(h);
        console.log("done");
        console.log(`    Argument: "${h.argument.slice(0, 85)}..."`);
        console.log(`    Signal: ${h.signals[0] ?? "n/a"}`);
    }

    console.log("\nPhase 2: Score - evaluate each hypothesis independently");
    const scored = [];
    for (const h of hypotheses) {
        process.stdout.write(`  Scoring "${h.name.split("(")[0].trim()}" ... `);
        const s = await scoreHypothesis(behavior, h);
        scored.push(s);
        console.log("captured");
    }
    const reranked = await rerankHypotheses(behavior, scored);
    scored.splice(0, scored.length, ...reranked);
    console.log("  Calibrated scores (used for pruning):");
    [...scored]
        .sort((a, b) => b.score - a.score)
        .forEach((s) => {
            console.log(`    - ${s.hypothesis.name.split("(")[0].trim()}: ${s.score}/10`);
            console.log(
                `      criteria: explanatory_power=${s.details.explanatory_power.toFixed(1)} | plausibility=${s.details.plausibility.toFixed(1)} | falsifiability=${s.details.falsifiability.toFixed(1)}`
            );
            console.log(`      blind spot: "${s.blindSpot.slice(0, 95)}..."`);
        });

    console.log("\nPhase 3: Prune - keep winner, drop the rest");
    const { winner, discarded } = pruneHypotheses(scored);
    console.log(`  Winner: "${winner.hypothesis.name}" (score: ${winner.score})`);
    discarded.forEach((d) => {
        console.log(`  Discarded: "${d.hypothesis.name}" (score: ${d.score})`);
        console.log(`    Lost perspective: "${d.blindSpot.slice(0, 100)}..."`);
    });

    console.log("\nPhase 4: Conclusion - analyze from winner only");
    const analysis = await createConclusion(behavior, winner);

    console.log("\n" + "=".repeat(64));
    console.log("MOTIVATION ANALYSIS (Tree of Thought)");
    console.log("=".repeat(64));
    console.log(`\nLeading hypothesis: "${winner.hypothesis.name}"`);
    console.log(`\nSummary:\n${analysis.summary}`);
    console.log(`\nPsychological background:\n${analysis.psychological_background}`);
    console.log(`\nRecommendation:\n${analysis.recommendation}`);
    console.log("\nOpen questions (not resolved by this ToT run):");
    (analysis.open_questions || []).forEach((q) => console.log(`  - ${q}`));

    console.log("\n" + "-".repeat(64));
    console.log("WHAT TOT LOST IN THIS RUN");
    console.log("-".repeat(64));
    discarded.forEach((d) => {
        console.log(`\nDiscarded "${d.hypothesis.name.split("(")[0].trim()}" (score: ${d.score})`);
        console.log(`  Argument (unused): "${d.hypothesis.argument.slice(0, 90)}..."`);
        console.log(`  Could have corrected winner via: "${d.blindSpot.slice(0, 90)}..."`);
    });

    writeToTMotivationVisualization(__dirname, {
        scored,
        winnerName: winner.hypothesis.name,
        analysis
    });

    return { behavior, winner, discarded, analysis };
}

await runTreeOfThoughtMotivationAnalysis(BEHAVIOR_INPUT);

session.dispose();
context.dispose();
model.dispose();
llama.dispose();
