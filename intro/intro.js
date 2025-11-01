import {
    getLlama,
    LlamaChatSession,
} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
import retryWithBackoff from "../utils/retry.js";

// Retry options for this module
const RETRIES = 4;
const DELAY = 200;
const FACTOR = 2;
const JITTER = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "hf_Qwen_Qwen3-1.7B.Q8_0.gguf"
    )
});

const context = await model.createContext();
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
});

const prompt = `do you know node-llama-cpp`;

const a1 = await retryWithBackoff(() => session.prompt(prompt), {
    retries: RETRIES,
    delay: DELAY,
    factor: FACTOR,
    jitter: JITTER,
    shouldRetry: (err) => true
});
console.log("AI: " + a1);


llama.dispose()
model.dispose()
context.dispose()
session.dispose()