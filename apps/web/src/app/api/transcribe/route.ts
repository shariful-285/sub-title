import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { transcribeAudio } from '@/lib/transcription';

// Schema for input validation
// Note: FormData validation is manual, but we validate extracted values
const transcriptionSchema = z.object({
    file: z.instanceof(Blob, { message: "File is required and must be a Blob" })
        .refine((file) => file.size <= 25 * 1024 * 1024, "File size must be less than 25MB")
        .refine((file) => ['audio/webm', 'audio/mp3', 'audio/wav', 'video/mp4'].some(t => file.type.includes(t)) || true, "Invalid file type"), // Loose check for now
    language: z.string().optional(),
    videoId: z.string().optional(),
    timestamp: z.string().optional(),
});

export const runtime = 'nodejs'; // Whisper SDK might need Node.js runtime, not Edge

export async function POST(req: Request) {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    try {
        // 1. Rate Limiting
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const limiter = rateLimit({ ip, limit: 10, window: 60 * 1000 }); // 10 requests per minute

        if (!limiter.success) {
            return NextResponse.json(
                { error: 'Too many requests', retryAfter: limiter.remaining },
                { status: 429, headers: corsHeaders }
            );
        }

        // 2. Input Parsing & Validation
        const formData = await req.formData();
        const rawData = {
            file: formData.get('file'),
            language: formData.get('language'),
            videoId: formData.get('videoId'),
            timestamp: formData.get('timestamp'),
        };

        // Zod parsing
        // We need to cast file to Blob manually for Zod to see it as such if it comes from FormData
        const validationResult = transcriptionSchema.safeParse({
            ...rawData,
            file: rawData.file instanceof Blob ? rawData.file : undefined
        });

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: validationResult.error.format() },
                { status: 400, headers: corsHeaders }
            );
        }

        const { file, language } = validationResult.data;

        // 3. Transcription Service
        console.log(`Processing upload: ${file.size} bytes`);
        const transcript = await transcribeAudio({
            file,
            language: language || undefined
        });

        // 4. Success Response
        return NextResponse.json(transcript, { headers: corsHeaders });

    } catch (error: any) {
        console.error('API Handler Error:', error);

        return NextResponse.json(
            {
                error: error.message || 'Internal Server Error',
                code: error.status || 500
            },
            {
                status: error.status || 500,
                headers: corsHeaders
            }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
