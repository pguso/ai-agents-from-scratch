# LLM Chain: Composing Prompts with Models

**Part 2: Composition - Lesson 3**

> Stop writing boilerplate. Start building chains.

## Overview

You've learned prompts and parsers. Now it's time to combine them elegantly.

```javascript
// Before: Manual composition everywhere
const prompt = await promptTemplate.format({ input: "data" });
const llmOutput = await llm.invoke(prompt);
const parsed = await parser.parse(llmOutput);

// After: Clean, reusable chain
const chain = new LLMChain({ prompt, llm, outputParser: parser });
const result = await chain.invoke({ input: "data" });
```

**LLMChain** is the fundamental building block that combines prompt templates, LLMs, and output parsers into a single, reusable component.

## Why This Matters

### The Problem: Repetitive Composition

Without chains, every LLM interaction requires the same boilerplate:

```javascript
// Scattered throughout your codebase:

// Function 1
async function translateText(text, language) {
    const prompt = await translatePrompt.format({ text, language });
    const response = await llm.invoke(prompt);
    const cleaned = await stringParser.parse(response.content);
    return cleaned;
}

// Function 2
async function summarizeArticle(article) {
    const prompt = await summaryPrompt.format({ article });
    const response = await llm.invoke(prompt);
    const cleaned = await stringParser.parse(response.content);
    return cleaned;
}

// Function 3
async function classifyEmail(email) {
    const prompt = await classifyPrompt.format({ email });
    const response = await llm.invoke(prompt);
    const parsed = await jsonParser.parse(response.content);
    return parsed;
}

// Same pattern repeated everywhere!
```

Problems:
- Boilerplate repeated in every function
- Hard to add features (logging, retries, caching)
- Can't compose chains together easily
- Difficult to test individual components
- Error handling duplicated

### The Solution: LLMChain

```javascript
// Define once
const translateChain = new LLMChain({
    prompt: translatePrompt,
    llm: llm,
    outputParser: stringParser
});

const summaryChain = new LLMChain({
    prompt: summaryPrompt,
    llm: llm,
    outputParser: stringParser
});

const classifyChain = new LLMChain({
    prompt: classifyPrompt,
    llm: llm,
    outputParser: jsonParser
});

// Use everywhere
const translation = await translateChain.invoke({ text, language });
const summary = await summaryChain.invoke({ article });
const classification = await classifyChain.invoke({ email });
```

Benefits:
- ✅ Write once, use everywhere
- ✅ Add features in one place (affects all chains)
- ✅ Easy to test components independently
- ✅ Composable with other chains
- ✅ Consistent error handling

## Learning Objectives

By the end of this lesson, you will:

- ✅ Understand the LLMChain pattern
- ✅ Build an LLMChain class that composes components
- ✅ Use chains as Runnables (pipe-able)
- ✅ Add callbacks and context to chains
- ✅ Implement retry logic and error handling
- ✅ Build sequential and parallel chain compositions
- ✅ Create reusable chain patterns

## Core Concepts

### What is an LLMChain?

An LLMChain is a **Runnable that orchestrates**:
1. **Prompt** formatting (PromptTemplate)
2. **LLM** invocation (LlamaCppLLM, etc.)
3. **Output** parsing (OutputParser)

**Flow:**
```
Input Variables
      ↓
PromptTemplate.format()
      ↓
Formatted Prompt
      ↓
LLM.invoke()
      ↓
LLM Output (Message)
      ↓
OutputParser.parse()
      ↓
Structured Output
```

### Key Components

```javascript
new LLMChain({
    prompt: PromptTemplate,      // Formats input
    llm: BaseLLM,                // Generates response
    outputParser: OutputParser,  // Parses output (optional)
    outputKey: string            // Key for output (default: "text")
})
```

### The Chain Advantage

**Composability:**
```javascript
const chain1 = new LLMChain({ /* ... */ });
const chain2 = new LLMChain({ /* ... */ });

// Chains are Runnables, so they pipe!
const pipeline = chain1.pipe(chain2);
```

**Reusability:**
```javascript
const translationChain = new LLMChain({ /* ... */ });

// Use with different inputs
await translationChain.invoke({ text: "Hello", language: "Spanish" });
await translationChain.invoke({ text: "Goodbye", language: "French" });
```

**Testability:**
```javascript
// Test each component independently
await prompt.format({ input: "test" });
await llm.invoke("test prompt");
await parser.parse(llmOutput);

// Test the full chain
await chain.invoke({ input: "test" });
```

## Implementation Guide

### Step 1: Base Chain Class

**Location:** `src/chains/base-chain.js`

This is the abstract base class all chains inherit from.

**What it does:**
- Extends Runnable (so chains are composable)
- Defines common chain interface
- Provides input/output key management
- Handles callbacks and context

**Implementation:**

```javascript
import { Runnable } from '../core/runnable.js';

/**
 * Base class for all chains
 * A chain orchestrates multiple components (prompts, LLMs, parsers)
 */
export class BaseChain extends Runnable {
    constructor() {
        super();
        this.name = this.constructor.name;
    }

    /**
     * Input keys this chain expects
     * @abstract
     */
    get inputKeys() {
        throw new Error(`${this.name} must implement inputKeys getter`);
    }

    /**
     * Output keys this chain produces
     * @abstract
     */
    get outputKeys() {
        throw new Error(`${this.name} must implement outputKeys getter`);
    }

    /**
     * Run the chain logic
     * @abstract
     */
    async _call(inputs, config) {
        throw new Error(`${this.name} must implement _call()`);
    }

    /**
     * Validate that input contains all required keys
     */
    _validateInputs(inputs) {
        const missing = this.inputKeys.filter(key => !(key in inputs));
        if (missing.length > 0) {
            throw new Error(
                `Missing required input keys for ${this.name}: ${missing.join(', ')}`
            );
        }
    }

    /**
     * Prepare outputs with proper keys
     */
    _prepareOutputs(result) {
        // If result is already an object with the right keys, return it
        if (typeof result === 'object' && !Array.isArray(result)) {
            return result;
        }

        // Otherwise, wrap in output key
        const outputKey = this.outputKeys[0] || 'output';
        return { [outputKey]: result };
    }
}
```

**Key insights:**
- Extends `Runnable` for composability
- Enforces input/output key validation
- Provides structure for all chains
- `_call` is where chain logic goes

---

### Step 2: LLMChain Implementation

**Location:** `src/chains/llm-chain.js`

The fundamental chain that combines prompt + LLM + parser.

**What it does:**
- Formats prompt with input variables
- Invokes LLM with formatted prompt
- Optionally parses output
- Returns structured result

**Implementation:**

