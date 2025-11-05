# Concept: Streaming & Response Control

## Overview

This example demonstrates **streaming responses** and **token limits**, two essential techniques for building responsive AI agents with controlled output.

## The Streaming Problem

### Traditional (Non-Streaming) Approach

```
User sends prompt
       ↓
   [Wait 10 seconds...]
       ↓
Complete response appears all at once
```

**Problems:**
- Poor user experience (long wait)
- No progress indication
- Can't interrupt bad responses
- Feels unresponsive

### Streaming Approach (This Example)

```
User sends prompt
       ↓
"Hoisting" (0.1s) → User sees first word!
       ↓
"is a" (0.2s) → More text appears
       ↓
"JavaScript" (0.3s) → Continuous feedback
       ↓
[Continues token by token...]
```

**Benefits:**
- Immediate feedback
- Progress visible
- Can interrupt early
- Feels interactive

## How Streaming Works

### Token-by-Token Generation

LLMs generate one token at a time internally. Streaming exposes this:

```
Internal LLM Process:
┌─────────────────────────────────────┐
│  Token 1: "Hoisting"                │
│  Token 2: "is"                      │
│  Token 3: "a"                       │
│  Token 4: "JavaScript"              │
│  Token 5: "mechanism"               │
│  ...                                │
└─────────────────────────────────────┘

Without Streaming:        With Streaming:
Wait for all tokens       Emit each token immediately
└─→ Buffer → Return      └─→ Callback → Display
```

### The onTextChunk Callback

```
┌────────────────────────────────────┐
│        Model Generation            │
└────────────┬───────────────────────┘
             │
    ┌────────┴─────────┐
    │  Each new token  │
    └────────┬─────────┘
             ↓
    ┌────────────────────┐
    │ onTextChunk(text)  │  ← Your callback
    └────────┬───────────┘
             ↓
    Your code processes it:
    • Display to user
    • Send over network
    • Log to file
    • Analyze content
```

## Token Limits: maxTokens

### Why Limit Output?

Without limits, models might generate:
```
User: "Explain hoisting"
Model: [Generates 10,000 words including:
        - Complete JavaScript history
        - Every edge case
        - Unrelated examples
        - Never stops...]
```

With limits:
```
User: "Explain hoisting"
Model: [Generates ~1500 words
        - Core concept
        - Key examples
        - Stops at 2000 tokens]
```

### Token Budgeting

```
Context Window: 4096 tokens
├─ System Prompt: 200 tokens
├─ User Message: 100 tokens
├─ Response (maxTokens): 2000 tokens
└─ Remaining for history: 1796 tokens

Total used: 2300 tokens
Available: 1796 tokens for future conversation
```

### Cost vs Quality

```
Token Limit        Output Quality      Use Case
───────────       ───────────────     ─────────────────
100               Brief, may be cut   Quick answers
500               Concise but complete Short explanations
2000 (example)    Detailed            Full explanations
No limit          Risk of rambling    When length unknown
```

## Real-Time Applications

### Pattern 1: Interactive CLI

```
User: "Explain closures"
       ↓
Terminal: "A closure is a function..."
         (Appears word by word, like typing)
       ↓
User sees progress, knows it's working
```

### Pattern 2: Web Application

```
Browser                    Server
   │                         │
   ├─── Send prompt ────────→│
   │                         │
   │←── Chunk 1: "Closures"──┤
   │    (Display immediately) │
   │                         │
   │←── Chunk 2: "are"───────┤
   │    (Append to display)  │
   │                         │
   │←── Chunk 3: "functions"─┤
   │    (Keep appending...)  │
```

Implementation:
- Server-Sent Events (SSE)
- WebSockets
- HTTP streaming

### Pattern 3: Multi-Consumer

```
         onTextChunk(text)
                │
        ┌───────┼───────┐
        ↓       ↓       ↓
    Console  WebSocket  Log File
    Display  → Client   → Storage
```

## Performance Characteristics

### Latency vs Throughput

```
Time to First Token (TTFT):
├─ Small model (1.7B): ~100ms
├─ Medium model (8B): ~200ms
└─ Large model (20B): ~500ms

Tokens Per Second:
├─ Small model: 50-80 tok/s
├─ Medium model: 20-35 tok/s
└─ Large model: 10-15 tok/s

User Experience:
TTFT < 500ms → Feels instant
Tok/s > 20 → Reads naturally
```

