# Code Explanation: react-agent.js

This example implements the **ReAct pattern** (Reasoning + Acting), a powerful approach for multi-step problem-solving with tools.

## What is ReAct?

ReAct = **Rea**soning + **Act**ing

The agent alternates between:
1. **Thinking** (reasoning about what to do)
2. **Acting** (using tools)
3. **Observing** (seeing tool results)
4. Repeat until problem is solved

## Key Components

### 1. ReAct System Prompt (Lines 20-52)
```javascript
const systemPrompt = `You are a mathematical assistant that uses the ReAct approach.

CRITICAL: You must follow this EXACT pattern:

Thought: [Explain what calculation you need]
Action: [Call ONE tool]
Observation: [Wait for result]
Thought: [Analyze result]
Action: [Call another tool if needed]
...
Thought: [Once you have all information]
Answer: [Final answer and STOP]
```

**Key instructions:**
- Explicit step-by-step pattern
- One tool call at a time
- Continue until final answer
- Stop after "Answer:"

### 2. Calculator Tools (Lines 60-159)

Four basic math operations:
```javascript
const add = defineChatSessionFunction({...});
const multiply = defineChatSessionFunction({...});
const subtract = defineChatSessionFunction({...});
const divide = defineChatSessionFunction({...});
```

Each tool:
- Takes two numbers (a, b)
- Performs operation
- Logs the call
- Returns result as string

### 3. ReAct Agent Loop (Lines 164-212)

```javascript
async function reactAgent(userPrompt, maxIterations = 10) {
    let iteration = 0;
    let fullResponse = "";
    
    while (iteration < maxIterations) {
        iteration++;
        
        // Prompt the LLM
        const response = await session.prompt(
            iteration === 1 ? userPrompt : "Continue your reasoning.",
            {
                functions,
                maxTokens: 300,
                onTextChunk: (chunk) => {
                    process.stdout.write(chunk);  // Stream output
                    currentChunk += chunk;
                }
            }
        );
        
        fullResponse += currentChunk;
        
        // Check if final answer reached
        if (response.toLowerCase().includes("answer:")) {
            return fullResponse;
        }
    }
}
```

**How it works:**
1. Loop up to maxIterations times
2. On first iteration: send user's question
3. On subsequent iterations: ask to continue
4. Stream output in real-time
5. Stop when "Answer:" appears
6. Return full reasoning trace

### 4. Example Query (Lines 215-220)

```javascript
const queries = [
    "A store sells 15 items Monday at $8 each, 20 items Tuesday at $8 each, 
     10 items Wednesday at $8 each. What's the average items per day and total revenue?"
];
```

Complex problem requiring multiple calculations:
- 15 × 8
- 20 × 8
- 10 × 8
- Sum results
- Calculate average
- Format answer

## The ReAct Flow

### Example Execution

```
USER: "A store sells 15 items at $8 each and 20 items at $8 each. Total revenue?"

Iteration 1:
Thought: First I need to calculate 15 × 8
Action: multiply(15, 8)
Observation: 120

Iteration 2:
Thought: Now I need to calculate 20 × 8
Action: multiply(20, 8)
Observation: 160

Iteration 3:
Thought: Now I need to add both results
Action: add(120, 160)
Observation: 280

Iteration 4:
Thought: I have the total revenue
Answer: The total revenue is $280
```

**Loop stops** because "Answer:" was detected.

## Why ReAct Works

### Traditional Approach (Fails)
```
User: "Complex math problem"
LLM: [Tries to calculate in head]
→ Often wrong due to arithmetic errors
```

### ReAct Approach (Succeeds)
```
User: "Complex math problem"
LLM: "I need to calculate X"
  → Calls calculator tool
  → Gets accurate result
  → Uses result for next step
  → Continues until solved
```

## Key Concepts

### 1. Explicit Reasoning
The agent must "show its work":
```
Thought: What do I need to do?
Action: Do it
Observation: What happened?
```

### 2. Tool Use at Each Step
```
Don't calculate: 15 × 8 = 120 (may be wrong)
Do calculate: multiply(15, 8) → 120 (always correct)
```

### 3. Iterative Problem Solving
```
Complex Problem → Break into steps → Solve each step → Combine results
```

### 4. Self-Correction
Agent can observe bad results and try again:
```
Thought: That doesn't look right
Action: Let me recalculate
```

## Debug Output

The code includes PromptDebugger (lines 228-234):
```javascript
const promptDebugger = new PromptDebugger({
    outputDir: './logs',
    filename: 'react_calculator.txt',
    includeTimestamp: true
});
await promptDebugger.debugContextState({session, model});
```

Saves complete prompt history to logs for debugging.

## Expected Output

```
========================================================
USER QUESTION: [Problem statement]
========================================================

--- Iteration 1 ---
Thought: First I need to multiply 15 by 8
Action: multiply(15, 8)

   🔧 TOOL CALLED: multiply(15, 8)
   📊 RESULT: 120

Observation: 120

--- Iteration 2 ---
Thought: Now I need to multiply 20 by 8
Action: multiply(20, 8)

   🔧 TOOL CALLED: multiply(20, 8)
   📊 RESULT: 160

... continues ...

--- Iteration N ---
Thought: I have all the information
Answer: [Final answer]

========================================================
FINAL ANSWER REACHED
========================================================
```

## Why This Matters

### Enables Complex Tasks
- Multi-step reasoning
- Accurate calculations
- Self-correction
- Transparent process

### Foundation of Modern Agents
This pattern powers:
- LangChain agents
- AutoGPT
- BabyAGI
- Most production agent frameworks

### Observable Reasoning
Unlike "black box" LLMs, you see:
- What the agent is thinking
- Which tools it uses
- Why it makes decisions
- Where it might fail

## Best Practices

1. **Clear system prompt**: Define exact pattern
2. **One tool per action**: Don't combine operations
3. **Limit iterations**: Prevent infinite loops
4. **Stream output**: Show progress
5. **Debug thoroughly**: Use PromptDebugger

## Comparison

```
Simple Agent vs ReAct Agent
────────────────────────────
Single prompt/response      Multi-step iteration
One tool call (maybe)       Multiple tool calls
No visible reasoning        Explicit reasoning
Works for simple tasks      Handles complex problems
```

This is the state-of-the-art pattern for building capable AI agents!
