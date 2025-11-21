import {Runnable} from '../core/runnable.js';

/**
 * Base class for all output parsers
 * Transforms LLM text output into structured data
 */
export class BaseOutputParser extends Runnable {
    constructor() {
        super();
        this.name = this.constructor.name;
    }

    /**
     * Parse the LLM output into structured data
     * @abstract
     * @param {string} text - Raw LLM output
     * @returns {Promise<any>} Parsed data
     */
    async parse(text) {
        throw new Error(`${this.name} must implement parse()`);
    }

    /**
     * Get instructions for the LLM on how to format output
     * @returns {string} Format instructions
     */
    getFormatInstructions() {
        return '';
    }

    /**
     * Runnable interface: parse the output
     */
    async _call(input, config) {
        // Input can be a string or a Message
        const text = typeof input === 'string'
            ? input
            : input.content;

        return await this.parse(text);
    }

    /**
     * Parse with error handling
     */
    async parseWithPrompt(text, prompt) {
        try {
            return await this.parse(text);
        } catch (error) {
            throw new OutputParserException(
                `Failed to parse output from prompt: ${error.message}`,
                text,
                error
            );
        }
    }
}

/**
 * Exception thrown when parsing fails
 */
export class OutputParserException extends Error {
    constructor(message, llmOutput, originalError) {
        super(message);
        this.name = 'OutputParserException';
        this.llmOutput = llmOutput;
        this.originalError = originalError;
    }
}