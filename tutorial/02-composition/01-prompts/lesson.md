# Prompts: Template-Driven LLM Inputs

**Part 2: Composition - Lesson 1**

> Stop hardcoding prompts. Start composing them.

## Overview

You've been writing prompts like this:

```javascript
const prompt = `You are a helpful assistant. The user asked: ${userInput}`;
const response = await llm.invoke(prompt);
```

This works, but it's fragile. What if you need:
- Different system messages for different use cases?
- To inject multiple variables?
- To reuse prompt patterns across your app?
- To validate inputs before sending to the LLM?
- To compose prompts from smaller pieces?

**PromptTemplates** solve all of these problems.

## Why This Matters

### The Problem: Prompt Chaos

Without templates, your code becomes a mess:

```javascript
// Scattered throughout your codebase:
const prompt1 = `Translate to ${lang}: ${text}`;
const prompt2 = "Translate to " + language + ": " + input;
const prompt3 = `Translate to ${target_language}: ${user_text}`;

// Same logic, different implementations everywhere!
```

Problems:
- No consistency in prompt format
- Hard to test prompts in isolation
- Can't reuse prompt patterns
- Difficult to track what prompts are being used
- No validation of variables

### The Solution: PromptTemplate

```javascript
const translatePrompt = new PromptTemplate({
    template: "Translate to {language}: {text}",
    inputVariables: ["language", "text"]
});

const prompt = await translatePrompt.format({
    language: "Spanish",
    text: "Hello, world!"
});
// "Translate to Spanish: Hello, world!"
```

Benefits:
- ✅ Reusable prompt patterns
- ✅ Variable validation
- ✅ Testable in isolation
- ✅ Composable with other Runnables
- ✅ Type-safe variable injection

## Learning Objectives

By the end of this lesson, you will:

- ✅ Build a PromptTemplate class that replaces variables
- ✅ Create ChatPromptTemplate for structured messages
- ✅ Implement Few-Shot prompts for examples
- ✅ Build Pipeline prompts for composition
- ✅ Use prompts as Runnables in chains
- ✅ Understand LangChain's prompting patterns

## Core Concepts

### What is a PromptTemplate?

A PromptTemplate is a **reusable prompt pattern** with placeholders for variables.

**Structure:**
```
Template String: "Translate to {language}: {text}"
                           ↓
Variables Injected: { language: "Spanish", text: "Hello" }
                           ↓
Output: "Translate to Spanish: Hello"
```

### The Prompt Hierarchy

```
BasePromptTemplate (abstract)
    ├── PromptTemplate (string templates)
    ├── ChatPromptTemplate (message templates)
    ├── FewShotPromptTemplate (examples + template)
    ├── PipelinePromptTemplate (compose templates)
    └── SystemMessagePromptTemplate (system message helper)
```

Each type serves a specific use case.

### Key Operations

1. **Format**: Replace variables with values
2. **Validate**: Check required variables are provided
3. **Compose**: Combine templates together
4. **Invoke**: Use as a Runnable (returns formatted prompt)

## Implementation Guide

### Step 1: Base Prompt Template

**Location:** [`src/prompts/base-prompt-template.js`](../../../src/prompts/base-prompt-template.js)

This is the abstract base class all prompts inherit from.

**What it does:**
- Defines the interface for all prompt templates
- Extends Runnable (so prompts work in chains)
- Provides validation logic

**Key methods:**
- `format(values)` - Replace variables and return string/messages
- `formatPromptValue(values)` - Return as PromptValue (for messages)
- `_validateInput(values)` - Check all required variables present

**Implementation:**

```javascript
import { Runnable } from '../core/runnable.js';

/**
 * Base class for all prompt templates
 */
export class BasePromptTemplate extends Runnable {
    constructor(options = {}) {
        super();
        this.inputVariables = options.inputVariables || [];
        this.partialVariables = options.partialVariables || {};
    }

    /**
     * Format the prompt with given values
     * @abstract
     */
    async format(values) {
        throw new Error('Subclasses must implement format()');
    }

    /**
     * Runnable interface: invoke returns formatted prompt
     */
    async _call(input, config) {
        return await this.format(input);
    }

    /**
     * Validate that all required variables are provided
     */
    _validateInput(values) {
        const provided = { ...this.partialVariables, ...values };
        const missing = this.inputVariables.filter(
            key => !(key in provided)
        );

        if (missing.length > 0) {
            throw new Error(
                `Missing required input variables: ${missing.join(', ')}`
            );
        }
    }

    /**
     * Merge partial variables with provided values
     */
    _mergePartialAndUserVariables(values) {
        return { ...this.partialVariables, ...values };
    }
}
```

