import {defineChatSessionFunction, getLlama, LlamaChatSession} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
import {PromptDebugger} from "../helper/prompt-debugger.js";
import { retryWithBackoff } from "./retry-util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const llama = await getLlama({debug});
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "hf_Qwen_Qwen3-1.7B.Q8_0.gguf"
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
    // The handler invoked when the LLM calls the getCurrentTime function.
    // It returns a promise and uses retryWithBackoff to tolerate transient failures.
    async handler() {
        // Wrap the tool logic in retryWithBackoff so transient errors are retried
        // according to the backoff policy defined in the options object below.
        return retryWithBackoff(
            async () => {
                // Simulate an unreliable external tool or API call:
                // - Approximately 50% of the time we throw an error to emulate a timeout/failure.
                // - When successful, we return a human-readable time string.
                //
                // Note: toLocaleTimeString often includes seconds and AM/PM; the system prompt
                // expects the model to convert to 24-hour format without seconds after receiving this.
                if (Math.random() < 0.5) {
                    // Throwing signals a transient failure; retryWithBackoff will catch this and retry.
                    throw new Error("Random API timeout");
                }

                // On success, return the current local time string.
                return new Date().toLocaleTimeString();
            },
            {
                // How many times to retry after the initial attempt (2 retries → up to 3 attempts).
                retries: 2,
                // Base delay (ms) before the first retry; actual delays typically grow per attempt.
                baseDelay: 300,
                // Label useful for logging/tracing which operation is being retried.
                label: "getCurrentTime tool function",
                // Optional testing hook: simulateFails causes the retry helper itself to
                // pretend a specified number of failures before allowing success. Useful for testing.
                simulateFails: 1
            }
        );
    }
    });

const functions = {getCurrentTime};
const prompt = `What time is it right now?`;

// Execute the prompt
//Example 2: Wrapping the function call with retry logic to simulate transient failures in API calls
const a1 = await retryWithBackoff(() => session.prompt(prompt, {functions}),
{
        retries: 3,
        baseDelay: 400,
        factor: 2,
        jitter: true,
        label: "LLM session.prompt",
        simulateFails: 2,   
        retryOn: (err) => true
 
});
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