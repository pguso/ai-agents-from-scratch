/**
 * Exercise 18: ChatPromptTemplate
 *
 * Goal: Build structured chat conversations with role-based messages
 *
 * In this exercise, you'll:
 * 1. Support multiple message roles in one template
 * 2. Extract variables from all messages
 * 3. Create reusable chat patterns
 *
 * This is how modern LLM chat interfaces work!
 */

import {ChatPromptTemplate} from '../../../../src/index.js';

// Test cases
async function exercise() {
    console.log('=== Exercise 2: ChatPromptTemplate ===\n');

    // Test 1: Simple chat with system and human messages
    console.log('--- Test 1: Basic Chat ---');

    // TODO: Create a chat prompt with system and human messages
    // System: "You are a {role} assistant"
    // Human: "{question}"
    const chatPrompt1 = null; // ChatPromptTemplate.fromMessages([...])

    // TODO: Format with values
    // const messages1 = await chatPrompt1.format({ ... })

    // TODO: Print each message
    console.log('Messages:');
    // messages1.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 2: Multi-turn conversation
    console.log('--- Test 2: Multi-Turn Conversation ---');

    // TODO: Create a conversation with system, human, ai, and human
    // System: "You are a {personality} chatbot"
    // Human: "Hi, I'm {name}"
    // AI: "Nice to meet you, {name}!"
    // Human: "Can you help me with {topic}?"
    const chatPrompt2 = null; // ChatPromptTemplate.fromMessages([...])

    console.log('Detected variables:', []); // chatPrompt2.inputVariables

    // TODO: Format with values
    // const messages2 = await chatPrompt2.format({ ... })

    console.log('\nConversation:');
    // messages2.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 3: Translation bot template
    console.log('--- Test 3: Translation Bot ---');

    // TODO: Create a specialized translation chat
    // System: "You are a translator. Translate from {source_lang} to {target_lang}."
    // Human: "Translate: {text}"
    const translateChat = null; // ChatPromptTemplate.fromMessages([...])

    // TODO: Format with translation request
    // const messages3 = await translateChat.format({ ... })

    console.log('Translation request:');
    // messages3.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 4: Customer service template
    console.log('--- Test 4: Customer Service ---');

    // TODO: Create customer service chat template
    // System: "You are a {company} customer service agent. Be {tone}."
    // Human: "Order #{order_id}: {issue}"
    const serviceChat = null; // ChatPromptTemplate.fromMessages([...])

    // TODO: Format with customer issue
    // const messages4 = await serviceChat.format({ ... })

    console.log('Service interaction:');
    // messages4.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 5: Use as Runnable
    console.log('--- Test 5: Use as Runnable ---');

    // TODO: Create a simple chat prompt
    const runnableChat = null; // ChatPromptTemplate.fromMessages([...])

    // TODO: Use invoke() instead of format()
    // const messages5 = await runnableChat.invoke({ ... })

    console.log('Invoked messages:');
    // messages5.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 6: Validation
    console.log('--- Test 6: Validation ---');

    const strictChat = ChatPromptTemplate.fromMessages([
        ["system", "You need {var1} and {var2}"],
        ["human", "Using {var3}"]
    ]);

    console.log('Required variables:', []); // strictChat.inputVariables

    try {
        // TODO: Try to format without all variables
        // await strictChat.format({ var1: "one" })
        console.log('ERROR: Should have thrown!');
    } catch (error) {
        console.log('✓ Validation error:', error.message);
    }
    console.log();

    // Test 7: Code review chat
    console.log('--- Test 7: Code Review Chat ---');

    // TODO: Create a code review chat template
    // System: "You are a {language} code reviewer. Focus on {focus}."
    // Human: "Review this code:\n{code}"
    // AI: "I'll review your {language} code for {focus}."
    const reviewChat = null; // ChatPromptTemplate.fromMessages([...])

    // TODO: Format with code review request
    // const messages7 = await reviewChat.format({ ... })

    console.log('Code review chat:');
    // messages7.forEach(msg => console.log(`  ${msg}`))
    console.log();

    console.log('✓ Exercise 2 complete!');
}

// Run the exercise
exercise().catch(console.error);

/**
 * Expected Output:
 *
 * --- Test 1: Basic Chat ---
 * Messages:
 *   [system]: You are a helpful assistant
 *   [human]: What's the weather?
 *
 * --- Test 2: Multi-Turn Conversation ---
 * Detected variables: ['personality', 'name', 'topic']
 *
 * Conversation:
 *   [system]: You are a friendly chatbot
 *   [human]: Hi, I'm Alice
 *   [ai]: Nice to meet you, Alice!
 *   [human]: Can you help me with JavaScript?
 *
 * --- Test 3: Translation Bot ---
 * Translation request:
 *   [system]: You are a translator. Translate from English to Spanish.
 *   [human]: Translate: Hello, world!
 *
 * --- Test 4: Customer Service ---
 * Service interaction:
 *   [system]: You are a TechCorp customer service agent. Be professional and empathetic.
 *   [human]: Order #12345: My item hasn't arrived
 *
 * --- Test 5: Use as Runnable ---
 * Invoked messages:
 *   [system]: You are a math tutor
 *   [human]: Explain calculus
 *
 * --- Test 6: Validation ---
 * Required variables: ['var1', 'var2', 'var3']
 * ✓ Validation error: Missing required input variables: var2, var3
 *
 * --- Test 7: Code Review Chat ---
 * Code review chat:
 *   [system]: You are a Python code reviewer. Focus on performance.
 *   [human]: Review this code:
 * def slow_sum(n): return sum([i for i in range(n)])
 *   [ai]: I'll review your Python code for performance.
 *
 * Learning Points:
 * 1. ChatPromptTemplate creates structured conversations
 * 2. Each message has a role: system, human, ai
 * 3. Variables can span multiple messages
 * 4. Auto-extraction finds all variables across messages
 * 5. Message classes provide type safety
 * 6. Perfect for building chat interfaces
 * 7. Reusable patterns for different domains
 */