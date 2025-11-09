/**
 * LlamaCppLLM
 *
 * node-llama-cpp wrapper implementing the Runnable interface
 *
 * @module src/llm/llama-cpp-llm.js
 */

import {getLlama, LlamaChatSession} from 'node-llama-cpp';
import {AIMessage, HumanMessage, Runnable} from "../core/index.js";

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
    this._type = null;
    this._initialized = false;
  }

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

    // Create a reusable session
    this._session = new LlamaChatSession({
      contextSequence: this._context.getSequence()
    });

    this._initialized = true;
    console.log('Model loaded successfully');
  }

  async _call(input, config = {}) {
    // Initialize if needed
    await this._initialize();

    // Handle different input types
    let prompt;
    if (typeof input === 'string') {
      // Simple string input
      prompt = input;
    } else if (Array.isArray(input)) {
      // Array of messages - take the last human message
      const lastHumanMsg = input.filter(m => m._type === 'human').pop();
      prompt = lastHumanMsg ? lastHumanMsg.content : '';
    } else {
      throw new Error('Input must be string or array of messages');
    }

    try {
      // Generate response using the session
      const response = await this._session.prompt(prompt, {
        temperature: config.temperature ?? this.temperature,
        maxTokens: config.maxTokens ?? this.maxTokens
      });

      // Return as AIMessage
      return new AIMessage(response);
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  // TODO implement correctly
  async *_stream(input, config = {}) {
    await this._initialize();

    // Handle different input types
    let prompt;
    if (typeof input === 'string') {
      prompt = input;
    } else if (Array.isArray(input)) {
      // Array of messages - take the last human message
      const lastHumanMsg = input.filter(m => m._type === 'human').pop();
      prompt = lastHumanMsg ? lastHumanMsg.content : '';
    } else {
      throw new Error('Input must be string or array of messages');
    }

    try {
      let fullResponse = '';

      // Use onTextChunk callback to stream tokens
      await this._session.prompt(prompt, {
        temperature: config.temperature ?? this.temperature,
        maxTokens: config.maxTokens ?? this.maxTokens,
        onTextChunk: (chunk) => {
          fullResponse += chunk;
          // Note: We can't yield from inside a callback
          // We'll need to handle this differently
        }
      });

      // Since we can't yield from callback, yield the full response
      // For true streaming, we need a different approach
      yield new AIMessage(fullResponse);

    } catch (error) {
      console.error('Error streaming response:', error);
      throw error;
    }
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