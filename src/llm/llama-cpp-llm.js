/**
 * LlamaCppLLM - node-llama-cpp wrapper as a Runnable
 *
 * @module llm/llama-cpp-llm
 */

import { Runnable } from '../core/runnable.js';
import { AIMessage, HumanMessage } from '../core/message.js';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

/**
 * LlamaCppLLM - A Runnable wrapper for node-llama-cpp
 *
 * Wraps your LLM calls from agent fundamentals into a reusable,
 * composable Runnable component.
 *
 * Key benefits over raw node-llama-cpp:
 * - Composable with other Runnables via .pipe()
 * - Supports batch processing multiple inputs
 * - Built-in streaming support
 * - Consistent interface across all LLMs
 * - Easy to swap with other LLM providers
 */
export class LlamaCppLLM extends Runnable {
  /**
   * Create a new LlamaCppLLM instance
   *
   * @param {Object} options - Configuration options
   * @param {string} options.modelPath - Path to your GGUF model file (REQUIRED)
   * @param {number} [options.temperature=0.7] - Sampling temperature (0-1)
   *   - Lower (0.1): More focused, deterministic
   *   - Higher (0.9): More creative, random
   * @param {number} [options.topP=0.9] - Nucleus sampling threshold
   * @param {number} [options.topK=40] - Top-K sampling parameter
   * @param {number} [options.maxTokens=2048] - Maximum tokens to generate
   * @param {number} [options.repeatPenalty=1.1] - Penalty for repeating tokens
   * @param {number} [options.contextSize=4096] - Context window size
   * @param {number} [options.batchSize=512] - Batch processing size
   * @param {boolean} [options.verbose=false] - Enable debug logging
   * @param {string[]} [options.stopStrings] - Strings that stop generation
   * @param {Object} [options.chatWrapper] - Custom chat wrapper instance (e.g., QwenChatWrapper)
   *   - If not provided, the library will automatically select the best wrapper for your model
   *
   * @example Basic Setup
   * ```javascript
   * const llm = new LlamaCppLLM({
   *   modelPath: './models/llama-2-7b.gguf',
   *   temperature: 0.7
   * });
   * ```
   *
   * @example With Qwen Chat Wrapper (Discourage Thoughts)
   * ```javascript
   * import { QwenChatWrapper } from 'node-llama-cpp';
   *
   * const llm = new LlamaCppLLM({
   *   modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
   *   temperature: 0.7,
   *   chatWrapper: new QwenChatWrapper({
   *     thoughts: 'discourage'
   *   })
   * });
   * ```
   *
   * @example Different Configurations for Different Tasks
   * ```javascript
   * // Creative writing (higher temperature)
   * const creative = new LlamaCppLLM({
   *   modelPath: './model.gguf',
   *   temperature: 0.9,
   *   maxTokens: 1000
   * });
   *
   * // Factual responses (lower temperature)
   * const factual = new LlamaCppLLM({
   *   modelPath: './model.gguf',
   *   temperature: 0.1,
   *   maxTokens: 500
   * });
   * ```
   */
  constructor(options = {}) {
    super();

    // Validate required options
    this.modelPath = options.modelPath;
    if (!this.modelPath) {
      throw new Error(
          'modelPath is required. Example: new LlamaCppLLM({ modelPath: "./model.gguf" })'
      );
    }

    // Generation parameters
    // These control how the LLM generates text - same as in your fundamentals!
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

    // Chat wrapper configuration
    // If not provided, LlamaChatSession will auto-select the best wrapper
    this.chatWrapper = options.chatWrapper ?? 'auto';

    // Stop strings - when the model sees these, it stops generating
    // Default includes common chat separators
    this.stopStrings = options.stopStrings ?? [
      'Human:',
      'User:',
      '\n\nHuman:',
      '\n\nUser:'
    ];

    // Internal state (lazy initialized)
    this._llama = null;
    this._model = null;
    this._context = null;
    this._chatSession = null;
    this._initialized = false;
  }

  /**
   * Initialize model (lazy loading)
   *
   * This loads the model only when first needed, not at construction.
   * This pattern is useful because model loading is slow - we only
   * want to do it once and only when we actually need it.
   *
   * @private
   * @throws {Error} If model loading fails
   */
  async _initialize() {
    // Skip if already initialized
    if (this._initialized) return;

    if (this.verbose) {
      console.log(`Loading model: ${this.modelPath}`);
    }

    try {
      // Step 1: Get the llama instance
      this._llama = await getLlama();

      // Step 2: Load the model file
      this._model = await this._llama.loadModel({
        modelPath: this.modelPath
      });

      // Step 3: Create a context for generation
      this._context = await this._model.createContext({
        contextSize: this.contextSize,
        batchSize: this.batchSize
      });

      // Step 4: Create a chat session
      // This manages conversation history for us
      const contextSequence = this._context.getSequence();
      const sessionConfig = {
        contextSequence
      };

      // Add chatWrapper if specified (otherwise LlamaChatSession uses "auto")
      if (this.chatWrapper !== 'auto') {
        sessionConfig.chatWrapper = this.chatWrapper;
      }

      this._chatSession = new LlamaChatSession(sessionConfig);

      this._initialized = true;

      if (this.verbose) {
        console.log('✓ Model loaded successfully');
        if (this.chatWrapper !== 'auto') {
          console.log(`✓ Using custom chat wrapper: ${this.chatWrapper.constructor.name}`);
        } else {
          console.log('✓ Using auto-detected chat wrapper');
        }
      }
    } catch (error) {
      throw new Error(
          `Failed to initialize model at ${this.modelPath}: ${error.message}`
      );
    }
  }

