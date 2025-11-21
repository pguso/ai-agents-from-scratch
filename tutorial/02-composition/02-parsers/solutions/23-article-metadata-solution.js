/**
 * Exercise 23: Article Metadata Extractor
 *
 * Difficulty: ⭐⭐⭐☆ (Advanced)
 *
 * Goal: Master StructuredOutputParser with complex schemas and validation
 *
 * In this exercise, you'll:
 * 1. Use StructuredOutputParser with detailed schemas
 * 2. Define fields with types, descriptions, and enums
 * 3. Handle optional vs required fields
 * 4. Build a complete metadata extraction system
 *
 * Skills practiced:
 * - Complex schema definition
 * - Type validation (string, number, boolean, array)
 * - Enum constraints
 * - Required vs optional fields
 * - Error handling and validation
 */

import {Runnable, PromptTemplate, StructuredOutputParser} from '../../../../src/index.js';
import {LlamaCppLLM} from '../../../../src/llm/llama-cpp-llm.js';
import {QwenChatWrapper} from "node-llama-cpp";

// Sample articles to extract metadata from
const ARTICLES = [
    {
        title: "The Future of AI in Healthcare",
        content: `Artificial intelligence is revolutionizing healthcare. From diagnostic tools to 
personalized treatment plans, AI is improving patient outcomes. Recent studies show 85% accuracy 
in detecting certain cancers. However, challenges remain around data privacy and ethical concerns.
This technology will continue to transform medicine in the coming decade.`,
        author: "Dr. Sarah Johnson"
    },
    {
        title: "Climate Change: A Global Challenge",
        content: `Climate change poses an existential threat to humanity. Rising temperatures, 
extreme weather events, and sea level rise are already impacting millions. The latest IPCC report 
warns we have less than 10 years to act. Renewable energy and carbon reduction are critical.
International cooperation is essential to address this crisis.`,
        author: "Michael Chen"
    },
    {
        title: "The Rise of Remote Work",
        content: `The pandemic accelerated the shift to remote work. Many companies now offer 
hybrid or fully remote options. Productivity studies show mixed results - some teams thrive, 
others struggle. Work-life balance improves for many, but isolation is a concern. The future 
of work will likely be flexible, with employees choosing their preferred setup.`,
        author: "Emma Williams"
    }
];

/**
 * Build a chain that extracts comprehensive article metadata with validation
 */
async function createArticleMetadataExtractor() {
    const parser = new StructuredOutputParser({
        responseSchemas: [
            {
                name: "category",
                type: "string",
                enum: ["technology", "health", "environment", "business", "other"],
                required: true
            },
            {
                name: "sentiment",
                type: "string",
                enum: ["positive", "negative", "neutral", "mixed"],
                required: true
            },
            {
                name: "readingLevel",
                type: "string",
                enum: ["beginner", "intermediate", "advanced"],
                required: true
            },
            {
                name: "mainTopics",
                type: "array",
                required: true
            },
            {
                name: "hasCitations",
                type: "boolean",
                required: false
            },
            {
                name: "estimatedReadTime",
                type: "number",
                required: false
            },
            {
                name: "keyTakeaway",
                type: "string",
                required: false
            },
            {
                name: "targetAudience",
                type: "string",
                required: false
            }
        ]
    });

    const prompt = new PromptTemplate({
        template: `You are an advanced content-analysis system. 
Analyze the following article and extract the required structured metadata.

ARTICLE DATA:
Title: {title}
Author: {author}
Content:
{content}

{format_instructions}`,
        inputVariables: ["title", "author", "content"],
        partialVariables: {
            format_instructions: parser.getFormatInstructions()
        }
    });

    const llm = new LlamaCppLLM({
        modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
        chatWrapper: new QwenChatWrapper({
            thoughts: 'discourage'  // Prevents the model from outputting thinking tokens
        }),
    });

    const chain = prompt.pipe(llm).pipe(parser);

    return chain;
}

/**
 * Build a chain that analyzes content quality with scores
 */
async function createQualityAnalyzer() {
    const parser = new StructuredOutputParser({
        responseSchemas: [
            {
                name: "clarity",
                type: "number",
                required: true
            },
            {
                name: "depth",
                type: "number",
                required: true
            },
            {
                name: "accuracy",
                type: "number",
                required: true
            },
            {
                name: "engagement",
                type: "number",
                required: true
            },
            {
                name: "overallScore",
                type: "number",
                required: true
            },
            {
                name: "strengths",
                type: "array",
                required: true
            },
            {
                name: "improvements",
                type: "array",
                required: true
            },
            {
                name: "recommendation",
                type: "string",
                enum: ["publish", "revise", "reject"],
                required: true
            }
        ]
    });

    const prompt = new PromptTemplate({
        template: `Analyze the quality of this {article} {format_instructions}`,
        inputVariables: ["article"],
        partialVariables: {
            format_instructions: parser.getFormatInstructions()
        }
    });

    const llm = new LlamaCppLLM({
        modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
        chatWrapper: new QwenChatWrapper({
            thoughts: 'discourage'  // Prevents the model from outputting thinking tokens
        }),
    });

    const chain = prompt.pipe(llm).pipe(parser);

    return chain;
}

