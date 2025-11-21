import { BaseOutputParser, OutputParserException } from './base-parser.js';

/**
 * Parser that extracts JSON from LLM output
 * Handles markdown code blocks and extra text
 *
 * Example:
 *   const parser = new JsonOutputParser();
 *   const result = await parser.parse('```json\n{"name": "Alice"}\n```');
 *   // { name: "Alice" }
 */
export class JsonOutputParser extends BaseOutputParser {
  constructor(options = {}) {
    super();
    this.schema = options.schema;
  }

  /**
   * Parse JSON from text
   */
  async parse(text) {
    try {
      // Try to extract JSON from the text
      const jsonText = this._extractJson(text);
      const parsed = JSON.parse(jsonText);

      // Validate against schema if provided
      if (this.schema) {
        this._validateSchema(parsed);
      }

      return parsed;
    } catch (error) {
      throw new OutputParserException(
          `Failed to parse JSON: ${error.message}`,
          text,
          error
      );
    }
  }

  /**
   * Extract JSON from text (handles markdown, extra text)
   */
  _extractJson(text) {
    // Try direct parse first
    try {
      JSON.parse(text.trim());
      return text.trim();
    } catch {
      // Not direct JSON, try to find it
    }

    // Look for JSON in markdown code blocks
    const markdownMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (markdownMatch) {
      return markdownMatch[1].trim();
    }

    // Look for JSON object/array patterns
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      return jsonObjectMatch[0];
    }

    const jsonArrayMatch = text.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      return jsonArrayMatch[0];
    }

    // Give up, return original
    return text.trim();
  }

  /**
   * Validate parsed JSON against schema
   */
  _validateSchema(parsed) {
    if (!this.schema) return;

    for (const [key, type] of Object.entries(this.schema)) {
      if (!(key in parsed)) {
        throw new Error(`Missing required field: ${key}`);
      }

      const actualType = typeof parsed[key];
      if (actualType !== type) {
        throw new Error(
            `Field ${key} should be ${type}, got ${actualType}`
        );
      }
    }
  }

  getFormatInstructions() {
    let instructions = 'Respond with valid JSON.';

    if (this.schema) {
      const schemaDesc = Object.entries(this.schema)
          .map(([key, type]) => `"${key}": ${type}`)
          .join(', ');
      instructions += ` Schema: { ${schemaDesc} }`;
    }

    return instructions;
  }
}