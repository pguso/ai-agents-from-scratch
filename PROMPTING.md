# Prompt Engineering

Prompt engineering offers the quickest and most straightforward method for shaping how an agent behaves-defining 
its personality, function, and choices (such as when it should utilize tools). Agents operate using two prompt categories: 
system-level and user-level prompts.

User-level prompts consist of the messages individuals enter during conversation. These vary with each interaction 
and remain outside the developer's control.

System-level prompts contain instructions established by developers that remain constant throughout the dialogue. 
These define the agent's tone, capabilities, limitations, and guidelines for tool usage.

Look into the system prompts from Anthropic

https://docs.claude.com/en/release-notes/system-prompts#september-29-2025

## Prompt Design

When creating prompts for agents, you need to achieve two things:

1. Make the agent solve problems well

- Help it complete complex tasks correctly
- Enable clear, logical thinking
- Reduce mistakes

2. Keep the agent's personality consistent

- Define who the agent is and how it speaks
- Match your brand's voice
- Respond with appropriate emotion for each situation

Both goals matter equally. An accurate answer delivered rudely hurts the user experience. A friendly answer that 
doesn't actually help is useless.

## Prompt Strategies

### Agents Role

Giving the LLM a specific role improves its responses - it naturally adopts that role's vocabulary and expertise.
Examples:

"You are a pediatrician" → Uses medical terms, discusses child development, recommends age-appropriate treatments
"You are a chef" → Explains cooking techniques, suggests ingredient substitutions, discusses flavor profiles
"You are a high school math teacher" → Breaks down problems step-by-step, uses simple language, provides practice examples
"You are a startup founder" → Focuses on growth, uses business metrics, thinks about scalability

Make roles specific:
Instead of: "You are a writer"
Better: "You are a tech blogger who simplifies complex AI concepts for beginners"

Roles work best for specialized questions and should be set in system prompts.

### Be Specific, Not Vague

LLMs interpret instructions literally. Vague prompts produce random results. Specific prompts produce consistent outputs.
Vague vs Specific Examples:

❌ Vague: "Write something about dogs"
✅ Specific: "Write a 3-paragraph guide on training a puppy to sit"

❌ Vague: "Make it better"
✅ Specific: "Fix grammar errors and shorten to under 100 words"

❌ Vague: "Be professional"
✅ Specific: "Use formal language, avoid contractions, address the reader as 'you'"

❌ Vague: "Analyze this data"
✅ Specific: "Find the top 3 trends and explain what caused each one"

Why it matters: The LLM has thousands of ways to interpret vague instructions. It will guess what you want-and often 
guess wrong. Clear instructions eliminate guesswork and give you control over the output.

Rule of thumb: If a human assistant would need to ask clarifying questions, your prompt is too vague.

### Structuring LLM Inputs with JSON
Using JSON to structure your input helps LLMs understand tasks more clearly and makes integration easier. Instead of 
sending a blob of text, break your request into labeled parts like task, input, constraints, and output_format.

Benefits
- Clarity: JSON keys show the model what each part means.
- Reliability: Easier to parse and validate responses.
- Consistency: Reduces random or narrative answers.
- Integration: Works well with APIs and schemas.

Best Practices
- Keep it simple and shallow - avoid deep nesting.
- Use descriptive keys ("task", "context", "constraints").
- Tell the model the exact output format (e.g., “Respond with valid JSON only”).
- Optionally define a JSON Schema to enforce structure.
- Always validate the response in your code.

Example
````
{
  "task": "summarize",
  "input_text": " - Article text here. - ",
  "constraints": {
    "max_words": 100,
    "audience": "non-technical"
  },
  "output_format": {
    "type": "JSON",
    "schema": {
      "summary": "string",
      "key_points": ["string"]
    }
  }
}
````

This structured format helps the model separate what to do, what data to use, and how to reply, resulting in 
more consistent, machine-readable outputs.

### Few-Shot Prompting

Few-shot prompting means giving the LLM a few examples of what you want before asking it to do a new task.
It’s like showing a student two or three solved problems so they understand the pattern.

Example
```
Example 1:
Feedback: "The room was clean and quiet."
Category: Positive

Example 2:
Feedback: "The staff were rude and unhelpful."
Category: Negative

Example 3:
Feedback: "Breakfast was okay, but the coffee was cold."
Category: Neutral

Now categorize this:
Feedback: "The view from the balcony was amazing!"
Category:
```

The model learns from the examples and continues in the same style - here, it would answer:
"Good morning"

Few-shot prompts are useful when you want consistent tone, format, or logic without retraining the model.

### Chain of Thought

Chain of thought means asking the LLM to think step by step instead of jumping straight to the answer.
It helps the model reason better, especially for logic, math, or multi-step problems.

Example

Question: If 3 apples cost $6, how much do 5 apples cost?
Let's think step by step.

Model reasoning:
3 apples → $6 → each apple costs $2.
5 apples × $2 = $10.

Answer: $10

By encouraging step-by-step thinking, you help the model make fewer mistakes and explain its reasoning clearly.