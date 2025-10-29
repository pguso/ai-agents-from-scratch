⭐ 1000+ stars in 5 days. Grateful beyond words!

# AI Agents From Scratch

Learn to build AI agents locally without frameworks. Understand what happens under the hood before using production frameworks.

## Purpose

This repository teaches you to build AI agents from first principles using **local LLMs** and **node-llama-cpp**. By working through these examples, you'll understand:

- How LLMs work at a fundamental level
- What agents really are (LLM + tools + patterns)
- How different agent architectures function
- Why frameworks make certain design choices

**Philosophy**: Learn by building. Understand deeply, then use frameworks wisely.

## Getting Started

### Prerequisites
- Node.js 18+
- At least 8GB RAM (16GB recommended)
- Download models and place in `./models/` folder, details in [DOWNLOAD.md](DOWNLOAD.md)

### Installation
```bash
npm install
```

### Run Examples
```bash
node intro/intro.js
node simple-agent/simple-agent.js
node react-agent/react-agent.js
```

## Learning Path

Follow these examples in order to build understanding progressively:

### 1. **Introduction** - Basic LLM Interaction
`intro/` | [Code Explanation](intro/CODE.md) | [Concepts](intro/CONCEPT.md)

**What you'll learn:**
- Loading and running a local LLM
- Basic prompt/response cycle

**Key concepts**: Model loading, context, inference pipeline, token generation

---

### 2. (Optional) **OpenAI Intro** - Using Proprietary Models
`openai-intro/` | [Code Explanation](openai-intro/CODE.md) | [Concepts](openai-intro/CONCEPT.md)

**What you'll learn:**
- How to call hosted LLMs (like GPT-4)
- Temperature Control
- Token Usage

**Key concepts**: Inference endpoints, network latency, cost vs control, data privacy, vendor dependence

---

### 3. **Translation** - System Prompts & Specialization
`translation/` | [Code Explanation](translation/CODE.md) | [Concepts](translation/CONCEPT.md)

**What you'll learn:**
- Using system prompts to specialize agents
- Output format control
- Role-based behavior
- Chat wrappers for different models

**Key concepts**: System prompts, agent specialization, behavioral constraints, prompt engineering

---

### 4. **Think** - Reasoning & Problem Solving
`think/` | [Code Explanation](think/CODE.md) | [Concepts](think/CONCEPT.md)

**What you'll learn:**
- Configuring LLMs for logical reasoning
- Complex quantitative problems
- Limitations of pure LLM reasoning
- When to use external tools

**Key concepts**: Reasoning agents, problem decomposition, cognitive tasks, reasoning limitations

---

### 5. **Batch** - Parallel Processing
`batch/` | [Code Explanation](batch/CODE.md) | [Concepts](batch/CONCEPT.md)

**What you'll learn:**
- Processing multiple requests concurrently
- Context sequences for parallelism
- GPU batch processing
- Performance optimization

**Key concepts**: Parallel execution, sequences, batch size, throughput optimization

---

### 6. **Coding** - Streaming & Response Control
`coding/` | [Code Explanation](coding/CODE.md) | [Concepts](coding/CONCEPT.md)

**What you'll learn:**
- Real-time streaming responses
- Token limits and budget management
- Progressive output display
- User experience optimization

**Key concepts**: Streaming, token-by-token generation, response control, real-time feedback

---

### 7. **Simple Agent** - Function Calling (Tools)
`simple-agent/` | [Code Explanation](simple-agent/CODE.md) | [Concepts](simple-agent/CONCEPT.md)

**What you'll learn:**
- Function calling / tool use fundamentals
- Defining tools the LLM can use
- JSON Schema for parameters
- How LLMs decide when to use tools

**Key concepts**: Function calling, tool definitions, agent decision making, action-taking

**This is where text generation becomes agency!**

---

### 8. **Simple Agent with Memory** - Persistent State
`simple-agent-with-memory/` | [Code Explanation](simple-agent-with-memory/CODE.md) | [Concepts](simple-agent-with-memory/CONCEPT.md)

**What you'll learn:**
- Persisting information across sessions
- Long-term memory management
- Facts and preferences storage
- Memory retrieval strategies

**Key concepts**: Persistent memory, state management, memory systems, context augmentation

---

### 9. **ReAct Agent** - Reasoning + Acting
`react-agent/` | [Code Explanation](react-agent/CODE.md) | [Concepts](react-agent/CONCEPT.md)

**What you'll learn:**
- ReAct pattern (Reason → Act → Observe)
- Iterative problem solving
- Step-by-step tool use
- Self-correction loops

