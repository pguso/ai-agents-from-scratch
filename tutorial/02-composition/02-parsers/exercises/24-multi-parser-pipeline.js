/**
 * Exercise 24: Multi-Parser Content Pipeline
 *
 * Difficulty: ⭐⭐⭐⭐ (Expert)
 *
 * Goal: Build a robust content processing pipeline using multiple parsers with fallbacks
 *
 * In this exercise, you'll:
 * 1. Combine multiple parser types in one system
 * 2. Implement fallback strategies when parsing fails
 * 3. Use RegexOutputParser for custom extraction
 * 4. Build a production-ready error handling system
 * 5. Create a complete content analysis pipeline
 *
 * Skills practiced:
 * - Multi-parser orchestration
 * - Fallback parsing strategies
 * - Regex-based extraction
 * - Error handling and recovery
 * - Building robust production pipelines
 */

import {
    Runnable,
    PromptTemplate,
    StructuredOutputParser,
    ListOutputParser,
    RegexOutputParser
} from '../../../../src/index.js';
import {LlamaCppLLM} from '../../../../src/llm/llama-cpp-llm.js';
import {QwenChatWrapper} from "node-llama-cpp";

// Sample content to process
const CONTENT_SAMPLES = [
    {
        text: "Breaking: Stock market hits record high! NASDAQ up 2.5%, S&P 500 gains 1.8%. Tech sector leads with Apple +3.2%, Microsoft +2.9%. Analysts predict continued growth.",
        type: "news"
    },
    {
        text: "Recipe: Chocolate Chip Cookies. Ingredients: 2 cups flour, 1 cup butter, 1 cup sugar, 2 eggs, 1 tsp vanilla, 2 cups chocolate chips. Bake at 350°F for 12 minutes.",
        type: "recipe"
    },
    {
        text: "Product Review: The XPhone 15 Pro (Score: 8.5/10) - Great camera, long battery life, but expensive at $1,199. Pros: Display, Performance. Cons: Price, Weight.",
        type: "review"
    }
];

// ============================================================================
// TODO 1: Create News Article Parser (Structured)
// ============================================================================

/**
 * Extract structured data from news articles
 */
async function createNewsParser() {
    // TODO: Create StructuredOutputParser
    // Schema:
    // - headline: string
    // - category: string, enum: ["business", "technology", "politics", "sports", "other"]
    // - sentiment: string, enum: ["positive", "negative", "neutral"]
    // - entities: array (companies, people, places mentioned)
    // - marketData: array (any numbers with context like "NASDAQ up 2.5%")
    const parser = null;

    // TODO: Create prompt
    const prompt = null;

    const llm = new LlamaCppLLM({
        modelPath: './models/your-model.gguf',
        temperature: 0.1
    });

    const chain = prompt.pipe(llm).pipe(parser);

    return chain;
}

// ============================================================================
// TODO 2: Create Recipe Parser (Regex + List)
// ============================================================================

/**
 * Extract recipe components using regex and list parsers
 */
async function createRecipeParser() {
    // TODO: Create a Runnable that:
    // 1. Extracts recipe name using RegexOutputParser
    // 2. Extracts ingredients list using ListOutputParser
    // 3. Extracts temperature and time using RegexOutputParser
    // 4. Returns combined object

    // Hint: You'll need to create multiple chains and combine their results

    // RegexOutputParser for name:
    // Pattern: /Recipe:\s*(.+?)\./
    const nameParser = null;

    // RegexOutputParser for temp/time:
    // Pattern: /(\d+)°F.*?(\d+)\s*minutes/
    const cookingParser = null;

    // ListOutputParser for ingredients
    const ingredientsParser = null;

    // TODO: Create a custom Runnable that orchestrates all parsers
    class RecipeParserRunnable extends Runnable {
        async _call(input, config) {
            const text = input.text;

            // TODO: Extract name
            // TODO: Extract ingredients
            // TODO: Extract cooking details

            // Return combined result
            return {
                name: null,
                ingredients: null,
                temperature: null,
                time: null
            };
        }
    }

    return new RecipeParserRunnable();
}

// ============================================================================
// TODO 3: Create Review Parser with Fallback
// ============================================================================

/**
 * Parse product reviews with fallback strategy
 * Try structured parser first, fall back to regex if it fails
 */
