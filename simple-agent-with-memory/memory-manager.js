import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MemoryManager {
    constructor(memoryFileName = './memory.json') {
        this.memoryFilePath = path.resolve(__dirname, memoryFileName);
    }

    async loadMemories() {
        try {
            const data = await fs.readFile(this.memoryFilePath, 'utf-8');
            const json = JSON.parse(data);

            // 🔧 Migrate old schema if needed
            if (!json.memories) {
                const upgraded = {memories: [], conversationHistory: []};

                if (Array.isArray(json.facts)) {
                    for (const f of json.facts) {
                        upgraded.memories.push({
                            type: 'fact',
                            key: this.extractKey(f.content),
                            value: this.extractValue(f.content),
                            source: 'migration',
                            timestamp: f.timestamp || new Date().toISOString()
                        });
                    }
                }

                if (json.preferences && typeof json.preferences === 'object') {
                    for (const [key, val] of Object.entries(json.preferences)) {
                        upgraded.memories.push({
                            type: 'preference',
                            key,
                            value: this.extractValue(val),
                            source: 'migration',
                            timestamp: new Date().toISOString()
                        });
                    }
                }

                await this.saveMemories(upgraded);
                return upgraded;
            }

            if (!Array.isArray(json.memories)) json.memories = [];
            if (!Array.isArray(json.conversationHistory)) json.conversationHistory = [];

            return json;
        } catch {
            return {memories: [], conversationHistory: []};
        }
    }

    async saveMemories(memories) {
        await fs.writeFile(this.memoryFilePath, JSON.stringify(memories, null, 2));
    }

    // Add or update memory without duplicates
    async addMemory({type, key, value, source = 'user'}) {
        const data = await this.loadMemories();

        // Normalize for comparison
        const normType = type.trim().toLowerCase();
        const normKey = key.trim().toLowerCase();
        const normValue = value.trim();

        // Check if same key+type already exists
        const existingIndex = data.memories.findIndex(
            m => m.type === normType && m.key.toLowerCase() === normKey
        );

        if (existingIndex >= 0) {
            const existing = data.memories[existingIndex];
            // Update value if changed
            if (existing.value !== normValue) {
                existing.value = normValue;
                existing.timestamp = new Date().toISOString();
                existing.source = source;
                console.log(`Updated memory: ${normKey} → ${normValue}`);
            } else {
                console.log(`Skipped duplicate memory: ${normKey}`);
            }
        } else {
            // Add new memory
            data.memories.push({
                type: normType,
                key: normKey,
                value: normValue,
                source,
                timestamp: new Date().toISOString()
            });
            console.log(`Added memory: ${normKey} = ${normValue}`);
        }

        await this.saveMemories(data);
    }

    async getMemorySummary() {
        const data = await this.loadMemories();
        const facts = Array.isArray(data.memories)
            ? data.memories.filter(m => m.type === 'fact')
            : [];
        const prefs = Array.isArray(data.memories)
            ? data.memories.filter(m => m.type === 'preference')
            : [];

        let summary = "\n=== LONG-TERM MEMORY ===\n";

        if (facts.length > 0) {
            summary += "\nKnown Facts:\n";
            for (const f of facts) summary += `- ${f.key}: ${f.value}\n`;
        }

        if (prefs.length > 0) {
            summary += "\nUser Preferences:\n";
            for (const p of prefs) summary += `- ${p.key}: ${p.value}\n`;
        }

        return summary;
    }

    extractKey(content) {
        if (typeof content !== 'string') return 'unknown';
        const [key] = content.split(':').map(s => s.trim());
        return key || 'unknown';
    }

    extractValue(content) {
        if (typeof content !== 'string') return '';
        const parts = content.split(':').map(s => s.trim());
        return parts.length > 1 ? parts.slice(1).join(':') : content;
    }
}