# Code Explanation: error-handling.js

This file demonstrates **comprehensive error handling for agent-style programs**: a typed error taxonomy, timeouts and retries with backoff, simulated tool failures, **degraded mode** when the LLM path fails, and **`AgentWorkflowError`** when orchestration breaks. It runs locally with **`node-llama-cpp`** and a GGUF model (same stack as the other agent examples).

**Run:** `node examples/11_error-handling/error-handling.js`

---

## Step-by-Step Code Breakdown

### 1. Imports 

```javascript
import crypto from "node:crypto";
import { defineChatSessionFunction, getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";
```

**What's happening:**
- **`crypto`** - UUIDs for correlation ids (`randomUUID`) and jitter for retry delays (`randomInt`).
- **`node-llama-cpp`** - Load the model, chat session, and **`defineChatSessionFunction`** for tools.
- **`url` / `path`** - Resolve **`__dirname`** in an ES module and join paths to the **`.gguf`** file.

---

### 2. Error taxonomy 

```javascript
class AppError extends Error { /* code, userMessage, retryable, details, cause */ }
class ValidationError extends AppError { /* VALIDATION_ERROR */ }
class LLMCallError extends AppError { /* LLM_CALL_FAILED; optional model */ }
class ToolExecutionError extends AppError { /* TOOL_EXECUTION_FAILED; toolName */ }
class AgentWorkflowError extends AppError { /* AGENT_WORKFLOW_FAILED; step */ }
```

**Purpose:**
- **`AppError`** - One shape for logs, retries, and user-facing text: stable **`code`**, safe **`userMessage`**, structured **`details`**, optional **`cause`**.
- Subclasses set sensible defaults (e.g. validation is not retryable; tools often are not, unless you pass **`retryable: true`**).
- **`AgentWorkflowError`** adds **`step`** (e.g. `policy_guard`, `resolve_user_profile`) for orchestration-level failures. The comment in source explains how this one class can stand in for policy / workflow / system-style errors in a small demo.

---

### 3. `sleep` 

Simple `Promise`-based delay. Used by **`withRetries`** between attempts and inside fake “network” tools.

---

### 4. `withTimeout` 

**`Promise.race`** between the real work and a timer. On timeout, rejects with an **`AppError`** with code **`TIMEOUT`**, **`retryable: true`**, and **`details: { label, ms }`**. The timer is cleared in **`finally`**.

**Why it matters:** Every LLM or tool call that could hang should be bounded so the agent can recover instead of stalling forever.

---

### 5. `normalizeUnknownError` 

If the thrown value is already an **`AppError`**, return it. Otherwise wrap as **`UNKNOWN_ERROR`** (non-retryable), stash original name/message in **`details`**, set **`cause`** to the original error.

**Why it matters:** Catch blocks often receive **`Error`**, strings, or library-specific types; normalization makes **`retryOn`** and **`formatUserFacingError`** predictable.

---

### 6. `classifyError` 

Calls **`normalizeUnknownError`**, then returns **`{ error, retryable, type }`** where **`type`** is **`error.code`**.

**Why it matters:** One place to decide “retry?” instead of repeating **`instanceof`** checks across **`promptLLM`**, **`runAgent`**, and **`withRetries`** predicates.

---

### 7. `isRetryable` 

Returns **`classifyError(err).retryable`**. Used as the **default** **`retryOn`** for **`withRetries`**.

---

### 8. `jitteredBackoffDelay` 

Exponential delay capped at **`maxDelayMs`**, plus **random jitter** via **`crypto.randomInt`**, so many clients don’t retry in lockstep.

---

### 9. `withRetries` 

Runs **`fn`** up to **`retries + 1`** times. After a failure, if there are attempts left and **`retryOn(err)`** is true, waits (**`sleep`** + **`jitteredBackoffDelay`**), logs **`[retry]`**, and retries. Otherwise throws **`lastErr`**.

---

### 10. `formatUserFacingError` 

Builds the string shown to the “user” in the demo: **`userMessage`** plus **`(Reference: <correlationId>)`**, or a generic fallback if the error wasn’t an **`AppError`**.

---

### 11. `printAgentWorkflowErrorBanner` 

When an **`AgentWorkflowError`** is caught, prints a bordered block to **stderr**: step, code, correlation id, messages, **`details`**, and a short summary of **`cause`**. Complements the one-line **`[agent_error]`** JSON log.

---

### 12. `SIMULATION` and fake tools 

```javascript
const SIMULATION = {
  forceNotFound: new Set(["u_999"]),
  forcePrimaryAndFallbackFail: new Set(["u_777"]),
};
```

**`fetchUserFromPrimary`** - Simulates latency; **`u_999`** > non-retryable “not found”; **`u_777`** > always retryable primary failure (demo); otherwise ~20% random transient failure; success returns a profile with **`source: "primary"`**.

**`fetchUserFromFallback`** - Lower-fidelity profile; for **`u_777`** throws so the **primary > fallback** chain can surface **`AgentWorkflowError`** deterministically.

---

### 13. Initialize model and session 

Same pattern as **`simple-agent.js`**: **`getLlama`**, **`loadModel`** (path to **`models/Qwen3-1.7B-Q8_0.gguf`**), **`createContext`**, **`LlamaChatSession`** with a **system prompt** that tells the model it can fetch users via tools.

