/**
 * Solution 1: Conversational LLM
 *
 * This solution demonstrates:
 * - Extending existing Runnables
 * - Automatic conversation history management
 * - Sliding window implementation
 * - Stateful LLM wrapper
 */

import { LlamaCppLLM } from '../../../src/llm/llama-cpp-llm.js';
import { HumanMessage, AIMessage, SystemMessage } from '../../../src/core/message.js';

/**
 * ConversationalLLM - LLM with automatic conversation memory
 */
class ConversationalLLM extends LlamaCppLLM {
    constructor(options = {}) {
        super(options);

        // Conversation history
        this.history = [];

        // Maximum messages to keep (excluding system)
        this.maxHistory = options.maxHistory || 20;

        // Add system message if provided
        if (options.systemMessage) {
            this.history.push(new SystemMessage(options.systemMessage));
        }
    }

    /**
     * Chat - simplified interface with automatic history
     */
    async chat(userMessage, config = {}) {
        // Convert string to HumanMessage if needed
        const humanMsg = typeof userMessage === 'string'
            ? new HumanMessage(userMessage)
            : userMessage;

        // Add to history
        this.history.push(humanMsg);

        // Call parent invoke with full history
        const aiResponse = await this.invoke(this.history, config);

        // Add AI response to history
        this.history.push(aiResponse);

        // Apply sliding window if needed
        this._applyWindow();

        // Return just the content for convenience
        return aiResponse.content;
    }

    /**
     * Apply sliding window to keep history manageable
     */
    _applyWindow() {
        // Find system message if it exists
        const systemMsg = this.history.find(m => m._type === 'system');

        // Calculate how many messages we can keep
        const maxTotal = systemMsg ? this.maxHistory + 1 : this.maxHistory;

        // If we're over the limit, trim
        if (this.history.length > maxTotal) {
            // Keep system message separate
            const withoutSystem = this.history.filter(m => m._type !== 'system');

            // Keep only last N messages
            const kept = withoutSystem.slice(-this.maxHistory);

            // Rebuild history
            this.history = systemMsg ? [systemMsg, ...kept] : kept;
        }
    }

    /**
     * Get conversation history (returns copy)
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Clear conversation but keep system message
     */
    clear() {
        const systemMsg = this.history.find(m => m._type === 'system');
        this.history = systemMsg ? [systemMsg] : [];
    }

    /**
     * Get last N messages
     */
    getLastMessages(n) {
        return this.history.slice(-n);
    }

    /**
     * Get message count (excluding system)
     */
    getMessageCount() {
        return this.history.filter(m => m._type !== 'system').length;
    }

    /**
     * Set a new system message
     */
    setSystemMessage(content) {
        // Remove existing system message
        this.history = this.history.filter(m => m._type !== 'system');

        // Add new one at the beginning
        this.history.unshift(new SystemMessage(content));
    }

    /**
     * Export conversation to JSON
     */
    exportConversation() {
        return JSON.stringify(
            this.history.map(m => m.toJSON()),
            null,
            2
        );
    }

    /**
     * Import conversation from JSON
     */
    importConversation(json) {
        const data = JSON.parse(json);
        this.history = data.map(msgData => {
            const MessageClass = {
                'system': SystemMessage,
                'human': HumanMessage,
                'ai': AIMessage
            }[msgData.type];

            return new MessageClass(msgData.content);
        });
    }
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Conversational LLM Solution...\n');

    try {
        // Mock LlamaCppLLM for testing (since we don't have a real model)
        class MockLlamaCppLLM {
            async invoke(messages, config) {
                // Simple mock: echo back something relevant
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.content.toLowerCase().includes('name')) {
                    return new AIMessage("You said your name is Alice!");
                }
                return new AIMessage("I understand. How can I help you?");
            }
        }

        // Replace parent class for testing
        ConversationalLLM.prototype.__proto__ = MockLlamaCppLLM.prototype;

        // Test 1: Basic conversation
        console.log('Test 1: Basic conversation with memory');
        const llm = new ConversationalLLM({
            maxHistory: 10,
            systemMessage: "You are a helpful assistant."
        });

        const response1 = await llm.chat("Hi, my name is Alice");
        console.log(`   User: Hi, my name is Alice`);
        console.log(`   AI: ${response1}`);

        const response2 = await llm.chat("What's my name?");
        console.log(`   User: What's my name?`);
        console.log(`   AI: ${response2}`);

        const history = llm.getHistory();
        console.log(`   History length: ${history.length}`);
        console.assert(history.length === 5, 'Should have 5 messages');
        console.assert(history[0]._type === 'system', 'First should be system');
        console.assert(history[1]._type === 'human', 'Second should be human');
        console.assert(history[2]._type === 'ai', 'Third should be ai');
        console.log('✅ Conversation memory works\n');

        // Test 2: Sliding window
        console.log('Test 2: Sliding window (max history)');
        const limitedLLM = new ConversationalLLM({
            maxHistory: 4, // Very small for testing
            systemMessage: "You are helpful"
        });

