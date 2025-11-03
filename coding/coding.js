import {
    getLlama,
    HarmonyChatWrapper,
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
        "hf_giladgd_gpt-oss-20b.MXFP4.gguf"
    )
});
const context = await model.createContext();
const session = new LlamaChatSession({
    chatWrapper: new HarmonyChatWrapper(),
    contextSequence: context.getSequence(),
});

const q1 = `What is hoisting in JavaScript? Explain with examples.`;

console.log('context.contextSize', context.contextSize)

const a1 = await session.prompt(q1, {
    // Tip: let the lib choose or cap reasonably; using the whole context size can be wasteful
    maxTokens: 2000,

    // Fires as soon as the first characters arrive
    onTextChunk: (text) => {
        process.stdout.write(text); // optional: live print
    },
});

console.log("\n\nFinal answer:\n", a1);


session.dispose()
context.dispose()
model.dispose()
llama.dispose()