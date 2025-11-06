/**
 * Exercise 4: Implement Batch Processing
 *
 * Goal: Test and understand parallel execution with batch()
 *
 * Requirements:
 * - Process multiple inputs in parallel using batch()
 * - Measure performance difference vs sequential
 * - Handle errors in batch processing
 * - Understand Promise.all() behavior
 *
 * Example:
 *   const results = await runnable.batch([1, 2, 3, 4, 5]);
 *   // All 5 inputs process simultaneously
 */

import { Runnable } from '../../../../src/index.js';

/**
 * DelayedMultiplierRunnable - Multiplies with a delay
 *
 * This simulates an async operation (like an API call or LLM inference)
 * that takes time to complete.
 */
class DelayedMultiplierRunnable extends Runnable {
    constructor(factor, delayMs = 100) {
        super();
        this.factor = factor;
        this.delayMs = delayMs;
    }

    async _call(input, config) {
        if (typeof input !== 'number') {
            throw new Error('Input must be a number');
        }

        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, this.delayMs));

        return input * this.factor;
    }

    toString() {
        return `DelayedMultiplier(×${this.factor}, ${this.delayMs}ms)`;
    }
}

/**
 * TODO: Create a function that processes sequentially
 *
 * Process inputs one at a time (not in parallel)
 */
async function processSequentially(runnable, inputs) {
    // TODO: Loop through inputs and call invoke() for each
    // TODO: Return array of results
}

/**
 * TODO: Create a function that processes in parallel
 *
 * Process all inputs at the same time using batch()
 */
async function processInParallel(runnable, inputs) {
    // TODO: Use batch() to process all inputs at once
    // TODO: Return array of results
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Batch Processing...\n');

    try {
        // Test 1: Basic batch processing
        console.log('Test 1: Basic batch processing');
        const multiplier = new DelayedMultiplierRunnable(2, 100);
        const inputs = [1, 2, 3, 4, 5];

        const startTime = Date.now();
        const results = await multiplier.batch(inputs);
        const duration = Date.now() - startTime;

        console.log(`   Inputs:  [${inputs.join(', ')}]`);
        console.log(`   Results: [${results.join(', ')}]`);
        console.log(`   Time:    ${duration}ms`);
        console.assert(results.length === 5, 'Should have 5 results');
        console.assert(results[0] === 2, 'First result should be 2');
        console.assert(results[4] === 10, 'Last result should be 10');
        console.assert(duration < 200, 'Should complete in ~100ms (parallel), not 500ms (sequential)');
        console.log('✅ Batch processing works!\n');

        // Test 2: Compare sequential vs parallel
        console.log('Test 2: Sequential vs Parallel comparison');
        const runnable = new DelayedMultiplierRunnable(3, 100);
        const testInputs = [1, 2, 3, 4, 5];

        console.log('   Processing sequentially...');
        const seqStart = Date.now();
        const seqResults = await processSequentially(runnable, testInputs);
        const seqDuration = Date.now() - seqStart;
        console.log(`   Sequential: ${seqDuration}ms`);

        console.log('   Processing in parallel...');
        const parStart = Date.now();
        const parResults = await processInParallel(runnable, testInputs);
        const parDuration = Date.now() - parStart;
        console.log(`   Parallel:   ${parDuration}ms`);

        console.log(`   Speedup:    ${(seqDuration / parDuration).toFixed(1)}x faster`);
        console.assert(parDuration < seqDuration / 2, 'Parallel should be much faster');
        console.log('✅ Parallel is significantly faster!\n');

        // Test 3: Large batch
        console.log('Test 3: Large batch (10 items)');
        const largeBatch = Array.from({ length: 10 }, (_, i) => i + 1);
        const startLarge = Date.now();
        const largeResults = await multiplier.batch(largeBatch);
        const durationLarge = Date.now() - startLarge;

        console.log(`   Processed ${largeBatch.length} items in ${durationLarge}ms`);
        console.assert(largeResults.length === 10, 'Should process all items');
        console.assert(durationLarge < 200, 'Should complete quickly due to parallelism');
        console.log('✅ Large batch works!\n');

        // Test 4: Batch with errors
        console.log('Test 4: Error handling in batch');
        const mixedInputs = [1, 2, 'invalid', 4, 5];

        try {
            await multiplier.batch(mixedInputs);
            console.log('❌ Should have thrown an error');
        } catch (error) {
            console.log(`   Caught error: ${error.message}`);
            console.log('✅ Errors are caught in batch processing!\n');
        }

        // Test 5: Empty batch
        console.log('Test 5: Empty batch');
        const emptyResults = await multiplier.batch([]);
        console.assert(emptyResults.length === 0, 'Empty batch should return empty array');
        console.log('✅ Empty batch handled correctly!\n');

        // Test 6: Batch with pipeline
        console.log('Test 6: Batch through a pipeline');
        class AddConstant extends Runnable {
            constructor(constant) {
                super();
                this.constant = constant;
            }
            async _call(input) {
                await new Promise(resolve => setTimeout(resolve, 50));
                return input + this.constant;
            }
        }

        const pipeline = new DelayedMultiplierRunnable(2, 50)
            .pipe(new AddConstant(10));

        const pipelineInputs = [1, 2, 3];
        const startPipeline = Date.now();
        const pipelineResults = await pipeline.batch(pipelineInputs);
        const durationPipeline = Date.now() - startPipeline;

        console.log(`   Inputs:  [${pipelineInputs.join(', ')}]`);
        console.log(`   Results: [${pipelineResults.join(', ')}]`);
        console.log(`   Expected: [12, 14, 16] (multiply by 2, then add 10)`);
        console.log(`   Time:    ${durationPipeline}ms`);
        console.assert(pipelineResults[0] === 12, 'First should be 12');
        console.assert(pipelineResults[2] === 16, 'Last should be 16');
        console.log('✅ Batch works through pipelines!\n');

        console.log('🎉 All tests passed!');
        console.log('\n💡 Key Learnings:');
        console.log('   • batch() processes inputs in parallel');
        console.log('   • Much faster than sequential processing');
        console.log('   • Uses Promise.all() under the hood');
        console.log('   • All inputs must succeed (or all fail)');
        console.log('   • Works with pipelines too!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export {
    DelayedMultiplierRunnable,
    processSequentially,
    processInParallel
};