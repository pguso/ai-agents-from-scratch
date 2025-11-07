# The Runnable Contract

**Part 1: Foundation - Lesson 1**

> Understanding the single pattern that powers most AI agent framework

## Overview

The `Runnable` is the fundamental building block of our framework. It's a simple yet powerful abstraction that allows us to build complex AI systems from composable parts. Think of it as the "contract" that every component in the framework must follow.

By the end of this lesson, you'll understand why frameworks like LangChain built everything around this single interface, and you'll implement your own Runnable components.

## Why Does This Matter?

Imagine you're building with LEGO blocks. Each block has the same connection mechanism (those little bumps), which means any block can connect to any other block. The `Runnable` interface is exactly that for AI agents.

### The Problem Without Runnable

```javascript
// Without a common interface, every component is different:
const llmResponse = await llm.generate(prompt);
const parsedOutput = parser.parse(llmResponse);
const memorySaved = memory.store(parsedOutput);

// Different methods: generate(), parse(), store()
// Hard to compose, hard to test, hard to maintain
```

### The Solution With Runnable

```javascript
// With Runnable, everything uses the same interface:
const result = await prompt
  .pipe(llm)
  .pipe(parser)
  .pipe(memory)
  .invoke(input);

// Same method everywhere: invoke()
// Easy to compose, test, and maintain
```

## Learning Objectives

By the end of this lesson, you will:

- ✅ Understand what makes a good abstraction
- ✅ Implement the base `Runnable` class
- ✅ Create custom Runnable components
- ✅ Know the three core execution patterns: `invoke`, `stream`, `batch`
- ✅ Understand why this abstraction is powerful for AI systems

## Core Concepts

### What is a Runnable?

A `Runnable` is any component that can:
1. **Take input**
2. **Do something with it**
3. **Return output**

That's it! But this simplicity is what makes it powerful.

### The Three Execution Patterns

Every Runnable supports three ways of execution:

#### 1. `invoke()` - Single Execution
Run once with one input, get one output.

```javascript
const result = await runnable.invoke(input);
// Input: "Hello"
// Output: "Hello, World!"
```

**Use case**: Normal execution, when you have one thing to process.

#### 2. `stream()` - Streaming Execution
Process input and receive output in chunks as it's generated.

```javascript
for await (const chunk of runnable.stream(input)) {
  console.log(chunk); // Print each piece as it arrives
}
// Output: "H", "e", "l", "l", "o", "..."
```

**Use case**: LLM text generation, where you want to show results in real-time.

#### 3. `batch()` - Parallel Execution
Process multiple inputs at once.

```javascript
const results = await runnable.batch([input1, input2, input3]);
// Input: ["Hello", "Hi", "Hey"]
// Output: ["Hello, World!", "Hi, World!", "Hey, World!"]
```

**Use case**: Processing many items efficiently.

### The Magic: Composition

The real power comes from combining Runnables:

```javascript
const pipeline = runnableA.pipe(runnableB).pipe(runnableC);
```

Because everything is a Runnable, you can chain them together infinitely!

## Implementation Deep Dive

Let's build the `Runnable` class step by step.

### Step 1: The Base Structure

```javascript
/**
 * Runnable - Base class for all composable components
 * 
 * Every Runnable must implement the _call() method.
 * This base class provides invoke, stream, batch, and pipe.
 */
export class Runnable {
  /**
   * Main execution method - processes a single input
   * 
   * @param {any} input - The input to process
   * @param {Object} config - Optional configuration
   * @returns {Promise<any>} The processed output
   */
  async invoke(input, config = {}) {
    // This is the public interface
    return await this._call(input, config);
  }

  /**
   * Internal method that subclasses must implement
   * 
   * @param {any} input - The input to process
   * @param {Object} config - Optional configuration
   * @returns {Promise<any>} The processed output
   */
  async _call(input, config) {
    throw new Error(
      `${this.constructor.name} must implement _call() method`
    );
  }
}
```