// ============================================================================
// TODO 3: Create SEO Optimizer
// ============================================================================

/**
 * Build a chain that provides SEO recommendations
 */
async function createSEOOptimizer() {
    const parser = new StructuredOutputParser({
        responseSchemas: [
            {
                name: "suggestedKeywords",
                type: "array",
                required: true
            },
            {
                name: "metaDescription",
                type: "string",
                required: true
            },
            {
                name: "hasGoodTitle",
                type: "boolean",
                required: true
            },
            {
                name: "readabilityScore",
                type: "number",
                required: true
            },
            {
                name: "seoScore",
                type: "number",
                required: true
            },
            {
                name: "recommendations",
                type: "array",
                required: true
            }
        ]
    });

    const prompt = new PromptTemplate({
        template: `Optimize this article for seo {article} {format_instructions}`,
        inputVariables: ["article"],
        partialVariables: {
            format_instructions: parser.getFormatInstructions()
        }
    });

    const llm = new LlamaCppLLM({
        modelPath: './models/Qwen3-1.7B-Q6_K.gguf',
        chatWrapper: new QwenChatWrapper({
            thoughts: 'discourage'  // Prevents the model from outputting thinking tokens
        }),
    });

    // TODO: Build chain
    const chain = prompt.pipe(llm).pipe(parser);

    return chain;
}

// ============================================================================
// TODO 4: Process Articles and Validate All Metadata
// ============================================================================

async function analyzeArticles() {
    console.log('=== Exercise 23: Article Metadata Extractor ===\n');

    // TODO: Create all chains
    const metadataChain = await createArticleMetadataExtractor();
    const qualityChain = await createQualityAnalyzer();
    const seoChain = await createSEOOptimizer();

    // Process each article
    for (let i = 0; i < ARTICLES.length; i++) {
        const article = ARTICLES[i];

        console.log('='.repeat(70));
        console.log(`ARTICLE ${i + 1}: ${article.title}`);
        console.log('='.repeat(70));
        console.log(`Author: ${article.author}`);
        console.log(`Content: ${article.content.substring(0, 100)}...`);
        console.log();

        try {
            console.log('--- Metadata ---');
            const metadata = await metadataChain.invoke({
                title: article.title,
                author: article.author,
                content: article.content
            });
            console.log(JSON.stringify(metadata, null, 2));
            console.log();

            console.log('--- Quality Analysis ---');
            const quality = await qualityChain.invoke({article});
            console.log(JSON.stringify(quality, null, 2));
            console.log();

            console.log('--- SEO Recommendations ---');
            const seo = await seoChain.invoke({article});
            console.log(JSON.stringify(seo, null, 2));
            console.log();

        } catch (error) {
            console.error(`Error processing article: ${error.message}`);
            console.log();
        }
    }

    console.log('✓ Exercise 23 Complete!');

    return { metadataChain, qualityChain, seoChain };
}

// Run the exercise
analyzeArticles()
    .then(runTests)
    .catch(console.error);

// ============================================================================
// AUTOMATED TESTS
// ============================================================================

