# Output Parsers: Structured Output Extraction

**Part 2: Composition - Lesson 2**

> LLMs return text. You need data.

## Overview

You've learned to create great prompts. LLMs return unstructured text, and in some cases you might need structured data:

```javascript
// LLM returns this:
"The sentiment is positive with a confidence of 0.92"

// You need this:
{
    sentiment: "positive",
    confidence: 0.92
}
```

**Output parsers** transform LLM text into structured data you can use in your applications.

## Why This Matters

### The Problem: Parsing Chaos

Without parsers, your code is full of brittle string manipulation:

```javascript
const response = await llm.invoke("Classify: I love this product!");

// Fragile parsing code everywhere
if (response.includes("positive")) {
    sentiment = "positive";
} else if (response.includes("negative")) {
    sentiment = "negative";
}

// What if format changes?
// What if LLM adds extra text?
// How do you handle errors?
```

Problems:
- Brittle regex and string matching
- No validation of output format
- Hard to test parsing logic
- Inconsistent error handling
- Parser code duplicated everywhere

### The Solution: Output Parsers

```javascript
const parser = new JsonOutputParser();

const prompt = new PromptTemplate({
    template: `Classify the sentiment. Respond in JSON:
{{"sentiment": "positive/negative/neutral", "confidence": 0.0-1.0}}

Text: {text}`,
    inputVariables: ["text"]
});

const chain = prompt.pipe(llm).pipe(parser);

const result = await chain.invoke({ text: "I love this!" });
// { sentiment: "positive", confidence: 0.95 }
```

Benefits:
- ✅ Reliable structured extraction
- ✅ Format validation
- ✅ Error handling built-in
- ✅ Reusable parsing logic
- ✅ Type-safe outputs

## Learning Objectives

By the end of this lesson, you will:

- ✅ Build a BaseOutputParser abstraction
- ✅ Create a StringOutputParser for text cleanup
- ✅ Implement JsonOutputParser for JSON extraction
- ✅ Build ListOutputParser for arrays
- ✅ Create StructuredOutputParser with schemas
- ✅ Use parsers in chains with prompts
- ✅ Handle parsing errors gracefully

## Core Concepts

### What is an Output Parser?

An output parser **transforms LLM text output into structured data**.

**Flow:**
```
LLM Output (text) → Parser → Structured Data
    ↓                ↓              ↓
"positive: 0.95"  parse()    {sentiment: "positive", confidence: 0.95}
```

### The Parser Hierarchy

```
BaseOutputParser (abstract)
    ├── StringOutputParser (clean text)
    ├── JsonOutputParser (extract JSON)
    ├── ListOutputParser (extract lists)
    ├── RegexOutputParser (regex patterns)
    └── StructuredOutputParser (schema validation)
```

Each parser handles a specific output format.

### Key Operations

1. **Parse**: Extract structured data from text
2. **Get Format Instructions**: Tell LLM how to format response
3. **Validate**: Check output matches expected structure
4. **Handle Errors**: Gracefully handle malformed outputs

## Implementation Guide

### Step 1: Base Output Parser

**Location:** `src/output-parsers/base-parser.js`

This is the abstract base class all parsers inherit from.

**What it does:**
- Defines the interface for all parsers
- Extends Runnable (so parsers work in chains)
- Provides format instruction generation
- Handles parsing errors

**Implementation:**

```javascript
import { Runnable } from '../core/runnable.js';

/**
 * Base class for all output parsers
 * Transforms LLM text output into structured data
 */
export class BaseOutputParser extends Runnable {
    constructor() {
        super();
        this.name = this.constructor.name;
    }

    /**
     * Parse the LLM output into structured data
     * @abstract
     * @param {string} text - Raw LLM output
     * @returns {Promise<any>} Parsed data
     */
    async parse(text) {
        throw new Error(`${this.name} must implement parse()`);
    }

    /**
     * Get instructions for the LLM on how to format output
     * @returns {string} Format instructions
     */
    getFormatInstructions() {
        return '';
    }

    /**
     * Runnable interface: parse the output
     */
    async _call(input, config) {
        // Input can be a string or a Message
        const text = typeof input === 'string' 
            ? input 
            : input.content;
        
        return await this.parse(text);
    }

    /**
     * Parse with error handling
     */
    async parseWithPrompt(text, prompt) {
        try {
            return await this.parse(text);
        } catch (error) {
            throw new OutputParserException(
                `Failed to parse output from prompt: ${error.message}`,
                text,
                error
            );
        }
    }
}

/**
 * Exception thrown when parsing fails
 */
export class OutputParserException extends Error {
    constructor(message, llmOutput, originalError) {
        super(message);
        this.name = 'OutputParserException';
        this.llmOutput = llmOutput;
        this.originalError = originalError;
    }
}
```

