## Concept: Comprehensive error handling for agents

Agents fail in more ways than regular apps because they orchestrate **multiple unreliable steps**:

- **LLM calls** (timeouts, resource constraints, malformed outputs, runtime exceptions)
- **Tool execution** (network failures, invalid inputs, unavailable services)
- **Workflow logic** (policy guards, partial completion, dependency chains across tools)

This example uses three ideas to make failures safe and understandable:

### 1) Standardized error taxonomy

Use a small set of error classes with **stable codes** and consistent fields:

- **`ValidationError`**: user input is missing/invalid (fail fast; usually not retryable)
- **`LLMCallError`**: LLM provider/model call failed or returned unusable output (often retryable)
- **`ToolExecutionError`**: a tool failed (sometimes retryable, sometimes not)
- **`AgentWorkflowError`**: **orchestration-level** failure - the multi-step run cannot complete as designed.

In production you might split **`AgentWorkflowError`** into finer types (policy, workflow chain, full system outage). This lesson keeps **one class** with a **`step`** field and a short source comment so the **same shape** can stand in for those ideas in a small demo.

Examples in this repo:

- **`policy_guard`** - after validation, a guard blocks the request (demo: user mentions **`u_demo_workflow`**).
- **`resolve_user_profile`** - in degraded mode, **primary retries are exhausted**, **fallback is tried**, and **fallback also fails**; the surfaced error is workflow-level with the inner tool error as **`cause`**.

Each error includes:

- **`code`**: machine-readable, stable identifier (good for metrics and alerting)
- **`userMessage`**: safe, non-technical message shown to users
- **`retryable`**: whether automated retry is appropriate
- **`details`**: structured data for logs (tool name, step name, ids, etc.)
- **`cause`**: original error (to preserve root cause chains)

**`AgentWorkflowError`** additionally carries **`step`**. Its `details` merge `step` with any extra metadata you pass in.

### 2) Classification and recovery strategies

**Normalize, then classify.** **`normalizeUnknownError`** turns arbitrary thrown values into an **`AppError`**. **`classifyError`** adds **`retryable`** and **`type`** (`error.code`) so retries, logs, and user messaging share one pipeline instead of repeating `instanceof` trees.

Recovery strategies (typical ladder), as shown with a real local LLM via `node-llama-cpp`:

- **Timeout**: bound how long any step can stall
- **Retry**: only when **`classifyError`** says **`retryable`** (with backoff and jitter)
- **Fallback**: if the primary tool fails in a **transient** way, run a safer alternative that returns a degraded but useful answer
- **Degraded mode**: if the LLM path fails, delegate to **`runDegradedProfileResolution`** - deterministic extraction of a **`u_<digits>`** id and the same **primary → fallback** tool model, without embedding that logic inline in a huge `catch`
- **Graceful failure**: if recovery isn’t possible, return **`formatUserFacingError`** plus a correlation id

When **both** primary (after retries) and fallback fail in degraded mode, the example promotes that outcome to **`AgentWorkflowError`**: the user still sees one clear message, while **`cause`** retains the underlying tool failure for debugging.

### 3) Separate user messaging from debugging information

Users should see:

- clear next steps (try again, rephrase, shorten input)
- no stack traces or provider internals
- a **reference id** they can share with support

Developers/operators should see:

- the stable error `code`
- structured `details`
- correlation id
- original **`cause`**

For **`AgentWorkflowError`**, the example also prints a **console banner** (step, code, correlation id, messages, details, cause summary) so live demos and local debugging stay readable next to a compact `[agent_error]` log line.

### Deterministic demos and `SIMULATION`

To keep teaching runs predictable, user ids **`u_999`** and **`u_777`** are driven by a small **`SIMULATION`** map (see `error-handling.js`):

- **`u_demo_workflow`** in the text triggers **`policy_guard`**.
- **`SKIP_LLM_DEGRADED u_777`** skips the LLM, enters degraded mode, and uses **`u_777`** so primary and fallback both fail in a reproducible way.

### Why this pattern scales

- **Consistency**: every failure is shaped the same way; unknown errors are normalized before handling
- **Observability**: metrics/alerts group by `code` and by workflow `step`
- **Safety**: sensitive/provider-specific details stay out of user messages
- **Resilience**: transient issues recover automatically; hard failures degrade or surface as a single workflow-level error with preserved **`cause`**
