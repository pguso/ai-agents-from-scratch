/**
 * EXERCISE 3: Router Chain - Smart Routing
 * Difficulty: ⭐⭐⭐ Medium-Hard
 *
 * Learning Objectives:
 * - Understand how to route inputs to different chains
 * - Learn about classifier chains
 * - Work with multiple destination chains
 * - Handle default/fallback cases
 *
 * Scenario:
 * You're building a smart customer service system that routes messages
 * to different specialized handlers based on the type of request.
 *
 * Message types:
 * - technical: Technical support questions (bugs, errors, how-to)
 * - billing: Payment, subscription, refund questions
 * - sales: Product inquiries, pricing, demos
 * - general: Everything else
 *
 * Instructions:
 * Complete all TODO sections below. Run the tests at the end to verify your work.
 */

import { RouterChain } from '../src/chains/router-chain.js';
import { LLMChain } from '../src/chains/llm-chain.js';
import { TransformChain } from '../src/chains/transform-chain.js';
import { PromptTemplate } from '../src/prompts/prompt-template.js';
import { StringOutputParser } from '../src/output-parsers/string-parser.js';

// Mock LLM for testing
class MockClassifierLLM {
    async invoke(prompt) {
        const lowerPrompt = prompt.toLowerCase();

        // Classify based on keywords
        if (lowerPrompt.includes('bug') || lowerPrompt.includes('error') ||
            lowerPrompt.includes('crash') || lowerPrompt.includes('not working')) {
            return { content: 'technical' };
        } else if (lowerPrompt.includes('payment') || lowerPrompt.includes('billing') ||
            lowerPrompt.includes('refund') || lowerPrompt.includes('charge')) {
            return { content: 'billing' };
        } else if (lowerPrompt.includes('price') || lowerPrompt.includes('buy') ||
            lowerPrompt.includes('demo') || lowerPrompt.includes('features')) {
            return { content: 'sales' };
        } else {
            return { content: 'general' };
        }
    }
}

class MockResponseLLM {
    async invoke(prompt) {
        const lowerPrompt = prompt.toLowerCase();

        if (lowerPrompt.includes('technical')) {
            return { content: 'Technical support response: I can help you troubleshoot that issue.' };
        } else if (lowerPrompt.includes('billing')) {
            return { content: 'Billing support response: Let me look into your account.' };
        } else if (lowerPrompt.includes('sales')) {
            return { content: 'Sales response: I\'d be happy to tell you more about our products.' };
        } else {
            return { content: 'General support response: How can I assist you today?' };
        }
    }
}

// ============================================================================
// TODO 1: Create a Message Classifier Chain
// ============================================================================
/**
 * Create an LLMChain that classifies customer messages.
 *
 * Requirements:
 * - Use PromptTemplate with template:
 *   "Classify this customer message into one category: technical, billing, sales, or general.\n\nMessage: {message}\n\nCategory:"
 * - Input variable: "message"
 * - Output key: "route"
 * - Use StringOutputParser to clean output
 * - Trim and lowercase the result
 */

