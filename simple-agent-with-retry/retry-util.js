/**
 * Retry an asynchronous (or synchronous) operation with exponential backoff and optional jitter.
 *
 * This wrapper will call the provided function `fn` and, on failure, will retry it according to
 * the supplied options. The function increments an internal attempt counter before each call,
 * so the `retries` option specifies how many retry attempts will be made after the initial call
 * (i.e. total attempts = 1 + retries). Delay between attempts grows exponentially by `factor`
 * and is capped at 20_000 ms. When `jitter` is enabled, the computed delay is multiplied by a
 * random factor in the range [0.8, 1.2].
 *
 * @template T
 * @param {number} [options.baseDelay=300]
 *   Base delay in milliseconds used for the backoff calculation. The delay for attempt N (1-based)
 *   is calculated as baseDelay * factor^(N-1) (before applying jitter and capping).
 *
 * @param {number} [options.factor=2]
 *   Exponential multiplier applied to the delay each attempt. A factor of 2 doubles the delay
 *   each retry.
 *
 * @param {boolean} [options.jitter=false]
 *   When true, applies random jitter to the delay. The jitter multiplies the calculated delay by
 *   a random factor between 0.8 and 1.2 to help reduce synchronization storms.
 *
 * @param {string} [options.label="operation"]
 *   Human-friendly label used in verbose logging to identify the operation being retried.
 *
 * @param {boolean} [options.verbose=true]
 *   When true, the wrapper logs progress and decisions (attempts, delays, errors, success).
 *
 * @param {number} [options.simulateFails=0]
 *   Testing/demo option: intentionally throw a simulated error for the first `simulateFails`
 *   attempts. This allows testing the retry logic without needing a real failure.
 *
 * @param {(err: Error) => boolean} [options.retryOn=() => true]
 *   Predicate function invoked with the thrown/rejected error. Return true to retry the operation,
 *   or false to stop retrying and immediately rethrow the error. Allows selective retrying for
 *   transient errors only.
 *
 */
export async function retryWithBackoff(
    fn,
    {
        retries = 3,
        baseDelay = 300,
        factor = 2,
        jitter = false,
        label = "operation",
        verbose = true,
        simulateFails = 0,
        retryOn = () => true // fn: (err) => boolean
    } = {}
) {
    let attempt = 0;
    let forcedFailCount = 0;

    if (verbose) {
        console.log(`\n--- RETRY WRAPPER START: ${label} ---`);
        console.log(`Max retries: ${retries}`);
        console.log(`Base delay: ${baseDelay}ms`);
        console.log(`Strategy: exponential x${factor}${jitter ? " + jitter" : ""}\n`);
    }

    while (attempt <= retries) {
        try {
            attempt++;

            if (verbose) console.log(`[Attempt ${attempt}] Calling ${label}...`);

            //SIMULATED FAILURE (for demo)
            if (forcedFailCount < simulateFails) {
                forcedFailCount++;
                throw new Error(`Simulated failure ${forcedFailCount}/${simulateFails}`);
            }

            const result = await fn(); // actual call

            if (verbose) {
                console.log(`Success on attempt ${attempt}`);
                console.log(`--- END RETRY REPORT (${label}) ---\n`);
            }
            return result;

        } catch (err) {

            if (!retryOn(err)) {
                console.error(`Non-retryable error: ${err.message}`);
                throw err;
            }

            if (attempt > retries) {
                console.error(`Failed after ${retries} retries:`, err.message);
                console.log(`--- END RETRY REPORT (${label}) ---\n`);
                throw err;
            }

            // Calculate next delay
            const delay = Math.min(
                baseDelay * Math.pow(factor, attempt - 1),
                20000 // cap to 20 sec max wait
            );
            const jittered = jitter// jitter the delay to avoid thundering herd effect
                ? delay * (0.8 + Math.random() * 0.4)
                : delay;

            if (verbose) {// if verbose is switched on we log the error and the retry info, for more visibility
                console.log(`Error: ${err.message}`);
                console.log(`Retrying in ${Math.round(jittered)}ms...\n`);
            }

            await new Promise(res => setTimeout(res, jittered));
        }
    }
}

//thundering herd effect: A situation where multiple systems or processes
//attempt to perform the same action simultaneously, often leading to
//resource contention, performance degradation, or system overload.
//This often occurs in distributed systems, caching mechanisms, or
//networked applications when many clients try to access a shared resource
//at the same time after a cache expiration or failure. It is relevant here
//because without jitter, multiple retries could align in time, causing
//spikes in load.