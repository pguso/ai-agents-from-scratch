/**
 * Exercise 21: Product Review Analyzer
 *
 * Difficulty: ⭐☆☆☆ (Beginner)
 *
 * Goal: Learn to use StringOutputParser for text cleanup and basic chain building
 *
 * In this exercise, you'll:
 * 1. Use StringOutputParser to clean LLM outputs
 * 2. Build a simple prompt → LLM → parser chain
 * 3. Process multiple reviews
 * 4. See why parsers matter for text cleanup
 *
 * Skills practiced:
 * - Using parsers in chains
 * - Text cleaning with StringOutputParser
 * - Basic chain composition
 *
 * You can find a few HINTS at the end of this file
 */

import {Runnable, PromptTemplate, StringOutputParser} from '../../../../src/index.js';
import {LlamaCppLLM} from '../../../../src/llm/llama-cpp-llm.js';
import {QwenChatWrapper} from "node-llama-cpp";

// Sample product reviews to analyze
const REVIEWS = [
    "This product is amazing! Best purchase ever. 5 stars!",
    "Terrible quality. Broke after one week. Very disappointed.",
    "It's okay. Does the job but nothing special.",
    "Love it! Exactly what I needed. Highly recommend!",
    "Not worth the price. Expected better quality."
];

// ============================================================================
// TODO 1: Create a Review Summarizer
// ============================================================================

/**
 * Build a chain that:
 * 1. Takes a review as input
 * 2. Asks LLM to summarize in one sentence
 * 3. Uses StringOutputParser to clean the output
 */
async function createReviewSummarizer() {
    // TODO: Create a prompt template
    // Ask LLM to summarize the review in one short sentence
    // Template should have {review} variable
    const prompt = null;

    // TODO: Create LLM instance
    // Use low temperature for consistent summaries
    const llm = null;

    // TODO: Create StringOutputParser
    // This will clean whitespace and remove markdown
    const parser = null;

    // TODO: Build the chain: prompt → llm → parser
    const chain = null;

    return chain;
}

// ============================================================================
// TODO 2: Create a Sentiment Extractor
// ============================================================================

/**
 * Build a chain that:
 * 1. Takes a review
 * 2. Asks LLM to respond with ONLY one word: positive, negative, or neutral
 * 3. Uses StringOutputParser to clean the response
 */
async function createSentimentExtractor() {
    // TODO: Create a prompt template
    // Ask LLM to respond with ONLY: positive, negative, or neutral
    // Be very explicit in the prompt about the format
    const prompt = null;

    // TODO: Create LLM with low temperature
    const llm = null;

    // TODO: Create StringOutputParser
    const parser = null;

    // TODO: Build the chain
    const chain = null;

    return chain;
}

// ============================================================================
// TODO 3: Process All Reviews
// ============================================================================

async function analyzeReviews() {
    console.log('=== Exercise 21: Product Review Analyzer ===\n');

    // TODO: Create both chains
    const summarizerChain = null;
    const sentimentChain = null;

    console.log('Processing reviews...\n');

    // TODO: Process each review
    for (let i = 0; i < REVIEWS.length; i++) {
        const review = REVIEWS[i];

        console.log(`Review ${i + 1}: "${review}"`);

        // TODO: Get summary using summarizerChain
        const summary = null;

        // TODO: Get sentiment using sentimentChain
        const sentiment = null;

        console.log(`Summary: ${summary}`);
        console.log(`Sentiment: ${sentiment}`);
        console.log();
    }

    console.log('✓ Exercise 1 Complete!');

    return {summarizerChain, sentimentChain};
}

// Run the exercise
analyzeReviews()
    .then(runTests)
    .catch(console.error);

// ============================================================================
// AUTOMATED TESTS
// ============================================================================