async function runTests(results) {
    const { metadataChain, qualityChain, seoChain } = results;

    console.log('\n' + '='.repeat(60));
    console.log('RUNNING AUTOMATED TESTS');
    console.log('='.repeat(60) + '\n');

    const assert = (await import('assert')).default;
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            passed++;
            console.log(`✅ ${name}`);
        } catch (error) {
            failed++;
            console.error(`❌ ${name}`);
            console.error(`   ${error.message}\n`);
        }
    }

    const testArticle = {
        title: "Test Article",
        content: "This is test content about artificial intelligence in healthcare.",
        author: "Test Author"
    };

    // Test 1: Chains created
    test('Metadata chain created', async () => {
        assert(metadataChain !== null, 'Create metadataChain');
    });

    test('Quality chain created', async () => {
        assert(qualityChain !== null, 'Create qualityChain');
    });

    test('SEO chain created', async () => {
        assert(seoChain !== null, 'Create seoChain');
    });

    // Test 2: Metadata extraction
    test('Metadata has required fields', async () => {
        const result = await metadataChain.invoke({
            title: testArticle.title,
            author: testArticle.author,
            content: testArticle.content
        });

        assert('category' in result, 'Should have category');
        assert('sentiment' in result, 'Should have sentiment');
        assert('mainTopics' in result, 'Should have mainTopics');
    });

    test('Metadata category is valid enum', async () => {
        const result = await metadataChain.invoke({
            title: testArticle.title,
            author: testArticle.author,
            content: testArticle.content
        });

        const validCategories = ["technology", "health", "environment", "business", "other"];
        assert(
            validCategories.includes(result.category),
            `Category should be one of: ${validCategories.join(', ')}`
        );
    });

    test('Metadata sentiment is valid enum', async () => {
        const result = await metadataChain.invoke({
            title: testArticle.title,
            author: testArticle.author,
            content: testArticle.content
        });

        const validSentiments = ["positive", "negative", "neutral", "mixed"];
        assert(
            validSentiments.includes(result.sentiment),
            `Sentiment should be one of: ${validSentiments.join(', ')}`
        );
    });

    test('Metadata mainTopics is array', async () => {
        const result = await metadataChain.invoke({
            title: testArticle.title,
            author: testArticle.author,
            content: testArticle.content
        });

        assert(Array.isArray(result.mainTopics), 'mainTopics should be array');
        assert(result.mainTopics.length > 0, 'mainTopics should not be empty');
    });

    test('Metadata estimatedReadTime is number', async () => {
        const result = await metadataChain.invoke({
            title: testArticle.title,
            author: testArticle.author,
            content: testArticle.content
        });

        assert(typeof result.estimatedReadTime === 'number', 'estimatedReadTime should be number');
        assert(result.estimatedReadTime > 0, 'estimatedReadTime should be positive');
    });

    test('Metadata hasCitations is boolean', async () => {
        const result = await metadataChain.invoke({
            title: testArticle.title,
            author: testArticle.author,
            content: testArticle.content
        });

        assert(typeof result.hasCitations === 'boolean', 'hasCitations should be boolean');
    });

    // Test 3: Quality analysis
    test('Quality scores are numbers', async () => {
        const result = await qualityChain.invoke({ article: testArticle });

        assert(typeof result.clarity === 'number', 'clarity should be number');
        assert(typeof result.depth === 'number', 'depth should be number');
        assert(typeof result.overallScore === 'number', 'overallScore should be number');
    });

    test('Quality scores are in valid range', async () => {
        const result = await qualityChain.invoke({ article: testArticle });

        assert(result.clarity >= 1 && result.clarity <= 10, 'clarity should be 1-10');
        assert(result.overallScore >= 1 && result.overallScore <= 10, 'overallScore should be 1-10');
    });

    test('Quality has array fields', async () => {
        const result = await qualityChain.invoke({ article: testArticle });

        assert(Array.isArray(result.strengths), 'strengths should be array');
        assert(Array.isArray(result.improvements), 'improvements should be array');
    });

    test('Quality recommendation is valid', async () => {
        const result = await qualityChain.invoke({ article: testArticle });

        const validRecommendations = ["publish", "revise", "reject"];
        assert(
            validRecommendations.includes(result.recommendation),
            `recommendation should be one of: ${validRecommendations.join(', ')}`
        );
    });

    // Test 4: SEO optimization
    test('SEO has keyword suggestions', async () => {
        const result = await seoChain.invoke({ article: testArticle });

        assert(Array.isArray(result.suggestedKeywords), 'suggestedKeywords should be array');
        assert(result.suggestedKeywords.length > 0, 'Should suggest at least one keyword');
    });

    test('SEO metaDescription is appropriate length', async () => {
        const result = await seoChain.invoke({ article: testArticle });

        assert(typeof result.metaDescription === 'string', 'metaDescription should be string');
        assert(result.metaDescription.length <= 200, 'metaDescription should be concise');
    });

    test('SEO scores are in valid range', async () => {
        const result = await seoChain.invoke({ article: testArticle });

        assert(result.readabilityScore >= 1 && result.readabilityScore <= 100);
        assert(result.seoScore >= 1 && result.seoScore <= 100);
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
        console.log('\n🎉 All tests passed!\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check your implementation.\n');
    }
}

/**
 * HINTS:
 *
 * 1. StructuredOutputParser with full schema:
 *    new StructuredOutputParser({
 *        responseSchemas: [
 *            {
 *                name: "category",
 *                type: "string",
 *                description: "Article category",
 *                enum: ["tech", "health", "business"],
 *                required: true
 *            },
 *            {
 *                name: "score",
 *                type: "number",
 *                description: "Quality score 1-10"
 *            }
 *        ]
 *    })
 *
 * 2. Always include format instructions:
 *    partialVariables: {
 *        format_instructions: parser.getFormatInstructions()
 *    }
 *
 * 3. Types supported:
 *    - "string"
 *    - "number"
 *    - "boolean"
 *    - "array"
 *    - "object"
 *
 * 4. The parser will:
 *    - Validate all required fields exist
 *    - Check type of each field
 *    - Verify enum values if specified
 *    - Throw detailed errors on validation failure
 *
 * 5. For better LLM compliance:
 *    - Use low temperature (0.1-0.2)
 *    - Be explicit in prompts
 *    - Include examples if needed
 *    - Reference the format instructions clearly
 */