### Resource Trade-offs

```
Model Size      Memory    Speed     Quality
──────────     ────────   ─────     ───────
1.7B           ~2GB       Fast      Good
8B             ~6GB       Medium    Better
20B            ~12GB      Slower    Best
```

## Advanced Concepts

### Buffering Strategies

**No Buffer (Immediate)**
```
Every token → callback → display
└─ Smoothest UX but more overhead
```

**Line Buffer**
```
Accumulate until newline → flush
└─ Better for paragraph-based output
```

**Time Buffer**
```
Accumulate for 50ms → flush batch
└─ Reduces callback frequency
```

### Early Stopping

```
Generation in progress:
"The answer is clearly... wait, actually..."
                         ↑
                  onTextChunk detects issue
                         ↓
                   Stop generation
                         ↓
              "Let me reconsider"
```

Useful for:
- Detecting off-topic responses
- Safety filters
- Relevance checking

### Progressive Enhancement

```
Partial Response Analysis:
┌─────────────────────────────────┐
│ "To implement this feature..."  │
│                                 │
│ ← Already useful information   │
│                                 │
│ "...you'll need: 1) Node.js"    │
│                                 │
│ ← Can start acting on this     │
│                                 │
│ "2) Express framework"          │
└─────────────────────────────────┘

Agent can begin working before response completes!
```

## Context Size Awareness

### Why It Matters

```
┌────────────────────────────────┐
│    Context Window (4096)       │
├────────────────────────────────┤
│ System Prompt       200 tokens │
│ Conversation History 1000      │
│ Current Prompt      100        │
│ Response Space      2796       │
└────────────────────────────────┘

If maxTokens > 2796:
└─→ Error or truncation!
```

### Dynamic Adjustment

```
Available = contextSize - (prompt + history)

if (maxTokens > available) {
    maxTokens = available;
    // or clear old history
}
```

## Streaming in Agent Architectures

### Simple Agent

```
User → LLM (streaming) → Display
       └─ onTextChunk shows progress
```

### Multi-Step Agent

```
Step 1: Plan (stream) → Show thinking
Step 2: Act (stream) → Show action
Step 3: Result (stream) → Show outcome
       └─ User sees agent's process
```

### Collaborative Agents

```
Agent A (streaming) ──┐
                      ├─→ Coordinator → User
Agent B (streaming) ──┘
       └─ Both stream simultaneously
```

## Best Practices

### 1. Always Set maxTokens

```
✓ Good:
session.prompt(query, { maxTokens: 2000 })

✗ Risky:
session.prompt(query)
└─ May use entire context!
```

### 2. Handle Partial Updates

```
let fullResponse = '';
onTextChunk: (chunk) => {
    fullResponse += chunk;
    display(chunk);        // Show immediately
    logComplete = false;   // Mark incomplete
}
// After completion:
saveToDatabase(fullResponse);
```

### 3. Provide Feedback

```
onTextChunk: (chunk) => {
    if (firstChunk) {
        showLoadingDone();
        firstChunk = false;
    }
    appendToDisplay(chunk);
}
```

### 4. Monitor Performance

```
const startTime = Date.now();
let tokenCount = 0;

onTextChunk: (chunk) => {
    tokenCount += estimateTokens(chunk);
    const elapsed = (Date.now() - startTime) / 1000;
    const tokensPerSecond = tokenCount / elapsed;
    updateMetrics(tokensPerSecond);
}
```

## Key Takeaways

1. **Streaming improves UX**: Users see progress immediately
2. **maxTokens controls cost**: Prevents runaway generation
3. **Token-by-token generation**: LLMs produce one token at a time
4. **onTextChunk callback**: Your hook into the generation process
5. **Context awareness matters**: Monitor available space
6. **Essential for production**: Real-time systems need streaming

## Comparison

```
Feature           intro.js    coding.js (this)
────────────────  ─────────   ─────────────────
Streaming         ✗           ✓
Token limit       ✗           ✓ (2000)
Real-time output  ✗           ✓
Progress visible  ✗           ✓
User control      ✗           ✓
```

This pattern is foundational for building responsive, user-friendly AI agent interfaces.
