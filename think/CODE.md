# Code Explanation: think.js

This file demonstrates using system prompts for **logical reasoning** and **quantitative problem-solving**, showing how to configure an LLM as a specialized reasoning agent.

## Step-by-Step Code Breakdown

### 1. Import and Setup (Lines 1-8)
```javascript
import {
    getLlama,
    LlamaChatSession,
} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
```
- Standard imports for LLM interaction
- Path setup for locating the model file

### 2. Initialize and Load Model (Lines 10-18)
```javascript
const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "Qwen3-1.7B-Q6_K.gguf"
    )
});
```
- Uses **Qwen3-1.7B-Q6_K**: A 1.7B parameter model with 6-bit quantization
- Smaller than the translation example (1.7B vs 8B parameters)
- Q6_K quantization provides a balance between size and quality

### 3. Define the System Prompt (Lines 19-24)
```javascript
const systemPrompt = `You are an expert logical and quantitative reasoner.
    Your goal is to analyze real-world word problems involving families, quantities, averages, and relationships 
    between entities, and compute the exact numeric answer.
    
    Goal: Return the correct final number as a single value — no explanation, no reasoning steps, just the answer.
    `
```

**Key elements:**

1. **Role**: "expert logical and quantitative reasoner"
   - Sets expectations for mathematical/analytical thinking

2. **Task Scope**: "real-world word problems involving families, quantities, averages, and relationships"
   - Tells the model what type of problems to expect
   - Primes it for complex counting and calculation tasks

3. **Output Constraint**: "Return the correct final number as a single value — no explanation"
   - Forces concise output
   - Just the answer, not the work

### Why This System Prompt Design?

The prompt is designed for the specific problem type:
- Word problems with complex family relationships
- Multiple nested conditions
- Requires careful tracking of people and quantities
- Needs arithmetic calculation

### 4. Create Context and Session (Lines 25-29)
```javascript
const context = await model.createContext();
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt
});
```
- Creates context for the conversation
- Initializes session with the reasoning system prompt
- No chat wrapper needed (using model's default format)

### 5. The Complex Word Problem (Lines 31-40)
```javascript
const prompt = `My family reunion is this week, and I was assigned the mashed potatoes to bring. 
The attendees include my married mother and father, my twin brother and his family, my aunt and her family, my grandma 
and her brother, her brother's daughter, and his daughter's family. All the adults but me have been married, and no one 
is divorced or remarried, but my grandpa and my grandma's sister-in-law passed away last year. All living spouses are attending. 
My brother has two children that are still kids, my aunt has one six-year-old, and my grandma's brother's daughter has 
three kids under 12. I figure each adult will eat about 1.5 potatoes and each kid will eat about 1/2 a potato, except my 
second cousins don't eat carbs. The average potato is about half a pound, and potatoes are sold in 5-pound bags. 

How many whole bags of potatoes do I need? 
`;
```

**This is intentionally complex to test reasoning:**

**People to count:**
- Speaker (1)
- Mother and father (2)
- Twin brother + spouse (2)
- Brother's 2 kids (2)
- Aunt + spouse (2)
- Aunt's 1 kid (1)
- Grandma (1)
- Grandma's brother + spouse (2)
- Brother's daughter + spouse (2)
- Their 3 kids (3, but don't eat carbs)

**Calculations needed:**
1. Count total adults
2. Count total kids
3. Subtract non-eating kids
4. Calculate potato needs: (adults × 1.5) + (eating kids × 0.5)
5. Convert to pounds: total potatoes × 0.5 lbs
6. Convert to bags: pounds ÷ 5, round up

**The complexity:**
- Family relationships (who's married to whom)
- Deceased people (subtract from count)
- Special dietary needs (second cousins don't eat carbs)
- Unit conversions (potatoes → pounds → bags)

### 6. Execute and Display (Lines 42-43)
```javascript
const answer = await session.prompt(prompt);
console.log(`AI: ${answer}`);
```
- Sends the complex problem to the model
- The model uses its reasoning abilities to work through the problem
- Outputs just the final number (based on system prompt)

### 7. Cleanup (Lines 45-48)
```javascript
session.dispose()
context.dispose()
model.dispose()
llama.dispose()
```
- Standard resource cleanup

## Key Concepts Demonstrated

### 1. Reasoning Agent Configuration
This shows how to configure an LLM for analytical thinking:

```
System Prompt → LLM becomes a "reasoning engine"
```

Instead of conversational AI, we get:
- Focused analytical processing
- Mathematical computation
- Logical deduction

### 2. Output Format Control
Compare these approaches:

**Without constraint:**
```
AI: Let me work through this step by step.
First, I'll count the adults...
[lengthy explanation]
So the answer is 3 bags.
```

**With constraint (this example):**
```
AI: 3
```

### 3. Problem Complexity Testing
This example tests the model's ability to:
- Parse complex natural language
- Track multiple entities and relationships
- Apply arithmetic operations
- Handle edge cases (deceased people, dietary restrictions)
- Perform unit conversions

### 4. Specialized Task Agents
This demonstrates creating task-specific agents:

```
General LLM + "Reasoning Agent" System Prompt = Math Problem Solver
```

Same pattern works for:
- Logic puzzles
- Data analysis
- Scientific calculations
- Statistical reasoning

## Challenges & Limitations

### 1. Model Size Matters
The 1.7B parameter model may struggle with:
- Very complex counting problems
- Multi-step reasoning requiring working memory
- Edge cases in the problem

Larger models (7B, 13B+) generally perform better on reasoning tasks.

### 2. Hidden Reasoning
The system prompt asks for "just the answer," so we don't see:
- The model's reasoning process
- Where it might have made mistakes
- Its confidence level

### 3. No Tool Use
The model must do all calculations "in its head" without:
- A calculator
- Note-taking
- Step-by-step verification

Later examples (like react-agent) address this by giving the model tools.

## Why This Matters for AI Agents

### Reasoning is Fundamental
All useful agents need reasoning capabilities:
- **Planning agents**: Reason about sequences of actions
- **Research agents**: Analyze and synthesize information
- **Decision agents**: Evaluate options and consequences

### System Prompt Shapes Behavior
This example shows that the same model can behave differently based on instructions:
- Translator agent (previous example)
- Reasoning agent (this example)
- Code agent (later examples)

### Foundation for Complex Agents
Understanding how to prompt for reasoning is essential before adding:
- Tools (giving the model a calculator)
- Memory (remembering previous calculations)
- Multi-step processes (ReAct pattern)

## Expected Output

Running this script should output something like:
```
AI: 3
```

The exact answer depends on the model's ability to:
- Correctly count all family members
- Apply the eating rates
- Convert units
- Round up for whole bags

## Improving This Approach

To get better reasoning:
1. **Use larger models**: 7B+ parameters
2. **Add step-by-step prompting**: "Show your work"
3. **Provide tools**: Give the model a calculator
4. **Use chain-of-thought**: Encourage explicit reasoning
5. **Verify answers**: Run multiple times or use multiple models

The react-agent example demonstrates some of these improvements.
