/**
 * RunnableConfig
 *
 * Configuration object passed through runnable chains
 *
 * @module src/core/context.js
 */
export class RunnableConfig {
  constructor(options = {}) {
    // Callbacks for monitoring
    this.callbacks = options.callbacks || [];

    // Metadata (arbitrary data)
    this.metadata = options.metadata || {};

    // Tags for filtering/organization
    this.tags = options.tags || [];

    // Recursion limit (prevent infinite loops)
    this.recursionLimit = options.recursionLimit ?? 25;

    // Runtime overrides for generation parameters
    this.configurable = options.configurable || {};
  }

  /**
   * Merge with another config (child inherits from parent)
   */
  merge(other) {
    return new RunnableConfig({
      callbacks: [...this.callbacks, ...(other.callbacks || [])],
      metadata: { ...this.metadata, ...(other.metadata || {}) },
      tags: [...this.tags, ...(other.tags || [])],
      recursionLimit: other.recursionLimit ?? this.recursionLimit,
      configurable: { ...this.configurable, ...(other.configurable || {}) }
    });
  }

  /**
   * Create a child config with additional settings
   */
  child(options = {}) {
    return this.merge(new RunnableConfig(options));
  }
}

export default RunnableConfig;
