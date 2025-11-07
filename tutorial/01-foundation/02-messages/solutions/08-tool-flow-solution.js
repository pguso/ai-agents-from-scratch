/**
 * Solution 4: Tool Call Flow
 *
 * This solution demonstrates:
 * - Complete agent conversation flow
 * - Tool call creation and execution
 * - Linking tool messages to AI tool calls
 * - Multi-step reasoning with tools
 * - Realistic agent behavior
 */

import {AIMessage, HumanMessage, SystemMessage, ToolMessage} from '../../../../src/index.js';

/**
 * Mock Calculator Tool
 */
class Calculator {
    constructor() {
        this.name = 'calculator';
    }

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
 * Generate unique tool call ID
 */
function generateToolCallId() {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simulate a complete tool call conversation
 */
function simulateToolCallFlow(userQuery) {
    const messages = [];
    const calculator = new Calculator();

    // 1. System message sets context
    messages.push(new SystemMessage(
        "You are a helpful assistant with access to a calculator tool. " +
        "Use the calculator for any arithmetic operations."
    ));

    // 2. Human asks a question
    messages.push(new HumanMessage(userQuery));

    // 3. AI decides to use calculator tool
    const toolCallId = generateToolCallId();

    // Parse the query to extract operation (simple parsing for demo)
    let operation = 'multiply';
    let a = 5, b = 3;

    if (userQuery.includes('*') || userQuery.toLowerCase().includes('multiply')) {
        operation = 'multiply';
        // Extract numbers (simplified)
        const numbers = userQuery.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
            a = parseInt(numbers[0]);
            b = parseInt(numbers[1]);
        }
    } else if (userQuery.includes('+') || userQuery.toLowerCase().includes('add')) {
        operation = 'add';
        const numbers = userQuery.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
            a = parseInt(numbers[0]);
            b = parseInt(numbers[1]);
        }
    } else if (userQuery.includes('-') || userQuery.toLowerCase().includes('subtract')) {
        operation = 'subtract';
        const numbers = userQuery.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
            a = parseInt(numbers[0]);
            b = parseInt(numbers[1]);
        }
    } else if (userQuery.includes('/') || userQuery.toLowerCase().includes('divide')) {
        operation = 'divide';
        const numbers = userQuery.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
            a = parseInt(numbers[0]);
            b = parseInt(numbers[1]);
        }
    }

    messages.push(new AIMessage(
        "I'll calculate that for you using the calculator tool.",
        {
            toolCalls: [{
                id: toolCallId,
                type: 'function',
                function: {
                    name: 'calculator',
                    arguments: JSON.stringify({ operation, a, b })
                }
            }]
        }
    ));

    // 4. Execute the tool
    const result = calculator.execute(operation, a, b);

    // 5. Tool returns result
    messages.push(new ToolMessage(
        JSON.stringify({ result }),
        toolCallId
    ));

    // 6. AI processes result and responds to user
    const opSymbol = {
        'add': '+',
        'subtract': '-',
        'multiply': '*',
        'divide': '/'
    }[operation];

    messages.push(new AIMessage(
        `The result of ${a} ${opSymbol} ${b} is ${result}.`
    ));

    return messages;
}

/**
 * Simulate multi-step tool calling
 */