**Key insights:**
- Extends `Runnable` so prompts can be chained
- `_call` invokes `format` - this makes prompts work in pipelines
- Validation ensures all variables are provided
- Partial variables are pre-filled defaults

---

### Step 2: PromptTemplate

**Location:** [`src/prompts/prompt-template.js`](../../../src/prompts/prompt-template.js)

The most common prompt template - replaces `{variable}` placeholders.

**What it does:**
- Takes a template string with `{placeholders}`
- Replaces placeholders with actual values
- Validates all variables are provided

**Template syntax:**
```javascript
"Hello {name}, you are {age} years old."
```

**Implementation:**

```javascript
import { BasePromptTemplate } from './base-prompt-template.js';

/**
 * Simple string template with {variable} placeholders
 * 
 * Example:
 *   const prompt = new PromptTemplate({
 *       template: "Translate to {language}: {text}",
 *       inputVariables: ["language", "text"]
 *   });
 *   
 *   await prompt.format({ language: "Spanish", text: "Hello" });
 *   // "Translate to Spanish: Hello"
 */
export class PromptTemplate extends BasePromptTemplate {
    constructor(options = {}) {
        super(options);
        this.template = options.template;

        // Auto-detect input variables if not provided
        if (!options.inputVariables) {
            this.inputVariables = this._extractInputVariables(this.template);
        }
    }

    /**
     * Format the template with provided values
     */
    async format(values) {
        this._validateInput(values);
        const allValues = this._mergePartialAndUserVariables(values);

        let result = this.template;
        for (const [key, value] of Object.entries(allValues)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            result = result.replace(regex, String(value));
        }

        return result;
    }

    /**
     * Extract variable names from template string
     * Finds all {variable} patterns
     */
    _extractInputVariables(template) {
        const matches = template.match(/\{(\w+)\}/g) || [];
        return matches.map(match => match.slice(1, -1));
    }

    /**
     * Static helper to create from template string
     */
    static fromTemplate(template, options = {}) {
        return new PromptTemplate({
            template,
            ...options
        });
    }
}
```

**Usage example:**

```javascript
const prompt = new PromptTemplate({
    template: "Translate to {language}: {text}",
    inputVariables: ["language", "text"]
});

const formatted = await prompt.format({
    language: "Spanish",
    text: "Hello, world!"
});
// "Translate to Spanish: Hello, world!"
```

---

### Step 3: ChatPromptTemplate

**Location:** [`src/prompts/chat-prompt-template.js`](../../../src/prompts/chat-prompt-template.js)

For structured conversations with system/user/assistant messages.

**What it does:**
- Creates arrays of Message objects
- Supports system, human, and AI message templates
- Returns properly formatted conversation structure

**Message template syntax:**
```javascript
[
    ["system", "You are a {role}"],
    ["human", "My question: {question}"],
    ["ai", "Let me help with {topic}"]
]
```

**Implementation:**

```javascript
import { BasePromptTemplate } from './base-prompt-template.js';
import { SystemMessage, HumanMessage, AIMessage } from '../core/message.js';
import { PromptTemplate } from './prompt-template.js';

/**
 * Template for chat-based conversations
 * Returns an array of Message objects
 * 
 * Example:
 *   const prompt = ChatPromptTemplate.fromMessages([
 *       ["system", "You are a {role}"],
 *       ["human", "{input}"]
 *   ]);
 *   
 *   const messages = await prompt.format({
 *       role: "translator",
 *       input: "Hello"
 *   });
 *   // [SystemMessage(...), HumanMessage(...)]
 */
export class ChatPromptTemplate extends BasePromptTemplate {
    constructor(options = {}) {
        super(options);
        this.promptMessages = options.promptMessages || [];
    }

    /**
     * Format into array of Message objects
     */
    async format(values) {
        this._validateInput(values);
        const allValues = this._mergePartialAndUserVariables(values);

        const messages = [];
        for (const [role, template] of this.promptMessages) {
            const content = await this._formatMessageTemplate(template, allValues);
            messages.push(this._createMessage(role, content));
        }

        return messages;
    }

    /**
     * Format a single message template
     */
    async _formatMessageTemplate(template, values) {
        if (typeof template === 'string') {
            const promptTemplate = new PromptTemplate({ template });
            return await promptTemplate.format(values);
        }
        return template;
    }

    /**
     * Create appropriate Message object for role
     */
    _createMessage(role, content) {
        switch (role.toLowerCase()) {
            case 'system':
                return new SystemMessage(content);
            case 'human':
            case 'user':
                return new HumanMessage(content);
            case 'ai':
            case 'assistant':
                return new AIMessage(content);
            default:
                throw new Error(`Unknown message role: ${role}`);
        }
    }

    /**
     * Static helper to create from message list
     */
    static fromMessages(messages, options = {}) {
        const promptMessages = messages.map(msg => {
            if (Array.isArray(msg)) {
                return msg; // [role, template]
            }
            throw new Error('Each message must be [role, template] array');
        });

        // Extract all input variables from all templates
        const inputVariables = new Set();
        for (const [, template] of promptMessages) {
            if (typeof template === 'string') {
                const matches = template.match(/\{(\w+)\}/g) || [];
                matches.forEach(m => inputVariables.add(m.slice(1, -1)));
            }
        }

        return new ChatPromptTemplate({
            promptMessages,
            inputVariables: Array.from(inputVariables),
            ...options
        });
    }
}
```

