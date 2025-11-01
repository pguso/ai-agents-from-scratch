// Shared retry/backoff utility used by agents
// Exports a small helper `retryWithBackoff` that retries an async function
// with exponential backoff and optional jitter.

// Exposed default constants (can be imported by callers if desired)
export const RETRIES = 3;
export const DELAY = 250;
export const FACTOR = 2;
export const JITTER = true;

export async function retryWithBackoff(fn, options = {}) {
    const {
        retries = RETRIES,
        delay = DELAY,
        factor = FACTOR,
        jitter = JITTER,
        shouldRetry = null, // optional function(error) => boolean
    } = options;

    let attempt = 0;

    while (true) {
        try {
            return await fn();
        } catch (err) {
            attempt++;
            const canRetry = typeof shouldRetry === 'function' ? shouldRetry(err) : true;
            if (attempt > retries || !canRetry) {
                // rethrow the last error
                throw err;
            }

            // compute wait time
            let wait = delay * Math.pow(factor, attempt - 1);
            if (jitter) {
                // jitter between 50% and 100% of wait
                const r = 0.5 + Math.random() * 0.5;
                wait = Math.round(wait * r);
            }

            // Informative log (non-invasive)
            try {
                // eslint-disable-next-line no-console
                console.warn(`retryWithBackoff: attempt ${attempt}/${retries} failed — retrying in ${wait}ms: ${err && err.message ? err.message : err}`);
            } catch {}

            await new Promise((res) => setTimeout(res, wait));
        }
    }
}

export default retryWithBackoff;