**Key insights:**
- Extends `Runnable` so parsers can be piped in chains
- `_call` extracts text from strings or Messages
- `getFormatInstructions()` helps prompt the LLM
- Error handling wraps parse failures with context

---

### Step 2: String Output Parser

**Location:** `src/output-parsers/string-parser.js`

The simplest parser - cleans up text output.

**What it does:**
- Strips leading/trailing whitespace
- Optionally removes markdown code blocks
- Returns clean string

**Use when:**
- You just need clean text
- No structure needed
- Want to remove formatting artifacts

**Implementation:**

```javascript
import { BaseOutputParser } from './base-parser.js';

/**
 * Parser that returns cleaned string output
 * Strips whitespace and optionally removes markdown
 * 
 * Example:
 *   const parser = new StringOutputParser();
 *   const result = await parser.parse("  Hello World  ");
 *   // "Hello World"
 */
export class StringOutputParser extends BaseOutputParser {
    constructor(options = {}) {
        super();
        this.stripMarkdown = options.stripMarkdown ?? true;
    }

    /**
     * Parse: clean the text
     */
    async parse(text) {
        let cleaned = text.trim();

        if (this.stripMarkdown) {
            cleaned = this._stripMarkdownCodeBlocks(cleaned);
        }

        return cleaned;
    }

    /**
     * Remove markdown code blocks (```code```)
     */
    _stripMarkdownCodeBlocks(text) {
        // Remove ```language\ncode\n```
        return text.replace(/```[\w]*\n([\s\S]*?)\n```/g, '$1').trim();
    }

    getFormatInstructions() {
        return 'Respond with plain text. No markdown formatting.';
    }
}
```

**Usage:**

```javascript
const parser = new StringOutputParser();

// Handles various formats
await parser.parse("  Hello  ");           // "Hello"
await parser.parse("```\ncode\n```");      // "code"
await parser.parse("   \n  Text  \n   "); // "Text"
```

---

### Step 3: JSON Output Parser

**Location:** `src/output-parsers/json-parser.js`

Extracts and validates JSON from LLM output.

**What it does:**
- Finds JSON in text (handles markdown, extra text)
- Parses and validates JSON
- Optionally validates against a schema

**Use when:**
- Need structured objects
- Want type-safe data
- Need validation

**Implementation:**

```javascript
import { BaseOutputParser, OutputParserException } from './base-parser.js';

/**
 * Parser that extracts JSON from LLM output
 * Handles markdown code blocks and extra text
 * 
 * Example:
 *   const parser = new JsonOutputParser();
 *   const result = await parser.parse('```json\n{"name": "Alice"}\n```');
 *   // { name: "Alice" }
 */
export class JsonOutputParser extends BaseOutputParser {
    constructor(options = {}) {
        super();
        this.schema = options.schema;
    }

    /**
     * Parse JSON from text
     */
    async parse(text) {
        try {
            // Try to extract JSON from the text
            const jsonText = this._extractJson(text);
            const parsed = JSON.parse(jsonText);

            // Validate against schema if provided
            if (this.schema) {
                this._validateSchema(parsed);
            }

            return parsed;
        } catch (error) {
            throw new OutputParserException(
                `Failed to parse JSON: ${error.message}`,
                text,
                error
            );
        }
    }

    /**
     * Extract JSON from text (handles markdown, extra text)
     */
    _extractJson(text) {
        // Try direct parse first
        try {
            JSON.parse(text.trim());
            return text.trim();
        } catch {
            // Not direct JSON, try to find it
        }

        // Look for JSON in markdown code blocks
        const markdownMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (markdownMatch) {
            return markdownMatch[1].trim();
        }

        // Look for JSON object/array patterns
        const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
            return jsonObjectMatch[0];
        }

        const jsonArrayMatch = text.match(/\[[\s\S]*\]/);
        if (jsonArrayMatch) {
            return jsonArrayMatch[0];
        }

        // Give up, return original
        return text.trim();
    }

    /**
     * Validate parsed JSON against schema
     */
    _validateSchema(parsed) {
        if (!this.schema) return;

        for (const [key, type] of Object.entries(this.schema)) {
            if (!(key in parsed)) {
                throw new Error(`Missing required field: ${key}`);
            }

            const actualType = typeof parsed[key];
            if (actualType !== type) {
                throw new Error(
                    `Field ${key} should be ${type}, got ${actualType}`
                );
            }
        }
    }

    getFormatInstructions() {
        let instructions = 'Respond with valid JSON.';
        
        if (this.schema) {
            const schemaDesc = Object.entries(this.schema)
                .map(([key, type]) => `"${key}": ${type}`)
                .join(', ');
            instructions += ` Schema: { ${schemaDesc} }`;
        }

        return instructions;
    }
}
```

