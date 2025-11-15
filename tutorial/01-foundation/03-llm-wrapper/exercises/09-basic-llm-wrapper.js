/**
 * Exercise 9: Basic LLM Setup
 *
 * Goal: Get comfortable with basic LlamaCppLLM usage
 *
 * In this exercise, you'll:
 * 1. Create a LlamaCppLLM instance
 * 2. Invoke it with a simple string
 * 3. Invoke it with message objects
 * 4. Try different temperatures
 *
 * This is the same as your fundamentals, just wrapped!
 */

import {HumanMessage, SystemMessage, LlamaCppLLM} from '../../../../src/index.js';
import {QwenChatWrapper} from "node-llama-cpp";

async function exercise1() {
    console.log('=== Exercise 1: Basic LLM Setup ===\n');

    // TODO: Create a LlamaCppLLM instance
    // Use a model path that exists on your system
    // Set temperature to 0.7 and maxTokens to 100
    // Add a QwenChatWrapper with thoughts: 'discourage'
    // Set verbose to true to see model loading
    const llm = null; // Replace with your code

    try {
        // Part 1: Simple string invocation
        console.log('Part 1: Simple string input');
        // TODO: Invoke the LLM with: "What is 2+2? Answer in one sentence"
        const response1 = null; // Replace with your code
        console.log('Response:', response1.content);
        console.log();

        // Part 2: Using message objects
        console.log('Part 2: Using message objects');
        // TODO: Create an array with:
        // - A SystemMessage: "You are a patient math tutor teaching a 10-year-old. Always explain the reasoning step-by-step in simple terms."
        // - A HumanMessage: "What is 5*5? Answer in one sentence."
        const messages = []; // Replace with your code

        // TODO: Invoke the LLM with the messages array
        const response2 = null; // Replace with your code
        console.log('Response:', response2.content);
        console.log();

        // Part 3: Temperature experimentation
        console.log('Part 3: Temperature differences');
        console.log('Temperature controls randomness: 0.0 = deterministic, 1.0 = creative\n');
        const question = "Give me one adjective to describe winter:";

        // TODO: Invoke with low temperature (0.1) using runtime config
        // Remember to clear chat history first: llm._chatSession.setChatHistory([]);
        console.log('Low temperature (0.1):');
        const lowTemp = null; // Replace with your code
        // Should always return the same word: "cold"
        console.log(lowTemp.content);

        // TODO: Invoke with high temperature (0.9) using runtime config
        // Remember to clear chat history first: llm._chatSession.setChatHistory([]);
        console.log('\nHigh temperature (0.9):');
        const highTemp = null; // Replace with your code
        // Different each time: "frosty", "snowy", "chilly", "icy", "freezing"
        console.log(highTemp.content);

    } finally {
        // TODO: Always dispose of the LLM when done
        // Add your cleanup code here
        console.log('\n✓ Resources cleaned up');
    }

    console.log('\n✓ Exercise 1 complete!');
}

// Run the exercise
exercise1().catch(console.error);

/**
 * Learning Points:
 * 1. LlamaCppLLM accepts both strings and message arrays
 * 2. QwenChatWrapper with thoughts: 'discourage' prevents thinking tokens
 * 3. Temperature affects creativity (low=focused, high=creative)
 * 4. Clear chat history between temperature tests to avoid contamination
 * 5. Runtime config overrides instance defaults
 * 6. Always dispose() when done to free resources
 */