**Usage example:**

```javascript
const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a {role} assistant"],
    ["human", "My question: {question}"]
]);

const messages = await chatPrompt.format({
    role: "helpful",
    question: "What's the weather?"
});

// Returns:
// [
//   SystemMessage("You are a helpful assistant"),
//   HumanMessage("My question: What's the weather?")
// ]
```

---

### Step 4: Few-Shot Prompt Template

**Location:** [`src/prompts/few-shot-prompt.js`](../../../src/prompts/few-shot-prompt.js)

For including examples in your prompts (few-shot learning).

**What it does:**
- Takes a list of examples
- Formats each example with a template
- Combines examples with the main prompt

**Structure:**
```
Examples:
  Input: 2+2  Output: 4
  Input: 3+5  Output: 8

Prompt: Input: {input}  Output:
```

**Implementation:**

```javascript
import { BasePromptTemplate } from './base-prompt-template.js';
import { PromptTemplate } from './prompt-template.js';

/**
 * Prompt template that includes examples (few-shot learning)
 * 
 * Example:
 *   const fewShot = new FewShotPromptTemplate({
 *       examples: [
 *           { input: "2+2", output: "4" },
 *           { input: "3+5", output: "8" }
 *       ],
 *       examplePrompt: new PromptTemplate({
 *           template: "Input: {input}\nOutput: {output}",
 *           inputVariables: ["input", "output"]
 *       }),
 *       prefix: "Solve these math problems:",
 *       suffix: "Input: {input}\nOutput:",
 *       inputVariables: ["input"]
 *   });
 */
export class FewShotPromptTemplate extends BasePromptTemplate {
    constructor(options = {}) {
        super(options);
        this.examples = options.examples || [];
        this.examplePrompt = options.examplePrompt;
        this.prefix = options.prefix || '';
        this.suffix = options.suffix || '';
        this.exampleSeparator = options.exampleSeparator || '\n\n';
    }

    /**
     * Format the few-shot prompt
     */
    async format(values) {
        this._validateInput(values);
        const allValues = this._mergePartialAndUserVariables(values);

        const parts = [];

        // Add prefix
        if (this.prefix) {
            const prefixTemplate = new PromptTemplate({ template: this.prefix });
            parts.push(await prefixTemplate.format(allValues));
        }

        // Add formatted examples
        if (this.examples.length > 0) {
            const exampleStrings = await Promise.all(
                this.examples.map(ex => this.examplePrompt.format(ex))
            );
            parts.push(exampleStrings.join(this.exampleSeparator));
        }

        // Add suffix
        if (this.suffix) {
            const suffixTemplate = new PromptTemplate({ template: this.suffix });
            parts.push(await suffixTemplate.format(allValues));
        }

        return parts.join('\n\n');
    }
}
```

**Usage example:**

```javascript
const fewShotPrompt = new FewShotPromptTemplate({
    examples: [
        { input: "happy", output: "sad" },
        { input: "tall", output: "short" }
    ],
    examplePrompt: new PromptTemplate({
        template: "Input: {input}\nOutput: {output}",
        inputVariables: ["input", "output"]
    }),
    prefix: "Give the antonym of each word:",
    suffix: "Input: {word}\nOutput:",
    inputVariables: ["word"]
});

const prompt = await fewShotPrompt.format({ word: "hot" });

// Output:
// Give the antonym of each word:
//
// Input: happy
// Output: sad
//
// Input: tall
// Output: short
//
// Input: hot
// Output:
```

---

### Step 5: Pipeline Prompt Template

**Location:** [`src/prompts/pipeline-prompt.js`](../../../src/prompts/pipeline-prompt.js)

For composing multiple prompts together.

**What it does:**
- Combines multiple prompt templates
- Pipes output of one template to input of another
- Enables modular prompt construction

**Implementation:**

