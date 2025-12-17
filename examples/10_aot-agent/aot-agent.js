import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";
import { PromptDebugger } from "../../helper/prompt-debugger.js";
import { JsonParser } from "../../helper/json-parser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const llama = await getLlama({ debug });
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        '..',
        '..',
        'models',
        'Qwen3-1.7B-Q8_0.gguf'
    )
});
const context = await model.createContext({ contextSize: 2000 });

// Atom of Thought system prompt - LLM only plans, doesn't execute
const systemPrompt = `You are a mathematical planning assistant using Atom of Thought methodology.

CRITICAL RULES:
1. Extract every number from the user's question and put it in the "input" field.
2. Each atom expresses EXACTLY ONE operation: add, subtract, multiply, divide.
3. NEVER combine operations in one atom. For example, "(5 + 3) × 2" → must be TWO atoms: one for add, one for multiply.
4. The "final" atom reports only the result of the last computational atom; it must NOT have its own input. Do not include an "input" field in final atoms.
5. Use "<result_of_N>" to reference previous atom results; never invent calculations in the final atom.
6. Output ONLY valid JSON matching the schema, with no explanation or extra text.

CORRECT EXAMPLE for "What is (15 + 7) × 3 - 10?":
{
  "atoms": [
    {"id": 1, "kind": "tool", "name": "add", "input": {"a": 15, "b": 7}, "dependsOn": []},
    {"id": 2, "kind": "tool", "name": "multiply", "input": {"a": "<result_of_1>", "b": 3}, "dependsOn": [1]},
    {"id": 3, "kind": "tool", "name": "subtract", "input": {"a": "<result_of_2>", "b": 10}, "dependsOn": [2]},
    {"id": 4, "kind": "final", "name": "report", "dependsOn": [3]}
  ]
}

WRONG EXAMPLES:
- Empty input: {"input": {}}
- Missing numbers: {"input": {"a": "<result_of_1>"}}
- Combined operations: "add then multiply" → must be TWO atoms
- Final atom with input: {"kind": "final", "input": {"a": 5}} is INVALID

Available tools: add, subtract, multiply, divide
- Each tool requires: {"a": <number or reference>, "b": <number or reference>}
- kind options: "tool", "decision", "final"
- dependsOn: array of atom IDs that must complete first

Always extract the actual numbers from the question and put them in the input fields! Never combine operations or invent calculations in final atoms.`;

// Define JSON schema for plan validation
const planSchema = {
    type: "object",
    properties: {
        atoms: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "number" },
                    kind: { enum: ["tool", "decision", "final"] },
                    name: { type: "string" },
                    input: {
                        type: "object",
                        properties: {
                            a: {
                                oneOf: [
                                    { type: "number" },
                                    { type: "string", pattern: "^<result_of_\\d+>$" }
                                ]
                            },
                            b: {
                                oneOf: [
                                    { type: "number" },
                                    { type: "string", pattern: "^<result_of_\\d+>$" }
                                ]
                            }
                        }
                    },
                    dependsOn: {
                        type: "array",
                        items: { type: "number" }
                    }
                },
                required: ["id", "kind", "name"]
            }
        }
    },
    required: ["atoms"]
};

const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
});

// Tool implementations (pure functions, deterministic)
const tools = {
    add: (a, b) => {
        const result = a + b;
        console.log(`EXECUTING: add(${a}, ${b}) = ${result}`);
        return result;
    },

    subtract: (a, b) => {
        const result = a - b;
        console.log(`EXECUTING: subtract(${a}, ${b}) = ${result}`);
        return result;
    },

    multiply: (a, b) => {
        const result = a * b;
        console.log(`EXECUTING: multiply(${a}, ${b}) = ${result}`);
        return result;
    },

    divide: (a, b) => {
        if (b === 0) {
            console.log(`ERROR: divide(${a}, ${b}) - Division by zero`);
            throw new Error("Division by zero");
        }
        const result = a / b;
        console.log(`EXECUTING: divide(${a}, ${b}) = ${result}`);
        return result;
    }
};

// Decision handlers (for complex logic)
const decisions = {
    average: (values) => {
        const sum = values.reduce((acc, v) => acc + v, 0);
        const avg = sum / values.length;
        console.log(`DECISION: average([${values}]) = ${avg}`);
        return avg;
    },

    chooseCheapest: (values) => {
        const min = Math.min(...values);
        console.log(`DECISION: chooseCheapest([${values}]) = ${min}`);
        return min;
    }
};

