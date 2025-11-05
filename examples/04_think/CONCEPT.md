# Concept: Reasoning & Problem-Solving Agents

## Overview

This example demonstrates how to configure an LLM as a **reasoning agent** capable of analytical thinking and quantitative problem-solving. It shows the bridge between simple text generation and complex cognitive tasks.

## What is a Reasoning Agent?

A **reasoning agent** is an LLM configured to perform logical analysis, mathematical computation, and multi-step problem-solving through careful system prompt design.

### Human Analogy

```
Regular Chat                    Reasoning Agent
─────────────                  ──────────────────
"Can you help me?"            "I am a mathematician.
"Sure! What do you need?"     I analyze problems methodically
                              and compute exact answers."
```

## The Reasoning Challenge

### Why Reasoning is Hard for LLMs

LLMs are trained on text prediction, not explicit reasoning:

```
┌───────────────────────────────────────┐
│  LLM Training                         │
│  "Predict next word in text"         │
│                                       │
│  NOT explicitly trained for:         │
│  • Step-by-step logic                │
│  • Arithmetic computation            │
│  • Tracking multiple variables       │
│  • Systematic problem decomposition  │
└───────────────────────────────────────┘
```

However, they can learn reasoning patterns from training data and be guided by system prompts.

## Reasoning Through System Prompts

### Configuration Pattern

```
┌─────────────────────────────────────────┐
│  System Prompt Components              │
├─────────────────────────────────────────┤
│  1. Role: "Expert reasoner"            │
│  2. Task: "Analyze and solve problems" │
│  3. Method: "Compute exact answers"    │
│  4. Output: "Single numeric value"     │
└─────────────────────────────────────────┘
         ↓
   Reasoning Behavior
```

### Types of Reasoning Tasks

**Quantitative Reasoning (this example):**
```
Problem → Count entities → Calculate → Convert units → Answer
```

**Logical Reasoning:**
```
Premises → Apply rules → Deduce conclusions → Answer
```

**Analytical Reasoning:**
```
Data → Identify patterns → Form hypothesis → Conclude
```

## How LLMs "Reason"

### Pattern Matching vs. True Reasoning

LLMs don't reason like humans, but they can:

```
┌─────────────────────────────────────────────┐
│  What LLMs Actually Do                      │
│                                             │
│  1. Pattern Recognition                     │
│     "This looks like a counting problem"    │
│                                             │
│  2. Template Application                    │
│     "Similar problems follow this pattern"  │
│                                             │
│  3. Statistical Inference                   │
│     "These numbers likely combine this way" │
│                                             │
│  4. Learned Procedures                      │
│     "I've seen this type of calculation"    │
└─────────────────────────────────────────────┘
```

### The Reasoning Process

```
Input: Complex Word Problem
         ↓
    ┌────────────┐
    │   Parse    │  Identify entities and relationships
    └────────────┘
         ↓
    ┌────────────┐
    │  Decompose │  Break into sub-problems
    └────────────┘
         ↓
    ┌────────────┐
    │  Calculate │  Apply arithmetic operations
    └────────────┘
         ↓
    ┌────────────┐
    │  Synthesize│  Combine results
    └────────────┘
         ↓
     Final Answer
```

## Problem Complexity Hierarchy

### Levels of Reasoning Difficulty

```
Easy                                        Hard
│                                             │
│  Simple    Multi-step   Nested    Implicit │
│  Arithmetic  Logic    Conditions  Reasoning│
│                                             │
└─────────────────────────────────────────────┘

Examples:
Easy:    "What is 5 + 3?"
Medium:  "If 3 apples cost $2 each, what's the total?"
Hard:    "Count family members with complex relationships"
```

### This Example's Complexity

The potato problem is **highly complex**:

```
┌─────────────────────────────────────────┐
│  Complexity Factors                     │
├─────────────────────────────────────────┤
│  ✓ Multiple entities (15+ people)      │
│  ✓ Relationship reasoning (family tree)│
│  ✓ Conditional logic (if married then..)│
│  ✓ Negative conditions (deceased people)│
│  ✓ Special cases (dietary restrictions)│
│  ✓ Multiple calculations                │
│  ✓ Unit conversions                     │
└─────────────────────────────────────────┘
```

## Limitations of Pure LLM Reasoning

### Why This Approach Has Issues

```
┌────────────────────────────────────┐
│  Problem: No External Tools        │
│                                    │
│  LLM must hold everything in       │
│  "mental" context:                 │
│  • All entity counts               │
│  • Intermediate calculations       │
│  • Conversion factors              │
│  • Final arithmetic                │
│                                    │
│  Result: Prone to errors           │
└────────────────────────────────────┘
```

