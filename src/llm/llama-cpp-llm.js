/**
 * LlamaCppLLM - node-llama-cpp wrapper as a Runnable
 *
 * @module llm/llama-cpp-llm
 */

import { Runnable } from '../core/runnable.js';
import { AIMessage, HumanMessage } from '../core/message.js';
import { getLlama } from 'node-llama-cpp';

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
    this._chatSession = null;
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

      // Create a chat session with the context sequence
      const contextSequence = this._context.getSequence();
      this._chatSession = new this._llama.LlamaChatSession({
        contextSequence
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
   * Convert messages to chat history format
   */
  _messagesToChatHistory(messages) {
    return messages.map(msg => {
      if (msg._type === 'system') {
        return { type: 'system', text: msg.content };
      } else if (msg._type === 'human') {
        return { type: 'user', text: msg.content };
      } else if (msg._type === 'ai') {
        return { type: 'model', response: msg.content };
      } else if (msg._type === 'tool') {
        // Handle tool messages - this depends on your specific needs
        return { type: 'system', text: `Tool Result: ${msg.content}` };
      }
      return { type: 'user', text: msg.content };
    });
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

    // Extract system message if present
    const systemMessages = messages.filter(msg => msg._type === 'system');
    const systemPrompt = systemMessages.length > 0 ? systemMessages[0].content : undefined;

    // Set chat history from messages
    const chatHistory = this._messagesToChatHistory(messages);
    this._chatSession.setChatHistory(chatHistory);

    // If there's a system message, set it
    if (systemPrompt) {
      this._chatSession.systemPrompt = systemPrompt;
    }

    try {
      // Use the chat session to generate a response
      const response = await this._chatSession.prompt('', {
        temperature: config.temperature ?? this.temperature,
        topP: config.topP ?? this.topP,
        topK: config.topK ?? this.topK,
        maxTokens: config.maxTokens ?? this.maxTokens,
        repeatPenalty: config.repeatPenalty ?? this.repeatPenalty,
        stopStrings: config.stopStrings ?? this.stopStrings
      });

      return new AIMessage(response);
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

    // Extract system message if present
    const systemMessages = messages.filter(msg => msg._type === 'system');
    const systemPrompt = systemMessages.length > 0 ? systemMessages[0].content : undefined;

    // Set chat history from messages
    const chatHistory = this._messagesToChatHistory(messages);
    this._chatSession.setChatHistory(chatHistory);

    // If there's a system message, set it
    if (systemPrompt) {
      this._chatSession.systemPrompt = systemPrompt;
    }

    try {
      let fullResponse = '';

      // Use the chat session to generate a streaming response
      const response = await this._chatSession.prompt('', {
        temperature: config.temperature ?? this.temperature,
        topP: config.topP ?? this.topP,
        topK: config.topK ?? this.topK,
        maxTokens: config.maxTokens ?? this.maxTokens,
        repeatPenalty: config.repeatPenalty ?? this.repeatPenalty,
        stopStrings: config.stopStrings ?? this.stopStrings,
        onTextChunk: (chunk) => {
          fullResponse += chunk;
          // Yield each chunk as an AIMessage
          yield new AIMessage(chunk, {
            additionalKwargs: { chunk: true }
          });
        }
      });

      // Yield final message
      yield new AIMessage(response, {
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
    this._chatSession = null;
    this._initialized = false;
  }

  toString() {
    return `LlamaCppLLM(model=${this.modelPath})`;
  }
}

export default LlamaCppLLM;