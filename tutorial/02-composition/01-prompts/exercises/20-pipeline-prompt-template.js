/**
 * Exercise 20: PipelinePromptTemplate
 *
 * Goal: Compose multiple prompts into modular pipelines
 *
 * In this exercise, you'll:
 * 1. Build modular prompt components
 * 2. Pipe outputs of one template into another
 * 3. Collect and merge input variables
 * 4. Create reusable prompt building blocks
 *
 * This is advanced prompt engineering - building complex prompts from simple parts!
 */

import {PromptTemplate, PipelinePromptTemplate} from '../../../../src/index.js';

// Test cases
async function exercise() {
    console.log('=== Exercise 20: PipelinePromptTemplate ===\n');

    // Test 1: Context + Question pattern
    console.log('--- Test 1: Context + Question ---');

    // TODO: Create a context prompt
    // Template: "Context: {topic} is important because {reason}."
    const contextPrompt = null; // PromptTemplate.fromTemplate(...)

    // TODO: Create a main prompt that uses the context
    // Template: "{context}\n\nQuestion: {question}\nAnswer:"
    const mainPrompt = null; // PromptTemplate.fromTemplate(...)

    // TODO: Create pipeline that combines them
    const pipeline1 = null; // new PipelinePromptTemplate({
    //     finalPrompt: mainPrompt,
    //     pipelinePrompts: [
    //         { name: "context", prompt: contextPrompt }
    //     ]
    // })

    console.log('Input variables:', []); // pipeline1.inputVariables

    // TODO: Format with values
    // const result1 = await pipeline1.format({
    //     topic: "AI safety",
    //     reason: "it affects humanity's future",
    //     question: "What are the main concerns?"
    // })

    console.log('\nResult:');
    console.log('TODO'); // result1
    console.log();

    // Test 2: Instructions + Examples + Query
    console.log('--- Test 2: Instructions + Examples + Query ---');

    // TODO: Create instructions prompt
    const instructionsPrompt = null; // PromptTemplate.fromTemplate(
    //     "Instructions: {instructions}"
    // )

    // TODO: Create examples prompt
    const examplesPrompt = null; // PromptTemplate.fromTemplate(
    //     "Examples:\n{example1}\n{example2}"
    // )

    // TODO: Create final prompt that uses both
    const taskPrompt = null; // PromptTemplate.fromTemplate(
    //     "{instructions}\n\n{examples}\n\nNow you try:\n{query}"
    // )

    // TODO: Create pipeline
    const pipeline2 = null; // new PipelinePromptTemplate({ ... })

    // TODO: Format with values
    // const result2 = await pipeline2.format({ ... })

    console.log('Result:');
    console.log('TODO'); // result2
    console.log();

    // Test 3: Multi-stage prompt composition
    console.log('--- Test 3: Multi-Stage Composition ---');

    // TODO: Create domain context prompt
    const domainPrompt = null; // PromptTemplate.fromTemplate(
    //     "Domain: {domain}\nExpertise Level: {level}"
    // )

    // TODO: Create constraints prompt
    const constraintsPrompt = null; // PromptTemplate.fromTemplate(
    //     "Constraints:\n- Max length: {max_length} words\n- Tone: {tone}"
    // )

    // TODO: Create task prompt
    const taskPrompt3 = null; // PromptTemplate.fromTemplate(
    //     "Task: {task}"
    // )

    // TODO: Create final prompt combining all three
    const finalPrompt3 = null; // PromptTemplate.fromTemplate(
    //     "{domain_context}\n\n{constraints}\n\n{task_description}\n\nResponse:"
    // )

    // TODO: Create pipeline with multiple stages
    const pipeline3 = null; // new PipelinePromptTemplate({
    //     finalPrompt: finalPrompt3,
    //     pipelinePrompts: [
    //         { name: "domain_context", prompt: domainPrompt },
    //         { name: "constraints", prompt: constraintsPrompt },
    //         { name: "task_description", prompt: taskPrompt3 }
    //     ]
    // })

    // TODO: Format with all values
    // const result3 = await pipeline3.format({ ... })

    console.log('Result:');
    console.log('TODO'); // result3
    console.log();

    // Test 4: Reusable components
    console.log('--- Test 4: Reusable Components ---');

    // TODO: Create reusable system context
    const systemContext = null; // PromptTemplate.fromTemplate(
    //     "You are a {role} with expertise in {expertise}."
    // )

    // TODO: Use same component in different pipelines
    const pipeline4a = null; // new PipelinePromptTemplate({
    //     finalPrompt: PromptTemplate.fromTemplate("{system}\n\nTask: {task}"),
    //     pipelinePrompts: [{ name: "system", prompt: systemContext }]
    // })

    const pipeline4b = null; // new PipelinePromptTemplate({
    //     finalPrompt: PromptTemplate.fromTemplate("{system}\n\nQuestion: {question}"),
    //     pipelinePrompts: [{ name: "system", prompt: systemContext }]
    // })

    // TODO: Format both with different purposes
    // const result4a = await pipeline4a.format({ ... })
    // const result4b = await pipeline4b.format({ ... })

    console.log('Pipeline A (Task):');
    console.log('TODO'); // result4a
    console.log('\nPipeline B (Question):');
    console.log('TODO'); // result4b
    console.log();

    // Test 5: Dynamic content injection
    console.log('--- Test 5: Dynamic Content Injection ---');

    // TODO: Create date prompt
    const datePrompt = null; // PromptTemplate.fromTemplate(
    //     "Current Date: {date}"
    // )

    // TODO: Create user info prompt
    const userPrompt = null; // PromptTemplate.fromTemplate(
    //     "User: {username} (Preference: {preference})"
    // )

    // TODO: Create main prompt
    const mainPrompt5 = null; // PromptTemplate.fromTemplate(
    //     "{date_info}\n{user_info}\n\nRequest: {request}\nResponse:"
    // )

    // TODO: Create pipeline
    const pipeline5 = null; // new PipelinePromptTemplate({ ... })

    // TODO: Format with dynamic content
    // const result5 = await pipeline5.format({
    //     date: new Date().toLocaleDateString(),
    //     username: "Alice",
    //     preference: "concise answers",
    //     request: "Explain quantum computing"
    // })

    console.log('Result:');
    console.log('TODO'); // result5
    console.log();

    // Test 6: Nested complexity
    console.log('--- Test 6: Complex Nested Pipeline ---');

    // TODO: Create background prompt
    const backgroundPrompt = null; // PromptTemplate.fromTemplate(
    //     "Background:\n{background}"
    // )

    // TODO: Create methodology prompt
    const methodologyPrompt = null; // PromptTemplate.fromTemplate(
    //     "Methodology:\n{methodology}"
    // )

    // TODO: Create expected outcome prompt
    const outcomePrompt = null; // PromptTemplate.fromTemplate(
    //     "Expected Outcome:\n{outcome}"
    // )

    // TODO: Create research proposal template
    const proposalPrompt = null; // PromptTemplate.fromTemplate(
    //     "Research Proposal: {title}\n\n{background_section}\n\n{methodology_section}\n\n{outcome_section}\n\nSubmitted by: {author}"
    // )

    // TODO: Create complex pipeline
    const pipeline6 = null; // new PipelinePromptTemplate({ ... })

    console.log('Input variables needed:', []); // pipeline6.inputVariables

    // TODO: Format complex proposal
    // const result6 = await pipeline6.format({ ... })

    console.log('\nResult:');
    console.log('TODO'); // result6
    console.log();

    // Test 7: Use as Runnable
    console.log('--- Test 7: Use as Runnable ---');

    // TODO: Create a simple pipeline
    const runnablePipeline = null; // new PipelinePromptTemplate({ ... })

    // TODO: Use invoke() instead of format()
    // const result7 = await runnablePipeline.invoke({ ... })

    console.log('Invoked result:');
    console.log('TODO'); // result7
    console.log();

    console.log('✓ Exercise 4 complete!');
}