async function createReviewParser() {
    const llm = new LlamaCppLLM({
        modelPath: './models/your-model.gguf',
        temperature: 0.1
    });

    // TODO: Primary parser - StructuredOutputParser
    const structuredParser = null;
    // Schema: productName, score (number), pros (array), cons (array), price

    // TODO: Fallback parser - RegexOutputParser
    const regexParser = null;
    // Pattern to extract: Product name, Score, Price
    // Example: /(\w+.*?)\s*\(Score:\s*([\d.]+).*?\$(\d+)/

    // TODO: Create a Runnable with fallback logic
    class ReviewParserWithFallback extends Runnable {
        async _call(input, config) {
            const text = input.text;

            try {
                // TODO: Try structured parser first
                const prompt = new PromptTemplate({
                    template: `Extract review data: {text}\n\n{format_instructions}`,
                    inputVariables: ["text"],
                    partialVariables: {
                        format_instructions: structuredParser.getFormatInstructions()
                    }
                });

                const chain = prompt.pipe(llm).pipe(structuredParser);
                const result = await chain.invoke({text});

                return {
                    method: 'structured',
                    data: result
                };
            } catch (error) {
                console.warn('Structured parsing failed, using regex fallback');

                try {
                    // TODO: Fall back to regex parser
                    const result = await regexParser.parse(text);

                    return {
                        method: 'regex',
                        data: result
                    };
                } catch (regexError) {
                    // TODO: Final fallback - return basic string parsing
                    console.warn('Regex parsing failed, using basic extraction');

                    return {
                        method: 'basic',
                        data: {
                            text: text,
                            error: 'Could not parse structured data'
                        }
                    };
                }
            }
        }
    }

    return new ReviewParserWithFallback();
}

// ============================================================================
// TODO 4: Create Content Router
// ============================================================================

/**
 * Route content to appropriate parser based on content type
 */
class ContentRouter extends Runnable {
    constructor(parsers) {
        super();
        this.parsers = parsers; // { news: parser, recipe: parser, review: parser }
    }

    async _call(input, config) {
        const {text, type} = input;

        // TODO: Route to appropriate parser based on type
        const parser = this.parsers[type];

        if (!parser) {
            throw new Error(`No parser for content type: ${type}`);
        }

        // TODO: Parse content
        const result = await parser.invoke({text}, config);

        return {
            type: type,
            parsed: result,
            originalText: text
        };
    }
}

// ============================================================================
// TODO 5: Build Complete Pipeline with Error Handling
// ============================================================================

async function buildContentPipeline() {
    console.log('=== Exercise 24: Multi-Parser Content Pipeline ===\n');

    // TODO: Create all parsers
    const newsParser = null;
    const recipeParser = null;
    const reviewParser = null;

    // TODO: Create content router
    const router = null; // new ContentRouter({ news: newsParser, recipe: recipeParser, review: reviewParser })

    console.log('Processing content samples...\n');

    const results = [];

    // TODO: Process each content sample
    for (let i = 0; i < CONTENT_SAMPLES.length; i++) {
        const sample = CONTENT_SAMPLES[i];

        console.log('='.repeat(70));
        console.log(`SAMPLE ${i + 1}: ${sample.type.toUpperCase()}`);
        console.log('='.repeat(70));
        console.log(`Text: ${sample.text}\n`);

        try {
            // TODO: Route and parse
            const result = null;

            console.log('Parsing Result:');
            console.log(JSON.stringify(result, null, 2));

            results.push({
                success: true,
                data: result
            });
        } catch (error) {
            console.error(`Error: ${error.message}`);

            results.push({
                success: false,
                error: error.message,
                sample: sample
            });
        }

        console.log();
    }

    // TODO: Generate summary report
    console.log('='.repeat(70));
    console.log('PROCESSING SUMMARY');
    console.log('='.repeat(70));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Total Samples: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

    console.log('\n✓ Exercise 4 Complete!');

    return {newsParser, recipeParser, reviewParser, router, results};
}

// Run the exercise
buildContentPipeline()
    .then(runTests)
    .catch(console.error);

// ============================================================================
// AUTOMATED TESTS
// ============================================================================

