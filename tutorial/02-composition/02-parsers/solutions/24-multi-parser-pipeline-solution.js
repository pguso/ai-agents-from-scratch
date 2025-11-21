/**
 * Exercise 24: Multi-Parser Content Pipeline
 *
 * Difficulty: ⭐⭐⭐⭐ (Expert)
 *
 * Goal: Build a robust content processing pipeline using multiple parsers with fallbacks
 *
 * Skills gained:
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

/**
 * Extract structured data from news articles
 */
async function createNewsParser() {
    const parser = new StructuredOutputParser({
        responseSchemas: [
            {
                name: "headline",
                description: "A brief, catchy headline summarizing the article",
                type: "string",
                required: true
            },
            {
                name: "category",
                description: "The primary category of the article",
                type: "string",
                enum: ["business", "technology", "politics", "sports", "other"],
                required: true
            },
            {
                name: "sentiment",
                description: "The overall sentiment or tone of the article",
                type: "string",
                enum: ["positive", "negative", "neutral"],
                required: true
            },
            {
                name: "entities",
                description: "List of notable entities mentioned in the article such as companies, people, and places",
                type: "array"
            },
            {
                name: "marketData",
                description: "Any numerical market data or statistics mentioned with their context (e.g., 'NASDAQ up 2.5%', 'unemployment at 3.8%')",
                type: "array"
            }
        ]
    });

    const prompt = new PromptTemplate({
        template: `Analyze this news article and extract structured information.

Article: {text}

{format_instructions}

Be precise and extract all relevant entities and market data mentioned.`,
        inputVariables: ["text"],
        partialVariables: {
            format_instructions: parser.getFormatInstructions()
        }
    });

    const llm = new LlamaCppLLM({
        modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
        chatWrapper: new QwenChatWrapper({
            thoughts: 'discourage'
        }),
    });

    const chain = prompt.pipe(llm).pipe(parser);

    return chain;
}

/**
 * Extract recipe components using regex and list parsers
 */
async function createRecipeParser() {
    const nameParser = new RegexOutputParser({
        regex: /Recipe:\s*(.+?)\./
    });

    const cookingParser = new RegexOutputParser({
        regex: /(\d+)°F.*?(\d+)\s*minutes/
    });

    const ingredientsPrompt = new PromptTemplate({
        template: `Extract only the ingredients from this recipe as a comma-separated list. Only list the ingredients, nothing else.

Recipe: {text}

Return only the ingredients as a comma-separated list.`,
        inputVariables: ["text"]
    });

    const llm = new LlamaCppLLM({
        modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
        chatWrapper: new QwenChatWrapper({
            thoughts: 'discourage'
        }),
        temperature: 0.1
    });

    const ingredientsParser = new ListOutputParser();

    class RecipeParserRunnable extends Runnable {
        async _call(input, config) {
            const text = input.text;

            try {
                const nameResult = await nameParser.parse(text);
                const name = Array.isArray(nameResult) ? nameResult[0] : nameResult;

                const ingredientsChain = ingredientsPrompt.pipe(llm).pipe(ingredientsParser);
                const ingredients = await ingredientsChain.invoke({text}, config);

                const cookingResult = await cookingParser.parse(text);
                const temperature = Array.isArray(cookingResult) && cookingResult.length >= 1 ? cookingResult[0] : null;
                const time = Array.isArray(cookingResult) && cookingResult.length >= 2 ? cookingResult[1] : null;

                return {
                    name,
                    ingredients,
                    temperature: temperature ? `${temperature}°F` : null,
                    time: time ? `${time} minutes` : null
                };
            } catch (error) {
                return {
                    name: text.match(/Recipe:\s*(.+?)\./)?.[1] || "Unknown",
                    ingredients: [],
                    temperature: text.match(/(\d+)°F/)?.[1] || null,
                    time: text.match(/(\d+)\s*minutes/)?.[1] || null,
                    error: error.message
                };
            }
        }
    }

    return new RecipeParserRunnable();
}

/**
 * Parse product reviews with fallback strategy
 * Try structured parser first, fall back to regex if it fails
 */
