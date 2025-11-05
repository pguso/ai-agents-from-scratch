import {defineChatSessionFunction, getLlama, LlamaChatSession} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
import {MemoryManager} from "./memory-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const llama = await getLlama({debug: false});
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        '..',
        '..',
        'models',
        'Qwen3-1.7B-Q8_0.gguf'
    )
});
const context = await model.createContext({contextSize: 2000});

// Initialize memory manager
const memoryManager = new MemoryManager('./agent-memory.json');

// Load existing memories and add to system prompt
const memorySummary = await memoryManager.getMemorySummary();

const systemPrompt = `
You are a helpful assistant with long-term memory.

Before calling any function, always follow this reasoning process:

1. **Compare** new user statements against existing memories below.
2. **If the same key and value already exist**, do NOT call saveMemory again.
   - Instead, simply acknowledge the known information.
   - Example: if the user says "My name is Malua" and memory already says "user_name: Malua", reply "Yes, I remember your name is Malua."
3. **If the user provides an updated value** (e.g., "I actually prefer sushi now"), 
   then call saveMemory once to update the value.
4. **Only call saveMemory for genuinely new information.**

When saving new data, call saveMemory with structured fields:
- type: "fact" or "preference"
- key: short descriptive identifier (e.g., "user_name", "favorite_food")
- value: the specific information (e.g., "Malua", "chinua")

Examples:
saveMemory({ type: "fact", key: "user_name", value: "Malua" })
saveMemory({ type: "preference", key: "favorite_food", value: "chinua" })

${memorySummary}
`;

const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
});

// Function to save memories
const saveMemory = defineChatSessionFunction({
    description: "Save important information to long-term memory (user preferences, facts, personal details)",
    params: {
        type: "object",
        properties: {
            type: {
                type: "string",
                enum: ["fact", "preference"]
            },
            key: {type: "string"},
            value: {type: "string"}
        },
        required: ["type", "key", "value"]
    },
    async handler({type, key, value}) {
        await memoryManager.addMemory({type, key, value});
        return `Memory saved: ${key} = ${value}`;
    }
});

const functions = {saveMemory};

// Example conversation
const prompt1 = "Hi! My name is Alex and I love pizza.";
const response1 = await session.prompt(prompt1, {functions});
console.log("AI: " + response1);

// Later conversation (even after restarting the script)
const prompt2 = "What's my favorite food?";
const response2 = await session.prompt(prompt2, {functions});
console.log("AI: " + response2);

// Clean up
session.dispose()
context.dispose()
model.dispose()
llama.dispose()