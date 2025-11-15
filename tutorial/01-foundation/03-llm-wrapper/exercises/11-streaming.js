/**
 * Exercise 11: Streaming Responses
 *
 * Goal: Learn to stream LLM responses in real-time
 *
 * In this exercise, you'll:
 * 1. Stream a response and print it character by character
 * 2. Build a progress indicator while streaming
 * 3. Collect chunks into a full response
 * 4. Compare streaming vs non-streaming
 *
 * This creates the "ChatGPT typing effect"!
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
        console.log('Question: Tell me a short fun fact about space.\n');
        console.log('Response: ');

        // TODO: Use llm.stream() to stream the response
        // Use a for await loop to iterate through chunks
        // Print each chunk without a newline (use process.stdout.write)
        // (code here)

        console.log('\n');

        // Part 2: Streaming with progress indicator
        console.log('Part 2: Streaming with progress indicator');
        console.log('Question: Explain what a black hole is in 2-3 sentences.\n');

        let charCount = 0;
        // TODO: Stream the response and count characters
        // Every 10 characters, print a dot (.) as progress
        // Print the actual response too
        // Hint: Use charCount % 10 === 0 to check
        console.log('Progress: ');
        // (code here)

        console.log(`\n\nTotal characters streamed: ${charCount}`);
        console.log();

        // Part 3: Collecting streamed chunks
        console.log('Part 3: Collecting full response from stream');

        const messages = [
            new SystemMessage("You are a helpful assistant"),
            new HumanMessage("What are the three primary colors? Answer briefly.")
        ];

        // TODO: Stream the response and collect all chunks
        let fullResponse = '';
        // Use for await loop to collect chunks
        // Build up fullResponse by concatenating chunk.content
        // (code here)

        console.log('Full response:', fullResponse);
        console.log();

        // Part 4: Compare streaming vs regular invoke
        console.log('Part 4: Streaming vs Regular invoke');
        const question = "What is JavaScript? Answer in one sentence.";

        // TODO: Time a streaming response
        console.log('Streaming:');
        const streamStart = Date.now();
        let streamedText = '';
        // (code here - stream and collect)
        const streamTime = Date.now() - streamStart;
        console.log(`Time: ${streamTime}ms`);
        console.log(`Response: ${streamedText}`);
        console.log();

        // TODO: Time a regular invoke
        console.log('Regular invoke:');
        const invokeStart = Date.now();
        // (code here - use invoke)
        const invokeTime = Date.now() - invokeStart;
        console.log(`Time: ${invokeTime}ms`);
        // console.log response

        console.log(`\nTime difference: ${Math.abs(streamTime - invokeTime)}ms`);

    } finally {
        await llm.dispose();
    }

    console.log('\n✓ Exercise 3 complete!');
}

// Run the exercise
exercise3().catch(console.error);

/**
 * Expected Output:
 * - Part 1: Text appearing character by character
 * - Part 2: Progress dots while streaming
 * - Part 3: Full collected response
 * - Part 4: Similar times for both methods (streaming shows progress)
 *
 * Learning Points:
 * 1. Streaming shows results as they generate (better UX)
 * 2. for await...of loop handles async generators
 * 3. Each chunk is an AIMessage with partial content
 * 4. Total time similar, but perceived as faster
 */