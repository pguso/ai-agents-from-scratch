import { BaseOutputParser } from './base-parser.js';

/**
 * Parser that returns cleaned string output
 * Strips whitespace and optionally removes markdown
 *
 * Example:
 *   const parser = new StringOutputParser();
 *   const result = await parser.parse("  Hello World  ");
 *   // "Hello World"
 */
export class StringOutputParser extends BaseOutputParser {
  constructor(options = {}) {
    super();
    this.stripMarkdown = options.stripMarkdown ?? true;
  }

  /**
   * Parse: clean the text
   */
  async parse(text) {
    let cleaned = text.trim();

    if (this.stripMarkdown) {
      cleaned = this._stripMarkdownCodeBlocks(cleaned);
    }

    return cleaned;
  }

  /**
   * Remove markdown code blocks (```code```)
   */
  _stripMarkdownCodeBlocks(text) {
    // Remove ```language\ncode\n```
    return text.replace(/```[\w]*\n([\s\S]*?)\n```/g, '$1').trim();
  }

  getFormatInstructions() {
    return 'Respond with plain text. No markdown formatting.';
  }
}