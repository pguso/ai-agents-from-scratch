/**
 * Part 1 Capstone Solution: Smart Email Classifier
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

import { SystemMessage, HumanMessage, AIMessage, Runnable, LlamaCppLLM } from '../../../src/index.js';
import { BaseCallback } from '../../../src/utils/callbacks.js';
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
// Email Parser Runnable
// ============================================================================

/**
 * Parses raw email text into structured format
 *
 * Input: { subject: string, body: string, from: string }
 * Output: { subject, body, from, timestamp }
 */
class EmailParserRunnable extends Runnable {
    async _call(input, config) {
        // Validate required fields
        if (!input.subject || !input.body || !input.from) {
            throw new Error('Email must have subject, body, and from fields');
        }

        // Parse and structure the email
        return {
            subject: input.subject.trim(),
            body: input.body.trim(),
            from: input.from.trim(),
            timestamp: new Date().toISOString()
        };
    }
}

// ============================================================================
// Email Classifier Runnable
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
        // Build the classification prompt
        const messages = this._buildPrompt(input);

        // Call the LLM
        const response = await this.llm.invoke(messages, config);

        // Parse the LLM response
        const classification = this._parseClassification(response.content);

        // Return email with classification
        return {
            ...input,
            category: classification.category,
            confidence: classification.confidence,
            reason: classification.reason
        };
    }

    _buildPrompt(email) {
        const systemPrompt = new SystemMessage(`You are an email classification assistant. Your task is to classify emails into one of these categories:

Categories:
- Spam: Unsolicited promotional emails, advertisements with excessive punctuation/caps, phishing attempts, scams
- Invoice: Bills, payment requests, financial documents, receipts
- Meeting Request: Meeting invitations, calendar requests, scheduling, availability inquiries
- Urgent: Time-sensitive matters requiring immediate attention, security alerts, critical notifications
- Personal: Personal correspondence from friends/family (look for personal tone and familiar email addresses)
- Other: Legitimate newsletters, updates, informational content, everything else that doesn't fit above

Important distinctions:
- Legitimate newsletters (tech updates, subscriptions) should be "Other", not Spam
- Spam has excessive punctuation (!!!, ALL CAPS), pushy language, or suspicious intent
- Personal emails have familiar sender addresses and casual tone

Respond in this exact JSON format:
{
  "category": "Category Name",
  "confidence": 0.95,
  "reason": "Brief explanation"
}

Confidence should be between 0 and 1.`);

        const userPrompt = new HumanMessage(`Classify this email:

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Provide your classification in JSON format.`);

        return [systemPrompt, userPrompt];
    }

    _parseClassification(response) {
        try {
            // Try to find JSON in the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate the parsed response
            if (!parsed.category || parsed.confidence === undefined || !parsed.reason) {
                throw new Error('Invalid classification format');
            }

            // Ensure confidence is a number between 0 and 1
            const confidence = Math.max(0, Math.min(1, parseFloat(parsed.confidence)));

            return {
                category: parsed.category,
                confidence: confidence,
                reason: parsed.reason
            };
        } catch (error) {
            // Fallback classification if parsing fails
            console.warn('Failed to parse LLM response, using fallback:', error.message);
            return {
                category: CATEGORIES.OTHER,
                confidence: 0.5,
                reason: 'Failed to parse classification'
            };
        }
    }
}

// ============================================================================
// Classification History Callback
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
        // Only track EmailClassifierRunnable results
        if (runnable.name === 'EmailClassifierRunnable' && output.category) {
            this.history.push({
                timestamp: output.timestamp,
                from: output.from,
                subject: output.subject,
                category: output.category,
                confidence: output.confidence,
                reason: output.reason
            });
        }
    }

    getHistory() {
        return this.history;
    }

    getStatistics() {
        if (this.history.length === 0) {
            return {
                total: 0,
                byCategory: {},
                averageConfidence: 0
            };
        }

        // Count by category
        const byCategory = {};
        let totalConfidence = 0;

        for (const entry of this.history) {
            byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
            totalConfidence += entry.confidence;
        }

        return {
            total: this.history.length,
            byCategory: byCategory,
            averageConfidence: totalConfidence / this.history.length
        };
    }

    printHistory() {
        console.log('\n📧 Classification History:');
        console.log('─'.repeat(70));

        for (const entry of this.history) {
            console.log(`\n✉️  From: ${entry.from}`);
            console.log(`   Subject: ${entry.subject}`);
            console.log(`   Category: ${entry.category}`);
            console.log(`   Confidence: ${(entry.confidence * 100).toFixed(1)}%`);
            console.log(`   Reason: ${entry.reason}`);
        }
    }

    printStatistics() {
        const stats = this.getStatistics();

        console.log('\n📊 Classification Statistics:');
        console.log('─'.repeat(70));
        console.log(`Total Emails: ${stats.total}\n`);

        if (stats.total > 0) {
            console.log('By Category:');
            for (const [category, count] of Object.entries(stats.byCategory)) {
                const percentage = ((count / stats.total) * 100).toFixed(1);
                console.log(`  ${category}: ${count} (${percentage}%)`);
            }

            console.log(`\nAverage Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
        }
    }
}

// ============================================================================
// Email Classification Pipeline
// ============================================================================

/**
 * Complete pipeline: Parse → Classify → Store
 */
class EmailClassificationPipeline {
    constructor(llm) {
        this.parser = new EmailParserRunnable();
        this.classifier = new EmailClassifierRunnable(llm);
        this.historyCallback = new ClassificationHistoryCallback();

        // Build the pipeline: parser -> classifier
        this.pipeline = this.parser.pipe(this.classifier);
    }

    async classify(email) {
        // Run the email through the pipeline with history callback
        const config = {
            callbacks: [this.historyCallback]
        };

        return await this.pipeline.invoke(email, config);
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

    // Initialize the LLM
    const llm = new LlamaCppLLM({
        modelPath: './models/Meta-Llama-3.1-8B-Instruct-Q5_K_S.gguf', // Adjust to your model
        temperature: 0.1, // Low temperature for consistent classification
        maxTokens: 200
    });

    // Create the classification pipeline
    const pipeline = new EmailClassificationPipeline(llm);

    console.log('📬 Processing emails...\n');

    // Classify each test email
    for (const email of TEST_EMAILS) {
        try {
            const result = await pipeline.classify(email);

            console.log(`✉️  Email from: ${result.from}`);
            console.log(`   Subject: ${result.subject}`);
            console.log(`   Category: ${result.category}`);
            console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            console.log(`   Reason: ${result.reason}\n`);
        } catch (error) {
            console.error(`❌ Error classifying email from ${email.from}:`, error.message);
        }
    }

    // Print history and statistics
    pipeline.printHistory();
    pipeline.printStatistics();

    // Cleanup
    await llm.dispose();

    console.log('\n✓ Capstone Project Complete!');
}

// Run the project
main().catch(console.error);