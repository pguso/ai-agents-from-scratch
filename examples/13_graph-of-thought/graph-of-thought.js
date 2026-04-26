/**
 * Example 13: Graph of Thought (GoT) — Motivation analysis
 *
 * Run:
 *   node examples/13_graph-of-thought/graph-of-thought.js
 */

import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";
import { JsonParser } from "../../helper/json-parser.js";
import { writeGoTMotivationVisualization } from "../../helper/visualization-writers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

class ThoughtGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.nextId = 1;
    }

    addNode(type, content, meta = {}, parentIds = []) {
        const id = `n${this.nextId++}`;
        this.nodes.set(id, { id, type, content, meta, score: 0 });
        this.edges.set(id, parentIds);
        return id;
    }

    get(id) {
        return this.nodes.get(id);
    }

    parents(id) {
        return (this.edges.get(id) || []).map((p) => this.nodes.get(p));
    }

    byType(type) {
        return [...this.nodes.values()].filter((n) => n.type === type);
    }

    printGraph() {
        console.log("\nGraph structure (all nodes and edges):");
        for (const [id, node] of this.nodes) {
            const pIds = this.edges.get(id) || [];
            const arrow = pIds.length ? ` <- [${pIds.join(", ")}]` : " (root)";
            console.log(`  [${id}] ${node.type.padEnd(12)} Score:${String(node.score).padEnd(4)} ${arrow}`);
            console.log(`         "${String(node.content).slice(0, 80)}..."`);
        }
    }
}

const systemPrompt = `You are a careful psychology analysis assistant.
You always return valid JSON that matches the required schema.
No markdown, no code fences, no text outside JSON.`;

const hypothesisSchema = {
    type: "object",
    properties: {
        argument: { type: "string" },
        signals: { type: "array", items: { type: "string" } },
        blind_spot: { type: "string" }
    },
    required: ["argument", "signals", "blind_spot"]
};

const scoreSchema = {
    type: "object",
    properties: {
        explanatory_power: { type: "number" },
        plausibility: { type: "number" },
        depth: { type: "number" },
        score: { type: "number" },
        reasoning: { type: "string" }
    },
    required: ["explanatory_power", "plausibility", "depth", "score", "reasoning"]
};

const rankingSchema = {
    type: "object",
    properties: {
        ranking: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4
        },
        rationale: { type: "string" }
    },
    required: ["ranking", "rationale"]
};

const contrastSchema = {
    type: "object",
    properties: {
        contradiction: { type: "string" },
        meaning: { type: "string" }
    },
    required: ["contradiction", "meaning"]
};

const synthSchema = {
    type: "object",
    properties: {
        synthesis: { type: "string" }
    },
    required: ["synthesis"]
};

const refineSchema = {
    type: "object",
    properties: {
        refined_argument: { type: "string" },
        preserved_core: { type: "string" }
    },
    required: ["refined_argument", "preserved_core"]
};

