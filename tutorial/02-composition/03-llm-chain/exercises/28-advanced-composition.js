/**
 * EXERCISE 4: Advanced Chain Composition - Production System
 * Difficulty: ⭐⭐⭐⭐ Hard
 *
 * Learning Objectives:
 * - Combine multiple chain patterns
 * - Implement error handling and recovery
 * - Add caching for performance
 * - Implement retry logic
 * - Build monitoring and logging
 * - Create a production-ready system
 *
 * Scenario:
 * You're building a production document analysis system that must:
 * 1. Handle high traffic (caching)
 * 2. Be resilient to failures (retry, fallback)
 * 3. Route different document types to specialized analyzers
 * 4. Monitor performance and errors
 * 5. Provide detailed analytics
 *
 * Instructions:
 * This is a complex exercise that combines everything you've learned.
 * Complete all TODO sections. Run tests to verify your work.
 */

import { SequentialChain } from '../src/chains/sequential-chain.js';
import { RouterChain } from '../src/chains/router-chain.js';
import { LLMChain } from '../src/chains/llm-chain.js';
import { TransformChain } from '../src/chains/transform-chain.js';
import { PromptTemplate } from '../src/prompts/prompt-template.js';
import { StringOutputParser } from '../src/output-parsers/string-parser.js';

// Mock LLMs
class MockAnalysisLLM {
    constructor(failureRate = 0) {
        this.failureRate = failureRate;
        this.callCount = 0;
    }

    async invoke(prompt) {
        this.callCount++;

        // Simulate failures for testing retry
        if (Math.random() < this.failureRate) {
            throw new Error('LLM service temporarily unavailable');
        }

        if (prompt.includes('legal')) {
            return { content: 'Legal analysis: Contract is standard with no major red flags.' };
        } else if (prompt.includes('financial')) {
            return { content: 'Financial analysis: Revenue projections are conservative.' };
        } else if (prompt.includes('technical')) {
            return { content: 'Technical analysis: Architecture is scalable and modern.' };
        }
        return { content: 'General analysis completed.' };
    }
}

// ============================================================================
// TODO 1: Implement a Simple Cache
// ============================================================================
/**
 * Create a cache system for chain results.
 *
 * Requirements:
 * - Store results with a key (based on inputs)
 * - Return cached result if available
 * - Track cache hits and misses
 * - Implement TTL (time to live) - expire after 60 seconds
 */

class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.hits = 0;
        this.misses = 0;
    }

    // TODO: Implement generateKey method
    // Create a unique key from inputs object
    generateKey(inputs) {
        // Hint: Convert inputs to a sorted JSON string
        return null; // Replace with your implementation
    }

    // TODO: Implement get method
    get(key) {
        // Hint: Check if key exists and if TTL hasn't expired
        return null; // Replace with your implementation
    }

    // TODO: Implement set method
    set(key, value, ttl = 60000) {
        // Hint: Store value with timestamp for TTL checking
        return null; // Replace with your implementation
    }

    // TODO: Implement clear method
    clear() {
        // Hint: Clear the cache Map
    }

    getStats() {
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits + this.misses > 0
                ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(2) + '%'
                : '0%'
        };
    }
}

// ============================================================================
// TODO 2: Implement Retry Logic
// ============================================================================
/**
 * Create a retry wrapper for chains.
 *
 * Requirements:
 * - Retry failed operations up to maxRetries times
 * - Implement exponential backoff (delay doubles each retry)
 * - Track retry attempts
 * - Only retry on specific errors (not validation errors)
 */

class RetryWrapper {
    constructor(chain, options = {}) {
        this.chain = chain;
        this.maxRetries = options.maxRetries || 3;
        this.initialDelay = options.initialDelay || 1000;
        this.retryCount = 0;
    }

