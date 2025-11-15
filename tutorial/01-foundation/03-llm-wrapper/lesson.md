# The LLM Wrapper

**Part 1: Foundation - Lesson 3**

> Wrapping node-llama-cpp as a Runnable for seamless integration

## Overview

In Lesson 1, you learned about Runnables - the composable interface. In Lesson 2, you mastered Messages - the data structures. Now we'll connect these concepts by wrapping **node-llama-cpp** (our local LLM) as a Runnable that understands Messages.

By the end of this lesson, you'll have a LLM wrapper that can generate text, handle conversations, stream responses, and integrate seamlessly with chains.

## Why Does This Matter?

### The Problem: LLMs Don't Compose

node-llama-cpp is excellent at what it does - running local LLMs efficiently. But when you're building agents, you need more than just an LLM. You need components that work together seamlessly.

**Without a composable framework:**
```javascript
import { getLlama } from 'node-llama-cpp';

// Each component is isolated - they don't know about each other
async function myAgent(userInput) {
  // Step 1: Format the prompt
  const prompt = myCustomFormatter(userInput);

  // Step 2: Call the LLM
  const llama = await getLlama();
  const model = await llama.loadModel({ modelPath: './model.gguf' });
  const response = await model.createCompletion(prompt);

  // Step 3: Parse the response
  const parsed = myCustomParser(response);

  // Step 4: Maybe call a tool?
  if (parsed.needsTool) {
    const toolResult = await myTool(parsed.args);
    // Now what? Call the LLM again? How do we loop?
    // How do we add logging? Memory? Retries?
  }

  return parsed;
}

// Problems:
// - Can't reuse components
// - Can't chain operations
// - Hard to add logging, metrics, or debugging
// - Complex control flow for agents
// - Every new feature requires changing everything
```

**With a composable framework:**
```javascript
// Components that work together
const llm = new LlamaCppLLM({ modelPath: './model.gguf' });

// Simple usage
const response = await llm.invoke([
  new SystemMessage("You are helpful"),
  new HumanMessage("Hi")
]);
// Returns: AIMessage("Hello! How can I help you?")

// But the real power is composition
const agent = promptTemplate
  .pipe(llm)
  .pipe(outputParser)
  .pipe(toolExecutor);

// Now you can:
// ✅ Reuse components in different chains
// ✅ Add logging with callbacks (no code changes)
// ✅ Build complex agents that use tools
// ✅ Test each component independently
// ✅ Swap LLMs without rewriting everything
```

### What the Wrapper Provides

The LLM wrapper isn't about making node-llama-cpp easier - it's about making it **work with everything else**:

1. **Common Interface**: Same `invoke()` / `stream()` / `batch()` as every other component
2. **Message Support**: Understands HumanMessage, AIMessage, SystemMessage
3. **Composability**: Works with `.pipe()` to chain operations
4. **Observability**: Callbacks work automatically for logging/metrics
5. **Configuration**: Runtime settings pass through cleanly

Think of it as an adapter that lets node-llama-cpp play nicely with the rest of your agent system.

## Learning Objectives

By the end of this lesson, you will:

- ✅ Understand how to wrap complex libraries as Runnables
- ✅ Convert Messages to LLM prompts
- ✅ Handle model loading and lifecycle
- ✅ Implement streaming for real-time output
- ✅ Add temperature and other generation parameters
- ✅ Manage context windows and token limits
- ✅ Build a production-ready LLM interface

## Core Concepts

### What is an LLM Wrapper?

An LLM wrapper is an abstraction layer that:
1. **Hides complexity** - No need to manage contexts, sessions, or cleanup
2. **Provides a standard interface** - Same API regardless of underlying model
3. **Handles conversion** - Transforms Messages into model-specific prompts
4. **Manages resources** - Automatic initialization and cleanup
5. **Enables composition** - Works seamlessly in chains

### The Wrapper's Responsibilities

```
Input (Messages)
      ↓
[1. Convert to Prompt]
      ↓
[2. Call LLM]
      ↓
[3. Parse Response]
      ↓
Output (AIMessage)
```

### Key Challenges