// Run the exercise
exercise().catch(console.error);

/**
 * Expected Output:
 *
 * --- Test 1: Context + Question ---
 * Input variables: ['topic', 'reason', 'question']
 *
 * Result:
 * Context: AI safety is important because it affects humanity's future.
 *
 * Question: What are the main concerns?
 * Answer:
 *
 * --- Test 2: Instructions + Examples + Query ---
 * Result:
 * Instructions: Translate words to Spanish
 *
 * Examples:
 * hello → hola
 * goodbye → adiós
 *
 * Now you try:
 * cat
 *
 * --- Test 3: Multi-Stage Composition ---
 * Result:
 * Domain: Machine Learning
 * Expertise Level: Advanced
 *
 * Constraints:
 * - Max length: 100 words
 * - Tone: technical
 *
 * Task: Explain gradient descent
 *
 * Response:
 *
 * --- Test 4: Reusable Components ---
 * Pipeline A (Task):
 * You are a software engineer with expertise in Python.
 *
 * Task: Debug this code
 *
 * Pipeline B (Question):
 * You are a software engineer with expertise in Python.
 *
 * Question: What are decorators?
 *
 * --- Test 5: Dynamic Content Injection ---
 * Result:
 * Current Date: 11/20/2025
 * User: Alice (Preference: concise answers)
 *
 * Request: Explain quantum computing
 * Response:
 *
 * --- Test 6: Complex Nested Pipeline ---
 * Input variables: ['title', 'background', 'methodology', 'outcome', 'author']
 *
 * Result:
 * Research Proposal: AI in Healthcare
 *
 * Background:
 * Current healthcare systems face challenges...
 *
 * Methodology:
 * We will use deep learning models...
 *
 * Expected Outcome:
 * Improved diagnosis accuracy by 20%
 *
 * Submitted by: Dr. Smith
 *
 * --- Test 7: Use as Runnable ---
 * Invoked result:
 * [Similar formatted output]
 *
 * Learning Points:
 * 1. PipelinePromptTemplate composes prompts modularly
 * 2. Each pipeline prompt generates a named output
 * 3. Final prompt uses pipeline outputs as variables
 * 4. Input variables are collected from all prompts
 * 5. Pipeline outputs are NOT input variables
 * 6. Enables reusable prompt components
 * 7. Perfect for complex, structured prompts
 * 8. Makes prompt engineering more maintainable
 * 9. Can nest arbitrary levels of complexity
 * 10. Separates concerns in prompt construction
 */