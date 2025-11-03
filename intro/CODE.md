# Code Explanation: intro.js

This file demonstrates the most basic interaction with a local LLM (Large Language Model) using node-llama-cpp.

## Step-by-Step Code Breakdown

### 1. Import Required Modules
```javascript
import {
    getLlama,
    LlamaChatSession,
} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
```
- **getLlama**: Main function to initialize the llama.cpp runtime
- **LlamaChatSession**: Class for managing chat conversations with the model
- **fileURLToPath** and **path**: Standard Node.js modules for handling file paths

### 2. Set Up Directory Path
```javascript
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```
- Since ES modules don't have `__dirname` by default, we create it manually
- This gives us the directory path of the current file
- Needed to locate the model file relative to this script

### 3. Initialize Llama Runtime
```javascript
const llama = await getLlama();
```
- Creates the main llama.cpp instance
- This initializes the underlying C++ runtime for model inference
- Must be done before loading any models

### 4. Load the Model
```javascript
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "Qwen3-1.7B-Q8_0.gguf"
    )
});
```
- Loads a quantized model file (GGUF format)
- **Qwen3-1.7B-Q8_0.gguf**: A 1.7 billion parameter model, quantized to 8-bit
- The model is stored in the `models` folder at the repository root
- Loading the model into memory takes a few seconds

### 5. Create a Context
```javascript
const context = await model.createContext();
```
- A **context** represents the model's working memory
- It holds the conversation history and current state
- Has a fixed size limit (default: model's maximum context size)
- All prompts and responses are stored in this context

### 6. Create a Chat Session
```javascript
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
});
```
- **LlamaChatSession**: High-level API for chat-style interactions
- Uses a sequence from the context to maintain conversation state
- Automatically handles prompt formatting and response parsing

### 7. Define the Prompt
```javascript
const prompt = `do you know node-llama-cpp`;
```
- Simple question to test if the model knows about the library we're using
- This will be sent to the model for processing

### 8. Send Prompt and Get Response
```javascript
const a1 = await session.prompt(prompt);
console.log("AI: " + a1);
```
- **session.prompt()**: Sends the prompt to the model and waits for completion
- The model generates a response based on its training
- We log the response to the console with "AI:" prefix

### 9. Clean Up Resources
```javascript
session.dispose()
context.dispose()
model.dispose()
llama.dispose()
```
- **Important**: Always dispose of resources when done
- Frees up memory and GPU resources
- Prevents memory leaks in long-running applications
- Must be done in this order (session → context → model → llama)

## Key Concepts Demonstrated

1. **Basic LLM initialization**: Loading a model and creating inference context
2. **Simple prompting**: Sending a question and receiving a response
3. **Resource management**: Proper cleanup of allocated resources

## Expected Output

When you run this script, you should see output like:
```
AI: Yes, I'm familiar with node-llama-cpp. It's a Node.js binding for llama.cpp...
```

The exact response will vary based on the model's training data and generation parameters.