const conclusionSchema = {
    type: "object",
    properties: {
        core_motivation: { type: "string" },
        psychological_picture: { type: "string" },
        contradictions_as_signal: { type: "string" },
        recommendation: { type: "string" },
        what_tot_missed: { type: "array", items: { type: "string" } }
    },
    required: ["core_motivation", "psychological_picture", "contradictions_as_signal", "recommendation", "what_tot_missed"]
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

async function branch(sessionObj, graph, rootId, hypothesisTypes) {
    const behavior = graph.get(rootId).content;
    const ids = [];

    for (const type of hypothesisTypes) {
        const result = await promptJson(
            hypothesisSchema,
            `You are an experienced psychologist.
Analyze this behavior strictly through one lens:
"${type}".

Behavior:
"${behavior}"

Return JSON:
{
  "argument": "2-3 sentence explanation",
  "signals": ["Signal 1", "Signal 2", "Signal 3"],
  "blind_spot": "What this hypothesis alone cannot explain"
}`
        );

        const id = graph.addNode(
            "hypothesis",
            result.argument,
            {
                type,
                signals: result.signals,
                blind_spot: result.blind_spot
            },
            [rootId]
        );

        console.log(`  [${id}] "${type.split("(")[0].trim()}"`);
        console.log(`       Argument: "${String(result.argument).slice(0, 70)}..."`);
        console.log(`       Blind spot: "${String(result.blind_spot).slice(0, 70)}..."`);
        ids.push(id);
    }
    return ids;
}

async function scoreAll(graph, hypothesisIds) {
    const behavior = graph.get("n1").content;
    for (const id of hypothesisIds) {
        const node = graph.get(id);
        const result = await promptJson(
            scoreSchema,
            `Score this psychological hypothesis from 1 to 10.
Criteria: explanatory power, plausibility, depth.
Use decimal values (one decimal) for each criterion.
Compute score with:
score = 0.45 * explanatory_power + 0.35 * plausibility + 0.20 * depth
Use score variety where justified. Avoid identical scores unless two hypotheses are truly indistinguishable.

Behavior:
"${behavior}"

Hypothesis:
"${node.content}"

Return JSON:
{
  "explanatory_power": 7.6,
  "plausibility": 7.9,
  "depth": 6.8,
  "score": 7.5,
  "reasoning": "Short reason"
}`
        );
        node.score = Number(result.score);
        node.meta.rawReasoning = result.reasoning;
        node.meta.rawDetails = {
            explanatory_power: Number(result.explanatory_power),
            plausibility: Number(result.plausibility),
            depth: Number(result.depth)
        };
        console.log(`  [${id}] evaluation captured`);
    }

    const rankingPayload = hypothesisIds
        .map((id) => {
            const n = graph.get(id);
            return `${id}: ${n.content}`;
        })
        .join("\n\n");
    const ranked = await promptJson(
        rankingSchema,
        `Rank these hypothesis node IDs from strongest to weakest.
You must return strict order with no ties.

${rankingPayload}

Return JSON:
{
  "ranking": ["n2", "n4", "n3", "n5"],
  "rationale": "short reason"
}`
    );
    const order = Array.isArray(ranked.ranking) ? ranked.ranking : [];
    const valid = order.length === hypothesisIds.length && new Set(order).size === hypothesisIds.length;
    if (valid) {
        const base = 8.8;
        const step = 0.7;
        order.forEach((id, idx) => {
            const n = graph.get(id);
            if (n) n.score = Number((base - idx * step).toFixed(1));
        });
        console.log("  Calibrated scores (used for ranking):");
        order.forEach((id) => {
            const n = graph.get(id);
            if (n) {
                const d = n.meta.rawDetails || { explanatory_power: 0, plausibility: 0, depth: 0 };
                console.log(`    - [${id}] ${n.score}/10`);
                console.log(
                    `      criteria: explanatory_power=${d.explanatory_power.toFixed(1)} | plausibility=${d.plausibility.toFixed(1)} | depth=${d.depth.toFixed(1)}`
                );
                if (n.meta.rawReasoning) console.log(`      note: ${n.meta.rawReasoning}`);
            }
        });
    }
}

async function contrast(graph, idA, idB) {
    const a = graph.get(idA);
    const b = graph.get(idB);

    const result = await promptJson(
        contrastSchema,
        `Analyze two competing hypotheses about the same behavior.

Hypothesis A:
"${a.content}"

Hypothesis B:
"${b.content}"

Return JSON:
{
  "contradiction": "Productive tension in 2-3 sentences",
  "meaning": "What this contradiction reveals"
}`
    );

    const id = graph.addNode(
        "contrast",
        result.contradiction,
        { meaning: result.meaning },
        [idA, idB]
    );
    console.log(`  Contrast [${id}] <- [${idA}] vs [${idB}]`);
    console.log(`     "${String(result.contradiction).slice(0, 75)}..."`);
    return id;
}

async function aggregate(graph, sourceIds, task) {
    const sourceText = sourceIds
        .map((id) => {
            const n = graph.get(id);
            return `[${id}] (${n.type}): ${n.content}`;
        })
        .join("\n\n");

    const result = await promptJson(
        synthSchema,
        `Synthesize these psychological perspectives.

Perspectives:
${sourceText}

Task: ${task}

Return JSON:
{ "synthesis": "Integrated statement in 3-4 sentences" }`
    );

    const id = graph.addNode("synthesis", result.synthesis, {}, sourceIds);
    console.log(`  Synthesis [${id}] <- [${sourceIds.join(", ")}]`);
    console.log(`     "${String(result.synthesis).slice(0, 80)}..."`);
    return id;
}

async function refine(graph, weakId, strongId) {
    const weak = graph.get(weakId);
    const strong = graph.get(strongId);

    const result = await promptJson(
        refineSchema,
        `Refine a weaker hypothesis using a stronger one.
Keep the weak hypothesis core, but close its blind spots.

Weaker hypothesis:
"${weak.content}"

Stronger context:
"${strong.content}"

Return JSON:
{
  "refined_argument": "Improved argument in 2-3 sentences",
  "preserved_core": "What was preserved from the weaker hypothesis"
}`
    );

    const id = graph.addNode(
        "refined",
        result.refined_argument,
        { preserved_core: result.preserved_core },
        [weakId, strongId]
    );
    console.log(`  Refined [${id}] <- weak[${weakId}] + strong[${strongId}]`);
    console.log(`     "${String(result.refined_argument).slice(0, 80)}..."`);
    return id;
}

async function conclude(graph, sourceIds, behavior) {
    const sourceText = sourceIds
        .map((id) => {
            const n = graph.get(id);
            return `[${n.type.toUpperCase()} ${id}] ${n.content}`;
        })
        .join("\n\n");

    const result = await promptJson(
        conclusionSchema,
        `Create a final integrated motivation analysis.
Use all perspectives, syntheses, and contradictions.

Behavior:
"${behavior}"

Available evidence:
${sourceText}

Return JSON:
{
  "core_motivation": "1-2 sentence core motivation",
  "psychological_picture": "3-4 sentence full picture",
  "contradictions_as_signal": "2 sentences on why contradictions are diagnostically useful",
  "recommendation": "2-3 sentence recommendation",
  "what_tot_missed": ["Insight 1", "Insight 2", "Insight 3"]
}`
    );

    const id = graph.addNode("conclusion", result.core_motivation, result, sourceIds);
    return { id, ...result };
}


async function runGoTMotivationAnalysis(behavior) {
    console.log("\nGraph of Thought: Motivation analysis of a person");
    console.log(`Behavior: "${behavior}"\n`);

    const graph = new ThoughtGraph();
    const rootId = graph.addNode("root", behavior);

    const hypothesisTypes = [
        "Avoidance motivation (escaping something negative)",
        "Burnout and emotional exhaustion",
        "Growth motivation (moving toward something better)",
        "External social pressure (family, partner, society)"
    ];

    console.log("Phase 1: Branching - 4 hypotheses");
    const hIds = await branch(session, graph, rootId, hypothesisTypes);

    console.log("\nPhase 2: Scoring");
    await scoreAll(graph, hIds);

    const ranked = [...hIds].sort((a, b) => graph.get(b).score - graph.get(a).score);
    const [strongA, strongB, medium, weak] = ranked;
    console.log(`\n  Ranking: [${strongA}] > [${strongB}] > [${medium}] > [${weak}]`);
    console.log("  All hypotheses stay in the graph (no hard discard).\n");

    console.log("Phase 3: Contrast - productive contradictions");
    const contrast1 = await contrast(graph, strongA, strongB);
    const contrast2 = await contrast(graph, strongA, weak);

    console.log("\nPhase 4: Refinement - rescue weaker hypotheses");
    const refinedWeak = await refine(graph, weak, strongA);
    const refinedMedium = await refine(graph, medium, contrast1);

    console.log("\nPhase 5: Aggregation - partial syntheses");
    const synth1 = await aggregate(
        graph,
        [strongA, strongB, contrast1],
        "Synthesize the two strongest hypotheses including their tension."
    );
    const synth2 = await aggregate(
        graph,
        [refinedWeak, refinedMedium, contrast2],
        "Synthesize refined weaker hypotheses into a complementary view."
    );

    console.log("\nPhase 6: Final conclusion - merge all strands");
    const conclusion = await conclude(
        graph,
        [synth1, synth2, contrast1, contrast2, refinedWeak],
        behavior
    );

    graph.printGraph();

    console.log("\n" + "=".repeat(64));
    console.log("MOTIVATION ANALYSIS (Graph of Thought)");
    console.log("=".repeat(64));
    console.log(`\nCore motivation:\n${conclusion.core_motivation}`);
    console.log(`\nPsychological picture:\n${conclusion.psychological_picture}`);
    console.log(`\nContradictions as signal:\n${conclusion.contradictions_as_signal}`);
    console.log(`\nRecommendation:\n${conclusion.recommendation}`);
    console.log("\nWHAT TOT WOULD MISS:");
    (conclusion.what_tot_missed || []).forEach((x) => console.log(`  - ${x}`));

    writeGoTMotivationVisualization(__dirname, graph, conclusion);
    return { behavior, graph, conclusion };
}

await runGoTMotivationAnalysis(
    "A 34-year-old woman resigns from a secure office job, withdraws from friends, and starts taking long solo walks daily without explaining why."
);

session.dispose();
context.dispose();
model.dispose();
llama.dispose();
