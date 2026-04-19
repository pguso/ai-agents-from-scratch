/**
 * Example 11: Comprehensive error handling patterns for agent interactions
 *
 * This example uses a real local LLM via `node-llama-cpp` and demonstrates:
 * - Standardized error types for LLM calls, tool execution, and agent workflows
 * - Recovery strategies (retry/backoff/jitter, timeouts, fallbacks, graceful degradation)
 * - User-friendly error messages with correlation ids
 *
 * Run:
 *   node examples/11_error-handling/error-handling.js
 */

import crypto from "node:crypto";
import { defineChatSessionFunction, getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";

// -----------------------------------------------------------------------------
// Error taxonomy (standardized error types)
// -----------------------------------------------------------------------------

class AppError extends Error {
  /**
   * @param {string} code Stable machine-readable error code
   * @param {string} message Developer-facing message
   * @param {{ userMessage?: string, retryable?: boolean, details?: any, cause?: any }=} opts
   */
  constructor(code, message, opts = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.userMessage = opts.userMessage ?? "Something went wrong. Please try again.";
    this.retryable = Boolean(opts.retryable);
    this.details = opts.details;
    this.cause = opts.cause;
  }
}

class ValidationError extends AppError {
  constructor(message, opts = {}) {
    super("VALIDATION_ERROR", message, {
      userMessage: opts.userMessage ?? "I couldn’t understand that request. Please rephrase and try again.",
      retryable: false,
      details: opts.details,
      cause: opts.cause,
    });
  }
}

class LLMCallError extends AppError {
  constructor(message, opts = {}) {
    super("LLM_CALL_FAILED", message, {
      userMessage: opts.userMessage ?? "I’m having trouble generating a response right now. Please try again in a moment.",
      retryable: opts.retryable ?? true,
      details: opts.details,
      cause: opts.cause,
    });
    this.model = opts.model;
  }
}

class ToolExecutionError extends AppError {
  constructor(toolName, message, opts = {}) {
    super("TOOL_EXECUTION_FAILED", message, {
      userMessage:
        opts.userMessage ??
        `I couldn’t run the tool "${toolName}" successfully. You can try again, or choose a different approach.`,
      retryable: opts.retryable ?? false,
      details: { toolName, ...opts.details },
      cause: opts.cause,
    });
    this.toolName = toolName;
  }
}

/**
 * Orchestration-level failure (multi-step agent run). For teaching, think of distinct causes even
 * though this single type carries them all in production-sized demos:
 * - Policy / guard: blocked or invalid workflow path after validation (like a dedicated PolicyError).
 * - Workflow: multi-step tool chain exhausted retries and fallback (like WorkflowError).
 * - System: LLM and all recovery tools failed (like SystemFailureError).
 */
class AgentWorkflowError extends AppError {
  constructor(step, message, opts = {}) {
    super("AGENT_WORKFLOW_FAILED", message, {
      userMessage:
        opts.userMessage ??
        "I ran into a problem while completing your request. Please try again, or provide a bit more detail.",
      retryable: opts.retryable ?? false,
      details: { step, ...opts.details },
      cause: opts.cause,
    });
    this.step = step;
  }
}

// -----------------------------------------------------------------------------
// Recovery utilities (timeouts, retries, classification)
// -----------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, label = "operation") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      controller.signal.addEventListener("abort", () => {
        reject(
          new AppError("TIMEOUT", `${label} timed out after ${ms}ms`, {
            userMessage: "This is taking too long. Please try again.",
            retryable: true,
            details: { label, ms },
          }),
        );
      });
    }),
  ]).finally(() => clearTimeout(timeout));
}

function normalizeUnknownError(err) {
  if (err instanceof AppError) return err;

  return new AppError("UNKNOWN_ERROR", "Unknown error", {
    userMessage: "Something went wrong. Please try again.",
    retryable: false,
    details: { originalName: err?.name, originalMessage: err?.message },
    cause: err,
  });
}

function classifyError(err) {
  const error = normalizeUnknownError(err);
  return {
    error,
    retryable: error instanceof AppError && error.retryable,
    type: error.code,
  };
}

function isRetryable(err) {
  return classifyError(err).retryable;
}

function jitteredBackoffDelay(attempt, { baseDelayMs = 200, maxDelayMs = 3000 } = {}) {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  const jitter = crypto.randomInt(0, Math.max(1, Math.floor(exp * 0.25)));
  return exp + jitter;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{
 *   retries?: number,
 *   baseDelayMs?: number,
 *   maxDelayMs?: number,
 *   label?: string,
 *   retryOn?: (err: any) => boolean
 * }} opts
 */
