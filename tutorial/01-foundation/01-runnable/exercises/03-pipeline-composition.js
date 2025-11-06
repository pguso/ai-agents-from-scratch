/**
 * Exercise 3: Compose a Pipeline
 *
 * Goal: Use the Runnables you've created to build a pipeline
 *
 * Requirements:
 * Build a pipeline that:
 * 1. Takes a number as input
 * 2. Multiplies it by a factor
 * 3. Converts it to an object: { result: <number> }
 * 4. Converts the object to a JSON string
 *
 * Example:
 *   const pipeline = // your code
 *   await pipeline.invoke(5); // Should return '{"result":15}' if factor is 3
 *
 * Bonus Challenge:
 * - Create a pipeline that can parse JSON, extract a value, multiply it, and format it back
 */

import { Runnable } from '../../../../src/index.js';

// You'll need these helper Runnables for the pipeline
// Some are already implemented above, others you'll create

/**
 * MultiplierRunnable - Multiplies by a factor
 */
class MultiplierRunnable extends Runnable {
    constructor(factor) {
        super();
        this.factor = factor;
    }

    async _call(input, config) {
        if (typeof input !== 'number') {
            throw new Error('Input must be a number');
        }
        return input * this.factor;
    }
}

/**
 * ObjectWrapperRunnable - Wraps value in an object
 *
 * TODO: Implement this class
 * Takes input and returns { result: input }
 */
class ObjectWrapperRunnable extends Runnable {
    async _call(input, config) {
        // TODO: Return an object with 'result' property
    }
}

/**
 * JsonStringifyRunnable - Converts object to JSON string
 *
 * TODO: Implement this class
 * Takes an object and returns JSON.stringify(object)
 */
class JsonStringifyRunnable extends Runnable {
    async _call(input, config) {
        // TODO: Convert input to JSON string
    }
}

// ============================================================================
// Build Your Pipeline Here
// ============================================================================

/**
 * TODO: Create the pipeline
 *
 * Hint: Use the pipe() method to chain Runnables
 *
 * const pipeline = runnable1
 *   .pipe(runnable2)
 *   .pipe(runnable3);
 */

function createPipeline(factor = 3) {
    // TODO: Create instances of the Runnables
    // TODO: Chain them together with pipe()
    // TODO: Return the pipeline
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Pipeline Composition...\n');

    try {
        // Test 1: Basic pipeline
        console.log('Test 1: Basic pipeline (multiply → wrap → stringify)');
        const pipeline = createPipeline(3);
        const result1 = await pipeline.invoke(5);
        console.log(`   Input:  5`);
        console.log(`   Output: ${result1}`);
        console.assert(result1 === '{"result":15}', `Expected '{"result":15}', got '${result1}'`);
        console.log('✅ Pipeline works!\n');

        // Test 2: Different factor
        console.log('Test 2: Different factor');
        const pipeline2 = createPipeline(10);
        const result2 = await pipeline2.invoke(4);
        console.log(`   Input:  4`);
        console.log(`   Output: ${result2}`);
        console.assert(result2 === '{"result":40}', `Expected '{"result":40}', got '${result2}'`);
        console.log('✅ Works with different factors!\n');

        // Test 3: Pipeline with batch
        console.log('Test 3: Batch processing through pipeline');
        const pipeline3 = createPipeline(2);
        const results3 = await pipeline3.batch([1, 2, 3]);
        console.log(`   Inputs:  [1, 2, 3]`);
        console.log(`   Outputs: [${results3.join(', ')}]`);
        console.assert(results3[0] === '{"result":2}', 'First result should be correct');
        console.assert(results3[1] === '{"result":4}', 'Second result should be correct');
        console.assert(results3[2] === '{"result":6}', 'Third result should be correct');
        console.log('✅ Batch processing works!\n');

        // Test 4: Individual components work
        console.log('Test 4: Testing individual components');
        const multiplier = new MultiplierRunnable(5);
        const wrapper = new ObjectWrapperRunnable();
        const stringifier = new JsonStringifyRunnable();

        const step1 = await multiplier.invoke(3);
        console.log(`   After multiply: ${step1}`);
        console.assert(step1 === 15, 'Multiplier should work');

        const step2 = await wrapper.invoke(step1);
        console.log(`   After wrap: ${JSON.stringify(step2)}`);
        console.assert(step2.result === 15, 'Wrapper should work');

        const step3 = await stringifier.invoke(step2);
        console.log(`   After stringify: ${step3}`);
        console.assert(step3 === '{"result":15}', 'Stringifier should work');
        console.log('✅ All components work individually!\n');

        console.log('🎉 All tests passed!');
        console.log('\n💡 You successfully composed multiple Runnables into a pipeline!');
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
    MultiplierRunnable,
    ObjectWrapperRunnable,
    JsonStringifyRunnable,
    createPipeline
};