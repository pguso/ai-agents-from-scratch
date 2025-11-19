/**
 * Exercise 16: Runtime Configuration Override
 *
 * Goal: Learn to override settings at runtime using config.configurable
 *
 * In this exercise, you'll:
 * 1. Build a Runnable that reads from config.configurable
 * 2. Override default settings at runtime
 * 3. Test different configurations without changing code
 * 4. Understand A/B testing with configs
 *
 * This is how you change LLM temperature, max tokens, etc. at runtime!
 */

import { RunnableConfig } from '../../../../src//core/context.js';
import {Runnable} from '../../../../src/index.js';
import {BaseCallback} from '../../../../src/utils/callbacks.js';

// TODO: Create a configurable text processor
class TextProcessorRunnable extends Runnable {
    constructor(options = {}) {
        super();
        // Set defaults
        this.defaultMaxLength = options.maxLength ?? 50;
        this.defaultUppercase = options.uppercase ?? false;
        this.defaultPrefix = options.prefix ?? '';
    }

    async _call(input, config) {
        // TODO: Get maxLength from config.configurable or use default
        const maxLength = 0; // config.configurable?.maxLength ?? this.defaultMaxLength

        // TODO: Get uppercase setting from config
        const uppercase = false; // config.configurable?.uppercase ?? this.defaultUppercase

        // TODO: Get prefix setting from config
        const prefix = ''; // config.configurable?.prefix ?? this.defaultPrefix

        // Process text
        let result = input;

        // Apply prefix
        if (prefix) {
            result = prefix + result;
        }

        // Apply uppercase
        if (uppercase) {
            result = result.toUpperCase();
        }

        // Apply truncation
        if (result.length > maxLength) {
            result = result.substring(0, maxLength) + '...';
        }

        return result;
    }
}

// Callback to show what config was used
class ConfigLoggerCallback extends BaseCallback {
    async onStart(runnable, input, config) {
        if (config.configurable && Object.keys(config.configurable).length > 0) {
            console.log(`📋 Runtime config:`, config.configurable);
        }
    }
}

// TODO: Test with different runtime configs
async function exercise() {
    console.log('=== Exercise 16: Runtime Configuration Override ===\n');

    // TODO: Create processor with defaults
    const processor = null; // new TextProcessorRunnable({ maxLength: 50 })

    const logger = new ConfigLoggerCallback();

    const longText = "The quick brown fox jumps over the lazy dog. This is a longer sentence to test truncation and various configuration options.";

    // Test 1: Use defaults
    console.log('--- Test 1: Using Defaults ---');
    // TODO: Invoke with just callbacks, no configurable
    const result1 = null;
    console.log('Result:', result1);
    console.log();

    // Test 2: Override maxLength
    console.log('--- Test 2: Override maxLength ---');
    // TODO: Invoke with configurable: { maxLength: 20 }
    const result2 = null;
    console.log('Result:', result2);
    console.log();

    // Test 3: Override multiple settings
    console.log('--- Test 3: Override Multiple Settings ---');
    // TODO: Invoke with configurable: { uppercase: true, maxLength: 30 }
    const result3 = null;
    console.log('Result:', result3);
    console.log();

    // Test 4: Add prefix at runtime
    console.log('--- Test 4: Add Prefix at Runtime ---');
    // TODO: Invoke with configurable: { prefix: '[PREFIX] ', maxLength: 40 }
    const result4 = null;
    console.log('Result:', result4);
    console.log();

    // Test 5: A/B Testing scenario
    console.log('--- Test 5: A/B Testing Different Configs ---');

    // TODO: Create config variant A
    const configA = null; // new RunnableConfig({
    //   callbacks: [logger],
    //   configurable: { maxLength: 25, uppercase: false },
    //   metadata: { variant: 'A', experiment: 'text-processing' }
    // })

    // TODO: Create config variant B
    const configB = null; // new RunnableConfig({
    //   callbacks: [logger],
    //   configurable: { maxLength: 40, uppercase: true },
    //   metadata: { variant: 'B', experiment: 'text-processing' }
    // })

    const testText = "Testing A/B configuration variants";

    // TODO: Test both variants
    // const resultA = await processor.invoke(testText, configA);
    // const resultB = await processor.invoke(testText, configB);

    console.log('Variant A:', 'result here');
    console.log('Variant B:', 'result here');
    console.log();

    // Test 6: Simulating LLM-style configuration
    console.log('--- Test 6: LLM-Style Temperature Override ---');

    // Create a mock LLM runnable
    class MockLLMRunnable extends Runnable {
        constructor(defaultTemp = 0.7) {
            super();
            this.defaultTemperature = defaultTemp;
        }

        async _call(input, config) {
            // TODO: Get temperature from config.configurable
            const temperature = 0.7; // config.configurable?.temperature ?? this.defaultTemperature

            // Simulate different outputs based on temperature
            if (temperature < 0.3) {
                return `[temp=${temperature}] Deterministic response: ${input}`;
            } else if (temperature > 0.8) {
                return `[temp=${temperature}] Creative response about ${input}!!!`;
            } else {
                return `[temp=${temperature}] Balanced response: ${input}.`;
            }
        }
    }

    // TODO: Test the mock LLM with different temperatures
    const llm = null; // new MockLLMRunnable()

    console.log('Low temp (0.1):');
    // const low = await llm.invoke("AI", { configurable: { temperature: 0.1 } });
    // console.log(low);

    console.log('\nMedium temp (0.7):');
    // const med = await llm.invoke("AI", { configurable: { temperature: 0.7 } });
    // console.log(med);

    console.log('\nHigh temp (1.0):');
    // const high = await llm.invoke("AI", { configurable: { temperature: 1.0 } });
    // console.log(high);

    console.log('\n✓ Exercise 4 complete!');
}

// Run the exercise
exercise().catch(console.error);

/**
 * Expected Output:
 *
 * --- Test 1: Using Defaults ---
 * Result: The quick brown fox jumps over the lazy dog. Thi...
 *
 * --- Test 2: Override maxLength ---
 * 📋 Runtime config: { maxLength: 20 }
 * Result: The quick brown fox ...
 *
 * --- Test 3: Override Multiple Settings ---
 * 📋 Runtime config: { uppercase: true, maxLength: 30 }
 * Result: THE QUICK BROWN FOX JUMPS O...
 *
 * --- Test 4: Add Prefix at Runtime ---
 * 📋 Runtime config: { prefix: '[PREFIX] ', maxLength: 40 }
 * Result: [PREFIX] The quick brown fox jumps ove...
 *
 * --- Test 5: A/B Testing Different Configs ---
 * 📋 Runtime config: { maxLength: 25, uppercase: false }
 * Variant A: Testing A/B configurati...
 * 📋 Runtime config: { maxLength: 40, uppercase: true }
 * Variant B: TESTING A/B CONFIGURATION VARIANTS
 *
 * --- Test 6: LLM-Style Temperature Override ---
 * Low temp (0.1):
 * [temp=0.1] Deterministic response: AI
 *
 * Medium temp (0.7):
 * [temp=0.7] Balanced response: AI.
 *
 * High temp (1.0):
 * [temp=1.0] Creative response about AI!!!
 *
 * Learning Points:
 * 1. config.configurable holds runtime overrides
 * 2. Use ?? operator for defaults: config.configurable?.key ?? default
 * 3. Don't modify instance defaults - just use config value
 * 4. Perfect for A/B testing different settings
 * 5. This is how LLMs change temperature/maxTokens at runtime
 * 6. Combine with metadata to track which config was used
 */