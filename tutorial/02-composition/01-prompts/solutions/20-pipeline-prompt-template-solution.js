/**
 * Solution 20: PipelinePromptTemplate
 */

import {PromptTemplate, PipelinePromptTemplate} from '../../../../src/index.js';

// Test cases
async function exercise() {
    console.log('=== Exercise 20: PipelinePromptTemplate ===\n');

    // Test 1: Context + Question pattern
    console.log('--- Test 1: Context + Question ---');

    const mainPrompt = PromptTemplate.fromTemplate(
        "{context}\n\nQuestion: {question}\nAnswer:"
    );
    const contextPrompt = PromptTemplate.fromTemplate(
        "Context: {topic} is important because {reason}"
    );

    const pipeline1 = new PipelinePromptTemplate({
        finalPrompt: mainPrompt,
        pipelinePrompts: [
            {name: "context", prompt: contextPrompt}
        ]
    })

    console.log('Input variables:', pipeline1.inputVariables);

    const result1 = await pipeline1.format({
        topic: "AI safety",
        reason: "it affects humanity's future",
        question: "What are the main concerns?"
    })

    console.log('\nResult:');
    console.log(result1);
    console.log();

    // Test 2: Instructions + Examples + Query
    console.log('--- Test 2: Instructions + Examples + Query ---');

    const instructionsPrompt = PromptTemplate.fromTemplate(
        "Instructions: {instructions}"
    );

    const examplesPrompt = PromptTemplate.fromTemplate(
        "Examples:\n{example1}\n{example2}"
    );

    const taskPrompt = PromptTemplate.fromTemplate(
        "{instructions}\n\n{examples}\n\nNow you try:\n{query}"
    );

    const pipeline2 = new PipelinePromptTemplate({
        finalPrompt: taskPrompt,
        pipelinePrompts: [
            { name: "instructions", prompt: instructionsPrompt },
            { name: "examples", prompt: examplesPrompt }
        ]
    });

    const result2 = await pipeline2.format({
        instructions: "Translate words to Spanish",
        example1: "hello → hola",
        example2: "goodbye → adiós",
        query: "cat"
    });

    console.log('Result:');
    console.log(result2);
    console.log();

    // Test 3: Multi-stage prompt composition
    console.log('--- Test 3: Multi-Stage Composition ---');

    const domainPrompt = PromptTemplate.fromTemplate(
        "Domain: {domain}\nExpertise Level: {level}"
    );

    const constraintsPrompt = PromptTemplate.fromTemplate(
        "Constraints:\n- Max length: {max_length} words\n- Tone: {tone}"
    );

    const taskPrompt3 = PromptTemplate.fromTemplate(
        "Task: {task}"
    );

    const finalPrompt3 = PromptTemplate.fromTemplate(
        "{domain_context}\n\n{constraints}\n\n{task_description}\n\nResponse:"
    );

    const pipeline3 = new PipelinePromptTemplate({
        finalPrompt: finalPrompt3,
        pipelinePrompts: [
            { name: "domain_context", prompt: domainPrompt },
            { name: "constraints", prompt: constraintsPrompt },
            { name: "task_description", prompt: taskPrompt3 }
        ]
    });

    const result3 = await pipeline3.format({
        domain: "Machine Learning",
        level: "Advanced",
        max_length: "100",
        tone: "technical",
        task: "Explain gradient descent"
    });

    console.log('Result:');
    console.log(result3);
    console.log();

    // Test 4: Reusable components
    console.log('--- Test 4: Reusable Components ---');

    const systemContext = PromptTemplate.fromTemplate(
        "You are a {role} with expertise in {expertise}."
    );

    const pipeline4a = new PipelinePromptTemplate({
        finalPrompt: PromptTemplate.fromTemplate("{system}\n\nTask: {task}"),
        pipelinePrompts: [{ name: "system", prompt: systemContext }]
    });

    const pipeline4b = new PipelinePromptTemplate({
        finalPrompt: PromptTemplate.fromTemplate("{system}\n\nQuestion: {question}"),
        pipelinePrompts: [{ name: "system", prompt: systemContext }]
    });

    const result4a = await pipeline4a.format({
        role: "software engineer",
        expertise: "Python",
        task: "Debug this code"
    });

    const result4b = await pipeline4b.format({
        role: "software engineer",
        expertise: "Python",
        question: "What are decorators?"
    });

    console.log('Pipeline A (Task):');
    console.log(result4a);
    console.log('\nPipeline B (Question):');
    console.log(result4b);
    console.log();

    // Test 5: Dynamic content injection
    console.log('--- Test 5: Dynamic Content Injection ---');

    const datePrompt = PromptTemplate.fromTemplate(
        "Current Date: {date}"
    );

    const userPrompt = PromptTemplate.fromTemplate(
        "User: {username} (Preference: {preference})"
    );

    const mainPrompt5 = PromptTemplate.fromTemplate(
        "{date_info}\n{user_info}\n\nRequest: {request}\nResponse:"
    );

    const pipeline5 = new PipelinePromptTemplate({
        finalPrompt: mainPrompt5,
        pipelinePrompts: [
            { name: "date_info", prompt: datePrompt },
            { name: "user_info", prompt: userPrompt }
        ]
    });

    const result5 = await pipeline5.format({
        date: new Date().toLocaleDateString(),
        username: "Alice",
        preference: "concise answers",
        request: "Explain quantum computing"
    });

    console.log('Result:');
    console.log(result5);
    console.log();

    // Test 6: Nested complexity
    console.log('--- Test 6: Complex Nested Pipeline ---');

    const backgroundPrompt = PromptTemplate.fromTemplate(
        "Background:\n{background}"
    );

    const methodologyPrompt = PromptTemplate.fromTemplate(
        "Methodology:\n{methodology}"
    );

    const outcomePrompt = PromptTemplate.fromTemplate(
        "Expected Outcome:\n{outcome}"
    );

    const proposalPrompt = PromptTemplate.fromTemplate(
        "Research Proposal: {title}\n\n{background_section}\n\n{methodology_section}\n\n{outcome_section}\n\nSubmitted by: {author}"
    );

    const pipeline6 = new PipelinePromptTemplate({
        finalPrompt: proposalPrompt,
        pipelinePrompts: [
            { name: "background_section", prompt: backgroundPrompt },
            { name: "methodology_section", prompt: methodologyPrompt },
            { name: "outcome_section", prompt: outcomePrompt }
        ]
    });

    console.log('Input variables needed:', pipeline6.inputVariables);

    const result6 = await pipeline6.format({
        title: "AI in Healthcare",
        background: "Current healthcare systems face challenges...",
        methodology: "We will use deep learning models...",
        outcome: "Improved diagnosis accuracy by 20%",
        author: "Dr. Smith"
    });

    console.log('\nResult:');
    console.log(result6);
    console.log();

    // Test 7: Use as Runnable
    console.log('--- Test 7: Use as Runnable ---');

    const runnablePipeline = new PipelinePromptTemplate({
        finalPrompt: PromptTemplate.fromTemplate("{intro}\n\nQuery: {query}\nAnswer:"),
        pipelinePrompts: [
            {
                name: "intro",
                prompt: PromptTemplate.fromTemplate("You are a {role} assistant.")
            }
        ]
    });

    const result7 = await runnablePipeline.invoke({
        role: "helpful",
        query: "What is machine learning?"
    });

    console.log('Invoked result:');
    console.log(result7);
    console.log();

    console.log('✓ Exercise 4 complete!');
}

// Run the exercise
exercise().catch(console.error);

/**
 * Expected Output:
 *
 * --- Test 1: Context + Question ---
 * Input variables: [ 'question', 'topic', 'reason' ]
 *
 * Result:
 * Context: AI safety is important because it affects humanity's future
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
 * Input variables: [ 'title', 'author', 'background', 'methodology', 'outcome' ]
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
 * You are a helpful assistant.
 *
 * Query: What is machine learning?
 * Answer:
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