/**
 * Exercise 10 Solution: Batch Processing
 */

import {HumanMessage, SystemMessage, LlamaCppLLM} from '../../../../src/index.js';

async function exercise2() {
    console.log('=== Exercise 2: Batch Processing ===\n');

    const llm = new LlamaCppLLM({
        modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf',
        temperature: 0.3,
        maxTokens: 50
    });

    try {
        // Part 1: Simple batch processing
        console.log('Part 1: Batch processing simple questions');

        const mathQuestions = [
            "What is 10 + 15?",
            "What is 20 * 3?",
            "What is 100 / 4?",
            "What is 50 - 18?",
            "What is 7 squared?"
        ];

        const mathAnswers = await llm.batch(mathQuestions);

        mathQuestions.forEach((question, i) => {
            console.log(`Q${i + 1}: ${question}`);
            console.log(`A${i + 1}: ${mathAnswers[i].content}`);
            console.log();
        });

        // Part 2: Batch with message arrays
        console.log('Part 2: Batch processing with message arrays');

        const conversationBatch = [
            [
                new SystemMessage("You are a professional chef"),
                new HumanMessage("Describe an apple in one sentence")
            ],
            [
                new SystemMessage("You are a research scientist"),
                new HumanMessage("Describe an apple in one sentence")
            ],
            [
                new SystemMessage("You are a romantic poet"),
                new HumanMessage("Describe an apple in one sentence")
            ]
        ];

        const perspectives = await llm.batch(conversationBatch);

        const roles = ["Chef", "Scientist", "Poet"];
        perspectives.forEach((response, i) => {
            console.log(`${roles[i]}: ${response.content}`);
        });

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

        // Sequential processing
        console.log('Sequential processing...');
        const startSeq = Date.now();
        const seqResults = [];
        for (const question of testQuestions) {
            const response = await llm.invoke(question);
            seqResults.push(response);
        }
        const seqTime = Date.now() - startSeq;
        console.log(`Sequential: ${seqTime}ms for ${testQuestions.length} questions`);

        // Batch processing
        console.log('\nBatch processing...');
        const startBatch = Date.now();
        const batchResults = await llm.batch(testQuestions);
        const batchTime = Date.now() - startBatch;
        console.log(`Batch: ${batchTime}ms for ${testQuestions.length} questions`);

        console.log(`\nSpeedup: ${(seqTime / batchTime).toFixed(2)}x faster`);
        console.log(`Time saved: ${seqTime - batchTime}ms`);

    } finally {
        await llm.dispose();
    }

    console.log('\n✓ Exercise 2 complete!');
}

// Run the solution
exercise2().catch(console.error);

/**
 * Key Takeaways:
 *
 * 1. Batch API:
 *    - await llm.batch([input1, input2, ...])
 *    - Returns array of AIMessage objects
 *    - Maintains order (output[i] corresponds to input[i])
 *
 * 2. Input flexibility:
 *    - Can batch strings: ["q1", "q2", "q3"]
 *    - Can batch message arrays: [[msg1, msg2], [msg3, msg4]]
 *    - Mix won't work - keep types consistent
 *
 * 3. Performance:
 *    - Batch uses Promise.all() for parallel execution
 *    - Significantly faster than sequential for multiple inputs
 *    - Great for testing/evaluation scenarios
 *
 * 4. Use cases:
 *    - Testing agent on multiple examples
 *    - Comparing different prompts
 *    - Evaluating model consistency
 *    - Processing queued user requests
 */