# Code Explanation: simple-agent.js

This file demonstrates **function calling** - the core feature that transforms an LLM from a text generator into an agent that can take actions using tools.

## Step-by-Step Code Breakdown

### 1. Import and Setup (Lines 1-7)
```javascript
import {defineChatSessionFunction, getLlama, LlamaChatSession} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
import {PromptDebugger} from "../helper/prompt-debugger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;
```
- **defineChatSessionFunction**: Key import for creating callable functions
- **PromptDebugger**: Helper for debugging prompts (covered at the end)
- **debug**: Controls verbose logging

### 2. Initialize and Load Model (Lines 9-17)
```javascript
const llama = await getLlama({debug});
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "Qwen3-1.7B-Q8_0.gguf"
    )
});
const context = await model.createContext({contextSize: 2000});
```
- Uses Qwen3-1.7B model (good for function calling)
- Sets context size to 2000 tokens explicitly

### 3. System Prompt for Time Conversion (Lines 20-23)
```javascript
const systemPrompt = `You are a professional chronologist who standardizes time representations across different systems.
    
Always convert times from 12-hour format (e.g., "1:46:36 PM") to 24-hour format (e.g., "13:46") without seconds 
before returning them.`;
```

**Purpose:**
- Defines agent's role and behavior
- Instructs on output format (24-hour, no seconds)
- Ensures consistency in time representation

### 4. Create Session (Lines 25-28)
```javascript
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
});
```
Standard session with system prompt.

### 5. Define a Tool Function (Lines 30-39)
```javascript
const getCurrentTime = defineChatSessionFunction({
    description: "Get the current time",
    params: {
        type: "object",
        properties: {}
    },
    async handler() {
        return new Date().toLocaleTimeString();
    }
});
```

**Breaking it down:**

**description:** 
- Tells the LLM what this function does
- LLM reads this to decide when to call it

**params:**
- Defines function parameters (JSON Schema format)
- Empty `properties: {}` means no parameters needed
- Type must be "object" even if no properties

**handler:**
- The actual JavaScript function that executes
- Returns current time as string (e.g., "1:46:36 PM")
- Can be async (use await inside)

### How Function Calling Works

```
1. User asks: "What time is it?"
2. LLM reads: 
   - System prompt
   - Available functions (getCurrentTime)
   - Function description
3. LLM decides: "I should call getCurrentTime()"
4. Library executes: handler()
5. Handler returns: "1:46:36 PM"
6. LLM receives result as "tool output"
7. LLM processes: Converts to 24-hour format per system prompt
8. LLM responds: "13:46"
```

### 6. Register Functions (Line 41)
```javascript
const functions = {getCurrentTime};
```
- Creates object with all available functions
- Multiple functions: `{getCurrentTime, getWeather, calculate, ...}`
- LLM can choose which function(s) to call

### 7. Define User Prompt (Line 42)
```javascript
const prompt = `What time is it right now?`;
```
A question that requires using the tool.

### 8. Execute with Functions (Line 45)
```javascript
const a1 = await session.prompt(prompt, {functions});
console.log("AI: " + a1);
```
- **{functions}** makes tools available to the LLM
- LLM will automatically call getCurrentTime if needed
- Response includes tool result processed by LLM

### 9. Debug Prompt Context (Lines 49-55)
```javascript
const promptDebugger = new PromptDebugger({
    outputDir: './logs',
    filename: 'qwen_prompts.txt',
    includeTimestamp: true,
    appendMode: false
});
await promptDebugger.debugContextState({session, model});
```

**What this does:**
- Saves the entire prompt sent to the model
- Shows exactly what the LLM sees (including function definitions)
- Useful for debugging why model does/doesn't call functions
- Writes to `./logs/qwen_prompts_[timestamp].txt`

### 10. Cleanup (Lines 58-61)
```javascript
session.dispose()
context.dispose()
model.dispose()
llama.dispose()
```
Standard cleanup.

## Key Concepts Demonstrated

### 1. Function Calling (Tool Use)

