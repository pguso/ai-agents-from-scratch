% Retry Utility Concept

## Overview

`retryWithBackoff` is a small, reusable helper that runs an operation (sync or async) and, on failure, retries it according to an exponential backoff policy with optional jitter. It's designed for transient, idempotent operations such as network requests, local RPCs, or small platform calls where occasional timeouts or flakiness are expected.

This concept document explains the intent, options, behavior, and recommended usage patterns for the helper included in this project.

## Purpose

- Improve robustness by automatically retrying transient failures.
- Provide a single, well-tested place to tune retry behavior (delays, caps, jitter).
- Keep calling code (e.g., tool handlers) simple by moving retry complexity into the utility.

## Function contract (high level)

Function: `retryWithBackoff(fn, options?)`

- `fn`: a callable that returns a value or a Promise.
- Returns: the return value of `fn` when successful.
- Throws: rethrows the last error if retries are exhausted or if `retryOn` returns `false` for a given error.

## Important options

- `retries` (number): how many additional attempts after the first call (default e.g. 3 → up to 4 attempts).
- `baseDelay` (ms): initial delay before the first retry.
- `factor` (number): exponential multiplier for delay growth.
- `jitter` (boolean): when true, multiply delay by a random factor (e.g., 0.8–1.2) to avoid synchronized retries.
- `label` (string): human-friendly name used in logs.
- `verbose` (boolean): when true, log attempts and delays for visibility.
- `simulateFails` (number): testing hook to force simulated failures for the first N attempts.
- `retryOn` (err => boolean): predicate to decide whether an error should be retried.

## Behavior details

- Total attempts = 1 + `retries`.
- Delay before attempt N is typically: min(baseDelay * factor^(N-1), cap) (cap prevents excessively long waits).
- If `jitter` is enabled, the computed delay is multiplied by a small random factor to reduce thundering-herd effects.
- If `retryOn(err)` returns `false`, the helper will immediately rethrow the error (no more retries).

## Edge cases and guidance

- Non-idempotent operations: avoid automatic retries or implement idempotency tokens before retrying.
- Long-running operations: ensure the retry policy accounts for operation duration (timeouts + retries may exceed user expectations).
- Error classification: use `retryOn` to filter retriable errors (e.g., retry on network timeouts, not on 4xx client validation errors).
- Backoff cap: pick a sensible upper bound (e.g., 20s) so a failed call doesn't block for too long.

## Example usage (conceptual)

- Wrap a flaky time-fetching helper used by an LLM tool: `await retryWithBackoff(() => fetchTime(), { retries: 2, jitter: true })`.
- Use `retryOn` to retry only on `err.code === 'ETIMEDOUT'` or similar patterns.

## Testing tips

- Unit test success path (fn resolves on first try).
- Unit test transient failure (fn throws first N times then resolves) and assert expected number of attempts.
- Unit test permanent failure (fn always throws) and ensure final error is thrown after expected attempts.
- Use `simulateFails` option for deterministic tests rather than stubbing timers when possible.

## Observability and metrics

- Expose counters for attempts, retries, and failures.
- Record histogram of delays and latency for successful attempts.
- Combine logs with the `label` so you can correlate retries with the calling operation.

## When not to use retries

- For operations that mutate shared state without idempotency.
- When strict single-attempt semantics are required.

## Key takeaways

- `retryWithBackoff` centralizes retry policy and makes tool handlers simpler and more robust.
- Configure `retryOn`, `retries`, and `jitter` deliberately — defaults are convenient but may need tuning for production.