1. **Model Loading**: Models are large and slow to load
2. **Prompt Format**: Each model expects different formats
3. **Context Management**: Limited context windows
4. **Token Counting**: Need to track usage
5. **Streaming**: Real-time output is complex
6. **Error Handling**: Models can fail in various ways

## Implementation Deep Dive

Let's build the LLM wrapper step by step.

### Step 1: The Base Structure

```javascript
import { Runnable } from './runnable.js';
import { AIMessage } from './message.js';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

export class LlamaCppLLM extends Runnable {
  constructor(options = {}) {
    super();

    // Model configuration
    this.modelPath = options.modelPath;
    this.temperature = options.temperature ?? 0.7;
    this.maxTokens = options.maxTokens ?? 2048;
    this.contextSize = options.contextSize ?? 4096;

    // Internal state
    this._llama = null;
    this._model = null;
    this._context = null;
    this._initialized = false;
  }

  async _call(input, config) {
    // Will implement next
  }
}
```

**Key decisions**:
- Stores configuration (temperature, max tokens, etc.)
- Tracks internal state (model, context)
- Lazy initialization (load on first use)

### Step 2: Model Initialization

```javascript
export class LlamaCppLLM extends Runnable {
  // ... constructor ...

  /**
   * Initialize the model (lazy loading)
   */
  async _initialize() {
    if (this._initialized) return;

    console.log('Loading model...');

    // Get llama instance
    this._llama = await getLlama();

    // Load the model
    this._model = await this._llama.loadModel({
      modelPath: this.modelPath
    });

    // Create context (working memory for the model)
    this._context = await this._model.createContext({
      contextSize: this.contextSize
    });

    this._initialized = true;
    console.log('Model loaded successfully');
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    if (this._context) {
      await this._context.dispose();
    }
    if (this._model) {
      await this._model.dispose();
    }
    this._initialized = false;
  }
}
```

**Why lazy loading?**
- Models take 5-30 seconds to load
- Don't load until actually needed
- Share one loaded model across multiple calls

### Step 3: Converting Messages to Prompt

```javascript
export class LlamaCppLLM extends Runnable {
  // ... previous code ...

  _buildPromptFromMessages(messages) {
    // Extract system message if present
    const systemMessages = messages.filter(msg => msg._type === 'system');
    const systemPrompt = systemMessages.length > 0 ? systemMessages[0].content : undefined;

    // Get the last user message as the prompt
    const userMessages = messages.filter(msg => msg._type === 'human');
    const lastUserMessage = userMessages[userMessages.length - 1];

    return {
      systemPrompt,
      prompt: lastUserMessage ? lastUserMessage.content : ''
    };
  }

  // ... more methods ...
}
```

### Step 4: The Main Generation Method

```javascript
import { LlamaChatSession } from 'node-llama-cpp';

export class LlamaCppLLM extends Runnable {
  // ... previous code ...

  async _call(input, config = {}) {
    // Initialize if needed
    await this._initialize();

    // Handle different input types
    let messages;
    if (typeof input === 'string') {
      // Simple string input
      messages = [new HumanMessage(input)];
    } else if (Array.isArray(input)) {
      // Array of messages
      messages = input;
    } else {
      throw new Error('Input must be string or array of messages');
    }

    // Build prompt from messages
    const { systemPrompt, prompt } = this._buildPromptFromMessages(messages);

    // Create a chat session for this request
    const contextSequence = this._context.getSequence();
    const session = new LlamaChatSession({
      contextSequence,
      systemPrompt
    });

    try {
      // Generate response
      const response = await session.prompt(prompt, {
        temperature: config.temperature ?? this.temperature,
        maxTokens: config.maxTokens ?? this.maxTokens
      });

      // Clean up the response
      const content = this._cleanResponse(response);

      // Return as AIMessage
      return new AIMessage(content);
    } catch (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  /**
   * Clean up the model's response
   */
  _cleanResponse(response) {
    let cleaned = response.trim();

    // Remove any "Assistant:" prefix if model added it
    cleaned = cleaned.replace(/^Assistant:\s*/i, '');

    // Remove stop strings if they leaked through
    cleaned = cleaned.replace(/\n\n(Human|User):.*$/s, '');

    return cleaned.trim();
  }
}
```

