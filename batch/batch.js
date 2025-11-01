import {getLlama, LlamaChatSession} from "node-llama-cpp";
import path from "path";
import {fileURLToPath} from "url";

/**
 * Asynchronous execution improves performance in GAIA benchmarks,
 * multi-agent applications, and other high-throughput scenarios.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.join(
    __dirname,
    "../",
    "models",
    "DeepSeek-R1-0528-Qwen3-8B-Q6_K.gguf"
)

// Retry config for this file's parallel prompts
const RETRIES = 3;
const DELAY = 150;
const FACTOR = 2;
const JITTER = true;

const llama = await getLlama();
const model = await llama.loadModel({modelPath});
const context = await model.createContext({
    sequences: 2,
    batchSize: 1024 // The number of tokens that can be processed at once by the GPU.
});

const sequence1 = context.getSequence();
const sequence2 = context.getSequence();

const session1 = new LlamaChatSession({
    contextSequence: sequence1
});
const session2 = new LlamaChatSession({
    contextSequence: sequence2
});

const q1 = "Hi there, how are you?";
const q2 = "How much is 6+6?";

const [
    a1,
    a2
] = await Promise.all([
    // Wrap prompts with retry/backoff to tolerate transient failures
    (async () => {
        const { default: retryWithBackoff } = await import('../utils/retry.js');
        return await retryWithBackoff(() => session1.prompt(q1), { retries: RETRIES, delay: DELAY, factor: FACTOR, jitter: JITTER });
    })(),
    (async () => {
        const { default: retryWithBackoff } = await import('../utils/retry.js');
        return await retryWithBackoff(() => session2.prompt(q2), { retries: RETRIES, delay: DELAY, factor: FACTOR, jitter: JITTER });
    })()
]);

console.log("User: " + q1);
console.log("AI: " + a1);

console.log("User: " + q2);
console.log("AI: " + a2);

llama.dispose();
model.dispose();
context.dispose();
session1.dispose();
session2.dispose();