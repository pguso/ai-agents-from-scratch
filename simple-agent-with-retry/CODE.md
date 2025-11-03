# Code Explanation: simple-agent-with-retry.js

This file extends the basic `simple-agent` example by integrating a small retry helper (`retryWithBackoff`) to make tool calls and session prompts more resilient to transient failures. The file demonstrates two patterns:

- Wrapping a flaky tool implementation (`getCurrentTime`) with `retryWithBackoff` so transient errors are retried transparently.
- Wrapping a high-level `session.prompt(...)` call with the same helper when the whole LLM interaction may be unreliable.

Below is a step-by-step explanation mirroring the code structure.

## 1. Imports and setup

```javascript
import {defineChatSessionFunction, getLlama, LlamaChatSession} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
import {PromptDebugger} from "../helper/prompt-debugger.js";
import { retryWithBackoff } from "./retry-util.js";
```

- `defineChatSessionFunction` — used to expose functions/tools to the LLM.
- `PromptDebugger` — helper to dump and inspect the prompt/context sent to the model.
- `retryWithBackoff` — the retry helper that centralizes retry/backoff logic.

We also compute `__dirname` and set a `debug` flag for the low-level library.

## 2. Initialize the model and context

The code loads the `llama` runtime, then loads a model from `models/` and creates a `context` with a fixed token size.

Key lines:

```javascript
const llama = await getLlama({debug});
const model = await llama.loadModel({ modelPath: path.join(__dirname, "../", "models", "hf_Qwen_Qwen3-1.7B.Q8_0.gguf") });
const context = await model.createContext({contextSize: 2000});
```

Notes:

- The model and context creation are asynchronous and may take time — in production you'd add lifecycle management around them.

## 3. System prompt

The system prompt instructs the agent to act as a chronologist and standardize time formats. This is the same behavior as the simple-agent example but is important to repeat because tool outputs are raw and the LLM is expected to perform the conversion.

```javascript
const systemPrompt = `You are a professional chronologist who standardizes time representations across different systems.
    
Always convert times from 12-hour format (e.g., "1:46:36 PM") to 24-hour format (e.g., "13:46") without seconds 
before returning them.`;
```

## 4. Create a chat session

```javascript
const session = new LlamaChatSession({ contextSequence: context.getSequence(), systemPrompt, });
```

The session holds the conversation state and provides the `prompt()` convenience used later.

## 5. Define the `getCurrentTime` tool with retries

This tool illustrates how to wrap a flaky operation inside `retryWithBackoff`.

Important parts of the handler:

- The inner function (passed to `retryWithBackoff`) simulates an unreliable external API by randomly throwing an error ~50% of the time.
- On success it returns `new Date().toLocaleTimeString()` (a human-friendly string the LLM will convert).
- The `retryWithBackoff` call is configured with `retries`, `baseDelay`, `label`, and `simulateFails` (a deterministic testing hook).

Why wrap the tool itself?

- Tool implementations are the natural place to handle transient infrastructure problems. The LLM only needs a stable tool contract and doesn't have to reason about retries.
- This keeps the prompt and system design simple and robust.

Excerpt:

```javascript
const getCurrentTime = defineChatSessionFunction({
  description: "Get the current time",
  params: { type: "object", properties: {} },
  async handler() {
    return retryWithBackoff(async () => {
      if (Math.random() < 0.5) throw new Error("Random API timeout");
      return new Date().toLocaleTimeString();
    }, {
      retries: 2,
      baseDelay: 300,
      label: "getCurrentTime tool function",
      simulateFails: 1
    });
  }
});
```

Notes on options used here:

- `retries: 2` → up to 3 total attempts.
- `baseDelay: 300` ms and default exponential factor (2) create a growing wait between attempts.
- `simulateFails: 1` is only for deterministic testing/demo, and should be disabled in production.

## 6. Register functions and prompt the model (with retry)

We register the function with the session and then call `session.prompt(prompt, {functions})` — however, the example wraps even the full prompt call with `retryWithBackoff`. This shows using the helper not only for tool implementations but also for higher-level interactions that might intermittently fail.

```javascript
const functions = {getCurrentTime};
const prompt = `What time is it right now?`;

const a1 = await retryWithBackoff(() => session.prompt(prompt, {functions}), {
  retries: 3,
  baseDelay: 400,
  factor: 2,
  jitter: true,
  label: "LLM session.prompt",
  simulateFails: 2,
  retryOn: (err) => true
});

console.log("AI: " + a1);
```

Why wrap the `session.prompt` call?

- Some upstream runtimes, libraries, or I/O layers may be flaky. Wrapping the high-level call gives a safety net for transient RPC failures during model inference or I/O that aren't specific to a single tool.

Important: use this sparingly for idempotent interactions — avoid retrying operations that would have side effects without idempotency guarantees.

## 7. Prompt debugging and context inspection

After the conversation, the code uses `PromptDebugger` to write the prompt and context to `./logs/qwen_prompts.txt` for offline inspection. This helps verify whether the model saw the function schema, system prompt, and the tool result.

```javascript
const promptDebugger = new PromptDebugger({ outputDir: './logs', filename: 'qwen_prompts.txt', includeTimestamp: true, appendMode: false });
await promptDebugger.debugContextState({session, model});
```

## 8. Cleanup

Always dispose of session/context/model/runtime objects to free native resources:

```javascript
session.dispose();
context.dispose();
model.dispose();
llama.dispose();
```

## Key concepts demonstrated

- Centralized retry policy: `retryWithBackoff` provides consistent semantics across the codebase.
- Tool contracts vs implementation: the LLM sees a simple `getCurrentTime` description; implementation deals with reliability.
- Jitter and exponential backoff: helps avoid thundering-herd and improves stability in distributed environments.
- Testing hooks: `simulateFails` helps write deterministic tests without complex network stubbing.

## Best practices and tips

- Only retry idempotent or read-only operations by default. For mutating operations, add idempotency keys or manual guards.
- Use `retryOn` to narrow retries to transient error classes (timeouts, 5xx responses) and avoid retrying 4xx client errors.
- Tune `retries`, `baseDelay` and `factor` based on latency/SLAs. Keep an upper cap on backoff (the helper uses 20s by default).
- Enable `jitter` in production to reduce synchronized retries.
- Log attempts and expose metrics (attempt count, retries, latency) for observability.

## Testing suggestions

- Unit tests:
  - Success path (fn resolves first try).
  - Transient failure path (fn throws N times then resolves) asserting the number of attempts.
  - Permanent failure path (fn always throws) asserting final error is propagated.
  - Use `simulateFails` for deterministic tests instead of stubbing timers.

## Example expected output

When successful, the LLM should return a normalized time like:

```
AI: 13:46
```

This shows the tool returned a human-readable time (e.g., `"1:46:36 PM"`) and the LLM converted it to `"13:46"` per the system prompt.

## Next steps you might want

- Add small unit tests under a `test/` folder using a test runner (Jest/Mocha) to exercise `retry-util.js`.
- Replace `Math.random()` simulation with a pluggable provider in production.
- Add telemetry (Prometheus counters or simple structured logs) to record retry statistics.