```javascript
import { BaseChain } from './base-chain.js';

/**
 * Chain that combines PromptTemplate + LLM + OutputParser
 * 
 * Example:
 *   const chain = new LLMChain({
 *       prompt: new PromptTemplate({ template: "Translate {text}" }),
 *       llm: new LlamaCppLLM({ modelPath: "./model.gguf" }),
 *       outputParser: new StringOutputParser()
 *   });
 *   
 *   const result = await chain.invoke({ text: "Hello" });
 */
export class LLMChain extends BaseChain {
    constructor(options = {}) {
        super();
        
        if (!options.prompt) {
            throw new Error('LLMChain requires a prompt template');
        }
        if (!options.llm) {
            throw new Error('LLMChain requires an LLM');
        }

        this.prompt = options.prompt;
        this.llm = options.llm;
        this.outputParser = options.outputParser || null;
        this.outputKey = options.outputKey || 'text';
        this.returnFinalOnly = options.returnFinalOnly ?? true;
    }

    /**
     * Input keys from prompt template
     */
    get inputKeys() {
        return this.prompt.inputVariables;
    }

    /**
     * Output keys this chain produces
     */
    get outputKeys() {
        return [this.outputKey];
    }

    /**
     * Run the chain: format prompt → invoke LLM → parse output
     */
    async _call(inputs, config) {
        this._validateInputs(inputs);

        // Step 1: Format the prompt
        const formattedPrompt = await this.prompt.format(inputs);

        // Step 2: Invoke the LLM
        const llmOutput = await this.llm.invoke(formattedPrompt, config);

        // Step 3: Parse the output (if parser provided)
        let finalOutput;
        if (this.outputParser) {
            finalOutput = await this.outputParser.parse(llmOutput.content);
        } else {
            // If no parser, return the LLM output content
            finalOutput = llmOutput.content;
        }

        // Step 4: Prepare output
        if (this.returnFinalOnly) {
            return finalOutput;
        } else {
            // Return full context including intermediate steps
            return {
                [this.outputKey]: finalOutput,
                prompt: formattedPrompt,
                llmOutput: llmOutput
            };
        }
    }

    /**
     * Get the type of chain
     */
    get _chainType() {
        return 'llm_chain';
    }

    /**
     * Serialize chain for saving/loading
     */
    serialize() {
        return {
            _type: this._chainType,
            prompt: this.prompt,
            llm: this.llm,
            outputParser: this.outputParser,
            outputKey: this.outputKey
        };
    }
}
```

**Key insights:**
- Validates inputs match prompt variables
- Handles optional output parser
- Can return just result or full context
- Inherits Runnable interface (pipe-able)

---

### Step 3: Sequential Chain

**Location:** `src/chains/sequential-chain.js`

For running chains in sequence, passing output of one to input of next.

**What it does:**
- Runs multiple chains in order
- Passes outputs to next chain's inputs
- Accumulates results

**Implementation:**

```javascript
import { BaseChain } from './base-chain.js';

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
                throw new Error(
                    `Chain ${i} (${chain.name}) failed: ${error.message}`
                );
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
```

**Usage example:**

```javascript
// Summarize then translate
const summaryChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Summarize: {article}",
        inputVariables: ["article"]
    }),
    llm: llm,
    outputKey: "summary"
});

const translateChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Translate to Spanish: {summary}",
        inputVariables: ["summary"]
    }),
    llm: llm,
    outputKey: "translation"
});

const sequential = new SequentialChain({
    chains: [summaryChain, translateChain],
    inputVariables: ["article"],
    outputVariables: ["translation"]
});

const result = await sequential.invoke({
    article: "Long article text..."
});
// Returns: Spanish translation of summary
```

---

### Step 4: Transform Chain

**Location:** `src/chains/transform-chain.js`

For transforming data between chains without calling an LLM.

**What it does:**
- Applies a transformation function
- No LLM involved (pure data transformation)
- Useful for preprocessing or postprocessing

**Implementation:**

```javascript
import { BaseChain } from './base-chain.js';

/**
 * Chain that transforms inputs using a function
 * No LLM involved - useful for data preprocessing/postprocessing
 * 
 * Example:
 *   const transform = new TransformChain({
 *       transform: async (inputs) => ({
 *           cleanedText: inputs.text.toLowerCase().trim()
 *       }),
 *       inputVariables: ["text"],
 *       outputVariables: ["cleanedText"]
 *   });
 */
export class TransformChain extends BaseChain {
    constructor(options = {}) {
        super();

        if (!options.transform || typeof options.transform !== 'function') {
            throw new Error('TransformChain requires a transform function');
        }

        this.transformFunc = options.transform;
        this._inputKeys = options.inputVariables || [];
        this._outputKeys = options.outputVariables || [];
    }

    get inputKeys() {
        return this._inputKeys;
    }

    get outputKeys() {
        return this._outputKeys;
    }

    /**
     * Apply transformation function
     */
    async _call(inputs, config) {
        // No input validation - transform function decides what it needs
        const result = await this.transformFunc(inputs, config);

        if (typeof result !== 'object' || Array.isArray(result)) {
            throw new Error(
                'Transform function must return an object with output variables'
            );
        }

        // If single output variable, return just the value
        if (this._outputKeys.length === 1) {
            return result[this._outputKeys[0]];
        }

        return result;
    }

    get _chainType() {
        return 'transform_chain';
    }
}
```

**Usage example:**

```javascript
// Clean text before sending to LLM
const cleanupChain = new TransformChain({
    transform: async (inputs) => ({
        cleanedText: inputs.text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .trim()
    }),
    inputVariables: ["text"],
    outputVariables: ["cleanedText"]
});

const llmChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Analyze: {cleanedText}"
    }),
    llm: llm
});

// Combine: cleanup then analyze
const pipeline = cleanupChain.pipe(llmChain);

const result = await pipeline.invoke({
    text: "  Hello, World!!!  "
});
```

---

### Step 5: Router Chain

**Location:** `src/chains/router-chain.js`

For routing to different chains based on input.

**What it does:**
- Routes input to appropriate destination chain
- Based on classifier or condition
- Enables dynamic chain selection

**Implementation:**

```javascript
import { BaseChain } from './base-chain.js';

/**
 * Chain that routes to different chains based on input
 * 
 * Example:
 *   const router = new RouterChain({
 *       destinationChains: {
 *           "technical": technicalChain,
 *           "casual": casualChain
 *       },
 *       defaultChain: defaultChain,
 *       routerChain: classifierChain  // Determines which route
 *   });
 */
export class RouterChain extends BaseChain {
    constructor(options = {}) {
        super();

        if (!options.destinationChains) {
            throw new Error('RouterChain requires destinationChains');
        }

        this.destinationChains = options.destinationChains;
        this.defaultChain = options.defaultChain || null;
        this.routerChain = options.routerChain || null;
        this.routeKey = options.routeKey || 'route';
    }

    get inputKeys() {
        // Collect all input keys from all destination chains
        const keys = new Set();
        for (const chain of Object.values(this.destinationChains)) {
            chain.inputKeys.forEach(key => keys.add(key));
        }
        return Array.from(keys);
    }

    get outputKeys() {
        // All destination chains should have same output keys
        const firstChain = Object.values(this.destinationChains)[0];
        return firstChain ? firstChain.outputKeys : ['output'];
    }

    /**
     * Determine route and execute appropriate chain
     */
    async _call(inputs, config) {
        let route;

        if (this.routerChain) {
            // Use router chain to determine route
            const routeResult = await this.routerChain.invoke(inputs, config);
            route = typeof routeResult === 'string' 
                ? routeResult 
                : routeResult[this.routeKey];
        } else {
            // Look for route in inputs
            route = inputs[this.routeKey];
        }

        // Get the appropriate chain
        const destinationChain = this.destinationChains[route];

        if (!destinationChain) {
            if (this.defaultChain) {
                return await this.defaultChain.invoke(inputs, config);
            } else {
                throw new Error(
                    `No chain found for route "${route}" and no default chain provided`
                );
            }
        }

        // Execute the destination chain
        return await destinationChain.invoke(inputs, config);
    }

    get _chainType() {
        return 'router_chain';
    }
}
```

