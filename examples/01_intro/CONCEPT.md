# Concept: Basic LLM Interaction

## Overview

This example introduces the fundamental concepts of working with a Large Language Model (LLM) running locally on your machine. It demonstrates the simplest possible interaction: loading a model and asking it a question.

## What is a Local LLM?

A **Local LLM** is an AI language model that runs entirely on your own computer, without requiring internet connectivity or external API calls. Key benefits:

- **Privacy**: Your data never leaves your machine
- **Cost**: No per-token API charges
- **Control**: Full control over model selection and parameters
- **Offline**: Works without internet connection

## Core Components

### 1. Model Files (GGUF Format)

```
┌─────────────────────────────┐
│   Qwen3-1.7B-Q8_0.gguf     │
│   (Model Weights File)      │
│                             │
│  • Stores learned patterns  │
│  • Quantized for efficiency │
│  • Loaded into RAM/VRAM     │
└─────────────────────────────┘
```

- **GGUF**: File format optimized for llama.cpp
- **Quantization**: Reduces model size (e.g., 8-bit instead of 16-bit)
- **Trade-off**: Smaller size and faster speed vs. slight quality loss

### 2. The Inference Pipeline

```
User Input → Model → Generation → Response
    ↓          ↓          ↓           ↓
 "Hello"   Context   Sampling    "Hi there!"
```

**Flow Diagram:**
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Prompt  │ --> │ Context  │ --> │  Model   │ --> │ Response │
│          │     │ (Memory) │     │(Weights) │     │  (Text)  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 3. Context Window

The **context** is the model's working memory:

```
┌─────────────────────────────────────────┐
│           Context Window                │
│  ┌─────────────────────────────────┐   │
│  │ System Prompt (if any)          │   │
│  ├─────────────────────────────────┤   │
│  │ User: "do you know node-llama?" │   │
│  ├─────────────────────────────────┤   │
│  │ AI: "Yes, I'm familiar..."      │   │
│  ├─────────────────────────────────┤   │
│  │ (Space for more conversation)   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

- Limited size (e.g., 2048, 4096, or 8192 tokens)
- When full, old messages must be removed
- All previous messages influence the next response

## How LLMs Generate Responses

### Token-by-Token Generation

LLMs don't generate entire sentences at once. They predict one **token** (word piece) at a time:

```
Prompt: "What is AI?"

Generation Process:
"What is AI?" → [Model] → "AI"
"What is AI? AI" → [Model] → "is"
"What is AI? AI is" → [Model] → "a"
"What is AI? AI is a" → [Model] → "field"
... continues until stop condition
```

**Visualization:**
```
Input Prompt
     ↓
┌────────────┐
│   Model    │ → Token 1: "AI"
│ Processes  │ → Token 2: "is"
│   & Predicts│ → Token 3: "a"
└────────────┘ → Token 4: "field"
                → ...
```

## Key Concepts for AI Agents

### 1. Stateless Processing
- Each prompt is independent unless you maintain context
- The model has no memory between different script runs
- To build an "agent", you need to:
  - Keep the context alive between prompts
  - Maintain conversation history
  - Add tools/functions (covered in later examples)

### 2. Prompt Engineering Basics
The way you phrase questions affects the response:

```
❌ Poor: "node-llama-cpp"
✅ Better: "do you know node-llama-cpp"
✅ Best: "Explain what node-llama-cpp is and how it works"
```

### 3. Resource Management
LLMs consume significant resources:

```
Model Loading
     ↓
┌─────────────────┐
│  RAM/VRAM Usage │  ← Models need gigabytes
│  CPU/GPU Time   │  ← Inference takes time
│  Memory Leaks?  │  ← Must cleanup properly
└─────────────────┘
     ↓
Proper Disposal
```

## Why This Matters for Agents

This basic example establishes the foundation for AI agents:

1. **Agents need LLMs to "think"**: The model processes information and generates responses
2. **Agents need context**: To maintain state across interactions
3. **Agents need structure**: Later examples add tools, memory, and reasoning loops

## Next Steps

After understanding basic prompting, explore:
- **System prompts**: Giving the model a specific role or behavior
- **Function calling**: Allowing the model to use tools
- **Memory**: Persisting information across sessions
- **Reasoning patterns**: Like ReAct (Reasoning + Acting)

## Diagram: Complete Architecture

```
┌──────────────────────────────────────────────────┐
│            Your Application                      │
│  ┌────────────────────────────────────────────┐ │
│  │         node-llama-cpp Library             │ │
│  │  ┌──────────────────────────────────────┐  │ │
│  │  │      llama.cpp (C++ Runtime)         │  │ │
│  │  │  ┌────────────────────────────────┐  │  │ │
│  │  │  │   Model File (GGUF)            │  │  │ │
│  │  │  │   • Qwen3-1.7B-Q8_0.gguf       │  │  │ │
│  │  │  └────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
           ↕
    ┌──────────────┐
    │  CPU / GPU   │
    └──────────────┘
```

This layered architecture allows you to build sophisticated AI agents on top of basic LLM interactions.