async function runTests(context) {
    const {newsParser, recipeParser, reviewParser, router, results} = context;

    console.log('\n' + '='.repeat(60));
    console.log('RUNNING AUTOMATED TESTS');
    console.log('='.repeat(60) + '\n');

    const assert = (await import('assert')).default;
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            passed++;
            console.log(`✅ ${name}`);
        } catch (error) {
            failed++;
            console.error(`❌ ${name}`);
            console.error(`   ${error.message}\n`);
        }
    }

    // Test 1: All parsers created
    test('News parser created', () => {
        assert(newsParser !== null, 'Create newsParser');
        assert(newsParser instanceof Runnable, 'Should be Runnable');
    });

    test('Recipe parser created', () => {
        assert(recipeParser !== null, 'Create recipeParser');
    });

    test('Review parser created', () => {
        assert(reviewParser !== null, 'Create reviewParser');
    });

    test('Router created', () => {
        assert(router !== null, 'Create ContentRouter');
        assert(router instanceof ContentRouter, 'Should be ContentRouter instance');
    });

    // Test 2: News parser validation
    test('News parser extracts structured data', async () => {
        const result = await newsParser.invoke({
            text: "Tech stocks surge: Apple up 5%, Google gains 3%"
        });
        assert(typeof result === 'object', 'Should return object');
        assert('headline' in result || 'category' in result, 'Should have headline or category');
    });

    // Test 3: Recipe parser validation
    test('Recipe parser extracts components', async () => {
        const result = await recipeParser.invoke({
            text: "Recipe: Pasta. Ingredients: noodles, sauce. Bake at 400°F for 20 minutes."
        });
        assert(typeof result === 'object', 'Should return object');
        assert('name' in result || 'ingredients' in result, 'Should have recipe components');
    });

    // Test 4: Review parser with fallback
    test('Review parser handles well-formed input', async () => {
        const result = await reviewParser.invoke({
            text: "Product XYZ (Score: 8/10) costs $99. Pros: Good. Cons: Expensive."
        });
        assert(result.method, 'Should indicate parsing method used');
        assert(result.data, 'Should have data');
    });

    test('Review parser falls back gracefully', async () => {
        const result = await reviewParser.invoke({
            text: "This is malformed data that won't parse well"
        });
        // Should not throw, should fall back
        assert(result !== null, 'Should return something even on bad input');
        assert(result.method, 'Should indicate which method was used');
    });

    // Test 5: Router functionality
    test('Router routes to correct parser', async () => {
        const newsResult = await router.invoke({
            text: "Breaking news story",
            type: "news"
        });
        assert(newsResult.type === 'news', 'Should preserve content type');
        assert(newsResult.parsed, 'Should have parsed data');
    });

    // Test 6: End-to-end pipeline
    test('Pipeline processed all samples', () => {
        assert(results.length === CONTENT_SAMPLES.length, 'Should process all samples');
    });

    test('Pipeline has reasonable success rate', () => {
        const successRate = results.filter(r => r.success).length / results.length;
        assert(successRate >= 0.5, 'Should successfully parse at least 50% of samples');
    });

    // Test 7: Error handling
    test('Pipeline handles invalid content type', async () => {
        try {
            await router.invoke({
                text: "Some text",
                type: "invalid_type"
            });
            assert(false, 'Should throw error for invalid type');
        } catch (error) {
            assert(true, 'Correctly throws error for invalid type');
        }
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60));

    if (failed === 0) {
        console.log('\n🎉 All tests passed! You are a parser master!\n');
        console.log('📚 What you mastered:');
        console.log('  • Orchestrating multiple parser types');
        console.log('  • Implementing fallback strategies');
        console.log('  • Using RegexOutputParser for custom patterns');
        console.log('  • Building robust error handling');
        console.log('  • Creating production-ready pipelines');
        console.log('  • Routing content to appropriate parsers');
        console.log('  • Combining structured and pattern-based extraction\n');
        console.log('🚀 You are ready for production parser systems!');
    } else {
        console.log('\n⚠️  Some tests failed. Review the advanced patterns.\n');
    }
}

/**
 * HINTS:
 *
 * 1. RegexOutputParser usage:
 *    new RegexOutputParser({
 *        regex: /Pattern: (.+), Value: (\d+)/,
 *        outputKeys: ["pattern", "value"]
 *    })
 *
 * 2. Fallback strategy:
 *    try {
 *        return await primaryParser.parse(text);
 *    } catch (error) {
 *        return await fallbackParser.parse(text);
 *    }
 *
 * 3. Combining multiple parsers:
 *    - Create separate chains for each
 *    - Call them in sequence or parallel
 *    - Combine results into single object
 *
 * 4. Custom Runnable for orchestration:
 *    class MyParser extends Runnable {
 *        async _call(input, config) {
 *            const result1 = await parser1.parse(...);
 *            const result2 = await parser2.parse(...);
 *            return { result1, result2 };
 *        }
 *    }
 *
 * 5. Regex tips:
 *    - Use () groups to capture data
 *    - Test patterns at regex101.com
 *    - Use \s for whitespace, \d for digits
 *    - Make patterns flexible with .*?
 *
 * 6. Production patterns:
 *    - Always have fallbacks
 *    - Log which method succeeded
 *    - Handle partial failures gracefully
 *    - Return metadata about parsing method
 */