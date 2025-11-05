# Concept: System Prompts & Agent Specialization

## Overview

This example demonstrates how to transform a general-purpose LLM into a **specialized agent** using **system prompts**. The key insight: you don't need different models for different tasks—you need different instructions.

## What is a System Prompt?

A **system prompt** is a persistent instruction that shapes the AI's behavior for an entire conversation session.

### Analogy
Think of hiring someone for a job:

```
Without System Prompt          With System Prompt
─────────────────────         ──────────────────────
"Hi, I'm an AI."              "I'm a professional translator
                               with expertise in scientific
What do you want?"            German. I follow strict quality
                              guidelines and output format."
```

## How System Prompts Work

### The Context Structure

```
┌─────────────────────────────────────────────┐
│           CONTEXT WINDOW                    │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  SYSTEM PROMPT (Always present)       │ │
│  │  "You are a professional translator..." │
│  │  "Follow these rules..."              │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │  USER MESSAGES                        │ │
│  │  "Translate this text..."             │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │  AI RESPONSES                         │ │
│  │  (Shaped by system prompt)            │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

The system prompt sits at the top of the context and influences **every** response.

## Agent Specialization Pattern

### Transformation Flow

```
┌──────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  General Model   │ +  │ System Prompt   │ =  │ Specialized Agent│
│                  │    │                 │    │                  │
│ • Knows many     │    │ • Define role   │    │ • Translation    │
│   things         │    │ • Set rules     │    │   Agent          │
│ • No specific    │    │ • Constrain     │    │ • Coding Agent   │
│   role           │    │   output        │    │ • Analysis Agent │
└──────────────────┘    └─────────────────┘    └──────────────────┘
```

### Example Specializations

**Translation Agent (this example):**
```
System Prompt = Role + Rules + Output Format
```

**Code Assistant:**
```javascript
systemPrompt: "You are an expert programmer. 
Always provide working code with comments.
Explain complex logic."
```

**Data Analyst:**
```javascript
systemPrompt: "You are a data analyst.
Always show your calculations step-by-step.
Cite data sources when available."
```

## Anatomy of an Effective System Prompt

### The 5 Components

```
┌─────────────────────────────────────────┐
│  1. ROLE DEFINITION                     │
│  "You are a [specific role]..."         │
├─────────────────────────────────────────┤
│  2. TASK DESCRIPTION                    │
│  "Your goal is to..."                   │
├─────────────────────────────────────────┤
│  3. BEHAVIORAL RULES                    │
│  "Always do X, Never do Y..."           │
├─────────────────────────────────────────┤
│  4. OUTPUT FORMAT                       │
│  "Format your response as..."           │
├─────────────────────────────────────────┤
│  5. CONSTRAINTS                         │
│  "Do NOT include..."                    │
└─────────────────────────────────────────┘
```

### This Example's Structure

```
Role:        "Professional scientific translator"
Task:        "Translate English to German with precision"
Rules:       8 specific translation guidelines
Format:      Idiomatic German, scientific style
Constraints: "ONLY translated text, no explanation"
```

## Why Detailed System Prompts Matter

### Comparison Study

**Minimal System Prompt:**
```javascript
systemPrompt: "Translate to German"
```

**Result:**
- May add unnecessary explanations
- Inconsistent terminology
- Mixed formality levels
- Extra conversational text

**Detailed System Prompt (this example):**
```javascript
systemPrompt: `You are a professional translator...
- Rule 1: Preserve technical accuracy
- Rule 2: Use idiomatic German
- Rule 3: Follow scientific conventions
...
DO NOT add any explanations`
```

**Result:**
- ✅ Consistent quality
- ✅ Correct terminology
- ✅ Proper formatting
- ✅ Only translation output

### Quality Impact

```
Detail Level          Output Quality
───────────         ─────────────────
Very minimal  →     Unpredictable
Basic role    →     Somewhat consistent
Detailed      →     Highly consistent ⭐
Over-detailed →     May confuse model
```

## System Prompt Design Patterns

### Pattern 1: Role-Playing
```
"You are a [profession] with expertise in [domain]..."
```
Makes the model adopt that perspective.

### Pattern 2: Rule-Based
```
"Follow these rules:
1. Always...
2. Never...
3. When X, do Y..."
```
Explicit constraints lead to predictable behavior.

### Pattern 3: Output Formatting
```
"Format your response as:
- JSON
- Markdown
- Plain text only
- Step-by-step list"
```
Controls the structure of responses.

### Pattern 4: Contextual Awareness
```
"You remember: [previous facts]
You know that: [domain knowledge]
Current situation: [context]"
```
Primes the model with relevant information.

## How This Relates to AI Agents

### Agent = Model + System Prompt + Tools

```
┌────────────────────────────────────────────┐
│             AI Agent                       │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  System Prompt (Agent's "Identity")  │ │
│  └──────────────────────────────────────┘ │
│                  ↓                         │
│  ┌──────────────────────────────────────┐ │
│  │  LLM (Agent's "Brain")               │ │
│  └──────────────────────────────────────┘ │
│                  ↓                         │
│  ┌──────────────────────────────────────┐ │
│  │  Tools (Agent's "Hands") [Optional]  │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**In this example:**
- System Prompt: "You are a translator..."
- LLM: Apertus-8B model
- Tools: None (translation is done by the model itself)

**In more complex agents:**
- System Prompt: "You are a research assistant..."
- LLM: Any model
- Tools: Web search, calculator, file access, etc.

## Practical Applications

### 1. Domain Specialization
```
Medical → "You are a medical professional..."
Legal → "You are a legal expert..."
Technical → "You are an engineer..."
```

### 2. Output Control
```
JSON API → "Always respond in valid JSON"
Markdown → "Format all responses as markdown"
Code → "Only output executable code"
```

### 3. Behavioral Constraints
```
Concise → "Use maximum 2 sentences"
Detailed → "Explain thoroughly with examples"
Neutral → "Avoid opinions, state only facts"
```

### 4. Multi-Language Support
```
systemPrompt: `You are a multilingual assistant.
Respond in the same language as the input.`
```

## Chat Wrappers Explained

Different models need different conversation formats:

```
Model Type        Format Needed         Wrapper
──────────────   ───────────────────   ─────────────────
Llama 2/3        Llama format          LlamaChatWrapper
GPT-style        ChatML format         ChatMLWrapper
Harmony models   Harmony format        HarmonyChatWrapper
```

**What they do:**
```
Your Message → [Chat Wrapper] → Formatted Prompt → Model
                    ↓
          Adds special tokens:
          <|system|>, <|user|>, <|assistant|>
```

The wrapper ensures the model understands which part is the system prompt, which is the user message, etc.

## Key Takeaways

1. **System prompts are powerful**: They fundamentally change how the model behaves
2. **Detailed is better**: More specific instructions = more consistent results
3. **Structure matters**: Role + Rules + Format + Constraints
4. **No retraining needed**: Same model, different behaviors
5. **Foundation for agents**: System prompts are the first step in building specialized agents

## Evolution Path

```
1. Basic Prompting           (intro.js)
       ↓
2. System Prompts            (translation.js) ← You are here
       ↓
3. System Prompts + Tools    (simple-agent.js)
       ↓
4. Multi-turn reasoning      (react-agent.js)
       ↓
5. Full Agent Systems
```

This example bridges the gap between basic LLM usage and true agent behavior by showing how to specialize through instructions.
