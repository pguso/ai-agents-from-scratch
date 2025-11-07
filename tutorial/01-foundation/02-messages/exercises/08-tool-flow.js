/**
 * Exercise 4: Simulate a Complete Tool Call Flow
 *
 * Goal: Build a complete agent conversation with tool calls
 *
 * Requirements:
 * - Simulate a realistic agent conversation
 * - Include system message, user query, AI tool decision
 * - Execute a mock tool and return results
 * - AI processes results and responds
 * - Handle multiple tool calls in sequence
 *
 * Example Flow:
 *   1. System: "You are helpful"
 *   2. Human: "What's 5*3?"
 *   3. AI: [Decides to use calculator tool]
 *   4. Tool: [Returns 15]
 *   5. AI: "5*3 = 15"
 */

import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '../../../../src/index.js';

/**
 * Mock Calculator Tool
 * Simulates a real tool that an agent would call
 */
class Calculator {
    constructor() {
        this.name = 'calculator';
    }

    /**
     * Execute a calculation
     */
    execute(operation, a, b) {
        const ops = {
            'add': (x, y) => x + y,
            'subtract': (x, y) => x - y,
            'multiply': (x, y) => x * y,
            'divide': (x, y) => x / y
        };

        if (!ops[operation]) {
            throw new Error(`Unknown operation: ${operation}`);
        }

        return ops[operation](a, b);
    }

    /**
     * Get tool definition for LLM
     */
    getDefinition() {
        return {
            name: 'calculator',
            description: 'Performs basic arithmetic operations',
            parameters: {
                type: 'object',
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['add', 'subtract', 'multiply', 'divide'],
                        description: 'The operation to perform'
                    },
                    a: { type: 'number', description: 'First number' },
                    b: { type: 'number', description: 'Second number' }
                },
                required: ['operation', 'a', 'b']
            }
        };
    }
}

/**
 * TODO: Implement simulateToolCallFlow
 *
 * Simulates a complete tool call conversation:
 * 1. System sets context
 * 2. Human asks a question
 * 3. AI decides to use a tool
 * 4. Tool executes and returns result
 * 5. AI incorporates result and responds
 *
 * @param {string} userQuery - The user's question
 * @returns {Array<BaseMessage>} Complete conversation
 */
function simulateToolCallFlow(userQuery) {
    const messages = [];

    // TODO: Add system message
    // TODO: Add human message with query
    // TODO: Create AI message with tool call
    // TODO: Execute the tool (mock)
    // TODO: Add tool message with result
    // TODO: Add final AI message with answer

    return messages;
}

/**
 * TODO: Implement simulateMultiToolFlow
 *
 * Simulates a conversation requiring multiple tool calls
 *
 * Example: "What's 5*3 and then add 10 to the result?"
 * - First tool call: multiply 5*3 = 15
 * - Second tool call: add 15+10 = 25
 * - Final answer: "The result is 25"
 */
function simulateMultiToolFlow(userQuery) {
    const messages = [];

    // TODO: Implement multi-step tool calling
    // TODO: First calculation
    // TODO: Use result in second calculation
    // TODO: Final answer

    return messages;
}

/**
 * TODO: Implement displayConversation
 *
 * Pretty-print a conversation with tool calls highlighted
 */
function displayConversation(messages) {
    // TODO: Format each message
    // TODO: Highlight tool calls specially
    // TODO: Show tool call/result connections
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Tool Call Flow...\n');

    try {
        // Test 1: Simple tool call
        console.log('Test 1: Simple calculation with tool');
        const conversation1 = simulateToolCallFlow("What's 5 * 3?");

        console.log(`   Messages created: ${conversation1.length}`);
        console.assert(conversation1.length >= 5, 'Should have at least 5 messages');

        // Check message types in order
        console.assert(conversation1[0].type === 'system', 'Should start with system');
        console.assert(conversation1[1].type === 'human', 'Should have human query');
        console.assert(conversation1[2].type === 'ai', 'Should have AI decision');
        console.assert(conversation1[3].type === 'tool', 'Should have tool result');
        console.assert(conversation1[4].type === 'ai', 'Should have final AI response');

        // Check AI message has tool calls
        const aiWithTool = conversation1[2];
        console.assert(aiWithTool.hasToolCalls(), 'AI message should have tool calls');

        console.log('\n   Conversation:');
        displayConversation(conversation1);
        console.log('\n✅ Simple tool call works\n');

        // Test 2: Multi-step tool calls
        console.log('Test 2: Multi-step calculation');
        const conversation2 = simulateMultiToolFlow("What's 5*3 and then add 10?");

        console.log(`   Messages created: ${conversation2.length}`);

        // Should have multiple tool calls
        const toolMessages = conversation2.filter(m => m.type === 'tool');
        console.log(`   Tool calls made: ${toolMessages.length}`);
        console.assert(toolMessages.length >= 2, 'Should have at least 2 tool calls');

        console.log('\n   Conversation:');
        displayConversation(conversation2);
        console.log('\n✅ Multi-step tool calls work\n');

        // Test 3: Tool call ID linking
        console.log('Test 3: Tool call IDs match');
        const testConv = simulateToolCallFlow("Calculate 10 + 5");

        // Find AI message with tool call
        const aiMsg = testConv.find(m => m.type === 'ai' && m.hasToolCalls());
        const toolMsg = testConv.find(m => m.type === 'tool');

        console.assert(aiMsg, 'Should have AI message with tool call');
        console.assert(toolMsg, 'Should have tool message');

        const toolCallId = aiMsg.toolCalls[0].id;
        console.log(`   Tool call ID: ${toolCallId}`);
        console.log(`   Tool message references: ${toolMsg.toolCallId}`);
        console.assert(toolCallId === toolMsg.toolCallId, 'IDs should match');
        console.log('✅ Tool call IDs link correctly\n');

        // Test 4: Calculator tool
        console.log('Test 4: Calculator tool execution');
        const calc = new Calculator();

        const result1 = calc.execute('multiply', 5, 3);
        const result2 = calc.execute('add', 10, 5);
        const result3 = calc.execute('divide', 20, 4);

        console.log(`   5 * 3 = ${result1}`);
        console.log(`   10 + 5 = ${result2}`);
        console.log(`   20 / 4 = ${result3}`);

        console.assert(result1 === 15, 'Multiplication should work');
        console.assert(result2 === 15, 'Addition should work');
        console.assert(result3 === 5, 'Division should work');
        console.log('✅ Calculator works\n');

        // Test 5: Tool definition
        console.log('Test 5: Tool definition format');
        const calc5 = new Calculator();
        const definition = calc5.getDefinition();

        console.log(`   Tool name: ${definition.name}`);
        console.log(`   Parameters: ${Object.keys(definition.parameters.properties).join(', ')}`);
        console.assert(definition.name === 'calculator', 'Should have name');
        console.assert(definition.parameters, 'Should have parameters');
        console.log('✅ Tool definition is correct\n');

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

export { Calculator, simulateToolCallFlow, simulateMultiToolFlow, displayConversation };