import { BasePromptTemplate } from './base-prompt-template.js';
import { SystemMessage, HumanMessage, AIMessage } from '../core/message.js';
import { PromptTemplate } from './prompt-template.js';

/**
 * Template for chat-based conversations
 * Returns an array of Message objects
 *
 * Example:
 *   const prompt = ChatPromptTemplate.fromMessages([
 *       ["system", "You are a {role}"],
 *       ["human", "{input}"]
 *   ]);
 *
 *   const messages = await prompt.format({
 *       role: "translator",
 *       input: "Hello"
 *   });
 *   // [SystemMessage(...), HumanMessage(...)]
 */
export class ChatPromptTemplate extends BasePromptTemplate {
  constructor(options = {}) {
    super(options);
    this.promptMessages = options.promptMessages || [];
  }

  /**
   * Format into array of Message objects
   */
  async format(values) {
    this._validateInput(values);
    const allValues = this._mergePartialAndUserVariables(values);

    const messages = [];
    for (const [role, template] of this.promptMessages) {
      const content = await this._formatMessageTemplate(template, allValues);
      messages.push(this._createMessage(role, content));
    }

    return messages;
  }

  /**
   * Format a single message template
   */
  async _formatMessageTemplate(template, values) {
    if (typeof template === 'string') {
      const promptTemplate = new PromptTemplate({ template });
      return await promptTemplate.format(values);
    }
    return template;
  }

  /**
   * Create appropriate Message object for role
   */
  _createMessage(role, content) {
    switch (role.toLowerCase()) {
      case 'system':
        return new SystemMessage(content);
      case 'human':
      case 'user':
        return new HumanMessage(content);
      case 'ai':
      case 'assistant':
        return new AIMessage(content);
      default:
        throw new Error(`Unknown message role: ${role}`);
    }
  }

  /**
   * Static helper to create from message list
   */
  static fromMessages(messages, options = {}) {
    const promptMessages = messages.map(msg => {
      if (Array.isArray(msg)) {
        return msg; // [role, template]
      }
      throw new Error('Each message must be [role, template] array');
    });

    // Extract all input variables from all templates
    const inputVariables = new Set();
    for (const [, template] of promptMessages) {
      if (typeof template === 'string') {
        const matches = template.match(/\{(\w+)\}/g) || [];
        matches.forEach(m => inputVariables.add(m.slice(1, -1)));
      }
    }

    return new ChatPromptTemplate({
      promptMessages,
      inputVariables: Array.from(inputVariables),
      ...options
    });
  }
}