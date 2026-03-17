import {BaseChain} from './base-chain.js';
import {sleep} from '../utils/retry.js';
import { asAgentError } from '../utils/errors.js';

/**
 * Chain that automatically retries on failure
 * Useful for handling transient errors (network, rate limits, etc.)
 *
 * Example:
 *   const retryChain = new RetryChain({
 *       chain: llmChain,
 *       maxRetries: 3,
 *       retryDelay: 1000,
 *       backoffMultiplier: 2,
 *       retryableErrors: ['RATE_LIMIT', 'TIMEOUT']
 *   });
 */
export class RetryChain extends BaseChain {
    constructor(options = {}) {
        super();

        if (!options.chain) {
            throw new Error('RetryChain requires a chain to wrap');
        }

        this.chain = options.chain;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.backoffMultiplier = options.backoffMultiplier || 2;
        this.retryableErrors = options.retryableErrors || null;
        this.onRetry = options.onRetry || null;
    }

    get inputKeys() {
        return this.chain.inputKeys;
    }

    get outputKeys() {
        return this.chain.outputKeys;
    }

    /**
     * Check if error is retryable
     */
    _isRetryable(error) {
        const normalized = asAgentError(error);
        if (normalized.retryable) return true;

        if (!this.retryableErrors) {
            // Retry all errors if no filter specified
            return true;
        }

        const errorMessage = normalized.message || '';
        return this.retryableErrors.some(pattern =>
            errorMessage.includes(pattern)
        );
    }

    /**
     * Execute chain with retry logic
     */
    async _call(inputs, config) {
        let lastError;
        let delay = this.retryDelay;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.chain.invoke(inputs, config);
            } catch (error) {
                lastError = asAgentError(error, {
                    details: { attempt, maxRetries: this.maxRetries, chain: this.chain?.name || 'unknown' }
                });

                // Check if we should retry
                if (attempt === this.maxRetries || !this._isRetryable(lastError)) {
                    throw lastError;
                }

                // Call retry callback if provided
                if (this.onRetry) {
                    await this.onRetry({
                        attempt: attempt + 1,
                        maxRetries: this.maxRetries,
                        error: lastError,
                        nextDelay: delay
                    });
                }

                // Wait before retrying
                await sleep(delay);

                // Exponential backoff
                delay *= this.backoffMultiplier;
            }
        }

        throw lastError;
    }

    get _chainType() {
        return 'retry_chain';
    }
}