**Why this design?**
- `invoke()` is public and consistent across all Runnables
- `_call()` is internal and overridden by subclasses
- This separation allows us to add common behavior in `invoke()` without breaking subclasses

### Step 2: Adding Streaming

```javascript
export class Runnable {
  // ... previous code ...

  /**
   * Stream output in chunks
   * 
   * @param {any} input - The input to process
   * @param {Object} config - Optional configuration
   * @yields {any} Output chunks
   */
  async *stream(input, config = {}) {
    // Default implementation: just yield the full result
    // Subclasses can override for true streaming
    const result = await this.invoke(input, config);
    yield result;
  }

  /**
   * Internal streaming method for subclasses
   * Override this for custom streaming behavior
   */
  async *_stream(input, config) {
    yield await this._call(input, config);
  }
}
```

**Why generators (`async *`)?**
Generators allow us to yield values one at a time, perfect for streaming!

```javascript
// Generator function
async *countToThree() {
  yield 1;
  yield 2;
  yield 3;
}

// Usage
for await (const num of countToThree()) {
  console.log(num); // Prints: 1, then 2, then 3
}
```

### Step 3: Adding Batch Processing

```javascript
export class Runnable {
  // ... previous code ...

  /**
   * Process multiple inputs in parallel
   * 
   * @param {Array<any>} inputs - Array of inputs to process
   * @param {Object} config - Optional configuration
   * @returns {Promise<Array<any>>} Array of outputs
   */
  async batch(inputs, config = {}) {
    // Use Promise.all for parallel execution
    return await Promise.all(
      inputs.map(input => this.invoke(input, config))
    );
  }
}
```

**Key insight**: `Promise.all()` runs all promises concurrently. This means if you have 100 inputs, they all process at the same time (within system limits), not one by one!

### Step 4: The Power Move - Composition with `pipe()`

```javascript
export class Runnable {
  // ... previous code ...

  /**
   * Compose this Runnable with another
   * Creates a new Runnable that runs both in sequence
   * 
   * @param {Runnable} other - The Runnable to pipe to
   * @returns {RunnableSequence} A new composed Runnable
   */
  pipe(other) {
    return new RunnableSequence([this, other]);
  }
}
```

Now we need to create `RunnableSequence`:

```javascript
/**
 * RunnableSequence - Chains multiple Runnables together
 * 
 * Output of one becomes input of the next
 */
export class RunnableSequence extends Runnable {
  constructor(steps) {
    super();
    this.steps = steps; // Array of Runnables
  }

  async _call(input, config) {
    let output = input;
    
    // Run through each step sequentially
    for (const step of this.steps) {
      output = await step.invoke(output, config);
    }
    
    return output;
  }

  async *_stream(input, config) {
    let output = input;
    
    // Stream through all steps
    for (let i = 0; i < this.steps.length - 1; i++) {
      output = await this.steps[i].invoke(output, config);
    }
    
    // Only stream the last step
    yield* this.steps[this.steps.length - 1].stream(output, config);
  }

  // pipe() returns a new sequence with the added step
  pipe(other) {
    return new RunnableSequence([...this.steps, other]);
  }
}
```

**Why is this powerful?**

```javascript
// Each pipe creates a new Runnable
const step1 = new MyRunnable();
const step2 = new AnotherRunnable();
const step3 = new YetAnotherRunnable();

// Chain them
const pipeline = step1.pipe(step2).pipe(step3);

// Now pipeline is itself a Runnable!
await pipeline.invoke(input);

// And it can be piped to other things
const biggerPipeline = pipeline.pipe(step4);
```

## Complete Implementation

Here's the full `Runnable` class (location: src/core/runnable.js):