**Usage example:**

```javascript
// Different chains for different content types
const technicalChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Explain technically: {query}"
    }),
    llm: llm
});

const casualChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Explain simply: {query}"
    }),
    llm: llm
});

// Classifier determines which chain to use
const classifierChain = new LLMChain({
    prompt: new PromptTemplate({
        template: `Classify this query as "technical" or "casual": {query}
Respond with just one word.`
    }),
    llm: llm,
    outputParser: new StringOutputParser()
});

const router = new RouterChain({
    destinationChains: {
        "technical": technicalChain,
        "casual": casualChain
    },
    routerChain: classifierChain
});

// Routes automatically
const result = await router.invoke({
    query: "Explain quantum entanglement"
});
// Uses technicalChain

const result2 = await router.invoke({
    query: "How do birds fly?"
});
// Uses casualChain
```

---

# LLM Chain: Advanced Patterns & Production Use

> From basics to chains.

## Overview

Let's explore advanced patterns, error handling, testing, and real-world applications that make chains production-ready.

**What we'll cover:**
- Advanced composition patterns (retry, fallback, caching)
- Parallel execution strategies
- Robust error handling
- Integration with callbacks and context
- Testing strategies
- Production best practices
- Real-world use cases

## Advanced Composition Patterns

### Pattern 1: Retry Chain

Automatic retry with exponential backoff for transient failures.

**Location:** `src/chains/retry-chain.js`

**Implementation:**

```javascript
import { BaseChain } from './base-chain.js';
import { sleep } from '../utils/retry.js';

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
        if (!this.retryableErrors) {
            // Retry all errors if no filter specified
            return true;
        }

        const errorMessage = error.message || '';
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
                const result = await this.chain.invoke(inputs, config);
                return result;
            } catch (error) {
                lastError = error;

                // Check if we should retry
                if (attempt === this.maxRetries || !this._isRetryable(error)) {
                    throw error;
                }

                // Call retry callback if provided
                if (this.onRetry) {
                    await this.onRetry({
                        attempt: attempt + 1,
                        maxRetries: this.maxRetries,
                        error,
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
```

**Real-world usage:**

```javascript
import { RetryChain } from './chains/retry-chain.js';
import { LLMChain } from './chains/llm-chain.js';
import { PromptTemplate } from './prompts/prompt-template.js';
import { LlamaCppLLM } from './llm/llama-cpp-llm.js';

// Base chain that might fail due to rate limits or network issues
const baseChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Analyze this customer feedback: {feedback}",
        inputVariables: ["feedback"]
    }),
    llm: new LlamaCppLLM({ modelPath: "./models/model.gguf" })
});

// Wrap with retry logic
const retryChain = new RetryChain({
    chain: baseChain,
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 2,
    retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'ECONNREFUSED'],
    onRetry: async ({ attempt, maxRetries, error, nextDelay }) => {
        console.log(`Retry ${attempt}/${maxRetries} after error: ${error.message}`);
        console.log(`Waiting ${nextDelay}ms before next attempt...`);
    }
});

// Use in production - handles transient failures gracefully
try {
    const result = await retryChain.invoke({
        feedback: "The product is great but shipping was slow"
    });
    console.log(result);
} catch (error) {
    console.error('Failed after all retries:', error);
}
```

**Key benefits:**
- Handles transient failures automatically
- Exponential backoff prevents overwhelming services
- Configurable retry conditions
- Useful for rate limits, network issues, timeouts

---

### Pattern 2: Cache Chain

Cache results to avoid redundant LLM calls.

**Location:** `src/chains/cache-chain.js`

**Implementation:**

```javascript
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
```

**Real-world usage:**

```javascript
import { CacheChain } from './chains/cache-chain.js';
import { LLMChain } from './chains/llm-chain.js';
import { PromptTemplate } from './prompts/prompt-template.js';

// Expensive chain (product recommendations)
const recommendationChain = new LLMChain({
    prompt: new PromptTemplate({
        template: `Based on user preferences: {preferences}
Recommend 5 products from our catalog.`,
        inputVariables: ["preferences"]
    }),
    llm: new LlamaCppLLM({ modelPath: "./models/model.gguf" })
});

// Wrap with cache
const cachedChain = new CacheChain({
    chain: recommendationChain,
    ttl: 3600000,  // 1 hour
    onCacheHit: async ({ cacheKey, cachedAt }) => {
        console.log(`Cache hit! Using result from ${new Date(cachedAt)}`);
    },
    onCacheMiss: async ({ inputs }) => {
        console.log(`Cache miss. Generating recommendations for:`, inputs);
    }
});

// First call - cache miss
const result1 = await cachedChain.invoke({
    preferences: "outdoor gear, camping, hiking"
});
// Executes LLM chain

// Second call with same input - cache hit!
const result2 = await cachedChain.invoke({
    preferences: "outdoor gear, camping, hiking"
});
// Returns cached result instantly

// Check cache stats
console.log(cachedChain.getCacheStats());
```

**Advanced caching with Redis:**

```javascript
import Redis from 'ioredis';

class RedisCache {
    constructor(options = {}) {
        this.redis = new Redis(options.url);
        this.prefix = options.prefix || 'cache:';
    }

    async get(key) {
        const value = await this.redis.get(`${this.prefix}${key}`);
        return value ? JSON.parse(value) : null;
    }

    async set(key, value) {
        await this.redis.set(
            `${this.prefix}${key}`,
            JSON.stringify(value)
        );
    }

    async clear() {
        const keys = await this.redis.keys(`${this.prefix}*`);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
}

// Use Redis cache for distributed caching
const distributedCache = new CacheChain({
    chain: expensiveChain,
    cache: new RedisCache({ url: process.env.REDIS_URL }),
    ttl: 3600000
});
```

**Key benefits:**
- Dramatically reduces LLM costs for repeated queries
- Improves response time
- Reduces load on LLM infrastructure
- Essential for production systems with common queries

---

### Pattern 3: Parallel Chain

Execute multiple chains in parallel.

**Location:** `src/chains/parallel-chain.js`

**Implementation:**

```javascript
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
```

**Real-world usage:**

