import RunnableConfig from "./context.js";
import {CallbackManager} from "../utils/index.js";

/**
 * Runnable - Base class for all composable components
 *
 * Every Runnable must implement the _call() method.
 * This base class provides invoke, stream, batch, and pipe.
 */
export class Runnable {
    constructor() {
        this.name = this.constructor.name;
    }

    /**
     * Main execution method - processes a single input
     *
     * @param {any} input - The input to process
     * @param {Object} config - Optional configuration
     * @returns {Promise<any>} The processed output
     */
    async invoke(input, config = {}) {
        // Normalize config to RunnableConfig instance
        const runnableConfig = config instanceof RunnableConfig
            ? config
            : new RunnableConfig(config);

        // Create callback manager
        const callbackManager = new CallbackManager(runnableConfig.callbacks);

        try {
            // Notify callbacks: starting
            await callbackManager.handleStart(this, input, runnableConfig);

            // Execute the runnable
            const output = await this._call(input, runnableConfig);

            // Notify callbacks: success
            await callbackManager.handleEnd(this, output, runnableConfig);

            return output;
        } catch (error) {
            // Notify callbacks: error
            await callbackManager.handleError(this, error, runnableConfig);
            throw error;
        }
    }

    /**
     * Internal method that subclasses must implement
     *
     * @param {any} input - The input to process
     * @param {Object} config - Optional configuration
     * @returns {Promise<any>} The processed output
     */
    async _call(input, config) {
        throw new Error(
            `${this.name} must implement _call() method`
        );
    }

    /**
     * Stream output in chunks
     *
     * @param {any} input - The input to process
     * @param {Object} config - Optional configuration
     * @yields {any} Output chunks
     */
    async* stream(input, config = {}) {
        // Default implementation: just yield the full result
        // Subclasses can override for true streaming
        const result = await this.invoke(input, config);
        yield result;
    }

    /**
     * Internal streaming method for subclasses
     * Override this for custom streaming behavior
     */
    async* _stream(input, config) {
        yield await this._call(input, config);
    }

    /**
     * Process multiple inputs in parallel
     *
     * @param {Array<any>} inputs - Array of inputs to process
     * @param {Object} config - Optional configuration
     * @returns {Promise<Array<any>>} Array of outputs
     */
    async batch(inputs, config = {}) {
        // Use Promise.all for parallel execution
        return await Promise.all(
            inputs.map(input => this.invoke(input, config))
        );
    }

    /**
     * Compose this Runnable with another
     * Creates a new Runnable that runs both in sequence
     *
     * @param {Runnable} other - The Runnable to pipe to
     * @returns {RunnableSequence} A new composed Runnable
     */
    pipe(other) {
        return new RunnableSequence([this, other]);
    }
}

/**
 * RunnableSequence - Chains multiple Runnables together
 *
 * Output of one becomes input of the next
 */
export class RunnableSequence extends Runnable {
    constructor(steps) {
        super();
        this.steps = steps; // Array of Runnables
    }

    async _call(input, config) {
        let output = input;

        // Run through each step sequentially
        for (const step of this.steps) {
            output = await step.invoke(output, config);
        }

        return output;
    }

    async *_stream(input, config) {
        let output = input;

        // Stream through all steps
        for (let i = 0; i < this.steps.length - 1; i++) {
            output = await this.steps[i].invoke(output, config);
        }

        // Only stream the last step
        yield* this.steps[this.steps.length - 1].stream(output, config);
    }

    // pipe() returns a new sequence with the added step
    pipe(other) {
        return new RunnableSequence([...this.steps, other]);
    }
}