```javascript
/**
 * Runnable - The foundation of composable AI components
 * 
 * @module core/runnable
 */

export class Runnable {
  constructor() {
    this._name = this.constructor.name;
  }

  /**
   * Execute with a single input
   */
  async invoke(input, config = {}) {
    try {
      return await this._call(input, config);
    } catch (error) {
      throw new Error(`${this._name}.invoke() failed: ${error.message}`);
    }
  }

  /**
   * Internal execution method - override this!
   */
  async _call(input, config) {
    throw new Error(`${this._name} must implement _call() method`);
  }

  /**
   * Stream output chunks
   */
  async *stream(input, config = {}) {
    yield* this._stream(input, config);
  }

  /**
   * Internal streaming method - override for custom streaming
   */
  async *_stream(input, config) {
    yield await this._call(input, config);
  }

  /**
   * Execute with multiple inputs in parallel
   */
  async batch(inputs, config = {}) {
    const batchConfig = { ...config, batch: true };
    return await Promise.all(
      inputs.map(input => this.invoke(input, batchConfig))
    );
  }

  /**
   * Compose with another Runnable
   */
  pipe(other) {
    return new RunnableSequence([this, other]);
  }

  /**
   * Helper for debugging
   */
  toString() {
    return `${this._name}()`;
  }
}

/**
 * RunnableSequence - Sequential composition of Runnables
 */
export class RunnableSequence extends Runnable {
  constructor(steps) {
    super();
    this.steps = steps;
    this._name = `RunnableSequence[${steps.length}]`;
  }

  async _call(input, config) {
    let output = input;
    for (const step of this.steps) {
      output = await step.invoke(output, config);
    }
    return output;
  }

  async *_stream(input, config) {
    let output = input;
    
    // Execute all but last step normally
    for (let i = 0; i < this.steps.length - 1; i++) {
      output = await this.steps[i].invoke(output, config);
    }
    
    // Stream the last step
    yield* this.steps[this.steps.length - 1].stream(output, config);
  }

  pipe(other) {
    return new RunnableSequence([...this.steps, other]);
  }

  toString() {
    return this.steps.map(s => s.toString()).join(' | ');
  }
}

export default Runnable;
```

## Real-World Examples

### Example 1: Echo Runnable

The simplest possible Runnable - just returns the input:

```javascript
class EchoRunnable extends Runnable {
  async _call(input, config) {
    return input;
  }
}

// Usage
const echo = new EchoRunnable();
const result = await echo.invoke("Hello!");
console.log(result); // "Hello!"
```

### Example 2: Transform Runnable

Transforms the input in some way:

```javascript
class UpperCaseRunnable extends Runnable {
  async _call(input, config) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    return input.toUpperCase();
  }
}

// Usage
const upper = new UpperCaseRunnable();
const result = await upper.invoke("hello");
console.log(result); // "HELLO"
```

### Example 3: Composing Runnables

```javascript
class AddPrefixRunnable extends Runnable {
  constructor(prefix) {
    super();
    this.prefix = prefix;
  }

  async _call(input, config) {
    return `${this.prefix}${input}`;
  }
}

class AddSuffixRunnable extends Runnable {
  constructor(suffix) {
    super();
    this.suffix = suffix;
  }

  async _call(input, config) {
    return `${input}${this.suffix}`;
  }
}

// Compose them
const pipeline = new AddPrefixRunnable("Hello, ")
  .pipe(new AddSuffixRunnable("!"));

const result = await pipeline.invoke("World");
console.log(result); // "Hello, World!"
```

### Example 4: Async Processing

```javascript
class DelayedEchoRunnable extends Runnable {
  constructor(delayMs) {
    super();
    this.delayMs = delayMs;
  }

  async _call(input, config) {
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, this.delayMs));
    return input;
  }
}

// Usage with batch
const delayed = new DelayedEchoRunnable(1000);
const results = await delayed.batch(["A", "B", "C"]);
// All three process in parallel, takes ~1 second total, not 3!
```

### Example 5: Streaming Numbers

