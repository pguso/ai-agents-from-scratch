import { BaseChain } from './base-chain.js';
import { asAgentError, ChainStepError } from '../utils/errors.js';

/**
 * Chain that runs multiple chains in sequence
 * Output of one chain becomes input to the next
 *
 * Example:
 *   const sequential = new SequentialChain({
 *       chains: [summaryChain, translateChain],
 *       inputVariables: ["article"],
 *       outputVariables: ["translation"]
 *   });
 */
export class SequentialChain extends BaseChain {
  constructor(options = {}) {
    super();

    if (!options.chains || options.chains.length === 0) {
      throw new Error('SequentialChain requires at least one chain');
    }

    this.chains = options.chains;
    this._inputKeys = options.inputVariables ||
        this.chains[0].inputKeys;
    this._outputKeys = options.outputVariables ||
        this.chains[this.chains.length - 1].outputKeys;
  }

  get inputKeys() {
    return this._inputKeys;
  }

  get outputKeys() {
    return this._outputKeys;
  }

  /**
   * Run chains sequentially, accumulating outputs
   */
  async _call(inputs, config) {
    this._validateInputs(inputs);

    let currentInputs = { ...inputs };

    // Run each chain, accumulating outputs
    for (let i = 0; i < this.chains.length; i++) {
      const chain = this.chains[i];

      try {
        const output = await chain.invoke(currentInputs, config);

        // Merge output into inputs for next chain
        if (typeof output === 'object' && !Array.isArray(output)) {
          currentInputs = { ...currentInputs, ...output };
        } else {
          // If output is primitive, use chain's output key
          const outputKey = chain.outputKeys[0];
          currentInputs[outputKey] = output;
        }
      } catch (error) {
        const normalized = asAgentError(error, {
          details: { stepIndex: i, stepName: chain.name, chain: this.name }
        });
        throw new ChainStepError(`Chain step ${i} (${chain.name}) failed`, {
          cause: normalized,
          retryable: normalized.retryable,
          userMessage: normalized.userMessage,
          details: normalized.details
        });
      }
    }

    // Return only specified output variables
    if (this._outputKeys.length === 1) {
      return currentInputs[this._outputKeys[0]];
    } else {
      const outputs = {};
      for (const key of this._outputKeys) {
        outputs[key] = currentInputs[key];
      }
      return outputs;
    }
  }

  get _chainType() {
    return 'sequential_chain';
  }
}