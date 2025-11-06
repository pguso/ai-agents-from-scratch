/**
 * Solution 3: Pipeline Composition
 *
 * This solution demonstrates:
 * - Creating multiple Runnable components
 * - Composing them with pipe()
 * - Building reusable pipelines
 * - Testing each component individually
 */

import {Runnable} from '../../../../src/index.js';

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

    toString() {
        return `Multiply(×${this.factor})`;
    }
}

/**
 * ObjectWrapperRunnable - Wraps value in an object
 */
class ObjectWrapperRunnable extends Runnable {
    constructor(key = 'result') {
        super();
        this.key = key;
    }

    async _call(input, config) {
        // Wrap any input in an object with the specified key
        return { [this.key]: input };
    }

    toString() {
        return `Wrap({${this.key}: ...})`;
    }
}

/**
 * JsonStringifyRunnable - Converts object to JSON string
 */
class JsonStringifyRunnable extends Runnable {
    constructor(options = {}) {
        super();
        this.indent = options.indent ?? 0; // 0 = compact, 2 = pretty
    }

    async _call(input, config) {
        try {
            if (this.indent > 0) {
                return JSON.stringify(input, null, this.indent);
            }
            return JSON.stringify(input);
        } catch (error) {
            throw new Error(`Failed to stringify: ${error.message}`);
        }
    }

    toString() {
        return 'Stringify(JSON)';
    }
}

// ============================================================================
// Pipeline Creation
// ============================================================================

/**
 * Create a pipeline: number → multiply → wrap → stringify
 */
function createPipeline(factor = 3) {
    const multiplier = new MultiplierRunnable(factor);
    const wrapper = new ObjectWrapperRunnable('result');
    const stringifier = new JsonStringifyRunnable();

    // Compose the pipeline using pipe()
    return multiplier
        .pipe(wrapper)
        .pipe(stringifier);
}

/**
 * Bonus: Create a reverse pipeline (parse → extract → process)
 */
function createReversePipeline(factor = 2) {
    // Parse JSON string
    class JsonParserRunnable extends Runnable {
        async _call(input, config) {
            return JSON.parse(input);
        }
    }

    // Extract a value from object
    class ExtractorRunnable extends Runnable {
        constructor(key) {
            super();
            this.key = key;
        }
        async _call(input, config) {
            return input[this.key];
        }
    }

    const parser = new JsonParserRunnable();
    const extractor = new ExtractorRunnable('result');
    const multiplier = new MultiplierRunnable(factor);
    const wrapper = new ObjectWrapperRunnable('doubled');
    const stringifier = new JsonStringifyRunnable();

    return parser
        .pipe(extractor)
        .pipe(multiplier)
        .pipe(wrapper)
        .pipe(stringifier);
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Pipeline Composition Solution...\n');

    try {
        // Test 1: Basic pipeline
        console.log('Test 1: Basic pipeline (multiply → wrap → stringify)');
        const pipeline = createPipeline(3);
        console.log(`   Pipeline: ${pipeline.toString()}`);
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
        console.log(`   Outputs:`);
        results3.forEach((r, i) => console.log(`     [${i}]: ${r}`));
        console.assert(results3[0] === '{"result":2}', 'First result should be correct');
        console.assert(results3[1] === '{"result":4}', 'Second result should be correct');
        console.assert(results3[2] === '{"result":6}', 'Third result should be correct');
        console.log('✅ Batch processing works!\n');

        // Test 4: Individual components
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

        // Test 5: Pretty printing
        console.log('Test 5: Pretty printing with indent');
        const prettyStringifier = new JsonStringifyRunnable({ indent: 2 });
        const prettyPipeline = new MultiplierRunnable(5)
            .pipe(new ObjectWrapperRunnable())
            .pipe(prettyStringifier);

        const result5 = await prettyPipeline.invoke(3);
        console.log('   Output with indent:');
        console.log(result5);
        console.assert(result5.includes('\n'), 'Should have newlines');
        console.log('✅ Pretty printing works!\n');

        // Test 6: Complex pipeline with multiple steps
        console.log('Test 6: Complex pipeline (5 steps)');
        class AddConstantRunnable extends Runnable {
            constructor(constant) {
                super();
                this.constant = constant;
            }
            async _call(input, config) {
                return input + this.constant;
            }
        }

        const complexPipeline = new MultiplierRunnable(2)      // 5 * 2 = 10
            .pipe(new AddConstantRunnable(5))                    // 10 + 5 = 15
            .pipe(new MultiplierRunnable(3))                     // 15 * 3 = 45
            .pipe(new ObjectWrapperRunnable('finalResult'))     // { finalResult: 45 }
            .pipe(new JsonStringifyRunnable());                 // JSON string

        const result6 = await complexPipeline.invoke(5);
        console.log(`   Input: 5`);
        console.log(`   Steps: ×2 → +5 → ×3 → wrap → stringify`);
        console.log(`   Output: ${result6}`);
        console.assert(result6 === '{"finalResult":45}', 'Complex pipeline should work');
        console.log('✅ Complex pipeline works!\n');

        // Test 7: Bonus - Reverse pipeline
        console.log('Test 7: Bonus - Reverse pipeline (parse → extract → process)');
        const reversePipeline = createReversePipeline(2);
        const result7 = await reversePipeline.invoke('{"result":10}');
        console.log(`   Input:  '{"result":10}'`);
        console.log(`   Steps: parse → extract → ×2 → wrap → stringify`);
        console.log(`   Output: ${result7}`);
        console.assert(result7 === '{"doubled":20}', 'Reverse pipeline should work');
        console.log('✅ Reverse pipeline works!\n');

        // Test 8: Error propagation through pipeline
        console.log('Test 8: Error propagation');
        try {
            const errorPipeline = createPipeline(5);
            await errorPipeline.invoke('not a number'); // Should fail at multiply step
            console.error('❌ Should have thrown error');
        } catch (error) {
            console.log(`   Caught error: ${error.message}`);
            console.log('✅ Errors propagate correctly!\n');
        }

        console.log('🎉 All tests passed!');
        console.log('\n💡 Key Learnings:');
        console.log('   • Runnables can be composed with pipe()');
        console.log('   • Each step transforms the data');
        console.log('   • Pipelines are themselves Runnables');
        console.log('   • Errors propagate through the pipeline');
        console.log('   • You can test each step individually');
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
    createPipeline,
    createReversePipeline
};