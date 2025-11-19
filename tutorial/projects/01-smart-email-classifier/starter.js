/**
 * Part 1 Capstone: Smart Email Classifier
 *
 * Build an AI system that organizes your inbox by classifying emails into categories.
 *
 * Skills Used:
 * - Runnables for processing pipeline
 * - Messages for structured classification
 * - LLM wrapper for flexible model switching
 * - Context for classification history
 *
 * Difficulty: ⭐⭐☆☆☆
 */

import {SystemMessage, HumanMessage, Runnable, LlamaCppLLM} from '../../../src/index.js';
import {BaseCallback} from '../../../src/utils/callbacks.js';
import { readFileSync } from 'fs';

// ============================================================================
// EMAIL CLASSIFICATION CATEGORIES
// ============================================================================

const CATEGORIES = {
    SPAM: 'Spam',
    INVOICE: 'Invoice',
    MEETING: 'Meeting Request',
    URGENT: 'Urgent',
    PERSONAL: 'Personal',
    OTHER: 'Other'
};

// ============================================================================
// TODO 1: Email Parser Runnable
// ============================================================================

/**
 * Parses raw email text into structured format
 *
 * Input: { subject: string, body: string, from: string }
 * Output: { subject, body, from, timestamp }
 */
class EmailParserRunnable extends Runnable {
    async _call(input, config) {
        // TODO: Parse and structure the email
        // Add timestamp
        // Validate required fields (subject, body, from)
        // Return structured email object

        return null; // Replace with your implementation
    }
}

// ============================================================================
// TODO 2: Email Classifier Runnable
// ============================================================================

/**
 * Classifies email using LLM
 *
 * Input: { subject, body, from, timestamp }
 * Output: { ...email, category, confidence, reason }
 */
class EmailClassifierRunnable extends Runnable {
    constructor(llm) {
        super();
        this.llm = llm;
    }

    async _call(input, config) {
        // TODO: Create a prompt for the LLM
        // Ask it to classify the email into one of the categories
        // Request: category, confidence (0-1), and reason

        // TODO: Parse the LLM response
        // Extract category, confidence, reason

        // TODO: Return email with classification

        return null; // Replace with your implementation
    }

    _buildPrompt(email) {
        // TODO: Build a good classification prompt
        // Include: categories, email details, instructions

        return null; // Replace with your implementation
    }

    _parseClassification(response) {
        // TODO: Parse LLM response into structured format
        // Extract: category, confidence, reason

        return null; // Replace with your implementation
    }
}

// ============================================================================
// TODO 3: Classification History Callback
// ============================================================================

/**
 * Tracks classification history using callbacks
 */
class ClassificationHistoryCallback extends BaseCallback {
    constructor() {
        super();
        this.history = [];
    }

    async onEnd(runnable, output, config) {
        // TODO: If this is an EmailClassifierRunnable, save the classification
        // Store: timestamp, email subject, category, confidence

    }

    getHistory() {
        return this.history;
    }

    getStatistics() {
        // TODO: Calculate statistics
        // - Total emails classified
        // - Count per category
        // - Average confidence

        return null; // Replace with your implementation
    }

    printHistory() {
        console.log('\n📧 Classification History:');
        console.log('─'.repeat(70));

        // TODO: Print each classification nicely

    }

    printStatistics() {
        console.log('\n📊 Classification Statistics:');
        console.log('─'.repeat(70));

        // TODO: Print statistics

    }
}

// ============================================================================
// TODO 4: Email Classification Pipeline
// ============================================================================

/**
 * Complete pipeline: Parse → Classify → Store
 */
class EmailClassificationPipeline {
    constructor(llm) {
        // TODO: Create the pipeline
        // parser -> classifier
        // Add history callback

        this.parser = null; // new EmailParserRunnable()
        this.classifier = null; // new EmailClassifierRunnable(llm)
        this.historyCallback = null; // new ClassificationHistoryCallback()
        this.pipeline = null; // Build the pipeline
    }

    async classify(email) {
        // TODO: Run the email through the pipeline
        // Pass the history callback in config

        return null; // Replace with your implementation
    }

    getHistory() {
        return this.historyCallback.getHistory();
    }

    getStatistics() {
        return this.historyCallback.getStatistics();
    }

    printHistory() {
        this.historyCallback.printHistory();
    }

    printStatistics() {
        this.historyCallback.printStatistics();
    }
}

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_EMAILS = JSON.parse(
    readFileSync(new URL('./test-emails.json', import.meta.url), 'utf-8')
);

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
    console.log('=== Part 1 Capstone: Smart Email Classifier ===\n');

    // TODO: Initialize the LLM
    // Adjust modelPath to your model
    const llm = null; // new LlamaCppLLM({ ... })

    // TODO: Create the classification pipeline
    const pipeline = null; // new EmailClassificationPipeline(llm)

    console.log('📬 Processing emails...\n');

    // TODO: Classify each test email
    for (const email of TEST_EMAILS) {
        // Classify
        // Print result
    }

    // TODO: Print history and statistics
    // pipeline.printHistory()
    // pipeline.printStatistics()

    // TODO: Cleanup
    // await llm.dispose()

    console.log('\n✓ Capstone Project Complete!');
}

// Run the project
main().catch(console.error);

/**
 * TODO CHECKLIST:
 *
 * [ ] 1. EmailParserRunnable
 *       - Parse email structure
 *       - Add timestamp
 *       - Validate fields
 *
 * [ ] 2. EmailClassifierRunnable
 *       - Build classification prompt
 *       - Call LLM
 *       - Parse response
 *       - Return classified email
 *
 * [ ] 3. ClassificationHistoryCallback
 *       - Track classifications in onEnd
 *       - Calculate statistics
 *       - Print history and stats
 *
 * [ ] 4. EmailClassificationPipeline
 *       - Build parser -> classifier pipeline
 *       - Add history callback
 *       - Implement classify method
 *
 * [ ] 5. Main function
 *       - Initialize LLM
 *       - Create pipeline
 *       - Process test emails
 *       - Print results
 *
 * EXPECTED OUTPUT:
 *
 * 📬 Processing emails...
 *
 * ✉️  Email from: promotions@shop.com
 *     Subject: 🎉 70% OFF SALE! Limited Time Only!!!
 *     Category: Spam
 *     Confidence: 99.0%
 *     Reason: Promotional content with excessive punctuation
 *
 * ✉️  Email from: billing@company.com
 *     Subject: Invoice #12345 - Payment Due
 *     Category: Invoice
 *     Confidence: 98.0%
 *     Reason: Contains invoice number and payment information
 *
 * ... (more emails)
 *
 * 📊 Classification Statistics:
 * ──────────────────────────────────────────────────────────────────────
 * Total Emails: 24
 *
 * By Category:
 *   Spam: 3 (12.5%)
 *   Invoice: 4 (16.7%)
 *   Meeting Request: 5 (20.8%)
 *   Urgent: 3 (12.5%)
 *   Personal: 4 (16.7%)
 *   Other: 5 (20.8%)
 *
 * Average Confidence: 96.7%
 */