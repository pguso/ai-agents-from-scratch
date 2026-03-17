import { BaseChain } from './base-chain.js';

/**
 * Chain that transforms inputs using a function
 * No LLM involved - useful for data preprocessing/postprocessing
 *
 * Example:
 *   const transform = new TransformChain({
 *       transform: async (inputs) => ({
 *           cleanedText: inputs.text.toLowerCase().trim()
 *       }),
 *       inputVariables: ["text"],
 *       outputVariables: ["cleanedText"]
 *   });
 */
export class TransformChain extends BaseChain {
  constructor(options = {}) {
    super();

    if (!options.transform || typeof options.transform !== 'function') {
      throw new Error('TransformChain requires a transform function');
    }

    this.transformFunc = options.transform;
    this._inputKeys = options.inputVariables || [];
    this._outputKeys = options.outputVariables || [];
  }

  get inputKeys() {
    return this._inputKeys;
  }

  get outputKeys() {
    return this._outputKeys;
  }

  /**
   * Apply transformation function
   */
  async _call(inputs, config) {
    // No input validation - transform function decides what it needs
    const result = await this.transformFunc(inputs, config);

    if (typeof result !== 'object' || Array.isArray(result)) {
      throw new Error(
          'Transform function must return an object with output variables'
      );
    }

    // If single output variable, return just the value
    if (this._outputKeys.length === 1) {
      return result[this._outputKeys[0]];
    }

    return result;
  }

  get _chainType() {
    return 'transform_chain';
  }
}