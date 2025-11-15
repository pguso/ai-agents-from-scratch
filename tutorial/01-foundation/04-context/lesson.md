# Context & Configuration

**Part 1: Foundation - Lesson 4**

> Passing state, callbacks, and metadata through Runnable chains

## Overview

You've learned Runnables (Lesson 1), Messages (Lesson 2), and LLM Wrappers (Lesson 3). Now we tackle a critical question: **How do we pass configuration, callbacks, and state through complex chains without cluttering our code?**

The answer is **RunnableConfig** - a powerful pattern that threads context through every step of a pipeline, enabling logging, debugging, authentication, and more without changing your core logic.

## Why Does This Matter?

### The Problem: Configuration Chaos

Without a proper context system:

```javascript
// Bad: Configuration everywhere
async function complexPipeline(input, temperature, callbacks, debug, userId) {
  const result1 = await step1(input, temperature, debug);
  callbacks.onStep('step1', result1);
  
  const result2 = await step2(result1, userId, debug);
  callbacks.onStep('step2', result2);
  
  const result3 = await step3(result2, temperature, callbacks, debug);
  callbacks.onStep('step3', result3);
  
  return result3;
}

// Every function needs to know about every configuration option!
```

Problems:
- 😫 Every function signature becomes huge
- 😫 Adding new config requires changing every function
- 😫 Hard to add features like logging or metrics
- 😫 Impossible to intercept at specific points
- 😫 Can't pass user context through chains

### The Solution: RunnableConfig

With RunnableConfig:

```javascript
// Good: Config flows automatically
const config = {
  temperature: 0.7,
  callbacks: [loggingCallback, metricsCallback],
  metadata: { userId: 'user_123', sessionId: 'sess_456' },
  tags: ['production', 'api-v2']
};

const result = await pipeline.invoke(input, config);

// Every Runnable in the pipeline receives config automatically
// No need to pass it manually at each step!
```

Much cleaner! And infinitely extensible.

## Learning Objectives

By the end of this lesson, you will:

- ✅ Understand the RunnableConfig pattern
- ✅ Implement a callback system for monitoring
- ✅ Add metadata and tags for tracking
- ✅ Build configurable Runnables
- ✅ Create custom callbacks for logging and metrics
- ✅ Debug chains with visibility into each step
- ✅ Understand how LangChain's callbacks work

## Core Concepts

### What is RunnableConfig?

RunnableConfig is an object that flows through your entire pipeline, carrying:

1. **Callbacks** - Functions called at specific points (logging, metrics, debugging)
2. **Metadata** - Arbitrary data (user IDs, session info, request context)
3. **Tags** - Labels for filtering and organization
4. **Recursion Limit** - Prevent infinite loops
5. **Runtime Configuration** - Override default settings (temperature, max tokens)

### The Flow

```
User calls: runnable.invoke(input, config)
                              ↓
              ┌───────────────┴──────────────┐
              │                              │
         Config passed to every step         │
              │                              │
    ┌─────────┼─────────┬──────────┬────────┼────┐
    │         │         │          │        │    │
  Step1    Step2     Step3      Step4    Step5  ...
    │         │         │          │        │
    └─────────┴─────────┴──────────┴────────┘
              │
         All use same config
         All trigger callbacks
         All have access to metadata
```

### Key Benefits

1. **Separation of concerns**: Logic separate from monitoring
2. **Composability**: Add features without changing code
3. **Observability**: See what's happening at every step
4. **Flexibility**: Runtime configuration override
5. **Extensibility**: Easy to add new capabilities

## Implementation Deep Dive

### Step 1: The RunnableConfig Object

```javascript
/**
 * RunnableConfig - Configuration passed through chains
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
```

