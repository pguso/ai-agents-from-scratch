/**
 * Exercise 9 Solution: Basic LLM Setup
 */

import {HumanMessage, SystemMessage, LlamaCppLLM} from '../../../../src/index.js';
import {QwenChatWrapper} from "node-llama-cpp";

async function exercise1() {
    console.log('=== Exercise 1: Basic LLM Setup ===\n');

    // Solution: Create a LlamaCppLLM instance
    const llm = new LlamaCppLLM({
        modelPath: './models/Qwen3-1.7B-Q6_K.gguf', // Adjust to your model path
        temperature: 0.7,
        maxTokens: 100,
        chatWrapper: new QwenChatWrapper({
            thoughts: 'discourage'  // Prevents the model from outputting thinking tokens
        }),
        verbose: true // Enable to see model loading
    });

    try {
        // Part 1: Simple string invocation
        console.log('Part 1: Simple string input');
        const response1 = await llm.invoke("What is 2+2? Answer in one sentence");
        console.log('Response:', response1.content);
        console.log();

        // Part 2: Using message objects
        console.log('Part 2: Using message objects');
        const messages = [
            new SystemMessage("You are a patient math tutor teaching a 10-year-old. Always explain the reasoning step-by-step in simple terms."),
            new HumanMessage("What is 5*5? Answer in one sentence.")
        ];

        const response2 = await llm.invoke(messages);
        console.log('Response:', response2.content);
        console.log();

        // Part 3: Temperature experimentation
        console.log('Part 3: Temperature differences');
        console.log('Temperature controls randomness: 0.0 = deterministic, 1.0 = creative\n');
        const question = "Give me one adjective to describe winter:";

        console.log('Low temperature (0.1):');
        llm._chatSession.setChatHistory([]);
        const lowTemp = await llm.invoke(question, { temperature: 0.1 });
        // Should always return the same word: "cold"
        console.log(lowTemp.content);

        console.log('\nHigh temperature (0.9):');
        llm._chatSession.setChatHistory([]);
        const highTemp = await llm.invoke(question, { temperature: 0.9 });
        // Different each time: "frosty", "snowy", "chilly", "icy", "freezing"
        console.log(highTemp.content);

    } finally {
        // Cleanup: Always dispose when done
        await llm.dispose();
        console.log('\n✓ Resources cleaned up');
    }

    console.log('\n✓ Exercise 1 complete!');
}

// Run the solution
exercise1().catch(console.error);

/**
 * Key Takeaways:
 *
 * 1. Construction:
 *    - modelPath is required
 *    - Other options have sensible defaults
 *    - Set verbose: true to see what's happening
 *
 * 2. Input flexibility:
 *    - Strings work great for simple queries
 *    - Message arrays give you full control
 *    - Both approaches return AIMessage objects
 *
 * 3. Runtime configuration:
 *    - Pass config as second parameter to invoke()
 *    - Overrides instance defaults for that call only
 *    - Useful for different behaviors per query
 *
 * 4. Resource management:
 *    - Always call dispose() when done
 *    - Use try/finally to ensure cleanup
 *    - Models hold significant memory
 */