### Common Failure Modes

**1. Counting Errors:**
```
Problem: "Count 15 people with complex relationships"
LLM: "14" or "16" (off by one)
```

**2. Arithmetic Mistakes:**
```
Problem: "13 adults × 1.5 + 3 kids × 0.5"
LLM: May get intermediate steps wrong
```

**3. Lost Context:**
```
Problem: Multi-step with many facts
LLM: Forgets earlier information
```

## Improving Reasoning: Evolution Path

### Level 1: Pure Prompting (This Example)
```
User → LLM → Answer
       ↑
   System Prompt
```

**Limitations:**
- All reasoning internal to LLM
- No verification
- No tools
- Hidden process

### Level 2: Chain-of-Thought
```
User → LLM → Show Work → Answer
       ↑
   "Explain your reasoning"
```

**Improvements:**
- Visible reasoning steps
- Can catch some errors
- Still no tools

### Level 3: Tool-Augmented (simple-agent)
```
User → LLM ⟷ Tools → Answer
       ↑    (Calculator)
   System Prompt
```

**Improvements:**
- External computation
- Reduced errors
- Verifiable steps

### Level 4: ReAct Pattern (react-agent)
```
User → LLM → Think → Act → Observe
       ↑      ↓      ↓      ↓
   System  Reason  Tool   Result
   Prompt         Use
       ↑           ↓       ↓
       └───────────Iterate──┘
```

**Best approach:**
- Explicit reasoning loop
- Tool use at each step
- Self-correction possible

## System Prompt Design for Reasoning

### Key Elements

**1. Role Definition:**
```
"You are an expert logical and quantitative reasoner"
```
Sets the mental framework.

**2. Task Specification:**
```
"Analyze real-world word problems involving..."
```
Defines the problem domain.

**3. Output Format:**
```
"Return the correct final number as a single value"
```
Controls response structure.

### Design Patterns

**Pattern A: Direct Answer (This Example)**
```
Prompt: [Problem]
Output: [Number]
```
Pros: Concise, fast
Cons: No insight into reasoning

**Pattern B: Show Work**
```
Prompt: [Problem] "Show your steps"
Output: Step 1: ... Step 2: ... Answer: [Number]
```
Pros: Transparent, debuggable
Cons: Longer, may still have errors

**Pattern C: Self-Verification**
```
Prompt: [Problem] "Solve, then verify"
Output: Solution + Verification + Final Answer
```
Pros: More reliable
Cons: Slower, uses more tokens

## Real-World Applications

### Use Cases for Reasoning Agents

**1. Data Analysis:**
```
Input: Dataset summary
Task: Compute statistics, identify trends
Output: Numerical insights
```

**2. Planning:**
```
Input: Goal + constraints
Task: Reason about optimal sequence
Output: Action plan
```

**3. Decision Support:**
```
Input: Options + criteria
Task: Evaluate and compare
Output: Recommended choice
```

**4. Problem Solving:**
```
Input: Complex scenario
Task: Break down and solve
Output: Solution
```

## Comparison: Different Agent Types

```
                  Reasoning  Tools  Memory  Multi-turn
                  ─────────  ─────  ──────  ──────────
intro.js              ✗        ✗      ✗        ✗
translation.js        ~        ✗      ✗        ✗
think.js (here)       ✓        ✗      ✗        ✗
simple-agent.js       ✓        ✓      ✗        ~
memory-agent.js       ✓        ✓      ✓        ✓
react-agent.js        ✓✓       ✓      ~        ✓
```

Legend:
- ✗ = Not present
- ~ = Limited/implicit
- ✓ = Present
- ✓✓ = Advanced/explicit

## Key Takeaways

1. **System prompts enable reasoning**: Proper configuration transforms an LLM into a reasoning agent
2. **Limitations exist**: Pure LLM reasoning is prone to errors on complex problems
3. **Tools help**: External computation (calculators, etc.) improves accuracy
4. **Iteration matters**: Multi-step reasoning patterns (like ReAct) work better
5. **Transparency is valuable**: Seeing the reasoning process helps debug and verify

## Next Steps

After understanding basic reasoning:
- **Add tools**: Let the agent use calculators, databases, APIs
- **Implement verification**: Check answers, retry on errors
- **Use chain-of-thought**: Make reasoning explicit
- **Apply ReAct pattern**: Combine reasoning and tool use systematically

This example is the foundation for more sophisticated agent architectures that combine reasoning with external capabilities.
