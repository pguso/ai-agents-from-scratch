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
        'Qwen3-1.7B-Q8_0.gguf'
    )
});
const context = await model.createContext({contextSize: 2000});

const systemPrompt = `You are a professional chronologist who standardizes time representations across different systems.
    
Always convert times from 12-hour format (e.g., "1:46:36 PM") to 24-hour format (e.g., "13:46") without seconds 
before returning them.`;

const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
});

const getCurrentTime = defineChatSessionFunction({
    description: "Get the current time",
    params: {
        type: "object",
        properties: {}
    },
    async handler() {
        return new Date().toLocaleTimeString();
    }
});

const functions = {getCurrentTime};
const prompt = `What time is it right now?`;

// Execute the prompt
const a1 = await session.prompt(prompt, {functions});
console.log("AI: " + a1);

// Debug after the prompt execution
const promptDebugger = new PromptDebugger({
    outputDir: './logs',
    filename: 'qwen_prompts.txt',
    includeTimestamp: true,  // adds timestamp to filename
    appendMode: false        // overwrites file each time
});
await promptDebugger.debugContextState({session, model});

// Clean up
session.dispose()
context.dispose()
model.dispose()
llama.dispose()