        // Add 6 exchanges (12 messages)
        for (let i = 0; i < 6; i++) {
            await limitedLLM.chat(`Message ${i}`);
        }

        const limitedHistory = limitedLLM.getHistory();
        console.log(`   Added 6 exchanges (12 messages)`);
        console.log(`   History length: ${limitedHistory.length}`);
        console.log(`   Max history: 4 (+ 1 system) = 5 total`);

        console.assert(
            limitedHistory.length <= 5,
            'Should respect max history'
        );

        console.assert(
            limitedHistory[0]._type === 'system',
            'System message should be preserved'
        );

        // Should have most recent messages
        const lastMessage = limitedHistory[limitedHistory.length - 1];
        console.log(`   Last message type: ${lastMessage._type}`);
        console.log('✅ Sliding window works\n');

        // Test 3: Clear conversation
        console.log('Test 3: Clear conversation');
        const clearLLM = new ConversationalLLM({
            systemMessage: "You are helpful"
        });

        await clearLLM.chat("Hello");
        await clearLLM.chat("How are you?");
        console.log(`   Before clear: ${clearLLM.getHistory().length} messages`);

        clearLLM.clear();
        console.log(`   After clear: ${clearLLM.getHistory().length} messages`);

        const afterClear = clearLLM.getHistory();
        console.assert(afterClear.length === 1, 'Should have 1 message');
        console.assert(afterClear[0]._type === 'system', 'Should be system message');
        console.log('✅ Clear works\n');

        // Test 4: Get last N messages
        console.log('Test 4: Get last N messages');
        const llm4 = new ConversationalLLM({});

        await llm4.chat("Message 1");
        await llm4.chat("Message 2");
        await llm4.chat("Message 3");

        const last2 = llm4.getLastMessages(2);
        console.log(`   Total messages: ${llm4.getHistory().length}`);
        console.log(`   Last 2 messages: ${last2.length}`);
        console.assert(last2.length === 2, 'Should return last 2 messages');
        console.log(`   Types: ${last2.map(m => m._type).join(', ')}`);
        console.log('✅ Get last messages works\n');

        // Test 5: Without system message
        console.log('Test 5: Conversation without system message');
        const noSystemLLM = new ConversationalLLM({});

        await noSystemLLM.chat("Hello");
        const noSystemHistory = noSystemLLM.getHistory();

        console.log(`   History length: ${noSystemHistory.length}`);
        console.assert(noSystemHistory.length === 2, 'Should have 2 messages');
        console.assert(
            noSystemHistory[0]._type === 'human',
            'First should be human (no system)'
        );
        console.log('✅ Works without system message\n');

        // Test 6: Message count
        console.log('Test 6: Message count');
        const llm6 = new ConversationalLLM({
            systemMessage: "You are helpful"
        });

        console.log(`   Initial count: ${llm6.getMessageCount()}`);
        await llm6.chat("Hi");
        console.log(`   After 1 exchange: ${llm6.getMessageCount()}`);
        await llm6.chat("Hello");
        console.log(`   After 2 exchanges: ${llm6.getMessageCount()}`);

        console.assert(llm6.getMessageCount() === 4, 'Should count 4 non-system messages');
        console.log('✅ Message count works\n');

        // Test 7: Export/Import
        console.log('Test 7: Export and import conversation');
        const llm7 = new ConversationalLLM({
            systemMessage: "You are helpful"
        });

        await llm7.chat("Hello");
        await llm7.chat("How are you?");

        const exported = llm7.exportConversation();
        console.log(`   Exported ${exported.length} characters`);

        const llm7b = new ConversationalLLM({});
        llm7b.importConversation(exported);

        console.log(`   Original history: ${llm7.getHistory().length}`);
        console.log(`   Imported history: ${llm7b.getHistory().length}`);
        console.assert(
            llm7.getHistory().length === llm7b.getHistory().length,
            'Should have same length'
        );
        console.log('✅ Export/Import works\n');

        // Test 8: Set new system message
        console.log('Test 8: Change system message');
        const llm8 = new ConversationalLLM({
            systemMessage: "You are helpful"
        });

        await llm8.chat("Hi");
        console.log(`   History before: ${llm8.getHistory().length}`);

        llm8.setSystemMessage("You are now a pirate");
        console.log(`   History after: ${llm8.getHistory().length}`);

        const newSystem = llm8.getHistory()[0];
        console.log(`   New system message: "${newSystem.content}"`);
        console.assert(
            newSystem.content === "You are now a pirate",
            'System message should be updated'
        );
        console.log('✅ Set system message works\n');

        console.log('🎉 All tests passed!');
        console.log('\n💡 Features Demonstrated:');
        console.log('   • Automatic conversation history');
        console.log('   • Sliding window for long conversations');
        console.log('   • Clear while preserving system message');
        console.log('   • Get last N messages');
        console.log('   • Message counting');
        console.log('   • Export/import conversations');
        console.log('   • Dynamic system message updates');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { ConversationalLLM };