**Why this design?**
- Immutable merging (doesn't modify original)
- Child configs inherit parent settings
- Easy to add new fields without breaking existing code

### Step 2: The Callback System

```javascript
/**
 * BaseCallback - Abstract callback handler
 */
export class BaseCallback {
  /**
   * Called when a Runnable starts
   */
  async onStart(runnable, input, config) {
    // Override in subclass
  }

  /**
   * Called when a Runnable completes successfully
   */
  async onEnd(runnable, output, config) {
    // Override in subclass
  }

  /**
   * Called when a Runnable errors
   */
  async onError(runnable, error, config) {
    // Override in subclass
  }

  /**
   * Called for LLM token streaming
   */
  async onLLMNewToken(token, config) {
    // Override in subclass
  }

  /**
   * Called when a chain step completes
   */
  async onChainStep(stepName, output, config) {
    // Override in subclass
  }
}
```

**Callback Lifecycle**:
```
invoke() called
      ↓
   onStart()
      ↓
   [execution]
      ↓
   onEnd() or onError()
```

### Step 3: CallbackManager

Manages multiple callbacks and ensures they all get called:

```javascript
/**
 * CallbackManager - Manages multiple callbacks
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
```

**Key insight**: Callbacks can fail without breaking the pipeline.

### Step 4: Integrating with Runnable

Update the Runnable base class to use config:

```javascript
export class Runnable {
  constructor() {
    this._name = this.constructor.name;
  }

  /**
   * Execute with config support
   */
  async invoke(input, config = {}) {
    // Normalize config to RunnableConfig instance
    const runnableConfig = config instanceof RunnableConfig 
      ? config 
      : new RunnableConfig(config);

    // Create callback manager
    const callbackManager = new CallbackManager(runnableConfig.callbacks);

    try {
      // Notify callbacks: starting
      await callbackManager.handleStart(this, input, runnableConfig);

      // Execute the runnable
      const output = await this._call(input, runnableConfig);

      // Notify callbacks: success
      await callbackManager.handleEnd(this, output, runnableConfig);

      return output;
    } catch (error) {
      // Notify callbacks: error
      await callbackManager.handleError(this, error, runnableConfig);
      throw error;
    }
  }

  /**
   * Internal execution - subclasses implement this
   */
  async _call(input, config) {
    throw new Error(`${this._name} must implement _call() method`);
  }

  // ... stream(), batch(), pipe() methods remain the same ...
}
```

Now every Runnable automatically:
- ✅ Receives config
- ✅ Triggers callbacks
- ✅ Handles errors properly
- ✅ Passes config to nested Runnables

### Step 5: Useful Built-in Callbacks

```javascript
/**
 * ConsoleCallback - Logs to console
 */
export class ConsoleCallback extends BaseCallback {
  constructor(options = {}) {
    super();
    this.verbose = options.verbose ?? true;
    this.colors = options.colors ?? true;
  }

  async onStart(runnable, input, config) {
    if (this.verbose) {
      console.log(`\n▶ Starting: ${runnable._name}`);
      console.log(`  Input:`, this._format(input));
    }
  }

  async onEnd(runnable, output, config) {
    if (this.verbose) {
      console.log(`✓ Completed: ${runnable._name}`);
      console.log(`  Output:`, this._format(output));
    }
  }

  async onError(runnable, error, config) {
    console.error(`✗ Error in ${runnable._name}:`, error.message);
  }

  async onLLMNewToken(token, config) {
    process.stdout.write(token);
  }

  _format(value) {
    if (typeof value === 'string') {
      return value.length > 100 ? value.substring(0, 97) + '...' : value;
    }
    return JSON.stringify(value, null, 2);
  }
}
```

```javascript
/**
 * MetricsCallback - Tracks timing and counts
 */
export class MetricsCallback extends BaseCallback {
  constructor() {
    super();
    this.metrics = {
      calls: {},
      totalTime: {},
      errors: {}
    };
    this.startTimes = new Map();
  }

  async onStart(runnable, input, config) {
    const name = runnable._name;
    this.startTimes.set(name, Date.now());
    
    this.metrics.calls[name] = (this.metrics.calls[name] || 0) + 1;
  }

  async onEnd(runnable, output, config) {
    const name = runnable._name;
    const startTime = this.startTimes.get(name);
    
    if (startTime) {
      const duration = Date.now() - startTime;
      this.metrics.totalTime[name] = (this.metrics.totalTime[name] || 0) + duration;
      this.startTimes.delete(name);
    }
  }

  async onError(runnable, error, config) {
    const name = runnable._name;
    this.metrics.errors[name] = (this.metrics.errors[name] || 0) + 1;
  }

  getReport() {
    const report = [];
    
    for (const [name, calls] of Object.entries(this.metrics.calls)) {
      const totalTime = this.metrics.totalTime[name] || 0;
      const avgTime = calls > 0 ? (totalTime / calls).toFixed(2) : 0;
      const errors = this.metrics.errors[name] || 0;
      
      report.push({
        runnable: name,
        calls,
        avgTime: `${avgTime}ms`,
        totalTime: `${totalTime}ms`,
        errors
      });
    }
    
    return report;
  }

  reset() {
    this.metrics = { calls: {}, totalTime: {}, errors: {} };
    this.startTimes.clear();
  }
}
```

```javascript
/**
 * FileCallback - Logs to file
 */
export class FileCallback extends BaseCallback {
  constructor(filename) {
    super();
    this.filename = filename;
    this.logs = [];
  }

  async onStart(runnable, input, config) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      event: 'start',
      runnable: runnable._name,
      input: this._serialize(input)
    });
  }

  async onEnd(runnable, output, config) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      event: 'end',
      runnable: runnable._name,
      output: this._serialize(output)
    });
  }

  async onError(runnable, error, config) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      event: 'error',
      runnable: runnable._name,
      error: error.message
    });
  }

  async flush() {
    const fs = await import('fs/promises');
    await fs.writeFile(
      this.filename,
      JSON.stringify(this.logs, null, 2),
      'utf-8'
    );
    this.logs = [];
  }

  _serialize(value) {
    if (typeof value === 'string') return value;
    if (value?.content) return value.content; // Message
    return JSON.stringify(value);
  }
}
```

## Complete Implementation

Here's the full context system:

```javascript
/**
 * Context & Configuration System
 * 
 * @module core/context
 */

/**
 * RunnableConfig - Configuration passed through chains
 */
export class RunnableConfig {
  constructor(options = {}) {
    this.callbacks = options.callbacks || [];
    this.metadata = options.metadata || {};
    this.tags = options.tags || [];
    this.recursionLimit = options.recursionLimit ?? 25;
    this.configurable = options.configurable || {};
  }

  merge(other) {
    return new RunnableConfig({
      callbacks: [...this.callbacks, ...(other.callbacks || [])],
      metadata: { ...this.metadata, ...(other.metadata || {}) },
      tags: [...this.tags, ...(other.tags || [])],
      recursionLimit: other.recursionLimit ?? this.recursionLimit,
      configurable: { ...this.configurable, ...(other.configurable || {}) }
    });
  }

  child(options = {}) {
    return this.merge(new RunnableConfig(options));
  }
}

/**
 * BaseCallback - Base class for callbacks
 */
export class BaseCallback {
  async onStart(runnable, input, config) {}
  async onEnd(runnable, output, config) {}
  async onError(runnable, error, config) {}
  async onLLMNewToken(token, config) {}
  async onChainStep(stepName, output, config) {}
}

/**
 * CallbackManager - Manages multiple callbacks
 */
export class CallbackManager {
  constructor(callbacks = []) {
    this.callbacks = callbacks;
  }

  add(callback) {
    this.callbacks.push(callback);
  }

  async handleStart(runnable, input, config) {
    await Promise.all(
      this.callbacks.map(cb => 
        this._safeCall(() => cb.onStart(runnable, input, config))
      )
    );
  }

  async handleEnd(runnable, output, config) {
    await Promise.all(
      this.callbacks.map(cb => 
        this._safeCall(() => cb.onEnd(runnable, output, config))
      )
    );
  }

  async handleError(runnable, error, config) {
    await Promise.all(
      this.callbacks.map(cb => 
        this._safeCall(() => cb.onError(runnable, error, config))
      )
    );
  }

  async handleLLMNewToken(token, config) {
    await Promise.all(
      this.callbacks.map(cb => 
        this._safeCall(() => cb.onLLMNewToken(token, config))
      )
    );
  }

  async handleChainStep(stepName, output, config) {
    await Promise.all(
      this.callbacks.map(cb => 
        this._safeCall(() => cb.onChainStep(stepName, output, config))
      )
    );
  }

  async _safeCall(fn) {
    try {
      await fn();
    } catch (error) {
      console.error('Callback error:', error);
    }
  }
}

/**
 * ConsoleCallback - Logs to console with colors
 */
export class ConsoleCallback extends BaseCallback {
  constructor(options = {}) {
    super();
    this.verbose = options.verbose ?? true;
  }

  async onStart(runnable, input, config) {
    if (this.verbose) {
      console.log(`\n▶ Starting: ${runnable._name}`);
      console.log(`  Input:`, this._format(input));
      if (config.metadata && Object.keys(config.metadata).length > 0) {
        console.log(`  Metadata:`, config.metadata);
      }
    }
  }

  async onEnd(runnable, output, config) {
    if (this.verbose) {
      console.log(`✓ Completed: ${runnable._name}`);
      console.log(`  Output:`, this._format(output));
    }
  }

  async onError(runnable, error, config) {
    console.error(`✗ Error in ${runnable._name}:`, error.message);
  }

  async onLLMNewToken(token, config) {
    process.stdout.write(token);
  }

  _format(value) {
    if (typeof value === 'string') {
      return value.length > 100 ? value.substring(0, 97) + '...' : value;
    }
    if (value?.content) {
      return value.content.substring(0, 100);
    }
    return JSON.stringify(value, null, 2);
  }
}

/**
 * MetricsCallback - Tracks performance metrics
 */
export class MetricsCallback extends BaseCallback {
  constructor() {
    super();
    this.metrics = {
      calls: {},
      totalTime: {},
      errors: {}
    };
    this.startTimes = new Map();
  }

  async onStart(runnable, input, config) {
    const key = `${runnable._name}_${Date.now()}_${Math.random()}`;
    this.startTimes.set(key, { name: runnable._name, time: Date.now() });
    
    const name = runnable._name;
    this.metrics.calls[name] = (this.metrics.calls[name] || 0) + 1;
  }

  async onEnd(runnable, output, config) {
    const name = runnable._name;
    
    // Find the most recent start time for this runnable
    let startTime = null;
    for (const [key, value] of this.startTimes.entries()) {
      if (value.name === name) {
        startTime = value.time;
        this.startTimes.delete(key);
        break;
      }
    }
    
    if (startTime) {
      const duration = Date.now() - startTime;
      this.metrics.totalTime[name] = (this.metrics.totalTime[name] || 0) + duration;
    }
  }

  async onError(runnable, error, config) {
    const name = runnable._name;
    this.metrics.errors[name] = (this.metrics.errors[name] || 0) + 1;
  }

  getReport() {
    const report = [];
    
    for (const [name, calls] of Object.entries(this.metrics.calls)) {
      const totalTime = this.metrics.totalTime[name] || 0;
      const avgTime = calls > 0 ? (totalTime / calls).toFixed(2) : 0;
      const errors = this.metrics.errors[name] || 0;
      
      report.push({
        runnable: name,
        calls,
        avgTime: `${avgTime}ms`,
        totalTime: `${totalTime}ms`,
        errors,
        successRate: calls > 0 ? `${((calls - errors) / calls * 100).toFixed(1)}%` : '0%'
      });
    }
    
    return report;
  }

  printReport() {
    console.log('\n📊 Performance Report:');
    console.log('─'.repeat(80));
    console.table(this.getReport());
  }

  reset() {
    this.metrics = { calls: {}, totalTime: {}, errors: {} };
    this.startTimes.clear();
  }
}

export default {
  RunnableConfig,
  BaseCallback,
  CallbackManager,
  ConsoleCallback,
  MetricsCallback
};
```

## Real-World Examples

### Example 1: Basic Logging

```javascript
import { ConsoleCallback } from './context.js';

const logger = new ConsoleCallback({ verbose: true });

const config = {
  callbacks: [logger]
};

// Every step will log
const result = await chain.invoke(input, config);
```

Output:
```
▶ Starting: PromptTemplate
  Input: "Translate to Spanish: Hello"

✓ Completed: PromptTemplate
  Output: "Translate the following to Spanish: Hello"

▶ Starting: LlamaCppLLM
  Input: "Translate the following to Spanish: Hello"

✓ Completed: LlamaCppLLM
  Output: AIMessage("Hola")
```

### Example 2: Performance Monitoring

```javascript
import { MetricsCallback } from './context.js';

const metrics = new MetricsCallback();

const config = {
  callbacks: [metrics]
};

// Run multiple times
for (let i = 0; i < 10; i++) {
  await chain.invoke(input, config);
}

// Get performance report
metrics.printReport();
```

Output:
```
📊 Performance Report:
┌─────────┬─────────────────┬───────┬──────────┬───────────┬────────┬──────────────┐
│ (index) │    runnable     │ calls │ avgTime  │ totalTime │ errors │ successRate  │
├─────────┼─────────────────┼───────┼──────────┼───────────┼────────┼──────────────┤
│    0    │ 'PromptTemplate'│  10   │ '5.20ms' │ '52ms'    │   0    │   '100.0%'   │
│    1    │ 'LlamaCppLLM'   │  10   │ '243.5ms'│ '2435ms'  │   0    │   '100.0%'   │
└─────────┴─────────────────┴───────┴──────────┴───────────┴────────┴──────────────┘
```

### Example 3: Metadata Tracking

```javascript
const config = {
  metadata: {
    userId: 'user_123',
    sessionId: 'sess_456',
    requestId: 'req_789'
  },
  tags: ['production', 'api-v2']
};

await agent.invoke(input, config);

// Every callback receives this metadata
// Useful for logging, debugging, billing
```

### Example 4: Multiple Callbacks

```javascript
const logger = new ConsoleCallback();
const metrics = new MetricsCallback();
const fileLogger = new FileCallback('./logs/agent.json');

const config = {
  callbacks: [logger, metrics, fileLogger]
};

await chain.invoke(input, config);

// All three callbacks are triggered
await fileLogger.flush(); // Save to file
metrics.printReport();    // Show metrics
```

### Example 5: Runtime Configuration Override

```javascript
const llm = new LlamaCppLLM({
  modelPath: './model.gguf',
  temperature: 0.7  // default
});

// Override at runtime
const result1 = await llm.invoke(input, {
  configurable: { temperature: 0.2 }  // more deterministic
});

const result2 = await llm.invoke(input, {
  configurable: { temperature: 1.2 }  // more creative
});
```

### Example 6: Custom Callback for API Logging

```javascript
class APILoggerCallback extends BaseCallback {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  async onEnd(runnable, output, config) {
    // Send to logging API
    await fetch('https://api.yourservice.com/logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        runnable: runnable._name,
        output: this._serialize(output),
        metadata: config.metadata,
        timestamp: new Date().toISOString()
      })
    });
  }

  _serialize(output) {
    if (output?.content) return output.content;
    return String(output);
  }
}

// Usage
const apiLogger = new APILoggerCallback(process.env.API_KEY);
const config = { callbacks: [apiLogger] };
await chain.invoke(input, config);
```

## Advanced Patterns

### Pattern 1: Conditional Callbacks

```javascript
class ConditionalCallback extends BaseCallback {
  constructor(condition, callback) {
    super();
    this.condition = condition;
    this.callback = callback;
  }

  async onEnd(runnable, output, config) {
    if (this.condition(runnable, output, config)) {
      await this.callback.onEnd(runnable, output, config);
    }
  }
}

// Only log slow operations
const slowLogger = new ConditionalCallback(
  (runnable, output, config) => {
    // Check if operation took > 1 second
    return config.executionTime > 1000;
  },
  new ConsoleCallback()
);
```

### Pattern 2: Callback Composition

```javascript
class CompositeCallback extends BaseCallback {
  constructor(callbacks) {
    super();
    this.callbacks = callbacks;
  }

  async onStart(runnable, input, config) {
    for (const cb of this.callbacks) {
      await cb.onStart(runnable, input, config);
    }
  }

  async onEnd(runnable, output, config) {
    for (const cb of this.callbacks) {
      await cb.onEnd(runnable, output, config);
    }
  }

  async onError(runnable, error, config) {
    for (const cb of this.callbacks) {
      await cb.onError(runnable, error, config);
    }
  }
}

// Combine multiple callbacks
const composite = new CompositeCallback([
  new ConsoleCallback(),
  new MetricsCallback(),
  new FileCallback('./logs.json')
]);
```

### Pattern 3: Filtered Logging

```javascript
class FilteredCallback extends BaseCallback {
  constructor(filter, callback) {
    super();
    this.filter = filter;
    this.callback = callback;
  }

  async onStart(runnable, input, config) {
    if (this.filter(runnable._name, 'start')) {
      await this.callback.onStart(runnable, input, config);
    }
  }

  async onEnd(runnable, output, config) {
    if (this.filter(runnable._name, 'end')) {
      await this.callback.onEnd(runnable, output, config);
    }
  }
}

// Only log LLM calls
const llmOnly = new FilteredCallback(
  (name, event) => name.includes('LLM'),
  new ConsoleCallback()
);
```

### Pattern 4: Callback with State

```javascript
class StatefulCallback extends BaseCallback {
  constructor() {
    super();
    this.state = {
      callCount: 0,
      totalTokens: 0,
      errors: []
    };
  }

  async onEnd(runnable, output, config) {
    this.state.callCount++;
    
    if (output?.additionalKwargs?.usage) {
      this.state.totalTokens += output.additionalKwargs.usage.totalTokens;
    }
  }

  async onError(runnable, error, config) {
    this.state.errors.push({
      runnable: runnable._name,
      error: error.message,
      timestamp: Date.now()
    });
  }

  getState() {
    return { ...this.state };
  }
}
```

## Integration with Runnable

Update Runnable to fully support config:

```javascript
export class Runnable {
  async invoke(input, config = {}) {
    // Normalize config
    const runnableConfig = config instanceof RunnableConfig 
      ? config 
      : new RunnableConfig(config);

    // Check recursion limit
    const depth = runnableConfig.metadata._depth || 0;
    if (depth > runnableConfig.recursionLimit) {
      throw new Error('Recursion limit exceeded');
    }

    // Create child config with incremented depth
    const childConfig = runnableConfig.child({
      metadata: { _depth: depth + 1 }
    });

    // Create callback manager
    const callbackManager = new CallbackManager(childConfig.callbacks);

    try {
      await callbackManager.handleStart(this, input, childConfig);
      const output = await this._call(input, childConfig);
      await callbackManager.handleEnd(this, output, childConfig);
      return output;
    } catch (error) {
      await callbackManager.handleError(this, error, childConfig);
      throw error;
    }
  }
}
```

## Common Use Cases

### Use Case 1: Debug Mode

```javascript
const debugConfig = {
  callbacks: [new ConsoleCallback({ verbose: true })],
  tags: ['debug']
};

// See everything that happens
await agent.invoke(query, debugConfig);
```

### Use Case 2: Production Monitoring

```javascript
const productionConfig = {
  callbacks: [
    new MetricsCallback(),
    new APILoggerCallback(API_KEY)
  ],
  metadata: {
    environment: 'production',
    version: '1.2.3'
  },
  tags: ['production']
};
```

### Use Case 3: A/B Testing

```javascript
const configA = {
  metadata: { variant: 'A' },
  configurable: { temperature: 0.7 }
};

const configB = {
  metadata: { variant: 'B' },
  configurable: { temperature: 0.9 }
};

// Track which performs better
```

### Use Case 4: User Context

```javascript
const userConfig = {
  metadata: {
    userId: req.userId,
    sessionId: req.sessionId,
    plan: req.user.plan // 'free', 'pro', 'enterprise'
  }
};

// Different behavior based on user plan
if (userConfig.metadata.plan === 'free') {
  userConfig.configurable = { maxTokens: 100 };
} else if (userConfig.metadata.plan === 'pro') {
  userConfig.configurable = { maxTokens: 500 };
}
```

## Best Practices

### ✅ DO:

```javascript
// Use config for cross-cutting concerns
const config = {
  callbacks: [logger, metrics],
  metadata: { userId, sessionId }
};

// Let config flow automatically
await chain.invoke(input, config);

// Create child configs for nested calls
const childConfig = config.child({ tags: ['nested'] });

// Handle callback errors gracefully (already done in CallbackManager)
```

### ❌ DON'T:

```javascript
// Don't pass config manually at each step
const result1 = await step1(input, config);
const result2 = await step2(result1, config); // Unnecessary

// Don't mutate config
config.metadata.foo = 'bar'; // Bad! Create new config instead

// Don't put business logic in callbacks
// Callbacks are for observability, not logic
```

## Debugging Tips

### Tip 1: Add Timestamps

```javascript
class TimestampCallback extends BaseCallback {
  async onStart(runnable, input, config) {
    console.log(`[${new Date().toISOString()}] ${runnable._name} started`);
  }
}
```

### Tip 2: Stack Traces in Callbacks

```javascript
class DebugCallback extends BaseCallback {
  async onError(runnable, error, config) {
    console.error('Full stack trace:');
    console.error(error.stack);
    console.error('Config:', config);
  }
}
```

### Tip 3: Callback Filtering

```javascript
// Only show LLM operations
const config = {
  callbacks: [
    new FilteredCallback(
      name => name.includes('LLM'),
      new ConsoleCallback()
    )
  ]
};
```

## Exercises

Practice building with context and callbacks:

### Exercise 1: Build a Token Counter Callback

Track total tokens used across all LLM calls.

**Starter code**: `exercises/13-token-counter.js`

### Exercise 2: Create a Rate Limiter

Use callbacks to implement rate limiting.

**Starter code**: `exercises/14-rate-limiter.js`

### Exercise 3: Build a Retry Mechanism

Implement automatic retries using callbacks.

**Starter code**: `exercises/15-retry-callback.js`

### Exercise 4: Create a Caching Callback

Cache responses based on input.

**Starter code**: `exercises/16-caching-callback.js`

## Summary

Congratulations! You've mastered the context and configuration system.

### Key Takeaways

1. **RunnableConfig flows automatically**: No need to pass manually at each step
2. **Callbacks enable observability**: See what's happening without changing code
3. **Metadata carries context**: User info, session data, request IDs
4. **Tags enable filtering**: Organize and filter operations
5. **Callbacks don't break pipelines**: Errors in callbacks are caught
6. **Configuration is composable**: Child configs inherit from parents
7. **Runtime overrides are powerful**: Change behavior without changing code

### What You Built

A production-ready context system that:
- ✅ Flows config through chains automatically
- ✅ Supports multiple callbacks
- ✅ Tracks metrics and performance
- ✅ Enables runtime configuration
- ✅ Provides observability
- ✅ Handles errors gracefully
- ✅ Is infinitely extensible

### Foundation Complete! 🎉

You've completed Part 1 (Foundation). You now understand:
1. **Runnable** - The composability pattern
2. **Messages** - Structured conversation data
3. **LLM Wrapper** - Integrating real models
4. **Context** - Passing state and observability

These four concepts are the foundation of **every** agent framework.

### What's Next

In **Part 2: Composition**, you'll learn:
- Prompt templates
- Output parsers
- LLM chains
- The pipe operator
- Memory systems

➡️ [Continue to Part 2: Composition](../02-composition/01-prompts.md)

## Additional Resources

- [LangChain Callbacks](https://python.langchain.com/docs/modules/callbacks/)
- [OpenTelemetry](https://opentelemetry.io/) - Industry standard for observability
- [Structured Logging](https://www.structlog.org/en/stable/)

## Questions & Discussion

**Q: Why not just use console.log everywhere?**

A: Callbacks are:
- Composable (turn on/off easily)
- Non-invasive (don't clutter code)
- Centralized (one place to change logging)
- Production-ready (can send to monitoring services)

**Q: What's the performance overhead of callbacks?**

A: Minimal if implemented correctly. The CallbackManager calls them in parallel and catches errors, so one slow callback doesn't slow everything down.

**Q: Can I modify the input/output in a callback?**

A: You *can*, but you *shouldn't*. Callbacks are for observation, not transformation. Transformations belong in the Runnable logic.

**Q: How do I pass authentication through chains?**

A: Use metadata:
```javascript
const config = {
  metadata: { 
    authToken: req.headers.authorization 
  }
};
```

---

**Built with ❤️ for learners who want to understand AI agents deeply**

[← Previous: LLM Wrapper](03-llm-wrapper.md) | [Tutorial Index](../README.md) | [Next: Prompts →](../02-composition/01-prompts.md)