This is what makes it an "agent":
```
Without tools:          With tools:
LLM → Text only        LLM → Can take actions
                              ↓
                       Call functions
                       Access data
                       Execute code
```

### 2. Function Definition Pattern

```javascript
defineChatSessionFunction({
    description: "What the function does",  // LLM reads this
    params: {                               // Expected parameters
        type: "object",
        properties: {
            paramName: {
                type: "string",
                description: "What this param is for"
            }
        },
        required: ["paramName"]
    },
    handler: async (params) => {            // Your code
        // Do something with params
        return result;
    }
});
```

### 3. JSON Schema for Parameters

Uses standard JSON Schema:
```javascript
// No parameters
properties: {}

// One string parameter
properties: {
    city: {
        type: "string",
        description: "City name"
    }
}

// Multiple parameters
properties: {
    a: { type: "number" },
    b: { type: "number" }
},
required: ["a", "b"]
```

### 4. Agent Decision Making

```
User: "What time is it?"
         ↓
    LLM thinks:
    "I need current time"
    "I see function: getCurrentTime"
    "Description matches what I need"
         ↓
    LLM outputs special format:
    {function_call: "getCurrentTime"}
         ↓
    Library intercepts and runs handler()
         ↓
    Handler returns: "1:46:36 PM"
         ↓
    LLM receives: Tool result
         ↓
    LLM applies system prompt:
    Convert to 24-hour format
         ↓
    Final answer: "13:46"
```

## Use Cases

### 1. Information Retrieval
```javascript
const getWeather = defineChatSessionFunction({
    description: "Get weather for a city",
    params: {
        type: "object",
        properties: {
            city: { type: "string" }
        }
    },
    handler: async ({city}) => {
        return await fetchWeather(city);
    }
});
```

### 2. Calculations
```javascript
const calculate = defineChatSessionFunction({
    description: "Perform arithmetic calculation",
    params: {
        type: "object",
        properties: {
            expression: { type: "string" }
        }
    },
    handler: async ({expression}) => {
        return eval(expression); // (Be careful with eval!)
    }
});
```

### 3. Data Access
```javascript
const queryDatabase = defineChatSessionFunction({
    description: "Query user database",
    params: {
        type: "object",
        properties: {
            userId: { type: "string" }
        }
    },
    handler: async ({userId}) => {
        return await db.users.findById(userId);
    }
});
```

### 4. External APIs
```javascript
const searchWeb = defineChatSessionFunction({
    description: "Search the web",
    params: {
        type: "object",
        properties: {
            query: { type: "string" }
        }
    },
    handler: async ({query}) => {
        return await googleSearch(query);
    }
});
```

## Expected Output

When run:
```
AI: 13:46
```

The LLM:
1. Called getCurrentTime() internally
2. Got "1:46:36 PM"
3. Converted to 24-hour format
4. Removed seconds
5. Returned "13:46"

## Debugging with PromptDebugger

The debug output shows the full prompt including function schemas:
```
System: You are a professional chronologist...

Functions available:
- getCurrentTime: Get the current time
  Parameters: (none)

User: What time is it right now?
```

This helps debug:
- Did the model see the function?
- Was the description clear?
- Did parameters match expectations?

## Why This Matters for AI Agents

### Agents = LLMs + Tools

```
LLM alone:                    LLM + Tools:
├─ Generate text              ├─ Generate text
└─ That's it                  ├─ Access real data
                              ├─ Perform calculations
                              ├─ Call APIs
                              ├─ Execute actions
                              └─ Interact with world
```

### Foundation for Complex Agents

This simple example is the foundation for:
- **Research agents**: Search web, read documents
- **Coding agents**: Run code, check errors
- **Personal assistants**: Calendar, email, reminders
- **Analysis agents**: Query databases, compute statistics

All start with basic function calling!

## Best Practices

1. **Clear descriptions**: LLM uses these to decide when to call
2. **Type safety**: Use JSON Schema properly
3. **Error handling**: Handler should catch errors
4. **Return strings**: LLM processes text best
5. **Keep functions focused**: One clear purpose per function

This is the minimum viable agent: one LLM + one tool + proper configuration.
