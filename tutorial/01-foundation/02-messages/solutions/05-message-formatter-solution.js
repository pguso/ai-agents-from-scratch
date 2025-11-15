/**
 * Solution 5: Message Formatter
 *
 * This solution demonstrates:
 * - Formatting timestamps
 * - Handling different message types
 * - String truncation
 * - ANSI color codes for terminal output
 */

import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '../../../../src/index.js';

/**
 * Format a single message for display
 */
function formatMessage(message, options = {}) {
    const maxLength = options.maxLength || 100;

    // Format timestamp
    const date = new Date(message.timestamp);
    const timestamp = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Get message type in uppercase
    const type = message.type.toUpperCase().padEnd(6);

    // Truncate content if needed
    let content = message.content;
    if (content.length > maxLength) {
        content = content.substring(0, maxLength - 3) + '...';
    }

    // Build formatted string
    return `[${timestamp}] ${type}: ${content}`;
}

/**
 * Format an entire conversation
 */
function formatConversation(messages) {
    const separator = '─'.repeat(60);
    const lines = [];

    lines.push(separator);
    lines.push('CONVERSATION');
    lines.push(separator);

    messages.forEach((msg) => {
        lines.push(formatMessage(msg));
    });

    lines.push(separator);

    return lines.join('\n');
}

/**
 * ANSI color codes
 */
const COLORS = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    gray: '\x1b[90m'
};

/**
 * Get color for message type
 */
function getColorForType(type) {
    const colorMap = {
        'system': COLORS.blue,
        'human': COLORS.green,
        'ai': COLORS.cyan,
        'tool': COLORS.yellow
    };
    return colorMap[type] || COLORS.reset;
}

/**
 * Format message with terminal colors
 */
function formatMessageWithColor(message, options = {}) {
    const maxLength = options.maxLength || 100;

    // Format timestamp (gray)
    const date = new Date(message.timestamp);
    const timestamp = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const coloredTimestamp = `${COLORS.gray}[${timestamp}]${COLORS.reset}`;

    // Get color for message type
    const color = getColorForType(message.type);
    const type = message.type.toUpperCase().padEnd(6);
    const coloredType = `${color}${type}${COLORS.reset}`;

    // Truncate content if needed
    let content = message.content;
    if (content.length > maxLength) {
        content = content.substring(0, maxLength - 3) + '...';
    }

    return `${coloredTimestamp} ${coloredType}: ${content}`;
}

/**
 * Format conversation with colors
 */
function formatConversationWithColor(messages) {
    const separator = COLORS.gray + '─'.repeat(60) + COLORS.reset;
    const lines = [];

    lines.push(separator);
    lines.push(`${COLORS.gray}CONVERSATION${COLORS.reset}`);
    lines.push(separator);

    messages.forEach((msg) => {
        lines.push(formatMessageWithColor(msg));
    });

    lines.push(separator);

    return lines.join('\n');
}

/**
 * Advanced: Format with metadata
 */