**Usage:**

```javascript
const parser = new JsonOutputParser({
    schema: {
        name: 'string',
        age: 'number',
        active: 'boolean'
    }
});

// Handles various JSON formats
await parser.parse('{"name": "Alice", "age": 30, "active": true}');
await parser.parse('```json\n{"name": "Bob", "age": 25, "active": false}\n```');
await parser.parse('Sure! Here\'s the data: {"name": "Charlie", "age": 35, "active": true}');
```

---

### Step 4: List Output Parser

**Location:** `src/output-parsers/list-parser.js`

Extracts lists/arrays from text.

**What it does:**
- Parses numbered lists, bullet points, comma-separated
- Returns array of items
- Cleans each item

**Use when:**
- Need arrays of strings
- LLM outputs lists
- Want simple arrays

**Implementation:**

```javascript
import { BaseOutputParser } from './base-parser.js';

/**
 * Parser that extracts lists from text
 * Handles: numbered lists, bullets, comma-separated
 * 
 * Example:
 *   const parser = new ListOutputParser();
 *   const result = await parser.parse("1. Apple\n2. Banana\n3. Orange");
 *   // ["Apple", "Banana", "Orange"]
 */
export class ListOutputParser extends BaseOutputParser {
    constructor(options = {}) {
        super();
        this.separator = options.separator;
    }

    /**
     * Parse list from text
     */
    async parse(text) {
        const cleaned = text.trim();

        // If separator specified, use it
        if (this.separator) {
            return cleaned
                .split(this.separator)
                .map(item => item.trim())
                .filter(item => item.length > 0);
        }

        // Try to detect format
        if (this._isNumberedList(cleaned)) {
            return this._parseNumberedList(cleaned);
        }

        if (this._isBulletList(cleaned)) {
            return this._parseBulletList(cleaned);
        }

        // Try comma-separated
        if (cleaned.includes(',')) {
            return cleaned
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
        }

        // Try newline-separated
        return cleaned
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }

    /**
     * Check if text is numbered list (1. Item\n2. Item)
     */
    _isNumberedList(text) {
        return /^\d+\./.test(text);
    }

    /**
     * Check if text is bullet list (- Item\n- Item or * Item)
     */
    _isBulletList(text) {
        return /^[-*•]/.test(text);
    }

    /**
     * Parse numbered list
     */
    _parseNumberedList(text) {
        return text
            .split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(item => item.length > 0);
    }

    /**
     * Parse bullet list
     */
    _parseBulletList(text) {
        return text
            .split('\n')
            .map(line => line.replace(/^[-*•]\s*/, '').trim())
            .filter(item => item.length > 0);
    }

    getFormatInstructions() {
        if (this.separator) {
            return `Respond with items separated by "${this.separator}".`;
        }
        return 'Respond with a numbered list (1. Item) or bullet list (- Item).';
    }
}
```

**Usage:**

```javascript
const parser = new ListOutputParser();

// Handles various list formats
await parser.parse("1. Apple\n2. Banana\n3. Orange");
// ["Apple", "Banana", "Orange"]

await parser.parse("- Red\n- Green\n- Blue");
// ["Red", "Green", "Blue"]

await parser.parse("cat, dog, bird");
// ["cat", "dog", "bird"]

// Custom separator
const csvParser = new ListOutputParser({ separator: ',' });
await csvParser.parse("apple,banana,orange");
// ["apple", "banana", "orange"]
```

---

### Step 5: Regex Output Parser

**Location:** `src/output-parsers/regex-parser.js`

