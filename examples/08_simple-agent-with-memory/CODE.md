# Code Explanation: simple-agent-with-memory.js

This example extends the simple agent with **persistent memory**, enabling it to remember information across sessions while intelligently avoiding duplicate saves.

## Key Components

### 1. MemoryManager Import
```javascript
import {MemoryManager} from "./memory-manager.js";
```
Custom class for persisting agent memories to JSON files with unified memory storage.

### 2. Initialize Memory Manager
```javascript
const memoryManager = new MemoryManager('./agent-memory.json');
const memorySummary = await memoryManager.getMemorySummary();
```
- Loads existing memories from file
- Generates formatted summary for system prompt
- Handles migration from old memory schemas

### 3. Memory-Aware System Prompt with Reasoning
```javascript
const systemPrompt = `
You are a helpful assistant with long-term memory.

Before calling any function, always follow this reasoning process:

1. **Compare** new user statements against existing memories below.
2. **If the same key and value already exist**, do NOT call saveMemory again.
   - Instead, simply acknowledge the known information.
   - Example: if the user says "My name is Malua" and memory already says "user_name: Malua", reply "Yes, I remember your name is Malua."
3. **If the user provides an updated value** (e.g., "I actually prefer sushi now"), 
   then call saveMemory once to update the value.
4. **Only call saveMemory for genuinely new information.**

When saving new data, call saveMemory with structured fields:
- type: "fact" or "preference"
- key: short descriptive identifier (e.g., "user_name", "favorite_food")
- value: the specific information (e.g., "Malua", "chinua")

Examples:
saveMemory({ type: "fact", key: "user_name", value: "Malua" })
saveMemory({ type: "preference", key: "favorite_food", value: "chinua" })

${memorySummary}
`;
```

**What this does:**
- Includes existing memories in the prompt
- Provides explicit reasoning guidelines to prevent duplicate saves
- Teaches the agent to compare before saving
- Instructs when to update vs. acknowledge existing data

### 4. saveMemory Function
```javascript
const saveMemory = defineChatSessionFunction({
    description: "Save important information to long-term memory (user preferences, facts, personal details)",
    params: {
        type: "object",
        properties: {
            type: {
                type: "string",
                enum: ["fact", "preference"]
            },
            key: { type: "string" },
            value: { type: "string" }
        },
        required: ["type", "key", "value"]
    },
    async handler({ type, key, value }) {
        await memoryManager.addMemory({ type, key, value });
        return `Memory saved: ${key} = ${value}`;
    }
});
```

**What it does:**
- Uses structured key-value format for all memories
- Saves both facts and preferences with the same method
- Automatically handles duplicates (updates if value changes)
- Persists to JSON file
- Returns confirmation message

**Parameter Structure:**
- `type`: Either "fact" or "preference"
- `key`: Short identifier (e.g., "user_name", "favorite_food")
- `value`: The actual information (e.g., "Alex", "pizza")

### 5. Example Conversation
```javascript
const prompt1 = "Hi! My name is Alex and I love pizza.";
const response1 = await session.prompt(prompt1, {functions});
// Agent calls saveMemory twice:
// - saveMemory({ type: "fact", key: "user_name", value: "Alex" })
// - saveMemory({ type: "preference", key: "favorite_food", value: "pizza" })

const prompt2 = "What's my favorite food?";
const response2 = await session.prompt(prompt2, {functions});
// Agent recalls from memory: "Pizza"
```

## How Memory Works

### Flow Diagram
```
Session 1:
User: "My name is Alex and I love pizza"
  ↓
Agent calls: saveMemory({ type: "fact", key: "user_name", value: "Alex" })
Agent calls: saveMemory({ type: "preference", key: "favorite_food", value: "pizza" })
  ↓
Saved to: agent-memory.json

Session 2 (after restart):
1. Load memories from agent-memory.json
2. Add to system prompt
3. Agent sees: "user_name: Alex" and "favorite_food: pizza"
4. Can use this information in responses

Session 3:
User: "My name is Alex"
  ↓
Agent compares: user_name already = "Alex"
  ↓
No function call! Just acknowledges: "Yes, I remember your name is Alex."
```

## The MemoryManager Class

Located in `memory-manager.js`:
```javascript
class MemoryManager {
  async loadMemories()           // Load from JSON (handles schema migration)
  async saveMemories()           // Write to JSON
  async addMemory()              // Unified method for all memory types
  async getMemorySummary()       // Format memories for system prompt
  extractKey()                   // Helper for migration
  extractValue()                 // Helper for migration
}
```

**Benefits:**
- Single unified method for all memory types
- Automatic duplicate detection and prevention
- Automatic value updates when information changes

## Key Concepts

### 1. Structured Memory Format
All memories now use a consistent structure:
```javascript
{
  type: "fact" | "preference",
  key: "user_name",           // Identifier
  value: "Alex",              // The actual data
  source: "user",             // Where it came from
  timestamp: "2025-10-29..."  // When it was saved/updated
}
```

### 2. Intelligent Duplicate Prevention
The agent is trained to:
- **Compare** before saving
- **Skip** if data is identical
- **Update** if value changed
- **Acknowledge** existing memories instead of re-saving

### 3. Persistent State
- Memories survive script restarts
- Stored in JSON file with metadata
- Loaded at startup and injected into prompt

### 4. Memory Integration in System Prompt
Memories are automatically formatted and injected:
```
=== LONG-TERM MEMORY ===

Known Facts:
- user_name: Alex
- location: Paris

User Preferences:
- favorite_food: pizza
- preferred_language: French
```

## Why This Matters

**Without memory:** Agent starts fresh every time, asks same questions repeatedly

**With basic memory:** Agent remembers, but may save duplicates wastefully

**With smart memory:** Agent remembers AND avoids redundant saves by reasoning first

This enables:
- **Personalized responses** based on user history
- **Efficient memory usage** (no duplicate entries)
- **Natural conversations** that feel continuous
- **Stateful agents** that maintain context
- **Automatic updates** when information changes

## Expected Output

**First run:**
```
User: "Hi! My name is Alex and I love pizza."
AI: "Nice to meet you, Alex! I've noted that you love pizza."
[Calls saveMemory twice - new information saved]
```

**Second run (after restart):**
```
User: "What's my favorite food?"
AI: "Your favorite food is pizza! You mentioned that you love it."
[No function calls - recalls from loaded memory]
```

**Third run (duplicate statement):**
```
User: "My name is Alex."
AI: "Yes, I remember your name is Alex!"
[No function call - recognizes duplicate, just acknowledges]
```

**Fourth run (updated information):**
```
User: "I actually prefer sushi now."
AI: "Got it! I've updated your favorite food to sushi."
[Calls saveMemory once - updates existing value]
```

## Reasoning Process

The system prompt explicitly guides the agent through this decision tree:
```
New user statement
    ↓
Compare to existing memories
    ↓
    ├─→ Exact match? → Acknowledge only (no save)
    ├─→ Updated value? → Save to update
    └─→ New information? → Save as new
```

This reasoning-first approach makes the agent more intelligent and efficient with memory operations!