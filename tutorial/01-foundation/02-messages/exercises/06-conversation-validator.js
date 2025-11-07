/**
 * Exercise 2: Build a Conversation Validator
 *
 * Goal: Validate conversation structure and message sequences
 *
 * Requirements:
 * - Check if conversation follows proper patterns
 * - Validate message ordering
 * - Ensure tool messages link to AI tool calls
 * - Check for required message types
 * - Return detailed validation errors
 *
 * Validation Rules:
 * 1. First message should be a SystemMessage (recommended)
 * 2. Tool messages must follow AI messages with tool calls
 * 3. No empty message content
 * 4. Human and AI messages should alternate (after system)
 * 5. Tool messages must have valid toolCallId
 */

import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '../../../../src/index.js';

/**
 * TODO: Implement validateMessage
 *
 * Validates a single message
 *
 * @param {BaseMessage} message - The message to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateMessage(message) {
    const errors = [];

    // TODO: Check if message content is not empty
    if (message.content !== '') {
        throw Error('Empty')
    }
    // TODO: Check if message has a type
    if (!Object.hasOwn(message, 'type')) {
        throw Error('No type')
    }
    // TODO: For tool messages, check toolCallId exists

    // TODO: For AI messages, validate tool calls structure

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * TODO: Implement validateConversation
 *
 * Validates an entire conversation structure
 *
 * @param {Array<BaseMessage>} messages - The conversation to validate
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
function validateConversation(messages) {
    const errors = [];
    const warnings = [];

    // TODO: Check if conversation is empty
    // TODO: Warn if first message is not system message
    // TODO: Validate each message individually
    // TODO: Check message ordering (alternating human/AI)
    // TODO: Validate tool message follows AI message with tool calls
    // TODO: Check for tool call ID matches

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * TODO: Implement validateToolCallSequence
 *
 * Validates that tool messages correctly reference AI tool calls
 *
 * @param {Array<BaseMessage>} messages - Messages to check
 * @returns {Object} Validation result
 */
function validateToolCallSequence(messages) {
    // TODO: Find all AI messages with tool calls
    // TODO: Find all tool messages
    // TODO: Check that every tool message references a valid tool call
    // TODO: Check that all tool calls have corresponding tool messages
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Conversation Validator...\n');

    try {
        // Test 1: Valid simple conversation
        console.log('Test 1: Valid simple conversation');
        const validConv = [
            new SystemMessage("You are helpful"),
            new HumanMessage("Hi"),
            new AIMessage("Hello!")
        ];

        const result1 = validateConversation(validConv);
        console.log(`   Valid: ${result1.valid}`);
        console.log(`   Errors: ${result1.errors.length}`);
        console.log(`   Warnings: ${result1.warnings.length}`);
        console.assert(result1.valid === true, 'Should be valid');
        console.log('✅ Valid conversation passes\n');

        // Test 2: Missing system message (warning)
        console.log('Test 2: Missing system message');
        const noSystem = [
            new HumanMessage("Hi"),
            new AIMessage("Hello!")
        ];

        const result2 = validateConversation(noSystem);
        console.log(`   Valid: ${result2.valid}`);
        console.log(`   Warnings: ${result2.warnings}`);
        console.assert(result2.warnings.length > 0, 'Should have warning');
        console.log('✅ Missing system message triggers warning\n');

        // Test 3: Empty message content (error)
        console.log('Test 3: Empty message content');
        const emptyContent = [
            new SystemMessage(""),
            new HumanMessage("Hi")
        ];

        const result3 = validateConversation(emptyContent);
        console.log(`   Valid: ${result3.valid}`);
        console.log(`   Errors: ${result3.errors}`);
        console.assert(result3.valid === false, 'Should be invalid');
        console.log('✅ Empty content caught\n');

        // Test 4: Tool message without AI tool call (error)
        console.log('Test 4: Tool message without preceding AI tool call');
        const badToolSequence = [
            new SystemMessage("You are helpful"),
            new HumanMessage("Calculate 2+2"),
            new ToolMessage("4", "call_123") // No AI tool call before this
        ];

        const result4 = validateConversation(badToolSequence);
        console.log(`   Valid: ${result4.valid}`);
        console.log(`   Errors: ${result4.errors}`);
        console.assert(result4.valid === false, 'Should be invalid');
        console.log('✅ Invalid tool sequence caught\n');

        // Test 5: Valid tool call sequence
        console.log('Test 5: Valid tool call sequence');
        const validToolSeq = [
            new SystemMessage("You are helpful"),
            new HumanMessage("Calculate 2+2"),
            new AIMessage("Let me calculate", {
                toolCalls: [{
                    id: 'call_123',
                    type: 'function',
                    function: { name: 'calculator', arguments: '{"a":2,"b":2}' }
                }]
            }),
            new ToolMessage("4", "call_123"),
            new AIMessage("The answer is 4")
        ];

        const result5 = validateConversation(validToolSeq);
        console.log(`   Valid: ${result5.valid}`);
        console.log(`   Errors: ${result5.errors.length}`);
        console.assert(result5.valid === true, 'Should be valid');
        console.log('✅ Valid tool sequence passes\n');

        // Test 6: Single message validation
        console.log('Test 6: Single message validation');
        const goodMsg = new HumanMessage("Hello");
        const result6a = validateMessage(goodMsg);
        console.assert(result6a.valid === true, 'Valid message should pass');

        const badMsg = new HumanMessage("");
        const result6b = validateMessage(badMsg);
        console.assert(result6b.valid === false, 'Empty message should fail');
        console.log('✅ Single message validation works\n');

        // Test 7: Empty conversation
        console.log('Test 7: Empty conversation');
        const result7 = validateConversation([]);
        console.log(`   Valid: ${result7.valid}`);
        console.assert(result7.valid === false, 'Empty conversation should be invalid');
        console.log('✅ Empty conversation caught\n');

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

export { validateMessage, validateConversation, validateToolCallSequence };