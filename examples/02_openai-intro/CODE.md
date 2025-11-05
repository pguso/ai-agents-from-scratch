# Code Explanation: OpenAI Intro

This guide walks through each example in `openai-intro.js`, explaining how to work with OpenAI's API from the ground up.

## Requirements

Before running this example, you’ll need an OpenAI account, an API key, and a valid billing method.

### Get API Key

https://platform.openai.com/api-keys

### Add Billing Method

https://platform.openai.com/settings/organization/billing/overview

### Configure environment variables

```bash
   cp .env.example .env
```
Then edit `.env` and add your actual API key.

## Setup and Initialization

```javascript
import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
```

**What's happening:**
- `import OpenAI from 'openai'` - Import the official OpenAI SDK for Node.js
- `import 'dotenv/config'` - Load environment variables from `.env` file
- `new OpenAI({...})` - Create a client instance that handles API authentication and requests
- `process.env.OPENAI_API_KEY` - Your API key from platform.openai.com (never hardcode this!)

**Why it matters:** The client object is your interface to OpenAI's models. All API calls go through this client.

---

## Example 1: Basic Chat Completion

```javascript
const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
        { role: 'user', content: 'What is node-llama-cpp?' }
    ],
});

console.log(response.choices[0].message.content);
```

**What's happening:**
- `chat.completions.create()` - The primary method for sending messages to ChatGPT models
- `model: 'gpt-4o'` - Specifies which model to use (gpt-4o is the latest, most capable model)
- `messages` array - Contains the conversation history
- `role: 'user'` - Indicates this message comes from the user (you)
- `response.choices[0]` - The API returns an array of possible responses; we take the first one
- `message.content` - The actual text response from the AI

**Response structure:**
```javascript
{
  id: 'chatcmpl-...',
  object: 'chat.completion',
  created: 1234567890,
  model: 'gpt-4o',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'node-llama-cpp is a...'
      },
      finish_reason: 'stop'
    }
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 50,
    total_tokens: 60
  }
}
```

---

## Example 2: System Prompts

```javascript
const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
        { role: 'system', content: 'You are a coding assistant that talks like a pirate.' },
        { role: 'user', content: 'Explain what async/await does in JavaScript.' }
    ],
});
```

**What's happening:**
- `role: 'system'` - Special message type that sets the AI's behavior and personality
- System messages are processed first and influence all subsequent responses
- The model will maintain this behavior throughout the conversation

**Why it matters:** System prompts are how you specialize AI behavior. They're the foundation of creating focused agents with specific roles (translator, coder, analyst, etc.).

**Key insight:** Same model + different system prompts = completely different agents!

---

## Example 3: Temperature Control

```javascript
// Focused response
const focusedResponse = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
});

// Creative response
const creativeResponse = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.5,
});
```

**What's happening:**
- `temperature` - Controls randomness in the output (range: 0.0 to 2.0)
- **Low temperature (0.0 - 0.3):**
    - More focused and deterministic
    - Same input → similar output
    - Best for: factual answers, code generation, data extraction
- **Medium temperature (0.7 - 1.0):**
    - Balanced creativity and coherence
    - Default for most use cases
- **High temperature (1.2 - 2.0):**
    - More creative and varied
    - Same input → very different outputs
    - Best for: creative writing, brainstorming, story generation

**Real-world usage:**
- Code completion: temperature 0.2
- Customer support: temperature 0.5
- Creative content: temperature 1.2

---

## Example 4: Conversation Context

```javascript
const messages = [
    { role: 'system', content: 'You are a helpful coding tutor.' },
    { role: 'user', content: 'What is a Promise in JavaScript?' },
];

const response1 = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
});

// Add AI response to history
messages.push(response1.choices[0].message);

// Add follow-up question
messages.push({ role: 'user', content: 'Can you show me a simple example?' });

// Second request with full context
const response2 = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
});
```

**What's happening:**
- OpenAI models are **stateless** - they don't remember previous conversations
- We maintain context by sending the entire conversation history with each request
- Each request is independent; you must include all relevant messages

**Message order in the array:**
1. System prompt (optional, but recommended first)
2. Previous user message
3. Previous assistant response
4. Current user message

**Why it matters:** This is how chatbots remember context. The full conversation is sent every time.

**Performance consideration:**
- More messages = more tokens = higher cost
- Longer conversations eventually hit token limits
- Real applications need conversation trimming or summarization strategies

---

## Example 5: Streaming Responses

```javascript
const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
        { role: 'user', content: 'Write a haiku about programming.' }
    ],
    stream: true,  // Enable streaming
});

for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
}
```

