/**
 * Exercise 1: Build a Multiplier Runnable
 *
 * Goal: Create a Runnable that multiplies numbers by a factor
 *
 * Requirements:
 * - Takes a number as input
 * - Multiplies by a factor set in constructor
 * - Returns the result
 *
 * Example:
 *   const times3 = new MultiplierRunnable(3);
 *   await times3.invoke(5); // Should return 15
 */

import { Runnable } from '../../../../src/index.js';

/**
 * MultiplierRunnable - Multiplies input by a factor
 *
 * TODO: Implement this class
 */
class MultiplierRunnable extends Runnable {
    constructor(factor) {
        // TODO: Call super()
        // TODO: Store the factor
    }

    async _call(input, config) {
        // TODO: Validate that input is a number
        // TODO: Multiply input by this.factor
        // TODO: Return the result
    }
}

// ============================================================================
// Tests - Run this file to check your implementation
// ============================================================================

async function runTests() {
    console.log('🧪 Testing MultiplierRunnable...\n');

    try {
        // Test 1: Basic multiplication
        console.log('Test 1: Basic multiplication');
        const times3 = new MultiplierRunnable(3);
        const result1 = await times3.invoke(5);
        console.assert(result1 === 15, `Expected 15, got ${result1}`);
        console.log('✅ 3 × 5 = 15\n');

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

        console.log('🎉 All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { MultiplierRunnable };