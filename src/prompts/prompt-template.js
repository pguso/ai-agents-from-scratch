import { BasePromptTemplate } from './base-prompt-template.js';

/**
 * Simple string template with {variable} placeholders
 *
 * Example:
 *   const prompt = new PromptTemplate({
 *       template: "Translate to {language}: {text}",
 *       inputVariables: ["language", "text"]
 *   });
 *
 *   await prompt.format({ language: "Spanish", text: "Hello" });
 *   // "Translate to Spanish: Hello"
 */
export class PromptTemplate extends BasePromptTemplate {
  constructor(options = {}) {
    super(options);
    this.template = options.template;

    // Auto-detect input variables if not provided
    if (!options.inputVariables) {
      this.inputVariables = this._extractInputVariables(this.template);
    }
  }

  /**
   * Format the template with provided values
   */
  async format(values) {
    this._validateInput(values);
    const allValues = this._mergePartialAndUserVariables(values);

    let result = this.template;
    for (const [key, value] of Object.entries(allValues)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Extract variable names from template string
   * Finds all {variable} patterns
   */
  _extractInputVariables(template) {
    const matches = template.match(/\{(\w+)\}/g) || [];
    return matches.map(match => match.slice(1, -1));
  }

  /**
   * Static helper to create from template string
   */
  static fromTemplate(template, options = {}) {
    return new PromptTemplate({
      template,
      ...options
    });
  }
}