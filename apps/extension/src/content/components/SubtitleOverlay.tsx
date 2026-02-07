import { useSubtitleStore } from '../store/useSubtitleStore';
import { twMerge } from 'tailwind-merge';

export const SubtitleOverlay = () => {
    const { currentText, config, isRecording, error } = useSubtitleStore();

    if (!config.enabled) return null;

    return (
        <div
            className="fixed z-[2147483647] bottom-32 left-1/2 -translate-x-1/2 pointer-events-none w-full max-w-4xl px-4 text-center select-none"
        >
            {error && (
                <div className="mb-4">
                    <span className="inline-block bg-red-900/80 text-white px-3 py-1 rounded text-xs backdrop-blur-md border border-red-500/50">
                        Error: {error}
                    </span>
                </div>
            )}

            {currentText ? (
                <span
                    className={twMerge(
                        "inline-block bg-black/70 text-white px-6 py-3 rounded-xl backdrop-blur-md transition-all duration-300 transform scale-100",
                        config.language === 'original' ? 'font-medium' : 'font-bold'
                    )}
                    style={{
                        fontSize: `${config.fontSize}px`,
                        opacity: config.opacity,
                        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                        letterSpacing: '0.025em'
                    }}
                >
                    {currentText}
                </span>
            ) : isRecording ? (
                <div className="flex flex-col items-center gap-2 animate-pulse">
                    <span className="inline-block bg-slate-900/60 text-slate-300 px-4 py-2 rounded-full text-sm backdrop-blur-sm border border-slate-700/50">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2" />
                        Listening for audio...
                    </span>
                </div>
            ) : null}
        </div>
    );
};
