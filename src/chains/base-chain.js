import { Runnable } from '../core/runnable.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Base class for all chains
 * A chain orchestrates multiple components (prompts, LLMs, parsers)
 */
export class BaseChain extends Runnable {
  constructor() {
    super();
    this.name = this.constructor.name;
  }

  /**
   * Input keys this chain expects
   * @abstract
   */
  get inputKeys() {
    throw new Error(`${this.name} must implement inputKeys getter`);
  }

  /**
   * Output keys this chain produces
   * @abstract
   */
  get outputKeys() {
    throw new Error(`${this.name} must implement outputKeys getter`);
  }

  /**
   * Run the chain logic
   * @abstract
   */
  async _call(inputs, config) {
    throw new Error(`${this.name} must implement _call()`);
  }

  /**
   * Validate that input contains all required keys
   */
  _validateInputs(inputs) {
    const missing = this.inputKeys.filter(key => !(key in inputs));
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required input keys for ${this.name}: ${missing.join(', ')}`,
        {
          details: {
            chain: this.name,
            missingKeys: missing
          }
        }
      );
    }
  }

  /**
   * Prepare outputs with proper keys
   */
  _prepareOutputs(result) {
    // If result is already an object with the right keys, return it
    if (typeof result === 'object' && !Array.isArray(result)) {
      return result;
    }

    // Otherwise, wrap in output key
    const outputKey = this.outputKeys[0] || 'output';
    return { [outputKey]: result };
  }
}