```javascript
import { BasePromptTemplate } from './base-prompt-template.js';

/**
 * Compose multiple prompts into a pipeline
 * 
 * Example:
 *   const pipeline = new PipelinePromptTemplate({
 *       finalPrompt: mainPrompt,
 *       pipelinePrompts: [
 *           { name: "context", prompt: contextPrompt },
 *           { name: "instructions", prompt: instructionPrompt }
 *       ]
 *   });
 */
export class PipelinePromptTemplate extends BasePromptTemplate {
    constructor(options = {}) {
        super(options);
        this.finalPrompt = options.finalPrompt;
        this.pipelinePrompts = options.pipelinePrompts || [];

        // Collect all input variables
        this.inputVariables = this._collectInputVariables();
    }

    /**
     * Format by running pipeline prompts first, then final prompt
     */
    async format(values) {
        this._validateInput(values);
        const allValues = this._mergePartialAndUserVariables(values);

        // Format each pipeline prompt and collect results
        const pipelineResults = {};
        for (const { name, prompt } of this.pipelinePrompts) {
            pipelineResults[name] = await prompt.format(allValues);
        }

        // Merge with original values and format final prompt
        const finalValues = { ...allValues, ...pipelineResults };
        return await this.finalPrompt.format(finalValues);
    }

    /**
     * Collect input variables from all prompts
     */
    _collectInputVariables() {
        const vars = new Set(this.finalPrompt.inputVariables);
        
        for (const { prompt } of this.pipelinePrompts) {
            prompt.inputVariables.forEach(v => vars.add(v));
        }

        // Remove pipeline output names (they're generated)
        this.pipelinePrompts.forEach(({ name }) => vars.delete(name));

        return Array.from(vars);
    }
}
```

**Usage example:**

```javascript
const contextPrompt = new PromptTemplate({
    template: "Context: {topic} is important because {reason}",
    inputVariables: ["topic", "reason"]
});

const mainPrompt = new PromptTemplate({
    template: "{context}\n\nQuestion: {question}",
    inputVariables: ["context", "question"]
});

const pipeline = new PipelinePromptTemplate({
    finalPrompt: mainPrompt,
    pipelinePrompts: [
        { name: "context", prompt: contextPrompt }
    ]
});

const result = await pipeline.format({
    topic: "AI",
    reason: "it transforms industries",
    question: "What are the risks?"
});

// Output:
// Context: AI is important because it transforms industries
//
// Question: What are the risks?
```

### Step 6: System Message Prompt Template

**Location:** [`src/prompts/system-message-prompt.js`](../../../src/prompts/system-message-prompt.js)

A specialized template for creating system messages with consistent formatting.

**What it does:**
- Creates SystemMessage objects with variable substitution
- Simplifies creating reusable system prompts
- Provides a cleaner API than ChatPromptTemplate for system-only messages

**Why this matters:**
System messages set the behavior and context for LLMs. Having a dedicated template makes it easier to:
- Manage different system prompts for different use cases
- A/B test system message variations
- Inject context dynamically (user preferences, current date, etc.)
- Maintain consistent system message formatting

**Implementation:**

```javascript
import { BasePromptTemplate } from './base-prompt-template.js';
import { SystemMessage } from '../core/message.js';
import { PromptTemplate } from './prompt-template.js';

/**
 * Template specifically for system messages
 * Returns a single SystemMessage object
 * 
 * Example:
 *   const systemPrompt = new SystemMessagePromptTemplate({
 *       template: "You are a {role} assistant specialized in {domain}. {instructions}",
 *       inputVariables: ["role", "domain", "instructions"]
 *   });
 *   
 *   const message = await systemPrompt.format({
 *       role: "helpful",
 *       domain: "cooking",
 *       instructions: "Always provide recipe alternatives."
 *   });
 *   // SystemMessage("You are a helpful assistant specialized in cooking. Always provide recipe alternatives.")
 */
export class SystemMessagePromptTemplate extends BasePromptTemplate {
    constructor(options = {}) {
        super(options);
        this.prompt = options.prompt || new PromptTemplate({
            template: options.template,
            inputVariables: options.inputVariables,
            partialVariables: options.partialVariables
        });
        
        // Inherit input variables from inner prompt
        if (!options.inputVariables) {
            this.inputVariables = this.prompt.inputVariables;
        }
    }

    /**
     * Format into a SystemMessage object
     */
    async format(values) {
        this._validateInput(values);
        const allValues = this._mergePartialAndUserVariables(values);
        
        const content = await this.prompt.format(allValues);
        return new SystemMessage(content);
    }

    /**
     * Static helper to create from template string
     */
    static fromTemplate(template, options = {}) {
        return new SystemMessagePromptTemplate({
            template,
            ...options
        });
    }

    /**
     * Create with partial variables pre-filled
     * Useful for setting default context that can be overridden
     */
    static fromTemplateWithPartials(template, partialVariables = {}, options = {}) {
        const promptTemplate = new PromptTemplate({ template });
        const inputVariables = promptTemplate.inputVariables.filter(
            v => !(v in partialVariables)
        );

        return new SystemMessagePromptTemplate({
            template,
            inputVariables,
            partialVariables,
            ...options
        });
    }
}
```