```javascript
import { ParallelChain } from './chains/parallel-chain.js';
import { LLMChain } from './chains/llm-chain.js';
import { PromptTemplate } from './prompts/prompt-template.js';

// Multiple independent analysis tasks
const summaryChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Summarize this article in 2-3 sentences: {article}",
        inputVariables: ["article"]
    }),
    llm: llm,
    outputKey: "summary"
});

const sentimentChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "What is the sentiment (positive/negative/neutral) of: {article}",
        inputVariables: ["article"]
    }),
    llm: llm,
    outputKey: "sentiment"
});

const keywordChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Extract 5 keywords from: {article}",
        inputVariables: ["article"]
    }),
    llm: llm,
    outputKey: "keywords"
});

const categoryChain = new LLMChain({
    prompt: new PromptTemplate({
        template: "Categorize this article (tech/business/politics/sports): {article}",
        inputVariables: ["article"]
    }),
    llm: llm,
    outputKey: "category"
});

// Run all analyses in parallel
const parallelAnalysis = new ParallelChain({
    chains: {
        summary: summaryChain,
        sentiment: sentimentChain,
        keywords: keywordChain,
        category: categoryChain
    },
    failFast: false  // Continue even if one fails
});

// Execute all at once
const article = "Long article text...";
const results = await parallelAnalysis.invoke({ article });

console.log(results);
// {
//   summary: "Article discusses...",
//   sentiment: "positive",
//   keywords: ["AI", "technology", "innovation", "future", "automation"],
//   category: "tech"
// }
```

**Real-world: Document processing pipeline**

```javascript
// Process document with multiple extractors in parallel
const documentPipeline = new ParallelChain({
    chains: {
        entities: entityExtractorChain,
        topics: topicModelChain,
        summary: summarizerChain,
        sentiment: sentimentChain,
        language: languageDetectorChain
    }
});

async function processDocument(document) {
    const startTime = Date.now();
    
    const results = await documentPipeline.invoke({ document });
    
    const elapsed = Date.now() - startTime;
    console.log(`Processed document in ${elapsed}ms`);
    
    return {
        ...results,
        processingTime: elapsed
    };
}

// Much faster than sequential processing!
// Sequential: 5 chains × 2s each = 10s
// Parallel: max(2s) = ~2s
```

**Key benefits:**
- Significant performance improvement for independent tasks
- Better resource utilization
- Reduced total processing time
- Essential for real-time applications

---

## Integration with Context

**Using context for configuration:**

```javascript
import { RunContext } from '../core/context.js';

// Create context with configuration
const context = new RunContext({
    userId: 'user123',
    sessionId: 'session456',
    language: 'en',
    maxTokens: 1000,
    temperature: 0.7,
    tags: ['production', 'customer-support']
});

// Context is passed through chain invocations
const result = await chain.invoke(
    { input: "user query" },
    { context }
);

// Access context in chain
class ContextAwareChain extends BaseChain {
    async _call(inputs, config) {
        const context = config?.context;
        
        // Use context for personalization
        const language = context?.language || 'en';
        const userId = context?.userId;
        
        // Modify behavior based on context
        const prompt = this._personalizePrompt(inputs, language, userId);
        
        return await this.llm.invoke(prompt, config);
    }

    _personalizePrompt(inputs, language, userId) {
        // Fetch user preferences
        const prefs = getUserPreferences(userId);
        
        // Customize prompt
        return `[Language: ${language}]
[User preferences: ${prefs}]
${inputs.query}`;
    }
}
```

---

## Testing Chains

### Unit Testing

**Test individual components:**

```javascript
// tests/chains/llm-chain.test.js

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LLMChain } from '../../src/chains/llm-chain.js';
import { PromptTemplate } from '../../src/prompts/prompt-template.js';
import { StringOutputParser } from '../../src/output-parsers/string-parser.js';

// Mock LLM for testing
class MockLLM {
    async invoke(prompt, config) {
        return {
            content: `Mocked response for: ${prompt}`
        };
    }
}

describe('LLMChain', () => {
    let mockLLM;
    let promptTemplate;
    let outputParser;

    beforeEach(() => {
        mockLLM = new MockLLM();
        
        promptTemplate = new PromptTemplate({
            template: "Translate {text} to {language}",
            inputVariables: ["text", "language"]
        });
        
        outputParser = new StringOutputParser();
    });

    it('should create chain with required components', () => {
        const chain = new LLMChain({
            prompt: promptTemplate,
            llm: mockLLM
        });

        expect(chain).toBeDefined();
        expect(chain.inputKeys).toEqual(["text", "language"]);
    });

    it('should throw error if missing prompt', () => {
        expect(() => {
            new LLMChain({ llm: mockLLM });
        }).toThrow('LLMChain requires a prompt template');
    });

    it('should throw error if missing llm', () => {
        expect(() => {
            new LLMChain({ prompt: promptTemplate });
        }).toThrow('LLMChain requires an LLM');
    });

    it('should format prompt and invoke LLM', async () => {
        const chain = new LLMChain({
            prompt: promptTemplate,
            llm: mockLLM
        });

        const result = await chain.invoke({
            text: "Hello",
            language: "Spanish"
        });

        expect(result).toContain("Translate Hello to Spanish");
    });

    it('should validate required inputs', async () => {
        const chain = new LLMChain({
            prompt: promptTemplate,
            llm: mockLLM
        });

        await expect(
            chain.invoke({ text: "Hello" })
        ).rejects.toThrow('Missing required input keys');
    });

    it('should apply output parser if provided', async () => {
        const mockParser = {
            parse: async (output) => output.toUpperCase()
        };

        const chain = new LLMChain({
            prompt: promptTemplate,
            llm: mockLLM,
            outputParser: mockParser
        });

        const result = await chain.invoke({
            text: "Hello",
            language: "Spanish"
        });

        // Should be uppercase due to parser
        expect(result).toBe(result.toUpperCase());
    });

    it('should return full context when returnFinalOnly is false', async () => {
        const chain = new LLMChain({
            prompt: promptTemplate,
            llm: mockLLM,
            returnFinalOnly: false
        });

        const result = await chain.invoke({
            text: "Hello",
            language: "Spanish"
        });

        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('prompt');
        expect(result).toHaveProperty('llmOutput');
    });
});
```

---

### Integration Testing

**Test chain compositions:**

```javascript
// tests/chains/sequential-chain.test.js

import { describe, it, expect } from '@jest/globals';
import { SequentialChain } from '../../src/chains/sequential-chain.js';
import { LLMChain } from '../../src/chains/llm-chain.js';
import { PromptTemplate } from '../../src/prompts/prompt-template.js';

class MockLLM {
    constructor(responseMap = {}) {
        this.responseMap = responseMap;
    }

    async invoke(prompt) {
        // Return response based on prompt content
        for (const [key, value] of Object.entries(this.responseMap)) {
            if (prompt.includes(key)) {
                return { content: value };
            }
        }
        return { content: 'Default response' };
    }
}

describe('SequentialChain', () => {
    it('should chain outputs to next inputs', async () => {
        const summaryChain = new LLMChain({
            prompt: new PromptTemplate({
                template: "Summarize: {article}",
                inputVariables: ["article"]
            }),
            llm: new MockLLM({ "Summarize": "Brief summary" }),
            outputKey: "summary"
        });

        const translateChain = new LLMChain({
            prompt: new PromptTemplate({
                template: "Translate: {summary}",
                inputVariables: ["summary"]
            }),
            llm: new MockLLM({ "Translate": "Spanish translation" }),
            outputKey: "translation"
        });

        const sequential = new SequentialChain({
            chains: [summaryChain, translateChain],
            inputVariables: ["article"],
            outputVariables: ["translation"]
        });

        const result = await sequential.invoke({
            article: "Long article text..."
        });

        expect(result).toBe("Spanish translation");
    });

    it('should accumulate all outputs when multiple output variables', async () => {
        const chain1 = new LLMChain({
            prompt: new PromptTemplate({
                template: "{input}",
                inputVariables: ["input"]
            }),
            llm: new MockLLM({}),
            outputKey: "output1"
        });

        const chain2 = new LLMChain({
            prompt: new PromptTemplate({
                template: "{output1}",
                inputVariables: ["output1"]
            }),
            llm: new MockLLM({}),
            outputKey: "output2"
        });

        const sequential = new SequentialChain({
            chains: [chain1, chain2],
            inputVariables: ["input"],
            outputVariables: ["output1", "output2"]
        });

        const result = await sequential.invoke({ input: "test" });

        expect(result).toHaveProperty('output1');
        expect(result).toHaveProperty('output2');
    });
});
```