---

### 14. Register tools 

Two **`defineChatSessionFunction`** wrappers call **`fetchUserFromPrimary`** and **`fetchUserFromFallback`** with JSON Schema **`userId`**. **`functions`** is passed into **`session.prompt`** so the LLM can invoke tools by name.

---

### 15. `promptLLM` 

Wraps **`session.prompt`** with **`withTimeout`**, **`withRetries`**, and correlation-aware errors:

- Empty trimmed response > **`LLMCallError`** (retryable).
- **`catch`**: **`classifyError`**; rethrows **`ToolExecutionError`** / **`LLMCallError`** unchanged; anything else becomes **`LLMCallError`** with **`retryable`** only if the normalized failure was **`TIMEOUT`** (**`cause`** preserved).
- **`retryOn`**: **`(err) => classifyError(err).retryable`**.

---

### 16. `runDegradedProfileResolution` 

Runs **without** the LLM after the LLM path failed with **`LLMCallError`**:

1. Extract **`u_<digits>`** from **`SKIP_LLM_DEGRADED`** match or free text; else **`ValidationError`**.
2. **`withRetries`** + **`withTimeout`** on primary; **`retryOn`** only for **retryable** **`ToolExecutionError`**.
3. If primary still fails with retryable tool error > try **`fetchUserFromFallback`**. If fallback throws > **`AgentWorkflowError`** (**`resolve_user_profile`**, **`cause`** = fallback error).
4. Returns a short bullet answer prefixed with **“Model unavailable; answered via deterministic fallback.”**

---

### 17. `runAgent` 

**Flow:**

1. **`correlationId = crypto.randomUUID()`**.
2. Empty input > **`ValidationError`**.
3. Text contains **`u_demo_workflow`** > **`AgentWorkflowError`** (**`policy_guard`**) - demo guard after validation.
4. **`SKIP_LLM_DEGRADED u_<digits>`** > forces **`LLMCallError`** without calling the model (deterministic degraded demo).
5. Else **`promptLLM`**. Success > **`{ ok: true, output }`**.
6. **`catch`** only **`LLMCallError`** > log **`[degraded_mode]`**, call **`runDegradedProfileResolution`**, return **`ok: true`** with degraded output.
7. Any other error propagates to the outer **`catch`**: **`classifyError`**, optional **`printAgentWorkflowErrorBanner`** for **`AgentWorkflowError`**, **`console.error("[agent_error]", …)`**, return **`{ ok: false, output: formatUserFacingError(...) }`**.

---

### 18. Demo loop and cleanup 

**`inputs`** runs a fixed set of strings (happy path, **`u_999`**, **`u_demo_workflow`**, **`SKIP_LLM_DEGRADED u_777`**, empty). Each iteration prints **`USER:`**, **`runAgent`**, then assistant text or error text.

**Dispose:** **`session`**, **`context`**, **`model`**, **`llama`** - important for local/native bindings.

---

## Key Concepts Demonstrated

### 1. Typed errors + stable codes

Dashboards and alerts can group by **`code`**. Users never see **`details`** or stacks-only **`userMessage`** and a **reference id**.

### 2. Classify, then retry

**`normalizeUnknownError` > `classifyError` > `retryable`** keeps **`withRetries`** and **`promptLLM`** aligned on what counts as transient.

### 3. Timeout > retry > fallback > degraded mode

**`withTimeout`** bounds wait time. **`withRetries`** handles flaky LLM or tools. **`runDegradedProfileResolution`** is the **deterministic** path when the LLM path is unusable but you can still complete work with tools.

### 4. `AgentWorkflowError` vs tool errors

A **tool** throws **`ToolExecutionError`**. When **policy** blocks or **primary + fallback** both fail in orchestrated degraded flow, the surfaced error is **`AgentWorkflowError`** with **`cause`** pointing at the inner failure.

---

## Expected Output (representative)

When you run the script you will see separator lines, **`USER:`** lines, and either **`ASSISTANT:`** or **`ASSISTANT (error):`**. For **`u_demo_workflow`** and for **`SKIP_LLM_DEGRADED u_777`** (when fallback fails), **stderr** shows the **AGENT WORKFLOW FAILED** banner plus **`[agent_error]`** JSON. **`[retry]`** and **`[degraded_mode]`** lines appear when retries or degraded path activate.

Exact wording varies slightly (e.g. LLM output on the first prompt depends on the model).

---

## Best Practices

1. **Bound time** on LLM and tool calls (**`withTimeout`**).
2. **Retry only transient failures**; use **`classifyError`** (or equivalent) so validation errors are never retried blindly.
3. **Jitter** backoff to avoid synchronized retries.
4. **Correlation ids** on every user-visible error and on structured logs.
5. **Separate** operator logs (**`[agent_error]`**, banners) from what you show end users (**`formatUserFacingError`**).
6. **Dispose** native/model resources when the script exits.

---

## Why This Matters for AI Agents

Agents stack **LLM + tools + orchestration**. Failures can originate from any layer; without taxonomy and classification, you either **retry everything** (wasteful) or **retry nothing** (fragile). This example shows a minimal but complete path from **single-call errors** to **workflow-level** **`AgentWorkflowError`**, with a clear upgrade path to circuit breakers, real telemetry, and production-grade policy types.
