/**
 * Exercise 3: Create a Chat History Manager
 *
 * Goal: Build a class to manage conversation history with persistence
 *
 * Requirements:
 * - Add messages to history
 * - Get last N messages
 * - Filter by message type
 * - Implement sliding window (max messages)
 * - Save/load from JSON
 * - Clear history (but keep system message)
 * - Format for LLM consumption
 *
 * Example Usage:
 *   const history = new ConversationHistory({ maxMessages: 50 });
 *   history.add(new SystemMessage("You are helpful"));
 *   history.add(new HumanMessage("Hi"));
 *   const recent = history.getLast(5);
 *   const json = history.save();
 */

import { HumanMessage, AIMessage, SystemMessage, ToolMessage, BaseMessage } from '../../../../src/index.js';

/**
 * TODO: Implement ConversationHistory class
 *
 * Manages conversation history with:
 * - Sliding window (automatic old message removal)
 * - Type filtering
 * - Persistence (save/load JSON)
 * - LLM formatting
 */
class ConversationHistory {
    constructor(options = {}) {
        // TODO: Initialize messages array
        // TODO: Store maxMessages option (default: 100)
        // TODO: Store other options
    }

    /**
     * TODO: Add a message to history
     * Should handle sliding window automatically
     */
    add(message) {
        // TODO: Add message to array
        // TODO: If exceeds maxMessages, remove oldest (but keep system message)
    }

    /**
     * TODO: Get all messages
     * Should return a copy, not the original array
     */
    getAll() {
        // TODO: Return copy of messages array
    }

    /**
     * TODO: Get last N messages
     */
    getLast(n = 1) {
        // TODO: Return last n messages
    }

    /**
     * TODO: Get messages by type
     */
    getByType(type) {
        // TODO: Filter messages by type
        // TODO: Return filtered array
    }

    /**
     * TODO: Clear history
     * Keep system message if present
     */
    clear() {
        // TODO: Find system message
        // TODO: Reset messages array
        // TODO: Keep system message if it existed
    }

    /**
     * TODO: Format for LLM
     * Convert to array of {role, content} objects
     */
    toPromptFormat() {
        // TODO: Map messages to LLM format
        // TODO: Use message.toPromptFormat() method
    }

    /**
     * TODO: Save to JSON string
     */
    save() {
        // TODO: Convert messages to JSON
        // TODO: Return JSON string
    }

    /**
     * TODO: Load from JSON string
     * Static method
     */
    static load(json, options = {}) {
        // TODO: Parse JSON
        // TODO: Create ConversationHistory instance
        // TODO: Recreate messages from JSON
        // TODO: Return populated instance
    }

    /**
     * TODO: Get conversation statistics
     */
    getStats() {
        // TODO: Count messages by type
        // TODO: Calculate total tokens (estimate)
        // TODO: Return stats object
    }
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Conversation History Manager...\n');

    try {
        // Test 1: Basic add and get
        console.log('Test 1: Add and retrieve messages');
        const history = new ConversationHistory();
        history.add(new SystemMessage("You are helpful"));
        history.add(new HumanMessage("Hi"));
        history.add(new AIMessage("Hello!"));

        const all = history.getAll();
        console.log(`   Added: 3 messages`);
        console.log(`   Retrieved: ${all.length} messages`);
        console.assert(all.length === 3, 'Should have 3 messages');
        console.log('✅ Basic operations work\n');

        // Test 2: Get last N messages
        console.log('Test 2: Get last N messages');
        const last2 = history.getLast(2);
        console.log(`   Last 2 messages:`);
        last2.forEach(msg => console.log(`     - ${msg.type}: ${msg.content.substring(0, 30)}`));
        console.assert(last2.length === 2, 'Should return 2 messages');
        console.assert(last2[0].type === 'human', 'First should be human');
        console.log('✅ getLast works\n');

        // Test 3: Filter by type
        console.log('Test 3: Filter by message type');
        const humanMessages = history.getByType('human');
        const aiMessages = history.getByType('ai');
        console.log(`   Human messages: ${humanMessages.length}`);
        console.log(`   AI messages: ${aiMessages.length}`);
        console.assert(humanMessages.length === 1, 'Should have 1 human message');
        console.assert(aiMessages.length === 1, 'Should have 1 AI message');
        console.log('✅ Filtering works\n');

        // Test 4: Sliding window
        console.log('Test 4: Sliding window (max messages)');
        const limited = new ConversationHistory({ maxMessages: 5 });
        limited.add(new SystemMessage("You are helpful"));

        // Add 10 messages
        for (let i = 0; i < 10; i++) {
            limited.add(new HumanMessage(`Message ${i}`));
        }

        const count = limited.getAll().length;
        console.log(`   Added: 11 messages (1 system + 10 human)`);
        console.log(`   Kept: ${count} messages (max: 5)`);
        console.assert(count === 5, 'Should keep only 5 messages');

        // System message should be preserved
        const hasSystem = limited.getAll().some(m => m.type === 'system');
        console.assert(hasSystem, 'Should preserve system message');
        console.log('✅ Sliding window works\n');

        // Test 5: Clear history
        console.log('Test 5: Clear history');
        const hist5 = new ConversationHistory();
        hist5.add(new SystemMessage("You are helpful"));
        hist5.add(new HumanMessage("Hi"));
        hist5.add(new AIMessage("Hello!"));

        hist5.clear();
        const afterClear = hist5.getAll();
        console.log(`   Messages after clear: ${afterClear.length}`);
        console.assert(afterClear.length === 1, 'Should keep system message');
        console.assert(afterClear[0].type === 'system', 'Should be system message');
        console.log('✅ Clear preserves system message\n');

        // Test 6: Save and load
        console.log('Test 6: Save and load from JSON');
        const hist6 = new ConversationHistory();
        hist6.add(new SystemMessage("You are helpful"));
        hist6.add(new HumanMessage("Hi"));
        hist6.add(new AIMessage("Hello!"));

        const json = hist6.save();
        console.log(`   Saved JSON length: ${json.length} chars`);

        const loaded = ConversationHistory.load(json);
        const loadedMessages = loaded.getAll();
        console.log(`   Loaded: ${loadedMessages.length} messages`);
        console.assert(loadedMessages.length === 3, 'Should load all messages');
        console.assert(loadedMessages[0].type === 'system', 'Should preserve types');
        console.log('✅ Persistence works\n');

        // Test 7: Format for LLM
        console.log('Test 7: Format for LLM');
        const hist7 = new ConversationHistory();
        hist7.add(new SystemMessage("You are helpful"));
        hist7.add(new HumanMessage("Hi"));
        hist7.add(new AIMessage("Hello!"));

        const formatted = hist7.toPromptFormat();
        console.log(`   Formatted messages:`, JSON.stringify(formatted, null, 2));
        console.assert(formatted[0].role === 'system', 'Should have system role');
        console.assert(formatted[1].role === 'user', 'Should map human to user');
        console.log('✅ LLM formatting works\n');

        // Test 8: Statistics
        console.log('Test 8: Get conversation statistics');
        const hist8 = new ConversationHistory();
        hist8.add(new SystemMessage("You are helpful"));
        hist8.add(new HumanMessage("Hi"));
        hist8.add(new AIMessage("Hello!"));
        hist8.add(new HumanMessage("How are you?"));
        hist8.add(new AIMessage("I'm great!"));

        const stats = hist8.getStats();
        console.log(`   Statistics:`, stats);
        console.assert(stats.total === 5, 'Should count total');
        console.assert(stats.human === 2, 'Should count human messages');
        console.log('✅ Statistics work\n');

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

export { ConversationHistory };