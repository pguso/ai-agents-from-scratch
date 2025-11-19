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
        console.log(`[${this.name}] Starting ${runnable.name}`);
        console.log(`  Tags: [${config.tags.join(', ')}]`);
        console.log(`  Callback count: ${config.callbacks.length}`);
    }

    async onEnd(runnable, output, config) {
        console.log(`[${this.name}] Completed ${runnable.name}`);
    }
}

// Test Runnables that create child configs
class Step1Runnable extends Runnable {
    async _call(input, config) {
        console.log('\n--- Inside Step1 ---');

        // TODO: Create a child config with additional tag
        const childConfig = null; // Use config.child({ tags: ['step1'] })

        // TODO: Log how many callbacks childConfig has
        console.log(`Step1 child has ___ callbacks`);

        // Simulate nested work
        return `Step1(${input})`;
    }
}

class Step2Runnable extends Runnable {
    async _call(input, config) {
        console.log('\n--- Inside Step2 ---');

        // TODO: Create a child config with different tag
        const childConfig = null; // Use config.child({ tags: ['step2'] })

        // TODO: Log how many callbacks childConfig has
        console.log(`Step2 child has ___ callbacks`);

        return `Step2(${input})`;
    }
}

class Step3Runnable extends Runnable {
    async _call(input, config) {
        console.log('\n--- Inside Step3 ---');

        // TODO: Create a child config with:
        // - Additional tag: 'step3'
        // - Additional metadata: { nested: true }
        const childConfig = null; // Use config.child({ ... })

        // TODO: Log the tags and metadata
        console.log(`Step3 tags: [${childConfig.tags.join(', ')}]`);
        console.log(`Step3 metadata:`, childConfig.metadata);

        return `Step3(${input})`;
    }
}

async function exercise() {
    console.log('=== Exercise 15: Config Merging and Child Configs ===\n');

    // Part 1: Basic config inheritance
    console.log('--- Part 1: Basic Inheritance ---\n');

    // TODO: Create parent config with one callback
    const parentConfig = null; // new RunnableConfig({ ... })

    // TODO: Create child config with additional callback
    const childConfig = null; // parentConfig.child({ ... })

    // TODO: Check what's in each config
    console.log('Parent callbacks:', 0); // parentConfig.callbacks.length
    console.log('Child callbacks:', 0);  // childConfig.callbacks.length
    console.log('Parent tags:', []); // parentConfig.tags
    console.log('Child tags:', []); // childConfig.tags

    // Part 2: Config in pipelines
    console.log('\n--- Part 2: Config in Pipelines ---\n');

    // TODO: Create a parent config with callbacks and tags
    const pipelineConfig = null; // new RunnableConfig({ ... })

    // TODO: Create pipeline
    const step1 = new Step1Runnable();
    const step2 = new Step2Runnable();
    const pipeline = null; // step1.pipe(step2)

    // TODO: Invoke pipeline with config
    // await pipeline.invoke("test", pipelineConfig);

    // Part 3: Multiple levels of nesting
    console.log('\n--- Part 3: Multiple Nesting Levels ---\n');

    const level1Config = new RunnableConfig({
        callbacks: [new TagLoggerCallback('Level1')],
        tags: ['level1'],
        metadata: {level: 1}
    });

    // TODO: Create level2 config as child of level1
    const level2Config = null; // level1Config.child({ ... })

    // TODO: Create level3 config as child of level2
    const level3Config = null; // level2Config.child({ ... })

    // TODO: Check the accumulation
    console.log('Level 1 - Callbacks:', 0, 'Tags:', []); // level1Config
    console.log('Level 2 - Callbacks:', 0, 'Tags:', []); // level2Config
    console.log('Level 3 - Callbacks:', 0, 'Tags:', []); // level3Config

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

    // TODO: Use merge() - combines two configs as equals
    const merged = null; // configA.merge(configB)

    // TODO: Use child() - B inherits from A
    const child = null; // configA.child({ tags: ['b'], metadata: { extra: 'data' } })

    // TODO: Compare results
    console.log('Merged metadata:', {}); // merged.metadata
    console.log('Child metadata:', {}); // child.metadata

    console.log('\n✓ Exercise 3 complete!');
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
 * [Parent] Starting Step1Runnable
 *   Tags: [base]
 *   Callback count: 1
 *
 * --- Inside Step1 ---
 * Step1 child has 1 callbacks
 * [Parent] Completed Step1Runnable
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