**What's happening:**
- `stream: true` - Instead of waiting for the complete response, receive it token-by-token
- `for await...of` - Iterate over the stream as chunks arrive
- `delta.content` - Each chunk contains a small piece of text (often just a word or partial word)
- `process.stdout.write()` - Write without newline to display text progressively

**Streaming vs. Non-streaming:**

**Non-streaming (default):**
```
[Request sent]
[Wait 5 seconds...]
[Full response arrives]
```

**Streaming:**
```
[Request sent]
Once [chunk arrives: "Once"]
upon [chunk arrives: " upon"]
a [chunk arrives: " a"]
time [chunk arrives: " time"]
...
```

**Why it matters:**
- Better user experience (immediate feedback)
- Appears faster even though total time is similar
- Essential for real-time chat interfaces
- Allows early processing/display of partial results

**When to use streaming:**
- Interactive chat applications
- Long-form content generation
- When user experience matters more than simplicity

**When to NOT use streaming:**
- Simple scripts or automation
- When you need the complete response before processing
- Batch processing

---

## Example 6: Token Usage

```javascript
const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
        { role: 'user', content: 'Explain recursion in 3 sentences.' }
    ],
    max_tokens: 100,
});

console.log("Token usage:");
console.log("- Prompt tokens: " + response.usage.prompt_tokens);
console.log("- Completion tokens: " + response.usage.completion_tokens);
console.log("- Total tokens: " + response.usage.total_tokens);
```

**What's happening:**
- `max_tokens` - Limits the length of the AI's response
- `response.usage` - Contains token consumption details
- **Prompt tokens:** Your input (messages you sent)
- **Completion tokens:** AI's output (the response)
- **Total tokens:** Sum of both (what you're billed for)

**Understanding tokens:**
- Tokens ≠ words
- 1 token ≈ 0.75 words (in English)
- "hello" = 1 token
- "chatbot" = 2 tokens ("chat" + "bot")
- Punctuation and spaces count as tokens

**Why it matters:**
1. **Cost control:** You pay per token
2. **Context limits:** Models have maximum token limits (e.g., gpt-4o: 128,000 tokens)
3. **Response control:** Use `max_tokens` to prevent overly long responses

**Practical limits:**
```javascript
// Prevent runaway responses
max_tokens: 150,  // ~100 words

// Brief responses
max_tokens: 50,   // ~35 words

// Longer content
max_tokens: 1000, // ~750 words
```

**Cost estimation (approximate):**
- GPT-4o: $5 per 1M input tokens, $15 per 1M output tokens
- GPT-3.5-turbo: $0.50 per 1M input tokens, $1.50 per 1M output tokens

---

## Example 7: Model Comparison

```javascript
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
```

**Available models:**

| Model | Best For | Speed | Cost | Context Window |
|-------|----------|-------|------|----------------|
| `gpt-4o` | Complex tasks, reasoning, accuracy | Medium | $$$ | 128K tokens |
| `gpt-4o-mini` | Balanced performance/cost | Fast | $$ | 128K tokens |
| `gpt-3.5-turbo` | Simple tasks, high volume | Very Fast | $ | 16K tokens |

**Choosing the right model:**
- **Use GPT-4o when:**
    - Complex reasoning required
    - High accuracy is critical
    - Working with code or technical content
    - Quality > speed/cost

- **Use GPT-4o-mini when:**
    - Need good performance at lower cost
    - Most general-purpose tasks

- **Use GPT-3.5-turbo when:**
    - Simple classification or extraction
    - High-volume, low-complexity tasks
    - Speed is critical
    - Budget constraints

**Pro tip:** Start with gpt-4o for development, then evaluate if cheaper models work for your use case.

---

## Error Handling

```javascript
try {
    await basicCompletion();
} catch (error) {
    console.error("Error:", error.message);
    if (error.message.includes('API key')) {
        console.error("\nMake sure to set your OPENAI_API_KEY in a .env file");
    }
}
```

**Common errors:**
- `401 Unauthorized` - Invalid or missing API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - OpenAI service issue
- `Context length exceeded` - Too many tokens in conversation

**Best practices:**
- Always use try-catch with async calls
- Check error types and provide helpful messages
- Implement retry logic for transient failures
- Monitor token usage to avoid limit errors

---

## Key Takeaways

1. **Stateless Nature:** Models don't remember. You send full context each time.
2. **Message Roles:** `system` (behavior), `user` (input), `assistant` (AI response)
3. **Temperature:** Controls creativity (0 = focused, 2 = creative)
4. **Streaming:** Better UX for real-time applications
5. **Token Management:** Monitor usage for cost and limits
6. **Model Selection:** Choose based on task complexity and budget