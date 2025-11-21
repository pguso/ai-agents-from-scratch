import { BasePromptTemplate } from './base-prompt-template.js';

/**
 * Compose multiple prompts into a pipeline
 *
 * Example:
 *   const pipeline = new PipelinePromptTemplate({
 *       finalPrompt: mainPrompt,
 *       pipelinePrompts: [
 *           { name: "context", prompt: contextPrompt },
 *           { name: "instructions", prompt: instructionPrompt }
 *       ]
 *   });
 */
export class PipelinePromptTemplate extends BasePromptTemplate {
  constructor(options = {}) {
    super(options);
    this.finalPrompt = options.finalPrompt;
    this.pipelinePrompts = options.pipelinePrompts || [];

    // Collect all input variables
    this.inputVariables = this._collectInputVariables();
  }

  /**
   * Format by running pipeline prompts first, then final prompt
   */
  async format(values) {
    this._validateInput(values);
    const allValues = this._mergePartialAndUserVariables(values);

    // Format each pipeline prompt and collect results
    const pipelineResults = {};
    for (const { name, prompt } of this.pipelinePrompts) {
      pipelineResults[name] = await prompt.format(allValues);
    }

    // Merge with original values and format final prompt
    const finalValues = { ...allValues, ...pipelineResults };
    return await this.finalPrompt.format(finalValues);
  }

  /**
   * Collect input variables from all prompts
   */
  _collectInputVariables() {
    const vars = new Set(this.finalPrompt.inputVariables);

    for (const { prompt } of this.pipelinePrompts) {
      prompt.inputVariables.forEach(v => vars.add(v));
    }

    // Remove pipeline output names (they're generated)
    this.pipelinePrompts.forEach(({ name }) => vars.delete(name));

    return Array.from(vars);
  }
}