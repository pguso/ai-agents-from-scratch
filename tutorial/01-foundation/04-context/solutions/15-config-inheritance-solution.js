/**
 * Exercise 15: Config Merging and Child Configs
 *
 * Goal: Understand how configs inherit and merge
 *
 * In this exercise, you'll:
 * 1. Create parent and child configs
 * 2. See how child configs inherit from parents
 * 3. Understand callback accumulation
 * 4. Learn when to use config.merge() vs config.child()
 *
 * This is crucial for nested Runnable calls!
 */

import {RunnableConfig} from '../../../../src/core/context.js';
import {Runnable} from '../../../../src/index.js';
import {BaseCallback} from '../../../../src/utils/callbacks.js';

// Simple callback to show when it's called
class TagLoggerCallback extends BaseCallback {
    constructor(name) {
        super();
        this.name = name;
    }

    async onStart(runnable, input, config) {
        console.log(`[${this.name}] Starting ${runnable.constructor.name}`);
        console.log(`  Tags: [${config.tags.join(', ')}]`);
        console.log(`  Callback count: ${config.callbacks.length}`);
    }

    async onEnd(runnable, output, config) {
        console.log(`[${this.name}] Completed ${runnable.constructor.name}`);
    }
}

// Test Runnables that create child configs
class Step1Runnable extends Runnable {
    async _call(input, config) {
        console.log('\n--- Inside Step1 ---');

        const childConfig = config.child({ tags: ['step1'] });

        console.log(`Step1 child has ${childConfig.callbacks.length} callbacks`);

        // Simulate nested work
        return `Step1(${input})`;
    }
}

class Step2Runnable extends Runnable {
    async _call(input, config) {
        console.log('\n--- Inside Step2 ---');

        const childConfig = config.child({ tags: ['step2'] });

        console.log(`Step2 child has ${childConfig.callbacks.length} callbacks`);

        return `Step2(${input})`;
    }
}

class Step3Runnable extends Runnable {
    async _call(input, config) {
        console.log('\n--- Inside Step3 ---');

        const childConfig = config.child({
            tags: ['step3'],
            metadata: { nested: true }
        });

        console.log(`Step3 tags: [${childConfig.tags.join(', ')}]`);
        console.log(`Step3 metadata:`, childConfig.metadata);

        return `Step3(${input})`;
    }
}

async function exercise() {
    console.log('=== Exercise 15: Config Merging and Child Configs ===\n');

    // Part 1: Basic config inheritance
    console.log('--- Part 1: Basic Inheritance ---\n');

    const parentConfig = new RunnableConfig({
        callbacks: [new TagLoggerCallback('Parent')],
        tags: ['base']
    });

    const childConfig = parentConfig.child({
        callbacks: [new TagLoggerCallback('Child')],
        tags: ['child']
    });

    console.log('Parent callbacks:', parentConfig.callbacks.length);
    console.log('Child callbacks:', childConfig.callbacks.length);
    console.log('Parent tags:', parentConfig.tags);
    console.log('Child tags:', childConfig.tags);

    // Part 2: Config in pipelines
    console.log('\n--- Part 2: Config in Pipelines ---\n');

    const pipelineConfig = new RunnableConfig({
        callbacks: [new TagLoggerCallback('Pipeline')],
        tags: ['base']
    });

    const step1 = new Step1Runnable();
    const step2 = new Step2Runnable();
    const pipeline = step1.pipe(step2);

    await pipeline.invoke("test", pipelineConfig);

    // Part 3: Multiple levels of nesting
    console.log('\n--- Part 3: Multiple Nesting Levels ---\n');

    const level1Config = new RunnableConfig({
        callbacks: [new TagLoggerCallback('Level1')],
        tags: ['level1'],
        metadata: {level: 1}
    });

    const level2Config = level1Config.child({
        callbacks: [new TagLoggerCallback('Level2')],
        tags: ['level2'],
        metadata: {level: 2}
    });

    const level3Config = level2Config.child({
        callbacks: [new TagLoggerCallback('Level3')],
        tags: ['level3'],
        metadata: {level: 3}
    });

    console.log('Level 1 - Callbacks:', level1Config.callbacks.length, 'Tags:', level1Config.tags);
    console.log('Level 2 - Callbacks:', level2Config.callbacks.length, 'Tags:', level2Config.tags);
    console.log('Level 3 - Callbacks:', level3Config.callbacks.length, 'Tags:', level3Config.tags);

    // Part 4: merge() vs child()
    console.log('\n--- Part 4: merge() vs child() ---\n');

    const configA = new RunnableConfig({
        tags: ['a'],
        metadata: {source: 'A'}
    });

    const configB = new RunnableConfig({
        tags: ['b'],
        metadata: {source: 'B', extra: 'data'}
    });

    const merged = configA.merge(configB);

    const child = configA.child({
        tags: ['b'],
        metadata: { extra: 'data' }
    });

    console.log('Merged metadata:', merged.metadata);
    console.log('Child metadata:', child.metadata);

    console.log('\n✓ Exercise 15 complete!');
}

// Run the exercise
exercise().catch(console.error);

/**
 * Expected Output Snippets:
 *
 * --- Part 1: Basic Inheritance ---
 * Parent callbacks: 1
 * Child callbacks: 2
 * Parent tags: ['base']
 * Child tags: ['base', 'child']
 *
 * --- Part 2: Config in Pipelines ---
 * [Pipeline] Starting Step1Runnable
 *   Tags: [base]
 *   Callback count: 1
 *
 * --- Inside Step1 ---
 * Step1 child has 1 callbacks
 * [Pipeline] Completed Step1Runnable
 *
 * --- Part 3: Multiple Nesting Levels ---
 * Level 1 - Callbacks: 1, Tags: ['level1']
 * Level 2 - Callbacks: 2, Tags: ['level1', 'level2']
 * Level 3 - Callbacks: 3, Tags: ['level1', 'level2', 'level3']
 *
 * --- Part 4: merge() vs child() ---
 * Merged metadata: { source: 'B', extra: 'data' }
 * Child metadata: { source: 'A', extra: 'data' }
 *
 * Learning Points:
 * 1. child() creates a new config inheriting from parent
 * 2. Callbacks accumulate (child has parent's + its own)
 * 3. Tags accumulate (arrays concatenate)
 * 4. Metadata merges (child overrides parent keys)
 * 5. merge() treats both configs equally
 * 6. child() treats parent as base, child as override
 */