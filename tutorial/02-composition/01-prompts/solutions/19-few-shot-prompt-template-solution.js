/**
 * Solution 19: FewShotPromptTemplate
 */

import {PromptTemplate, FewShotPromptTemplate} from '../../../../src/index.js';

// Test cases
async function exercise3() {
    console.log('=== Exercise 19: FewShotPromptTemplate ===\n');

    // Test 1: Antonym generator
    console.log('--- Test 1: Antonym Generator ---');

    const antonymExamplePrompt = new PromptTemplate({
        template: "Input: {input}\nOutput: {output}",
        inputVariables: ["input", "output"]
    });

    const antonymPrompt = new FewShotPromptTemplate({
        examples: [
            { input: "happy", output: "sad" },
            { input: "tall", output: "short" },
            { input: "hot", output: "cold" }
        ],
        examplePrompt: antonymExamplePrompt,
        prefix: "Give the antonym of each word.",
        suffix: "Input: {word}\nOutput:",
        inputVariables: ["word"]
    });

    const result1 = await antonymPrompt.format({ word: "fast" });

    console.log('Result:');
    console.log(result1);
    console.log();

    // Test 2: Math word problems
    console.log('--- Test 2: Math Word Problems ---');

    const mathExamplePrompt = new PromptTemplate({
        template: "Q: {question}\nA: {answer}",
        inputVariables: ["question", "answer"]
    });

    const mathPrompt = new FewShotPromptTemplate({
        examples: [
            { question: "If I have 3 apples and buy 2 more, how many do I have?", answer: "5" },
            { question: "A train travels 60 mph for 2 hours. How far does it go?", answer: "120 miles" }
        ],
        examplePrompt: mathExamplePrompt,
        prefix: "Solve these word problems:",
        suffix: "Q: {question}\nA:",
        inputVariables: ["question"]
    });

    const result2 = await mathPrompt.format({
        question: "If a book costs $12 and I buy 3, how much do I spend?"
    });

    console.log('Result:');
    console.log(result2);
    console.log();

    // Test 3: Sentiment classification
    console.log('--- Test 3: Sentiment Classification ---');

    const sentimentExamplePrompt = new PromptTemplate({
        template: "Text: {text}\nSentiment: {sentiment}",
        inputVariables: ["text", "sentiment"]
    });

    const sentimentPrompt = new FewShotPromptTemplate({
        examples: [
            { text: "I love this product!", sentiment: "Positive" },
            { text: "This is terrible.", sentiment: "Negative" },
            { text: "It's okay.", sentiment: "Neutral" }
        ],
        examplePrompt: sentimentExamplePrompt,
        prefix: "Classify the sentiment of each text as Positive, Negative, or Neutral:",
        suffix: "Text: {text}\nSentiment:",
        inputVariables: ["text"]
    });

    const result3 = await sentimentPrompt.format({
        text: "The product is okay, nothing special."
    });

    console.log('Result:');
    console.log(result3);
    console.log();

    // Test 4: Code explanation
    console.log('--- Test 4: Code Explanation ---');

    const codeExamplePrompt = PromptTemplate.fromTemplate("Code: {code}\nExplanation: {explanation}");

    const codePrompt = new FewShotPromptTemplate({
        examples: [
            { code: "x = x + 1", explanation: "Increment x by 1" },
            { code: "if x > 0:", explanation: "Check if x is positive" }
        ],
        examplePrompt: codeExamplePrompt,
        prefix: "Explain what each line of code does:",
        suffix: "Code: {code}\nExplanation:",
        inputVariables: ["code"]
    });

    const result4 = await codePrompt.format({
        code: "for i in range(10):"
    });

    console.log('Result:');
    console.log(result4);
    console.log();

    // Test 5: Custom separator
    console.log('--- Test 5: Custom Separator ---');

    const customSepPrompt = new FewShotPromptTemplate({
        examples: [
            { example: "Example 1" },
            { example: "Example 2" },
            { example: "Example 3" }
        ],
        examplePrompt: new PromptTemplate({
            template: "{example}",
            inputVariables: ["example"]
        }),
        prefix: "Examples:",
        suffix: "Your turn: ...",
        inputVariables: [],
        exampleSeparator: "\n---\n"
    });

    const result5 = await customSepPrompt.format({});

    console.log('Result:');
    console.log(result5);
    console.log();

    // Test 6: Translation with context
    console.log('--- Test 6: Translation with Context ---');

    const translationExamplePrompt = PromptTemplate.fromTemplate("English: {english}\nSpanish: {spanish}");

    const translationPrompt = new FewShotPromptTemplate({
        examples: [
            { english: "Hello", spanish: "Hola" },
            { english: "How are you?", spanish: "¿Cómo estás?" }
        ],
        examplePrompt: translationExamplePrompt,
        prefix: "Translate English to Spanish. Context: {context}",
        suffix: "English: {english}\nSpanish:",
        inputVariables: ["context", "english"]
    });

    const result6 = await translationPrompt.format({
        context: "casual conversation",
        english: "See you later!"
    });

    console.log('Result:');
    console.log(result6);
    console.log();

    // Test 7: No examples (just prefix and suffix)
    console.log('--- Test 7: No Examples ---');

    const noExamplesPrompt = new FewShotPromptTemplate({
        examples: [],
        examplePrompt: new PromptTemplate({
            template: "",
            inputVariables: []
        }),
        prefix: "Answer the following question:",
        suffix: "Question: {question}\nAnswer:",
        inputVariables: ["question"]
    });

    const result7 = await noExamplesPrompt.format({
        question: "What is AI?"
    });

    console.log('Result:');
    console.log(result7);
    console.log();

    // Test 8: Use as Runnable
    console.log('--- Test 8: Use as Runnable ---');

    const runnablePrompt = new FewShotPromptTemplate({
        examples: [
            { word: "big", antonym: "small" },
            { word: "fast", antonym: "slow" }
        ],
        examplePrompt: new PromptTemplate({
            template: "{word} -> {antonym}",
            inputVariables: ["word", "antonym"]
        }),
        prefix: "Find antonyms:",
        suffix: "{word} ->",
        inputVariables: ["word"]
    });

    const result8 = await runnablePrompt.invoke({ word: "light" });

    console.log('Invoked result:');
    console.log(result8);
    console.log();

    console.log('✓ Exercise 3 complete!');
}