**Key concepts**: ReAct pattern, iterative reasoning, observation-action cycles, multi-step agents

**This is the foundation of modern agent frameworks!**

---

## Documentation Structure

Each example folder contains:

- **`<name>.js`** - The working code example
- **`CODE.md`** - Step-by-step code explanation
- Line-by-line breakdowns
- What each part does
- How it works
- **`CONCEPT.md`** - High-level concepts
- Why it matters for agents
- Architectural patterns
- Real-world applications
- Simple diagrams

## Core Concepts

### What is an AI Agent?

```
AI Agent = LLM + System Prompt + Tools + Memory + Reasoning Pattern
           ─┬─   ──────┬──────   ──┬──   ──┬───   ────────┬────────
            │           │           │       │              │
         Brain      Identity    Hands   State         Strategy
```

### Evolution of Capabilities

```
1. intro          → Basic LLM usage
2. translation    → Specialized behavior (system prompts)
3. think          → Reasoning ability
4. batch          → Parallel processing
5. coding         → Streaming & control
6. simple-agent   → Tool use (function calling)
7. memory-agent   → Persistent state
8. react-agent    → Strategic reasoning + tool use
```

### Architecture Patterns

**Simple Agent (Steps 1-5)**
```
User → LLM → Response
```

**Tool-Using Agent (Step 6)**
```
User → LLM ⟷ Tools → Response
```

**Memory Agent (Step 7)**
```
User → LLM ⟷ Tools → Response
       ↕
     Memory
```

**ReAct Agent (Step 8)**
```
User → LLM → Think → Act → Observe
       ↑      ↓      ↓      ↓
       └──────┴──────┴──────┘
           Iterate until solved
```

## ️ Helper Utilities

### PromptDebugger
`helper/prompt-debugger.js`

Utility for debugging prompts sent to the LLM. Shows exactly what the model sees, including:
- System prompts
- Function definitions
- Conversation history
- Context state

Usage example in `simple-agent/simple-agent.js`

## ️ Project Structure

```
ai-agents/
├── README.md                          ← You are here
├── intro/
│   ├── intro.js
│   ├── CODE.md
│   └── CONCEPT.md
├── translation/
│   ├── translation.js
│   ├── CODE.md
│   └── CONCEPT.md
├── think/
│   ├── think.js
│   ├── CODE.md
│   └── CONCEPT.md
├── batch/
│   ├── batch.js
│   ├── CODE.md
│   └── CONCEPT.md
├── coding/
│   ├── coding.js
│   ├── CODE.md
│   └── CONCEPT.md
├── simple-agent/
│   ├── simple-agent.js
│   ├── CODE.md
│   └── CONCEPT.md
├── simple-agent-with-memory/
│   ├── simple-agent-with-memory.js
│   ├── memory-manager.js
│   ├── CODE.md
│   └── CONCEPT.md
├── react-agent/
│   ├── react-agent.js
│   ├── CODE.md
│   └── CONCEPT.md
├── helper/
│   └── prompt-debugger.js
├── models/                             ← Place your GGUF models here
└── logs/                               ← Debug outputs
```

## Key Takeaways

### By the end of this repository, you'll understand:

1. **LLMs are stateless**: Context must be managed explicitly
2. **System prompts shape behavior**: Same model, different roles
3. **Function calling enables agency**: Tools transform text generators into agents
4. **Memory is essential**: Agents need to remember across sessions
5. **Reasoning patterns matter**: ReAct > simple prompting for complex tasks
6. **Performance matters**: Parallel processing, streaming, token limits
7. **Debugging is crucial**: PromptDebugger shows what the model actually sees

### What frameworks give you:

Now that you understand the fundamentals, frameworks like LangChain, CrewAI, or AutoGPT provide:
- Pre-built reasoning patterns
- Tool libraries
- Memory management
- Multi-agent orchestration
- Production-ready error handling
- Observability and monitoring

**You'll use them better because you know what they're doing under the hood.**

## Additional Resources

- **node-llama-cpp**: [GitHub](https://github.com/withcatai/node-llama-cpp)
- **Model Hub**: [Hugging Face](https://huggingface.co/models?library=gguf)
- **GGUF Format**: Quantized models for local inference

## Contributing

This is a learning resource. Feel free to:
- Suggest improvements to documentation
- Add more example patterns
- Fix bugs or unclear explanations
- Share what you built!

## License

Educational resource - use and modify as needed for learning.

---

**Built with ❤️ for people who want to truly understand AI agents**

Start with `intro/` and work your way through. Each example builds on the previous one. Read both CODE.md and CONCEPT.md for full understanding.

Happy learning! 
