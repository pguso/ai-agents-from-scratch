import { BasePromptTemplate } from './base-prompt-template.js';
import { SystemMessage } from '../core/message.js';
import { PromptTemplate } from './prompt-template.js';

/**
 * Template specifically for system messages
 * Returns a single SystemMessage object
 *
 * Example:
 *   const systemPrompt = new SystemMessagePromptTemplate({
 *       template: "You are a {role} assistant specialized in {domain}. {instructions}",
 *       inputVariables: ["role", "domain", "instructions"]
 *   });
 *
 *   const message = await systemPrompt.format({
 *       role: "helpful",
 *       domain: "cooking",
 *       instructions: "Always provide recipe alternatives."
 *   });
 *   // SystemMessage("You are a helpful assistant specialized in cooking. Always provide recipe alternatives.")
 */
export class SystemMessagePromptTemplate extends BasePromptTemplate {
  constructor(options = {}) {
    super(options);
    this.prompt = options.prompt || new PromptTemplate({
      template: options.template,
      inputVariables: options.inputVariables,
      partialVariables: options.partialVariables
    });

    // Inherit input variables from inner prompt
    if (!options.inputVariables) {
      this.inputVariables = this.prompt.inputVariables;
    }
  }

  /**
   * Format into a SystemMessage object
   */
  async format(values) {
    this._validateInput(values);
    const allValues = this._mergePartialAndUserVariables(values);

    const content = await this.prompt.format(allValues);
    return new SystemMessage(content);
  }

  /**
   * Static helper to create from template string
   */
  static fromTemplate(template, options = {}) {
    return new SystemMessagePromptTemplate({
      template,
      ...options
    });
  }

  /**
   * Create with partial variables pre-filled
   * Useful for setting default context that can be overridden
   */
  static fromTemplateWithPartials(template, partialVariables = {}, options = {}) {
    const promptTemplate = new PromptTemplate({ template });
    const inputVariables = promptTemplate.inputVariables.filter(
        v => !(v in partialVariables)
    );

    return new SystemMessagePromptTemplate({
      template,
      inputVariables,
      partialVariables,
      ...options
    });
  }
}