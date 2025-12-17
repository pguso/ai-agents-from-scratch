# Code Explanation: aot-agent.js

This example demonstrates the **Atom of Thought** prompting pattern using a mathematical calculator as the domain.

## Three-Phase Architecture

### Phase 1: Planning (LLM)
```javascript
async function generatePlan(userPrompt) {
    const grammar = await llama.createGrammarForJsonSchema(planSchema);
    const planText = await session.prompt(userPrompt, { grammar });
    return grammar.parse(planText);
}
```

**Key points:**
- LLM outputs **structured JSON** (enforced by grammar)
- LLM does NOT execute calculations
- Each atom represents one operation
- Dependencies are explicit (`dependsOn` array)

**Example output:**
```json
{
  "atoms": [
    {"id": 1, "kind": "tool", "name": "add", "input": {"a": 15, "b": 7}},
    {"id": 2, "kind": "tool", "name": "multiply", "input": {"a": "<result_of_1>", "b": 3}},
    {"id": 3, "kind": "tool", "name": "subtract", "input": {"a": "<result_of_2>", "b": 10}},
    {"id": 4, "kind": "final", "name": "report", "dependsOn": [3]}
  ]
}
```

### Phase 2: Validation (System)
```javascript
function validatePlan(plan) {
    const allowedTools = new Set(Object.keys(tools));
    
    for (const atom of plan.atoms) {
        if (ids.has(atom.id)) throw new Error(`Duplicate ID`);
        if (atom.kind === "tool" && !allowedTools.has(atom.name)) {
            throw new Error(`Unknown tool: ${atom.name}`);
        }
    }
}
```

**Validates:**
- No duplicate atom IDs
- Only allowed tools are referenced
- Dependencies make sense
- JSON structure is correct

### Phase 3: Execution (System)
```javascript
function executePlan(plan) {
    const state = {};
    
    for (const atom of sortedAtoms) {
        // Resolve dependencies
        let resolvedInput = {};
        for (const [key, value] of Object.entries(atom.input)) {
            if (value.startsWith('<result_of_')) {
                const refId = parseInt(value.match(/\d+/)[0]);
                resolvedInput[key] = state[refId];
            }
        }
        
        // Execute
        state[atom.id] = tools[atom.name](resolvedInput.a, resolvedInput.b);
    }
}
```

**Key behaviors:**
- Executes atoms in order (sorted by ID)
- Resolves `<result_of_N>` references from state
- Each atom stores its result in `state[atom.id]`
- Execution is **deterministic** (same plan + same state = same result)

## Why This Matters

### Comparison with ReAct

| Aspect | ReAct | Atom of Thought |
|--------|-------|-----------------|
| **Planning** | Implicit (in LLM reasoning) | Explicit (JSON structure) |
| **Execution** | LLM decides next step | System follows plan |
| **Validation** | None | Before execution |
| **Debugging** | Hard (trace through text) | Easy (inspect atoms) |
| **Testing** | Hard (mock LLM) | Easy (test executor) |
| **Failures** | May hallucinate | Fail at specific atom |

### Benefits

1. **No hidden reasoning**: Every operation is an explicit atom
2. **Testable**: Execute plan without LLM involvement
3. **Debuggable**: Know exactly which atom failed
4. **Auditable**: Plan is a data structure, not text
5. **Deterministic**: Same input = same output (given same plan)

## Tool Implementation

Tools are **pure functions** with no side effects:
```javascript
const tools = {
    add: (a, b) => {
        const result = a + b;
        console.log(`EXECUTING: add(${a}, ${b}) = ${result}`);
        return result;
    },
    // ... more tools
};
```

**Why pure functions?**
- Easy to test
- Easy to replay
- No hidden state
- Composable

## State Flow
```
User Question
      ↓
[LLM generates plan]
      ↓
{atoms: [...]} ← JSON plan
      ↓
[System validates]
      ↓
Plan valid
      ↓
[System executes atom 1] → state[1] = result
      ↓
[System executes atom 2] → state[2] = result (uses state[1])
      ↓
[System executes atom 3] → state[3] = result (uses state[2])
      ↓
Final Answer
```

## Error Handling
```javascript
// Atom validation fails → re-prompt LLM
validatePlan(plan); // throws if invalid

// Tool execution fails → stop at that atom
if (b === 0) throw new Error("Division by zero");

// Dependency missing → clear error message
if (!(depId in state)) {
    throw new Error(`Atom ${atom.id} depends on incomplete atom ${depId}`);
}
```

## When to Use AoT

✅ **Use AoT when:**
- Execution must be auditable
- Failures must be recoverable
- Multiple steps with dependencies
- Testing is important
- Compliance matters

❌ **Don't use AoT when:**
- Single-step tasks
- Creative/exploratory tasks
- Brainstorming
- Natural conversation

## Extension Ideas

1. **Add compensation atoms** for rollback
2. **Add retry logic** per atom
3. **Parallelize independent atoms** (atoms with no shared dependencies)
4. **Persist plan** for debugging
5. **Visualize atom graph** (dependency tree)