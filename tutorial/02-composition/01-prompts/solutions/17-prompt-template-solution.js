/**
 * Solution 17: Basic PromptTemplate
 *
 * Goal: Build a PromptTemplate that replaces {variable} placeholders
 */

import {PromptTemplate} from '../../../../src/index.js';


// Test cases
async function exercise() {
    console.log('=== Exercise 17: Basic PromptTemplate ===\n');

    // Test 1: Simple translation prompt
    console.log('--- Test 1: Simple Translation ---');

    const translatePrompt = new PromptTemplate({
        template: "Translate to {language}: {text}",
    });
    const result1 = await translatePrompt.format({
        language: "Spanish",
        text: "Hello, world!"
    })

    console.log('Input: "Hello, world!" → Spanish');
    console.log('Result:', result1); // result1
    console.log();

    // Test 2: Email template with multiple variables
    console.log('--- Test 2: Email Template ---');

    const emailPrompt = new PromptTemplate({
        template: `Dear {name},\n\nThank you for {action}. Your {item} will arrive on {date}.\n\nBest,\n{sender}`
    });

    const result2 = await emailPrompt.format({
        name: "Patric Gutersohn",
        action: "your order",
        item: "Mac Studio M3 Ultra",
        date: "24.12.2026",
        sender: "Apple Inc."
    })

    console.log('Result:', result2);
    console.log();

    // Test 3: Auto-detect variables
    console.log('--- Test 3: Auto-Detect Variables ---');

    const autoPrompt = new PromptTemplate({
        template: "In {city}, I love to visit {activity}"
    });

    console.log('Detected variables:', autoPrompt.inputVariables);

    const result3 = await autoPrompt.format({
        city: "Paris",
        activity: "museums"
    })
    console.log('Result:', result3);
    console.log();

    // Test 4: Partial variables (defaults)
    console.log('--- Test 4: Partial Variables ---');

    const partialPrompt = new PromptTemplate({
        template: "You are a {role} assistant. User: {input}",
        partialVariables: { role: "helpful" }
    });

    const result4 = await partialPrompt.format({ input: "What's the weather?" })

    console.log('Result:', result4);
    console.log();

    // Test 5: Validation error
    console.log('--- Test 5: Validation Error ---');

    const strictPrompt = new PromptTemplate({
        template: "Hello {name}, you are {age} years old",
        inputVariables: ["name", "age"]
    });

    try {
        await strictPrompt.format({ name: "Alice" })
        console.log('ERROR: Should have thrown validation error!');
    } catch (error) {
        console.log('✓ Validation error caught:', error.message);
    }
    console.log();

    // Test 6: Use as Runnable (invoke)
    console.log('--- Test 6: Use as Runnable ---');

    const runnablePrompt = PromptTemplate.fromTemplate("Search for {topic}")

    const result6 = await runnablePrompt.invoke({
        topic: "artificial intelligence"
    })

    console.log('Invoked result:', result6);
    console.log();

    // Test 7: Complex nested replacement
    console.log('--- Test 7: Complex Template ---');

    const docPrompt = PromptTemplate.fromTemplate(`
    Function: {function}
    Parameters: {params}
    Returns: {returns}
    Description: {description}
    `);

    const result7 = await docPrompt.format({
        function: "calculateSum",
        params: "a: number, b: number",
        returns: "number",
        description: "Adds two numbers together"
    })

    console.log('Result:', result7); // result7
    console.log();

    console.log('✓ Exercise 1 complete!');
}

// Run the exercise
exercise().catch(console.error);

/**
 * Expected Output:
 *
 * --- Test 1: Simple Translation ---
 * Input: "Hello, world!" → Spanish
 * Result: Translate to Spanish: Hello, world!
 *
 * --- Test 2: Email Template ---
 * Result: Dear Patric Gutersohn,
 *
 * Thank you for your order. Your Mac Studio M3 Ultra will arrive on 24.12.2026.
 *
 * Best,
 * Apple Inc.
 *
 * --- Test 3: Auto-Detect Variables ---
 * Detected variables: ['city', 'activity']
 * Result: In Paris, I love to visit museums
 *
 * --- Test 4: Partial Variables ---
 * Result: You are a helpful assistant. User: What's the weather?
 *
 * --- Test 5: Validation Error ---
 * ✓ Validation error caught: Missing required input variables: age
 *
 * --- Test 6: Use as Runnable ---
 * Invoked result: Search for artificial intelligence
 *
 * --- Test 7: Complex Template ---
 * Result:
 *      Function: calculateSum
 *      Parameters: a: number, b: number
 *      Returns: number
 *      Description: Adds two numbers together
 *
 * Learning Points:
 * 1. PromptTemplate replaces {variable} placeholders
 * 2. Auto-detection extracts variables from template
 * 3. Partial variables provide defaults
 * 4. Validation ensures all variables are provided
 * 5. As a Runnable, prompts work with invoke()
 * 6. Regex is key: /\{(\w+)\}/g finds all variables
 */