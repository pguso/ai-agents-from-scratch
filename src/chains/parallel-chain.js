import { BaseChain } from './base-chain.js';

/**
 * Chain that executes multiple chains in parallel
 * Useful for independent operations that can run concurrently
 *
 * Example:
 *   const parallel = new ParallelChain({
 *       chains: {
 *           summary: summaryChain,
 *           sentiment: sentimentChain,
 *           keywords: keywordChain
 *       }
 *   });
 */
export class ParallelChain extends BaseChain {
    constructor(options = {}) {
        super();

        if (!options.chains || Object.keys(options.chains).length === 0) {
            throw new Error('ParallelChain requires at least one chain');
        }

        this.chains = options.chains;
        this.failFast = options.failFast !== false;
    }

    get inputKeys() {
        // Collect all unique input keys from all chains
        const keys = new Set();
        for (const chain of Object.values(this.chains)) {
            chain.inputKeys.forEach(key => keys.add(key));
        }
        return Array.from(keys);
    }

    get outputKeys() {
        // Output keys are the chain names
        return Object.keys(this.chains);
    }

    /**
     * Execute all chains in parallel
     */
    async _call(inputs, config) {
        this._validateInputs(inputs);

        // Create promises for all chains
        const promises = Object.entries(this.chains).map(
            async ([name, chain]) => {
                try {
                    const result = await chain.invoke(inputs, config);
                    return { name, success: true, result };
                } catch (error) {
                    if (this.failFast) {
                        throw error;
                    }
                    return { name, success: false, error };
                }
            }
        );

        // Wait for all to complete
        const results = await Promise.all(promises);

        // Combine results
        const output = {};
        const errors = {};

        for (const { name, success, result, error } of results) {
            if (success) {
                output[name] = result;
            } else {
                errors[name] = error;
            }
        }

        // If any errors occurred and we're not in failFast mode
        if (Object.keys(errors).length > 0 && !this.failFast) {
            output._errors = errors;
        }

        return output;
    }

    get _chainType() {
        return 'parallel_chain';
    }
}