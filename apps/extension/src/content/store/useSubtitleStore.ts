import { create } from 'zustand';

export interface SubtitleConfig {
    fontSize: number;
    opacity: number;
    enabled: boolean;
    language: string;
    apiKey: string;
    provider: 'groq' | 'openai' | 'openrouter' | 'gemini';
}

export interface SubtitleSegment {
    start: number;
    end: number;
    text: string;
}

interface SubtitleState {
    config: SubtitleConfig;
    currentText: string | null;
    segments: SubtitleSegment[];
    isRecording: boolean;
    error: string | null;

    // Actions
    setConfig: (config: Partial<SubtitleConfig>) => void;
    setSegments: (segments: SubtitleSegment[]) => void;
    updateCurrentText: (time: number) => void;
    addSegment: (segment: SubtitleSegment) => void;
    setIsRecording: (isRecording: boolean) => void;
    setError: (error: string | null) => void;
}

export const useSubtitleStore = create<SubtitleState>((set, get) => ({
    config: {
        fontSize: 24,
        opacity: 0.8,
        enabled: true,
        language: 'original',
        apiKey: '',
        provider: 'groq',
    },
    currentText: null,
    segments: [],
    isRecording: false,
    error: null,

    setConfig: (newConfig) => {
        set((state) => {
            const updatedConfig = { ...state.config, ...newConfig };
            // Persist to chrome storage
            chrome.storage.local.set({ extension_config: updatedConfig });
            return { config: updatedConfig };
        });
    },

    setSegments: (segments) => set({ segments }),

    setIsRecording: (isRecording) => set({ isRecording }),
    setError: (error) => set({ error }),

    addSegment: (segment) =>
        set((state) => ({
            segments: [...state.segments, segment].sort((a, b) => a.start - b.start)
        })),

    updateCurrentText: (time) => {
        const { segments, config } = get();
        if (!config.enabled) {
            if (get().currentText !== null) set({ currentText: null });
            return;
        }

        // Find segment matching current time
        // Implementation note: efficient binary search would be better for long videos
        // but linear scan is okay for MVP given we clear segments or keep them small.
        // For now, simpler arrays.

        // We want the LAST segment that started before `time` and hasn't ended yet.
        // Or just find one that overlaps.
        const activeSegment = segments.find(s => time >= s.start && time <= s.end);

        if (activeSegment) {
            if (get().currentText !== activeSegment.text) {
                set({ currentText: activeSegment.text });
            }
        } else {
            if (get().currentText !== null) {
                set({ currentText: null });
            }
        }
    }
}));

// Initialize from storage
chrome.storage.local.get(['extension_config'], (result) => {
    if (result.extension_config) {
        useSubtitleStore.getState().setConfig(result.extension_config);
    }
});