function createClassifierChain() {
    // TODO: Implement the classifier chain
    // Hint: The output should be a clean category name (lowercase, trimmed)

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 2: Create Specialized Handler Chains
// ============================================================================
/**
 * Create four specialized chains, one for each category.
 *
 * Each chain should:
 * - Accept input: { message, route }
 * - Use a PromptTemplate that includes the department context
 * - Return a helpful response
 *
 * Templates:
 * - Technical: "As a technical support specialist, help with: {message}"
 * - Billing: "As a billing specialist, help with: {message}"
 * - Sales: "As a sales representative, help with: {message}"
 * - General: "As a customer service representative, help with: {message}"
 */

function createTechnicalChain() {
    // TODO: Implement technical support chain

    return null; // Replace with your implementation
}

function createBillingChain() {
    // TODO: Implement billing support chain

    return null; // Replace with your implementation
}

function createSalesChain() {
    // TODO: Implement sales support chain

    return null; // Replace with your implementation
}

function createGeneralChain() {
    // TODO: Implement general support chain

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 3: Create a Basic Router Chain
// ============================================================================
/**
 * Create a RouterChain that routes to the appropriate handler.
 *
 * Requirements:
 * - Use the classifier chain as routerChain
 * - Map categories to destination chains:
 *   - "technical" → technicalChain
 *   - "billing" → billingChain
 *   - "sales" → salesChain
 *   - "general" → generalChain
 * - Set routeKey to "route"
 * - Use generalChain as defaultChain
 */

function createCustomerServiceRouter() {
    // TODO: Create all necessary chains
    const classifierChain = createClassifierChain();
    const technicalChain = createTechnicalChain();
    const billingChain = createBillingChain();
    const salesChain = createSalesChain();
    const generalChain = createGeneralChain();

    // TODO: Create and return RouterChain

    return null; // Replace with your implementation
}

// ============================================================================
// TODO 4: Create a Router with Priority Handling
// ============================================================================
/**
 * Create a router that detects urgent/high-priority messages
 * and routes them specially.
 *
 * Requirements:
 * - Check if message contains urgent keywords: "urgent", "emergency", "asap", "critical"
 * - If urgent: route to a special priority handler (even if it would normally go elsewhere)
 * - If not urgent: use normal routing
 *
 * This requires creating a custom routing logic before the router.
 */

function createPriorityRouter() {
    const router = createCustomerServiceRouter();

    // Create priority handler chain
    const priorityChain = new LLMChain({
        prompt: new PromptTemplate({
            template: '[PRIORITY] Urgent assistance needed: {message}',
            inputVariables: ['message']
        }),
        llm: new MockResponseLLM(),
        outputParser: new StringOutputParser()
    });

    return {
        async invoke(inputs) {
            // TODO: Check if message is urgent
            const isUrgent = false; // Replace with urgency detection logic

            // TODO: If urgent, use priority chain
            // TODO: If not urgent, use normal router

            return null; // Replace with your implementation
        },
        inputKeys: ['message'],
        outputKeys: ['response']
    };
}

// ============================================================================
// TODO 5: Create a Multi-Category Router
// ============================================================================
/**
 * Some messages might belong to multiple categories.
 * Create a router that:
 * 1. Classifies message into multiple categories
 * 2. Routes to ALL applicable chains
 * 3. Combines responses
 *
 * Example: "I have a billing error" → technical + billing
 */

function createMultiCategoryRouter() {
    // TODO: Create a custom classifier that returns multiple categories
    const multiClassifier = {
        async invoke(inputs) {
            const message = inputs.message.toLowerCase();
            const categories = [];

            // TODO: Check for each category and add to array
            // Hint: A message can match multiple categories

            return { categories }; // Return array of categories
        }
    };

    // Get handler chains
    const technicalChain = createTechnicalChain();
    const billingChain = createBillingChain();
    const salesChain = createSalesChain();
    const generalChain = createGeneralChain();

    const handlers = {
        technical: technicalChain,
        billing: billingChain,
        sales: salesChain,
        general: generalChain
    };

    return {
        async invoke(inputs) {
            // TODO: Classify into multiple categories

            // TODO: Route to all applicable chains in parallel
            // Hint: Use Promise.all

            // TODO: Combine responses

            return null; // Replace with your implementation
        },
        inputKeys: ['message'],
        outputKeys: ['responses', 'categories']
    };
}

// ============================================================================
// TODO 6: Create a Router with Confidence Scoring
// ============================================================================
/**
 * Create a router that:
 * 1. Classifies the message with confidence scores
 * 2. Only routes if confidence is above threshold (0.7)
 * 3. If low confidence, routes to human review
 *
 * This simulates a real-world scenario where uncertain classifications
 * should be handled by humans.
 */

function createConfidenceRouter() {
    // TODO: Create a classifier that returns category and confidence
    const confidenceClassifier = {
        async invoke(inputs) {
            const message = inputs.message.toLowerCase();

            // TODO: Determine category and confidence
            // High confidence: clear keywords present
            // Low confidence: ambiguous message

            let category = 'general';
            let confidence = 0.5;

            // TODO: Implement confidence scoring logic
            // Hint: Check for multiple strong keywords = higher confidence

            return { category, confidence };
        }
    };

    const router = createCustomerServiceRouter();

    // Human review chain (for low confidence)
    const humanReviewChain = {
        async invoke(inputs) {
            return {
                response: '[HUMAN REVIEW REQUIRED] Message flagged for manual review.',
                needsReview: true,
                originalMessage: inputs.message
            };
        }
    };

    return {
        async invoke(inputs) {
            // TODO: Get classification with confidence

            // TODO: If confidence >= 0.7, route normally

            // TODO: If confidence < 0.7, route to human review

            return null; // Replace with your implementation
        },
        inputKeys: ['message'],
        outputKeys: ['response', 'confidence', 'category', 'needsReview']
    };
}

// ============================================================================
// TODO 7: Create a Context-Aware Router
// ============================================================================
/**
 * Create a router that considers conversation context.
 *
 * Requirements:
 * - Accept previous messages in context
 * - If user previously talked to technical support, bias towards technical
 * - If no context, use normal routing
 *
 * Input: { message, context: { previousCategory, messageCount } }
 */

function createContextAwareRouter() {
    const router = createCustomerServiceRouter();

    return {
        async invoke(inputs) {
            const { message, context } = inputs;

            // TODO: Check if there's context

            // TODO: If messageCount >= 2 and previousCategory exists,
            //       strongly consider continuing with same category

            // TODO: Otherwise use normal routing

            return null; // Replace with your implementation
        },
        inputKeys: ['message', 'context'],
        outputKeys: ['response', 'category']
    };
}

// ============================================================================
// AUTOMATED TESTS
// ============================================================================

console.log('🧪 Running Exercise 3 Tests...\n');

async function runTests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Classifier Chain
    console.log('Test 1: Message Classification');
    try {
        const classifier = createClassifierChain();

        if (!classifier) {
            throw new Error('Classifier chain is null');
        }

        const result = await classifier.invoke({
            message: 'I found a bug in the app'
        });

        if (!result || (typeof result !== 'string' && !result.route)) {
            throw new Error('Classifier should return a route');
        }

        const route = typeof result === 'string' ? result : result.route;

        if (route !== 'technical') {
            throw new Error(`Bug report should classify as "technical", got "${route}"`);
        }

        console.log(`   Message classified as: ${route}`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 2: Handler Chains Exist
    console.log('Test 2: All Handler Chains Created');
    try {
        const technical = createTechnicalChain();
        const billing = createBillingChain();
        const sales = createSalesChain();
        const general = createGeneralChain();

        if (!technical || !billing || !sales || !general) {
            throw new Error('All handler chains must be created');
        }

        console.log('   All handler chains created successfully');
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 3: Basic Router - Technical Route
    console.log('Test 3: Router - Technical Support Route');
    try {
        const router = createCustomerServiceRouter();

        if (!router) {
            throw new Error('Router is null');
        }

        const result = await router.invoke({
            message: 'The app keeps crashing when I try to log in'
        });

        if (!result || typeof result !== 'string') {
            throw new Error('Router should return a response string');
        }

        if (!result.toLowerCase().includes('technical')) {
            throw new Error('Response should indicate technical support');
        }

        console.log(`   Routed to technical support correctly`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 4: Basic Router - Billing Route
    console.log('Test 4: Router - Billing Support Route');
    try {
        const router = createCustomerServiceRouter();

        const result = await router.invoke({
            message: 'I was charged twice this month'
        });

        if (!result.toLowerCase().includes('billing')) {
            throw new Error('Response should indicate billing support');
        }

        console.log(`   Routed to billing support correctly`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 5: Basic Router - Sales Route
    console.log('Test 5: Router - Sales Support Route');
    try {
        const router = createCustomerServiceRouter();

        const result = await router.invoke({
            message: 'What are your pricing plans?'
        });

        if (!result.toLowerCase().includes('sales')) {
            throw new Error('Response should indicate sales support');
        }

        console.log(`   Routed to sales support correctly`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 6: Priority Router
    console.log('Test 6: Priority Router - Urgent Messages');
    try {
        const router = createPriorityRouter();

        const result = await router.invoke({
            message: 'URGENT: System is down and we are losing money!'
        });

        if (!result || !result.response) {
            throw new Error('Priority router should return response');
        }

        if (!result.response.includes('PRIORITY') && !result.response.includes('Urgent')) {
            throw new Error('Urgent messages should be marked as priority');
        }

        console.log(`   Urgent message handled with priority`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 7: Priority Router - Normal Messages
    console.log('Test 7: Priority Router - Normal Messages');
    try {
        const router = createPriorityRouter();

        const result = await router.invoke({
            message: 'How do I reset my password?'
        });

        if (!result || !result.response) {
            throw new Error('Router should return response');
        }

        // Should route normally, not as priority
        if (result.response.includes('PRIORITY')) {
            throw new Error('Normal messages should not be marked as priority');
        }

        console.log(`   Normal message routed correctly`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 8: Multi-Category Router
    console.log('Test 8: Multi-Category Router');
    try {
        const router = createMultiCategoryRouter();

        const result = await router.invoke({
            message: 'I have a billing error in my account'
        });

        if (!result.categories || !Array.isArray(result.categories)) {
            throw new Error('Should return categories array');
        }

        if (result.categories.length < 2) {
            throw new Error('Message should match multiple categories (billing + technical)');
        }

        if (!result.responses || !Array.isArray(result.responses)) {
            throw new Error('Should return responses array');
        }

        console.log(`   Detected ${result.categories.length} categories: ${result.categories.join(', ')}`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 9: Confidence Router - High Confidence
    console.log('Test 9: Confidence Router - High Confidence');
    try {
        const router = createConfidenceRouter();

        const result = await router.invoke({
            message: 'My payment failed and I got a billing error'
        });

        if (typeof result.confidence !== 'number') {
            throw new Error('Should return confidence score');
        }

        if (result.confidence < 0.7) {
            throw new Error('Clear billing message should have high confidence');
        }

        if (result.needsReview) {
            throw new Error('High confidence messages should not need review');
        }

        console.log(`   Confidence: ${result.confidence.toFixed(2)} - Routed successfully`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 10: Confidence Router - Low Confidence
    console.log('Test 10: Confidence Router - Low Confidence');
    try {
        const router = createConfidenceRouter();

        const result = await router.invoke({
            message: 'I need help with something'
        });

        if (typeof result.confidence !== 'number') {
            throw new Error('Should return confidence score');
        }

        if (result.confidence >= 0.7) {
            throw new Error('Ambiguous message should have low confidence');
        }

        if (!result.needsReview) {
            throw new Error('Low confidence messages should need review');
        }

        console.log(`   Confidence: ${result.confidence.toFixed(2)} - Flagged for review`);
        console.log('✅ PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}\n`);
        failed++;
    }

    // Test 11: Context-Aware Router
    console.log('Test 11: Context-Aware Router');
    try {
        const router = createContextAwareRouter();

        // First message - no context
        const result1 = await router.invoke({
            message: 'Hello',
            context: { previousCategory: null, messageCount: 0 }
        });

        // Second message - with context
        const result2 = await router.invoke({
            message: 'Can you help me more with that?',
            context: { previousCategory: 'technical', messageCount: 2 }
        });

        if (!result2.category) {
            throw new Error('Should return category');
        }

        // With technical context, vague question should stay in technical
        if (result2.category !== 'technical') {
            console.log(`   Warning: Expected to continue in technical category based on context`);
        } else {
            console.log(`   Context correctly influenced routing`);
        }

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
        console.log('\n🎉 Congratulations! All tests passed!');
        console.log('You have successfully completed Exercise 3.');
        console.log('\nKey concepts learned:');
        console.log('✓ Creating classifier chains');
        console.log('✓ Building router chains with multiple destinations');
        console.log('✓ Handling priority/urgent routing');
        console.log('✓ Multi-category classification and routing');
        console.log('✓ Confidence scoring and human escalation');
        console.log('✓ Context-aware routing');
        console.log('\nReady for Exercise 4! 🚀');
    } else {
        console.log('\n📚 Keep working on the TODOs. You\'re making progress!');
        console.log('Hint: Router chains connect classifiers to handlers.');
    }
}

// Run the tests
runTests().catch(console.error);