// Phase 1: LLM generates atomic plan
async function generatePlan(userPrompt) {
    console.log("\n" + "=".repeat(70));
    console.log("PHASE 1: PLANNING (LLM generates atomic plan)");
    console.log("=".repeat(70));
    console.log("USER QUESTION:", userPrompt);
    console.log("-".repeat(70) + "\n");

    const grammar = await llama.createGrammarForJsonSchema(planSchema);

    // Add reminder about extracting numbers
    const enhancedPrompt = `${userPrompt}

Remember: Extract the actual numbers from this question and put them in the input fields!`;

    const planText = await session.prompt(enhancedPrompt, {
        grammar,
        maxTokens: 1000
    });

    let plan;
    try {
        // Use the robust JSON parser
        plan = JsonParser.parse(planText, {
            debug: debug,
            expectObject: true,
            repairAttempts: true
        });

        // Validate the plan structure
        JsonParser.validatePlan(plan, debug);

        // Pretty print the plan
        if (debug) {
            JsonParser.prettyPrint(plan);
        } else {
            console.log("GENERATED PLAN:");
            console.log(JSON.stringify(plan, null, 2));
            console.log();
        }
    } catch (error) {
        console.error("Failed to parse plan:", error.message);
        console.log("\nRaw LLM output:");
        console.log(planText);
        throw error;
    }

    return plan;
}

// Phase 2: System validates plan
function validatePlan(plan) {
    console.log("\n" + "=".repeat(70));
    console.log("PHASE 2: VALIDATION (System checks plan)");
    console.log("=".repeat(70) + "\n");

    const allowedTools = new Set(Object.keys(tools));
    const allowedDecisions = new Set(Object.keys(decisions));
    const ids = new Set();

    for (const atom of plan.atoms) {
        // Check for duplicate IDs
        if (ids.has(atom.id)) {
            throw new Error(`Validation failed: Duplicate atom ID ${atom.id}`);
        }
        ids.add(atom.id);

        // Check tool names
        if (atom.kind === "tool" && !allowedTools.has(atom.name)) {
            throw new Error(`Validation failed: Unknown tool "${atom.name}" in atom ${atom.id}`);
        }

        // Check decision names
        if (atom.kind === "decision" && !allowedDecisions.has(atom.name)) {
            throw new Error(`Validation failed: Unknown decision "${atom.name}" in atom ${atom.id}`);
        }

        // NEW: Validate tool inputs have actual values
        if (atom.kind === "tool") {
            if (!atom.input || typeof atom.input !== 'object') {
                throw new Error(
                    `Validation failed: Tool atom ${atom.id} (${atom.name}) must have an input object\n` +
                    ` Current: ${JSON.stringify(atom.input)}`
                );
            }

            // Check if a and b are present
            if (atom.input.a === undefined || atom.input.b === undefined) {
                throw new Error(
                    `Validation failed: Tool atom ${atom.id} (${atom.name}) missing required parameters\n` +
                    `  Expected: {"a": <number or reference>, "b": <number or reference>}\n` +
                    `  Current: ${JSON.stringify(atom.input)}\n` +
                    `  Tip: The LLM must extract numbers from the user's question`
                );
            }

            // For first operations, ensure we have concrete numbers (not references)
            if (atom.dependsOn.length === 0) {
                const hasConcreteNumbers =
                    (typeof atom.input.a === 'number') &&
                    (typeof atom.input.b === 'number');

                if (!hasConcreteNumbers) {
                    throw new Error(
                        `Validation failed: First atom ${atom.id} must have concrete numbers\n` +
                        `  Expected: {"a": <number>, "b": <number>}\n` +
                        `  Current: ${JSON.stringify(atom.input)}\n` +
                        `  The LLM failed to extract numbers from the question`
                    );
                }
            }
        }

        // Check dependencies exist
        if (atom.dependsOn) {
            for (const depId of atom.dependsOn) {
                if (!ids.has(depId) && depId < atom.id) {
                    console.warn(`Warning: atom ${atom.id} depends on ${depId} which hasn't been validated yet`);
                }
            }
        }

        console.log(`Atom ${atom.id} (${atom.kind}:${atom.name}) validated`);
    }

    console.log("\nPlan validation successful\n");
    return true;
}

