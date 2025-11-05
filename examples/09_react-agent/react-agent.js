import {defineChatSessionFunction, getLlama, LlamaChatSession} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
import {PromptDebugger} from "../../helper/prompt-debugger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const llama = await getLlama({debug});
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        '..',
        '..',
        'models',
        'hf_giladgd_gpt-oss-20b.MXFP4.gguf'
    )
});
const context = await model.createContext({contextSize: 2000});

// ReAct-style system prompt for mathematical reasoning
const systemPrompt = `You are a mathematical assistant that uses the ReAct (Reasoning + Acting) approach.

CRITICAL: You must follow this EXACT pattern for every problem:

Thought: [Explain what calculation you need to do next and why]
Action: [Call ONE tool with specific numbers]
Observation: [Wait for the tool result]
Thought: [Analyze the result and decide next step]
Action: [Call another tool if needed]
Observation: [Wait for the tool result]
... (repeat as many times as needed)
Thought: [Once you have ALL the information needed to answer the question]
Answer: [Give the final answer and STOP]

RULES:
1. Only write "Answer:" when you have the complete final answer to the user's question
2. After writing "Answer:", DO NOT continue calculating or thinking
3. Break complex problems into the smallest possible steps
4. Use tools for ALL calculations - never calculate in your head
5. Each Action should call exactly ONE tool

EXAMPLE:
User: "What is 5 + 3, then multiply that by 2?"

Thought: First I need to add 5 and 3
Action: add(5, 3)
Observation: 8
Thought: Now I need to multiply that result by 2
Action: multiply(8, 2)
Observation: 16
Thought: I now have the final result
Answer: 16`;

const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
});

// Simple calculator tools that force step-by-step reasoning
const add = defineChatSessionFunction({
    description: "Add two numbers together",
    params: {
        type: "object",
        properties: {
            a: {
                type: "number",
                description: "First number"
            },
            b: {
                type: "number",
                description: "Second number"
            }
        },
        required: ["a", "b"]
    },
    async handler(params) {
        const result = params.a + params.b;
        console.log(`\n   🔧 TOOL CALLED: add(${params.a}, ${params.b})`);
        console.log(`   📊 RESULT: ${result}\n`);
        return result.toString();
    }
});

const multiply = defineChatSessionFunction({
    description: "Multiply two numbers together",
    params: {
        type: "object",
        properties: {
            a: {
                type: "number",
                description: "First number"
            },
            b: {
                type: "number",
                description: "Second number"
            }
        },
        required: ["a", "b"]
    },
    async handler(params) {
        const result = params.a * params.b;
        console.log(`\n   🔧 TOOL CALLED: multiply(${params.a}, ${params.b})`);
        console.log(`   📊 RESULT: ${result}\n`);
        return result.toString();
    }
});

const subtract = defineChatSessionFunction({
    description: "Subtract second number from first number",
    params: {
        type: "object",
        properties: {
            a: {
                type: "number",
                description: "Number to subtract from"
            },
            b: {
                type: "number",
                description: "Number to subtract"
            }
        },
        required: ["a", "b"]
    },
    async handler(params) {
        const result = params.a - params.b;
        console.log(`\n   🔧 TOOL CALLED: subtract(${params.a}, ${params.b})`);
        console.log(`   📊 RESULT: ${result}\n`);
        return result.toString();
    }
});

const divide = defineChatSessionFunction({
    description: "Divide first number by second number",
    params: {
        type: "object",
        properties: {
            a: {
                type: "number",
                description: "Dividend (number to be divided)"
            },
            b: {
                type: "number",
                description: "Divisor (number to divide by)"
            }
        },
        required: ["a", "b"]
    },
    async handler(params) {
        if (params.b === 0) {
            console.log(`\n   🔧 TOOL CALLED: divide(${params.a}, ${params.b})`);
            console.log(`   ❌ ERROR: Division by zero\n`);
            return "Error: Cannot divide by zero";
        }
        const result = params.a / params.b;
        console.log(`\n   🔧 TOOL CALLED: divide(${params.a}, ${params.b})`);
        console.log(`   📊 RESULT: ${result}\n`);
        return result.toString();
    }
});

const functions = {add, multiply, subtract, divide};

// ReAct Agent execution loop with proper output handling
async function reactAgent(userPrompt, maxIterations = 10) {
    console.log("\n" + "=".repeat(70));
    console.log("USER QUESTION:", userPrompt);
    console.log("=".repeat(70) + "\n");

    let iteration = 0;
    let fullResponse = "";

    while (iteration < maxIterations) {
        iteration++;
        console.log(`--- Iteration ${iteration} ---`);

        // Prompt with onTextChunk to capture streaming output
        let currentChunk = "";
        const response = await session.prompt(
            iteration === 1 ? userPrompt : "Continue your reasoning. What's the next step?",
            {
                functions,
                maxTokens: 300,
                onTextChunk: (chunk) => {
                    // Print each chunk as it arrives
                    process.stdout.write(chunk);
                    currentChunk += chunk;
                }
            }
        );

        console.log(); // New line after streaming

        fullResponse += currentChunk;

        // If no output was generated in this iteration, something's wrong
        if (!currentChunk.trim() && !response.trim()) {
            console.log("   (No output generated this iteration)\n");
        }

        // Check if we have a final answer
        if (response.toLowerCase().includes("answer:") ||
            fullResponse.toLowerCase().includes("answer:")) {
            console.log("\n" + "=".repeat(70));
            console.log("FINAL ANSWER REACHED");
            console.log("=".repeat(70));
            return fullResponse;
        }
    }

    console.log("\n⚠️  Max iterations reached without final answer");
    return fullResponse || "Could not complete reasoning within iteration limit.";
}

// Test queries that require multi-step reasoning
const queries = [
    // "If I buy 3 apples at $2 each and 4 oranges at $3 each, how much do I spend in total?",
    // "Calculate: (15 + 7) × 3 - 10",
    //"A pizza costs $20. If 4 friends split it equally, how much does each person pay?",
    "A store sells 15 items on Monday at $8 each, 20 items on Tuesday at $8 each, and 10 items on Wednesday at $8 each. What's the average number of items sold per day, and what's the total revenue?",
];

for (const query of queries) {
    await reactAgent(query, 3);
    console.log("\n");
}

// Debug
const promptDebugger = new PromptDebugger({
    outputDir: './logs',
    filename: 'react_calculator.txt',
    includeTimestamp: true,
    appendMode: false
});
await promptDebugger.debugContextState({session, model});

// Clean up
session.dispose()
context.dispose()
model.dispose()
llama.dispose()