  /**
   * Convert our Message objects to node-llama-cpp chat history format
   *
   * This bridges between our standardized Message types and what
   * node-llama-cpp expects. Think of it as a translator.
   *
   * @private
   * @param {Array<Message>} messages - Array of Message objects
   * @returns {Array<Object>} Chat history in llama.cpp format
   *
   * @example
   * ```javascript
   * // Input: Our messages
   * [
   *   new SystemMessage("You are helpful"),
   *   new HumanMessage("Hi"),
   *   new AIMessage("Hello!")
   * ]
   *
   * // Output: llama.cpp format
   * [
   *   { type: 'system', text: 'You are helpful' },
   *   { type: 'user', text: 'Hi' },
   *   { type: 'model', response: 'Hello!' }
   * ]
   * ```
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
        // Convert tool results to system messages
        return { type: 'system', text: `Tool Result: ${msg.content}` };
      }

      // Fallback: treat unknown types as user messages
      return { type: 'user', text: msg.content };
    });
  }

  /**
   * Clean up model response
   *
   * Sometimes models include extra prefixes or suffixes.
   * This cleans them up for a better user experience.
   *
   * @private
   * @param {string} response - Raw model response
   * @returns {string} Cleaned response
   *
   * @example
   * ```javascript
   * // Before: "Assistant: The answer is 42\n\nHuman: "
   * // After:  "The answer is 42"
   * ```
   */
  _cleanResponse(response) {
    let cleaned = response.trim();

    // Remove "Assistant:" or "AI:" prefixes
    cleaned = cleaned.replace(/^(Assistant|AI):\s*/i, '');

    // Remove any conversation continuations
    cleaned = cleaned.replace(/\n\n(Human|User):.*$/s, '');

    return cleaned.trim();
  }

