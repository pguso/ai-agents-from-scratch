import OpenAI from 'openai';
import 'dotenv/config';

// Initialize OpenAI client
// Create an API key at https://platform.openai.com/api-keys
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

console.log("=== OpenAI Intro: Understanding the Basics ===\n");

// ============================================
// EXAMPLE 1: Basic Chat Completion
// ============================================
async function basicCompletion() {
    console.log("--- Example 1: Basic Chat Completion ---");

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'user', content: 'What is node-llama-cpp?' }
        ],
    });

    console.log("AI: " + response.choices[0].message.content);
    console.log("\n");
}

// ============================================
// EXAMPLE 2: Using System Prompts
// ============================================
async function systemPromptExample() {
    console.log("--- Example 2: System Prompts (Behavioral Control) ---");

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a coding assistant that talks like a pirate.' },
            { role: 'user', content: 'Explain what async/await does in JavaScript.' }
        ],
    });

    console.log("AI: " + response.choices[0].message.content);
    console.log("\n");
}

// ============================================
// EXAMPLE 3: Temperature and Creativity
// ============================================
async function temperatureExample() {
    console.log("--- Example 3: Temperature Control ---");

    const prompt = "Write a one-sentence tagline for a coffee shop.";

    // Low temperature = more focused and deterministic
    const focusedResponse = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
    });

    // High temperature = more creative and varied
    const creativeResponse = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.5,
    });

    console.log("Low temp (0.2): " + focusedResponse.choices[0].message.content);
    console.log("High temp (1.5): " + creativeResponse.choices[0].message.content);
    console.log("\n");
}

// ============================================
// EXAMPLE 4: Conversation with Context
// ============================================
async function conversationContext() {
    console.log("--- Example 4: Multi-turn Conversation ---");

    // Build conversation history
    const messages = [
        { role: 'system', content: 'You are a helpful coding tutor.' },
        { role: 'user', content: 'What is a Promise in JavaScript?' },
    ];

    // First response
    const response1 = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 150,
    });

    console.log("User: What is a Promise in JavaScript?");
    console.log("AI: " + response1.choices[0].message.content);

    // Add AI response to history
    messages.push(response1.choices[0].message);

    // Add follow-up question
    messages.push({ role: 'user', content: 'Can you show me a simple example?' });

    // Second response (with context)
    const response2 = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
    });

    console.log("\nUser: Can you show me a simple example?");
    console.log("AI: " + response2.choices[0].message.content);
    console.log("\n");
}

// ============================================
// EXAMPLE 5: Streaming Responses
// ============================================
async function streamingExample() {
    console.log("--- Example 5: Streaming Response ---");
    console.log("AI: ");

    const stream = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'user', content: 'Write a haiku about programming.' }
        ],
        stream: true,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content);
    }

    console.log("\n\n");
}

// ============================================
// EXAMPLE 6: Token Usage and Limits
// ============================================
async function tokenUsageExample() {
    console.log("--- Example 6: Understanding Token Usage ---");

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'user', content: 'Explain recursion in 3 sentences.' }
        ],
        max_tokens: 100,
    });

    console.log("AI: " + response.choices[0].message.content);
    console.log("\nToken usage:");
    console.log("- Prompt tokens: " + response.usage.prompt_tokens);
    console.log("- Completion tokens: " + response.usage.completion_tokens);
    console.log("- Total tokens: " + response.usage.total_tokens);
    console.log("\n");
}

// ============================================
// EXAMPLE 7: Model Comparison
// ============================================
async function modelComparison() {
    console.log("--- Example 7: Different Models ---");

    const prompt = "What's 25 * 47?";

    // GPT-4o - Most capable
    const gpt4Response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
    });

    // GPT-3.5-turbo - Faster and cheaper
    const gpt35Response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
    });

    console.log("GPT-4o: " + gpt4Response.choices[0].message.content);
    console.log("GPT-3.5-turbo: " + gpt35Response.choices[0].message.content);
    console.log("\n");
}

// ============================================
// Run all examples
// ============================================
async function main() {
    try {
        await basicCompletion();
        await systemPromptExample();
        await temperatureExample();
        await conversationContext();
        await streamingExample();
        await tokenUsageExample();
        await modelComparison();

        console.log("=== All examples completed! ===");
    } catch (error) {
        console.error("Error:", error.message);
        if (error.message.includes('API key')) {
            console.error("\nMake sure to set your OPENAI_API_KEY in a .env file");
        }
    }
}

main();