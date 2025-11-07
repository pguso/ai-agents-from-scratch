/**
 * Message System - Typed conversation data structures
 *
 * Implementation similar to LangChain.js message system
 *
 * @module src/core/message.js
 */

/**
 * BaseMessage - Foundation for all message types
 *
 * Contains common functionality:
 * - Content storage
 * - Metadata tracking
 * - Timestamps
 * - Serialization
 */
export class BaseMessage {
  constructor(content, additionalKwargs = {}) {
    this.content = content;
    this.additionalKwargs = additionalKwargs;
    this.timestamp = Date.now();
    this.id = this.generateId();
  }

  /**
   * Generate unique ID for this message
   */
  generateId() {
    return `msg_${this.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the message type (overridden in subclasses)
   */
  get type() {
    throw new Error('Subclass must implement type getter');
  }

  /**
   * Convert to JSON for storage/transmission
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      timestamp: this.timestamp,
      ...this.additionalKwargs
    };
  }

  /**
   * Create message from JSON
   */
  static fromJSON(json) {
    const MessageClass = MESSAGE_TYPES[json.type];
    if (!MessageClass) {
      throw new Error(`Unknown message type: ${json.type}`);
    }

    const message = new MessageClass(json.content, json.additionalKwargs);
    message.id = json.id;
    message.timestamp = json.timestamp;
    return message;
  }

  /**
   * Format for display
   */
  toString() {
    const date = new Date(this.timestamp).toLocaleTimeString();
    return `[${date}] ${this.type}: ${this.content}`;
  }
}

/**
 * SystemMessage - Instructions for the AI
 *
 * Sets the context, role, and constraints for the assistant.
 * Typically appears at the start of conversations.
 */
export class SystemMessage extends BaseMessage {
  constructor(content, additionalKwargs = {}) {
    super(content, additionalKwargs);
  }

  get type() {
    return 'system';
  }

  /**
   * System messages often need special formatting
   */
  toPromptFormat() {
    return {
      role: 'system',
      content: this.content
    };
  }
}

/**
 * HumanMessage - User input
 *
 * Represents messages from the human/user.
 * The primary input the AI responds to.
 */
export class HumanMessage extends BaseMessage {
  constructor(content, additionalKwargs = {}) {
    super(content, additionalKwargs);
  }

  get type() {
    return 'human';
  }

  toPromptFormat() {
    return {
      role: 'user',
      content: this.content
    };
  }
}

/**
 * AIMessage - Assistant responses
 *
 * Represents messages from the AI assistant.
 * Can include tool calls for function execution.
 */
export class AIMessage extends BaseMessage {
  constructor(content, additionalKwargs = {}) {
    super(content, additionalKwargs);

    // Tool calls are requests to execute functions
    this.toolCalls = additionalKwargs.toolCalls || [];
  }

  get type() {
    return 'ai';
  }

  /**
   * Check if this message requests tool execution
   */
  hasToolCalls() {
    return this.toolCalls.length > 0;
  }

  /**
   * Get specific tool call by index
   */
  getToolCall(index = 0) {
    return this.toolCalls[index];
  }

  toPromptFormat() {
    const formatted = {
      role: 'assistant',
      content: this.content
    };

    if (this.hasToolCalls()) {
      formatted.tool_calls = this.toolCalls;
    }

    return formatted;
  }
}

/**
 * ToolMessage - Tool execution results
 *
 * Contains the output from executing a tool/function.
 * Sent back to the AI to inform its next response.
 */
export class ToolMessage extends BaseMessage {
  constructor(content, toolCallId, additionalKwargs = {}) {
    super(content, additionalKwargs);
    this.toolCallId = toolCallId;
  }

  get type() {
    return 'tool';
  }

  toPromptFormat() {
    return {
      role: 'tool',
      content: this.content,
      tool_call_id: this.toolCallId
    };
  }
}

/**
 * Registry mapping type strings to message classes
 */
export const MESSAGE_TYPES = {
  'system': SystemMessage,
  'human': HumanMessage,
  'ai': AIMessage,
  'tool': ToolMessage
};

/**
 * Helper function to convert messages to prompt format
 *
 * @param {Array<BaseMessage>} messages - Array of messages
 * @returns {Array<Object>} Messages in LLM format
 */
export function messagesToPromptFormat(messages) {
  return messages.map(msg => msg.toPromptFormat());
}

/**
 * Helper function to filter messages by type
 *
 * @param {Array<BaseMessage>} messages - Array of messages
 * @param {string} type - Message type to filter
 * @returns {Array<BaseMessage>} Filtered messages
 */
export function filterMessagesByType(messages, type) {
  return messages.filter(msg => msg._type === type);
}

/**
 * Helper function to get the last N messages
 *
 * @param {Array<BaseMessage>} messages - Array of messages
 * @param {number} n - Number of messages to get
 * @returns {Array<BaseMessage>} Last N messages
 */
export function getLastMessages(messages, n) {
  return messages.slice(-n);
}

/**
 * Helper to merge consecutive messages of the same type
 * Useful for reducing token count
 *
 * @param {Array<BaseMessage>} messages - Array of messages
 * @returns {Array<BaseMessage>} Merged messages
 */
export function mergeConsecutiveMessages(messages) {
  if (messages.length === 0) return [];

  const merged = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const current = messages[i];
    const last = merged[merged.length - 1];

    // Merge if same type and both are strings
    if (
        current._type === last._type &&
        typeof current.content === 'string' &&
        typeof last.content === 'string' &&
        current._type !== 'tool' // Don't merge tool messages
    ) {
      // Create new merged message
      const MessageClass = MESSAGE_CLASSES[current._type];
      const mergedContent = last.content + '\n' + current.content;
      merged[merged.length - 1] = new MessageClass(mergedContent, {
        name: last.name,
        additionalKwargs: { ...last.additionalKwargs, merged: true }
      });
    } else {
      merged.push(current);
    }
  }

  return merged;
}

export default {
  BaseMessage,
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  MESSAGE_TYPES
};