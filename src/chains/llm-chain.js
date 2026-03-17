import { BaseChain } from './base-chain.js';

/**
 * Chain that combines PromptTemplate + LLM + OutputParser
 *
 * Example:
 *   const chain = new LLMChain({
 *       prompt: new PromptTemplate({ template: "Translate {text}" }),
 *       llm: new LlamaCppLLM({ modelPath: "./model.gguf" }),
 *       outputParser: new StringOutputParser()
 *   });
 *
 *   const result = await chain.invoke({ text: "Hello" });
 */
export class LLMChain extends BaseChain {
  constructor(options = {}) {
    super();

    if (!options.prompt) {
      throw new Error('LLMChain requires a prompt template');
    }
    if (!options.llm) {
      throw new Error('LLMChain requires an LLM');
    }

    this.prompt = options.prompt;
    this.llm = options.llm;
    this.outputParser = options.outputParser || null;
    this.outputKey = options.outputKey || 'text';
    this.returnFinalOnly = options.returnFinalOnly ?? true;
  }

  /**
   * Input keys from prompt template
   */
  get inputKeys() {
    return this.prompt.inputVariables;
  }

  /**
   * Output keys this chain produces
   */
  get outputKeys() {
    return [this.outputKey];
  }

  /**
   * Run the chain: format prompt → invoke LLM → parse output
   */
  async _call(inputs, config) {
    this._validateInputs(inputs);

    // Step 1: Format the prompt
    const formattedPrompt = await this.prompt.format(inputs);

    // Step 2: Invoke the LLM
    const llmOutput = await this.llm.invoke(formattedPrompt, config);

    // Step 3: Parse the output (if parser provided)
    let finalOutput;
    if (this.outputParser) {
      finalOutput = await this.outputParser.parse(llmOutput.content);
    } else {
      // If no parser, return the LLM output content
      finalOutput = llmOutput.content;
    }

    // Step 4: Prepare output
    if (this.returnFinalOnly) {
      return finalOutput;
    } else {
      // Return full context including intermediate steps
      return {
        [this.outputKey]: finalOutput,
        prompt: formattedPrompt,
        llmOutput: llmOutput
      };
    }
  }

  /**
   * Get the type of chain
   */
  get _chainType() {
    return 'llm_chain';
  }

  /**
   * Serialize chain for saving/loading
   */
  serialize() {
    return {
      _type: this._chainType,
      prompt: this.prompt,
      llm: this.llm,
      outputParser: this.outputParser,
      outputKey: this.outputKey
    };
  }
}