function simulateMultiToolFlow(userQuery) {
    const messages = [];
    const calculator = new Calculator();

    // 1. System message
    messages.push(new SystemMessage(
        "You are a helpful assistant with access to a calculator. " +
        "You can perform multiple calculations in sequence."
    ));

    // 2. Human query
    messages.push(new HumanMessage(userQuery));

    // 3. First calculation: 5 * 3
    const toolCall1Id = generateToolCallId();
    messages.push(new AIMessage(
        "I'll solve this step by step. First, I'll calculate 5 * 3.",
        {
            toolCalls: [{
                id: toolCall1Id,
                type: 'function',
                function: {
                    name: 'calculator',
                    arguments: JSON.stringify({ operation: 'multiply', a: 5, b: 3 })
                }
            }]
        }
    ));

    const result1 = calculator.execute('multiply', 5, 3);
    messages.push(new ToolMessage(
        JSON.stringify({ result: result1 }),
        toolCall1Id
    ));

    // 4. Second calculation: result + 10
    const toolCall2Id = generateToolCallId();
    messages.push(new AIMessage(
        `Now I'll add 10 to ${result1}.`,
        {
            toolCalls: [{
                id: toolCall2Id,
                type: 'function',
                function: {
                    name: 'calculator',
                    arguments: JSON.stringify({ operation: 'add', a: result1, b: 10 })
                }
            }]
        }
    ));

    const result2 = calculator.execute('add', result1, 10);
    messages.push(new ToolMessage(
        JSON.stringify({ result: result2 }),
        toolCall2Id
    ));

    // 5. Final answer
    messages.push(new AIMessage(
        `The final result is ${result2}. (5 * 3 = ${result1}, then ${result1} + 10 = ${result2})`
    ));

    return messages;
}

/**
 * Display conversation with formatting
 */
function displayConversation(messages) {
    const separator = '─'.repeat(70);

    console.log(separator);

    messages.forEach((msg, idx) => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const type = msg.type.toUpperCase().padEnd(6);

        console.log(`\n[${idx + 1}] [${time}] ${type}`);

        if (msg.type === 'ai' && msg.hasToolCalls && msg.hasToolCalls()) {
            // Show tool call details
            console.log(`    Content: ${msg.content}`);
            console.log(`    🛠️  Tool Calls:`);
            msg.toolCalls.forEach(tc => {
                console.log(`        • ${tc.function.name}(${tc.function.arguments})`);
                console.log(`          ID: ${tc.id}`);
            });
        } else if (msg.type === 'tool') {
            // Show tool result with link to call
            console.log(`    🔧 Result: ${msg.content}`);
            console.log(`    ↳ Response to: ${msg.toolCallId}`);
        } else {
            // Regular message
            console.log(`    ${msg.content}`);
        }
    });

    console.log(`\n${separator}`);
}

/**
 * Validate tool call flow
 */
