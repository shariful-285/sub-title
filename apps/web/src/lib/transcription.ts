import OpenAI from 'openai';
import { LRUCache } from 'lru-cache';
import 'server-only';

// Initialize Clients
const groqClient = process.env.GROQ_API_KEY
    ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
    : null;

const openaiClient = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// Cache for transcripts (hash -> text)
// In prod, use Redis. MVP uses LRUCache.
const transcriptCache = new LRUCache<string, any>({
    max: 100,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
});

interface TranscriptionOptions {
    file: File | Blob;
    language?: string;
    prompt?: string;
}

export async function transcribeAudio(options: TranscriptionOptions) {
    // 1. Check Cache (Skip for MVP unless we hash file content, which is expensive on Edge)
    // Future: Compute lightweight hash of file header + size

    // 2. Select Provider
    let client = groqClient;
    let model = 'whisper-large-v3';

    // Fallback logic
    if (!client && openaiClient) {
        client = openaiClient;
        model = 'whisper-1';
        console.log('Using OpenAI fallback');
    } else if (!client) {
        throw new Error('No transcription provider configured (GROQ_API_KEY or OPENAI_API_KEY missing)');
    }

    console.log(`Transcribing with ${model}...`);

    try {
        const response = await client.audio.transcriptions.create({
            file: options.file as any,
            model: model,
            language: options.language, // Auto-detect if undefined
            prompt: options.prompt,
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'], // Get precise timestamps
        });

        return response;
    } catch (error) {
        console.error('Transcription Provider Error:', error);
        // Implement retry logic here if needed
        throw error;
    }
}