async function withRetries(fn, opts = {}) {
  const {
    retries = 2,
    baseDelayMs = 200,
    maxDelayMs = 3000,
    label = "operation",
    retryOn = isRetryable,
  } = opts;

  const maxAttempts = retries + 1;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !retryOn(err)) break;

      const delay = jitteredBackoffDelay(attempt, { baseDelayMs, maxDelayMs });
      console.warn(`[retry] ${label} failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms.`);
      await sleep(delay);
    }
  }

  throw lastErr;
}

function formatUserFacingError(err, correlationId) {
  if (err instanceof AppError) {
    return `${err.userMessage}\n\n(Reference: ${correlationId})`;
  }

  return `Something went wrong. Please try again.\n\n(Reference: ${correlationId})`;
}

/**
 * Structured console output for workflow orchestration failures (easy to scan when debugging demos).
 * @param {AgentWorkflowError} err
 * @param {string} correlationId
 */
function printAgentWorkflowErrorBanner(err, correlationId) {
  const divider = "═".repeat(72);
  const rule = "─".repeat(72);
  const cause =
    err.cause instanceof Error
      ? `${err.cause.name}: ${err.cause.message}`
      : err.cause != null
        ? String(err.cause)
        : "(none)";

  console.error(`\n${divider}`);
  console.error(" AGENT WORKFLOW FAILED");
  console.error(divider);
  console.error(` Step:           ${err.step}`);
  console.error(` Code:           ${err.code}`);
  console.error(` Correlation ID: ${correlationId}`);
  console.error(` User-facing:    ${err.userMessage}`);
  console.error(rule);
  console.error(` Developer msg:  ${err.message}`);
  if (err.details && Object.keys(err.details).length > 0) {
    console.error(" Details:", err.details);
  }
  console.error(` Cause:          ${cause}`);
  console.error(`${divider}\n`);
}

// -----------------------------------------------------------------------------
// Tooling (simulate realistic tool failures + fallback)
// -----------------------------------------------------------------------------

/** Centralized deterministic demo rules (readable triggers for learners + tests). */
const SIMULATION = {
  forceNotFound: new Set(["u_999"]),
  /** Primary fails retryably; paired with fallback failure to surface AgentWorkflowError. */
  forcePrimaryAndFallbackFail: new Set(["u_777"]),
};

async function fetchUserFromPrimary({ userId }) {
  const r = Math.random();
  const id = String(userId);
  await sleep(80);

  if (SIMULATION.forceNotFound.has(id)) {
    throw new ToolExecutionError("fetchUserFromPrimary", "User not found", {
      retryable: false,
      userMessage: `I couldn’t find a user with id "${userId}". Check the id and try again.`,
      details: { userId },
    });
  }

  // Deterministic demo: primary always fails transiently so degraded mode can exercise fallback + AgentWorkflowError
  if (SIMULATION.forcePrimaryAndFallbackFail.has(id)) {
    throw new ToolExecutionError("fetchUserFromPrimary", "Primary service temporarily overloaded", {
      retryable: true,
      userMessage: "I couldn’t reach the user service just now. I’ll retry.",
      details: { userId, demo: true },
    });
  }

  if (r < 0.2) {
    throw new ToolExecutionError("fetchUserFromPrimary", "Network error while fetching user profile", {
      retryable: true,
      userMessage: "I couldn’t reach the user service just now. I’ll retry.",
      details: { userId },
    });
  }

  return {
    userId,
    name: "Alex Developer",
    role: "Software Engineer",
    lastLoginIso: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    source: "primary",
  };
}

async function fetchUserFromFallback({ userId }) {
  // Fallback tool: more reliable but lower fidelity
  const id = String(userId);
  await sleep(60);
  // Pairs with forcePrimaryAndFallbackFail: proves AgentWorkflowError when both paths fail
  if (SIMULATION.forcePrimaryAndFallbackFail.has(id)) {
    throw new ToolExecutionError("fetchUserFromFallback", "Fallback service unavailable", {
      retryable: false,
      userMessage: "The backup profile service is down. Try again later.",
      details: { userId, demo: true },
    });
  }
  return {
    userId,
    name: "Alex Developer",
    role: "Engineer",
    lastLoginIso: null,
    source: "fallback",
  };
}

