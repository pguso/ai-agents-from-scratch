/**
 * Exercise 10: Batch Processing
 *
 * Goal: Learn to process multiple inputs efficiently
 *
 * In this exercise, you'll:
 * 1. Use batch() to process multiple questions at once
 * 2. Compare batch vs sequential processing
 * 3. Test your agent on multiple test cases
 * 4. Understand parallel execution benefits
 *
 * This is incredibly useful for testing and evaluation!
 */

import {HumanMessage, SystemMessage, LlamaCppLLM} from '../../../../src/index.js';

async function exercise2() {
    console.log('=== Exercise 2: Batch Processing ===\n');

    const llm = new LlamaCppLLM({
        modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf', // Adjust to your model
        temperature: 0.3, // Lower for consistent answers
        maxTokens: 50
    });

    try {
        // Part 1: Simple batch processing
        console.log('Part 1: Batch processing simple questions');

        // TODO: Create an array of 5 different math questions
        const mathQuestions = []; // Replace with your code

        // TODO: Use batch() to process all questions at once
        const mathAnswers = null; // Replace with your code

        // TODO: Print each question and answer
        // Loop through and console.log them nicely

        console.log();

        // Part 2: Batch with message arrays
        console.log('Part 2: Batch processing with message arrays');

        // TODO: Create an array of message arrays
        // Each should have a SystemMessage defining a role and a HumanMessage with a question
        // Roles: ["chef", "scientist", "poet"]
        // Question for each: "Describe an apple in one sentence"
        const conversationBatch = []; // Replace with your code

        // TODO: Process the batch
        const perspectives = null; // Replace with your code

        // TODO: Print each role's perspective
        // Format: "Chef: [response]"

        console.log();

        // Part 3: Performance comparison
        console.log('Part 3: Sequential vs Batch performance');

        const testQuestions = [
            "What is AI?",
            "What is ML?",
            "What is DL?",
            "What is NLP?",
            "What is CV?"
        ];

        // TODO: Time sequential processing
        console.log('Sequential processing...');
        const startSeq = Date.now();
        // Process each question one by one with a loop
        // (code here)
        const seqTime = Date.now() - startSeq;
        console.log(`Sequential: ${seqTime}ms`);

        // TODO: Time batch processing
        console.log('\nBatch processing...');
        const startBatch = Date.now();
        // Process all at once with batch()
        // (code here)
        const batchTime = Date.now() - startBatch;
        console.log(`Batch: ${batchTime}ms`);

        console.log(`\nSpeedup: ${(seqTime / batchTime).toFixed(2)}x faster`);

    } finally {
        await llm.dispose();
    }

    console.log('\n✓ Exercise 2 complete!');
}

// Run the exercise
exercise2().catch(console.error);

/**
 * Expected Output:
 * - Part 1: 5 math questions answered
 * - Part 2: Same question from 3 different perspectives
 * - Part 3: Batch should be significantly faster than sequential
 *
 * Learning Points:
 * 1. batch() processes inputs in parallel
 * 2. Great for testing multiple cases
 * 3. Works with both strings and message arrays
 * 4. Much faster than sequential processing
 */