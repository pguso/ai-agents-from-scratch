# Concept: Function Calling & Tool Use

## Overview

Function calling transforms LLMs from text generators into agents that can take actions and interact with the world.

## What Makes an Agent?

```
Text Generator              Agent
──────────────             ──────
LLM → Text only            LLM + Tools → Can act
```

**Function calling** lets the LLM invoke predefined functions to access data or perform actions it cannot do alone.

## The Core Idea

```
User: "What time is it?"
       ↓
LLM thinks: "I need current time"
       ↓  
LLM calls: getCurrentTime()
       ↓
Tool returns: "1:46:36 PM"
       ↓
LLM responds: "It's 13:46"
```

This is agency - the ability to DO, not just SAY.

## How It Works

### 1. Function Definition
```javascript
getCurrentTime = {
  description: "Get the current time",
  handler: () => new Date().toLocaleTimeString()
}
```

### 2. LLM Sees Available Tools
```
Available functions:
- getCurrentTime: "Get the current time"
- getWeather: "Get weather for a city"  
- calculate: "Perform math"
```

### 3. LLM Decides When to Use
```
"What time?" → getCurrentTime() ✓
"What's 5+5?" → calculate() ✓
"Tell a joke" → No tool needed
```

## Real-World Applications

**Personal Assistant**: Calendar, email, reminders
**Research Agent**: Web search, document reading
**Coding Assistant**: File operations, code execution
**Data Analyst**: Database queries, calculations

## Key Takeaway

Function calling is THE feature that enables AI agents. Without it, LLMs can only talk. With it, they can act.

This is the foundation of all modern agent systems.