### Step 5: Streaming Support

For real-time output (like ChatGPT's typing effect):

```javascript
import { LlamaChatSession } from 'node-llama-cpp';

export class LlamaCppLLM extends Runnable {
  // ... previous code ...

  async *_stream(input, config = {}) {
    await this._initialize();

    // Prepare messages and prompt (same as _call)
    let messages;
    if (typeof input === 'string') {
      messages = [new HumanMessage(input)];
    } else if (Array.isArray(input)) {
      messages = input;
    } else {
      throw new Error('Input must be string or array of messages');
    }

    // Build prompt from messages
    const { systemPrompt, prompt } = this._buildPromptFromMessages(messages);

    // Create a chat session for this request
    const contextSequence = this._context.getSequence();
    const session = new LlamaChatSession({
      contextSequence,
      systemPrompt
    });

    try {
      // Stream tokens as they're generated
      let fullResponse = '';
      const chunks = [];

      // Generate response with streaming
      const response = await session.prompt(prompt, {
        temperature: config.temperature ?? this.temperature,
        maxTokens: config.maxTokens ?? this.maxTokens,
        onTextChunk: (chunk) => {
          fullResponse += chunk;
          chunks.push(chunk);
        }
      });

      // Yield each chunk as an AIMessage
      for (const chunk of chunks) {
        yield new AIMessage(chunk, {
          additionalKwargs: { chunk: true }
        });
      }

      // Yield final complete message
      const cleaned = this._cleanResponse(response);
      yield new AIMessage(cleaned, {
        additionalKwargs: { final: true }
      });
    } catch (error) {
      throw new Error(`Streaming failed: ${error.message}`);
    }
  }
}
```

### Step 6: Adding Configuration Options

```javascript
export class LlamaCppLLM extends Runnable {
  constructor(options = {}) {
    super();

    // Required
    this.modelPath = options.modelPath;
    if (!this.modelPath) {
      throw new Error('modelPath is required');
    }

    // Generation parameters
    this.temperature = options.temperature ?? 0.7;
    this.topP = options.topP ?? 0.9;
    this.topK = options.topK ?? 40;
    this.maxTokens = options.maxTokens ?? 2048;
    this.repeatPenalty = options.repeatPenalty ?? 1.1;

    // Context configuration
    this.contextSize = options.contextSize ?? 4096;
    this.batchSize = options.batchSize ?? 512;

    // Behavior
    this.verbose = options.verbose ?? false;
    this.stopStrings = options.stopStrings ?? ['Human:', 'User:'];

    // Internal state
    this._llama = null;
    this._model = null;
    this._context = null;
    this._initialized = false;
  }

  // ... rest of implementation ...
}
```

## Complete Implementation

Here's the full working LLM wrapper:

```javascript
/**
 * LlamaCppLLM - node-llama-cpp wrapper as a Runnable
 * 
 * @module llm/llama-cpp-llm
 */

import { Runnable } from '../core/runnable.js';
import { AIMessage, HumanMessage } from '../core/message.js';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

export class LlamaCppLLM extends Runnable {
  constructor(options = {}) {
    super();

    // Validate required options
    this.modelPath = options.modelPath;
    if (!this.modelPath) {
      throw new Error('modelPath is required');
    }

    // Generation parameters
    this.temperature = options.temperature ?? 0.7;
    this.topP = options.topP ?? 0.9;
    this.topK = options.topK ?? 40;
    this.maxTokens = options.maxTokens ?? 2048;
    this.repeatPenalty = options.repeatPenalty ?? 1.1;

    // Context configuration
    this.contextSize = options.contextSize ?? 4096;
    this.batchSize = options.batchSize ?? 512;

    // Behavior
    this.verbose = options.verbose ?? false;
    this.stopStrings = options.stopStrings ?? [
      'Human:', 'User:', '\n\nHuman:', '\n\nUser:'
    ];

    // Internal state
    this._llama = null;
    this._model = null;
    this._context = null;
    this._initialized = false;
  }

  /**
   * Initialize model (lazy loading)
   */
  async _initialize() {
    if (this._initialized) return;

    if (this.verbose) {
      console.log(`Loading model: ${this.modelPath}`);
    }

    try {
      this._llama = await getLlama();

      this._model = await this._llama.loadModel({
        modelPath: this.modelPath
      });

      this._context = await this._model.createContext({
        contextSize: this.contextSize,
        batchSize: this.batchSize
      });


      this._initialized = true;

      if (this.verbose) {
        console.log('Model loaded successfully');
      }
    } catch (error) {
      throw new Error(`Failed to initialize model: ${error.message}`);
    }
  }

  /**
   * Convert messages to prompt text for the chat session
   */
  _buildPromptFromMessages(messages) {
    // Extract system message if present
    const systemMessages = messages.filter(msg => msg._type === 'system');
    const systemPrompt = systemMessages.length > 0 ? systemMessages[0].content : undefined;

    // Get the last user message as the prompt
    const userMessages = messages.filter(msg => msg._type === 'human');
    const lastUserMessage = userMessages[userMessages.length - 1];

    return {
      systemPrompt,
      prompt: lastUserMessage ? lastUserMessage.content : ''
    };
  }

  /**
   * Clean model response
   */
  _cleanResponse(response) {
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^(Assistant|AI):\s*/i, '');
    cleaned = cleaned.replace(/\n\n(Human|User):.*$/s, '');
    return cleaned.trim();
  }

  /**
   * Main generation method
   */
  async _call(input, config = {}) {
    await this._initialize();

    // Handle input types
    let messages;
    if (typeof input === 'string') {
      messages = [new HumanMessage(input)];
    } else if (Array.isArray(input)) {
      messages = input;
    } else {
      throw new Error('Input must be string or array of messages');
    }

    // Build prompt from messages
    const { systemPrompt, prompt } = this._buildPromptFromMessages(messages);

    // Create a new chat session for this request with system prompt
    const contextSequence = this._context.getSequence();
    const session = new LlamaChatSession({
      contextSequence,
      systemPrompt
    });

    try {
      // Generate response using the chat session
      const response = await session.prompt(prompt, {
        temperature: config.temperature ?? this.temperature,
        topP: config.topP ?? this.topP,
        topK: config.topK ?? this.topK,
        maxTokens: config.maxTokens ?? this.maxTokens,
        repeatPenalty: config.repeatPenalty ?? this.repeatPenalty
      });

      // Clean and return the response
      const cleanedResponse = this._cleanResponse(response);
      return new AIMessage(cleanedResponse);
    } catch (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  /**
   * Streaming generation
   */
  async *_stream(input, config = {}) {
    await this._initialize();

    let messages;
    if (typeof input === 'string') {
      messages = [new HumanMessage(input)];
    } else if (Array.isArray(input)) {
      messages = input;
    } else {
      throw new Error('Input must be string or array of messages');
    }

    // Build prompt from messages
    const { systemPrompt, prompt } = this._buildPromptFromMessages(messages);

    // Create a new chat session for this request with system prompt
    const contextSequence = this._context.getSequence();
    const session = new LlamaChatSession({
      contextSequence,
      systemPrompt
    });

    try {
      let fullResponse = '';
      const chunks = [];

      // Use the chat session to generate a streaming response
      const response = await session.prompt(prompt, {
        temperature: config.temperature ?? this.temperature,
        topP: config.topP ?? this.topP,
        topK: config.topK ?? this.topK,
        maxTokens: config.maxTokens ?? this.maxTokens,
        repeatPenalty: config.repeatPenalty ?? this.repeatPenalty,
        onTextChunk: (chunk) => {
          fullResponse += chunk;
          chunks.push(chunk);
        }
      });

      // Yield all collected chunks
      for (const chunk of chunks) {
        yield new AIMessage(chunk, {
          additionalKwargs: { chunk: true }
        });
      }

      // Clean and yield final message
      const cleanedResponse = this._cleanResponse(response);
      yield new AIMessage(cleanedResponse, {
        additionalKwargs: { final: true }
      });
    } catch (error) {
      throw new Error(`Streaming failed: ${error.message}`);
    }
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    if (this._context) {
      await this._context.dispose();
      this._context = null;
    }
    if (this._model) {
      await this._model.dispose();
      this._model = null;
    }
    this._initialized = false;
  }

  toString() {
    return `LlamaCppLLM(model=${this.modelPath})`;
  }
}

export default LlamaCppLLM;
```

## Real-World Examples

### Example 1: Simple Text Generation

```javascript
const llm = new LlamaCppLLM({
  modelPath: './models/llama-3.1-8b.gguf',
  temperature: 0.7,
  maxTokens: 100
});

// Simple string input
const response = await llm.invoke("What is 2+2?");
console.log(response.content); // "2+2 equals 4."
```

### Example 2: Conversation with Messages

```javascript
const conversation = [
  new SystemMessage("You are a helpful math tutor."),
  new HumanMessage("Explain what a prime number is"),
  new AIMessage("A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself."),
  new HumanMessage("Is 17 prime?")
];

const response = await llm.invoke(conversation);
console.log(response.content); 
// "Yes, 17 is prime because it can only be divided by 1 and 17."
```

### Example 3: Streaming Output

```javascript
const llm = new LlamaCppLLM({
  modelPath: './models/llama-3.1-8b.gguf'
});

console.log('Response: ');
for await (const chunk of llm.stream("Write a haiku about coding")) {
  if (chunk.additionalKwargs.chunk) {
    process.stdout.write(chunk.content);
  }
}
console.log('\n');

// Output (streaming in real-time):
// Lines of code flow
// Like rivers to the sea
// Logic makes it so
```

You can also use callbacks for more control:

```javascript
const llm = new LlamaCppLLM({
  modelPath: './models/llama-3.1-8b.gguf'
});

let response = '';
await llm.invoke("Write a haiku about coding", {
  callbacks: [{
    handleLLMNewToken(token) {
      process.stdout.write(token);
      response += token;
    }
  }]
});
console.log('\nFinal response:', response);
```

### Example 4: Temperature Control

```javascript
// Low temperature (more deterministic)
const creative = await llm.invoke(
  "Complete: Once upon a time",
  { temperature: 0.2 }
);

// High temperature (more creative)
const deterministic = await llm.invoke(
  "Complete: Once upon a time",
  { temperature: 1.2 }
);
```

### Example 5: Using in a Chain

```javascript
import { PromptTemplate } from '../prompts/prompt-template.js';

// Create a translation chain
const prompt = PromptTemplate.fromTemplate(
  "Translate the following to {language}: {text}"
);

const chain = prompt.pipe(llm);

const result = await chain.invoke({
  language: "Spanish",
  text: "Hello, how are you?"
});

console.log(result.content); // "Hola, ¿cómo estás?"
```

### Example 6: Batch Processing

```javascript
const questions = [
  "What is 2+2?",
  "What is 3*3?",
  "What is 10/2?"
];

const messages = questions.map(q => [
  new SystemMessage("You are a calculator"),
  new HumanMessage(q)
]);

const answers = await llm.batch(messages);
answers.forEach((answer, i) => {
  console.log(`${questions[i]} = ${answer.content}`);
});
```

## Advanced Patterns

### Pattern 1: Model Pool (Reusing Loaded Models)

```javascript
class LLMPool {
  constructor() {
    this.models = new Map();
  }

  async get(modelPath, options = {}) {
    if (!this.models.has(modelPath)) {
      const llm = new LlamaCppLLM({ modelPath, ...options });
      await llm._initialize(); // Pre-load
      this.models.set(modelPath, llm);
    }
    return this.models.get(modelPath);
  }

  async disposeAll() {
    for (const llm of this.models.values()) {
      await llm.dispose();
    }
    this.models.clear();
  }
}

// Usage
const pool = new LLMPool();
const llm = await pool.get('./models/llama-3.1-8b.gguf');
```

### Pattern 2: Retry on Failure

```javascript
class ReliableLLM extends LlamaCppLLM {
  async _call(input, config = {}) {
    const maxRetries = config.maxRetries || 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await super._call(input, config);
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${i + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw new Error(`All ${maxRetries} attempts failed: ${lastError.message}`);
  }
}
```

### Pattern 3: Token Counting

```javascript
class LlamaCppLLMWithCounting extends LlamaCppLLM {
  constructor(options) {
    super(options);
    this.totalTokens = 0;
  }

  async _call(input, config = {}) {
    const result = await super._call(input, config);

    // Rough token estimation (4 chars ≈ 1 token)
    const promptTokens = Math.ceil(JSON.stringify(input).length / 4);
    const completionTokens = Math.ceil(result.content.length / 4);

    this.totalTokens += promptTokens + completionTokens;

    // Add to result metadata
    result.additionalKwargs.usage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };

    return result;
  }

  getUsage() {
    return { totalTokens: this.totalTokens };
  }
}
```

### Pattern 4: Caching

```javascript
class CachedLLM extends LlamaCppLLM {
  constructor(options) {
    super(options);
    this.cache = new Map();
  }

  async _call(input, config = {}) {
    const key = JSON.stringify({ input, config });

    if (this.cache.has(key)) {
      console.log('Cache hit!');
      return this.cache.get(key);
    }

    const result = await super._call(input, config);
    this.cache.set(key, result);

    return result;
  }
}
```

## Common Patterns and Best Practices

### ✅ DO:

```javascript
// Initialize once, use many times
const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
await llm.invoke("Question 1");
await llm.invoke("Question 2");
await llm.dispose(); // Cleanup when done

// Use Messages for structure
const messages = [
  new SystemMessage("You are helpful"),
  new HumanMessage("Hi")
];

// Handle errors gracefully
try {
  const result = await llm.invoke(messages);
} catch (error) {
  console.error('Generation failed:', error);
}
```

### ❌ DON'T:

```javascript
// Don't create new LLM for each request (slow!)
for (const question of questions) {
  const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
  await llm.invoke(question); // Loads model every time!
}

// Don't forget error handling
const result = await llm.invoke(prompt); // Can crash your app

// Don't ignore cleanup
// Missing: await llm.dispose()
```

## Performance Tips

### Tip 1: Preload Models

```javascript
// Load during app startup
const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
await llm._initialize(); // Force load now

// Later requests are instant
await llm.invoke("Fast response!");
```

### Tip 2: Batch Similar Requests

```javascript
// Slow: Sequential
for (const q of questions) {
  await llm.invoke(q);
}

// Fast: Parallel
await llm.batch(questions);
```

### Tip 3: Adjust Context Size

```javascript
// Smaller context = faster, less memory
const fastLLM = new LlamaCppLLM({
  modelPath: './model.gguf',
  contextSize: 2048  // vs default 4096
});
```

### Tip 4: Use Appropriate Temperature

```javascript
// Factual answers: low temperature
const fact = await llm.invoke(query, { temperature: 0.1 });

// Creative writing: high temperature
const story = await llm.invoke(query, { temperature: 1.0 });
```

## Debugging Tips

### Tip 1: Enable Verbose Mode

```javascript
const llm = new LlamaCppLLM({
  modelPath: './model.gguf',
  verbose: true  // Shows loading and generation details
});
```

### Tip 2: Inspect Raw Prompts

```javascript
// Add a debug method
class DebugLLM extends LlamaCppLLM {
  async _call(input, config) {
    const prompt = this._messagesToPrompt(
      Array.isArray(input) ? input : [new HumanMessage(input)]
    );
    console.log('Prompt:\n', prompt);
    return await super._call(input, config);
  }
}
```

### Tip 3: Test Streaming

```javascript
// Verify streaming works
console.log('Testing stream:');
for await (const chunk of llm.stream("Count to 5")) {
  console.log('Chunk:', chunk.content);
}
```

## Common Mistakes

### ❌ Mistake 1: Not Handling Model Load Time

```javascript
// Bad: Assumes instant load
const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
const result = await llm.invoke("Hi"); // First call waits 10+ seconds
```

**Fix**: Preload or show loading indicator:
```javascript
const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
console.log('Loading model...');
await llm._initialize();
console.log('Ready!');
```

### ❌ Mistake 2: Ignoring Context Limits

```javascript
// Bad: Exceeds context window
const hugeConversation = Array(1000).fill({ content: "message" });
await llm.invoke(hugeConversation); // Will fail or truncate
```

**Fix**: Manage conversation length:
```javascript
// Keep only recent messages
const recentMessages = conversation.slice(-10);
await llm.invoke(recentMessages);
```

### ❌ Mistake 3: Wrong Message Types

```javascript
// Bad: Using raw strings instead of Messages
await llm.invoke("System: You are helpful\nHuman: Hi");
```

**Fix**: Use proper Message types:
```javascript
await llm.invoke([
  new SystemMessage("You are helpful"),
  new HumanMessage("Hi")
]);
```

## Mental Model

Think of the LLM wrapper as a translator:

```
You speak: "Messages"
         ↓
[LLM Wrapper translates to model's language]
         ↓
Model speaks: "Tokens"
         ↓
[LLM Wrapper translates back]
         ↓
You receive: "AIMessage"
```

The wrapper handles all the messy details of:
- Loading models
- Formatting prompts
- Managing sessions
- Cleaning responses
- Error handling

So you can focus on building your agent logic!

## Exercises

Practice building with the LLM wrapper:

### Exercise 1: Build a Conversational LLM

Create an LLM that maintains conversation history automatically.

**Starter code**: `exercises/09-conversational-llm.js`

### Exercise 2: Add Response Validation

Build an LLM that validates responses match a schema.

**Starter code**: `exercises/10-validated-llm.js`

### Exercise 3: Implement Streaming Display

Create a streaming response display with a progress indicator.

**Starter code**: `exercises/11-streaming-display.js`

### Exercise 4: Build a Model Router

Create a router that selects different models based on query type.

**Starter code**: `exercises/12-model-router.js`

## Summary

Congratulations! You now understand how to wrap a complex LLM library as a clean, composable Runnable.

### Key Takeaways

1. **Abstraction hides complexity**: Users don't need to know about contexts, sessions, or cleanup
2. **Lazy loading saves time**: Load models only when needed
3. **Messages enable structure**: Proper conversation formatting
4. **Streaming improves UX**: Real-time output feels responsive
5. **Configuration enables flexibility**: Temperature, tokens, context size
6. **Error handling prevents crashes**: Always try/catch and cleanup
7. **Resource management matters**: Dispose of models when done

### What You Built

A production-ready LLM wrapper that:
- ✅ Loads models lazily
- ✅ Handles Messages properly
- ✅ Supports streaming
- ✅ Configurable generation
- ✅ Composes with other Runnables
- ✅ Manages resources
- ✅ Provides good error messages

### What's Next

In the next lesson, we'll explore **Context & Configuration** - how to pass state and settings through chains.

**Preview**: You'll learn:
- RunnableConfig object
- Callback systems
- Metadata tracking
- Debug modes

➡️ [Continue to Lesson 4: Context & Configuration](04-context.md)

## Additional Resources

- [node-llama-cpp Documentation](https://github.com/withcatai/node-llama-cpp)
- [GGUF Model Format](https://huggingface.co/docs/hub/gguf)
- [Temperature vs Top-P](https://docs.cohere.com/docs/controlling-generation-with-top-k-top-p)

## Questions & Discussion

**Q: Why lazy loading instead of loading in constructor?**

A: Model loading can take 10-30 seconds. If you load in the constructor, your app hangs during initialization. Lazy loading means the app starts instantly, and models load only when first used.

**Q: Can I use multiple models simultaneously?**

A: Yes! Each LlamaCppLLM instance can have a different model. Just be aware of memory constraints - each model takes several GB of RAM.

**Q: How do I know what context size to use?**

A: Start with 4096 (default). Increase if you need longer conversations, decrease if you're low on memory. The model file often indicates its trained context size.

**Q: What's the difference between temperature and top-p?**

A: Both control randomness. Temperature affects the probability distribution (0 = deterministic, 2 = very random). Top-p limits vocabulary to most likely tokens. Use one or the other, not both at extreme values.

---

**Built with ❤️ for learners who want to understand AI agents deeply**

[← Previous: Messages](02-messages.md) | [Tutorial Index](../README.md) | [Next: Context →](04-context.md)
