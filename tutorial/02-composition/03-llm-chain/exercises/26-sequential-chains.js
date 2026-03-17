/**
 * EXERCISE 26: Sequential Chains
 * Difficulty: ⭐⭐ Medium
 *
 * Learning Objectives:
 * - Understand how to chain multiple operations in sequence
 * - Learn how outputs flow from one chain to the next
 * - Work with TransformChain for data processing
 * - Combine different chain types
 *
 * Scenario:
 * You're building a content processing pipeline. It should:
 * 1. Clean and format input text
 * 2. Generate a summary
 * 3. Extract keywords
 * 4. Calculate reading time
 *
 * Instructions:
 * Complete all TODO sections below. Run the tests at the end to verify your work.
 */

import {SequentialChain, LLMChain, TransformChain, PromptTemplate, StringOutputParser} from '../../../../src/index.js';
import {LlamaCppLLM} from '../../../../src/llm/llama-cpp-llm.js';
import {QwenChatWrapper} from "node-llama-cpp";

const llm = new LlamaCppLLM({
    modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
    chatWrapper: new QwenChatWrapper({
        thoughts: 'discourage'  // Prevents the model from outputting thinking tokens
    }),
});

// ============================================================================
// TODO 1: Create a Text Cleaning Chain
// ============================================================================
/**
 * Create a TransformChain that cleans and formats text.
 *
 * Requirements:
 * - Remove extra whitespace (multiple spaces → single space)
 * - Trim leading/trailing whitespace
 * - Remove special characters except: . , ! ? - '
 * - Convert to lowercase
 *
 * Input: { text: "  Hello!!!   World???  " }
 * Output: { cleanedText: "hello! world?" }
 */

