import retry, { RETRIES as DEFAULT_RETRIES } from './retry.js';

// Local test constants
const RETRIES = 3;
const DELAY = 20;
const FACTOR = 2;
const JITTER = false;

(async () => {
    let attempts = 0;
    try {
        const result = await retry(async () => {
            attempts++;
            if (attempts < 2) {
                throw new Error('simulated transient error');
            }
            return 'success-after-retry';
        }, { retries: RETRIES, delay: DELAY, factor: FACTOR, jitter: JITTER });

        console.log('TEST RESULT:', result);
        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exit(1);
    }
})();
