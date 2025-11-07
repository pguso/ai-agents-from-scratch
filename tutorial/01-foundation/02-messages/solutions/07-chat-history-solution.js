/**
 * Solution 3: Chat History Manager
 *
 * This solution demonstrates:
 * - Managing conversation state
 * - Sliding window implementation
 * - JSON persistence
 * - Type filtering and statistics
 * - LLM format conversion
 */

import { HumanMessage, AIMessage, SystemMessage, ToolMessage, BaseMessage } from '../../../../src/index.js';

/**
 * ConversationHistory - Manages conversation messages
 */
class ConversationHistory {
    constructor(options = {}) {
        this.messages = [];
        this.maxMessages = options.maxMessages || 100;
        this.preserveSystem = options.preserveSystem !== false; // default true
    }

    /**
     * Add a message to history
     */
    add(message) {
        if (!(message instanceof BaseMessage)) {
            throw new Error('Message must be an instance of BaseMessage');
        }

        this.messages.push(message);

        // Apply sliding window if needed
        if (this.messages.length > this.maxMessages) {
            this._applyWindow();
        }
    }

    /**
     * Apply sliding window to keep only recent messages
     */
    _applyWindow() {
        // Find system message if present
        const systemMsg = this.preserveSystem
            ? this.messages.find(m => m.type === 'system')
            : null;

        // Keep last maxMessages - 1 (to leave room for system message)
        const keepCount = systemMsg ? this.maxMessages - 1 : this.maxMessages;
        const recentMessages = this.messages.slice(-keepCount);

        // Rebuild messages array
        if (systemMsg && !recentMessages.find(m => m.type === 'system')) {
            this.messages = [systemMsg, ...recentMessages.filter(m => m.type !== 'system')];
        } else {
            this.messages = recentMessages;
        }
    }

    /**
     * Get all messages (returns copy)
     */
    getAll() {
        return [...this.messages];
    }

    /**
     * Get last N messages
     */
    getLast(n = 1) {
        return this.messages.slice(-n);
    }

    /**
     * Get messages by type
     */
    getByType(type) {
        return this.messages.filter(msg => msg.type === type);
    }

    /**
     * Get message count
     */
    count() {
        return this.messages.length;
    }

    /**
     * Clear history but preserve system message
     */
    clear() {
        const systemMsg = this.preserveSystem
            ? this.messages.find(m => m.type === 'system')
            : null;

        this.messages = systemMsg ? [systemMsg] : [];
    }

    /**
     * Format for LLM consumption
     */
    toPromptFormat() {
        return this.messages.map(msg => msg.toPromptFormat());
    }

    /**
     * Save to JSON string
     */
    save() {
        const data = {
            messages: this.messages.map(msg => msg.toJSON()),
            maxMessages: this.maxMessages,
            preserveSystem: this.preserveSystem
        };
        return JSON.stringify(data);
    }

    /**
     * Load from JSON string
     */
    static load(json, options = {}) {
        const data = JSON.parse(json);

        const history = new ConversationHistory({
            maxMessages: data.maxMessages || options.maxMessages || 100,
            preserveSystem: data.preserveSystem !== false
        });

        // Recreate messages from JSON
        data.messages.forEach(msgData => {
            const message = BaseMessage.fromJSON(msgData);
            history.messages.push(message);
        });

        return history;
    }

    /**
     * Get conversation statistics
     */
    getStats() {
        const stats = {
            total: this.messages.length,
            system: 0,
            human: 0,
            ai: 0,
            tool: 0,
            estimatedTokens: 0
        };

        this.messages.forEach(msg => {
            stats[msg.type]++;
            // Rough token estimate: ~4 chars per token
            stats.estimatedTokens += Math.ceil(msg.content.length / 4);
        });

        return stats;
    }

    /**
     * Get messages in a time range
     */
    getRange(startTime, endTime) {
        return this.messages.filter(msg =>
            msg.timestamp >= startTime && msg.timestamp <= endTime
        );
    }