**Usage Examples:**

**Example 1: Basic system message**
```javascript
const systemPrompt = SystemMessagePromptTemplate.fromTemplate(
    "You are a {role} assistant. Always be {tone}."
);

const message = await systemPrompt.format({
    role: "helpful",
    tone: "professional"
});
// SystemMessage("You are a helpful assistant. Always be professional.")
```

**Example 2: System message with partial variables (defaults)**
```javascript
const systemPrompt = SystemMessagePromptTemplate.fromTemplateWithPartials(
    "You are a {role} assistant. Today is {date}. User preference: {preference}",
    {
        date: new Date().toLocaleDateString(),  // Pre-filled default
        preference: "concise responses"          // Pre-filled default
    }
);

// Only need to provide 'role' - others use defaults
const message1 = await systemPrompt.format({
    role: "coding"
});
// SystemMessage("You are a coding assistant. Today is 11/20/2025. User preference: concise responses")

// Can override defaults if needed
const message2 = await systemPrompt.format({
    role: "coding",
    preference: "detailed explanations"
});
// SystemMessage("You are a coding assistant. Today is 11/20/2025. User preference: detailed explanations")
```

**Key Benefits:**

1. **Separation of Concerns**: System prompts are separate from conversation flow
2. **Reusability**: Create once, use in multiple chat templates
3. **A/B Testing**: Easily swap system prompts to test effectiveness
4. **Dynamic Context**: Inject runtime information (date, user prefs, etc.)
5. **Type Safety**: Always returns SystemMessage (not just strings)
6. **Partial Variables**: Set defaults that can be overridden

**Common Use Cases:**

- **Role-based prompting**: Different system messages for different assistant personalities
- **Context injection**: Add current date, user preferences, session info
- **A/B testing**: Test different instruction phrasings
- **Domain switching**: Same app, different domains (customer service vs technical support)
- **Compliance**: Ensure required disclaimers/policies in every system message

---

# Prompts: Real-World Patterns

## Real-World Examples

### Example 1: Translation Service

```javascript
import { PromptTemplate } from './prompts/prompt-template.js';
import { LlamaCppLLM } from './llm/llama-cpp-llm.js';

// Reusable translation prompt
const translationPrompt = new PromptTemplate({
    template: `Translate the following text from {source_lang} to {target_lang}.

Text: {text}

Translation:`,
    inputVariables: ["source_lang", "target_lang", "text"]
});

// Use in your app
const llm = new LlamaCppLLM({ modelPath: './model.gguf' });

// Build a reusable translation chain
const translationChain = translationPrompt.pipe(llm);

// Now you can easily translate
const spanish = await translationChain.invoke({
    source_lang: "English",
    target_lang: "Spanish",
    text: "Hello, how are you?"
});

const french = await translationChain.invoke({
    source_lang: "English",
    target_lang: "French",
    text: "Hello, how are you?"
});
```

**Why this is better:**
- ✅ Prompt pattern defined once, used everywhere
- ✅ Consistent formatting across translations
- ✅ Easy to test prompt in isolation
- ✅ Can swap LLM without changing prompt

---

### Example 2: Customer Support Bot

```javascript
import { ChatPromptTemplate } from './prompts/chat-prompt-template.js';

const supportPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a customer support agent for {company}.

Company details:
- Product: {product}
- Return policy: {return_policy}
- Support hours: {support_hours}

Be helpful, professional, and concise.`],
    ["human", "{customer_message}"]
]);

// Use with partial variables for company info
const myCompanySupportPrompt = supportPrompt.partial({
    company: "TechCorp",
    product: "Cloud Storage",
    return_policy: "30 days",
    support_hours: "9am-5pm EST"
});

// Now only need customer message
const messages = await myCompanySupportPrompt.format({
    customer_message: "How do I cancel my subscription?"
});

const response = await llm.invoke(messages);
```

**Why this is better:**
- ✅ Company info defined once, reused everywhere
- ✅ Partial variables reduce repetition
- ✅ Easy to update company policy in one place
- ✅ Structured conversation format

---

### Example 3: Few-Shot Classification

```javascript
import { FewShotPromptTemplate } from './prompts/few-shot-prompt.js';
import { PromptTemplate } from './prompts/prompt-template.js';

// Example formatter
const examplePrompt = new PromptTemplate({
    template: "Text: {text}\nSentiment: {sentiment}",
    inputVariables: ["text", "sentiment"]
});

