/**
 * ToolExecutor
 *
 * Executes tools with error handling and timeout
 *
 * @module src/tools/tool-executor.js
 */

import { RetryManager } from '../utils/retry.js';
import { TimeoutManager } from '../utils/timeout.js';
import { ToolExecutionError, asAgentError } from '../utils/errors.js';

export class ToolExecutor {
  constructor(options = {}) {
    this.retry = options.retry ?? new RetryManager(options.retryOptions);
    this.timeout = options.timeout ?? new TimeoutManager(options.timeoutOptions);
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 15_000;
  }

  /**
   * Execute a tool.
   *
   * Tool can be:
   * - function(input, config) -> any
   * - object with `invoke(input, config)` or `call(input, config)`
   */
  async execute(tool, input, config = {}) {
    const name = config.name || tool?.name || tool?.constructor?.name || 'tool';
    const timeoutMs = config.timeoutMs ?? this.defaultTimeoutMs;

    const runOnce = async () => {
      try {
        const fn =
          typeof tool === 'function' ? tool :
          typeof tool?.invoke === 'function' ? tool.invoke.bind(tool) :
          typeof tool?.call === 'function' ? tool.call.bind(tool) :
          null;

        if (!fn) {
          throw new ToolExecutionError(`Invalid tool "${name}" (missing function/invoke/call)`, {
            retryable: false,
            details: { tool: name }
          });
        }

        return await this.timeout.run(() => fn(input, config), {
          timeoutMs,
          details: { tool: name, timeoutMs }
        });
      } catch (err) {
        const normalized = asAgentError(err, { details: { tool: name } });
        throw new ToolExecutionError(`Tool "${name}" failed`, {
          cause: normalized,
          retryable: normalized.retryable,
          userMessage: normalized.userMessage,
          details: normalized.details
        });
      }
    };

    const maxRetries = config.maxRetries ?? 0;
    if (maxRetries <= 0) return await runOnce();

    return await this.retry.run(() => runOnce(), {
      maxRetries,
      isRetryable: (e) => asAgentError(e).retryable
    });
  }
}

export default ToolExecutor;