---

### End-to-End Testing

**Test real chains with actual LLMs:**

```javascript
// tests/e2e/translation-pipeline.test.js

import { describe, it, expect } from '@jest/globals';
import { SequentialChain } from '../../src/chains/sequential-chain.js';
import { LLMChain } from '../../src/chains/llm-chain.js';
import { TransformChain } from '../../src/chains/transform-chain.js';
import { PromptTemplate } from '../../src/prompts/prompt-template.js';
import { LlamaCppLLM } from '../../src/llm/llama-cpp-llm.js';
import { StringOutputParser } from '../../src/output-parsers/string-parser.js';

describe('Translation Pipeline E2E', () => {
    let llm;

    beforeAll(async () => {
        // Initialize real LLM
        llm = new LlamaCppLLM({
            modelPath: './models/test-model.gguf',
            contextSize: 2048
        });
    });

    afterAll(async () => {
        // Cleanup
        await llm.dispose();
    });

    it('should translate and format text correctly', async () => {
        // Cleanup chain
        const cleanupChain = new TransformChain({
            transform: async (inputs) => ({
                cleanedText: inputs.text.trim().replace(/\s+/g, ' ')
            }),
            inputVariables: ["text"],
            outputVariables: ["cleanedText"]
        });

        // Translation chain
        const translateChain = new LLMChain({
            prompt: new PromptTemplate({
                template: "Translate to Spanish: {cleanedText}",
                inputVariables: ["cleanedText"]
            }),
            llm: llm,
            outputParser: new StringOutputParser(),
            outputKey: "translation"
        });

        // Format chain
        const formatChain = new TransformChain({
            transform: async (inputs) => ({
                formatted: `Translation: ${inputs.translation}`
            }),
            inputVariables: ["translation"],
            outputVariables: ["formatted"]
        });

        // Complete pipeline
        const pipeline = new SequentialChain({
            chains: [cleanupChain, translateChain, formatChain],
            inputVariables: ["text"],
            outputVariables: ["formatted"]
        });

        const result = await pipeline.invoke({
            text: "  Hello,   world!  "
        });

        expect(result).toContain("Translation:");
        expect(result).toContain("Hola");
    }, 30000); // 30s timeout for LLM operations
});
```

---

## Production Best Practices

### 1. Chain Configuration Management

**Centralized configuration:**

```javascript
// config/chains.js

export const chainConfigs = {
    production: {
        llm: {
            modelPath: process.env.MODEL_PATH,
            contextSize: 4096,
            temperature: 0.7,
            maxTokens: 2000
        },
        retry: {
            maxRetries: 5,
            retryDelay: 2000,
            backoffMultiplier: 2
        },
        cache: {
            ttl: 3600000,  // 1 hour
            maxSize: 10000
        },
        circuitBreaker: {
            failureThreshold: 10,
            timeout: 30000,
            resetTimeout: 120000
        }
    },
    development: {
        llm: {
            modelPath: './models/dev-model.gguf',
            contextSize: 2048,
            temperature: 0.7,
            maxTokens: 1000
        },
        retry: {
            maxRetries: 2,
            retryDelay: 500,
            backoffMultiplier: 2
        },
        cache: {
            ttl: 60000,  // 1 minute
            maxSize: 100
        },
        circuitBreaker: {
            failureThreshold: 3,
            timeout: 10000,
            resetTimeout: 30000
        }
    }
};

export function getChainConfig(environment = process.env.NODE_ENV) {
    return chainConfigs[environment] || chainConfigs.development;
}
```

**Usage:**

```javascript
import { getChainConfig } from './config/chains.js';

const config = getChainConfig();

const productionChain = new RetryChain({
    chain: new CircuitBreakerChain({
        chain: new CacheChain({
            chain: new LLMChain({
                prompt: promptTemplate,
                llm: new LlamaCppLLM(config.llm)
            }),
            ...config.cache
        }),
        ...config.circuitBreaker
    }),
    ...config.retry
});
```

---

### 2. Monitoring and Observability

**Comprehensive monitoring:**

```javascript
// monitoring/chain-monitor.js

import { EventEmitter } from 'events';

export class ChainMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            invocations: 0,
            successes: 0,
            failures: 0,
            totalLatency: 0,
            cacheHits: 0,
            cacheMisses: 0,
            retries: 0
        };
    }

    recordInvocation(chainName) {
        this.metrics.invocations++;
        this.emit('invocation', { chainName, timestamp: Date.now() });
    }

    recordSuccess(chainName, latency) {
        this.metrics.successes++;
        this.metrics.totalLatency += latency;
        this.emit('success', { chainName, latency, timestamp: Date.now() });
    }

    recordFailure(chainName, error) {
        this.metrics.failures++;
        this.emit('failure', { chainName, error, timestamp: Date.now() });
    }

    recordCacheHit(chainName) {
        this.metrics.cacheHits++;
        this.emit('cache_hit', { chainName, timestamp: Date.now() });
    }

    recordCacheMiss(chainName) {
        this.metrics.cacheMisses++;
        this.emit('cache_miss', { chainName, timestamp: Date.now() });
    }

    recordRetry(chainName, attempt) {
        this.metrics.retries++;
        this.emit('retry', { chainName, attempt, timestamp: Date.now() });
    }

    getMetrics() {
        const avgLatency = this.metrics.invocations > 0
            ? this.metrics.totalLatency / this.metrics.invocations
            : 0;

        const successRate = this.metrics.invocations > 0
            ? (this.metrics.successes / this.metrics.invocations) * 100
            : 0;

        const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
            ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
            : 0;

        return {
            ...this.metrics,
            avgLatency: Math.round(avgLatency),
            successRate: successRate.toFixed(2),
            cacheHitRate: cacheHitRate.toFixed(2)
        };
    }

    reset() {
        this.metrics = {
            invocations: 0,
            successes: 0,
            failures: 0,
            totalLatency: 0,
            cacheHits: 0,
            cacheMisses: 0,
            retries: 0
        };
    }
}

// Monitored chain wrapper
export class MonitoredChain extends BaseChain {
    constructor(options = {}) {
        super();
        
        this.chain = options.chain;
        this.monitor = options.monitor || new ChainMonitor();
    }

    get inputKeys() {
        return this.chain.inputKeys;
    }

    get outputKeys() {
        return this.chain.outputKeys;
    }

    async _call(inputs, config) {
        const startTime = Date.now();
        this.monitor.recordInvocation(this.chain.name);

        try {
            const result = await this.chain.invoke(inputs, config);
            
            const latency = Date.now() - startTime;
            this.monitor.recordSuccess(this.chain.name, latency);
            
            return result;
        } catch (error) {
            this.monitor.recordFailure(this.chain.name, error);
            throw error;
        }
    }

    getMetrics() {
        return this.monitor.getMetrics();
    }

    get _chainType() {
        return 'monitored_chain';
    }
}
```