// -----------------------------------------------------------------------------
// LLM + agent workflow (LLM -> tool -> response) with graceful handling
// -----------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const debug = false;
const llama = await getLlama({ debug });
const model = await llama.loadModel({
  modelPath: path.join(__dirname, "..", "..", "models", "Qwen3-1.7B-Q8_0.gguf"),
});
const context = await model.createContext({ contextSize: 2000 });

const systemPrompt = `You are a helpful software engineering assistant.

You can call tools to fetch user profile data.
If the primary tool fails, try the fallback tool.
When you answer the user:
- be concise
- include the user id you used
- if the data came from fallback, mention it clearly
`;

const session = new LlamaChatSession({
  contextSequence: context.getSequence(),
  systemPrompt,
});

const fetchUserPrimaryFn = defineChatSessionFunction({
  description: "Fetch a user profile from the primary user service",
  params: {
    type: "object",
    properties: {
      userId: { type: "string", description: "User id, e.g. u_123" },
    },
    required: ["userId"],
  },
  async handler(params) {
    return await fetchUserFromPrimary(params);
  },
});

const fetchUserFallbackFn = defineChatSessionFunction({
  description: "Fetch a user profile from the fallback user service (less detailed but more reliable)",
  params: {
    type: "object",
    properties: {
      userId: { type: "string", description: "User id, e.g. u_123" },
    },
    required: ["userId"],
  },
  async handler(params) {
    return await fetchUserFromFallback(params);
  },
});

const functions = {
  fetchUserFromPrimary: fetchUserPrimaryFn,
  fetchUserFromFallback: fetchUserFallbackFn,
};

async function promptLLM(prompt, { timeoutMs, retries, correlationId }) {
  return await withRetries(
    async () => {
      try {
        const text = await withTimeout(session.prompt(prompt, { functions, maxTokens: 400 }), timeoutMs, "LLM prompt");
        const trimmed = String(text ?? "").trim();
        if (trimmed.length === 0) {
          throw new LLMCallError("LLM returned empty output", {
            model: "Qwen3-1.7B-Q8_0.gguf",
            retryable: true,
            userMessage: "I didn’t get a usable response from the model. I’ll try again.",
            details: { correlationId },
          });
        }
        return trimmed;
      } catch (err) {
        const { error: normalized } = classifyError(err);

        // If a tool throws, node-llama-cpp typically surfaces it as an exception here.
        // We reclassify it so retry/fallback policies can reason about it.
        if (normalized instanceof ToolExecutionError) throw normalized;
        if (normalized instanceof LLMCallError) throw normalized;

        throw new LLMCallError("LLM prompt failed", {
          model: "Qwen3-1.7B-Q8_0.gguf",
          retryable: normalized.code === "TIMEOUT",
          userMessage: "I’m having trouble generating a response right now. Please try again.",
          details: { correlationId, originalCode: normalized.code },
          cause: err,
        });
      }
    },
    {
      retries,
      label: "LLM prompt",
      retryOn: (err) => classifyError(err).retryable,
    },
  );
}

/**
 * Degraded path: no LLM — resolve a user id and fetch a profile with the same retry → fallback model
 * as a healthy agent would, but orchestrated deterministically (error handler delegates here instead
 * of inlining agent work).
 */
async function runDegradedProfileResolution(userInput, { correlationId, forcedDegradedMatch }) {
  const match = forcedDegradedMatch ?? userInput.match(/\b(u_\d+)\b/i);
  if (!match) {
    throw new ValidationError("No user id found in request", {
      userMessage: 'Include a user id like "u_123" so I can fetch a profile.',
      details: { correlationId },
    });
  }

  const userId = match[1];

  let profile;
  try {
    profile = await withRetries(
      () => withTimeout(fetchUserFromPrimary({ userId }), 1200, "tool:fetchUserFromPrimary"),
      {
        retries: 1,
        label: "tool:fetchUserFromPrimary",
        retryOn: (e) => {
          const { error, retryable } = classifyError(e);
          return error instanceof ToolExecutionError && retryable;
        },
      },
    );
  } catch (toolErr) {
    const { error: toolNormalized } = classifyError(toolErr);
    if (toolNormalized instanceof ToolExecutionError && toolNormalized.retryable) {
      try {
        profile = await withTimeout(fetchUserFromFallback({ userId }), 1200, "tool:fetchUserFromFallback");
      } catch (fallbackErr) {
        // Conceptual "WorkflowError": primary + fallback chain exhausted (vs policy_guard on blocked input).
        throw new AgentWorkflowError(
          "resolve_user_profile",
          "Primary user service had issues and fallback profile fetch also failed.",
          {
            userMessage:
              "I couldn’t load the user profile: the main service failed and the backup path didn’t work either. Please try again shortly.",
            retryable: true,
            details: { correlationId, userId, phase: "degraded_fallback" },
            cause: fallbackErr,
          },
        );
      }
    } else {
      throw toolNormalized;
    }
  }

  const bullets = [
    `- Name: ${profile.name} (${profile.role})`,
    `- Last login: ${profile.lastLoginIso ?? "unknown"} (source: ${profile.source})`,
  ];

  return `Model unavailable; answered via deterministic fallback.\n${bullets.join("\n")}`;
}

