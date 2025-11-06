/**
 * Solution 4: Batch Processing
 *
 * This solution demonstrates:
 * - Parallel execution with batch()
 * - Performance comparison vs sequential
 * - Error handling in parallel operations
 * - Understanding Promise.all() behavior
 */

import { Runnable } from '../../../../src/index.js';

/**
 * DelayedMultiplierRunnable - Multiplies with a delay
 */
class DelayedMultiplierRunnable extends Runnable {
    constructor(factor, delayMs = 100) {
        super();
        this.factor = factor;
        this.delayMs = delayMs;
    }

    async _call(input, config) {
        if (typeof input !== 'number') {
            throw new Error(`Input must be a number, got ${typeof input}`);
        }

        // Log if in debug mode
        if (config?.debug) {
            console.log(`   Processing ${input} (will take ${this.delayMs}ms)...`);
        }

        // Simulate async work (like LLM inference or API call)
        await new Promise(resolve => setTimeout(resolve, this.delayMs));

        const result = input * this.factor;

        if (config?.debug) {
            console.log(`   Completed ${input} → ${result}`);
        }

        return result;
    }

    toString() {
        return `DelayedMultiplier(×${this.factor}, ${this.delayMs}ms)`;
    }
}

/**
 * Process inputs sequentially (one at a time)
 */
async function processSequentially(runnable, inputs) {
    const results = [];

    for (const input of inputs) {
        const result = await runnable.invoke(input);
        results.push(result);
    }

    return results;
}

/**
 * Process inputs in parallel (all at once)
 */
async function processInParallel(runnable, inputs) {
    // This is exactly what batch() does internally
    return await runnable.batch(inputs);
}

/**
 * Bonus: Process in chunks (controlled parallelism)
 */
async function processInChunks(runnable, inputs, chunkSize = 3) {
    const results = [];

    // Process in chunks to avoid overwhelming the system
    for (let i = 0; i < inputs.length; i += chunkSize) {
        const chunk = inputs.slice(i, i + chunkSize);
        const chunkResults = await runnable.batch(chunk);
        results.push(...chunkResults);
    }

    return results;
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Batch Processing Solution...\n');

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
        console.log(`   Sequential: ${seqDuration}ms (${testInputs.length} × 100ms)`);

        console.log('   Processing in parallel...');
        const parStart = Date.now();
        const parResults = await processInParallel(runnable, testInputs);
        const parDuration = Date.now() - parStart;
        console.log(`   Parallel:   ${parDuration}ms (max of all operations)`);

        const speedup = (seqDuration / parDuration).toFixed(1);
        console.log(`   Speedup:    ${speedup}x faster 🚀`);

        console.assert(
            JSON.stringify(seqResults) === JSON.stringify(parResults),
            'Results should be identical'
        );
        console.assert(parDuration < seqDuration / 2, 'Parallel should be much faster');
        console.log('✅ Parallel is significantly faster!\n');

        // Test 3: Large batch
        console.log('Test 3: Large batch (10 items)');
        const largeBatch = Array.from({ length: 10 }, (_, i) => i + 1);
        const startLarge = Date.now();
        const largeResults = await multiplier.batch(largeBatch);
        const durationLarge = Date.now() - startLarge;

        console.log(`   Input: [1, 2, 3, ..., 10]`);
        console.log(`   Processed ${largeBatch.length} items in ${durationLarge}ms`);
        console.log(`   Sequential would take: ~${largeBatch.length * 100}ms`);
        console.log(`   Actual time: ${durationLarge}ms`);
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
            console.log(`   Note: When one fails, all fail (Promise.all behavior)`);
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

        console.log(`   Inputs:     [${pipelineInputs.join(', ')}]`);
        console.log(`   Results:    [${pipelineResults.join(', ')}]`);
        console.log(`   Expected:   [12, 14, 16] (×2, then +10)`);
        console.log(`   Time:       ${durationPipeline}ms`);
        console.log(`   Sequential: would take ~${pipelineInputs.length * 100}ms`);
        console.assert(pipelineResults[0] === 12, 'First should be 12');
        console.assert(pipelineResults[2] === 16, 'Last should be 16');
        console.log('✅ Batch works through pipelines!\n');

        // Test 7: Chunked processing
        console.log('Test 7: Chunked processing (controlled parallelism)');
        const manyInputs = Array.from({ length: 12 }, (_, i) => i + 1);

        console.log('   Processing 12 items in chunks of 3...');
        const startChunked = Date.now();
        const chunkedResults = await processInChunks(
            new DelayedMultiplierRunnable(2, 100),
            manyInputs,
            3 // chunk size
        );
        const durationChunked = Date.now() - startChunked;

        console.log(`   Time: ${durationChunked}ms`);
        console.log(`   Expected: ~400ms (4 chunks × 100ms each)`);
        console.log(`   All parallel would be: ~100ms`);
        console.log(`   Sequential would be: ~1200ms`);
        console.assert(chunkedResults.length === 12, 'Should process all items');
        console.assert(
            durationChunked > 300 && durationChunked < 600,
            'Should take time for 4 chunks'
        );
        console.log('✅ Chunked processing works!\n');

        // Test 8: Debug mode
        console.log('Test 8: Debug mode to see parallel execution');
        const debugMultiplier = new DelayedMultiplierRunnable(5, 100);
        console.log('   Watch items process in parallel:');
        await debugMultiplier.batch([1, 2, 3], { debug: true });
        console.log('✅ Debug mode shows parallel execution!\n');

        // Test 9: Performance metrics
        console.log('Test 9: Detailed performance analysis');
        const sizes = [1, 2, 5, 10];
        const delay = 100;

        console.log('   Items | Sequential | Parallel | Speedup');
        console.log('   ------|------------|----------|--------');

        for (const size of sizes) {
            const inputs = Array.from({ length: size }, (_, i) => i + 1);
            const perf = new DelayedMultiplierRunnable(2, delay);

            const seqStart = Date.now();
            await processSequentially(perf, inputs);
            const seqTime = Date.now() - seqStart;

            const parStart = Date.now();
            await processInParallel(perf, inputs);
            const parTime = Date.now() - parStart;

            const speedup = (seqTime / parTime).toFixed(1);
            console.log(`   ${size.toString().padStart(5)} | ${seqTime.toString().padStart(10)}ms | ${parTime.toString().padStart(8)}ms | ${speedup.padStart(6)}x`);
        }
        console.log('✅ Performance scales with parallelism!\n');

        console.log('🎉 All tests passed!');
        console.log('\n💡 Key Learnings:');
        console.log('   • batch() uses Promise.all() for parallel execution');
        console.log('   • N items with 100ms delay: sequential = N×100ms, parallel = 100ms');
        console.log('   • One error in batch causes all to fail');
        console.log('   • Chunked processing balances speed and resource usage');
        console.log('   • Pipelines work with batch processing');
        console.log('   • Perfect for processing multiple LLM requests simultaneously');
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
    processInParallel,
    processInChunks
};