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
6. **History Isolation**: Proper batch processing without contamination

Think of it as an adapter that lets node-llama-cpp play nicely with the rest of your agent system.

## Learning Objectives

By the end of this lesson, you will:

- ✅ Understand how to wrap complex libraries as Runnables
- ✅ Convert Messages to LLM chat history
- ✅ Handle model loading and lifecycle
- ✅ Implement streaming for real-time output
- ✅ Add temperature and other generation parameters
- ✅ Manage context windows and chat history
- ✅ Handle batch processing with history isolation

## Core Concepts

### What is an LLM Wrapper?

An LLM wrapper is an abstraction layer that:
1. **Hides complexity** - No need to manage contexts, sessions, or cleanup
2. **Provides a standard interface** - Same API regardless of underlying model
3. **Handles conversion** - Transforms Messages into model-specific chat history
4. **Manages resources** - Automatic initialization and cleanup
5. **Enables composition** - Works seamlessly in chains
6. **Isolates state** - Prevents history contamination in batch processing

### The Wrapper's Responsibilities

```
Input (Messages)
      ↓
[1. Convert to Chat History]
      ↓
[2. Manage System Prompt]
      ↓
[3. Call LLM]
      ↓
[4. Parse Response]
      ↓
Output (AIMessage)
```

### Key Challenges

1. **Model Loading**: Models are large and slow to load
2. **Chat History Format**: Convert Messages to node-llama-cpp format
3. **System Prompt Management**: Clear and set for each call
4. **Context Management**: Limited context windows
5. **Streaming**: Real-time output is complex
6. **Batch Isolation**: Prevent history contamination
7. **Error Handling**: Models can fail in various ways
8. **Chat Wrappers**: Different models need different formats

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
    
    // Chat wrapper configuration (auto-detects by default)
    this.chatWrapper = options.chatWrapper ?? 'auto';

    // Internal state
    this._llama = null;
    this._model = null;
    this._context = null;
    this._chatSession = null;
    this._initialized = false;
  }

  async _call(input, config) {
    // Will implement next
  }
}
```

**Key decisions**:
- Stores configuration (temperature, max tokens, etc.)
- Supports custom chat wrappers (e.g., QwenChatWrapper)
- Tracks internal state (model, context, session)
- Lazy initialization (load on first use)

### Step 2: Model Initialization with Chat Wrapper Support

```javascript
export class LlamaCppLLM extends Runnable {
  // ... constructor ...