**Usage:**

```javascript
import { ChainMonitor, MonitoredChain } from './monitoring/chain-monitor.js';

const monitor = new ChainMonitor();

// Listen to events
monitor.on('failure', ({ chainName, error, timestamp }) => {
    console.error(`Chain ${chainName} failed at ${new Date(timestamp)}:`, error);
    // Send to error tracking service
    sendToSentry(error);
});

monitor.on('retry', ({ chainName, attempt }) => {
    console.warn(`Chain ${chainName} retry attempt ${attempt}`);
});

// Wrap chain
const monitoredChain = new MonitoredChain({
    chain: productionChain,
    monitor
});

// Use normally
await monitoredChain.invoke({ input: "..." });

// View metrics
console.log(monitor.getMetrics());
// {
//   invocations: 1000,
//   successes: 980,
//   failures: 20,
//   avgLatency: 450,
//   successRate: "98.00",
//   cacheHitRate: "75.50",
//   retries: 15
// }
```

---

### 3. Graceful Degradation Strategy

**Multi-tier fallback with monitoring:**

```javascript
// strategies/graceful-degradation.js

import { FallbackChain } from '../chains/fallback-chain.js';
import { RetryChain } from '../chains/retry-chain.js';
import { CacheChain } from '../chains/cache-chain.js';
import { CircuitBreakerChain } from '../chains/circuit-breaker-chain.js';

export function createResilientChain(options = {}) {
    const {
        primaryChain,
        secondaryChain,
        localChain,
        cache,
        monitor
    } = options;

    // Tier 1: Primary chain with full protection
    const protectedPrimary = new CircuitBreakerChain({
        chain: new RetryChain({
            chain: new CacheChain({
                chain: primaryChain,
                cache: cache,
                onCacheHit: () => monitor?.recordCacheHit('primary')
            }),
            maxRetries: 3,
            onRetry: (info) => monitor?.recordRetry('primary', info.attempt)
        }),
        failureThreshold: 5,
        onStateChange: ({ from, to }) => {
            console.log(`Primary circuit: ${from} → ${to}`);
            if (to === 'open') {
                alertOncall('Primary service circuit opened');
            }
        }
    });

    // Tier 2: Secondary chain with moderate protection
    const protectedSecondary = new RetryChain({
        chain: new CacheChain({
            chain: secondaryChain,
            cache: cache,
            onCacheHit: () => monitor?.recordCacheHit('secondary')
        }),
        maxRetries: 2
    });

    // Tier 3: Local chain (always available)
    const protectedLocal = new CacheChain({
        chain: localChain,
        cache: cache,
        onCacheHit: () => monitor?.recordCacheHit('local')
    });

    // Create fallback chain
    return new FallbackChain({
        chains: [protectedPrimary, protectedSecondary, protectedLocal],
        onFallback: async ({ fallbackChain, fallbackIndex }) => {
            console.warn(`Falling back to tier ${fallbackIndex + 1}: ${fallbackChain}`);
            monitor?.recordFallback(fallbackIndex);
            
            // Alert if using last resort
            if (fallbackIndex === 2) {
                alertOncall('Using local fallback - all remote services failed');
            }
        }
    });
}
```

**Usage:**

```javascript
const resilientChain = createResilientChain({
    primaryChain: gpt4Chain,
    secondaryChain: claudeChain,
    localChain: llamaChain,
    cache: redisCache,
    monitor: chainMonitor
});

// Always gets a response, even if services are down
const result = await resilientChain.invoke({ query: "..." });
```

---

### 4. Rate Limiting

**Token bucket rate limiter:**

```javascript
// utils/rate-limiter.js

export class RateLimiter {
    constructor(options = {}) {
        this.maxTokens = options.maxTokens || 100;
        this.refillRate = options.refillRate || 10; // tokens per second
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
    }

    async acquire(tokens = 1) {
        this._refill();

        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return true;
        }

        // Wait for tokens to refill
        const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        this._refill();
        this.tokens -= tokens;
        return true;
    }

    _refill() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000;
        const tokensToAdd = timePassed * this.refillRate;
        
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
}

// Rate limited chain
import { BaseChain } from '../chains/base-chain.js';

export class RateLimitedChain extends BaseChain {
    constructor(options = {}) {
        super();
        
        this.chain = options.chain;
        this.rateLimiter = options.rateLimiter || new RateLimiter();
    }

    get inputKeys() {
        return this.chain.inputKeys;
    }

    get outputKeys() {
        return this.chain.outputKeys;
    }

    async _call(inputs, config) {
        // Acquire token before proceeding
        await this.rateLimiter.acquire(1);
        
        return await this.chain.invoke(inputs, config);
    }

    get _chainType() {
        return 'rate_limited_chain';
    }
}
```

**Usage:**

```javascript
const rateLimiter = new RateLimiter({
    maxTokens: 100,
    refillRate: 10  // 10 requests per second
});

const rateLimitedChain = new RateLimitedChain({
    chain: expensiveAPIChain,
    rateLimiter
});

// Automatically throttled
for (let i = 0; i < 1000; i++) {
    await rateLimitedChain.invoke({ query: `query ${i}` });
    // Automatically rate-limited to 10/sec
}
```

---

## Real-World Use Cases

### Use Case 1: Customer Support Automation

**Multi-step support pipeline:**

```javascript
// use-cases/customer-support.js

import { SequentialChain } from '../chains/sequential-chain.js';
import { RouterChain } from '../chains/router-chain.js';
import { LLMChain } from '../chains/llm-chain.js';
import { TransformChain } from '../chains/transform-chain.js';
import { PromptTemplate } from '../prompts/prompt-template.js';

export function createSupportPipeline(llm) {
    // Step 1: Classify intent
    const intentClassifier = new LLMChain({
        prompt: new PromptTemplate({
            template: `Classify this customer message into one category:
- technical_issue
- billing_question
- feature_request
- general_inquiry

Message: {message}

Category:`,
            inputVariables: ["message"]
        }),
        llm: llm,
        outputKey: "intent"
    });

    // Step 2: Extract entities
    const entityExtractor = new LLMChain({
        prompt: new PromptTemplate({
            template: `Extract key entities from this message:
Message: {message}

Respond in JSON format:
{
  "product": "product name or null",
  "issue_type": "issue type or null",
  "urgency": "low|medium|high"
}`,
            inputVariables: ["message"]
        }),
        llm: llm,
        outputParser: new JSONOutputParser(),
        outputKey: "entities"
    });

    // Step 3: Route to appropriate handler
    const technicalHandler = new LLMChain({
        prompt: new PromptTemplate({
            template: `As a technical support agent, help with this issue:
Message: {message}
Product: {entities.product}
Issue Type: {entities.issue_type}

Provide a helpful, technical response:`,
            inputVariables: ["message", "entities"]
        }),
        llm: llm,
        outputKey: "response"
    });

    const billingHandler = new LLMChain({
        prompt: new PromptTemplate({
            template: `As a billing specialist, help with this question:
Message: {message}

Provide a clear, helpful response about billing:`,
            inputVariables: ["message"]
        }),
        llm: llm,
        outputKey: "response"
    });

    const generalHandler = new LLMChain({
        prompt: new PromptTemplate({
            template: `As a customer service representative, respond to:
Message: {message}

Provide a friendly, helpful response:`,
            inputVariables: ["message"]
        }),
        llm: llm,
        outputKey: "response"
    });

    const router = new RouterChain({
        destinationChains: {
            "technical_issue": technicalHandler,
            "billing_question": billingHandler,
            "feature_request": generalHandler,
            "general_inquiry": generalHandler
        },
        routeKey: "intent"
    });

    // Step 4: Format final response
    const responseFormatter = new TransformChain({
        transform: async (inputs) => ({
            formattedResponse: {
                intent: inputs.intent,
                entities: inputs.entities,
                response: inputs.response,
                suggestedActions: generateSuggestedActions(inputs.intent, inputs.entities),
                escalate: inputs.entities.urgency === 'high'
            }
        }),
        inputVariables: ["intent", "entities", "response"],
        outputVariables: ["formattedResponse"]
    });

    // Combine into pipeline
    return new SequentialChain({
        chains: [
            intentClassifier,
            entityExtractor,
            router,
            responseFormatter
        ],
        inputVariables: ["message"],
        outputVariables: ["formattedResponse"]
    });
}

function generateSuggestedActions(intent, entities) {
    const actions = [];
    
    if (intent === 'technical_issue') {
        actions.push('Check system status');
        actions.push('Review documentation');
        if (entities.urgency === 'high') {
            actions.push('Escalate to senior support');
        }
    } else if (intent === 'billing_question') {
        actions.push('Review billing history');
        actions.push('Check payment methods');
    }
    
    return actions;
}
```

**Usage:**

```javascript
const supportPipeline = createSupportPipeline(llm);

const result = await supportPipeline.invoke({
    message: "My payment failed and I can't access the premium features. This is urgent!"
});

console.log(result.formattedResponse);
// {
//   intent: "billing_question",
//   entities: {
//     product: "premium features",
//     issue_type: "payment failed",
//     urgency: "high"
//   },
//   response: "I understand you're experiencing a payment issue...",
//   suggestedActions: [
//     "Review billing history",
//     "Check payment methods"
//   ],
//   escalate: true
// }

if (result.formattedResponse.escalate) {
    await escalateToHuman(result);
}
```

---

### Use Case 2: Content Moderation Pipeline

**Multi-layer content analysis:**

```javascript
// use-cases/content-moderation.js

import { ParallelChain } from '../chains/parallel-chain.js';
import { SequentialChain } from '../chains/sequential-chain.js';
import { LLMChain } from '../chains/llm-chain.js';
import { TransformChain } from '../chains/transform-chain.js';

export function createModerationPipeline(llm) {
    // Parallel analysis
    const toxicityDetector = new LLMChain({
        prompt: new PromptTemplate({
            template: `Analyze this text for toxicity (0-10 scale):
Text: {content}

Score (0-10):`,
            inputVariables: ["content"]
        }),
        llm: llm,
        outputKey: "toxicityScore"
    });

    const spamDetector = new LLMChain({
        prompt: new PromptTemplate({
            template: `Is this spam? (yes/no):
Text: {content}

Answer:`,
            inputVariables: ["content"]
        }),
        llm: llm,
        outputKey: "isSpam"
    });

    const violationDetector = new LLMChain({
        prompt: new PromptTemplate({
            template: `Check for policy violations:
- Hate speech
- Violence
- Sexual content
- Personal information

Text: {content}

Violations (comma-separated or "none"):`,
            inputVariables: ["content"]
        }),
        llm: llm,
        outputKey: "violations"
    });

    const sentimentAnalyzer = new LLMChain({
        prompt: new PromptTemplate({
            template: `Sentiment (positive/negative/neutral):
Text: {content}

Sentiment:`,
            inputVariables: ["content"]
        }),
        llm: llm,
        outputKey: "sentiment"
    });

    // Run all checks in parallel
    const parallelAnalysis = new ParallelChain({
        chains: {
            toxicity: toxicityDetector,
            spam: spamDetector,
            violations: violationDetector,
            sentiment: sentimentAnalyzer
        },
        failFast: false
    });

    // Decision maker
    const decisionChain = new TransformChain({
        transform: async (inputs) => {
            const toxicityScore = parseInt(inputs.toxicity) || 0;
            const isSpam = inputs.spam?.toLowerCase().includes('yes');
            const hasViolations = inputs.violations?.toLowerCase() !== 'none';

            let action = 'approve';
            let confidence = 1.0;
            let reasons = [];

            if (toxicityScore >= 7) {
                action = 'reject';
                reasons.push(`High toxicity: ${toxicityScore}/10`);
            } else if (toxicityScore >= 5) {
                action = 'review';
                confidence = 0.7;
                reasons.push(`Moderate toxicity: ${toxicityScore}/10`);
            }

            if (isSpam) {
                action = 'reject';
                reasons.push('Detected as spam');
            }

            if (hasViolations) {
                action = action === 'reject' ? 'reject' : 'review';
                reasons.push(`Policy violations: ${inputs.violations}`);
            }

            return {
                decision: {
                    action,
                    confidence,
                    reasons,
                    analysis: {
                        toxicity: toxicityScore,
                        spam: isSpam,
                        violations: inputs.violations,
                        sentiment: inputs.sentiment
                    },
                    timestamp: new Date().toISOString()
                }
            };
        },
        inputVariables: ["toxicity", "spam", "violations", "sentiment"],
        outputVariables: ["decision"]
    });

    // Complete pipeline
    return new SequentialChain({
        chains: [parallelAnalysis, decisionChain],
        inputVariables: ["content"],
        outputVariables: ["decision"]
    });
}
```

**Usage:**

```javascript
const moderationPipeline = createModerationPipeline(llm);

// Moderate user-generated content
async function moderateContent(content) {
    const result = await moderationPipeline.invoke({ content });
    
    const decision = result.decision;
    
    switch (decision.action) {
        case 'approve':
            await publishContent(content);
            break;
        
        case 'reject':
            await notifyUser('Content rejected', decision.reasons);
            await logRejection(content, decision);
            break;
        
        case 'review':
            await queueForHumanReview(content, decision);
            break;
    }
    
    return decision;
}

// Use in production
const decision = await moderateContent(userComment);
```

---

### Use Case 3: Document Processing System

**Extract, analyze, and summarize documents:**