async function createReviewParser() {
    const llm = new LlamaCppLLM({
        modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
        chatWrapper: new QwenChatWrapper({
            thoughts: 'discourage'
        }),
        temperature: 0.1
    });

    const structuredParser = new StructuredOutputParser({
        responseSchemas: [
            {
                name: "productName",
                description: "The name or model of the product being reviewed",
                type: "string",
                required: true
            },
            {
                name: "score",
                description: "The numerical rating or score given to the product (e.g., 8.5, 7/10)",
                type: "number",
                required: true
            },
            {
                name: "pros",
                description: "List of positive aspects or advantages of the product",
                type: "array",
                required: false
            },
            {
                name: "cons",
                description: "List of negative aspects or disadvantages of the product",
                type: "array",
                required: false
            },
            {
                name: "price",
                description: "The price of the product if mentioned (as a string with currency symbol, e.g., '$1,199')",
                type: "string",
                required: false
            }
        ]
    });

    const regexParser = new RegexOutputParser({
        regex: /(?:Product Review:|The)?\s*(.+?)\s*\(Score:\s*([\d.]+)(?:\/10)?\).*?\$([0-9,]+)/
    });

    class ReviewParserWithFallback extends Runnable {
        async _call(input, config) {
            const text = input.text;

            try {
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
                    const result = await regexParser.parse(text);

                    return {
                        method: 'regex',
                        data: {
                            productName: Array.isArray(result) && result.length > 0 ? result[0] : null,
                            score: Array.isArray(result) && result.length > 1 ? parseFloat(result[1]) : null,
                            price: Array.isArray(result) && result.length > 2 ? `$${result[2]}` : null
                        }
                    };
                } catch (regexError) {
                    console.warn('Regex parsing failed, using basic extraction');

                    const productMatch = text.match(/(?:Product Review:|The)?\s*(.+?)\s*\(/);
                    const scoreMatch = text.match(/Score:\s*([\d.]+)/);
                    const priceMatch = text.match(/\$([0-9,]+)/);

                    return {
                        method: 'basic',
                        data: {
                            productName: productMatch ? productMatch[1].trim() : null,
                            score: scoreMatch ? parseFloat(scoreMatch[1]) : null,
                            price: priceMatch ? `$${priceMatch[1]}` : null,
                            text: text
                        }
                    };
                }
            }
        }
    }

    return new ReviewParserWithFallback();
}

/**
 * Route content to appropriate parser based on content type
 */
class ContentRouter extends Runnable {
    constructor(parsers) {
        super();
        this.parsers = parsers;
    }

    async _call(input, config) {
        const {text, type} = input;

        const parser = this.parsers[type];

        if (!parser) {
            throw new Error(`No parser for content type: ${type}`);
        }

        const result = await parser.invoke({text}, config);

        return {
            type: type,
            parsed: result,
            originalText: text
        };
    }
}

async function buildContentPipeline() {
    console.log('=== Exercise 24: Multi-Parser Content Pipeline ===\n');

    const newsParser = await createNewsParser();
    const recipeParser = await createRecipeParser();
    const reviewParser = await createReviewParser();

    const router = new ContentRouter({
        news: newsParser,
        recipe: recipeParser,
        review: reviewParser
    });

    console.log('Processing content samples...\n');

    const results = [];

    for (let i = 0; i < CONTENT_SAMPLES.length; i++) {
        const sample = CONTENT_SAMPLES[i];

        console.log('='.repeat(70));
        console.log(`SAMPLE ${i + 1}: ${sample.type.toUpperCase()}`);
        console.log('='.repeat(70));
        console.log(`Text: ${sample.text}\n`);

        try {
            const result = await router.invoke({text: sample.text, type: sample.type});

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

    console.log('='.repeat(70));
    console.log('PROCESSING SUMMARY');
    console.log('='.repeat(70));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Total Samples: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

    console.log('\n✓ Exercise 24 Complete!');

    return {newsParser, recipeParser, reviewParser, router, results};
}

buildContentPipeline()
    .then(runTests)
    .catch(console.error);

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

    test('News parser extracts structured data', async () => {
        const result = await newsParser.invoke({
            text: "Tech stocks surge: Apple up 5%, Google gains 3%"
        });
        assert(typeof result === 'object', 'Should return object');
        assert('headline' in result || 'category' in result, 'Should have headline or category');
    });

    test('Recipe parser extracts components', async () => {
        const result = await recipeParser.invoke({
            text: "Recipe: Pasta. Ingredients: noodles, sauce. Bake at 400°F for 20 minutes."
        });
        assert(typeof result === 'object', 'Should return object');
        assert('name' in result || 'ingredients' in result, 'Should have recipe components');
    });

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
        assert(result !== null, 'Should return something even on bad input');
        assert(result.method, 'Should indicate which method was used');
    });

    test('Router routes to correct parser', async () => {
        const newsResult = await router.invoke({
            text: "Breaking news story",
            type: "news"
        });
        assert(newsResult.type === 'news', 'Should preserve content type');
        assert(newsResult.parsed, 'Should have parsed data');
    });

    test('Pipeline processed all samples', () => {
        assert(results.length === CONTENT_SAMPLES.length, 'Should process all samples');
    });

    test('Pipeline has reasonable success rate', () => {
        const successRate = results.filter(r => r.success).length / results.length;
        assert(successRate >= 0.5, 'Should successfully parse at least 50% of samples');
    });

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