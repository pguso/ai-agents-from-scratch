/**
 * Exercise 1: Build a Conversational LLM
 *
 * Goal: Create an LLM wrapper that maintains conversation history automatically
 *
 * Requirements:
 * - Extend LlamaCppLLM to track conversation history
 * - Automatically append new messages to history
 * - Support clearing conversation
 * - Limit history to last N messages (sliding window)
 * - Provide method to get full conversation
 *
 * Example Usage:
 *   const llm = new ConversationalLLM({
 *     modelPath: './model.gguf',
 *     maxHistory: 10
 *   });
 *
 *   await llm.chat("Hi"); // Remembers system + this message
 *   await llm.chat("What's my name?"); // Has context from previous
 *   llm.getHistory(); // Returns all messages
 *   llm.clear(); // Resets conversation
 */

import { LlamaCppLLM } from '../../../../src/index.js';
import { HumanMessage, AIMessage, SystemMessage } from '../../../../src/core/message.js';

/**
 * TODO: Implement ConversationalLLM
 *
 * Should extend LlamaCppLLM and add:
 * - Conversation history storage
 * - Automatic history management
 * - Sliding window for long conversations
 * - Helper methods for chat
 */
class ConversationalLLM extends LlamaCppLLM {
    constructor(options = {}) {
        super(options);

        // TODO: Initialize conversation history
        // TODO: Store maxHistory limit
        // TODO: Add system message if provided
    }

    /**
     * TODO: Chat method - simpler than invoke
     * Automatically adds to history
     */
    async chat(userMessage) {
        // TODO: Add user message to history
        // TODO: Call invoke with full history
        // TODO: Add AI response to history
        // TODO: Apply sliding window if needed
        // TODO: Return AI response content
    }

    /**
     * TODO: Get conversation history
     */
    getHistory() {
        // TODO: Return copy of history
    }

    /**
     * TODO: Clear conversation (keep system message)
     */
    clear() {
        // TODO: Reset history
        // TODO: Keep system message if it exists
    }

    /**
     * TODO: Get last N messages
     */
    getLastMessages(n) {
        // TODO: Return last n messages
    }
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Conversational LLM...\n');

    try {
        // Test 1: Basic conversation
        console.log('Test 1: Basic conversation with memory');
        const llm = new ConversationalLLM({
            modelPath: './models/test-model.gguf',
            maxHistory: 10,
            systemMessage: "You are a helpful assistant. Remember user details."
        });

        // First message
        const response1 = await llm.chat("Hi, my name is Alice");
        console.log(`   User: Hi, my name is Alice`);
        console.log(`   AI: ${response1}`);

        // Second message - should remember name
        const response2 = await llm.chat("What's my name?");
        console.log(`   User: What's my name?`);
        console.log(`   AI: ${response2}`);
        console.assert(
            response2.toLowerCase().includes('alice'),
            'Should remember the name'
        );

        const history = llm.getHistory();
        console.log(`   History length: ${history.length}`);
        console.assert(history.length === 5, 'Should have 5 messages'); // system + 2 human + 2 ai
        console.log('✅ Conversation memory works\n');

        // Test 2: Sliding window
        console.log('Test 2: Sliding window (max history)');
        const limitedLLM = new ConversationalLLM({
            modelPath: './models/test-model.gguf',
            maxHistory: 5,
            systemMessage: "You are helpful"
        });

        // Add many messages
        for (let i = 0; i < 10; i++) {
            await limitedLLM.chat(`Message ${i}`);
        }

        const limitedHistory = limitedLLM.getHistory();
        console.log(`   Added 10 messages, history length: ${limitedHistory.length}`);
        console.assert(limitedHistory.length <= 6, 'Should respect max history'); // system + 5 messages

        // System message should be preserved
        console.assert(
            limitedHistory[0]._type === 'system',
            'System message should be preserved'
        );
        console.log('✅ Sliding window works\n');

        // Test 3: Clear conversation
        console.log('Test 3: Clear conversation');
        const clearLLM = new ConversationalLLM({
            modelPath: './models/test-model.gguf',
            systemMessage: "You are helpful"
        });

        await clearLLM.chat("Hello");
        await clearLLM.chat("How are you?");
        console.log(`   Before clear: ${clearLLM.getHistory().length} messages`);

        clearLLM.clear();
        console.log(`   After clear: ${clearLLM.getHistory().length} messages`);

        const afterClear = clearLLM.getHistory();
        console.assert(
            afterClear.length === 1 && afterClear[0]._type === 'system',
            'Should only have system message after clear'
        );
        console.log('✅ Clear works\n');

        // Test 4: Get last N messages
        console.log('Test 4: Get last N messages');
        const llm4 = new ConversationalLLM({
            modelPath: './models/test-model.gguf'
        });

        await llm4.chat("Message 1");
        await llm4.chat("Message 2");
        await llm4.chat("Message 3");

        const last2 = llm4.getLastMessages(2);
        console.log(`   Total messages: ${llm4.getHistory().length}`);
        console.log(`   Last 2: ${last2.length}`);
        console.assert(last2.length === 2, 'Should return last 2 messages');
        console.log('✅ Get last messages works\n');

        // Test 5: Without system message
        console.log('Test 5: Conversation without system message');
        const noSystemLLM = new ConversationalLLM({
            modelPath: './models/test-model.gguf'
        });

        await noSystemLLM.chat("Hello");
        const noSystemHistory = noSystemLLM.getHistory();

        console.log(`   History length: ${noSystemHistory.length}`);
        console.assert(
            noSystemHistory[0]._type !== 'system',
            'Should not have system message'
        );
        console.log('✅ Works without system message\n');

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

export { ConversationalLLM };