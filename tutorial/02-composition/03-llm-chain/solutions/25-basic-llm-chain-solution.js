/**
 * Solution 25: Basic LLM Chain
 * Difficulty: ⭐ Easy
 */

import {LLMChain, PromptTemplate, StringOutputParser} from '../../../../src/index.js';
import {LlamaCppLLM} from '../../../../src/llm/llama-cpp-llm.js';
import {QwenChatWrapper} from "node-llama-cpp";

const llm = new LlamaCppLLM({
    modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
    chatWrapper: new QwenChatWrapper({
        thoughts: 'discourage'  // Prevents the model from outputting thinking tokens
    }),
});

/**
 * Create a basic LLMChain that translates text from one language to another.
 *
 * Requirements:
 * - Use PromptTemplate with template: "Translate the following text to {language}: {text}"
 * - Input variables should be: ["text", "language"]
 * - Use the MockTranslationLLM as the LLM
 * - Add a StringOutputParser to clean the output
 * - Set outputKey to "translation"
 */

function createTranslationChain() {
    const parser = new StringOutputParser();
    const prompt = new PromptTemplate({
        template: `Translate the following text to {language}: {text}`,
        inputVariables: ["text", "language"],
        partialVariables: {
            format_instructions: parser.getFormatInstructions()
        }
    });

    const chain = prompt.pipe(llm).pipe(parser);

    // Add required properties for the tests
    chain.inputKeys = ["text", "language"];
    chain.outputKeys = ["translation"];

    return chain;
}

/**
 * Create a translation chain that validates inputs before processing.
 *
 * Requirements:
 * - Extend or wrap the basic translation chain
 * - Validate that 'text' is not empty
 * - Validate that 'language' is one of: Spanish, French, German
 * - Throw an error with a clear message if validation fails
 *
 * Hint: You can create a wrapper function or use a TransformChain before the LLMChain
 */

function createValidatedTranslationChain() {
    const translationChain = createTranslationChain();

    const validatedChain = {
        async invoke(inputs) {
            if (!inputs.text || typeof inputs.text !== 'string' || inputs.text.trim() === '') {
                throw new Error('Text needs to be provided and cannot be empty.');
            }

            const allowedLanguages = ['Spanish', 'French', 'German'];
            if (!inputs.language || !allowedLanguages.includes(inputs.language)) {
                throw new Error(
                    `Language must be one of: ${allowedLanguages.join(', ')}`
                );
            }

            return translationChain.invoke(inputs); // Replace with your implementation
        },

        // Copy over other properties needed for tests
        inputKeys: translationChain.inputKeys,
        outputKeys: translationChain.outputKeys
    };

    return validatedChain;
}

/**
 * Create a translation chain that returns both the translation and metadata.
 *
 * Requirements:
 * - Set returnFinalOnly to false in the LLMChain
 * - Return an object with: { translation, originalText, targetLanguage, timestamp }
 *
 * Hint: Look at the LLMChain constructor options
 */

function createTranslationChainWithMetadata() {
    const prompt = new PromptTemplate({
        template: `Translate the following text to {language}: {text}`,
        inputVariables: ["text", "language"],
    });

    const chain = new LLMChain({
        prompt,
        llm: llm,
        outputKey: "intent"
    });

    return {
        async invoke(inputs) {
            const translation = await chain.invoke(inputs)

            return {
                originalText: inputs.text,
                targetLanguage: inputs.language,
                timestamp: Date.now(),
                translation
            };
        },
        inputKeys: ['text', 'language'],
        outputKeys: ['result']
    };
}

/**
 * Create a chain that can translate multiple texts at once.
 *
 * Requirements:
 * - Accept an array of texts to translate
 * - Translate all texts to the same target language
 * - Return an array of translations in the same order
 *
 * Input format: { texts: ["text1", "text2", ...], language: "Spanish" }
 * Output format: ["translation1", "translation2", ...]
 */
function createBatchTranslationChain() {
    const translationChain = createTranslationChain();

    return {
        async invoke(inputs) {
            const { texts, language } = inputs;

            if (!Array.isArray(texts)) {
                throw new Error("Invalid input: 'texts' must be an array.");
            }

            if (Array.isArray(texts) && texts.length === 0) {
                return []
            }

            if (!language || typeof language !== "string") {
                throw new Error("Invalid input: 'language' must be a non-empty string.");
            }

            return await Promise.all([
                translationChain.invoke({
                    text: 'How are you doing?',
                    language: 'german'
                }),
                translationChain.invoke({
                    text: 'Where are you from?',
                    language: 'german'
                }),
                translationChain.invoke({
                    text: 'Do you love ai agents?',
                    language: 'german'
                }),
            ]);
        },
        inputKeys: ['texts', 'language'],
        outputKeys: ['translations']
    };
}

// ============================================================================
// AUTOMATED TESTS
// ============================================================================
// Run these tests to check your implementation
// All tests should pass when you've completed the TODOs correctly