Uses regex patterns to extract structured data.

**What it does:**
- Applies regex to extract groups
- Maps groups to field names
- Returns structured object

**Use when:**
- Output has predictable patterns
- Need custom extraction logic
- Regex is simplest solution

**Implementation:**

```javascript
import { BaseOutputParser, OutputParserException } from './base-parser.js';

/**
 * Parser that uses regex to extract structured data
 * 
 * Example:
 *   const parser = new RegexOutputParser({
 *       regex: /Sentiment: (\w+), Confidence: ([\d.]+)/,
 *       outputKeys: ["sentiment", "confidence"]
 *   });
 *   
 *   const result = await parser.parse("Sentiment: positive, Confidence: 0.92");
 *   // { sentiment: "positive", confidence: "0.92" }
 */
export class RegexOutputParser extends BaseOutputParser {
    constructor(options = {}) {
        super();
        this.regex = options.regex;
        this.outputKeys = options.outputKeys || [];
        this.dotAll = options.dotAll ?? false;

        if (this.dotAll) {
            // Add 's' flag for dotAll if not present
            const flags = this.regex.flags.includes('s') 
                ? this.regex.flags 
                : this.regex.flags + 's';
            this.regex = new RegExp(this.regex.source, flags);
        }
    }

    /**
     * Parse using regex
     */
    async parse(text) {
        const match = text.match(this.regex);

        if (!match) {
            throw new OutputParserException(
                `Text does not match regex pattern: ${this.regex}`,
                text
            );
        }

        // If no output keys, return the groups as array
        if (this.outputKeys.length === 0) {
            return match.slice(1); // Exclude full match
        }

        // Map groups to keys
        const result = {};
        for (let i = 0; i < this.outputKeys.length; i++) {
            result[this.outputKeys[i]] = match[i + 1]; // +1 to skip full match
        }

        return result;
    }

    getFormatInstructions() {
        if (this.outputKeys.length > 0) {
            return `Format your response to match: ${this.outputKeys.join(', ')}`;
        }
        return 'Follow the specified format exactly.';
    }
}
```

**Usage:**

```javascript
const parser = new RegexOutputParser({
    regex: /Sentiment: (\w+), Confidence: ([\d.]+)/,
    outputKeys: ["sentiment", "confidence"]
});

const result = await parser.parse("Sentiment: positive, Confidence: 0.92");
// { sentiment: "positive", confidence: "0.92" }
```

---
# Output Parsers: Advanced Patterns & Integration

## Advanced Parser: Structured Output Parser

### Step 6: Structured Output Parser

**Location:** `src/output-parsers/structured-parser.js`

The most powerful parser - validates against a full schema with types and descriptions.

**What it does:**
- Defines expected schema with types
- Generates format instructions for LLM
- Validates all fields and types
- Provides detailed error messages

**Use when:**
- Need complex structured data
- Want strong type validation
- Need to generate format instructions automatically

**Implementation:**