    // TODO: Implement retry logic
    async invoke(inputs) {
        let lastError;
        let delay = this.initialDelay;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                // TODO: Try to invoke the chain

                // TODO: If successful, return result

                return null; // Replace with your implementation
            } catch (error) {
                lastError = error;

                // TODO: If last attempt, throw error

                // TODO: Check if error is retryable
                // Hint: Don't retry validation errors

                // TODO: Wait with exponential backoff
                // Hint: Use setTimeout wrapped in a Promise

                // TODO: Double the delay for next attempt

                this.retryCount++;
            }
        }

        throw lastError;
    }

    getRetryCount() {
        return this.retryCount;
    }
}

// ============================================================================
// TODO 3: Implement Performance Monitor
// ============================================================================
/**
 * Create a monitoring system for chains.
 *
 * Requirements:
 * - Track execution time
 * - Count successes and failures
 * - Calculate average latency
 * - Log errors with details
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            invocations: 0,
            successes: 0,
            failures: 0,
            totalLatency: 0,
            errors: []
        };
    }

    // TODO: Implement wrapChain method
    // Wrap a chain to monitor its performance
    wrapChain(chain) {
        return {
            async invoke(inputs) {
                const startTime = Date.now();

                // TODO: Increment invocations

                try {
                    // TODO: Invoke the chain

                    // TODO: Record success and latency

                    return null; // Replace with your implementation
                } catch (error) {
                    // TODO: Record failure and error details

                    throw error;
                }
            },
            inputKeys: chain.inputKeys,
            outputKeys: chain.outputKeys
        };
    }

    getMetrics() {
        const avgLatency = this.metrics.invocations > 0
            ? Math.round(this.metrics.totalLatency / this.metrics.invocations)
            : 0;

        const successRate = this.metrics.invocations > 0
            ? ((this.metrics.successes / this.metrics.invocations) * 100).toFixed(2) + '%'
            : '0%';

        return {
            ...this.metrics,
            avgLatency,
            successRate
        };
    }

    getRecentErrors(limit = 5) {
        return this.metrics.errors.slice(-limit);
    }
}

// ============================================================================
// TODO 4: Create Document Type Classifier
// ============================================================================
/**
 * Create a chain that classifies documents by type.
 *
 * Document types: legal, financial, technical, general
 *
 * Classification logic (simple keyword-based):
 * - Legal: contract, agreement, terms, legal, clause
 * - Financial: revenue, profit, budget, financial, investment
 * - Technical: architecture, code, system, technical, API
 * - General: everything else
 */

function createDocumentClassifier() {
    return {
        async invoke(inputs) {
            const content = inputs.content.toLowerCase();

            // TODO: Implement classification logic
            // Hint: Check for keywords in content

            return { documentType: 'general' }; // Replace with your implementation
        },
        inputKeys: ['content'],
        outputKeys: ['documentType']
    };
}

// ============================================================================
// TODO 5: Create Specialized Document Analyzers
// ============================================================================
/**
 * Create three specialized analyzer chains:
 * - Legal analyzer: Checks for risks, compliance issues
 * - Financial analyzer: Analyzes numbers, projections
 * - Technical analyzer: Reviews architecture, tech stack
 */

function createLegalAnalyzer() {
    // TODO: Create an LLMChain for legal analysis
    // Template: "Analyze this legal document for risks and compliance:\n\n{content}"

    return null; // Replace with your implementation
}

function createFinancialAnalyzer() {
    // TODO: Create an LLMChain for financial analysis
    // Template: "Analyze this financial document:\n\n{content}"

    return null; // Replace with your implementation
}

function createTechnicalAnalyzer() {
    // TODO: Create an LLMChain for technical analysis
    // Template: "Analyze this technical document:\n\n{content}"

    return null; // Replace with your implementation
}

