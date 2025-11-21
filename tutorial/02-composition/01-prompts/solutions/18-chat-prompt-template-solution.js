/**
 * Solution 18: ChatPromptTemplate
 */

import {ChatPromptTemplate} from '../../../../src/index.js';

// Test cases
async function exercise() {
    console.log('=== Exercise 18: ChatPromptTemplate ===\n');

    // Test 1: Simple chat with system and human messages
    console.log('--- Test 1: Basic Chat ---');

    const chatPrompt1 = ChatPromptTemplate.fromMessages([
        ["system", "You are a {role} assistant"],
        ["human", "{question}"]
    ]);

    const messages1 = await chatPrompt1.format({
        role: "helpful",
        question: " What's the weather?"
    })

    console.log('Messages:');
    messages1.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 2: Multi-turn conversation
    console.log('--- Test 2: Multi-Turn Conversation ---');

    const chatPrompt2 = ChatPromptTemplate.fromMessages([
        ["system", "You are a {personality} chatbot"],
        ["human", "Hi, I'm {name}"],
        ["ai", "Nice to meet you, {name}!"],
        ["human", "Can you help me with {topic}?"]
    ]);

    console.log('Detected variables:', chatPrompt2.inputVariables);

    const messages2 = await chatPrompt2.format({
        personality: "friendly",
        name: "Alice",
        topic: "JavaScript"
    });

    console.log('\nConversation:');
    messages2.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 3: Translation bot template
    console.log('--- Test 3: Translation Bot ---');

    const translateChat = ChatPromptTemplate.fromMessages([
        ["system", "You are a translator. Translate from {source_lang} to {target_lang}."],
        ["human", "Translate: {text}"]
    ]);

    const messages3 = await translateChat.format({
        source_lang: "English",
        target_lang: "Spanish",
        text: "Hello, world!"
    });

    console.log('Translation request:');
    messages3.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 4: Customer service template
    console.log('--- Test 4: Customer Service ---');

    const serviceChat = ChatPromptTemplate.fromMessages([
        ["system", "You are a {company} customer service agent. Be {tone}."],
        ["human", "Order #{order_id}: {issue}"]
    ]);

    const messages4 = await serviceChat.format({
        company: "TechCorp",
        tone: "professional and empathetic",
        order_id: "12345",
        issue: "My item hasn't arrived"
    });

    console.log('Service interaction:');
    messages4.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 5: Use as Runnable
    console.log('--- Test 5: Use as Runnable ---');

    const runnableChat = ChatPromptTemplate.fromMessages([
        ["system", "You are a {role}"],
        ["human", "{query}"]
    ]);

    const messages5 = await runnableChat.invoke({
        role: "math tutor",
        query: "Explain calculus"
    });

    console.log('Invoked messages:');
    messages5.forEach(msg => console.log(`  ${msg}`))
    console.log();

    // Test 6: Validation
    console.log('--- Test 6: Validation ---');

    const strictChat = ChatPromptTemplate.fromMessages([
        ["system", "You need {var1} and {var2}"],
        ["human", "Using {var3}"]
    ]);

    console.log('Required variables:', strictChat.inputVariables);

    try {
        await strictChat.format({ var1: "one" })
        console.log('ERROR: Should have thrown!');
    } catch (error) {
        console.log('✓ Validation error:', error.message);
    }
    console.log();

    // Test 7: Code review chat
    console.log('--- Test 7: Code Review Chat ---');

    const reviewChat = ChatPromptTemplate.fromMessages([
        ["system", "You are a {language} code reviewer. Focus on {focus}."],
        ["human", "Review this code:\n{code}"],
        ["ai", "I'll review your {language} code for {focus}."]
    ]);

    const messages7 = await reviewChat.format({
        language: "Python",
        focus: "performance",
        code: "def slow_sum(n): return sum([i for i in range(n)])"
    });

    console.log('Code review chat:');
    messages7.forEach(msg => console.log(`  ${msg}`))
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
 *   [1:27:22 PM] system: You are a helpful assistant
 *   [1:27:22 PM] human:  What's the weather?
 *
 * --- Test 2: Multi-Turn Conversation ---
 * Detected variables: [ 'personality', 'name', 'topic' ]
 *
 * Conversation:
 *   [1:31:36 PM] system: You are a friendly chatbot
 *   [1:31:36 PM] human: Hi, I'm Alice
 *   [1:31:36 PM] ai: Nice to meet you, Alice!
 *   [1:31:36 PM] human: Can you help me with JavaScript?
 *
 * --- Test 3: Translation Bot ---
 * Translation request:
 *   [1:31:36 PM] system: You are a translator. Translate from English to Spanish.
 *   [1:31:36 PM] human: Translate: Hello, world!
 *
 * --- Test 4: Customer Service ---
 * Service interaction:
 *   [1:31:36 PM] system: You are a TechCorp customer service agent. Be professional and empathetic.
 *   [1:31:36 PM] human: Order #12345: My item hasn't arrived
 *
 * --- Test 5: Use as Runnable ---
 * Invoked messages:
 *   [1:31:36 PM] system: You are a math tutor
 *   [1:31:36 PM] human: Explain calculus
 *
 * --- Test 6: Validation ---
 * Required variables: ['var1', 'var2', 'var3']
 * ✓ Validation error: Missing required input variables: var2, var3
 *
 * --- Test 7: Code Review Chat ---
 * Code review chat:
 *   [1:31:36 PM] system: You are a Python code reviewer. Focus on performance.
 *   [1:31:36 PM] human: Review this code:
 * def slow_sum(n): return sum([i for i in range(n)])
 *   [1:31:36 PM] ai: I'll review your Python code for performance.
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