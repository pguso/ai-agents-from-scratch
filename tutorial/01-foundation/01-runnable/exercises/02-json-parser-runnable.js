/**
 * Exercise 2: Build a JSON Parser Runnable
 *
 * Goal: Create a Runnable that parses JSON strings safely
 *
 * Requirements:
 * - Takes a JSON string as input
 * - Parses it to an object
 * - Handles errors gracefully (return null if invalid)
 * - Optional: Add a default value option
 *
 * Example:
 *   const parser = new JsonParserRunnable();
 *   await parser.invoke('{"name":"Alice"}'); // Should return { name: "Alice" }
 *   await parser.invoke('invalid json');     // Should return null
 */

import { Runnable } from '../../../../src/index.js';

/**
 * JsonParserRunnable - Safely parses JSON strings
 *
 * TODO: Implement this class
 */
class JsonParserRunnable extends Runnable {
    constructor(options = {}) {
        // TODO: Call super()
        // TODO: Store options (like defaultValue)
    }

    async _call(input, config) {
        // TODO: Check if input is a string
        // TODO: Try to parse the JSON
        // TODO: If parsing fails, return null or defaultValue
        // TODO: Return the parsed object
    }
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing JsonParserRunnable...\n');

    try {
        // Test 1: Valid JSON object
        console.log('Test 1: Valid JSON object');
        const parser = new JsonParserRunnable();
        const result1 = await parser.invoke('{"name":"Alice","age":30}');
        console.assert(result1.name === 'Alice', 'Should parse name');
        console.assert(result1.age === 30, 'Should parse age');
        console.log('✅ Parsed: {"name":"Alice","age":30}\n');

        // Test 2: Valid JSON array
        console.log('Test 2: Valid JSON array');
        const result2 = await parser.invoke('[1, 2, 3, 4, 5]');
        console.assert(Array.isArray(result2), 'Should return array');
        console.assert(result2.length === 5, 'Should have 5 elements');
        console.log('✅ Parsed: [1, 2, 3, 4, 5]\n');

        // Test 3: Invalid JSON returns null
        console.log('Test 3: Invalid JSON returns null');
        const result3 = await parser.invoke('this is not json');
        console.assert(result3 === null, 'Should return null for invalid JSON');
        console.log('✅ Returns null for invalid JSON\n');

        // Test 4: Empty string returns null
        console.log('Test 4: Empty string returns null');
        const result4 = await parser.invoke('');
        console.assert(result4 === null, 'Should return null for empty string');
        console.log('✅ Returns null for empty string\n');

        // Test 5: With default value
        console.log('Test 5: With default value');
        const parserWithDefault = new JsonParserRunnable({
            defaultValue: { error: 'Invalid JSON' }
        });
        const result5 = await parserWithDefault.invoke('bad json');
        console.assert(result5.error === 'Invalid JSON', 'Should return default value');
        console.log('✅ Returns default value for invalid JSON\n');

        // Test 6: Nested JSON
        console.log('Test 6: Nested JSON');
        const nested = '{"user":{"name":"Bob","address":{"city":"NYC"}}}';
        const result6 = await parser.invoke(nested);
        console.assert(result6.user.address.city === 'NYC', 'Should parse nested objects');
        console.log('✅ Parsed nested JSON\n');

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