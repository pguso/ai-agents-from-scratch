/**
 * Exercise 12 Solution: Composition and Pipelines
 */

import {HumanMessage, SystemMessage, LlamaCppLLM, Runnable} from '../../../../src/index.js';

// Part 1: PromptFormatter Runnable
class PromptFormatter extends Runnable {
    constructor(systemPrompt = "You are a helpful assistant. Be concise.") {
        super();
        this.systemPrompt = systemPrompt;
    }

    async _call(input, config) {
        return [
            new SystemMessage(this.systemPrompt),
            new HumanMessage(input)
        ];
    }
}

// Part 2: ResponseParser Runnable
class ResponseParser extends Runnable {
    async _call(input, config) {
        // Extract content from AIMessage
        if (input.content) {
            return input.content.trim();
        }
        return String(input).trim();
    }
}

// Part 3: AnswerValidator Runnable
class AnswerValidator extends Runnable {
    constructor(minLength = 10) {
        super();
        this.minLength = minLength;
    }

    async _call(input, config) {
        if (input.length < this.minLength) {
            return `Error: Response too short (${input.length} chars, min ${this.minLength})`;
        }
        return input;
    }
}

async function exercise4() {
    console.log('=== Exercise 4: Composition and Pipelines ===\n');

    const llm = new LlamaCppLLM({
        modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf',
        temperature: 0.7,
        maxTokens: 100
    });

    try {
        // Part 1: Test individual components
        console.log('Part 1: Testing individual components');

        const formatter = new PromptFormatter();
        const parser = new ResponseParser();
        const validator = new AnswerValidator();

        console.log('Testing formatter:');
        const formatted = await formatter.invoke("What is AI?");
        console.log(formatted);
        console.log();

        console.log('Testing LLM + parser:');
        const llmResponse = await llm.invoke(formatted);
        const parsed = await parser.invoke(llmResponse);
        console.log('Parsed:', parsed);
        console.log();

        console.log('Testing validator with short input:');
        const shortResult = await validator.invoke("Hi");
        console.log(shortResult);
        console.log();

        // Part 2: Build a complete pipeline
        console.log('Part 2: Complete pipeline');

        // Chain all components together
        const pipeline = formatter
            .pipe(llm)
            .pipe(parser)
            .pipe(validator);

        console.log('Pipeline structure:', pipeline.toString());

        const result1 = await pipeline.invoke("What is machine learning?");
        console.log('Result:', result1);
        console.log();

        // Part 3: Reusable agent pipelines
        console.log('Part 3: Reusable agent pipeline');

        // Creative pipeline: high temperature, no validator
        const creativeLLM = new LlamaCppLLM({
            modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf',
            temperature: 0.9,
            maxTokens: 100
        });

        const creativeFormatter = new PromptFormatter(
            "You are a creative writer. Use vivid imagery."
        );

        const creativePipeline = creativeFormatter
            .pipe(creativeLLM)
            .pipe(parser);

        // Factual pipeline: low temperature, with validator
        const factualLLM = new LlamaCppLLM({
            modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf',
            temperature: 0.1,
            maxTokens: 100
        });

        const factualFormatter = new PromptFormatter(
            "You are a factual encyclopedia. Be precise and accurate."
        );

        const factualPipeline = factualFormatter
            .pipe(factualLLM)
            .pipe(parser)
            .pipe(validator);

        console.log('Creative (temp=0.9):');
        const creative = await creativePipeline.invoke("Describe a sunset");
        console.log(creative);
        console.log();

        console.log('Factual (temp=0.1):');
        const factual = await factualPipeline.invoke("What is the capital of France?");
        console.log(factual);
        console.log();

        // Part 4: Batch processing with pipelines
        console.log('Part 4: Batch processing with pipeline');

        const questions = [
            "What is Python?",
            "What is JavaScript?",
            "What is Rust?"
        ];

        const answers = await pipeline.batch(questions);

        questions.forEach((q, i) => {
            console.log(`Q: ${q}`);
            console.log(`A: ${answers[i]}`);
            console.log();
        });

        // Cleanup additional LLMs
        await creativeLLM.dispose();
        await factualLLM.dispose();

    } finally {
        await llm.dispose();
    }

    console.log('\n✓ Exercise 4 complete!');
}

// Run the solution
exercise4().catch(console.error);

/**
 * Key Takeaways:
 *
 * 1. Building Runnables:
 *    - Extend Runnable base class
 *    - Override _call() method
 *    - Each Runnable does one thing well
 *    - Configure via constructor parameters
 *
 * 2. Composition with .pipe():
 *    - a.pipe(b).pipe(c) chains operations
 *    - Output of one becomes input of next
 *    - Creates a new RunnableSequence
 *    - Result is itself a Runnable
 *
 * 3. Pipeline benefits:
 *    - Reusable across different inputs
 *    - Testable components in isolation
 *    - Easy to modify (swap components)
 *    - Clear data flow
 *
 * 4. Specialized pipelines:
 *    - Create different LLM instances with different configs
 *    - Mix and match components
 *    - Same interface, different behavior
 *
 * 5. Batch compatibility:
 *    - Pipelines work with batch() automatically
 *    - Each input goes through entire pipeline
 *    - No extra code needed
 *
 * 6. Real-world pattern:
 *    - This is exactly how LangChain works
 *    - Prompt -> Model -> Parser is common pattern
 *    - You now understand what frameworks do
 *
 * 7. Design principles:
 *    - Single Responsibility: Each Runnable does one thing
 *    - Composition over Inheritance: Build complex from simple
 *    - Open/Closed: Easy to extend, no need to modify
 *
 * Example advanced pipeline:
 *
 * ```javascript
 * const agent = inputValidator
 *   .pipe(promptFormatter)
 *   .pipe(llm)
 *   .pipe(responseParser)
 *   .pipe(errorChecker)
 *   .pipe(outputFormatter);
 *
 * // Use it
 * const result = await agent.invoke(userInput);
 *
 * // Test a component
 * const parsed = await responseParser.invoke(testData);
 *
 * // Swap LLM
 * const newAgent = inputValidator
 *   .pipe(promptFormatter)
 *   .pipe(differentLLM)  // Just changed this!
 *   .pipe(responseParser)
 *   .pipe(errorChecker)
 *   .pipe(outputFormatter);
 * ```
 */