  /**
   * Main generation method - this is where your LLM calls happen!
   *
   * This is the same as calling `llm.chat(messages)` in your fundamentals,
   * but wrapped to work with the Runnable interface.
   *
   * @async
   * @param {string|Array<Message>} input - User input or message array
   * @param {Object} [config={}] - Runtime configuration
   * @param {number} [config.temperature] - Override temperature for this call
   * @param {number} [config.maxTokens] - Override max tokens for this call
   * @param {boolean} [config.clearHistory=false] - Clear chat history before this call
   * @returns {Promise<AIMessage>} Generated response as AIMessage
   *
   * @example String Input (Simplest)
   * ```javascript
   * const response = await llm.invoke("What is AI?");
   * console.log(response.content); // "AI is..."
   * ```
   *
   * @example Message Array Input (Full Control)
   * ```javascript
   * const messages = [
   *   new SystemMessage("You are a helpful assistant"),
   *   new HumanMessage("What is AI?")
   * ];
   * const response = await llm.invoke(messages);
   * ```
   *
   * @example Runtime Configuration
   * ```javascript
   * // Override temperature for this specific call
   * const response = await llm.invoke(
   *   "Write a creative story",
   *   { temperature: 0.9, maxTokens: 500 }
   * );
   * ```
   *
   * @example Clear History Before Call
   * ```javascript
   * // Ensure fresh context with no prior conversation
   * const response = await llm.invoke(
   *   "What is AI?",
   *   { clearHistory: true }
   * );
   * ```
   *
   * @example In a Pipeline (Composition)
   * ```javascript
   * const pipeline = promptFormatter
   *   .pipe(llm)
   *   .pipe(outputParser);
   *
   * const result = await pipeline.invoke("user input");
   * ```
   */
  async _call(input, config = {}) {
    // Ensure model is loaded (only happens once)
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
      throw new Error(
          'Input must be a string or array of messages. ' +
          'Example: "Hello" or [new HumanMessage("Hello")]'
      );
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

      // Generate response using prompt (simpler than promptWithMeta for non-streaming)
      const response = await this._chatSession.prompt('', promptOptions);

      // Return as AIMessage for consistency
      return new AIMessage(response);
    } catch (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  /**
   * Batch processing with history isolation
   *
   * Processes multiple inputs sequentially, ensuring each gets a clean chat history.
   * Note: Local models process requests sequentially, so there's no performance
   * benefit compared to calling invoke() multiple times.
   *
   * @async
   * @param {Array<string|Array<Message>>} inputs - Array of inputs to process
   * @param {Object} [config={}] - Runtime configuration
   * @returns {Promise<Array<AIMessage>>} Array of generated responses
   *
   * @example
   * ```javascript
   * const questions = ["What is AI?", "What is ML?", "What is DL?"];
   * const answers = await llm.batch(questions);
   * ```
   */
  async batch(inputs, config = {}) {
    const results = [];
    for (const input of inputs) {
      // Clear history before each batch item to prevent contamination
      const result = await this._call(input, { ...config, clearHistory: true });
      results.push(result);
    }
    return results;
  }

  /**
   * Streaming generation - show results as they're generated!
   *
   * This is the same as _call() but yields chunks as they arrive,
   * like the typing effect you see in ChatGPT.
   *
   * @async
   * @generator
   * @param {string|Array<Message>} input - User input or message array
   * @param {Object} [config={}] - Runtime configuration
   * @yields {AIMessage} Chunks of generated text
   *
   * @example Basic Streaming
   * ```javascript
   * console.log("Response: ");
   * for await (const chunk of llm.stream("Tell me a story")) {
   *   process.stdout.write(chunk.content); // Print without newline
   * }
   * console.log("\nDone!");
   * ```
   *
   * @example Streaming in a Pipeline
   * ```javascript
   * const pipeline = promptFormatter
   *   .pipe(llm)
   *   .pipe(parser);
   *
   * // Only the last step (parser) gets streamed chunks
   * for await (const chunk of pipeline.stream(input)) {
   *   console.log(chunk);
   * }
   * ```
   *
   * @example Building a Chat UI
   * ```javascript
   * async function streamToUI(input) {
   *   let fullResponse = '';
   *
   *   for await (const chunk of llm.stream(input)) {
   *     fullResponse += chunk.content;
   *     updateUI(fullResponse); // Update your UI in real-time
   *   }
   * }
   * ```
   */
  async* stream(input, config = {}) {
    await this._initialize();

    // Clear history if requested
    if (config.clearHistory) {
      this._chatSession.setChatHistory([]);
    }

    // Handle different input types (same as _call)
    let messages;
    if (typeof input === 'string') {
      messages = [new HumanMessage(input)];
    } else if (Array.isArray(input)) {
      messages = input;
    } else {
      throw new Error(
          'Input must be a string or array of messages for streaming'
      );
    }

    // Extract system message if present
    const systemMessages = messages.filter(msg => msg._type === 'system');
    const systemPrompt = systemMessages.length > 0
        ? systemMessages[0].content
        : '';

    // Set up chat history
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
      if (promptOptions.temperature > 0 && config.seed === undefined) {
        promptOptions.seed = Math.floor(Math.random() * 1000000);
      } else if (config.seed !== undefined) {
        promptOptions.seed = config.seed;
      }

      // Use onTextChunk callback to stream chunks as they arrive
      const self = this;
      promptOptions.onTextChunk = (chunk) => {
        // This callback is synchronous, so we can't yield directly
        // We'll collect chunks and yield them after
        self._currentStreamChunks = self._currentStreamChunks || [];
        self._currentStreamChunks.push(chunk);
      };

      // Initialize chunk collection
      this._currentStreamChunks = [];

      // Start generation (this will call onTextChunk as it generates)
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

      // Wait for the full response
      await responsePromise;

      // Clean up
      delete this._currentStreamChunks;

    } catch (error) {
      throw new Error(`Streaming failed: ${error.message}`);
    }
  }

  /**
   * Cleanup resources
   *
   * LLMs hold resources in memory. Call this when you're done
   * to free them up properly.
   *
   * @async
   * @returns {Promise<void>}
   *
   * @example
   * ```javascript
   * const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
   *
   * try {
   *   const response = await llm.invoke("Hello");
   *   console.log(response.content);
   * } finally {
   *   await llm.dispose(); // Always clean up!
   * }
   * ```
   *
   * @example With Multiple Uses
   * ```javascript
   * const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
   *
   * // Use it many times
   * await llm.invoke("Question 1");
   * await llm.invoke("Question 2");
   * await llm.batch(["Q3", "Q4", "Q5"]);
   *
   * // Clean up when completely done
   * await llm.dispose();
   * ```
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

  /**
   * String representation for debugging
   *
   * @returns {string} Human-readable representation
   *
   * @example
   * ```javascript
   * const llm = new LlamaCppLLM({ modelPath: './llama-2-7b.gguf' });
   * console.log(llm.toString());
   * // "LlamaCppLLM(model=./llama-2-7b.gguf)"
   *
   * // Useful in pipelines
   * const pipeline = formatter.pipe(llm).pipe(parser);
   * console.log(pipeline.toString());
   * // "PromptFormatter() | LlamaCppLLM(model=./llama-2-7b.gguf) | OutputParser()"
   * ```
   */
  toString() {
    return `LlamaCppLLM(model=${this.modelPath})`;
  }
}

export default LlamaCppLLM;