// Run the exercise
exercise3().catch(console.error);

/**
 * Expected Output:
 *
 * --- Test 1: Antonym Generator ---
 * Result:
 * Give the antonym of each word.
 *
 * Input: happy
 * Output: sad
 *
 * Input: tall
 * Output: short
 *
 * Input: hot
 * Output: cold
 *
 * Input: fast
 * Output:
 *
 * --- Test 2: Math Word Problems ---
 * Result:
 * Solve these word problems:
 *
 * Q: If I have 3 apples and buy 2 more, how many do I have?
 * A: 5
 *
 * Q: A train travels 60 mph for 2 hours. How far does it go?
 * A: 120 miles
 *
 * Q: If a book costs $12 and I buy 3, how much do I spend?
 * A:
 *
 * --- Test 3: Sentiment Classification ---
 * Result:
 * Classify the sentiment of each text as Positive, Negative, or Neutral:
 *
 * Text: I love this product!
 * Sentiment: Positive
 *
 * Text: This is terrible.
 * Sentiment: Negative
 *
 * Text: It's okay.
 * Sentiment: Neutral
 *
 * Text: The product is okay, nothing special.
 * Sentiment:
 *
 * --- Test 4: Code Explanation ---
 * Result:
 * Explain what each line of code does:
 *
 * Code: x = x + 1
 * Explanation: Increment x by 1
 *
 * Code: if x > 0:
 * Explanation: Check if x is positive
 *
 * Code: for i in range(10):
 * Explanation:
 *
 * --- Test 5: Custom Separator ---
 * Result:
 * Examples:
 * Example 1
 * ---
 * Example 2
 * ---
 * Example 3
 *
 * Your turn: ...
 *
 * --- Test 6: Translation with Context ---
 * Result:
 * Translate English to Spanish. Context: casual conversation
 *
 * English: Hello
 * Spanish: Hola
 *
 * English: How are you?
 * Spanish: ¿Cómo estás?
 *
 * English: See you later!
 * Spanish:
 *
 * --- Test 7: No Examples ---
 * Result:
 * Answer the following question:
 *
 * Question: What is AI?
 * Answer:
 *
 * --- Test 8: Use as Runnable ---
 * Invoked result:
 * Find antonyms:
 *
 * big -> small
 *
 * fast -> slow
 *
 * light ->
 *
 * Learning Points:
 * 1. Few-shot learning provides examples to guide LLMs
 * 2. Structure: prefix + examples + suffix
 * 3. Examples are formatted with examplePrompt
 * 4. Custom separators control formatting
 * 5. Can work with or without examples
 * 6. Dramatically improves LLM output quality
 * 7. Essential for classification, generation, and transformation tasks
 * 8. Variable substitution works in prefix, suffix, and examples
 */