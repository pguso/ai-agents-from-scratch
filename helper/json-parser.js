/**
 * Robust JSON parser for LLM outputs
 * Handles common issues like:
 * - Missing opening/closing braces
 * - Markdown code blocks
 * - Extra text before/after JSON
 * - Escaped quotes
 * - Trailing commas
 */

export class JsonParser {
    /**
     * Extract and parse JSON from potentially messy LLM output
     * @param {string} text - Raw text from LLM
     * @param {object} options - Parsing options
     * @returns {object} Parsed JSON object
     */
    static parse(text, options = {}) {
        const {
            debug = false,
            expectArray = false,
            expectObject = true,
            repairAttempts = true
        } = options;

        if (debug) {
            console.log("\nRAW LLM OUTPUT:");
            console.log("-".repeat(70));
            console.log(text);
            console.log("-".repeat(70) + "\n");
        }

        // Step 1: Clean the text
        let cleaned = this.cleanText(text, debug);

        // Step 2: Extract JSON
        let extracted = this.extractJson(cleaned, expectArray, expectObject, debug);

        // Step 3: Attempt to parse
        try {
            const parsed = JSON.parse(extracted);
            if (debug) console.log("Successfully parsed JSON\n");
            return parsed;
        } catch (firstError) {
            if (debug) {
                console.log("First parse attempt failed:", firstError.message);
            }

            if (!repairAttempts) {
                throw new Error(`JSON parse failed: ${firstError.message}\n\nExtracted text:\n${extracted}`);
            }

            // Step 4: Attempt repairs
            return this.attemptRepairs(extracted, debug);
        }
    }

