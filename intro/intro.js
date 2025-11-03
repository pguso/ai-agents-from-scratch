import {
    getLlama,
    LlamaChatSession,
} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "Qwen3-1.7B-Q8_0.gguf"
    )
});

const context = await model.createContext();
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
});

const prompt = `do you know node-llama-cpp`;

const a1 = await session.prompt(prompt);
console.log("AI: " + a1);


session.dispose()
context.dispose()
model.dispose()
llama.dispose()
