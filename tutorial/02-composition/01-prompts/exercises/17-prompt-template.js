/**
 * Exercise 17: Basic PromptTemplate
 *
 * Goal: Build a PromptTemplate that replaces {variable} placeholders
 *
 * In this exercise, you'll:
 * 1. Implement variable extraction from template strings
 * 2. Replace placeholders with actual values
 * 3. Validate that all required variables are provided
 * 4. Test with various template patterns
 *
 * This is the foundation of all prompt engineering!
 */

import {PromptTemplate} from '../../../../src/index.js';

// Test cases
async function exercise() {
    console.log('=== Exercise 1: Basic PromptTemplate ===\n');

    // Test 1: Simple translation prompt
    console.log('--- Test 1: Simple Translation ---');

    // TODO: Create a translation prompt template
    // Template: "Translate to {language}: {text}"
    const translatePrompt = null; // new PromptTemplate({ ... })

    // TODO: Format with Spanish and "Hello, world!"
    // const result1 = await translatePrompt.format({ ... })

    console.log('Input: "Hello, world!" → Spanish');
    console.log('Result:', 'TODO'); // result1
    console.log();

    // Test 2: Email template with multiple variables
    console.log('--- Test 2: Email Template ---');

    // TODO: Create an email template
    // Template: "Dear {name},\n\nThank you for {action}. Your {item} will arrive on {date}.\n\nBest,\n{sender}"
    const emailPrompt = null; // PromptTemplate.fromTemplate(...)

    // TODO: Format with appropriate values
    // const result2 = await emailPrompt.format({ ... })

    console.log('Result:', 'TODO'); // result2
    console.log();

    // Test 3: Auto-detect variables
    console.log('--- Test 3: Auto-Detect Variables ---');

    // TODO: Create a template WITHOUT specifying inputVariables
    // Let the class auto-detect them from the template string
    const autoPrompt = null; // new PromptTemplate({ template: "..." })

    console.log('Detected variables:', []); // autoPrompt.inputVariables

    // TODO: Format it
    // const result3 = await autoPrompt.format({ ... })
    console.log('Result:', 'TODO'); // result3
    console.log();

    // Test 4: Partial variables (defaults)
    console.log('--- Test 4: Partial Variables ---');

    // TODO: Create a prompt with partial variables
    // Template: "You are a {role} assistant. User: {input}"
    // Partial: { role: "helpful" } - this is pre-filled
    const partialPrompt = null; // new PromptTemplate({
    //     template: "...",
    //     partialVariables: { role: "helpful" }
    // })

    // TODO: Format - only need to provide 'input', 'role' uses default
    // const result4 = await partialPrompt.format({ input: "What's the weather?" })

    console.log('Result:', 'TODO'); // result4
    console.log();

    // Test 5: Validation error
    console.log('--- Test 5: Validation Error ---');

    // TODO: Try to format without providing all variables
    const strictPrompt = new PromptTemplate({
        template: "Hello {name}, you are {age} years old",
        inputVariables: ["name", "age"]
    });

    try {
        // TODO: This should throw an error - only provide 'name'
        // await strictPrompt.format({ name: "Alice" })
        console.log('ERROR: Should have thrown validation error!');
    } catch (error) {
        console.log('✓ Validation error caught:', error.message);
    }
    console.log();

    // Test 6: Use as Runnable (invoke)
    console.log('--- Test 6: Use as Runnable ---');

    // TODO: Create a simple prompt
    const runnablePrompt = null; // PromptTemplate.fromTemplate("...")

    // TODO: Use invoke() instead of format()
    // Since PromptTemplate extends Runnable, it has invoke()
    // const result6 = await runnablePrompt.invoke({ ... })

    console.log('Invoked result:', 'TODO'); // result6
    console.log();

    // Test 7: Complex nested replacement
    console.log('--- Test 7: Complex Template ---');

    // TODO: Create a code documentation template
    // Template with function, params, returns, description
    const docPrompt = null; // PromptTemplate.fromTemplate(`
    // Function: {function}
    // Parameters: {params}
    // Returns: {returns}
    // Description: {description}
    // `)

    // TODO: Format with actual documentation
    // const result7 = await docPrompt.format({ ... })

    console.log('Result:', 'TODO'); // result7
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
 * Result: Dear John,
 *
 * Thank you for your purchase. Your laptop will arrive on Friday.
 *
 * Best,
 * Customer Service
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
 * Result: Function: calculateSum
 * Parameters: a: number, b: number
 * Returns: number
 * Description: Adds two numbers together
 *
 * Learning Points:
 * 1. PromptTemplate replaces {variable} placeholders
 * 2. Auto-detection extracts variables from template
 * 3. Partial variables provide defaults
 * 4. Validation ensures all variables are provided
 * 5. As a Runnable, prompts work with invoke()
 * 6. Regex is key: /\{(\w+)\}/g finds all variables
 */