```javascript
// use-cases/document-processing.js

import { SequentialChain } from '../chains/sequential-chain.js';
import { ParallelChain } from '../chains/parallel-chain.js';
import { LLMChain } from '../chains/llm-chain.js';
import { TransformChain } from '../chains/transform-chain.js';

export function createDocumentProcessor(llm) {
    // Step 1: Extract text and metadata
    const extractionChain = new TransformChain({
        transform: async (inputs) => {
            // Extract text from document
            const text = await extractTextFromDocument(inputs.document);
            
            // Extract metadata
            const metadata = {
                length: text.length,
                wordCount: text.split(/\s+/).length,
                estimatedReadTime: Math.ceil(text.split(/\s+/).length / 200)
            };
            
            return {
                text,
                metadata
            };
        },
        inputVariables: ["document"],
        outputVariables: ["text", "metadata"]
    });

    // Step 2: Parallel analysis
    const summaryChain = new LLMChain({
        prompt: new PromptTemplate({
            template: `Summarize this document in 3-5 sentences:

{text}

Summary:`,
            inputVariables: ["text"]
        }),
        llm: llm,
        outputKey: "summary"
    });

    const topicsChain = new LLMChain({
        prompt: new PromptTemplate({
            template: `Extract the main topics (max 5) from this document:

{text}

Topics (comma-separated):`,
            inputVariables: ["text"]
        }),
        llm: llm,
        outputKey: "topics"
    });

    const keyPointsChain = new LLMChain({
        prompt: new PromptTemplate({
            template: `Extract key points (max 10) from this document:

{text}

Key Points (one per line):`,
            inputVariables: ["text"]
        }),
        llm: llm,
        outputKey: "keyPoints"
    });

    const entitiesChain = new LLMChain({
        prompt: new PromptTemplate({
            template: `Extract named entities (people, organizations, locations) from:

{text}

Entities in JSON format:
{
  "people": [],
  "organizations": [],
  "locations": []
}`,
            inputVariables: ["text"]
        }),
        llm: llm,
        outputParser: new JSONOutputParser(),
        outputKey: "entities"
    });

    const parallelAnalysis = new ParallelChain({
        chains: {
            summary: summaryChain,
            topics: topicsChain,
            keyPoints: keyPointsChain,
            entities: entitiesChain
        }
    });

    // Step 3: Generate insights
    const insightsChain = new LLMChain({
        prompt: new PromptTemplate({
            template: `Based on this analysis, generate insights:

Summary: {summary}
Topics: {topics}
Key Points: {keyPoints}
Entities: {entities}

Provide 3-5 actionable insights:`,
            inputVariables: ["summary", "topics", "keyPoints", "entities"]
        }),
        llm: llm,
        outputKey: "insights"
    });

    // Step 4: Format output
    const formatterChain = new TransformChain({
        transform: async (inputs) => ({
            processedDocument: {
                metadata: inputs.metadata,
                summary: inputs.summary,
                topics: inputs.topics.split(',').map(t => t.trim()),
                keyPoints: inputs.keyPoints.split('\n').filter(Boolean),
                entities: inputs.entities,
                insights: inputs.insights.split('\n').filter(Boolean),
                processedAt: new Date().toISOString()
            }
        }),
        inputVariables: ["metadata", "summary", "topics", "keyPoints", "entities", "insights"],
        outputVariables: ["processedDocument"]
    });

    // Complete pipeline
    return new SequentialChain({
        chains: [
            extractionChain,
            parallelAnalysis,
            insightsChain,
            formatterChain
        ],
        inputVariables: ["document"],
        outputVariables: ["processedDocument"]
    });
}

async function extractTextFromDocument(document) {
    // Implementation depends on document type
    // Could use PDF parsing, OCR, etc.
    return document.text || document;
}
```

**Usage:**

```javascript
const processor = createDocumentProcessor(llm);

// Process uploaded documents
async function processUpload(file) {
    const result = await processor.invoke({
        document: file
    });
    
    const doc = result.processedDocument;
    
    // Store in database
    await database.documents.create({
        id: generateId(),
        filename: file.name,
        ...doc
    });
    
    // Index for search
    await searchIndex.add({
        id: doc.id,
        content: doc.summary,
        topics: doc.topics,
        entities: doc.entities
    });
    
    return doc;
}

// Batch processing
async function processBatch(files) {
    const results = await Promise.all(
        files.map(file => processUpload(file))
    );
    
    return results;
}
```

---

## Summary

### Key Takeaways

1. **Chains compose components elegantly**
    - Reduce boilerplate
    - Improve reusability
    - Enable testing

2. **Advanced patterns solve real problems**
    - Retry for transient failures
    - Fallback for graceful degradation
    - Cache for performance
    - Parallel for speed
    - Circuit breaker for resilience

3. **Production requires robustness**
    - Error handling
    - Monitoring
    - Rate limiting
    - Configuration management

4. **Real-world use cases are complex**
    - Multi-step pipelines
    - Parallel processing
    - Conditional routing
    - Error recovery

### Chain Composition Cheat Sheet

```javascript
// Basic chain
const basic = new LLMChain({ prompt, llm });

// With retry
const withRetry = new RetryChain({ chain: basic, maxRetries: 3 });

// With cache
const withCache = new CacheChain({ chain: basic, ttl: 3600000 });

// With fallback
const withFallback = new FallbackChain({ 
    chains: [primary, secondary, local] 
});

// With circuit breaker
const withBreaker = new CircuitBreakerChain({ 
    chain: basic, 
    failureThreshold: 5 
});

// Full production stack
const production = new MonitoredChain({
    chain: new RateLimitedChain({
        chain: new RetryChain({
            chain: new CircuitBreakerChain({
                chain: new CacheChain({
                    chain: new FallbackChain({
                        chains: [primary, secondary, local]
                    }),
                    cache: redisCache
                }),
                failureThreshold: 5
            }),
            maxRetries: 3
        }),
        rateLimiter: rateLimiter
    }),
    monitor: monitor
});
```

### Best Practices Checklist

- ✅ Use retry for transient failures
- ✅ Implement fallback for critical chains
- ✅ Cache expensive operations
- ✅ Add circuit breakers for external services
- ✅ Monitor all production chains
- ✅ Test chains thoroughly
- ✅ Configure per environment
- ✅ Rate limit API calls
- ✅ Log errors comprehensively
- ✅ Use parallel chains when possible

### Next Steps

Now that you understand chains:

1. **Practice**: Build chains for your use case
2. **Compose**: Combine multiple patterns
3. **Monitor**: Track performance in production
4. **Optimize**: Use caching and parallelization
5. **Scale**: Add retry, fallback, and circuit breakers

**Next lesson**: Agents - Adding tool use and reasoning to chains.

---

## Additional Resources

### Related Lessons
- Part 2, Lesson 1: Prompts
- Part 2, Lesson 2: Output Parsers
- Part 2, Lesson 4: Agents (upcoming)

### Files Created
- `src/chains/retry-chain.js`
- `src/chains/fallback-chain.js`
- `src/chains/cache-chain.js`
- `src/chains/parallel-chain.js`
- `src/chains/circuit-breaker-chain.js`
- `src/monitoring/chain-monitor.js`
- `src/utils/rate-limiter.js`

### External Reading
- Martin Fowler - Circuit Breaker Pattern
- AWS - Exponential Backoff and Jitter
- Google SRE - Cascading Failures