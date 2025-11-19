/**
 * Exercise 14: Build a Metrics Tracker with Metadata
 *
 * Goal: Learn to use config metadata and track metrics
 *
 * In this exercise, you'll:
 * 1. Build a stateful callback that tracks metrics
 * 2. Use config.metadata to track user information
 * 3. Measure execution time for each Runnable
 * 4. Generate a summary report
 *
 * This teaches you how to pass context through your chains!
 */

import {Runnable} from '../../../../src/index.js';
import {BaseCallback} from '../../../../src/utils/callbacks.js';

// TODO: Create MetricsTrackerCallback
class MetricsTrackerCallback extends BaseCallback {
    constructor() {
        super();

        // Track when each call started
        this.startTimes = new Map();

        // Metrics per runnable
        this.metrics = {};
    }

    async onStart(runnable, input, config) {
        // TODO: Record the start time for this runnable
        // Hint: Use a unique key like `${runnable.name}_${Date.now()}`

        // TODO: Extract userId from config.metadata
        // Hint: const userId = config.metadata?.userId

        // TODO: Initialize metrics for this runnable if it doesnt exist
        // Hint: You'll need to track per-runnable:
        // - Total calls
        // - Total time
        // - Users who called it
    }

    async onEnd(runnable, output, config) {
        // TODO: Calculate duration
        // Hint: Find the matching start time and calculate Date.now() - startTime

        // TODO: Update total time for this runnable

        // TODO: Track which user made this call
        // Hint: Get userId from config.metadata
    }

    async onError(runnable, error, config) {
        // TODO: Track errors (optional)
        // Still need to clean up start time!
    }

    // TODO: Create getReport() method
    getReport() {
        const report = {};

        // TODO: For each runnable in metrics:
        // - Calculate total calls
        // - Calculate average time
        // - List unique users

        return report;
    }

    // TODO: Create printReport() method for nice display
    printReport() {
        console.log('\n📊 Metrics Report:');
        console.log('─'.repeat(60));

        const report = this.getReport();

        // TODO: Print nicely formatted report
        // for (const [name, data] of Object.entries(report)) { ... }
    }
}

// Test Runnables with different speeds
class FastRunnable extends Runnable {
    async _call(input, config) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return `Fast: ${input}`;
    }
}

class SlowRunnable extends Runnable {
    async _call(input, config) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return `Slow: ${input}`;
    }
}

class MediumRunnable extends Runnable {
    async _call(input, config) {
        await new Promise(resolve => setTimeout(resolve, 250));
        return `Medium: ${input}`;
    }
}

// TODO: Test with different users
async function exercise2() {
    console.log('=== Exercise 2: Metrics Tracker with Metadata ===\n');

    // TODO: Create metrics tracker
    const metrics = null; // Replace with: new MetricsTrackerCallback()

    const fast = new FastRunnable();
    const slow = new SlowRunnable();
    const medium = new MediumRunnable();

    // Test 1: User 1 makes some calls
    console.log('--- User 1 making calls ---');
    // TODO: Call fast.invoke with metadata: { userId: "user_123" }
    // TODO: Call medium.invoke with metadata: { userId: "user_123" }
    // TODO: Call fast.invoke again with metadata: { userId: "user_123" }

    // Test 2: User 2 makes different calls
    console.log('--- User 2 making calls ---');
    // TODO: Call slow.invoke with metadata: { userId: "user_456" }
    // TODO: Call fast.invoke with metadata: { userId: "user_456" }

    // Test 3: User 3 makes calls
    console.log('--- User 3 making calls ---');
    // TODO: Call medium.invoke with metadata: { userId: "user_789" }
    // TODO: Call slow.invoke with metadata: { userId: "user_789" }
    // TODO: Call medium.invoke with metadata: { userId: "user_789" }

    // TODO: Print the report
    // metrics.printReport();

    console.log('\n✓ Exercise 2 complete!');
}

// Run the exercise
exercise2().catch(console.error);

/**
 * Expected Output:
 *
 * 📊 Metrics Report:
 * ────────────────────────────────────────────────────────────
 * FastRunnable:
 *   Calls: 3
 *   Total Time: 305ms
 *   Avg Time: 102ms
 *   Users: user_123, user_456
 *
 * SlowRunnable:
 *   Calls: 2
 *   Total Time: 1008ms
 *   Avg Time: 504ms
 *   Users: user_456, user_789
 *
 * MediumRunnable:
 *   Calls: 3
 *   Total Time: 756ms
 *   Avg Time: 252ms
 *   Users: user_123, user_789
 *
 * Learning Points:
 * 1. Stateful callbacks can accumulate data
 * 2. config.metadata passes arbitrary context
 * 3. Useful for tracking per-user metrics
 * 4. Map.set() and Map.get() for tracking start times
 * 5. Report generation for observability
 */