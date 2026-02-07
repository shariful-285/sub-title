export interface AudioChunkMessage {
    type: 'AUDIO_CHUNK';
    payload: {
        data: string; // base64
        timestamp: number;
        videoUrl: string;
    };
}

export interface TranscriptionResponse {
    text: string;
    chunks: {
        start: number;
        end: number;
        text: string;
    }[];
}