// Phase 3: System executes plan deterministically
function executePlan(plan) {
    console.log("\n" + "=".repeat(70));
    console.log("PHASE 3: EXECUTION (System runs atoms)");
    console.log("=".repeat(70) + "\n");

    const state = {};
    const sortedAtoms = [...plan.atoms].sort((a, b) => a.id - b.id);

    for (const atom of sortedAtoms) {
        console.log(`\nExecuting atom ${atom.id} (${atom.kind}:${atom.name})`);

        // Check dependencies
        if (atom.dependsOn && atom.dependsOn.length > 0) {
            const missingDeps = atom.dependsOn.filter(id => !(id in state));
            if (missingDeps.length > 0) {
                throw new Error(`Atom ${atom.id} depends on incomplete atoms: ${missingDeps}`);
            }
            console.log(`Dependencies satisfied: ${atom.dependsOn.join(', ')}`);
        }

        // Resolve input values (replace <result_of_N> references)
        let resolvedInput = { a: undefined, b: undefined };
        if (atom.input) {
            // Deep clone to avoid mutations
            resolvedInput = JSON.parse(JSON.stringify(atom.input));

            for (const [key, value] of Object.entries(resolvedInput)) {
                if (typeof value === 'string' && value.startsWith('<result_of_')) {
                    const refId = parseInt(value.match(/\d+/)[0]);

                    if (!(refId in state)) {
                        throw new Error(
                            `Atom ${atom.id} references <result_of_${refId}> but atom ${refId} hasn't executed yet`
                        );
                    }

                    resolvedInput[key] = state[refId];
                    console.log(`Resolved ${key}: ${value} → ${state[refId]}`);
                }
            }
        }

        // Execute based on kind
        if (atom.kind === "tool") {
            const tool = tools[atom.name];
            if (!tool) {
                throw new Error(`Tool not found: ${atom.name}`);
            }

            // Show input before execution
            console.log(`Input: a=${resolvedInput.a}, b=${resolvedInput.b}`);

            // Safety check
            if (resolvedInput.a === undefined || resolvedInput.b === undefined) {
                throw new Error(
                    `Cannot execute ${atom.name}: undefined input values\n` +
                    `  This means the LLM didn't extract numbers from your question.\n` +
                    `  Original input: ${JSON.stringify(atom.input)}`
                );
            }

            state[atom.id] = tool(resolvedInput.a, resolvedInput.b);
        }
        else if (atom.kind === "decision") {
            const decision = decisions[atom.name];
            if (!decision) {
                throw new Error(`Decision not found: ${atom.name}`);
            }

            // Collect results from dependencies
            const depResults = atom.dependsOn.map(id => state[id]);
            state[atom.id] = decision(depResults);
        }
        else if (atom.kind === "final") {
            const finalValue = state[atom.dependsOn[0]];
            console.log(`\n FINAL RESULT: ${finalValue}`);
            state[atom.id] = finalValue;
        }
    }

    return state;
}

// Main AoT Agent execution
async function aotAgent(userPrompt) {
    try {
        // Phase 1: Plan
        const plan = await generatePlan(userPrompt);

        // Phase 2: Validate
        validatePlan(plan);

        // Phase 3: Execute
        const result = executePlan(plan);

        console.log("\n" + "=".repeat(70));
        console.log("EXECUTION COMPLETE");
        console.log("=".repeat(70));

        // Find final atom
        const finalAtom = plan.atoms.find(a => a.kind === "final");
        if (finalAtom) {
            console.log(`\nANSWER: ${result[finalAtom.id]}\n`);
        }

        return result;
    } catch (error) {
        console.error("\nEXECUTION FAILED:", error.message);
        throw error;
    }
}

// Test queries
const queries = [
    // "What is (15 + 7) multiplied by 3 minus 10?",
    // "A pizza costs 20 dollars. If 4 friends split it equally, how much does each person pay?",
    "Calculate: 100 divided by 5, then add 3, then multiply by 2",
];

for (const query of queries) {
    await aotAgent(query);
    console.log("\n");
}

// Debug
const promptDebugger = new PromptDebugger({
    outputDir: './logs',
    filename: 'aot_calculator.txt',
    includeTimestamp: true,
    appendMode: false
});
await promptDebugger.debugContextState({ session, model });

// Clean up
session.dispose();
context.dispose();
model.dispose();
llama.dispose();