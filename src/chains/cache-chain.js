import { BaseChain } from './base-chain.js';
import crypto from 'crypto';

/**
 * Chain that caches results to avoid redundant LLM calls
 *
 * Example:
 *   const cacheChain = new CacheChain({
 *       chain: expensiveChain,
 *       cache: new InMemoryCache({ maxSize: 1000 }),
 *       ttl: 3600000  // 1 hour
 *   });
 */
export class CacheChain extends BaseChain {
    constructor(options = {}) {
        super();

        if (!options.chain) {
            throw new Error('CacheChain requires a chain to wrap');
        }

        this.chain = options.chain;
        this.cache = options.cache || new Map();
        this.ttl = options.ttl || null;  // Time to live in ms
        this.keyGenerator = options.keyGenerator || this._defaultKeyGenerator;
        this.onCacheHit = options.onCacheHit || null;
        this.onCacheMiss = options.onCacheMiss || null;
    }

    get inputKeys() {
        return this.chain.inputKeys;
    }

    get outputKeys() {
        return this.chain.outputKeys;
    }

    /**
     * Generate cache key from inputs
     */
    _defaultKeyGenerator(inputs) {
        const sortedInputs = Object.keys(inputs)
            .sort()
            .reduce((acc, key) => {
                acc[key] = inputs[key];
                return acc;
            }, {});

        const inputString = JSON.stringify(sortedInputs);
        return crypto.createHash('sha256').update(inputString).digest('hex');
    }

    /**
     * Check if cached value is still valid
     */
    _isValid(cacheEntry) {
        if (!this.ttl) {
            return true;
        }

        const age = Date.now() - cacheEntry.timestamp;
        return age < this.ttl;
    }

    /**
     * Execute chain with caching
     */
    async _call(inputs, config) {
        const cacheKey = this.keyGenerator(inputs);

        // Check cache
        const cached = this.cache.get(cacheKey);

        if (cached && this._isValid(cached)) {
            // Cache hit
            if (this.onCacheHit) {
                await this.onCacheHit({
                    cacheKey,
                    inputs,
                    cachedAt: cached.timestamp
                });
            }

            return cached.result;
        }

        // Cache miss - execute chain
        if (this.onCacheMiss) {
            await this.onCacheMiss({
                cacheKey,
                inputs
            });
        }

        const result = await this.chain.invoke(inputs, config);

        // Store in cache
        this.cache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });

        return result;
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.entries()).map(([key, value]) => ({
                key,
                timestamp: value.timestamp,
                age: Date.now() - value.timestamp
            }))
        };
    }

    get _chainType() {
        return 'cache_chain';
    }
}