// Few-shot sentiment classifier
const sentimentPrompt = new FewShotPromptTemplate({
    examples: [
        { text: "I love this product!", sentiment: "positive" },
        { text: "This is terrible.", sentiment: "negative" },
        { text: "It's okay, I guess.", sentiment: "neutral" }
    ],
    examplePrompt: examplePrompt,
    prefix: "Classify the sentiment of the following texts:",
    suffix: "Text: {input}\nSentiment:",
    inputVariables: ["input"],
    exampleSeparator: "\n\n"
});

const prompt = await sentimentPrompt.format({
    input: "This exceeded my expectations!"
});

// The LLM now has examples to learn from!
const sentiment = await llm.invoke(prompt);
```

**Why this is better:**
- ✅ Examples teach the LLM the task
- ✅ More consistent classifications
- ✅ Easy to add/remove examples
- ✅ Can dynamically select relevant examples

---

### Example 4: Modular Prompt Composition

```javascript
import { PipelinePromptTemplate } from './prompts/pipeline-prompt.js';
import { PromptTemplate } from './prompts/prompt-template.js';

// Reusable context builder
const contextPrompt = new PromptTemplate({
    template: `Domain: {domain}
Key concepts: {concepts}
Current date: {date}`,
    inputVariables: ["domain", "concepts", "date"]
});

// Reusable instruction builder
const instructionPrompt = new PromptTemplate({
    template: `Task: {task}
Format: {format}
Constraints: {constraints}`,
    inputVariables: ["task", "format", "constraints"]
});

// Main prompt uses outputs from sub-prompts
const mainPrompt = new PromptTemplate({
    template: `{context}

{instructions}

Input: {input}

Output:`,
    inputVariables: ["context", "instructions", "input"]
});

// Compose them together
const composedPrompt = new PipelinePromptTemplate({
    finalPrompt: mainPrompt,
    pipelinePrompts: [
        { name: "context", prompt: contextPrompt },
        { name: "instructions", prompt: instructionPrompt }
    ]
});

// Use the composed prompt
const result = await composedPrompt.format({
    domain: "Healthcare",
    concepts: "diagnosis, treatment, patient care",
    date: new Date().toISOString().split('T')[0],
    task: "Analyze symptoms",
    format: "JSON with confidence scores",
    constraints: "HIPAA compliant, evidence-based",
    input: "Patient reports fatigue and headaches"
});
```

**Why this is better:**
- ✅ Modular prompt components
- ✅ Reuse context/instructions across prompts
- ✅ Easy to update individual sections
- ✅ Cleaner prompt management

---

## Advanced Patterns

### Pattern 1: Conditional Prompts

```javascript
class ConditionalPromptTemplate extends BasePromptTemplate {
    constructor(options = {}) {
        super(options);
        this.condition = options.condition;
        this.truePrompt = options.truePrompt;
        this.falsePrompt = options.falsePrompt;
    }

    async format(values) {
        const useTrue = this.condition(values);
        const selectedPrompt = useTrue ? this.truePrompt : this.falsePrompt;
        return await selectedPrompt.format(values);
    }
}

// Usage
const prompt = new ConditionalPromptTemplate({
    condition: (values) => values.userType === 'expert',
    truePrompt: new PromptTemplate({
        template: "Technical analysis: {query}"
    }),
    falsePrompt: new PromptTemplate({
        template: "Explain in simple terms: {query}"
    }),
    inputVariables: ["userType", "query"]
});
```

---

### Pattern 2: Dynamic Examples (Select Best Examples)

```javascript
class DynamicFewShotPromptTemplate extends FewShotPromptTemplate {
    constructor(options = {}) {
        super(options);
        this.exampleSelector = options.exampleSelector;
        this.maxExamples = options.maxExamples || 3;
    }

    async format(values) {
        // Select most relevant examples dynamically
        const selectedExamples = await this.exampleSelector.select(
            values,
            this.maxExamples
        );

        // Temporarily replace examples
        const originalExamples = this.examples;
        this.examples = selectedExamples;

        const result = await super.format(values);

        // Restore original examples
        this.examples = originalExamples;

        return result;
    }
}

// Example selector based on similarity
class SimilarityExampleSelector {
    constructor(examples) {
        this.examples = examples;
    }

    async select(input, k) {
        // In real implementation, use embeddings for similarity
        // For now, simple keyword matching
        const scores = this.examples.map(ex => ({
            example: ex,
            score: this._similarity(ex.input, input.input)
        }));

        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, k).map(s => s.example);
    }

    _similarity(a, b) {
        // Simple word overlap
        const wordsA = new Set(a.toLowerCase().split(' '));
        const wordsB = new Set(b.toLowerCase().split(' '));
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        return intersection.size / Math.max(wordsA.size, wordsB.size);
    }
}
```

---

### Pattern 3: Prompt with Validation

```javascript
class ValidatedPromptTemplate extends PromptTemplate {
    constructor(options = {}) {
        super(options);
        this.validators = options.validators || {};
    }

