import { BaseOutputParser, OutputParserException } from './base-parser.js';

/**
 * Parser that uses regex to extract structured data
 *
 * Example:
 *   const parser = new RegexOutputParser({
 *       regex: /Sentiment: (\w+), Confidence: ([\d.]+)/,
 *       outputKeys: ["sentiment", "confidence"]
 *   });
 *
 *   const result = await parser.parse("Sentiment: positive, Confidence: 0.92");
 *   // { sentiment: "positive", confidence: "0.92" }
 */
export class RegexOutputParser extends BaseOutputParser {
  constructor(options = {}) {
    super();
    this.regex = options.regex;
    this.outputKeys = options.outputKeys || [];
    this.dotAll = options.dotAll ?? false;

    if (this.dotAll) {
      // Add 's' flag for dotAll if not present
      const flags = this.regex.flags.includes('s')
          ? this.regex.flags
          : this.regex.flags + 's';
      this.regex = new RegExp(this.regex.source, flags);
    }
  }

  /**
   * Parse using regex
   */
  async parse(text) {
    const match = text.match(this.regex);

    if (!match) {
      throw new OutputParserException(
          `Text does not match regex pattern: ${this.regex}`,
          text
      );
    }

    // If no output keys, return the groups as array
    if (this.outputKeys.length === 0) {
      return match.slice(1); // Exclude full match
    }

    // Map groups to keys
    const result = {};
    for (let i = 0; i < this.outputKeys.length; i++) {
      result[this.outputKeys[i]] = match[i + 1]; // +1 to skip full match
    }

    return result;
  }

  getFormatInstructions() {
    if (this.outputKeys.length > 0) {
      return `Format your response to match: ${this.outputKeys.join(', ')}`;
    }
    return 'Follow the specified format exactly.';
  }
}