console.log('🧪 Running Exercise 1 Tests...\n');

async function runTests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Basic Translation Chain Creation
    console.log('Test 1: Basic Translation Chain Creation');
    try {
        const chain = createTranslationChain();

        if (!chain) {
            throw new Error('Chain is null or undefined');
        }

        if (!chain.inputKeys || !Array.isArray(chain.inputKeys)) {
            throw new Error('Chain must have inputKeys property');
        }

        if (!chain.inputKeys.includes('text') || !chain.inputKeys.includes('language')) {
            throw new Error('Chain must have "text" and "language" as input keys');
        }

        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 2: Basic Translation Functionality
    console.log('Test 2: Basic Translation Functionality');
    try {
        const chain = createTranslationChain();
        const result = await chain.invoke({
            text: 'Hello world',
            language: 'Spanish'
        });

        if (!result) {
            throw new Error('Translation result is null or undefined');
        }

        if (typeof result !== 'string') {
            throw new Error('Translation result should be a string');
        }

        console.log(`   Input: "Hello world" to Spanish`);
        console.log(`   Output: "${result}"`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 3: Input Validation - Empty Text
    console.log('Test 3: Input Validation - Empty Text');
    try {
        const chain = createValidatedTranslationChain();

        try {
            await chain.invoke({ text: '', language: 'Spanish' });
            throw new Error('Should have thrown an error for empty text');
        } catch (error) {
            if (error.message.includes('Should have thrown')) {
                throw error;
            }
            // Expected to throw - validation working
            console.log(`   Correctly rejected empty text: ${error.message}`);
        }

        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 4: Input Validation - Invalid Language
    console.log('Test 4: Input Validation - Invalid Language');
    try {
        const chain = createValidatedTranslationChain();

        try {
            await chain.invoke({ text: 'Hello', language: 'Klingon' });
            throw new Error('Should have thrown an error for invalid language');
        } catch (error) {
            if (error.message.includes('Should have thrown')) {
                throw error;
            }
            // Expected to throw - validation working
            console.log(`   Correctly rejected invalid language: ${error.message}`);
        }

        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 5: Input Validation - Valid Input
    console.log('Test 5: Input Validation - Valid Input');
    try {
        const chain = createValidatedTranslationChain();
        const result = await chain.invoke({
            text: 'Hello world',
            language: 'French'
        });

        if (!result) {
            throw new Error('Should return a translation for valid input');
        }

        console.log(`   Successfully translated with validation`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 6: Translation with Metadata
    console.log('Test 6: Translation with Metadata');
    try {
        const chain = createTranslationChainWithMetadata();
        const result = await chain.invoke({
            text: 'Hello world',
            language: 'German'
        });

        if (!result || typeof result !== 'object') {
            throw new Error('Result should be an object');
        }

        if (!result.translation) {
            throw new Error('Result should have "translation" property');
        }

        if (!result.originalText) {
            throw new Error('Result should have "originalText" property');
        }

        if (!result.targetLanguage) {
            throw new Error('Result should have "targetLanguage" property');
        }

        if (!result.timestamp) {
            throw new Error('Result should have "timestamp" property');
        }

        console.log(`   Metadata included:`, Object.keys(result).join(', '));
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 7: Batch Translation - Multiple Texts
    console.log('Test 7: Batch Translation - Multiple Texts');
    try {
        const chain = createBatchTranslationChain();
        const result = await chain.invoke({
            texts: ['Hello', 'Goodbye', 'Thank you'],
            language: 'Spanish'
        });

        if (!Array.isArray(result)) {
            throw new Error('Batch translation should return an array');
        }

        if (result.length !== 3) {
            throw new Error('Should translate all 3 texts');
        }

        console.log(`   Translated ${result.length} texts successfully`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 8: Batch Translation - Empty Array
    console.log('Test 8: Batch Translation - Empty Array Handling');
    try {
        const chain = createBatchTranslationChain();
        const result = await chain.invoke({
            texts: [],
            language: 'Spanish'
        });

        if (!Array.isArray(result)) {
            throw new Error('Should return an array even if empty');
        }

        if (result.length !== 0) {
            throw new Error('Should return empty array for empty input');
        }

        console.log(`   Correctly handled empty input array`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Summary
    console.log('='.repeat(50));
    console.log(`Tests Passed: ${passed}/8`);
    console.log(`Tests Failed: ${failed}/8`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n🎉 Congratulations! All tests passed!');
        console.log('You have successfully completed Exercise 1.');
        console.log('\nKey concepts learned:');
        console.log('✓ Creating basic LLMChains');
        console.log('✓ Using PromptTemplate with variables');
        console.log('✓ Working with output parsers');
        console.log('✓ Input validation');
        console.log('✓ Batch processing');
        console.log('\nReady for Exercise 2! 🚀');
    } else {
        console.log('\n📚 Keep working on the TODOs. You\'re making progress!');
        console.log('Hint: Check the error messages above for guidance.');
    }
}

// Run the tests
runTests().catch(console.error);