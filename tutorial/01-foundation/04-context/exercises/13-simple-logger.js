/**
 * Exercise 1: Build a Simple Logging Callback
 *
 * Goal: Understand the basic callback lifecycle
 *
 * In this exercise, you'll:
 * 1. Extend BaseCallback to create a custom logger
 * 2. Implement onStart, onEnd, and onError methods
 * 3. Format output with emoji indicators
 * 4. See how callbacks observe Runnable execution
 *
 * This is the foundation of observability in your framework!
 */

import {Runnable} from '../../../../src/index.js';
import {BaseCallback} from '../../../../src/utils/callbacks.js';

// TODO: Create SimpleLoggerCallback that extends BaseCallback
class SimpleLoggerCallback extends BaseCallback {
    constructor(options = {}) {
        super();
        this.showTimestamp = options.showTimestamp ?? false;
    }

    // TODO: Implement onStart - log when runnable starts
    // Use emoji: ▶️
    // Log to console: runnable name and input
    async onStart(runnable, input, config) {
        // Your code here
    }

    // TODO: Implement onEnd - log when runnable completes
    // Use emoji: ✔️
    // Log to console: runnable name and output
    async onEnd(runnable, output, config) {
        // Your code here
    }

    // TODO: Implement onError - log when runnable errors
    // Use emoji: ❌
    // Log to console: runnable name and error message
    async onError(runnable, error, config) {
        // Your code here
    }
}

// Test Runnables
class GreeterRunnable extends Runnable {
    async _call(input, config) {
        return `Hello, ${input}!`;
    }
}

class UpperCaseRunnable extends Runnable {
    async _call(input, config) {
        if (typeof input !== 'string') {
            throw new Error('Input must be a string');
        }
        return input.toUpperCase();
    }
}

class ErrorRunnable extends Runnable {
    async _call(input, config) {
        throw new Error('Intentional error for testing');
    }
}

// TODO: Test your callback
async function exercise1() {
    console.log('=== Exercise 1: Simple Logging Callback ===\n');

    // TODO: Create an instance of your SimpleLoggerCallback
    const logger = null; // Replace with your code

    const config = {
        callbacks: [logger]
    };

    // Test 1: Normal execution
    console.log('--- Test 1: Normal Execution ---');
    const greeter = new GreeterRunnable();
    // TODO: Invoke greeter with "World" and config
    const result1 = null; // Replace with your code
    console.log('Final result:', result1);
    console.log();

    // Test 2: Pipeline
    console.log('--- Test 2: Pipeline ---');
    const upper = new UpperCaseRunnable();
    const pipeline = greeter.pipe(upper);
    // TODO: Invoke pipeline with "claude" and config
    const result2 = null; // Replace with your code
    console.log('Final result:', result2);
    console.log();

    // Test 3: Error handling
    console.log('--- Test 3: Error Handling ---');
    const errorRunnable = new ErrorRunnable();
    try {
        // TODO: Invoke errorRunnable with "test" and config
        // Replace with your code
    } catch (error) {
        console.log('Caught error (expected):', error.message);
    }

    console.log('\n✓ Exercise 1 complete!');
}

// Run the exercise
exercise1().catch(console.error);

/**
 * Expected Output:
 *
 * --- Test 1: Normal Execution ---
 * ▶️ Starting: GreeterRunnable
 *    Input: World
 * ✔️ Completed: GreeterRunnable
 *    Output: Hello, World!
 * Final result: Hello, World!
 *
 * --- Test 2: Pipeline ---
 * ▶️  Starting: RunnableSequence
 *    Input: claude
 * ▶️  Starting: GreeterRunnable
 *    Input: claude
 * ✔️  Completed: GreeterRunnable
 *    Output: Hello, claude!
 * ▶️  Starting: UpperCaseRunnable
 *    Input: Hello, claude!
 * ✔️  Completed: UpperCaseRunnable
 *    Output: HELLO, CLAUDE!
 * ✔️  Completed: RunnableSequence
 *    Output: HELLO, CLAUDE!
 * Final result: HELLO, CLAUDE!
 *
 * --- Test 3: Error Handling ---
 * ▶️ Starting: ErrorRunnable
 *    Input: test
 * ❌ ErrorRunnable: Intentional error for testing
 * Caught error (expected): Intentional error for testing
 *
 * Learning Points:
 * 1. Callbacks see every step in execution
 * 2. onStart fires before _call()
 * 3. onEnd fires after successful _call()
 * 4. onError fires when _call() throws error
 * 5. Callbacks don't change the output - they just observe
 */