    async format(values) {
        // Validate each input
        for (const [key, validator] of Object.entries(this.validators)) {
            if (key in values) {
                const isValid = validator(values[key]);
                if (!isValid) {
                    throw new Error(`Invalid value for ${key}: ${values[key]}`);
                }
            }
        }

        return await super.format(values);
    }
}

// Usage
const emailPrompt = new ValidatedPromptTemplate({
    template: "Send email to {email} about {subject}",
    inputVariables: ["email", "subject"],
    validators: {
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        subject: (value) => value.length > 0 && value.length <= 100
    }
});

// This will throw an error
await emailPrompt.format({
    email: "invalid-email",
    subject: "Hi"
});
```

---

### Pattern 4: Prompt Chaining

```javascript
// Chain multiple prompts together
const summaryPrompt = new PromptTemplate({
    template: "Summarize this text: {text}"
});

const bulletPrompt = new PromptTemplate({
    template: "Convert this summary to bullet points:\n{summary}"
});

// Create a chain
const summaryChain = summaryPrompt.pipe(llm);
const bulletChain = bulletPrompt.pipe(llm);

// Use them together
async function summarizeAsBullets(text) {
    const summary = await summaryChain.invoke({ text });
    const bullets = await bulletChain.invoke({ summary });
    return bullets;
}
```

---

## Common Use Cases

### Use Case 1: Multi-Language Support

```javascript
const prompts = {
    en: new PromptTemplate({
        template: "Answer in English: {query}"
    }),
    es: new PromptTemplate({
        template: "Responde en español: {query}"
    }),
    fr: new PromptTemplate({
        template: "Répondre en français: {query}"
    })
};

function getPrompt(language) {
    return prompts[language] || prompts.en;
}

const prompt = getPrompt(userLanguage);
const response = await prompt.pipe(llm).invoke({ query: "Hello" });
```

---

### Use Case 2: A/B Testing Prompts

```javascript
const variantA = new PromptTemplate({
    template: "Explain {concept} simply"
});

const variantB = new PromptTemplate({
    template: "Teach me about {concept} like I'm 5 years old"
});

// Randomly select variant
const prompt = Math.random() < 0.5 ? variantA : variantB;

// Track which variant was used
const config = {
    metadata: { variant: prompt === variantA ? 'A' : 'B' }
};

const response = await prompt.pipe(llm).invoke({ concept: "gravity" }, config);
```

---

### Use Case 3: Prompt Versioning

```javascript
const prompts = {
    v1: new PromptTemplate({
        template: "Classify: {text}"
    }),
    v2: new PromptTemplate({
        template: "Classify the sentiment of: {text}\nOptions: positive, negative, neutral"
    }),
    v3: ChatPromptTemplate.fromMessages([
        ["system", "You are a sentiment classifier. Only respond with: positive, negative, or neutral"],
        ["human", "{text}"]
    ])
};

// Use specific version
const currentPrompt = prompts.v3;

// Easy to roll back if needed
const response = await currentPrompt.pipe(llm).invoke({ text: "I love this!" });
```

---

## Best Practices

### ✅ DO:

**1. Keep prompts in separate files**
```javascript
// prompts/translation.js
export const translationPrompt = new PromptTemplate({
    template: "Translate to {language}: {text}",
    inputVariables: ["language", "text"]
});

// app.js
import { translationPrompt } from './prompts/translation.js';
```

**2. Use partial variables for constants**
```javascript
const prompt = new PromptTemplate({
    template: "Company: {company}\nQuery: {query}",
    partialVariables: {
        company: "MyCompany"
    }
});
```

**3. Test prompts in isolation**
```javascript
const formatted = await prompt.format({ input: "test" });
console.log(formatted);
// Verify output before sending to LLM
```

**4. Version your prompts**
```javascript
// prompts/classifier/v2.js
export const classifierPromptV2 = ...
```

**5. Document your templates**
```javascript
/**
 * Email classification prompt
 * 
 * Variables:
 * - from: Email sender
 * - subject: Email subject
 * - body: Email body
 * 
 * Returns: Category name
 */
