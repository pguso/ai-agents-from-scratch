(# Concept: simple-agent-with-retry)

## Overview

`simple-agent-with-retry` is a small demonstration agent that combines LLM function-calling with a robust retry wrapper for unreliable tools or external APIs. The agent shows how a model can request an external piece of information (here: the current time) via a defined function, and how that function can tolerate transient failures using an exponential backoff strategy.

The goal is to illustrate practical agent design patterns: clear tool contracts, safe retries, and keeping the LLM focused on conversion/formatting rather than dealing with transient transport errors.

## Core idea (short)

User asks: "What time is it?"
	- LLM decides it needs current time → calls `getCurrentTime()`
	- `getCurrentTime` implementation calls an external/local time provider wrapped with `retryWithBackoff`
	- On transient failure, the wrapper retries; on success it returns a time string (e.g., "1:46:36 PM")
	- LLM converts that to the required normalized form (24-hour, no seconds) and returns it to the user

## Contract: `getCurrentTime` (tool exposed to the LLM)
- Input: none (the LLM calls the function without parameters)
- Output: string — a human-readable time (example: `"1:46:36 PM"`)
- Error modes: may throw/reject for persistent failures (network, platform); transient failures should be retried by the wrapper
- Success criteria: returns a valid time string recognizable by the LLM so it can perform format conversion

## How retry fits into the agent flow

1. LLM emits function call intent for `getCurrentTime`.
2. The agent's function handler invokes the time provider wrapped with `retryWithBackoff`.
3. The wrapper attempts the call, and on transient errors will retry per policy (exponential backoff, optional jitter).
4. If retries succeed, the handler returns the time to the LLM; if retries are exhausted, the handler throws and the LLM must handle the error case (e.g., say it couldn't fetch the time).

## Key options demonstrated in the agent
- `retries`: how many retry attempts after the initial try (tunable based on expected reliability)
- `baseDelay` and `factor`: control the backoff curve
- `jitter`: avoid synchronized retry storms when many clients retry together
- `retryOn`: allow selective retrying (e.g., only for network timeouts, not for invalid responses)

## Edge cases and design notes
- Persistent failure: if external service is down, retries will eventually exhaust; ensure the LLM is given a clear fallback or graceful message.
- Non-idempotent operations: only use retries for idempotent or read-only actions like time lookup; for state-changing operations, design idempotency tokens or avoid blind retries.
- Observability: log attempts, delays, and errors so you can debug retry behavior in production.
- Testing hooks: the sample includes a `simulateFails` option for deterministic tests.

## Example flow (concise)

- User: "What time is it?"
- LLM: calls `getCurrentTime()`
- Handler: calls time provider via `retryWithBackoff` → receives `"1:46:36 PM"`
- LLM: converts to `"13:46"` and replies to the user

## Why this pattern matters

This pattern separates responsibilities: the agent exposes a simple tool contract to the LLM, the tool implementation handles reliability concerns (retries/backoff), and the LLM focuses on reasoning and formatting. This keeps prompts simple and reduces brittle prompt-engineering workarounds for transient infra issues.

## Next steps / improvements
- Add telemetry counters (attempts, failures, average delay)
- Expose a small config file for retry policy tuning per-environment
- Add unit tests covering success, transient failures, and permanent failures

