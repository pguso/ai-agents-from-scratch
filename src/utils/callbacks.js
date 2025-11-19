/**
 * BaseCallback - Abstract callback handler
 */
export class BaseCallback {
    /**
     * Called when a Runnable starts
     */
    async onStart(runnable, input, config) {
        // Override in subclass
    }

    /**
     * Called when a Runnable completes successfully
     */
    async onEnd(runnable, output, config) {
        // Override in subclass
    }

    /**
     * Called when a Runnable errors
     */
    async onError(runnable, error, config) {
        // Override in subclass
    }

    /**
     * Called for LLM token streaming
     */
    async onLLMNewToken(token, config) {
        // Override in subclass
    }

    /**
     * Called when a chain step completes
     */
    async onChainStep(stepName, output, config) {
        // Override in subclass
    }
}

/**
 * ConsoleCallback - Logs to console
 */
export class ConsoleCallback extends BaseCallback {
    constructor(options = {}) {
        super();
        this.verbose = options.verbose ?? true;
        this.colors = options.colors ?? true;
    }

    async onStart(runnable, input, config) {
        if (this.verbose) {
            console.log(`\n▶ Starting: ${runnable.name}`);
            console.log(`  Input:`, this._format(input));
        }
    }

    async onEnd(runnable, output, config) {
        if (this.verbose) {
            console.log(`✓ Completed: ${runnable.name}`);
            console.log(`  Output:`, this._format(output));
        }
    }

    async onError(runnable, error, config) {
        console.error(`✗ Error in ${runnable.name}:`, error.message);
    }

    async onLLMNewToken(token, config) {
        process.stdout.write(token);
    }

    _format(value) {
        if (typeof value === 'string') {
            return value.length > 100 ? value.substring(0, 97) + '...' : value;
        }
        return JSON.stringify(value, null, 2);
    }
}

/**
 * MetricsCallback - Tracks timing and counts
 */
export class MetricsCallback extends BaseCallback {
    constructor() {
        super();
        this.metrics = {
            calls: {},
            totalTime: {},
            errors: {}
        };
        this.startTimes = new Map();
    }

    async onStart(runnable, input, config) {
        const name = runnable.name;
        this.startTimes.set(name, Date.now());

        this.metrics.calls[name] = (this.metrics.calls[name] || 0) + 1;
    }

    async onEnd(runnable, output, config) {
        const name = runnable.name;
        const startTime = this.startTimes.get(name);

        if (startTime) {
            const duration = Date.now() - startTime;
            this.metrics.totalTime[name] = (this.metrics.totalTime[name] || 0) + duration;
            this.startTimes.delete(name);
        }
    }

    async onError(runnable, error, config) {
        const name = runnable.name;
        this.metrics.errors[name] = (this.metrics.errors[name] || 0) + 1;
    }

    getReport() {
        const report = [];

        for (const [name, calls] of Object.entries(this.metrics.calls)) {
            const totalTime = this.metrics.totalTime[name] || 0;
            const avgTime = calls > 0 ? (totalTime / calls).toFixed(2) : 0;
            const errors = this.metrics.errors[name] || 0;

            report.push({
                runnable: name,
                calls,
                avgTime: `${avgTime}ms`,
                totalTime: `${totalTime}ms`,
                errors
            });
        }

        return report;
    }

    reset() {
        this.metrics = {calls: {}, totalTime: {}, errors: {}};
        this.startTimes.clear();
    }
}

/**
 * FileCallback - Logs to file
 */
export class FileCallback extends BaseCallback {
    constructor(filename) {
        super();
        this.filename = filename;
        this.logs = [];
    }

    async onStart(runnable, input, config) {
        this.logs.push({
            timestamp: new Date().toISOString(),
            event: 'start',
            runnable: runnable.name,
            input: this._serialize(input)
        });
    }

    async onEnd(runnable, output, config) {
        this.logs.push({
            timestamp: new Date().toISOString(),
            event: 'end',
            runnable: runnable.name,
            output: this._serialize(output)
        });
    }

    async onError(runnable, error, config) {
        this.logs.push({
            timestamp: new Date().toISOString(),
            event: 'error',
            runnable: runnable.name,
            error: error.message
        });
    }

    async flush() {
        const fs = await import('fs/promises');
        await fs.writeFile(
            this.filename,
            JSON.stringify(this.logs, null, 2),
            'utf-8'
        );
        this.logs = [];
    }

    _serialize(value) {
        if (typeof value === 'string') return value;
        if (value?.content) return value.content; // Message
        return JSON.stringify(value);
    }
}