```javascript
import { BaseOutputParser, OutputParserException } from './base-parser.js';

/**
 * Parser with full schema validation
 * 
 * Example:
 *   const parser = new StructuredOutputParser({
 *       responseSchemas: [
 *           {
 *               name: "sentiment",
 *               type: "string",
 *               description: "The sentiment (positive/negative/neutral)",
 *               enum: ["positive", "negative", "neutral"]
 *           },
 *           {
 *               name: "confidence",
 *               type: "number",
 *               description: "Confidence score between 0 and 1"
 *           }
 *       ]
 *   });
 */
export class StructuredOutputParser extends BaseOutputParser {
    constructor(options = {}) {
        super();
        this.responseSchemas = options.responseSchemas || [];
    }

    /**
     * Parse and validate against schema
     */
    async parse(text) {
        try {
            // Extract JSON
            const jsonText = this._extractJson(text);
            const parsed = JSON.parse(jsonText);

            // Validate against schema
            this._validateAgainstSchema(parsed);

            return parsed;
        } catch (error) {
            throw new OutputParserException(
                `Failed to parse structured output: ${error.message}`,
                text,
                error
            );
        }
    }

    /**
     * Extract JSON from text (same as JsonOutputParser)
     */
    _extractJson(text) {
        try {
            JSON.parse(text.trim());
            return text.trim();
        } catch {}

        const markdownMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (markdownMatch) return markdownMatch[1].trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return jsonMatch[0];

        return text.trim();
    }

    /**
     * Validate parsed data against schema
     */
    _validateAgainstSchema(parsed) {
        for (const schema of this.responseSchemas) {
            const { name, type, enum: enumValues, required = true } = schema;

            // Check required fields
            if (required && !(name in parsed)) {
                throw new Error(`Missing required field: ${name}`);
            }

            if (name in parsed) {
                const value = parsed[name];

                // Check type
                if (!this._checkType(value, type)) {
                    throw new Error(
                        `Field ${name} should be ${type}, got ${typeof value}`
                    );
                }

                // Check enum values
                if (enumValues && !enumValues.includes(value)) {
                    throw new Error(
                        `Field ${name} must be one of: ${enumValues.join(', ')}`
                    );
                }
            }
        }
    }

    /**
     * Check if value matches expected type
     */
    _checkType(value, type) {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            default:
                return true;
        }
    }

    /**
     * Generate format instructions for LLM
     */
    getFormatInstructions() {
        const schemaDescriptions = this.responseSchemas.map(schema => {
            let desc = `"${schema.name}": ${schema.type}`;
            if (schema.description) {
                desc += ` // ${schema.description}`;
            }
            if (schema.enum) {
                desc += ` (one of: ${schema.enum.join(', ')})`;
            }
            return desc;
        });

        return `Respond with valid JSON matching this schema:
{
${schemaDescriptions.map(d => '  ' + d).join(',\n')}
}`;
    }

    /**
     * Static helper to create from simple schema
     */
    static fromNamesAndDescriptions(schemas) {
        const responseSchemas = Object.entries(schemas).map(([name, description]) => ({
            name,
            description,
            type: 'string' // Default type
        }));

        return new StructuredOutputParser({ responseSchemas });
    }
}
```

**Usage:**

```javascript
const parser = new StructuredOutputParser({
    responseSchemas: [
        {
            name: "sentiment",
            type: "string",
            description: "The sentiment of the text",
            enum: ["positive", "negative", "neutral"],
            required: true
        },
        {
            name: "confidence",
            type: "number",
            description: "Confidence score from 0 to 1",
            required: true
        },
        {
            name: "keywords",
            type: "array",
            description: "Key themes in the text",
            required: false
        }
    ]
});

// Get format instructions to add to prompt
const instructions = parser.getFormatInstructions();
console.log(instructions);

// Parse and validate
const result = await parser.parse(`{
    "sentiment": "positive",
    "confidence": 0.92,
    "keywords": ["great", "love", "excellent"]
}`);
```

---

## Real-World Examples

### Example 1: Email Classification with Structured Parser

```javascript
import { StructuredOutputParser } from './output-parsers/structured-parser.js';
import { PromptTemplate } from './prompts/prompt-template.js';
import { LlamaCppLLM } from './llm/llama-cpp-llm.js';

// Define the output structure
const parser = new StructuredOutputParser({
    responseSchemas: [
        {
            name: "category",
            type: "string",
            description: "Email category",
            enum: ["spam", "invoice", "meeting", "urgent", "personal", "other"]
        },
        {
            name: "confidence",
            type: "number",
            description: "Confidence score (0-1)"
        },
        {
            name: "reason",
            type: "string",
            description: "Brief explanation for classification"
        },
        {
            name: "actionRequired",
            type: "boolean",
            description: "Does email require action?"
        }
    ]
});

// Build prompt with format instructions
const prompt = new PromptTemplate({
    template: `Classify this email.

Email:
From: {from}
Subject: {subject}
Body: {body}

{format_instructions}`,
    inputVariables: ["from", "subject", "body"],
    partialVariables: {
        format_instructions: parser.getFormatInstructions()
    }
});

// Create chain
const llm = new LlamaCppLLM({ modelPath: './model.gguf' });
const chain = prompt.pipe(llm).pipe(parser);

// Use it
const result = await chain.invoke({
    from: "billing@company.com",
    subject: "Invoice #12345",
    body: "Payment due by March 15th"
});

console.log(result);
// {
//   category: "invoice",
//   confidence: 0.98,
//   reason: "Email contains invoice number and payment deadline",
//   actionRequired: true
// }
```

---

### Example 2: Content Extraction with JSON Parser

```javascript
import { JsonOutputParser } from './output-parsers/json-parser.js';
import { ChatPromptTemplate } from './prompts/chat-prompt-template.js';

