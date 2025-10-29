import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MemoryManager {
    constructor(memoryFileName = './memory.json') {
        this.memoryFilePath = path.resolve(__dirname, memoryFileName);
    }

    // Load memories from the JSON file
    async loadMemories() {
        try {
            const data = await fs.readFile(this.memoryFilePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, return empty memory
            return {
                facts: [],
                preferences: {},
                conversations: []
            };
        }
    }

    // Save new memories to the JSON file
    async saveMemories(memories) {
        await fs.writeFile(
            this.memoryFilePath,
            JSON.stringify(memories, null, 2)
        );
    }

    // Add a specific fact
    async addFact(fact) {
        const memories = await this.loadMemories();
        memories.facts.push({
            content: fact,
            timestamp: new Date().toISOString()
        });
        await this.saveMemories(memories);
    }

    // Add a user preference
    async addPreference(key, value) {
        const memories = await this.loadMemories();
        memories.preferences[key] = value;
        await this.saveMemories(memories);
    }

    // Get a summary of all memories for the system prompt
    async getMemorySummary() {
        const memories = await this.loadMemories();
        let summary = "\n=== LONG-TERM MEMORY ===\n";

        if (memories.facts.length > 0) {
            summary += "\nKnown Facts:\n";
            memories.facts.forEach(fact => {
                summary += `- ${fact.content}\n`;
            });
        }

        if (Object.keys(memories.preferences).length > 0) {
            summary += "\nUser Preferences:\n";
            Object.entries(memories.preferences).forEach(([key, value]) => {
                summary += `- ${key}: ${value}\n`;
            });
        }

        return summary;
    }
}