```javascript
class CounterRunnable extends Runnable {
  constructor(max) {
    super();
    this.max = max;
  }

  async _call(input, config) {
    return Array.from({ length: this.max }, (_, i) => i + 1);
  }

  async *_stream(input, config) {
    for (let i = 1; i <= this.max; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield i;
    }
  }
}

// Usage
const counter = new CounterRunnable(5);

// Regular invoke
const all = await counter.invoke();
console.log(all); // [1, 2, 3, 4, 5]

// Streaming
for await (const num of counter.stream()) {
  console.log(num); // Prints 1... then 2... then 3... etc
}
```

## Design Patterns

### Pattern 1: Configuration Through Constructor

```javascript
class ConfigurableRunnable extends Runnable {
  constructor({ option1, option2 }) {
    super();
    this.option1 = option1;
    this.option2 = option2;
  }

  async _call(input, config) {
    // Use this.option1 and this.option2
    return /* processed result */;
  }
}
```

### Pattern 2: Runtime Configuration

```javascript
class RuntimeConfigRunnable extends Runnable {
  async _call(input, config) {
    // Access config at runtime
    const temperature = config.temperature || 0.7;
    const maxTokens = config.maxTokens || 100;
    
    return /* processed result */;
  }
}

// Usage
await runnable.invoke(input, { temperature: 0.9, maxTokens: 200 });
```

### Pattern 3: Error Handling

```javascript
class SafeRunnable extends Runnable {
  async _call(input, config) {
    try {
      return await this.riskyOperation(input);
    } catch (error) {
      // Handle error gracefully
      console.error(`Error in ${this._name}:`, error);
      return config.defaultValue || null;
    }
  }
}
```

## Debugging Tips

### Tip 1: Add Logging

```javascript
class LoggingRunnable extends Runnable {
  async invoke(input, config = {}) {
    console.log(`[${this._name}] Input:`, input);
    const output = await super.invoke(input, config);
    console.log(`[${this._name}] Output:`, output);
    return output;
  }
}
```

### Tip 2: Inspect Pipelines

```javascript
const pipeline = step1.pipe(step2).pipe(step3);
console.log(pipeline.toString());
// "Step1() | Step2() | Step3()"
```

### Tip 3: Test Each Step

```javascript
// Don't test the whole pipeline at once
const result1 = await step1.invoke(input);
console.log("After step1:", result1);

const result2 = await step2.invoke(result1);
console.log("After step2:", result2);

const result3 = await step3.invoke(result2);
console.log("After step3:", result3);
```

## Common Mistakes

### ❌ Mistake 1: Forgetting `async`

```javascript
class BadRunnable extends Runnable {
  _call(input, config) { // Missing async!
    return input.toUpperCase();
  }
}
```

**Fix**: Always make `_call()` async, even if you're not using `await`:

```javascript
async _call(input, config) {
  return input.toUpperCase();
}
```

### ❌ Mistake 2: Not Calling `super()`

```javascript
class BadRunnable extends Runnable {
  constructor() {
    // Forgot super()!
    this.value = 42;
  }
}
```

**Fix**: Always call `super()`:

```javascript
constructor() {
  super();
  this.value = 42;
}
```

### ❌ Mistake 3: Modifying Input

```javascript
class BadRunnable extends Runnable {
  async _call(input, config) {
    input.value = 123; // Don't mutate input!
    return input;
  }
}
```

**Fix**: Return new objects:

```javascript
async _call(input, config) {
  return { ...input, value: 123 };
}
```

## Mental Model

Think of Runnable like this:

```
┌─────────────┐
│   Input     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Runnable   │  ← Your custom logic lives here
│   _call()   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Output    │
└─────────────┘
```

When you pipe Runnables:

```
Input → Runnable1 → Runnable2 → Runnable3 → Output
         _call()     _call()     _call()
```

## Exercises

Now it's your turn! Complete these exercises to solidify your understanding.

### Exercise 1: Build a Multiplier Runnable