const parser = new JsonOutputParser({
    schema: {
        title: 'string',
        summary: 'string',
        tags: 'object',  // Will be array
        author: 'string'
    }
});

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "Extract article metadata. Respond with JSON."],
    ["human", "Article: {article}"]
]);

const chain = prompt.pipe(llm).pipe(parser);

const result = await chain.invoke({
    article: "Title: AI Revolution\nBy: John Doe\n\nAI is transforming..."
});

// {
//   title: "AI Revolution",
//   summary: "Article discusses AI's transformative impact",
//   tags: ["AI", "technology", "future"],
//   author: "John Doe"
// }
```

---

### Example 3: List Extraction for Recommendations

```javascript
import { ListOutputParser } from './output-parsers/list-parser.js';
import { PromptTemplate } from './prompts/prompt-template.js';

const parser = new ListOutputParser();

const prompt = new PromptTemplate({
    template: `Recommend 5 {category} for someone interested in {interest}.

{format_instructions}

List:`,
    inputVariables: ["category", "interest"],
    partialVariables: {
        format_instructions: parser.getFormatInstructions()
    }
});

const chain = prompt.pipe(llm).pipe(parser);

const books = await chain.invoke({
    category: "books",
    interest: "machine learning"
});

console.log(books);
// [
//   "Pattern Recognition and Machine Learning",
//   "Deep Learning by Goodfellow",
//   "Hands-On Machine Learning",
//   "The Hundred-Page Machine Learning Book",
//   "Machine Learning Yearning"
// ]
```

---

### Example 4: Sentiment Analysis with Retry

```javascript
import { JsonOutputParser } from './output-parsers/json-parser.js';
import { PromptTemplate } from './prompts/prompt-template.js';

const parser = new JsonOutputParser();

// If parsing fails, retry with clearer instructions
async function robustSentimentAnalysis(text) {
    const prompt = new PromptTemplate({
        template: `Analyze sentiment of: "{text}"

Respond with ONLY valid JSON:
{{"sentiment": "positive/negative/neutral", "score": 0.0-1.0}}`
    });

    const chain = prompt.pipe(llm).pipe(parser);

    try {
        return await chain.invoke({ text });
    } catch (error) {
        console.log('Parse failed, retrying with stricter prompt...');
        
        // Retry with more explicit prompt
        const strictPrompt = new PromptTemplate({
            template: `Analyze: "{text}"

IMPORTANT: Respond with ONLY this JSON structure, nothing else:
{{"sentiment": "positive", "score": 0.9}}

Your response:`
        });

        const retryChain = strictPrompt.pipe(llm).pipe(parser);
        return await retryChain.invoke({ text });
    }
}
```

---

## Advanced Patterns

### Pattern 1: Fallback Parsing

```javascript
class FallbackOutputParser extends BaseOutputParser {
    constructor(parsers) {
        super();
        this.parsers = parsers;
    }

    async parse(text) {
        const errors = [];

        for (const parser of this.parsers) {
            try {
                return await parser.parse(text);
            } catch (error) {
                errors.push({ parser: parser.name, error });
            }
        }

        throw new OutputParserException(
            `All parsers failed. Errors: ${JSON.stringify(errors)}`,
            text
        );
    }
}

// Usage
const parser = new FallbackOutputParser([
    new JsonOutputParser(),      // Try JSON first
    new RegexOutputParser({...}), // Try regex second
    new StringOutputParser()      // Fallback to string
]);
```

---

### Pattern 2: Transform After Parse

```javascript
class TransformOutputParser extends BaseOutputParser {
    constructor(parser, transform) {
        super();
        this.parser = parser;
        this.transform = transform;
    }

    async parse(text) {
        const parsed = await this.parser.parse(text);
        return this.transform(parsed);
    }
}

// Usage: parse JSON then transform values
const parser = new TransformOutputParser(
    new JsonOutputParser(),
    (data) => ({
        ...data,
        confidence: parseFloat(data.confidence),
        timestamp: new Date().toISOString()
    })
);
```

---

### Pattern 3: Conditional Parsing

```javascript
class ConditionalOutputParser extends BaseOutputParser {
    constructor(condition, trueParser, falseParser) {
        super();
        this.condition = condition;
        this.trueParser = trueParser;
        this.falseParser = falseParser;
    }