  /**
   * Initialize the model (lazy loading)
   */
  async _initialize() {
    if (this._initialized) return;

    if (this.verbose) {
      console.log(`Loading model: ${this.modelPath}`);
    }

    try {
      // Step 1: Get llama instance
      this._llama = await getLlama();

      // Step 2: Load the model
      this._model = await this._llama.loadModel({
        modelPath: this.modelPath
      });

      // Step 3: Create context (working memory)
      this._context = await this._model.createContext({
        contextSize: this.contextSize,
        batchSize: this.batchSize
      });

      // Step 4: Create chat session with optional chat wrapper
      const contextSequence = this._context.getSequence();
      const sessionConfig = { contextSequence };

      // Add custom chat wrapper if specified
      if (this.chatWrapper !== 'auto') {
        sessionConfig.chatWrapper = this.chatWrapper;
      }

      this._chatSession = new LlamaChatSession(sessionConfig);

      this._initialized = true;

      if (this.verbose) {
        console.log('✓ Model loaded successfully');
        if (this.chatWrapper !== 'auto') {
          console.log(`✓ Using custom chat wrapper: ${this.chatWrapper.constructor.name}`);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to initialize model at ${this.modelPath}: ${error.message}`
      );
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
    this._chatSession = null;
    this._initialized = false;

    if (this.verbose) {
      console.log('✓ Model resources disposed');
    }
  }
}
```

**Why lazy loading?**
- Models take 5-30 seconds to load
- Don't load until actually needed
- Share one loaded model across multiple calls

**Chat Wrapper Support**:
- Defaults to 'auto' (library auto-detects)
- Supports custom wrappers like QwenChatWrapper for specific models
- Useful for controlling model behavior (e.g., discouraging thoughts)

### Step 3: Converting Messages to Chat History

```javascript
export class LlamaCppLLM extends Runnable {
  // ... previous code ...

  /**
   * Convert our Message objects to node-llama-cpp chat history format
   */
  _messagesToChatHistory(messages) {
    return messages.map(msg => {
      // System messages: instructions for the AI
      if (msg._type === 'system') {
        return { type: 'system', text: msg.content };
      }
      // Human messages: user input
      else if (msg._type === 'human') {
        return { type: 'user', text: msg.content };
      }
      // AI messages: previous AI responses
      else if (msg._type === 'ai') {
        return { type: 'model', response: msg.content };
      }
      // Tool messages: results from tool execution
      else if (msg._type === 'tool') {
        return { type: 'system', text: `Tool Result: ${msg.content}` };
      }

      // Fallback: treat unknown types as user messages
      return { type: 'user', text: msg.content };
    });
  }
}
```

**Key insight**: This bridges between your standardized Message types and what node-llama-cpp expects. Different models may need different chat formats, which is why chat wrappers exist.

### Step 4: The Main Generation Method

```javascript
export class LlamaCppLLM extends Runnable {
  // ... previous code ...

  async _call(input, config = {}) {
    // Initialize if needed
    await this._initialize();

    // Clear history if requested (important for batch processing)
    if (config.clearHistory) {
      this._chatSession.setChatHistory([]);
    }

    // Handle different input types
    let messages;
    if (typeof input === 'string') {
      messages = [new HumanMessage(input)];
    } else if (Array.isArray(input)) {
      messages = input;
    } else {
      throw new Error('Input must be string or array of messages');
    }

    // Extract system message if present
    const systemMessages = messages.filter(msg => msg._type === 'system');
    const systemPrompt = systemMessages.length > 0
      ? systemMessages[0].content
      : '';

    // Convert our Message objects to llama.cpp format
    const chatHistory = this._messagesToChatHistory(messages);
    this._chatSession.setChatHistory(chatHistory);

    // ALWAYS set system prompt (either new value or empty string to clear)
    this._chatSession.systemPrompt = systemPrompt;

    try {
      // Build prompt options
      const promptOptions = {
        temperature: config.temperature ?? this.temperature,
        topP: config.topP ?? this.topP,
        topK: config.topK ?? this.topK,
        maxTokens: config.maxTokens ?? this.maxTokens,
        repeatPenalty: config.repeatPenalty ?? this.repeatPenalty,
        customStopTriggers: config.stopStrings ?? this.stopStrings
      };

      // Add random seed if temperature > 0 and no seed specified
      // This ensures randomness works properly
      if (promptOptions.temperature > 0 && config.seed === undefined) {
        promptOptions.seed = Math.floor(Math.random() * 1000000);
      } else if (config.seed !== undefined) {
        promptOptions.seed = config.seed;
      }

      // Generate response using prompt
      const response = await this._chatSession.prompt('', promptOptions);

      // Return as AIMessage for consistency
      return new AIMessage(response);
    } catch (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }
}
```

**Critical details**:
- Always clears and sets system prompt (prevents contamination)
- Adds random seed for proper temperature behavior
- Uses `customStopTriggers` (correct parameter name)
- Supports `clearHistory` for batch processing

### Step 5: Batch Processing with History Isolation

```javascript
export class LlamaCppLLM extends Runnable {
  // ... previous code ...

  /**
   * Batch processing with history isolation
   * 
   * Processes multiple inputs sequentially, ensuring each gets 
   * a clean chat history to prevent contamination.
   */
  async batch(inputs, config = {}) {
    const results = [];
    for (const input of inputs) {
      // Clear history before each batch item
      const result = await this._call(input, { 
        ...config, 
        clearHistory: true 
      });
      results.push(result);
    }
    return results;
  }
}
```

**Why sequential processing?**
- Local models can't run truly in parallel
- Sequential ensures proper history isolation
- Each item gets a clean slate

### Step 6: Streaming Support

For real-time output (like ChatGPT's typing effect):

```javascript
export class LlamaCppLLM extends Runnable {
  // ... previous code ...

  async *_stream(input, config = {}) {
    await this._initialize();

    // Clear history if requested
    if (config.clearHistory) {
      this._chatSession.setChatHistory([]);
    }

    // Handle input types (same as _call)
    let messages;
    if (typeof input === 'string') {
      messages = [new HumanMessage(input)];
    } else if (Array.isArray(input)) {
      messages = input;
    } else {
      throw new Error('Input must be string or array of messages');
    }

    // Extract system message
    const systemMessages = messages.filter(msg => msg._type === 'system');
    const systemPrompt = systemMessages.length > 0
      ? systemMessages[0].content
      : '';

    // Set up chat history
    const chatHistory = this._messagesToChatHistory(messages);
    this._chatSession.setChatHistory(chatHistory);

    // ALWAYS set system prompt
    this._chatSession.systemPrompt = systemPrompt;

    try {
      // Build prompt options
      const promptOptions = {
        temperature: config.temperature ?? this.temperature,
        topP: config.topP ?? this.topP,
        topK: config.topK ?? this.topK,
        maxTokens: config.maxTokens ?? this.maxTokens,
        repeatPenalty: config.repeatPenalty ?? this.repeatPenalty,
        customStopTriggers: config.stopStrings ?? this.stopStrings
      };

      // Add random seed
      if (promptOptions.temperature > 0 && config.seed === undefined) {
        promptOptions.seed = Math.floor(Math.random() * 1000000);
      } else if (config.seed !== undefined) {
        promptOptions.seed = config.seed;
      }

      // Use onTextChunk callback to collect chunks
      const self = this;
      promptOptions.onTextChunk = (chunk) => {
        self._currentStreamChunks = self._currentStreamChunks || [];
        self._currentStreamChunks.push(chunk);
      };

      // Initialize chunk collection
      this._currentStreamChunks = [];

      // Start generation
      const responsePromise = this._chatSession.prompt('', promptOptions);

      // Yield chunks as they become available
      let lastYieldedIndex = 0;

      // Poll for new chunks
      while (true) {
        // Yield any new chunks
        while (lastYieldedIndex < this._currentStreamChunks.length) {
          yield new AIMessage(this._currentStreamChunks[lastYieldedIndex], {
            additionalKwargs: { chunk: true }
          });
          lastYieldedIndex++;
        }

        // Check if generation is complete
        const isDone = await Promise.race([
          responsePromise.then(() => true),
          new Promise(resolve => setTimeout(() => resolve(false), 10))
        ]);

        if (isDone) {
          // Yield any remaining chunks
          while (lastYieldedIndex < this._currentStreamChunks.length) {
            yield new AIMessage(this._currentStreamChunks[lastYieldedIndex], {
              additionalKwargs: { chunk: true }
            });
            lastYieldedIndex++;
          }
          break;
        }
      }

      // Wait for completion
      await responsePromise;

      // Clean up
      delete this._currentStreamChunks;

    } catch (error) {
      throw new Error(`Streaming failed: ${error.message}`);
    }
  }
}
```

**Streaming challenges**:
- `onTextChunk` is a synchronous callback
- Can't yield directly from callback
- Use polling mechanism to yield as chunks arrive
- 10ms polling interval balances responsiveness vs CPU usage

## Real-World Examples

### Example 1: Simple Text Generation

```javascript
const llm = new LlamaCppLLM({
  modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf',
  temperature: 0.7,
  maxTokens: 100
});

// Simple string input
const response = await llm.invoke("What is 2+2?");
console.log(response.content); // "2+2 equals 4."
```

### Example 2: Conversation with System Prompt

```javascript
const messages = [
  new SystemMessage("You are a helpful math tutor."),
  new HumanMessage("What is 5*5?")
];

const response = await llm.invoke(messages);
console.log(response.content);
// "5 times 5 is 25. Here's a simple explanation..."
```

### Example 3: Using Qwen Chat Wrapper

```javascript
import { QwenChatWrapper } from 'node-llama-cpp';

const llm = new LlamaCppLLM({
  modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
  temperature: 0.7,
  chatWrapper: new QwenChatWrapper({
    thoughts: 'discourage'  // Prevents thinking tokens
  })
});

const response = await llm.invoke("What is AI?");
// Response won't include <think> tokens
```

### Example 4: Temperature Comparison

```javascript
const question = "Give me one adjective to describe winter:";

// Low temperature - consistent answers
llm._chatSession.setChatHistory([]);
const lowTemp = await llm.invoke(question, { temperature: 0.1 });
// Likely: "cold"

// High temperature - varied answers  
llm._chatSession.setChatHistory([]);
const highTemp = await llm.invoke(question, { temperature: 0.9 });
// Could be: "frosty", "snowy", "icy", "chilly"
```

### Example 5: Streaming Output

```javascript
console.log('Response: ');
for await (const chunk of llm.stream("Tell me a fun fact about space")) {
  process.stdout.write(chunk.content); // No newline
}
console.log('\n');

// Output streams in real-time as it's generated
```

### Example 6: Batch Processing

```javascript
const questions = [
  "What is Python?",
  "What is JavaScript?",
  "What is Rust?"
];

const answers = await llm.batch(questions);

questions.forEach((q, i) => {
  console.log(`Q: ${q}`);
  console.log(`A: ${answers[i].content}`);
  console.log();
});

// Each answer is independent - no history contamination!
```

### Example 7: Using in a Pipeline

```javascript
import { PromptTemplate } from '../prompts/prompt-template.js';

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

// Clear history for independent calls
const response = await llm.invoke(messages, { clearHistory: true });

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

// Don't forget to clear history in batch processing
// This will cause history contamination!
for (const q of questions) {
  await llm.invoke(q); // Sees all previous questions!
}

// Don't forget cleanup
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

### Tip 2: Use Batch Properly

```javascript
// This correctly isolates each question
const answers = await llm.batch(questions);

// Not: Sequential with contamination
for (const q of questions) {
  await llm.invoke(q); // History builds up!
}
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
const story = await llm.invoke(query, { temperature: 0.9 });
```

## Debugging Tips

### Tip 1: Enable Verbose Mode

```javascript
const llm = new LlamaCppLLM({
  modelPath: './model.gguf',
  verbose: true  // Shows loading and generation details
});
```

### Tip 2: Test History Isolation

```javascript
// Test batch processing
const questions = ["Q1", "Q2", "Q3"];
const answers = await llm.batch(questions);

// Each answer should be independent
// If Q2 mentions Q1, history contamination occurred!
```

### Tip 3: Verify Streaming

```javascript
// Verify streaming works
console.log('Testing stream:');
for await (const chunk of llm.stream("Count to 5")) {
  console.log('Chunk:', chunk.content);
}
```

## Common Mistakes

### ❌ Mistake 1: Not Clearing History in Batches

```javascript
// Bad: History contamination
const pipeline = formatter.pipe(llm).pipe(parser);
const results = await pipeline.batch(inputs); // Q2 sees Q1!
```

**Fix**: The LlamaCppLLM.batch() method automatically clears history:
```javascript
// Good: Each input is isolated
const results = await llm.batch(inputs);
```

### ❌ Mistake 2: Forgetting Random Seed

```javascript
// Bad: Temperature doesn't work
const response = await llm.invoke(prompt, { temperature: 0.9 });
// Without random seed, might get same answer
```

**Fix**: Our implementation automatically adds random seed:
```javascript
// Good: Randomness works properly
if (promptOptions.temperature > 0 && config.seed === undefined) {
  promptOptions.seed = Math.floor(Math.random() * 1000000);
}
```

### ❌ Mistake 3: Not Setting System Prompt Properly

```javascript
// Bad: System prompt persists between calls
await llm.invoke([new SystemMessage("Be creative"), ...]);
await llm.invoke([new HumanMessage("Hi")]); // Still "creative"!
```

**Fix**: Always set system prompt (empty string to clear):
```javascript
// Good: Always explicitly set or clear
this._chatSession.systemPrompt = systemPrompt || '';
```

## Mental Model

Think of the LLM wrapper as managing a conversation session:

```
Call 1: [System: "Be helpful", User: "Hi"]
        ↓
      Model generates response
        ↓
      Returns: AIMessage("Hello!")

Call 2: [User: "How are you?"]  
        ↓
      PROBLEM: Still has "Be helpful" system prompt!
      PROBLEM: Might remember "Hi" conversation!
        
SOLUTION: Clear history + reset system prompt between calls
```

The wrapper handles:
- Loading models once
- Converting Messages to chat history
- Managing system prompts
- Clearing history when needed
- Streaming chunks
- Random seeds for temperature
- Error handling

## Summary

Congratulations! You now understand how to wrap a complex LLM library as a clean, composable Runnable with proper state management.

### Key Takeaways

1. **Lazy loading saves time**: Load models only when needed
2. **Messages enable structure**: Proper conversation formatting
3. **History isolation prevents bugs**: Critical for batch processing
4. **System prompts must be managed**: Always set or clear explicitly
5. **Streaming improves UX**: Real-time output feels responsive
6. **Random seeds enable temperature**: Required for randomness
7. **Chat wrappers add flexibility**: Support different models
8. **Sequential batch processing**: Local models can't truly parallelize

### What You Built

A LLM wrapper that:
- ✅ Loads models lazily
- ✅ Handles Messages properly
- ✅ Manages chat history correctly
- ✅ Isolates batches
- ✅ Supports streaming
- ✅ Handles system prompts
- ✅ Supports chat wrappers
- ✅ Adds random seeds for temperature
- ✅ Provides good error messages

### Critical Implementation Details

```javascript
// 1. Always clear and set system prompt
this._chatSession.systemPrompt = systemPrompt || '';

// 2. Use clearHistory for batch isolation
async batch(inputs, config = {}) {
  const results = [];
  for (const input of inputs) {
    const result = await this._call(input, { 
      ...config, 
      clearHistory: true 
    });
    results.push(result);
  }
  return results;
}

// 3. Add random seed for temperature
if (promptOptions.temperature > 0 && config.seed === undefined) {
  promptOptions.seed = Math.floor(Math.random() * 1000000);
}

// 4. Use correct parameter names
customStopTriggers: config.stopStrings ?? this.stopStrings
```

### What's Next

In the next lesson, we'll explore **Context & Configuration** - how to pass state and settings through chains.

**Preview**: You'll learn:
- RunnableConfig object
- Callback systems
- Metadata tracking
- Debug modes

➡️ [Continue to Lesson 4: Context & Configuration](04-context.md)

## Additional Resources

- [node-llama-cpp Documentation](https://node-llama-cpp.withcat.ai)
- [Chat Wrappers Guide](https://node-llama-cpp.withcat.ai/guide/chat-wrapper)
- [Temperature Guide](https://node-llama-cpp.withcat.ai/guide/chat-session#temperature)
- [GGUF Model Format](https://huggingface.co/docs/hub/gguf)

## Questions & Discussion

**Q: Why do we always set system prompt instead of only when present?**

A: To prevent contamination. If call 1 sets a system prompt but call 2 doesn't, call 2 would still use call 1's system prompt. Always setting (even to empty string) ensures clean state.

**Q: Why sequential batch processing instead of parallel?**

A: Local models (node-llama-cpp) can't run true parallel inference on a single model instance. The library serializes requests internally, so parallel Promise.all() provides no benefit and can cause race conditions on the shared chat session.

**Q: Why do we need random seeds for temperature?**

A: The node-llama-cpp library states: "The randomness of the temperature can be controlled by the seed parameter. Setting a specific seed and a specific temperature will yield the same response every time for the same input." Without a random seed, high temperature might still give deterministic results.

**Q: Can I use multiple models simultaneously?**

A: Yes! Each LlamaCppLLM instance can have a different model. Just be aware of memory constraints - each model takes several GB of RAM.

**Q: What's the difference between customStopTriggers and stopStrings?**

A: `customStopTriggers` is the correct parameter name in node-llama-cpp. We accept `stopStrings` in our config for a more intuitive API, then map it to `customStopTriggers` internally.

---

**Built with ❤️ for learners who want to understand AI agents deeply**

[← Previous: Messages](02-messages.md) | [Tutorial Index](../README.md) | [Next: Context →](04-context.md)