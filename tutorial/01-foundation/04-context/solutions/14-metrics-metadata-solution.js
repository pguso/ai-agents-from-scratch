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

class MetricsTrackerCallback extends BaseCallback {
    constructor() {
        super();

        // Track when each call started
        this.startTimes = new Map();

        // Metrics per runnable
        this.metrics = {};
    }

    async onStart(runnable, input, config) {
        const key = `${runnable.constructor.name}_${Date.now()}_${Math.random()}`;
        this.startTimes.set(key, Date.now());

        const userId = config?.metadata?.userId;

        const runnableName = runnable.constructor.name;
        if (!this.metrics[runnableName]) {
            this.metrics[runnableName] = {
                totalCalls: 0,
                totalTime: 0,
                users: new Set()
            };
        }

        this.metrics[runnableName].totalCalls++;
        if (userId) {
            this.metrics[runnableName].users.add(userId);
        }

        // Store key for matching in onEnd
        config._metricsKey = key;
    }

    async onEnd(runnable, output, config) {
        const key = config._metricsKey;
        const startTime = this.startTimes.get(key);

        if (startTime) {
            const duration = Date.now() - startTime;
            const runnableName = runnable.constructor.name;

            if (this.metrics[runnableName]) {
                this.metrics[runnableName].totalTime += duration;
            }

            this.startTimes.delete(key);
        }
    }

    async onError(runnable, error, config) {
        const key = config._metricsKey;
        if (key) {
            this.startTimes.delete(key);
        }
    }

    getReport() {
        const report = {};

        for (const [name, data] of Object.entries(this.metrics)) {
            report[name] = {
                calls: data.totalCalls,
                totalTime: data.totalTime,
                avgTime: data.totalCalls > 0 ? Math.round(data.totalTime / data.totalCalls) : 0,
                users: Array.from(data.users)
            };
        }

        return report;
    }

    printReport() {
        console.log('\n📊 Metrics Report:');
        console.log('─'.repeat(60));

        const report = this.getReport();

        for (const [name, data] of Object.entries(report)) {
            console.log(`${name}:`);
            console.log(`  Calls: ${data.calls}`);
            console.log(`  Total Time: ${data.totalTime}ms`);
            console.log(`  Avg Time: ${data.avgTime}ms`);
            console.log(`  Users: ${data.users.join(', ')}`);
            console.log('');
        }
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

async function exercise() {
    console.log('=== Exercise 14: Metrics Tracker with Metadata ===\n');

    const metrics = new MetricsTrackerCallback();

    const fast = new FastRunnable();
    const medium = new MediumRunnable();
    const slow = new SlowRunnable();

    // Test 1: User 1 makes some calls
    console.log('--- User 1 making calls ---');
    await fast.invoke('test1', { callbacks: [metrics], metadata: { userId: "user_123" } });
    await medium.invoke('test2', { callbacks: [metrics], metadata: { userId: "user_123" } });
    await fast.invoke('test3', { callbacks: [metrics], metadata: { userId: "user_123" } });

    // Test 2: User 2 makes different calls
    console.log('--- User 2 making calls ---');
    await slow.invoke('test4', { callbacks: [metrics], metadata: { userId: "user_456" } });
    await fast.invoke('test5', { callbacks: [metrics], metadata: { userId: "user_456" } });

    // Test 3: User 3 makes calls
    console.log('--- User 3 making calls ---');
    await medium.invoke('test6', { callbacks: [metrics], metadata: { userId: "user_789" } });
    await slow.invoke('test7', { callbacks: [metrics], metadata: { userId: "user_789" } });
    await medium.invoke('test8', { callbacks: [metrics], metadata: { userId: "user_789" } });

    metrics.printReport();

    console.log('\n✓ Exercise 2 complete!');
}

// Run the exercise
exercise().catch(console.error);

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