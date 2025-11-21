/**
 * Exercise 19: FewShotPromptTemplate
 *
 * Goal: Build prompts with examples (few-shot learning)
 *
 * In this exercise, you'll:
 * 1. Format examples with an example template
 * 2. Combine prefix + examples + suffix
 * 3. Learn how few-shot learning improves LLM outputs
 * 4. Test with various domains (math, translation, classification)
 *
 * Few-shot prompting is one of the most powerful techniques!
 */

import {PromptTemplate, FewShotPromptTemplate} from '../../../../src/index.js';

// Test cases
async function exercise3() {
    console.log('=== Exercise 19: FewShotPromptTemplate ===\n');

    // Test 1: Antonym generator
    console.log('--- Test 1: Antonym Generator ---');

    // TODO: Create example template for antonyms
    // Template: "Input: {input}\nOutput: {output}"
    const antonymExamplePrompt = null; // new PromptTemplate({ ... })

    // TODO: Create few-shot prompt for antonyms
    // Examples: [
    //   { input: "happy", output: "sad" },
    //   { input: "tall", output: "short" },
    //   { input: "hot", output: "cold" }
    // ]
    // Prefix: "Give the antonym of each word."
    // Suffix: "Input: {word}\nOutput:"
    const antonymPrompt = null; // new FewShotPromptTemplate({ ... })

    // TODO: Format with a new word
    // const result1 = await antonymPrompt.format({ word: "fast" })

    console.log('Result:');
    console.log('TODO'); // result1
    console.log();

    // Test 2: Math word problems
    console.log('--- Test 2: Math Word Problems ---');

    // TODO: Create example template
    // Template: "Q: {question}\nA: {answer}"
    const mathExamplePrompt = null; // new PromptTemplate({ ... })

    // TODO: Create few-shot prompt for math
    // Examples: [
    //   { question: "If I have 3 apples and buy 2 more, how many do I have?", answer: "5" },
    //   { question: "A train travels 60 mph for 2 hours. How far does it go?", answer: "120 miles" }
    // ]
    // Prefix: "Solve these word problems:"
    // Suffix: "Q: {question}\nA:"
    const mathPrompt = null; // new FewShotPromptTemplate({ ... })

    // TODO: Format with new question
    // const result2 = await mathPrompt.format({
    //     question: "If a book costs $12 and I buy 3, how much do I spend?"
    // })

    console.log('Result:');
    console.log('TODO'); // result2
    console.log();

    // Test 3: Sentiment classification
    console.log('--- Test 3: Sentiment Classification ---');

    // TODO: Create example template for sentiment
    // Template: "Text: {text}\nSentiment: {sentiment}"
    const sentimentExamplePrompt = null; // new PromptTemplate({ ... })

    // TODO: Create few-shot prompt for sentiment
    // Examples with positive, negative, neutral texts
    const sentimentPrompt = null; // new FewShotPromptTemplate({ ... })

    // TODO: Format with new text
    // const result3 = await sentimentPrompt.format({
    //     text: "The product is okay, nothing special."
    // })

    console.log('Result:');
    console.log('TODO'); // result3
    console.log();

    // Test 4: Code explanation
    console.log('--- Test 4: Code Explanation ---');

    // TODO: Create example template
    // Template: "Code: {code}\nExplanation: {explanation}"
    const codeExamplePrompt = null; // PromptTemplate.fromTemplate(...)

    // TODO: Create few-shot prompt for code explanation
    // Examples: [
    //   { code: "x = x + 1", explanation: "Increment x by 1" },
    //   { code: "if x > 0:", explanation: "Check if x is positive" }
    // ]
    const codePrompt = null; // new FewShotPromptTemplate({ ... })

    // TODO: Format with new code
    // const result4 = await codePrompt.format({
    //     code: "for i in range(10):"
    // })

    console.log('Result:');
    console.log('TODO'); // result4
    console.log();

    // Test 5: Custom separator
    console.log('--- Test 5: Custom Separator ---');

    // TODO: Create few-shot prompt with custom separator
    // Use "---" as separator instead of default "\n\n"
    const customSepPrompt = null; // new FewShotPromptTemplate({
    //     exampleSeparator: "\n---\n",
    //     ...
    // })

    // TODO: Format and see custom separator
    // const result5 = await customSepPrompt.format({ ... })

    console.log('Result:');
    console.log('TODO'); // result5
    console.log();

    // Test 6: Translation with context
    console.log('--- Test 6: Translation with Context ---');

    // TODO: Create example template for translation
    // Template: "English: {english}\nSpanish: {spanish}"
    const translationExamplePrompt = null; // PromptTemplate.fromTemplate(...)

    // TODO: Create few-shot prompt
    // Examples with common phrases
    // Prefix: "Translate English to Spanish. Context: {context}"
    const translationPrompt = null; // new FewShotPromptTemplate({ ... })

    // TODO: Format with context and new phrase
    // const result6 = await translationPrompt.format({
    //     context: "casual conversation",
    //     english: "See you later!"
    // })

    console.log('Result:');
    console.log('TODO'); // result6
    console.log();

    // Test 7: No examples (just prefix and suffix)
    console.log('--- Test 7: No Examples ---');

    // TODO: Create few-shot prompt with empty examples array
    const noExamplesPrompt = null; // new FewShotPromptTemplate({
    //     examples: [],
    //     examplePrompt: new PromptTemplate({ template: "" }),
    //     prefix: "Answer the following question:",
    //     suffix: "Question: {question}\nAnswer:",
    //     inputVariables: ["question"]
    // })

    // TODO: Format - should just show prefix and suffix
    // const result7 = await noExamplesPrompt.format({
    //     question: "What is AI?"
    // })

    console.log('Result:');
    console.log('TODO'); // result7
    console.log();

    // Test 8: Use as Runnable
    console.log('--- Test 8: Use as Runnable ---');

    // TODO: Create a few-shot prompt
    const runnablePrompt = null; // new FewShotPromptTemplate({ ... })

    // TODO: Use invoke() instead of format()
    // const result8 = await runnablePrompt.invoke({ ... })

    console.log('Invoked result:');
    console.log('TODO'); // result8
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
 * [Similar to previous outputs]
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