async function runAgent(userInput) {
  const correlationId = crypto.randomUUID();

  try {
    // Step 1: validate input early (fast-fail with helpful message)
    if (typeof userInput !== "string" || userInput.trim().length === 0) {
      throw new ValidationError("Empty user input", {
        userMessage: 'Please provide a request (e.g., “Fetch user u_123 and summarize their profile.”).',
      });
    }

    // Scripted demo: orchestration layer detects an impossible path (conceptual PolicyError / guard).
    if (/\bu_demo_workflow\b/i.test(userInput)) {
      throw new AgentWorkflowError(
        "policy_guard",
        "Demo: workflow cannot proceed (simulated blocked branch after validation).",
        {
          userMessage:
            "I can’t complete that request right now because of an internal workflow constraint. Try a normal user id like u_123.",
          retryable: false,
          details: { reason: "demo_blocked_branch", correlationId },
        },
      );
    }

    // Optional: skip the LLM for a reproducible degraded-mode demo (no model flakiness).
    const forcedDegradedMatch = userInput.match(/SKIP_LLM_DEGRADED\s+\b(u_\d+)\b/i);

    // Step 2: LLM-driven tool use with retries + timeout
    // This is a realistic "dev assistant" style request: fetch a profile and produce an answer.
    try {
      if (forcedDegradedMatch) {
        throw new LLMCallError("Skipped LLM for deterministic degraded-mode demo", {
          model: "Qwen3-1.7B-Q8_0.gguf",
          retryable: false,
          userMessage: "(demo) Pretending the model is unavailable to exercise tool fallback.",
          details: { correlationId, demo: "SKIP_LLM_DEGRADED" },
        });
      }

      const finalAnswer = await promptLLM(userInput, {
        timeoutMs: 15_000,
        retries: 1,
        correlationId,
      });
      return { ok: true, correlationId, output: finalAnswer };
    } catch (err) {
      const { error: normalized } = classifyError(err);
      if (!(normalized instanceof LLMCallError)) throw normalized;

      console.warn("[degraded_mode] LLM unavailable; switching to deterministic fallback.", {
        correlationId,
        code: normalized.code,
        message: normalized.message,
      });

      const output = await runDegradedProfileResolution(userInput, { correlationId, forcedDegradedMatch });
      return { ok: true, correlationId, output };
    }
  } catch (err) {
    const { error: normalized } = classifyError(err);

    if (normalized instanceof AgentWorkflowError) {
      printAgentWorkflowErrorBanner(normalized, correlationId);
    }

    // In a real app: log normalized + stack + cause chain to observability here
    console.error("[agent_error]", {
      correlationId,
      code: normalized.code,
      name: normalized.name,
      message: normalized.message,
      details: normalized.details,
    });

    return {
      ok: false,
      correlationId,
      output: formatUserFacingError(normalized, correlationId),
    };
  }
}

// -----------------------------------------------------------------------------
// Demo
// -----------------------------------------------------------------------------

const inputs = [
  "Fetch user u_123 and summarize their profile in 2 bullet points.",
  "Fetch user u_999 and tell me when they last logged in.",
  // Demo: AgentWorkflowError — intentional orchestration / policy failure after validation
  "Please fetch profile for u_demo_workflow.",
  // Demo: AgentWorkflowError — degraded path: primary(u_777) fails retry ably, fallback(u_777) fails → workflow error
  "SKIP_LLM_DEGRADED u_777",
  "",
];

for (const input of inputs) {
  console.log("\n" + "-".repeat(80));
  console.log("USER:", JSON.stringify(input));
  const result = await runAgent(input);
  console.log(result.ok ? "\nASSISTANT:\n" + result.output : "\nASSISTANT (error):\n" + result.output);
}

// Clean up (important with local models)
session.dispose();
context.dispose();
model.dispose();
llama.dispose();