    async parse(text) {
        const useTrue = this.condition(text);
        const parser = useTrue ? this.trueParser : this.falseParser;
        return await parser.parse(text);
    }
}

// Usage: different parsers based on content
const parser = new ConditionalOutputParser(
    (text) => text.includes('{'),  // Has JSON?
    new JsonOutputParser(),
    new ListOutputParser()
);
```

---

### Pattern 4: Validated Output

```javascript
class ValidatedOutputParser extends BaseOutputParser {
    constructor(parser, validator) {
        super();
        this.parser = parser;
        this.validator = validator;
    }

    async parse(text) {
        const parsed = await this.parser.parse(text);
        
        const isValid = this.validator(parsed);
        if (!isValid) {
            throw new OutputParserException(
                'Parsed output failed validation',
                text
            );
        }

        return parsed;
    }
}

// Usage: ensure confidence is in range
const parser = new ValidatedOutputParser(
    new JsonOutputParser(),
    (data) => data.confidence >= 0 && data.confidence <= 1
);
```

---

## Integration with Full Chain

### Complete Example: Sentiment Analysis API

```javascript
import { PromptTemplate } from './prompts/prompt-template.js';
import { LlamaCppLLM } from './llm/llama-cpp-llm.js';
import { StructuredOutputParser } from './output-parsers/structured-parser.js';
import { ConsoleCallback } from './utils/callbacks.js';

// Define output structure
const parser = new StructuredOutputParser({
    responseSchemas: [
        {
            name: "sentiment",
            type: "string",
            enum: ["positive", "negative", "neutral"]
        },
        {
            name: "confidence",
            type: "number"
        },
        {
            name: "emotions",
            type: "array",
            description: "List of detected emotions"
        }
    ]
});

// Build prompt
const prompt = new PromptTemplate({
    template: `Analyze the sentiment of this text:

"{text}"

{format_instructions}`,
    inputVariables: ["text"],
    partialVariables: {
        format_instructions: parser.getFormatInstructions()
    }
});

// Create LLM
const llm = new LlamaCppLLM({
    modelPath: './model.gguf',
    temperature: 0.1  // Low temp for consistent classification
});

// Build chain with logging
const chain = prompt.pipe(llm).pipe(parser);

const logger = new ConsoleCallback();

// Analyze sentiment
async function analyzeSentiment(text) {
    try {
        const result = await chain.invoke(
            { text },
            { callbacks: [logger] }
        );

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            rawOutput: error.llmOutput
        };
    }
}

// Use it
const result = await analyzeSentiment("I absolutely love this product! It's amazing!");
console.log(result);
// {
//   success: true,
//   data: {
//     sentiment: "positive",
//     confidence: 0.95,
//     emotions: ["joy", "excitement", "satisfaction"]
//   }
// }
```

---

## Error Handling

### Pattern: Graceful Degradation

```javascript
async function parseWithFallback(text, primaryParser, fallbackValue) {
    try {
        return await primaryParser.parse(text);
    } catch (error) {
        console.warn('Primary parser failed:', error.message);
        console.warn('Using fallback value:', fallbackValue);
        return fallbackValue;
    }
}

// Usage
const result = await parseWithFallback(
    llmOutput,
    new JsonOutputParser(),
    { error: true, message: "Failed to parse", raw: llmOutput }
);
```

---

### Pattern: Retry with Fix Instructions

```javascript
async function parseWithRetry(text, parser, llm, maxRetries = 2) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await parser.parse(text);
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;

            // Ask LLM to fix the output
            const fixPrompt = `The following output is malformed:
${text}

Error: ${error.message}

Please provide the output in correct format:
${parser.getFormatInstructions()}`;

            text = await llm.invoke(fixPrompt);
        }
    }
}
```

---

## Testing Parsers

### Unit Tests

```javascript
import { describe, it, expect } from 'your-test-framework';
import { JsonOutputParser } from './output-parsers/json-parser.js';

