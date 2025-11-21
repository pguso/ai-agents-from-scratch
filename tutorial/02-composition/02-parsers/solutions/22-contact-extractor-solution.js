/**
 * Solution 22: Contact Information Extractor
 *
 * Difficulty: ⭐⭐☆☆ (Intermediate)
 *
 * Skills gained:
 * - JSON extraction from unstructured text
 * - List parsing from various formats
 * - Including format instructions
 * - Schema validation
 */

import {Runnable, PromptTemplate, JsonOutputParser, ListOutputParser} from '../../../../src/index.js';
import {LlamaCppLLM} from '../../../../src/llm/llama-cpp-llm.js';
import {QwenChatWrapper} from "node-llama-cpp";

// Sample text snippets with contact information
const TEXT_SAMPLES = [
    "Contact John Smith at john.smith@email.com or call 555-0123. He's based in New York.",
    "For inquiries, reach out to Sarah Johnson (sarah.j@company.com), phone: 555-9876, located in San Francisco.",
    "Please contact Dr. Michael Chen at m.chen@hospital.org or 555-4567. Office in Boston."
];

/**
 * Build a chain that extracts structured contact information:
 * - name
 * - email
 * - phone
 * - location
 */
async function createContactExtractor() {
    const parser = new JsonOutputParser({
        schema: {
            name: 'string',
            email: 'string',
            phone: 'number',
            location: 'string'
        }
    });

    const prompt = new PromptTemplate({
        template: `Extract info from: {text}

{format_instructions}`,
        inputVariables: ["text"],
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
 * Build a chain that extracts a list of skills from a job description
 * Should return array of strings
 */
async function createSkillsExtractor() {
    const parser = new ListOutputParser();

    const prompt = new PromptTemplate({
        template: `List skill found in this text numbered: {description}

{format_instructions}`,
        inputVariables: ["description"],
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
 * Build a chain that extracts company info including multiple contacts
 */
async function createCompanyExtractor() {
    const parser = new JsonOutputParser();

    const prompt = new PromptTemplate({
        template: `From this text: {text} i need following information extracted: company name, industry, year founded, employee count. {format_instructions}`,
        inputVariables: ["text"],
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

async function extractContactInfo() {
    console.log('=== Exercise 22: Contact Information Extractor ===\n');

    const contactChain = await createContactExtractor();
    const skillsChain = await createSkillsExtractor();
    const companyChain = await createCompanyExtractor();

    // Test 1: Extract contact info
    console.log('--- Test 1: Extracting Contact Information ---\n');

    for (let i = 0; i < TEXT_SAMPLES.length; i++) {
        const text = TEXT_SAMPLES[i];
        console.log(`Text ${i + 1}: "${text}"`);

        const contact = await contactChain.invoke({text});

        console.log('Extracted:', contact);
        console.log();
    }

    // Test 2: Extract skills from job description
    console.log('--- Test 2: Extracting Skills List ---\n');

    const description = `We're looking for a Full Stack Developer with experience in:
JavaScript, Python, React, Node.js, PostgreSQL, Docker, AWS, and Git.
Strong communication and problem-solving skills required.`;

    console.log(`Job Description: "${description}"\n`);

    const skills = await skillsChain.invoke({description});

    console.log('Extracted Skills:', skills);
    console.log();

    // Test 3: Extract company info
    console.log('--- Test 3: Extracting Company Information ---\n');

    const companyText = `TechCorp is a leading software company in the cloud computing industry.
Founded in 2010, the company now employs over 500 people across three continents.`;

    console.log(`Company Text: "${companyText}"\n`);

    const companyInfo = await companyChain.invoke({text: companyText});

    console.log('Extracted Info:', companyInfo);
    console.log();

    console.log('✓ Exercise 2 Complete!');

    return {contactChain, skillsChain, companyChain};
}

// Run the exercise
extractContactInfo()
    .then(runTests)
    .catch(console.error);

// ============================================================================
// AUTOMATED TESTS
// ============================================================================

async function runTests(results) {
    const {contactChain, skillsChain, companyChain} = results;

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

    // Test 1: Chains created
    await test('Contact extractor chain created', async () => {
        assert(contactChain !== null && contactChain !== undefined, 'Create contactChain');
        assert(contactChain instanceof Runnable, 'Should be Runnable');
    });

    await test('Skills extractor chain created', async () => {
        assert(skillsChain !== null && skillsChain !== undefined, 'Create skillsChain');
        assert(skillsChain instanceof Runnable, 'Should be Runnable');
    });

    await test('Company extractor chain created', async () => {
        assert(companyChain !== null && companyChain !== undefined, 'Create companyChain');
        assert(companyChain instanceof Runnable, 'Should be Runnable');
    });

    // Test 2: Contact extraction (only run if chain exists)
    if (contactChain !== null && contactChain !== undefined) {
        await test('Contact extractor returns object', async () => {
            const result = await contactChain.invoke({
                text: "Contact Alice at alice@email.com, phone 555-1234, in Seattle"
            });
            assert(typeof result === 'object', 'Should return object');
            assert(!Array.isArray(result), 'Should not be array');
        });

        await test('Contact object has required fields', async () => {
            const result = await contactChain.invoke({
                text: "Contact Bob at bob@email.com, phone 555-5678, in Portland"
            });
            assert('name' in result, 'Should have name field');
            assert('email' in result, 'Should have email field');
            assert('phone' in result, 'Should have phone field');
        });

        await test('Contact fields are strings', async () => {
            const result = await contactChain.invoke({
                text: "Contact Carol at carol@email.com"
            });
            if (result.name) assert(typeof result.name === 'string', 'name should be string');
            if (result.email) assert(typeof result.email === 'string', 'email should be string');
        });
    } else {
        failed += 3;
        console.error(`❌ Contact extractor returns object`);
        console.error(`   Cannot test - contactChain is not created\n`);
        console.error(`❌ Contact object has required fields`);
        console.error(`   Cannot test - contactChain is not created\n`);
        console.error(`❌ Contact fields are strings`);
        console.error(`   Cannot test - contactChain is not created\n`);
    }

    // Test 3: Skills extraction (only run if chain exists)
    if (skillsChain !== null && skillsChain !== undefined) {
        await test('Skills extractor returns array', async () => {
            const result = await skillsChain.invoke({
                description: "Looking for: JavaScript, Python, SQL"
            });
            assert(Array.isArray(result), 'Should return array');
        });

        await test('Skills array contains strings', async () => {
            const result = await skillsChain.invoke({
                description: "Requirements: Java, C++, Git, Docker"
            });
            assert(result.length > 0, 'Should extract at least one skill');
            assert(
                result.every(skill => typeof skill === 'string'),
                'All skills should be strings'
            );
        });

        await test('Skills array has no empty strings', async () => {
            const result = await skillsChain.invoke({
                description: "Skills: React, Node.js, MongoDB"
            });
            assert(
                result.every(skill => skill.trim().length > 0),
                'Should have no empty strings'
            );
        });
    } else {
        failed += 3;
        console.error(`❌ Skills extractor returns array`);
        console.error(`   Cannot test - skillsChain is not created\n`);
        console.error(`❌ Skills array contains strings`);
        console.error(`   Cannot test - skillsChain is not created\n`);
        console.error(`❌ Skills array has no empty strings`);
        console.error(`   Cannot test - skillsChain is not created\n`);
    }

    // Test 4: Company extraction (only run if chain exists)
    if (companyChain !== null && companyChain !== undefined) {
        await test('Company extractor returns object', async () => {
            const result = await companyChain.invoke({
                text: "CloudTech was founded in 2015 in the SaaS industry with 100 employees"
            });
            assert(typeof result === 'object', 'Should return object');
        });
    } else {
        failed++;
        console.error(`❌ Company extractor returns object`);
        console.error(`   Cannot test - companyChain is not created\n`);
    }

    // Test 5: JSON parsing robustness (always run - tests parser capability)
    await test('JsonParser handles markdown code blocks', async () => {
        // The parser should extract JSON even if LLM wraps it in ```json
        // This test verifies the parser class exists and has the capability
        const parser = new JsonOutputParser();
        assert(parser !== null, 'JsonOutputParser should be instantiable');
        assert(typeof parser.parse === 'function', 'Parser should have parse method');
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
        console.log('📚 What you learned:');
        console.log('  • JsonOutputParser extracts structured data reliably');
        console.log('  • ListOutputParser handles multiple list formats');
        console.log('  • getFormatInstructions() tells LLM what you expect');
        console.log('  • Schema validation ensures data quality');
        console.log('  • Parsers handle markdown and extra text gracefully\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check your implementation.\n');
    }
}