function createGeneralAnalyzer() {
    // TODO: Create an LLMChain for general analysis
    // Template: "Summarize and analyze:\n\n{content}"

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 6: Create Analysis Router
// ============================================================================
/**
 * Create a RouterChain that routes documents to the right analyzer.
 */

function createAnalysisRouter() {
    const classifier = createDocumentClassifier();

    const legalChain = createLegalAnalyzer();
    const financialChain = createFinancialAnalyzer();
    const technicalChain = createTechnicalAnalyzer();
    const generalChain = createGeneralAnalyzer();

    // TODO: Create RouterChain
    // Map documentType to appropriate analyzer

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 7: Create Enhanced Analysis Pipeline
// ============================================================================
/**
 * Create a complete analysis pipeline that:
 * 1. Validates input
 * 2. Classifies document
 * 3. Routes to appropriate analyzer
 * 4. Extracts key insights
 * 5. Generates summary report
 */

function createAnalysisPipeline() {
    // Step 1: Validation
    const validationChain = new TransformChain({
        transform: async (inputs) => {
            // TODO: Validate that content exists and has minimum length
            if (!inputs.content || inputs.content.trim().length < 10) {
                throw new Error('Invalid document: content too short');
            }

            return {
                content: inputs.content.trim(),
                timestamp: new Date().toISOString()
            };
        },
        inputVariables: ['content'],
        outputVariables: ['content', 'timestamp']
    });

    // Step 2: Classification and routing
    const router = createAnalysisRouter();

    // Step 3: Extract insights
    const insightsChain = new TransformChain({
        transform: async (inputs) => {
            // TODO: Extract key points from the analysis
            const analysis = inputs.analysis || '';

            // Simple extraction: split by periods and take first 3 sentences
            const insights = analysis
                .split('.')
                .filter(s => s.trim().length > 0)
                .slice(0, 3)
                .map(s => s.trim() + '.');

            return {
                analysis: inputs.analysis,
                insights,
                documentType: inputs.documentType
            };
        },
        inputVariables: ['analysis', 'documentType'],
        outputVariables: ['analysis', 'insights', 'documentType']
    });

    // Step 4: Generate summary report
    const reportChain = new TransformChain({
        transform: async (inputs) => {
            // TODO: Create a comprehensive report
            return {
                report: {
                    documentType: inputs.documentType,
                    analysis: inputs.analysis,
                    insights: inputs.insights,
                    processedAt: inputs.timestamp,
                    confidence: inputs.insights.length > 0 ? 0.85 : 0.5
                }
            };
        },
        inputVariables: ['analysis', 'insights', 'documentType', 'timestamp'],
        outputVariables: ['report']
    });

    // TODO: Combine all chains using SequentialChain
    // Note: The router returns 'analysis', you'll need to pass documentType through

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 8: Create Production System
// ============================================================================
/**
 * Combine everything into a production-ready system with:
 * - Caching
 * - Retry logic
 * - Performance monitoring
 * - Error handling
 */

function createProductionSystem() {
    const cache = new SimpleCache();
    const monitor = new PerformanceMonitor();
    const basePipeline = createAnalysisPipeline();

    // TODO: Wrap pipeline with retry logic
    const resilientPipeline = null; // Replace with RetryWrapper

    // TODO: Wrap with monitoring
    const monitoredPipeline = null; // Replace with monitor.wrapChain()

    return {
        async analyze(content) {
            // TODO: Check cache first
            const cacheKey = cache.generateKey({ content });
            const cached = cache.get(cacheKey);

            if (cached) {
                // TODO: Return cached result
            }

            try {
                // TODO: Process through monitored pipeline

                // TODO: Store in cache

                // TODO: Return result with metadata
                return null; // Replace with your implementation
            } catch (error) {
                // TODO: Handle errors gracefully
                return {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        },

        getStats() {
            return {
                cache: cache.getStats(),
                performance: monitor.getMetrics(),
                recentErrors: monitor.getRecentErrors()
            };
        },

        clearCache() {
            cache.clear();
        }
    };
}

// ============================================================================
// TODO 9: Create Batch Processing System
// ============================================================================
/**
 * Create a system that can process multiple documents in parallel.
 *
 * Requirements:
 * - Process documents concurrently (max 3 at a time)
 * - Return results in original order
 * - Handle partial failures gracefully
 */

function createBatchProcessor() {
    const system = createProductionSystem();

    return {
        async processBatch(documents, concurrency = 3) {
            // TODO: Process documents with limited concurrency
            // Hint: Process in chunks of 'concurrency' size

            const results = [];

            // TODO: Implement batch processing with concurrency limit
            // Hint: Use Promise.all for each chunk

            return results;
        }
    };
}

// ============================================================================
// AUTOMATED TESTS
// ============================================================================

console.log('🧪 Running Exercise 4 Tests...\n');

async function runTests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Cache Implementation
    console.log('Test 1: Cache - Store and Retrieve');
    try {
        const cache = new SimpleCache();
        const key = cache.generateKey({ test: 'data' });

        cache.set(key, 'result');
        const retrieved = cache.get(key);

        if (retrieved !== 'result') {
            throw new Error('Cache should retrieve stored value');
        }

        console.log('   Cache working correctly');
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 2: Cache TTL
    console.log('Test 2: Cache - TTL Expiration');
    try {
        const cache = new SimpleCache();
        const key = cache.generateKey({ test: 'ttl' });

        // Set with very short TTL
        cache.set(key, 'result', 50); // 50ms TTL

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 100));

        const expired = cache.get(key);

        if (expired !== null && expired !== undefined) {
            throw new Error('Cached value should expire after TTL');
        }

        console.log('   TTL expiration working');
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 3: Retry Logic
    console.log('Test 3: Retry Logic - Recovery from Failure');
    try {
        let attempts = 0;
        const failingChain = {
            async invoke(inputs) {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            }
        };

        const retry = new RetryWrapper(failingChain, { maxRetries: 3, initialDelay: 10 });
        const result = await retry.invoke({});

        if (result !== 'success') {
            throw new Error('Retry should eventually succeed');
        }

        if (retry.getRetryCount() < 2) {
            throw new Error('Should have retried at least twice');
        }

        console.log(`   Recovered after ${retry.getRetryCount()} retries`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 4: Performance Monitor
    console.log('Test 4: Performance Monitoring');
    try {
        const monitor = new PerformanceMonitor();

        const testChain = {
            async invoke(inputs) {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'result';
            },
            inputKeys: ['input'],
            outputKeys: ['output']
        };

        const wrapped = monitor.wrapChain(testChain);

        await wrapped.invoke({ input: 'test' });
        await wrapped.invoke({ input: 'test' });

        const metrics = monitor.getMetrics();

        if (metrics.invocations !== 2) {
            throw new Error('Should track invocations');
        }

        if (metrics.successes !== 2) {
            throw new Error('Should track successes');
        }

        if (metrics.avgLatency <= 0) {
            throw new Error('Should track latency');
        }

        console.log(`   Monitored: ${metrics.invocations} calls, ${metrics.avgLatency}ms avg`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 5: Document Classification
    console.log('Test 5: Document Classification');
    try {
        const classifier = createDocumentClassifier();

        const legal = await classifier.invoke({
            content: 'This contract agreement contains legal terms and clauses.'
        });

        if (legal.documentType !== 'legal') {
            throw new Error('Should classify legal documents');
        }

        const financial = await classifier.invoke({
            content: 'The revenue projections show strong financial growth.'
        });

        if (financial.documentType !== 'financial') {
            throw new Error('Should classify financial documents');
        }

        console.log('   Classification working correctly');
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 6: Specialized Analyzers
    console.log('Test 6: Specialized Analyzers Created');
    try {
        const legal = createLegalAnalyzer();
        const financial = createFinancialAnalyzer();
        const technical = createTechnicalAnalyzer();
        const general = createGeneralAnalyzer();

        if (!legal || !financial || !technical || !general) {
            throw new Error('All analyzers must be created');
        }

        console.log('   All analyzers created');
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 7: Analysis Pipeline
    console.log('Test 7: Complete Analysis Pipeline');
    try {
        const pipeline = createAnalysisPipeline();

        if (!pipeline) {
            throw new Error('Pipeline not created');
        }

        const result = await pipeline.invoke({
            content: 'This is a legal contract agreement with various terms and clauses.'
        });

        if (!result.report) {
            throw new Error('Pipeline should return a report');
        }

        if (!result.report.documentType) {
            throw new Error('Report should include document type');
        }

        if (!result.report.analysis) {
            throw new Error('Report should include analysis');
        }

        console.log(`   Analyzed as: ${result.report.documentType}`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 8: Production System with Caching
    console.log('Test 8: Production System - Caching');
    try {
        const system = createProductionSystem();

        const content = 'Test document with financial data and revenue projections.';

        // First call - cache miss
        const result1 = await system.analyze(content);

        // Second call - should hit cache
        const result2 = await system.analyze(content);

        const stats = system.getStats();

        if (stats.cache.hits < 1) {
            throw new Error('Second identical call should hit cache');
        }

        console.log(`   Cache hit rate: ${stats.cache.hitRate}`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 9: Production System - Error Handling
    console.log('Test 9: Production System - Error Handling');
    try {
        const system = createProductionSystem();

        // Try to analyze invalid content
        const result = await system.analyze('');

        if (result.success !== false) {
            throw new Error('Invalid input should fail gracefully');
        }

        if (!result.error) {
            throw new Error('Error result should include error message');
        }

        console.log('   Errors handled gracefully');
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 10: Batch Processing
    console.log('Test 10: Batch Processing');
    try {
        const batchProcessor = createBatchProcessor();

        const documents = [
            'Legal contract with terms',
            'Financial report with revenue',
            'Technical architecture document',
            'General business memo'
        ];

        const results = await batchProcessor.processBatch(documents, 2);

        if (results.length !== documents.length) {
            throw new Error('Should process all documents');
        }

        // Check that results are in order
        for (let i = 0; i < results.length; i++) {
            if (!results[i]) {
                throw new Error(`Document ${i} not processed`);
            }
        }

        console.log(`   Processed ${results.length} documents`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 11: System Statistics
    console.log('Test 11: System Statistics and Monitoring');
    try {
        const system = createProductionSystem();

        // Process some documents
        await system.analyze('Financial revenue report.');
        await system.analyze('Technical system architecture.');

        const stats = system.getStats();

        if (!stats.cache) {
            throw new Error('Stats should include cache metrics');
        }

        if (!stats.performance) {
            throw new Error('Stats should include performance metrics');
        }

        if (stats.performance.invocations < 2) {
            throw new Error('Should track all invocations');
        }

        console.log(`   Performance: ${stats.performance.avgLatency}ms avg, ${stats.performance.successRate} success rate`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Summary
    console.log('='.repeat(50));
    console.log(`Tests Passed: ${passed}/11`);
    console.log(`Tests Failed: ${failed}/11`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n🎉 OUTSTANDING! All tests passed!');
        console.log('You have successfully completed Exercise 4.');
        console.log('\nKey concepts mastered:');
        console.log('✓ Advanced chain composition');
        console.log('✓ Caching for performance');
        console.log('✓ Retry logic and resilience');
        console.log('✓ Performance monitoring');
        console.log('✓ Error handling');
        console.log('✓ Production-ready systems');
        console.log('✓ Batch processing with concurrency');
        console.log('\n🏆 You\'ve completed all chain exercises!');
        console.log('You now have the skills to build production LLM systems.');
    } else {
        console.log('\n📚 This is a challenging exercise. Keep working on it!');
        console.log('Hint: Start with simpler components and build up.');
        console.log('Review the lessons on caching, retry, and monitoring.');
    }
}

// Run the tests
runTests().catch(console.error);