/**
 * RetryManager
 *
 * Retry logic with exponential backoff
 */

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 250;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
    this.maxDelayMs = options.maxDelayMs ?? 10_000;
    this.jitter = options.jitter ?? 0.1; // 10% jitter
    this.isRetryable = options.isRetryable ?? (() => true);
  }

  async run(fn, options = {}) {
    const maxRetries = options.maxRetries ?? this.maxRetries;
    let delay = options.retryDelayMs ?? this.retryDelayMs;
    const backoffMultiplier = options.backoffMultiplier ?? this.backoffMultiplier;

    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn({ attempt });
      } catch (err) {
        lastErr = err;
        const retryable = (options.isRetryable ?? this.isRetryable)(err);

        if (!retryable || attempt === maxRetries) {
          throw err;
        }

        const jitterFactor = 1 + (Math.random() * 2 - 1) * this.jitter;
        const sleepMs = Math.min(this.maxDelayMs, Math.max(0, Math.floor(delay * jitterFactor)));
        await sleep(sleepMs);
        delay = Math.min(this.maxDelayMs, delay * backoffMultiplier);
      }
    }

    throw lastErr;
  }
}

export default RetryManager;