    /**
     * Clean text from common LLM artifacts
     */
    static cleanText(text, debug = false) {
        let cleaned = text;

        // Remove markdown code blocks
        cleaned = cleaned.replace(/```json\s*/gi, '');
        cleaned = cleaned.replace(/```\s*/g, '');

        // Remove common prefixes
        cleaned = cleaned.replace(/^(Here's the plan:|JSON output:|Plan:|Output:)\s*/i, '');

        // Trim whitespace
        cleaned = cleaned.trim();

        if (debug && cleaned !== text) {
            console.log("Cleaned text (removed markdown/prefixes)\n");
        }

        return cleaned;
    }

    /**
     * Extract JSON from text (handles text before/after JSON)
     */
    static extractJson(text, expectArray = false, expectObject = true, debug = false) {
        // Try to find JSON boundaries
        const startChar = expectArray ? '[' : '{';
        const endChar = expectArray ? ']' : '}';

        const startIdx = text.indexOf(startChar);
        const lastIdx = text.lastIndexOf(endChar);

        if (startIdx === -1 || lastIdx === -1 || startIdx >= lastIdx) {
            if (debug) {
                console.log(`Could not find valid ${startChar}...${endChar} boundaries`);
                console.log(`Start index: ${startIdx}, End index: ${lastIdx}`);
            }

            // Maybe it's missing braces - try to add them
            if (expectObject && !text.trim().startsWith('{')) {
                const withBraces = '{' + text.trim() + '}';
                if (debug) console.log("Added missing opening brace");
                return withBraces;
            }

            return text;
        }

        const extracted = text.substring(startIdx, lastIdx + 1);

        if (debug && extracted !== text) {
            console.log("Extracted JSON from surrounding text:");
            console.log(extracted.substring(0, 100) + (extracted.length > 100 ? '...' : ''));
            console.log();
        }

        return extracted;
    }

    /**
     * Attempt various repair strategies
     */
    static attemptRepairs(jsonString, debug = false) {
        const repairs = [
            // Repair 1: Remove trailing commas
            (str) => {
                const fixed = str.replace(/,(\s*[}\]])/g, '$1');
                if (debug && fixed !== str) console.log("Repair 1: Removed trailing commas");
                return fixed;
            },

            // Repair 2: Fix missing quotes around property names
            (str) => {
                const fixed = str.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
                if (debug && fixed !== str) console.log("Repair 2: Added quotes around property names");
                return fixed;
            },

            // Repair 3: Fix single quotes to double quotes
            (str) => {
                const fixed = str.replace(/'/g, '"');
                if (debug && fixed !== str) console.log("Repair 3: Converted single quotes to double quotes");
                return fixed;
            },

            // Repair 4: Add missing closing braces
            (str) => {
                const openBraces = (str.match(/{/g) || []).length;
                const closeBraces = (str.match(/}/g) || []).length;
                if (openBraces > closeBraces) {
                    const fixed = str + '}'.repeat(openBraces - closeBraces);
                    if (debug) console.log(`Repair 4: Added ${openBraces - closeBraces} missing closing brace(s)`);
                    return fixed;
                }
                return str;
            },

            // Repair 5: Add missing closing brackets
            (str) => {
                const openBrackets = (str.match(/\[/g) || []).length;
                const closeBrackets = (str.match(/]/g) || []).length;
                if (openBrackets > closeBrackets) {
                    const fixed = str + ']'.repeat(openBrackets - closeBrackets);
                    if (debug) console.log(`Repair 5: Added ${openBrackets - closeBrackets} missing closing bracket(s)`);
                    return fixed;
                }
                return str;
            },

            // Repair 6: Fix escaped quotes that shouldn't be escaped
            (str) => {
                const fixed = str.replace(/\\"/g, '"');
                if (debug && fixed !== str) console.log("Repair 6: Fixed escaped quotes");
                return fixed;
            },

            // Repair 7: Remove control characters
            (str) => {
                // eslint-disable-next-line no-control-regex
                const fixed = str.replace(/[\x00-\x1F\x7F]/g, '');
                if (debug && fixed !== str) console.log("Repair 7: Removed control characters");
                return fixed;
            }
        ];

        let current = jsonString;

        // Try each repair in sequence
        for (const repair of repairs) {
            current = repair(current);
        }

        // Try parsing after all repairs
        try {
            const parsed = JSON.parse(current);
            if (debug) console.log("Successfully parsed after repairs\n");
            return parsed;
        } catch (error) {
            // Last resort: try to extract just the atoms array if it's there
            const atomsMatch = current.match(/"atoms"\s*:\s*(\[[\s\S]*\])/);
            if (atomsMatch) {
                try {
                    const atomsOnly = { atoms: JSON.parse(atomsMatch[1]) };
                    if (debug) console.log("Extracted and parsed atoms array\n");
                    return atomsOnly;
                } catch (innerError) {
                    // Fall through to final error
                }
            }

            // If all repairs fail, throw detailed error
            throw new Error(
                `JSON parse failed after all repair attempts.\n\n` +
                `Original error: ${error.message}\n\n` +
                `Attempted repairs:\n${current.substring(0, 500)}${current.length > 500 ? '...' : ''}\n\n` +
                `Tip: Check if the LLM is following the JSON schema correctly.`
            );
        }
    }

    /**
     * Validate parsed plan structure
     */
    static validatePlan(plan, debug = false) {
        if (!plan || typeof plan !== 'object') {
            throw new Error('Plan must be an object');
        }

        if (!Array.isArray(plan.atoms)) {
            throw new Error('Plan must have an "atoms" array');
        }

        if (plan.atoms.length === 0) {
            throw new Error('Plan must have at least one atom');
        }

        for (const atom of plan.atoms) {
            if (typeof atom.id !== 'number') {
                throw new Error(`Atom missing or invalid id: ${JSON.stringify(atom)}`);
            }

            if (!atom.kind || !['tool', 'decision', 'final'].includes(atom.kind)) {
                throw new Error(`Atom ${atom.id} has invalid kind: ${atom.kind}`);
            }

            if (!atom.name || typeof atom.name !== 'string') {
                throw new Error(`Atom ${atom.id} missing or invalid name`);
            }

            if (atom.dependsOn && !Array.isArray(atom.dependsOn)) {
                throw new Error(`Atom ${atom.id} dependsOn must be an array`);
            }
        }

        if (debug) {
            console.log(`Plan structure validated: ${plan.atoms.length} atoms\n`);
        }

        return true;
    }

    /**
     * Pretty print plan for debugging
     */
    static prettyPrint(plan) {
        console.log("\nPLAN STRUCTURE:");
        console.log("=".repeat(70));

        for (const atom of plan.atoms) {
            const deps = atom.dependsOn && atom.dependsOn.length > 0
                ? ` (depends on: ${atom.dependsOn.join(', ')})`
                : '';

            console.log(`  ${atom.id}. [${atom.kind}] ${atom.name}${deps}`);

            if (atom.input && Object.keys(atom.input).length > 0) {
                console.log(`     Input: ${JSON.stringify(atom.input)}`);
            }
        }

        console.log("=".repeat(70) + "\n");
    }
}