/**
 * Exercise 5: Build a Message Formatter
 *
 * Goal: Create a function that formats messages for console display
 *
 * Requirements:
 * - Format each message type differently
 * - Include timestamp in readable format
 * - Add visual indicators (without emojis)
 * - Truncate long messages (>100 chars)
 * - Show message metadata
 *
 * Example Output:
 *   [10:30:45] SYSTEM: You are a helpful assistant
 *   [10:30:46] HUMAN: What's the weather?
 *   [10:30:47] AI: Let me check that for you...
 */

import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '../../../../src/index.js';

/**
 * TODO: Implement formatMessage
 *
 * Should return a formatted string with:
 * - Timestamp in [HH:MM:SS] format
 * - Message type in UPPERCASE
 * - Content (truncated if too long)
 *
 * @param {BaseMessage} message - The message to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted message string
 */
function formatMessage(message, options = {}) {
    const maxLength = options.maxLength || 100;

    // TODO: Extract timestamp and format as [HH:MM:SS]
    // TODO: Get message type in uppercase
    // TODO: Truncate content if longer than maxLength
    // TODO: Return formatted string
}

/**
 * TODO: Implement formatConversation
 *
 * Formats an entire conversation with proper spacing
 *
 * @param {Array<BaseMessage>} messages - Array of messages
 * @returns {string} Formatted conversation
 */
function formatConversation(messages) {
    // TODO: Format each message
    // TODO: Join with newlines
    // TODO: Add conversation header/footer
}

/**
 * BONUS: Implement colorized output for terminal
 *
 * Add ANSI color codes for different message types:
 * - System: Blue
 * - Human: Green
 * - AI: Cyan
 * - Tool: Yellow
 */
function formatMessageWithColor(message, options = {}) {
    // TODO: Add ANSI color codes based on message type
    // TODO: Use formatMessage internally
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Message Formatter...\n');

    try {
        // Test 1: Basic formatting
        console.log('Test 1: Basic message formatting');
        const msg1 = new HumanMessage("Hello, how are you?");
        const formatted1 = formatMessage(msg1);
        console.log(`   Output: ${formatted1}`);
        console.assert(formatted1.includes('HUMAN'), 'Should include message type');
        console.assert(formatted1.includes('Hello'), 'Should include content');
        console.log('✅ Basic formatting works\n');

        // Test 2: Long message truncation
        console.log('Test 2: Long message truncation');
        const longContent = 'A'.repeat(150);
        const msg2 = new AIMessage(longContent);
        const formatted2 = formatMessage(msg2, { maxLength: 50 });
        console.log(`   Output length: ${formatted2.length}`);
        console.assert(formatted2.length < 100, 'Should truncate long messages');
        console.log('✅ Truncation works\n');

        // Test 3: Different message types
        console.log('Test 3: Different message types');
        const messages = [
            new SystemMessage("You are helpful"),
            new HumanMessage("Hi"),
            new AIMessage("Hello!"),
            new ToolMessage("result", "tool_123")
        ];

        messages.forEach(msg => {
            const formatted = formatMessage(msg);
            console.log(`   ${formatted}`);
        });
        console.log('✅ All message types format correctly\n');

        // Test 4: Conversation formatting
        console.log('Test 4: Full conversation formatting');
        const conversation = [
            new SystemMessage("You are a helpful assistant"),
            new HumanMessage("What's 2+2?"),
            new AIMessage("2+2 equals 4")
        ];

        const formattedConv = formatConversation(conversation);
        console.log(formattedConv);
        console.assert(formattedConv.split('\n').length >= 3, 'Should have multiple lines');
        console.log('✅ Conversation formatting works\n');

        // Test 5: Timestamp format
        console.log('Test 5: Timestamp format');
        const msg5 = new HumanMessage("Test");
        const formatted5 = formatMessage(msg5);
        const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/;
        console.assert(timestampRegex.test(formatted5), 'Should have [HH:MM:SS] timestamp');
        console.log('✅ Timestamp format is correct\n');

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

export { formatMessage, formatConversation, formatMessageWithColor };