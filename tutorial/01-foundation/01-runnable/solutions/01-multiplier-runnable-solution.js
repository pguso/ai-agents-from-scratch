/**
 * Solution 1: Multiplier Runnable
 *
 * This solution demonstrates:
 * - Extending the Runnable base class
 * - Storing configuration in constructor
 * - Implementing the _call() method
 * - Input validation
 */

import { Runnable } from '../../../../src/index.js';

/**
 * MultiplierRunnable - Multiplies input by a factor
 */
class MultiplierRunnable extends Runnable {
    constructor(factor) {
        super(); // Always call super() first!

        // Validate factor
        if (typeof factor !== 'number') {
            throw new Error('Factor must be a number');
        }

        this.factor = factor;
    }

    async _call(input, config) {
        // Validate input
        if (typeof input !== 'number') {
            throw new Error('Input must be a number');
        }

        // Perform multiplication
        return input * this.factor;
    }

    // Optional: Override toString for better debugging
    toString() {
        return `MultiplierRunnable(×${this.factor})`;
    }
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing MultiplierRunnable Solution...\n');

    try {
        // Test 1: Basic multiplication
        console.log('Test 1: Basic multiplication');
        const times3 = new MultiplierRunnable(3);
        const result1 = await times3.invoke(5);
        console.assert(result1 === 15, `Expected 15, got ${result1}`);
        console.log('✅ 3 × 5 = 15');
        console.log(`   Runnable: ${times3.toString()}\n`);

        // Test 2: Different factor
        console.log('Test 2: Different factor');
        const times10 = new MultiplierRunnable(10);
        const result2 = await times10.invoke(7);
        console.assert(result2 === 70, `Expected 70, got ${result2}`);
        console.log('✅ 10 × 7 = 70\n');

        // Test 3: Negative numbers
        console.log('Test 3: Negative numbers');
        const times2 = new MultiplierRunnable(2);
        const result3 = await times2.invoke(-5);
        console.assert(result3 === -10, `Expected -10, got ${result3}`);
        console.log('✅ 2 × -5 = -10\n');

        // Test 4: Decimal numbers
        console.log('Test 4: Decimal numbers');
        const times1_5 = new MultiplierRunnable(1.5);
        const result4 = await times1_5.invoke(4);
        console.assert(result4 === 6, `Expected 6, got ${result4}`);
        console.log('✅ 1.5 × 4 = 6\n');

        // Test 5: Zero
        console.log('Test 5: Multiply by zero');
        const times0 = new MultiplierRunnable(0);
        const result5 = await times0.invoke(100);
        console.assert(result5 === 0, `Expected 0, got ${result5}`);
        console.log('✅ 0 × 100 = 0\n');

        // Test 6: Error handling - invalid factor
        console.log('Test 6: Error handling - invalid factor');
        try {
            new MultiplierRunnable('not a number');
            console.error('❌ Should have thrown error');
        } catch (error) {
            console.log('✅ Correctly throws error for invalid factor\n');
        }

        // Test 7: Error handling - invalid input
        console.log('Test 7: Error handling - invalid input');
        try {
            const times5 = new MultiplierRunnable(5);
            await times5.invoke('not a number');
            console.error('❌ Should have thrown error');
        } catch (error) {
            console.log('✅ Correctly throws error for invalid input\n');
        }

        // Test 8: Works with batch
        console.log('Test 8: Batch processing');
        const times2_batch = new MultiplierRunnable(2);
        const results = await times2_batch.batch([1, 2, 3, 4, 5]);
        console.log(`   Input:  [1, 2, 3, 4, 5]`);
        console.log(`   Output: [${results.join(', ')}]`);
        console.assert(JSON.stringify(results) === JSON.stringify([2, 4, 6, 8, 10]));
        console.log('✅ Batch processing works\n');

        console.log('🎉 All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { MultiplierRunnable };