export const emailPrompt = ...
```

---

### ❌ DON'T:

**1. Hardcode prompts throughout codebase**
```javascript
// Bad
const result = await llm.invoke(`Translate to ${lang}: ${text}`);
```

**2. Skip input validation**
```javascript
// Bad
const prompt = new PromptTemplate({ template: "..." });
await prompt.format({}); // Missing required variables!
```

**3. Make prompts too complex**
```javascript
// Bad - too many nested conditions
const prompt = condition1 ? (condition2 ? prompt1 : prompt2) : ...
```

**4. Forget to handle formatting errors**
```javascript
// Bad
const formatted = await prompt.format(values); // What if this throws?

// Good
try {
    const formatted = await prompt.format(values);
} catch (error) {
    console.error('Prompt formatting failed:', error);
    // Handle gracefully
}
```

---

## Integration with Framework

### Using Prompts in Chains

```javascript
import { PromptTemplate } from './prompts/prompt-template.js';
import { LlamaCppLLM } from './llm/llama-cpp-llm.js';
import { StringOutputParser } from './output-parsers/string-parser.js';

const prompt = new PromptTemplate({
    template: "Summarize: {text}"
});

const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
const parser = new StringOutputParser();

// Build chain: prompt -> llm -> parser
const chain = prompt.pipe(llm).pipe(parser);

// Use it
const summary = await chain.invoke({ text: "Long article..." });
```

---

### Using Prompts with Memory

```javascript
import { ChatPromptTemplate } from './prompts/chat-prompt-template.js';
import { BufferMemory } from './memory/buffer-memory.js';

const memory = new BufferMemory();

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant"],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"]
]);

// Load history from memory
const chatHistory = await memory.loadMemoryVariables();

const messages = await prompt.format({
    chat_history: chatHistory.history,
    input: "What did we discuss?"
});
```

---

## Testing Prompts

### Unit Testing

```javascript
import { describe, it, expect } from 'your-test-framework';
import { PromptTemplate } from './prompts/prompt-template.js';

describe('PromptTemplate', () => {
    it('should format template with variables', async () => {
        const prompt = new PromptTemplate({
            template: "Hello {name}",
            inputVariables: ["name"]
        });

        const result = await prompt.format({ name: "Alice" });
        expect(result).toBe("Hello Alice");
    });

    it('should throw on missing variables', async () => {
        const prompt = new PromptTemplate({
            template: "Hello {name}",
            inputVariables: ["name"]
        });

        await expect(prompt.format({})).rejects.toThrow();
    });

    it('should handle partial variables', async () => {
        const prompt = new PromptTemplate({
            template: "{greeting} {name}",
            inputVariables: ["greeting", "name"],
            partialVariables: { greeting: "Hello" }
        });

        const result = await prompt.format({ name: "Bob" });
        expect(result).toBe("Hello Bob");
    });
});
```
---

## Exercises

Practice using prompt templates from simple to complex:

### Exercise 17: Using a Basic PromptTemplate
Master variable replacement and template formatting fundamentals.  
**Starter code**: [`exercises/17-prompt-template.js`](exercises/17-prompt-template.js)

### Exercise 18: Using the ChatPromptTemplate
Create structured conversations with role-based messages.  
**Starter code**: [`exercises/18-chat-prompt-template.js`](exercises/18-chat-prompt-template.js)

### Exercise 19: Using the FewShotPromptTemplate
Implement few-shot learning with examples for better LLM outputs.  
**Starter code**: [`exercises/19-few-shot-prompt-template.js`](exercises/19-few-shot-prompt-template.js)

### Exercise 20: Using the PipelinePromptTemplate
Compose modular prompts by connecting multiple templates.  
**Starter code**: [`exercises/20-pipeline-prompt-template.js`](exercises/20-pipeline-prompt-template.js)

---

## Summary

You've learned how to build a complete prompting system!

### Key Takeaways

1. **PromptTemplate**: Basic string templates with variable replacement
2. **ChatPromptTemplate**: Structured conversations with role-based messages
3. **FewShotPromptTemplate**: Include examples for better LLM performance
4. **PipelinePromptTemplate**: Compose prompts modularly
5. **BasePromptTemplate**: Foundation that makes prompts Runnables

### What You Built

A production-ready prompt system that:
- ✅ Replaces variables safely
- ✅ Validates inputs
- ✅ Composes with other Runnables
- ✅ Supports chat and completion formats
- ✅ Enables few-shot learning
- ✅ Allows prompt composition

### Next Steps

Now that you have reusable prompts, you need to parse LLM outputs into structured data.

➡️ **Next: [Output Parsers](../02-parsers/lesson.md)**

Learn how to extract structured data from LLM responses reliably.

---

**Built with ❤️ for learners who want to understand AI frameworks deeply**

[← Previous: Context](../../01-foundation/04-context/lesson.md) | [Tutorial Index](../../README.md) | [Next: Output Parsers →](../02-parsers/lesson.md)