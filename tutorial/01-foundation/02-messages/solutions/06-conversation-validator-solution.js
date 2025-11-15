/**
 * Solution 6: Conversation Validator
 *
 * This solution demonstrates:
 * - Validating message structure
 * - Checking conversation flow
 * - Ensuring tool call sequences are correct
 * - Providing detailed error messages
 */

import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '../../../../src/index.js';

/**
 * Validate a single message
 */
function validateMessage(message) {
    const errors = [];

    // Check message exists
    if (!message) {
        errors.push('Message is null or undefined');
        return { valid: false, errors };
    }

    // Check content is not empty
    if (!message.content || message.content.trim().length === 0) {
        errors.push(`Message content cannot be empty (type: ${message.type})`);
    }

    // Check message has a type
    if (!message.type) {
        errors.push('Message must have a type');
    }

    // Validate tool messages
    if (message.type === 'tool') {
        if (!message.toolCallId) {
            errors.push('Tool message must have a toolCallId');
        }
    }

    // Validate AI messages with tool calls
    if (message.type === 'ai' && message.toolCalls && message.toolCalls.length > 0) {
        message.toolCalls.forEach((toolCall, idx) => {
            if (!toolCall.id) {
                errors.push(`Tool call ${idx} missing id`);
            }
            if (!toolCall.function || !toolCall.function.name) {
                errors.push(`Tool call ${idx} missing function name`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate an entire conversation
 */
function validateConversation(messages) {
    const errors = [];
    const warnings = [];

    // Check if conversation is empty
    if (!messages || messages.length === 0) {
        errors.push('Conversation cannot be empty');
        return { valid: false, errors, warnings };
    }

    // Warn if first message is not system message
    if (messages[0].type !== 'system') {
        warnings.push('Conversation should start with a SystemMessage');
    }

    // Validate each message individually
    messages.forEach((msg, idx) => {
        const result = validateMessage(msg);
        if (!result.valid) {
            result.errors.forEach(err => {
                errors.push(`Message ${idx}: ${err}`);
            });
        }
    });

    // Check message ordering and sequences
    for (let i = 1; i < messages.length; i++) {
        const prev = messages[i - 1];
        const curr = messages[i];

        // Tool messages must follow AI messages with tool calls
        if (curr.type === 'tool') {
            if (prev.type !== 'ai') {
                errors.push(`Message ${i}: Tool message must follow an AI message`);
            } else if (!prev.toolCalls || prev.toolCalls.length === 0) {
                errors.push(`Message ${i}: Tool message must follow an AI message with tool calls`);
            } else {
                // Check if tool call ID exists in previous AI message
                const toolCallIds = prev.toolCalls.map(tc => tc.id);
                if (!toolCallIds.includes(curr.toolCallId)) {
                    errors.push(
                        `Message ${i}: Tool message references unknown tool call ID '${curr.toolCallId}'`
                    );
                }
            }
        }
    }

    // Validate tool call sequences
    const toolSeqResult = validateToolCallSequence(messages);
    errors.push(...toolSeqResult.errors);
    warnings.push(...toolSeqResult.warnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate tool call sequences
 */
function validateToolCallSequence(messages) {
    const errors = [];
    const warnings = [];

    // Collect all tool calls from AI messages
    const toolCalls = new Map(); // id -> { message, toolCall }
    messages.forEach((msg, idx) => {
        if (msg.type === 'ai' && msg.toolCalls) {
            msg.toolCalls.forEach(tc => {
                toolCalls.set(tc.id, { messageIdx: idx, toolCall: tc });
            });
        }
    });

    // Collect all tool messages
    const toolMessages = new Map(); // toolCallId -> message
    messages.forEach((msg, idx) => {
        if (msg.type === 'tool') {
            toolMessages.set(msg.toolCallId, { messageIdx: idx, message: msg });
        }
    });

    // Check every tool call has a corresponding tool message
    toolCalls.forEach((value, callId) => {
        if (!toolMessages.has(callId)) {
            warnings.push(
                `Tool call '${callId}' at message ${value.messageIdx} has no corresponding tool message`
            );
        }
    });

    // Check every tool message references a valid tool call
    toolMessages.forEach((value, callId) => {
        if (!toolCalls.has(callId)) {
            errors.push(
                `Tool message at index ${value.messageIdx} references non-existent tool call '${callId}'`
            );
        }
    });

    return { errors, warnings };
}

/**
 * BONUS: Validate conversation flow (alternating human/AI)
 */
function validateConversationFlow(messages) {
    const errors = [];
    const warnings = [];

    // Skip system message
    let startIdx = messages[0]?.type === 'system' ? 1 : 0;

    for (let i = startIdx; i < messages.length; i++) {
        const msg = messages[i];

        // Skip tool messages in flow check
        if (msg.type === 'tool') continue;

        // After system, should start with human
        if (i === startIdx && msg.type !== 'human') {
            warnings.push('Conversation should start with a human message after system message');
        }

        // Find next non-tool message
        let nextIdx = i + 1;
        while (nextIdx < messages.length && messages[nextIdx].type === 'tool') {
            nextIdx++;
        }

        if (nextIdx < messages.length) {
            const next = messages[nextIdx];

            // Human should be followed by AI
            if (msg.type === 'human' && next.type !== 'ai') {
                warnings.push(`Message ${i}: Human message should be followed by AI message`);
            }

            // AI should be followed by Human (unless using tools)
            if (msg.type === 'ai' && next.type !== 'human' && !msg.toolCalls) {
                warnings.push(`Message ${i}: AI message should be followed by human message`);
            }
        }
    }

    return { errors, warnings };
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Conversation Validator Solution...\n');

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
        if (result1.warnings.length > 0) {
            console.log(`   Warnings: ${result1.warnings[0]}`);
        }
        console.assert(result1.valid === true, 'Should be valid');
        console.log('✅ Valid conversation passes\n');

        // Test 2: Missing system message
        console.log('Test 2: Missing system message');
        const noSystem = [
            new HumanMessage("Hi"),
            new AIMessage("Hello!")
        ];

        const result2 = validateConversation(noSystem);
        console.log(`   Valid: ${result2.valid}`);
        console.log(`   Warnings:`, result2.warnings);
        console.assert(result2.warnings.length > 0, 'Should have warning');
        console.assert(result2.warnings[0].includes('SystemMessage'), 'Should mention system message');
        console.log('✅ Missing system message triggers warning\n');

        // Test 3: Empty message content
        console.log('Test 3: Empty message content');
        const emptyContent = [
            new SystemMessage(""),
            new HumanMessage("Hi")
        ];

        const result3 = validateConversation(emptyContent);
        console.log(`   Valid: ${result3.valid}`);
        console.log(`   Errors:`, result3.errors);
        console.assert(result3.valid === false, 'Should be invalid');
        console.assert(result3.errors[0].includes('empty'), 'Should mention empty content');
        console.log('✅ Empty content caught\n');

        // Test 4: Tool message without AI tool call
        console.log('Test 4: Tool message without preceding AI tool call');
        const badToolSequence = [
            new SystemMessage("You are helpful"),
            new HumanMessage("Calculate 2+2"),
            new ToolMessage("4", "call_123")
        ];

        const result4 = validateConversation(badToolSequence);
        console.log(`   Valid: ${result4.valid}`);
        console.log(`   Errors:`, result4.errors);
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
        console.log(`   Warnings: ${result5.warnings.length}`);
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
        console.log(`   Empty message errors: ${result6b.errors[0]}`);
        console.log('✅ Single message validation works\n');

        // Test 7: Empty conversation
        console.log('Test 7: Empty conversation');
        const result7 = validateConversation([]);
        console.log(`   Valid: ${result7.valid}`);
        console.log(`   Errors: ${result7.errors[0]}`);
        console.assert(result7.valid === false, 'Empty conversation should be invalid');
        console.log('✅ Empty conversation caught\n');

        // Test 8: Multiple tool calls
        console.log('Test 8: Multiple tool calls in sequence');
        const multiTool = [
            new SystemMessage("You are helpful"),
            new HumanMessage("Calculate 2+2 and 3*3"),
            new AIMessage("Let me calculate both", {
                toolCalls: [
                    { id: 'call_1', type: 'function', function: { name: 'add', arguments: '{"a":2,"b":2}' } },
                    { id: 'call_2', type: 'function', function: { name: 'multiply', arguments: '{"a":3,"b":3}' } }
                ]
            }),
            new ToolMessage("4", "call_1"),
            new ToolMessage("9", "call_2"),
            new AIMessage("2+2 = 4 and 3*3 = 9")
        ];

        const result8 = validateConversation(multiTool);
        console.log(`   Valid: ${result8.valid}`);
        console.log(`   Errors: ${result8.errors.length}`);
        console.assert(result8.valid === true, 'Multiple tools should be valid');
        console.log('✅ Multiple tool calls work\n');

        // Test 9: Missing tool message
        console.log('Test 9: Tool call without tool message');
        const missingToolMsg = [
            new SystemMessage("You are helpful"),
            new HumanMessage("Calculate 2+2"),
            new AIMessage("Let me calculate", {
                toolCalls: [{ id: 'call_123', type: 'function', function: { name: 'calc' } }]
            }),
            // Missing ToolMessage here
            new AIMessage("The answer is 4")
        ];

        const result9 = validateConversation(missingToolMsg);
        console.log(`   Valid: ${result9.valid}`);
        console.log(`   Warnings:`, result9.warnings);
        console.assert(result9.warnings.length > 0, 'Should have warning about missing tool message');
        console.log('✅ Missing tool message warning works\n');

        // Test 10: Conversation flow validation
        console.log('Test 10: Conversation flow validation');
        const flowTest = [
            new SystemMessage("You are helpful"),
            new HumanMessage("Hi"),
            new AIMessage("Hello!"),
            new HumanMessage("How are you?"),
            new AIMessage("I'm doing well!")
        ];

        const result10 = validateConversationFlow(flowTest);
        console.log(`   Flow warnings: ${result10.warnings.length}`);
        console.log('✅ Flow validation works\n');

        console.log('🎉 All tests passed!');
        console.log('\n💡 Validation Rules Implemented:');
        console.log('   • Empty content detection');
        console.log('   • System message recommendations');
        console.log('   • Tool call sequence validation');
        console.log('   • Tool call ID matching');
        console.log('   • Conversation flow checking');
        console.log('   • Detailed error messages');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export {
    validateMessage,
    validateConversation,
    validateToolCallSequence,
    validateConversationFlow
};