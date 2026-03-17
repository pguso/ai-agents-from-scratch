/**
 * TimeoutManager
 *
 * Timeout wrapper for async operations
 *
 * @module src/utils/timeout.js
 */

import { TimeoutError } from './errors.js';

export class TimeoutManager {
  constructor(options = {}) {
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 30_000;
  }

  async run(promiseOrFn, options = {}) {
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const details = options.details ?? null;

    const promise = typeof promiseOrFn === 'function'
      ? Promise.resolve().then(() => promiseOrFn())
      : promiseOrFn;

    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, { details }));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export default TimeoutManager;