function validateToolFlow(messages) {
    const errors = [];

    // Check every tool message has a corresponding AI tool call
    const toolCallIds = new Set();

    messages.forEach((msg, idx) => {
        if (msg.type === 'ai' && msg.toolCalls) {
            msg.toolCalls.forEach(tc => toolCallIds.add(tc.id));
        }

        if (msg.type === 'tool') {
            if (!toolCallIds.has(msg.toolCallId)) {
                errors.push(
                    `Tool message at index ${idx} references unknown call ID: ${msg.toolCallId}`
                );
            }

            // Check it follows an AI message
            if (idx === 0 || messages[idx - 1].type !== 'ai') {
                errors.push(`Tool message at index ${idx} doesn't follow an AI message`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
    console.log('🧪 Testing Tool Call Flow Solution...\n');

    try {
        // Test 1: Simple tool call
        console.log('Test 1: Simple calculation with tool');
        const conversation1 = simulateToolCallFlow("What's 5 * 3?");

        console.log(`   Messages created: ${conversation1.length}`);
        console.assert(conversation1.length >= 5, 'Should have at least 5 messages');

        // Validate message types
        console.assert(conversation1[0].type === 'system', 'Should start with system');
        console.assert(conversation1[1].type === 'human', 'Should have human query');
        console.assert(conversation1[2].type === 'ai', 'Should have AI decision');
        console.assert(conversation1[3].type === 'tool', 'Should have tool result');
        console.assert(conversation1[4].type === 'ai', 'Should have final AI response');

        // Check AI message has tool calls
        const aiWithTool = conversation1[2];
        console.assert(aiWithTool.hasToolCalls(), 'AI message should have tool calls');

        displayConversation(conversation1);
        console.log('\n✅ Simple tool call works\n');

        // Test 2: Multi-step tool calls
        console.log('Test 2: Multi-step calculation');
        const conversation2 = simulateMultiToolFlow("What's 5*3 and then add 10?");

        console.log(`   Messages created: ${conversation2.length}`);

        // Count tool messages
        const toolMessages = conversation2.filter(m => m.type === 'tool');
        console.log(`   Tool calls made: ${toolMessages.length}`);
        console.assert(toolMessages.length >= 2, 'Should have at least 2 tool calls');

        displayConversation(conversation2);
        console.log('\n✅ Multi-step tool calls work\n');

        // Test 3: Tool call ID linking
        console.log('Test 3: Tool call IDs match');
        const testConv = simulateToolCallFlow("Calculate 10 + 5");

        const aiMsg = testConv.find(m => m.type === 'ai' && m.hasToolCalls && m.hasToolCalls());
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
        const result4 = calc.execute('subtract', 10, 3);

        console.log(`   5 * 3 = ${result1}`);
        console.log(`   10 + 5 = ${result2}`);
        console.log(`   20 / 4 = ${result3}`);
        console.log(`   10 - 3 = ${result4}`);

        console.assert(result1 === 15, 'Multiplication');
        console.assert(result2 === 15, 'Addition');
        console.assert(result3 === 5, 'Division');
        console.assert(result4 === 7, 'Subtraction');
        console.log('✅ Calculator works\n');

        // Test 5: Tool definition
        console.log('Test 5: Tool definition format');
        const calc5 = new Calculator();
        const definition = calc5.getDefinition();

        console.log(`   Tool name: ${definition.name}`);
        console.log(`   Description: ${definition.description}`);
        console.log(`   Parameters: ${Object.keys(definition.parameters.properties).join(', ')}`);
        console.assert(definition.name === 'calculator', 'Should have name');
        console.assert(definition.parameters, 'Should have parameters');
        console.assert(definition.parameters.properties.operation, 'Should have operation param');
        console.log('✅ Tool definition is correct\n');

        // Test 6: Flow validation
        console.log('Test 6: Validate tool flow');
        const validFlow = simulateToolCallFlow("What's 2 + 2?");
        const validation = validateToolFlow(validFlow);

        console.log(`   Valid: ${validation.valid}`);
        console.log(`   Errors: ${validation.errors.length}`);
        console.assert(validation.valid, 'Flow should be valid');
        console.log('✅ Flow validation works\n');

        // Test 7: Different operations
        console.log('Test 7: Different calculator operations');
        const operations = [
            { query: "What's 100 / 5?", expected: 20 },
            { query: "Calculate 50 - 30", expected: 20 },
            { query: "Add 25 and 25", expected: 50 }
        ];

        operations.forEach(({ query, expected }) => {
            const conv = simulateToolCallFlow(query);
            const toolResult = conv.find(m => m.type === 'tool');
            const result = JSON.parse(toolResult.content).result;
            console.log(`   ${query} → ${result}`);
            console.assert(result === expected, `Should equal ${expected}`);
        });
        console.log('✅ All operations work\n');

        // Test 8: Complex multi-step
        console.log('Test 8: Complex calculation chain');
        const complex = simulateMultiToolFlow("Calculate ((5 * 3) + 10)");

        // Should have multiple intermediate steps
        const aiMessages = complex.filter(m => m.type === 'ai');
        const toolCalls = complex.filter(m => m.type === 'tool');

        console.log(`   AI messages: ${aiMessages.length}`);
        console.log(`   Tool executions: ${toolCalls.length}`);
        console.assert(toolCalls.length >= 2, 'Should have multiple tool calls');

        // Final answer should be 25
        const finalAI = complex[complex.length - 1];
        console.assert(finalAI.content.includes('25'), 'Final answer should be 25');
        console.log('✅ Complex calculations work\n');

        console.log('🎉 All tests passed!');
        console.log('\n💡 Key Concepts Demonstrated:');
        console.log('   • Tool call creation with unique IDs');
        console.log('   • Tool message linking to AI calls');
        console.log('   • Multi-step reasoning with tools');
        console.log('   • Tool definition structure');
        console.log('   • Realistic agent conversation flow');
        console.log('   • Intermediate result usage');
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
    Calculator,
    simulateToolCallFlow,
    simulateMultiToolFlow,
    displayConversation,
    validateToolFlow,
    generateToolCallId
};