    /**
     * Find messages by content search
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.messages.filter(msg =>
            msg.content.toLowerCase().includes(lowerQuery)
        );
    }
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Conversation History Manager Solution...\n');

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
        last2.forEach(msg => console.log(`     - ${msg.type}: ${msg.content}`));
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

        const count = limited.count();
        console.log(`   Added: 11 messages (1 system + 10 human)`);
        console.log(`   Kept: ${count} messages (max: 5)`);
        console.assert(count === 5, 'Should keep only 5 messages');

        // System message should be preserved
        const hasSystem = limited.getAll().some(m => m.type === 'system');
        console.assert(hasSystem, 'Should preserve system message');
        console.log(`   System message preserved: ${hasSystem}`);
        console.log('✅ Sliding window works\n');

        // Test 5: Clear history
        console.log('Test 5: Clear history');
        const hist5 = new ConversationHistory();
        hist5.add(new SystemMessage("You are helpful"));
        hist5.add(new HumanMessage("Hi"));
        hist5.add(new AIMessage("Hello!"));

        console.log(`   Before clear: ${hist5.count()} messages`);
        hist5.clear();
        console.log(`   After clear: ${hist5.count()} messages`);

        const afterClear = hist5.getAll();
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
        console.assert(loadedMessages[0].content === 'You are helpful', 'Should preserve content');
        console.log('✅ Persistence works\n');

        // Test 7: Format for LLM
        console.log('Test 7: Format for LLM');
        const hist7 = new ConversationHistory();
        hist7.add(new SystemMessage("You are helpful"));
        hist7.add(new HumanMessage("Hi"));
        hist7.add(new AIMessage("Hello!"));

        const formatted = hist7.toPromptFormat();
        console.log(`   Formatted messages:`);
        formatted.forEach(msg => console.log(`     ${msg.role}: ${msg.content}`));
        console.assert(formatted[0].role === 'system', 'Should have system role');
        console.assert(formatted[1].role === 'user', 'Should map human to user');
        console.assert(formatted[2].role === 'assistant', 'Should map ai to assistant');
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
        console.assert(stats.ai === 2, 'Should count AI messages');
        console.assert(stats.system === 1, 'Should count system messages');
        console.log('✅ Statistics work\n');

        // Test 9: Search functionality
        console.log('Test 9: Search messages by content');
        const hist9 = new ConversationHistory();
        hist9.add(new HumanMessage("What's the weather?"));
        hist9.add(new AIMessage("It's sunny today"));
        hist9.add(new HumanMessage("What about tomorrow?"));
        hist9.add(new AIMessage("Tomorrow will be rainy"));

        const weatherResults = hist9.search('weather');
        const tomorrowResults = hist9.search('tomorrow');
        console.log(`   'weather' found in: ${weatherResults.length} messages`);
        console.log(`   'tomorrow' found in: ${tomorrowResults.length} messages`);
        console.assert(weatherResults.length === 1, 'Should find weather query');
        console.assert(tomorrowResults.length === 2, 'Should find tomorrow in both messages');
        console.log('✅ Search works\n');

        // Test 10: Time range queries
        console.log('Test 10: Get messages in time range');
        const hist10 = new ConversationHistory();

        hist10.add(new HumanMessage("Message 1"));
        await new Promise(resolve => setTimeout(resolve, 10));
        const midTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 10));
        hist10.add(new HumanMessage("Message 2"));
        hist10.add(new HumanMessage("Message 3"));

        const afterMid = hist10.getRange(midTime, Date.now() + 1000);
        console.log(`   Messages after midpoint: ${afterMid.length}`);
        console.assert(afterMid.length === 2, 'Should get messages 2 and 3');
        console.log('✅ Time range queries work\n');

        // Test 11: Complex conversation
        console.log('Test 11: Complex conversation with tools');
        const hist11 = new ConversationHistory();
        hist11.add(new SystemMessage("You are a calculator"));
        hist11.add(new HumanMessage("What's 5+3?"));
        hist11.add(new AIMessage("Let me calculate", {
            toolCalls: [{ id: 'call_1', type: 'function', function: { name: 'add' } }]
        }));
        hist11.add(new ToolMessage("8", "call_1"));
        hist11.add(new AIMessage("5+3 equals 8"));

        const stats11 = hist11.getStats();
        console.log(`   Total messages: ${stats11.total}`);
        console.log(`   Message breakdown:`, stats11);
        console.assert(stats11.tool === 1, 'Should count tool message');
        console.log('✅ Complex conversations work\n');

        console.log('🎉 All tests passed!');
        console.log('\n💡 Features Demonstrated:');
        console.log('   • Message storage and retrieval');
        console.log('   • Sliding window with system preservation');
        console.log('   • Type filtering');
        console.log('   • JSON persistence');
        console.log('   • LLM format conversion');
        console.log('   • Statistics and analytics');
        console.log('   • Search functionality');
        console.log('   • Time-based queries');
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