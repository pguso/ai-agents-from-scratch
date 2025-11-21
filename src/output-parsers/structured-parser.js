import { BaseOutputParser, OutputParserException } from './base-parser.js';

/**
 * Parser with full schema validation
 *
 * Example:
 *   const parser = new StructuredOutputParser({
 *       responseSchemas: [
 *           {
 *               name: "sentiment",
 *               type: "string",
 *               description: "The sentiment (positive/negative/neutral)",
 *               enum: ["positive", "negative", "neutral"]
 *           },
 *           {
 *               name: "confidence",
 *               type: "number",
 *               description: "Confidence score between 0 and 1"
 *           }
 *       ]
 *   });
 */
export class StructuredOutputParser extends BaseOutputParser {
  constructor(options = {}) {
    super();
    this.responseSchemas = options.responseSchemas || [];
  }

  /**
   * Parse and validate against schema
   */
  async parse(text) {
    try {
      // Extract JSON
      const jsonText = this._extractJson(text);
      const parsed = JSON.parse(jsonText);

      // Validate against schema
      this._validateAgainstSchema(parsed);

      return parsed;
    } catch (error) {
      throw new OutputParserException(
          `Failed to parse structured output: ${error.message}`,
          text,
          error
      );
    }
  }

  /**
   * Extract JSON from text (same as JsonOutputParser)
   */
  _extractJson(text) {
    try {
      JSON.parse(text.trim());
      return text.trim();
    } catch {}

    const markdownMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (markdownMatch) return markdownMatch[1].trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];

    return text.trim();
  }

  /**
   * Validate parsed data against schema
   */
  _validateAgainstSchema(parsed) {
    for (const schema of this.responseSchemas) {
      const { name, type, enum: enumValues, required = true } = schema;

      // Check required fields
      if (required && !(name in parsed)) {
        throw new Error(`Missing required field: ${name}`);
      }

      if (name in parsed) {
        const value = parsed[name];

        // Check type
        if (!this._checkType(value, type)) {
          throw new Error(
              `Field ${name} should be ${type}, got ${typeof value}`
          );
        }

        // Check enum values
        if (enumValues && !enumValues.includes(value)) {
          throw new Error(
              `Field ${name} must be one of: ${enumValues.join(', ')}`
          );
        }
      }
    }
  }

  /**
   * Check if value matches expected type
   */
  _checkType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Generate format instructions for LLM
   */
  getFormatInstructions() {
    const schemaDescriptions = this.responseSchemas.map(schema => {
      let desc = `"${schema.name}": ${schema.type}`;
      if (schema.description) {
        desc += ` // ${schema.description}`;
      }
      if (schema.enum) {
        desc += ` (one of: ${schema.enum.join(', ')})`;
      }
      return desc;
    });

    return `Respond with valid JSON matching this schema:
{
${schemaDescriptions.map(d => '  ' + d).join(',\n')}
}`;
  }

  /**
   * Static helper to create from simple schema
   */
  static fromNamesAndDescriptions(schemas) {
    const responseSchemas = Object.entries(schemas).map(([name, description]) => ({
      name,
      description,
      type: 'string' // Default type
    }));

    return new StructuredOutputParser({ responseSchemas });
  }
}