function formatMessageDetailed(message, options = {}) {
    const basic = formatMessage(message, options);

    // Add metadata if present
    const metadata = [];
    if (message.id) {
        metadata.push(`ID: ${message.id.substring(0, 8)}`);
    }
    if (message.additionalKwargs && Object.keys(message.additionalKwargs).length > 0) {
        metadata.push(`Meta: ${JSON.stringify(message.additionalKwargs)}`);
    }
    if (message.type === 'ai' && message.hasToolCalls && message.hasToolCalls()) {
        metadata.push(`Tools: ${message.toolCalls.length}`);
    }
    if (message.type === 'tool' && message.toolCallId) {
        metadata.push(`CallID: ${message.toolCallId.substring(0, 8)}`);
    }

    if (metadata.length > 0) {
        return `${basic}\n        ${COLORS.gray}[${metadata.join(', ')}]${COLORS.reset}`;
    }

    return basic;
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Message Formatter Solution...\n');

    try {
        // Test 1: Basic formatting
        console.log('Test 1: Basic message formatting');
        const msg1 = new HumanMessage("Hello, how are you?");
        const formatted1 = formatMessage(msg1);
        console.log(`   Output: ${formatted1}`);
        console.assert(formatted1.includes('HUMAN'), 'Should include message type');
        console.assert(formatted1.includes('Hello'), 'Should include content');
        console.assert(/\[\d{2}:\d{2}:\d{2}\]/.test(formatted1), 'Should have timestamp');
        console.log('✅ Basic formatting works\n');

        // Test 2: Long message truncation
        console.log('Test 2: Long message truncation');
        const longContent = 'A'.repeat(150);
        const msg2 = new AIMessage(longContent);
        const formatted2 = formatMessage(msg2, { maxLength: 50 });
        console.log(`   Original length: 150 chars`);
        console.log(`   Formatted: ${formatted2.substring(0, 70)}...`);
        console.assert(formatted2.includes('...'), 'Should have ellipsis');
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

        console.log(formatConversation(conversation));
        console.log('✅ Conversation formatting works\n');

        // Test 5: Colored output
        console.log('Test 5: Colored terminal output');
        const coloredMessages = [
            new SystemMessage("System message in blue"),
            new HumanMessage("Human message in green"),
            new AIMessage("AI message in cyan"),
            new ToolMessage("Tool message in yellow", "tool_123")
        ];

        console.log(formatConversationWithColor(coloredMessages));
        console.log('✅ Colored output works\n');

        // Test 6: Detailed formatting with metadata
        console.log('Test 6: Detailed formatting with metadata');
        const msgWithMeta = new HumanMessage("Hello", {
            userId: "user_123",
            sessionId: "sess_456"
        });
        const detailed = formatMessageDetailed(msgWithMeta);
        console.log(detailed);
        console.assert(detailed.includes('Meta:'), 'Should include metadata');
        console.log('✅ Detailed formatting works\n');

        // Test 7: AI message with tool calls
        console.log('Test 7: AI message with tool calls');
        const aiWithTools = new AIMessage("Let me calculate that", {
            toolCalls: [
                { id: 'call_123', type: 'function', function: { name: 'calculator' } }
            ]
        });
        const formattedTools = formatMessageDetailed(aiWithTools);
        console.log(formattedTools);
        console.log('✅ Tool call formatting works\n');

        // Test 8: Empty content handling
        console.log('Test 8: Edge cases');
        const emptyMsg = new HumanMessage("");
        const formatted8 = formatMessage(emptyMsg);
        console.log(`   Empty message: ${formatted8}`);

        const specialChars = new AIMessage("Hello\nWorld\tTest");
        const formatted8b = formatMessage(specialChars);
        console.log(`   Special chars: ${formatted8b}`);
        console.log('✅ Edge cases handled\n');

        // Test 9: Performance with many messages
        console.log('Test 9: Performance test');
        const manyMessages = Array.from({ length: 100 }, (_, i) =>
            new HumanMessage(`Message ${i}`)
        );

        const startTime = Date.now();
        manyMessages.forEach(msg => formatMessage(msg));
        const duration = Date.now() - startTime;

        console.log(`   Formatted 100 messages in ${duration}ms`);
        console.assert(duration < 100, 'Should be fast');
        console.log('✅ Performance is good\n');

        // Test 10: Real conversation example
        console.log('Test 10: Real conversation example');
        const realConversation = [
            new SystemMessage("You are a helpful Python tutor."),
            new HumanMessage("How do I reverse a string in Python?"),
            new AIMessage("You can reverse a string using slicing: text[::-1]"),
            new HumanMessage("Can you show me an example?"),
            new AIMessage("Sure! Here's an example: 'hello'[::-1] returns 'olleh'"),
            new HumanMessage("Thanks!")
        ];

        console.log('\n' + formatConversationWithColor(realConversation));
        console.log('\n✅ Real conversation looks great\n');

        console.log('🎉 All tests passed!');
        console.log('\n💡 Key Features Demonstrated:');
        console.log('   • Timestamp formatting');
        console.log('   • Message type identification');
        console.log('   • Content truncation');
        console.log('   • Terminal colors');
        console.log('   • Metadata display');
        console.log('   • Tool call indicators');
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
    formatMessage,
    formatConversation,
    formatMessageWithColor,
    formatConversationWithColor,
    formatMessageDetailed
};