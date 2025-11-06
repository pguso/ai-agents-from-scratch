/**
 * Solution 2: JSON Parser Runnable
 *
 * This solution demonstrates:
 * - Graceful error handling with try-catch
 * - Configuration through constructor options
 * - Type checking input
 * - Providing default values
 */

import { Runnable } from '../../../../src/index.js';

/**
 * JsonParserRunnable - Safely parses JSON strings
 */
class JsonParserRunnable extends Runnable {
    constructor(options = {}) {
        super();

        // Store configuration
        this.defaultValue = options.defaultValue ?? null;
        this.throwOnError = options.throwOnError ?? false;
    }

    async _call(input, config) {
        // Ensure input is a string
        if (typeof input !== 'string') {
            if (this.throwOnError) {
                throw new Error('Input must be a string');
            }
            return this.defaultValue;
        }

        // Handle empty strings
        if (input.trim().length === 0) {
            return this.defaultValue;
        }

        // Try to parse JSON
        try {
            return JSON.parse(input);
        } catch (error) {
            // If throwOnError is true, propagate the error
            if (this.throwOnError) {
                throw new Error(`Failed to parse JSON: ${error.message}`);
            }

            // Otherwise, return default value
            return this.defaultValue;
        }
    }

    toString() {
        return `JsonParserRunnable()`;
    }
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing JsonParserRunnable Solution...\n');

    try {
        // Test 1: Valid JSON object
        console.log('Test 1: Valid JSON object');
        const parser = new JsonParserRunnable();
        const result1 = await parser.invoke('{"name":"Alice","age":30}');
        console.assert(result1.name === 'Alice', 'Should parse name');
        console.assert(result1.age === 30, 'Should parse age');
        console.log('✅ Parsed:', result1);
        console.log();

        // Test 2: Valid JSON array
        console.log('Test 2: Valid JSON array');
        const result2 = await parser.invoke('[1, 2, 3, 4, 5]');
        console.assert(Array.isArray(result2), 'Should return array');
        console.assert(result2.length === 5, 'Should have 5 elements');
        console.log('✅ Parsed:', result2);
        console.log();

        // Test 3: Invalid JSON returns null
        console.log('Test 3: Invalid JSON returns null');
        const result3 = await parser.invoke('this is not json');
        console.assert(result3 === null, 'Should return null for invalid JSON');
        console.log('✅ Returns:', result3);
        console.log();

        // Test 4: Empty string returns null
        console.log('Test 4: Empty string returns null');
        const result4 = await parser.invoke('');
        console.assert(result4 === null, 'Should return null for empty string');
        console.log('✅ Returns:', result4);
        console.log();

        // Test 5: With default value
        console.log('Test 5: With default value');
        const parserWithDefault = new JsonParserRunnable({
            defaultValue: { error: 'Invalid JSON' }
        });
        const result5 = await parserWithDefault.invoke('bad json');
        console.assert(result5.error === 'Invalid JSON', 'Should return default value');
        console.log('✅ Returns:', result5);
        console.log();

        // Test 6: Nested JSON
        console.log('Test 6: Nested JSON');
        const nested = '{"user":{"name":"Bob","address":{"city":"NYC"}}}';
        const result6 = await parser.invoke(nested);
        console.assert(result6.user.address.city === 'NYC', 'Should parse nested objects');
        console.log('✅ Parsed:', result6);
        console.log();

        // Test 7: Numbers and booleans
        console.log('Test 7: Primitive values');
        const result7a = await parser.invoke('42');
        const result7b = await parser.invoke('true');
        const result7c = await parser.invoke('"hello"');
        console.assert(result7a === 42, 'Should parse number');
        console.assert(result7b === true, 'Should parse boolean');
        console.assert(result7c === 'hello', 'Should parse string');
        console.log('✅ Parsed primitives:', result7a, result7b, result7c);
        console.log();

        // Test 8: Batch processing
        console.log('Test 8: Batch processing');
        const inputs = [
            '{"id":1}',
            '{"id":2}',
            'invalid',
            '{"id":3}'
        ];
        const results = await parser.batch(inputs);
        console.log('   Inputs:', inputs);
        console.log('   Results:', results);
        console.assert(results[0].id === 1, 'First should parse');
        console.assert(results[2] === null, 'Invalid should be null');
        console.assert(results[3].id === 3, 'Last should parse');
        console.log('✅ Batch processing works');
        console.log();

        // Test 9: throwOnError mode
        console.log('Test 9: throwOnError mode');
        const strictParser = new JsonParserRunnable({ throwOnError: true });
        try {
            await strictParser.invoke('invalid json');
            console.error('❌ Should have thrown error');
        } catch (error) {
            console.log('✅ Throws error in strict mode:', error.message);
        }
        console.log();

        // Test 10: Complex real-world JSON
        console.log('Test 10: Complex real-world JSON');
        const complexJson = `{
      "users": [
        {"id": 1, "name": "Alice", "active": true},
        {"id": 2, "name": "Bob", "active": false}
      ],
      "metadata": {
        "total": 2,
        "timestamp": "2024-01-01"
      }
    }`;
        const result10 = await parser.invoke(complexJson);
        console.assert(result10.users.length === 2, 'Should have 2 users');
        console.assert(result10.metadata.total === 2, 'Should have metadata');
        console.log('✅ Parsed complex JSON');
        console.log();

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

export { JsonParserRunnable };