function createTextCleaningChain() {
    // TODO: Create a TransformChain
    // Input variable: "text"
    // Output variable: "cleanedText"

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 2: Create a Summary Chain
// ============================================================================
/**
 * Create an LLMChain that summarizes text.
 *
 * Requirements:
 * - Use PromptTemplate with template: "Summarize the following text in 1-2 sentences:\n\n{cleanedText}"
 * - Input variable: "cleanedText" (from previous chain)
 * - Output key: "summary"
 * - Use StringOutputParser
 */

function createSummaryChain() {
    // TODO: Implement the summary chain

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 3: Create a Keyword Extraction Chain
// ============================================================================
/**
 * Create an LLMChain that extracts keywords from text.
 *
 * Requirements:
 * - Use PromptTemplate with template: "Extract 5 keywords from: {cleanedText}\nKeywords (comma-separated):"
 * - Input variable: "cleanedText"
 * - Output key: "keywords"
 * - Use StringOutputParser
 */

function createKeywordExtractionChain() {
    // TODO: Implement the keyword extraction chain

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 4: Create a Metadata Chain
// ============================================================================
/**
 * Create a TransformChain that calculates metadata about the text.
 *
 * Requirements:
 * - Calculate word count
 * - Calculate character count (excluding spaces)
 * - Estimate reading time (assume 200 words per minute)
 * - Parse keywords into an array
 *
 * Input: { cleanedText, keywords }
 * Output: { metadata: { wordCount, charCount, readingTime, keywordsArray } }
 */

function createMetadataChain() {
    // TODO: Create a TransformChain that calculates metadata

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 5: Create the Complete Content Processing Pipeline
// ============================================================================
/**
 * Create a SequentialChain that combines all the chains above.
 *
 * Requirements:
 * - Chain order: cleaning → summary → keywords → metadata
 * - Input variable: "text"
 * - Output variables: "cleanedText", "summary", "keywords", "metadata"
 *
 * The pipeline should:
 * 1. Clean the text
 * 2. Generate a summary (uses cleanedText)
 * 3. Extract keywords (uses cleanedText)
 * 4. Calculate metadata (uses cleanedText and keywords)
 */

function createContentProcessingPipeline() {
    // TODO: Create all component chains
    const cleaningChain = createTextCleaningChain();
    const summaryChain = createSummaryChain();
    const keywordChain = createKeywordExtractionChain();
    const metadataChain = createMetadataChain();

    // TODO: Create and return a SequentialChain
    // Hint: Pass all chains in the correct order
    // Hint: Specify inputVariables and outputVariables

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 6: Create a Parallel Processing Alternative
// ============================================================================
/**
 * Create a pipeline that processes summary and keywords in parallel.
 *
 * This is a challenge! You'll need to:
 * 1. Clean the text first (sequential)
 * 2. Generate summary AND extract keywords in parallel (hint: use Promise.all)
 * 3. Calculate metadata last (sequential, needs keywords)
 *
 * Since we don't have ParallelChain, implement this using async logic.
 */

function createOptimizedPipeline() {
    const cleaningChain = createTextCleaningChain();
    const summaryChain = createSummaryChain();
    const keywordChain = createKeywordExtractionChain();
    const metadataChain = createMetadataChain();

    return {
        async invoke(inputs) {
            // TODO: Step 1 - Clean the text

            // TODO: Step 2 - Run summary and keyword extraction in parallel
            // Hint: Use Promise.all([...])

            // TODO: Step 3 - Calculate metadata

            // TODO: Return all outputs
            return null; // Replace with your implementation
        },
        inputKeys: ['text'],
        outputKeys: ['cleanedText', 'summary', 'keywords', 'metadata']
    };
}

// ============================================================================
// TODO 7: Create a Conditional Processing Pipeline
// ============================================================================
/**
 * Create a pipeline that only generates a summary if the text is long enough.
 *
 * Requirements:
 * - If text has < 50 words: skip summary, set to "Text too short to summarize"
 * - If text has >= 50 words: generate full summary
 * - Always extract keywords and calculate metadata
 */

function createConditionalPipeline() {
    const cleaningChain = createTextCleaningChain();
    const summaryChain = createSummaryChain();
    const keywordChain = createKeywordExtractionChain();
    const metadataChain = createMetadataChain();

    return {
        async invoke(inputs) {
            // TODO: Clean the text

            // TODO: Check word count

            // TODO: Conditionally generate summary

            // TODO: Always extract keywords

            // TODO: Calculate metadata

            // TODO: Return results
            return null; // Replace with your implementation
        },
        inputKeys: ['text'],
        outputKeys: ['cleanedText', 'summary', 'keywords', 'metadata']
    };
}

// ============================================================================
// AUTOMATED TESTS
// ============================================================================

console.log('🧪 Running Exercise 2 Tests...\n');

async function runTests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Text Cleaning Chain
    console.log('Test 1: Text Cleaning Chain');
    try {
        const chain = createTextCleaningChain();

        if (!chain) {
            throw new Error('Text cleaning chain is null');
        }

        const result = await chain.invoke({
            text: '  Hello!!!   World???  This  is   GREAT!!  '
        });

        if (!result.cleanedText) {
            throw new Error('Result should have cleanedText property');
        }

        // Check if properly cleaned
        if (result.cleanedText.includes('  ')) {
            throw new Error('Should remove multiple spaces');
        }

        if (result.cleanedText !== result.cleanedText.trim()) {
            throw new Error('Should trim whitespace');
        }

        console.log(`   Input: "  Hello!!!   World???  "`);
        console.log(`   Output: "${result.cleanedText}"`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 2: Summary Chain
    console.log('Test 2: Summary Chain');
    try {
        const chain = createSummaryChain();

        const result = await chain.invoke({
            cleanedText: 'This is a test article about technology and innovation.'
        });

        if (typeof result !== 'string' && typeof result.summary !== 'string') {
            throw new Error('Summary chain should return a string or object with summary');
        }

        console.log(`   Summary generated successfully`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 3: Keyword Extraction Chain
    console.log('Test 3: Keyword Extraction Chain');
    try {
        const chain = createKeywordExtractionChain();

        const result = await chain.invoke({
            cleanedText: 'Technology and innovation are driving the future of AI development.'
        });

        if (typeof result !== 'string' && typeof result.keywords !== 'string') {
            throw new Error('Keyword chain should return a string or object with keywords');
        }

        console.log(`   Keywords extracted successfully`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 4: Metadata Chain
    console.log('Test 4: Metadata Chain');
    try {
        const chain = createMetadataChain();

        const result = await chain.invoke({
            cleanedText: 'This is a test with several words to count.',
            keywords: 'test, words, count'
        });

        if (!result.metadata) {
            throw new Error('Result should have metadata property');
        }

        const meta = result.metadata;

        if (typeof meta.wordCount !== 'number') {
            throw new Error('Metadata should have wordCount (number)');
        }

        if (typeof meta.charCount !== 'number') {
            throw new Error('Metadata should have charCount (number)');
        }

        if (typeof meta.readingTime !== 'number') {
            throw new Error('Metadata should have readingTime (number)');
        }

        if (!Array.isArray(meta.keywordsArray)) {
            throw new Error('Metadata should have keywordsArray (array)');
        }

        console.log(`   Metadata calculated:`, meta);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 5: Complete Pipeline
    console.log('Test 5: Complete Content Processing Pipeline');
    try {
        const pipeline = createContentProcessingPipeline();

        if (!pipeline) {
            throw new Error('Pipeline is null');
        }

        const result = await pipeline.invoke({
            text: '  This is a TEST article about TECHNOLOGY and innovation!!!  It discusses various aspects of AI development.  '
        });

        if (!result.cleanedText) {
            throw new Error('Pipeline should output cleanedText');
        }

        if (!result.summary) {
            throw new Error('Pipeline should output summary');
        }

        if (!result.keywords) {
            throw new Error('Pipeline should output keywords');
        }

        if (!result.metadata) {
            throw new Error('Pipeline should output metadata');
        }

        console.log(`   Pipeline outputs:`, Object.keys(result));
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 6: Pipeline Output Flow
    console.log('Test 6: Pipeline Output Flow (Data Passing Between Chains)');
    try {
        const pipeline = createContentProcessingPipeline();

        const result = await pipeline.invoke({
            text: 'Original text with CAPITALS and   spaces.'
        });

        // Check that cleaning was applied
        if (result.cleanedText.includes('CAPITALS')) {
            throw new Error('Cleaned text should be lowercase');
        }

        if (result.cleanedText.includes('   ')) {
            throw new Error('Cleaned text should have single spaces');
        }

        // Check that metadata used keywords
        if (!result.metadata.keywordsArray || result.metadata.keywordsArray.length === 0) {
            throw new Error('Metadata should parse keywords into array');
        }

        console.log(`   Data flows correctly through pipeline`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 7: Optimized Pipeline (Parallel Processing)
    console.log('Test 7: Optimized Pipeline (Parallel Processing)');
    try {
        const pipeline = createOptimizedPipeline();

        const startTime = Date.now();

        const result = await pipeline.invoke({
            text: 'This is test content for parallel processing.'
        });

        const elapsed = Date.now() - startTime;

        if (!result.summary || !result.keywords) {
            throw new Error('Pipeline should generate both summary and keywords');
        }

        console.log(`   Processed in ${elapsed}ms`);
        console.log(`   Outputs: ${Object.keys(result).join(', ')}`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 8: Conditional Pipeline (Short Text)
    console.log('Test 8: Conditional Pipeline - Short Text');
    try {
        const pipeline = createConditionalPipeline();

        const result = await pipeline.invoke({
            text: 'This is short.'
        });

        if (!result.summary) {
            throw new Error('Should have summary property');
        }

        if (!result.summary.includes('too short') && !result.summary.includes('Text too short')) {
            throw new Error('Short text should have "too short" message in summary');
        }

        // Should still have keywords and metadata
        if (!result.keywords) {
            throw new Error('Should still extract keywords for short text');
        }

        if (!result.metadata) {
            throw new Error('Should still calculate metadata for short text');
        }

        console.log(`   Short text handled correctly`);
        console.log(`   Summary: "${result.summary}"`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 9: Conditional Pipeline (Long Text)
    console.log('Test 9: Conditional Pipeline - Long Text');
    try {
        const pipeline = createConditionalPipeline();

        // Create text with > 50 words
        const longText = 'word '.repeat(60).trim();

        const result = await pipeline.invoke({ text: longText });

        if (!result.summary) {
            throw new Error('Should have summary property');
        }

        if (result.summary.includes('too short')) {
            throw new Error('Long text should get real summary, not "too short" message');
        }

        console.log(`   Long text summarized correctly`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Summary
    console.log('='.repeat(50));
    console.log(`Tests Passed: ${passed}/9`);
    console.log(`Tests Failed: ${failed}/9`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n🎉 Congratulations! All tests passed!');
        console.log('You have successfully completed Exercise 2.');
        console.log('\nKey concepts learned:');
        console.log('✓ Creating sequential chains');
        console.log('✓ Chaining outputs between steps');
        console.log('✓ Using TransformChain for data processing');
        console.log('✓ Parallel processing with Promise.all');
        console.log('✓ Conditional logic in pipelines');
        console.log('\nReady for Exercise 3! 🚀');
    } else {
        console.log('\n📚 Keep working on the TODOs. You\'re making progress!');
        console.log('Hint: Make sure data flows correctly between chains.');
    }
}

// Run the tests
runTests().catch(console.error);