async function runTests(results) {
    const {summarizerChain, sentimentChain} = results;

    console.log('\n' + '='.repeat(60));
    console.log('RUNNING AUTOMATED TESTS');
    console.log('='.repeat(60) + '\n');

    const assert = (await import('assert')).default;
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            passed++;
            console.log(`✅ ${name}`);
        } catch (error) {
            failed++;
            console.error(`❌ ${name}`);
            console.error(`   ${error.message}\n`);
        }
    }

    // Test 1: Chains created
    await test('Summarizer chain created', async () => {
        assert(summarizerChain !== null && summarizerChain !== undefined, 'Create summarizerChain');
        assert(summarizerChain instanceof Runnable, 'Chain should be Runnable');
    });

    await test('Sentiment chain created', async () => {
        assert(sentimentChain !== null && sentimentChain !== undefined, 'Create sentimentChain');
        assert(sentimentChain instanceof Runnable, 'Chain should be Runnable');
    });

    // Test 2: Chains work (only run if chains exist)
    if (summarizerChain !== null && summarizerChain !== undefined) {
        await test('Summarizer chain produces output', async () => {
            const result = await summarizerChain.invoke({
                review: "Great product! Love it!"
            });
            assert(typeof result === 'string', 'Should return string');
            assert(result.length > 0, 'Should not be empty');
            assert(result.length < 200, 'Should be concise (< 200 chars)');
        });
    } else {
        failed++;
        console.error(`❌ Summarizer chain produces output`);
        console.error(`   Cannot test - summarizerChain is not created\n`);
    }

    if (sentimentChain !== null && sentimentChain !== undefined) {
        await test('Sentiment chain produces valid sentiment', async () => {
            const result = await sentimentChain.invoke({
                review: "Terrible product. Very bad."
            });
            const cleaned = result.toLowerCase().trim();
            const validSentiments = ['positive', 'negative', 'neutral'];
            assert(
                validSentiments.includes(cleaned),
                `Should be one of: ${validSentiments.join(', ')}. Got: ${cleaned}`
            );
        });
    } else {
        failed++;
        console.error(`❌ Sentiment chain produces valid sentiment`);
        console.error(`   Cannot test - sentimentChain is not created\n`);
    }

    // Test 3: Parser cleans output (only if chain exists)
    if (sentimentChain !== null && sentimentChain !== undefined) {
        await test('StringOutputParser removes extra whitespace', async () => {
            const result = await sentimentChain.invoke({
                review: "It's okay"
            });
            assert(result === result.trim(), 'Should have no leading/trailing whitespace');
            assert(!result.includes('  '), 'Should have no double spaces');
        });
    } else {
        failed++;
        console.error(`❌ StringOutputParser removes extra whitespace`);
        console.error(`   Cannot test - sentimentChain is not created\n`);
    }

    // Test 4: Consistent results (only if chain exists)
    if (sentimentChain !== null && sentimentChain !== undefined) {
        await test('Chains produce consistent sentiment', async () => {
            const positive = await sentimentChain.invoke({
                review: "Amazing! Best ever! 5 stars!"
            });
            const negative = await sentimentChain.invoke({
                review: "Horrible! Worst purchase ever! 0 stars!"
            });

            assert(
                positive.toLowerCase().includes('positive'),
                'Clearly positive review should be classified as positive'
            );
            assert(
                negative.toLowerCase().includes('negative'),
                'Clearly negative review should be classified as negative'
            );
        });
    } else {
        failed++;
        console.error(`❌ Chains produce consistent sentiment`);
        console.error(`   Cannot test - sentimentChain is not created\n`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60));

    if (failed === 0) {
        console.log('\n🎉 All tests passed!\n');
        console.log('📚 What you learned:');
        console.log('  • StringOutputParser cleans text automatically');
        console.log('  • Parsers work seamlessly in chains with .pipe()');
        console.log('  • Low temperature gives consistent outputs');
        console.log('  • Clear prompts help parsers succeed');
        console.log('  • Chains are reusable across multiple inputs\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check your implementation.\n');
    }
}

/**
 * HINTS:
 *
 * 1. PromptTemplate syntax:
 *    new PromptTemplate({
 *        template: "Your prompt with {variable}",
 *        inputVariables: ["variable"]
 *    })
 *
 * 2. LlamaCppLLM setup:
 *    new LlamaCppLLM({
 *        modelPath: './models/your-model.gguf',
 *        temperature: 0.1  // Low for consistency
 *    })
 *
 * 3. StringOutputParser:
 *    new StringOutputParser()
 *    // That's it! No config needed
 *
 * 4. Building chains:
 *    const chain = prompt.pipe(llm).pipe(parser);
 *
 * 5. Using chains:
 *    const result = await chain.invoke({ variable: "value" });
 *
 * 6. For sentiment, be VERY explicit in prompt:
 *    "Respond with ONLY one word: positive, negative, or neutral"
 */