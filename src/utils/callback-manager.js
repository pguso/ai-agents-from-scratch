/**
 * CallbackManager
 *
 * Event system for logging and monitoring
 *
 * @module src/utils/callback-manager.js
 */
export class CallbackManager {
  constructor(callbacks = []) {
    this.callbacks = callbacks;
  }

  /**
   * Add a callback
   */
  add(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Call onStart for all callbacks
   */
  async handleStart(runnable, input, config) {
    await Promise.all(
        this.callbacks.map(cb =>
            this._safeCall(() => cb.onStart(runnable, input, config))
        )
    );
  }

  /**
   * Call onEnd for all callbacks
   */
  async handleEnd(runnable, output, config) {
    await Promise.all(
        this.callbacks.map(cb =>
            this._safeCall(() => cb.onEnd(runnable, output, config))
        )
    );
  }

  /**
   * Call onError for all callbacks
   */
  async handleError(runnable, error, config) {
    await Promise.all(
        this.callbacks.map(cb =>
            this._safeCall(() => cb.onError(runnable, error, config))
        )
    );
  }

  /**
   * Call onLLMNewToken for all callbacks
   */
  async handleLLMNewToken(token, config) {
    await Promise.all(
        this.callbacks.map(cb =>
            this._safeCall(() => cb.onLLMNewToken(token, config))
        )
    );
  }

  /**
   * Call onChainStep for all callbacks
   */
  async handleChainStep(stepName, output, config) {
    await Promise.all(
        this.callbacks.map(cb =>
            this._safeCall(() => cb.onChainStep(stepName, output, config))
        )
    );
  }

  /**
   * Safely call a callback (don't let one callback crash others)
   */
  async _safeCall(fn) {
    try {
      await fn();
    } catch (error) {
      console.error('Callback error:', error);
      // Don't throw - callbacks shouldn't break the pipeline
    }
  }
}

export default CallbackManager;
