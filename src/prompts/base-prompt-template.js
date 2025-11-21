/**
 * BasePromptTemplate
 *
 * Abstract prompt template class*
 */

import { Runnable } from '../core/runnable.js';

/**
 * Base class for all prompt templates
 */
export class BasePromptTemplate extends Runnable {
  constructor(options = {}) {
    super();
    this.inputVariables = options.inputVariables || [];
    this.partialVariables = options.partialVariables || {};
  }

  /**
   * Format the prompt with given values
   * @abstract
   */
  async format(values) {
    throw new Error('Subclasses must implement format()');
  }

  /**
   * Runnable interface: invoke returns formatted prompt
   */
  async _call(input, config) {
    return await this.format(input);
  }

  /**
   * Validate that all required variables are provided
   */
  _validateInput(values) {
    const provided = { ...this.partialVariables, ...values };
    const missing = this.inputVariables.filter(
        key => !(key in provided)
    );

    if (missing.length > 0) {
      throw new Error(
          `Missing required input variables: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Merge partial variables with provided values
   */
  _mergePartialAndUserVariables(values) {
    return { ...this.partialVariables, ...values };
  }
}