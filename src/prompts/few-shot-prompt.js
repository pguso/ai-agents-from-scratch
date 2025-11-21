import { BasePromptTemplate } from './base-prompt-template.js';
import { PromptTemplate } from './prompt-template.js';

/**
 * Prompt template that includes examples (few-shot learning)
 *
 * Example:
 *   const fewShot = new FewShotPromptTemplate({
 *       examples: [
 *           { input: "2+2", output: "4" },
 *           { input: "3+5", output: "8" }
 *       ],
 *       examplePrompt: new PromptTemplate({
 *           template: "Input: {input}\nOutput: {output}",
 *           inputVariables: ["input", "output"]
 *       }),
 *       prefix: "Solve these math problems:",
 *       suffix: "Input: {input}\nOutput:",
 *       inputVariables: ["input"]
 *   });
 */
export class FewShotPromptTemplate extends BasePromptTemplate {
  constructor(options = {}) {
    super(options);
    this.examples = options.examples || [];
    this.examplePrompt = options.examplePrompt;
    this.prefix = options.prefix || '';
    this.suffix = options.suffix || '';
    this.exampleSeparator = options.exampleSeparator || '\n\n';
  }

  /**
   * Format the few-shot prompt
   */
  async format(values) {
    this._validateInput(values);
    const allValues = this._mergePartialAndUserVariables(values);

    const parts = [];

    // Add prefix
    if (this.prefix) {
      const prefixTemplate = new PromptTemplate({ template: this.prefix });
      parts.push(await prefixTemplate.format(allValues));
    }

    // Add formatted examples
    if (this.examples.length > 0) {
      const exampleStrings = await Promise.all(
          this.examples.map(ex => this.examplePrompt.format(ex))
      );
      parts.push(exampleStrings.join(this.exampleSeparator));
    }

    // Add suffix
    if (this.suffix) {
      const suffixTemplate = new PromptTemplate({ template: this.suffix });
      parts.push(await suffixTemplate.format(allValues));
    }

    return parts.join('\n\n');
  }
}