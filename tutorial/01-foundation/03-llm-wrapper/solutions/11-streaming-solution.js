/**
 * Exercise 11 Solution: Streaming Responses
 */

import {HumanMessage, SystemMessage, LlamaCppLLM} from '../../../../src/index.js';

async function exercise3() {
    console.log('=== Exercise 3: Streaming Responses ===\n');

    const llm = new LlamaCppLLM({
        modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf',
        temperature: 0.7,
        maxTokens: 200
    });

    try {
        // Part 1: Basic streaming
        console.log('Part 1: Basic streaming');
        console.log('Question: Tell me a long fun fact about space.\n');
        console.log('Response: ');

        for await (const chunk of llm.stream("Tell me a long fun fact about space.")) {
            process.stdout.write(chunk.content); // No newline
        }

        console.log('\n');

        // Part 2: Streaming with progress indicator
        console.log('Part 2: Streaming with progress indicator');
        console.log('Question: Explain what a black hole is in 2-3 sentences.\n');

        let charCount = 0;
        console.log('Progress: ');
        console.log('Response: ');

        for await (const chunk of llm.stream("Explain what a black hole is in 2-3 sentences.")) {
            process.stdout.write(chunk.content);
            charCount += chunk.content.length;
        }

        console.log(`\n\nTotal characters streamed: ${charCount}`);
        console.log();

        // Part 3: Collecting streamed chunks
        console.log('Part 3: Collecting full response from stream');

        const messages = [
            new SystemMessage("You are a helpful assistant"),
            new HumanMessage("What are the three primary colors? Answer briefly.")
        ];

        let fullResponse = '';
        for await (const chunk of llm.stream(messages)) {
            fullResponse += chunk.content;
        }

        console.log('Full response:', fullResponse);
        console.log();

        // Part 4: Compare streaming vs regular invoke
        console.log('Part 4: Streaming vs Regular invoke');
        const question = "What is JavaScript? Answer in one sentence.";

        // Streaming
        console.log('Streaming:');
        const streamStart = Date.now();
        let streamedText = '';
        for await (const chunk of llm.stream(question)) {
            streamedText += chunk.content;
        }
        const streamTime = Date.now() - streamStart;
        console.log(`Time: ${streamTime}ms`);
        console.log(`Response: ${streamedText}`);
        console.log();

        // Regular invoke
        console.log('Regular invoke:');
        const invokeStart = Date.now();
        const invokeResponse = await llm.invoke(question);
        const invokeTime = Date.now() - invokeStart;
        console.log(`Time: ${invokeTime}ms`);
        console.log(`Response: ${invokeResponse.content}`);

        console.log(`\nTime difference: ${Math.abs(streamTime - invokeTime)}ms`);
        console.log('Note: Streaming feels faster because you see results immediately!');

    } finally {
        await llm.dispose();
    }

    console.log('\n✓ Exercise 3 complete!');
}

// Run the solution
exercise3().catch(console.error);

/**
 * Key Takeaways:
 *
 * 1. Streaming API:
 *    - for await (const chunk of llm.stream(input)) { }
 *    - Each chunk is an AIMessage with partial content
 *    - Use process.stdout.write() to print without newlines
 *
 * 2. User Experience:
 *    - Streaming shows immediate feedback
 *    - Users see progress as it happens
 *    - Feels faster even if total time is similar
 *    - Essential for long responses
 *
 * 3. Collection pattern:
 *    - Initialize empty string: let full = ''
 *    - Accumulate: full += chunk.content
 *    - Use when you need the complete response
 *
 * 4. When to stream:
 *    - Long-form content generation
 *    - Interactive chat interfaces
 *    - When user experience matters
 *    - When you want to show progress
 *
 * 5. When NOT to stream:
 *    - Need to parse complete response
 *    - Batch processing
 *    - Automated testing
 *    - Response needs to be processed as a whole
 */