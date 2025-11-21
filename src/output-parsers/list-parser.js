import { BaseOutputParser } from './base-parser.js';

/**
 * Parser that extracts lists from text
 * Handles: numbered lists, bullets, comma-separated
 *
 * Example:
 *   const parser = new ListOutputParser();
 *   const result = await parser.parse("1. Apple\n2. Banana\n3. Orange");
 *   // ["Apple", "Banana", "Orange"]
 *
 *  Enhancement: handle multi line csv correctly
 */
export class ListOutputParser extends BaseOutputParser {
  constructor(options = {}) {
    super();
    this.separator = options.separator;
  }

  /**
   * Parse list from text
   */
  async parse(text) {
    const cleaned = text.trim();

    // If separator specified, use it
    if (this.separator) {
      return cleaned
          .split(this.separator)
          .map(item => item.trim())
          .filter(item => item.length > 0);
    }

    // Try to detect format
    if (this._isNumberedList(cleaned)) {
      return this._parseNumberedList(cleaned);
    }

    if (this._isBulletList(cleaned)) {
      return this._parseBulletList(cleaned);
    }

    // Try comma-separated
    if (cleaned.includes(',')) {
      return cleaned
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
    }

    // Try newline-separated
    return cleaned
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
  }

  /**
   * Check if text is numbered list (1. Item\n2. Item)
   */
  _isNumberedList(text) {
    return /^\d+\./.test(text);
  }

  /**
   * Check if text is bullet list (- Item\n- Item or * Item)
   */
  _isBulletList(text) {
    return /^[-*•]/.test(text);
  }

  /**
   * Parse numbered list
   */
  _parseNumberedList(text) {
    return text
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(item => item.length > 0);
  }

  /**
   * Parse bullet list
   */
  _parseBulletList(text) {
    return text
        .split('\n')
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(item => item.length > 0);
  }

  getFormatInstructions() {
    if (this.separator) {
      return `Respond with items separated by "${this.separator}".`;
    }
    return 'Respond with a numbered list (1. Item) or bullet list (- Item).';
  }
}