describe('JsonOutputParser', () => {
    it('should parse plain JSON', async () => {
        const parser = new JsonOutputParser();
        const result = await parser.parse('{"name": "Alice", "age": 30}');
        
        expect(result.name).toBe('Alice');
        expect(result.age).toBe(30);
    });

    it('should extract JSON from markdown', async () => {
        const parser = new JsonOutputParser();
        const text = '```json\n{"key": "value"}\n```';
        const result = await parser.parse(text);
        
        expect(result.key).toBe('value');
    });

    it('should validate against schema', async () => {
        const parser = new JsonOutputParser({
            schema: { name: 'string', age: 'number' }
        });

        await expect(
            parser.parse('{"name": "Bob", "age": "invalid"}')
        ).rejects.toThrow();
    });

    it('should throw on invalid JSON', async () => {
        const parser = new JsonOutputParser();
        await expect(parser.parse('not json')).rejects.toThrow();
    });
});
```

---

## Best Practices

### ✅ DO:

**1. Include format instructions in prompts**
```javascript
const prompt = new PromptTemplate({
    template: `{task}

{format_instructions}`,
    partialVariables: {
        format_instructions: parser.getFormatInstructions()
    }
});
```

**2. Use schema validation for complex outputs**
```javascript
const parser = new StructuredOutputParser({
    responseSchemas: [
        { name: "field1", type: "string", required: true },
        { name: "field2", type: "number", required: true }
    ]
});
```

**3. Handle parsing errors gracefully**
```javascript
try {
    const parsed = await parser.parse(text);
} catch (error) {
    console.error('Parsing failed:', error.message);
    // Fallback or retry logic
}
```

**4. Test parsers independently**
```javascript
// Test without LLM
const result = await parser.parse(mockLLMOutput);
expect(result).toMatchSchema();
```

**5. Use low temperature for structured outputs**
```javascript
const llm = new LlamaCppLLM({
    temperature: 0.1  // More consistent formatting
});
```

---

### ❌ DON'T:

**1. Don't assume perfect LLM formatting**
```javascript
// Bad
const data = JSON.parse(llmOutput);  // Will fail often

// Good
const data = await jsonParser.parse(llmOutput);  // Handles variations
```

**2. Don't skip validation**
```javascript
// Bad
const result = await parser.parse(text);
// Use result.field without checking

// Good
const result = await parser.parse(text);
if (result.field && typeof result.field === 'string') {
    // Use result.field
}
```

**3. Don't use parsers for simple text**
```javascript
// Bad
const parser = new JsonOutputParser();
const result = await parser.parse(simpleText);

// Good
const parser = new StringOutputParser();
const result = await parser.parse(simpleText);
```

---

## Exercises

Practice using output parsers in real-world scenarios from simple to complex:

### Exercise 21: Product Review Analyzer 
Extract clean summaries and sentiment from product reviews using StringOutputParser.  
**Starter code**: [`exercises/21-review-analyzer.js`](exercises/21-review-analyzer.js)

### Exercise 22: Contact Information Extractor 
Parse structured contact details and skills from unstructured text using JSON and List parsers.  
**Starter code**: [`exercises/22-contact-extractor.js`](exercises/22-contact-extractor.js)

### Exercise 23: Article Metadata Extractor 
Extract complex metadata with schema validation using StructuredOutputParser.  
**Starter code**: [`exercises/23-article-metadata.js`](exercises/23-article-metadata.js)

### Exercise 24: Multi-Parser Content Pipeline 
Build production-ready pipelines with multiple parsers, fallback strategies, and content routing.  
**Starter code**: [`exercises/24-multi-parser-pipeline.js`](exercises/24-multi-parser-pipeline.js)

---

## Summary

You've built a complete output parsing system!

### Key Takeaways

1. **BaseOutputParser**: Foundation for all parsers
2. **StringOutputParser**: Clean text output
3. **JsonOutputParser**: Extract and validate JSON
4. **ListOutputParser**: Parse lists/arrays
5. **RegexOutputParser**: Pattern-based extraction
6. **StructuredOutputParser**: Full schema validation

### What You Built

A parsing system that:
- ✅ Extracts structured data reliably
- ✅ Validates output formats
- ✅ Handles errors gracefully
- ✅ Generates format instructions
- ✅ Works in chains with prompts
- ✅ Is testable in isolation

### Next Steps

Now you can combine prompts + LLMs + parsers into complete chains.

➡️ **Next: [LLM Chains](./03-llm-chain.md)**

Learn how to build complete prompt → LLM → parser pipelines.

---

**Built with ❤️ for learners who want to understand AI frameworks deeply**

[← Previous: Prompts](./01-prompts.md) | [Tutorial Index](../README.md) | [Next: LLM Chains →](./03-llm-chain.md)