Create a Runnable that multiplies numbers by a factor.

**Starter code in**: `exercises/01-echo-runnable.js`

**Requirements**:
- Takes a number as input
- Multiplies by a factor set in constructor
- Returns the result

**Example**:
```javascript
const times3 = new MultiplierRunnable(3);
await times3.invoke(5); // Should return 15
```

### Exercise 2: Build a JSON Parser Runnable

Create a Runnable that parses JSON strings.

**Requirements**:
- Takes a JSON string as input
- Parses it to an object
- Handles errors gracefully (return null if invalid)

**Example**:
```javascript
const parser = new JsonParserRunnable();
await parser.invoke('{"name":"Alice"}'); // Should return { name: "Alice" }
await parser.invoke('invalid json'); // Should return null
```

### Exercise 3: Compose a Pipeline

Using the Runnables you've created, build a pipeline that:
1. Takes a number
2. Multiplies it
3. Converts it to an object: `{ result: <number> }`
4. Converts to JSON string

**Example**:
```javascript
const pipeline = /* your code */;
await pipeline.invoke(5); // Should return '{"result":15}'
```

### Exercise 4: Implement Batch Processing

Test your Multiplier with batch processing:

**Requirements**:
- Process [1, 2, 3, 4, 5] in parallel
- Each should be multiplied by 10

**Example**:
```javascript
const results = await times10.batch([1, 2, 3, 4, 5]);
console.log(results); // [10, 20, 30, 40, 50]
```

## Summary

Congratulations! You now understand the Runnable abstraction. Let's recap:

### Key Takeaways

1. **Runnable is a contract**: Every component implements `invoke()`, `stream()`, and `batch()`
2. **Override `_call()`**: This is where your custom logic goes
3. **Composition is powerful**: Use `pipe()` to chain Runnables together
4. **Async by default**: Always use `async/await`
5. **Immutability matters**: Don't modify inputs, return new values

### What Makes This Powerful

- ✅ **Consistency**: Everything works the same way
- ✅ **Composability**: Build complex systems from simple parts
- ✅ **Testability**: Test each Runnable independently
- ✅ **Reusability**: Write once, use anywhere
- ✅ **Extensibility**: Easy to add new Runnables

### The Foundation is Set

Now that you understand Runnables, everything else in the framework will make sense:
- **Prompts** are Runnables that format text
- **LLMs** are Runnables that generate text
- **Parsers** are Runnables that extract structure
- **Chains** are Runnables that combine other Runnables
- **Agents** are Runnables that make decisions

It's Runnables all the way down! 🐢

## Next Steps

In the next lesson, we'll explore **Messages** - how to structure conversation data for AI agents.

**Preview**: You'll learn:
- Different message types (Human, AI, System, Tool)
- Why type systems matter
- How to build a message history

➡️ [Continue to Lesson 2: Messages & Types](02-messages.md)

## Additional Resources

- [LangChain Runnable Documentation](https://python.langchain.com/docs/expression_language/)
- [JavaScript Generators (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)
- [Promise.all() Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)

## Questions & Discussion

**Q: Why use `_call()` instead of just `invoke()`?**

A: The underscore prefix (`_call`) is a convention meaning "internal method." This separation allows the base class to add common functionality in `invoke()` (like logging, error handling, metrics) without forcing every subclass to implement it.

**Q: Can I pipe more than two Runnables?**

A: Absolutely! You can chain as many as you want:
```javascript
a.pipe(b).pipe(c).pipe(d).pipe(e)...
```

**Q: What if I don't need streaming?**

A: That's fine! The default implementation just yields the full result. Only override `_stream()` if you need true streaming behavior.

**Q: Is this the same as function composition?**

A: Very similar! It's like function composition but with superpowers (async, streaming, batching).

---

**Built with ❤️ for learners who want to understand AI agents deeply**

[← Back to Tutorial Index](../README.md) | [Next Lesson: Messages →](02-messages.md)