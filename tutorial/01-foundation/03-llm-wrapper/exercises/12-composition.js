/**
 * Exercise 12: Composition and Pipelines
 *
 * Goal: Learn to compose LLM with other Runnables
 *
 * In this exercise, you'll:
 * 1. Create helper Runnables to work with LLM
 * 2. Build a pipeline by chaining operations
 * 3. Create a reusable agent pipeline
 * 4. See the power of composition
 *
 * This is where the Runnable pattern really shines!
 */

import {HumanMessage, SystemMessage, LlamaCppLLM, Runnable} from '../../../../src/index.js';

// TODO: Part 1 - Create a PromptFormatter Runnable
// This should:
// - Take a string input (user question)
// - Return an array of messages with a system prompt and the user question
// - System prompt: "You are a helpful assistant. Be concise."
class PromptFormatter extends Runnable {
    async _call(input, config) {
        // Your code here
        return null;
    }
}

// TODO: Part 2 - Create a ResponseParser Runnable
// This should:
// - Take an AIMessage input
// - Extract and return just the content string
// - Trim whitespace
class ResponseParser extends Runnable {
    async _call(input, config) {
        // Your code here
        return null;
    }
}

// TODO: Part 3 - Create an AnswerValidator Runnable
// This should:
// - Take a string input (the parsed response)
// - Check if it's longer than 10 characters
// - If too short, return "Error: Response too short"
// - Otherwise return the original response
class AnswerValidator extends Runnable {
    async _call(input, config) {
        // Your code here
        return null;
    }
}

async function exercise4() {
    console.log('=== Exercise 4: Composition and Pipelines ===\n');

    const llm = new LlamaCppLLM({
        modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf',
        temperature: 0.7,
        maxTokens: 100
    });

    try {
        // Part 1: Test individual components
        console.log('Part 1: Testing individual components');

        const formatter = new PromptFormatter();
        const parser = new ResponseParser();
        const validator = new AnswerValidator();

        // TODO: Test the formatter
        console.log('Testing formatter:');
        const formatted = null; // await formatter.invoke("What is AI?")
        console.log(formatted);
        console.log();

        // TODO: Test with LLM + parser
        console.log('Testing LLM + parser:');
        const llmResponse = null; // await llm.invoke(formatted)
        const parsed = null; // await parser.invoke(llmResponse)
        console.log('Parsed:', parsed);
        console.log();

        // TODO: Test validator with short input
        console.log('Testing validator with short input:');
        const shortResult = null; // await validator.invoke("Hi")
        console.log(shortResult);
        console.log();

        // Part 2: Build a complete pipeline
        console.log('Part 2: Complete pipeline');

        // TODO: Chain all components together
        // formatter -> llm -> parser -> validator
        const pipeline = null; // Your code here

        // TODO: Test the pipeline
        const result1 = null; // await pipeline.invoke("What is machine learning?")
        console.log('Result:', result1);
        console.log();

        // Part 3: Reusable agent pipeline
        console.log('Part 3: Reusable agent pipeline');

        // TODO: Create different pipelines for different tasks
        // Creative pipeline: high temperature, no validator
        const creativePipeline = null; // Your code here

        // Factual pipeline: low temperature, with validator
        const factualPipeline = null; // Your code here

        // TODO: Test both pipelines
        console.log('Creative (temp=0.9):');
        const creative = null; // await creativePipeline.invoke("Describe a sunset")
        console.log(creative);
        console.log();

        console.log('Factual (temp=0.1):');
        const factual = null; // await factualPipeline.invoke("What is the capital of France?")
        console.log(factual);
        console.log();

        // Part 4: Batch processing with pipelines
        console.log('Part 4: Batch processing with pipeline');

        // TODO: Use the pipeline with batch()
        const questions = [
            "What is Python?",
            "What is JavaScript?",
            "What is Rust?"
        ];

        const answers = null; // await pipeline.batch(questions)

        // TODO: Print results
        // questions.forEach((q, i) => ...)

    } finally {
        await llm.dispose();
    }

    console.log('\n✓ Exercise 4 complete!');
}

// Run the exercise
exercise4().catch(console.error);

/**
 * Expected Output:
 * - Part 1: Each component works independently
 * - Part 2: Full pipeline processes input -> output
 * - Part 3: Different pipelines for different tasks
 * - Part 4: Pipeline works with batch processing
 *
 * Learning Points:
 * 1. Runnables are composable building blocks
 * 2. .pipe() chains operations together
 * 3. Pipelines are themselves Runnables
 * 4. Easy to create specialized pipelines
 * 5. Composition makes testing and reuse easy
 */