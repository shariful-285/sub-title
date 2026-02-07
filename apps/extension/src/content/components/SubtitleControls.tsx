import { useState } from 'react';
import { useSubtitleStore } from '../store/useSubtitleStore';
import { Settings, X } from 'lucide-react';

export const SubtitleControls = () => {
    const { config, setConfig } = useSubtitleStore();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="fixed z-[2147483647] top-20 right-4 font-sans text-slate-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-3 transition-all bg-black/70 backdrop-blur-md rounded-full hover:bg-black/90 text-white shadow-2xl border border-white/20 cursor-pointer hover:scale-110 active:scale-95"
                title="Subtitle Settings"
            >
                <Settings size={24} />
            </button>

            {isOpen && (
                <div className="absolute bottom-12 right-0 w-64 p-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white">Subtitle Settings</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-300">Enable Subtitles</label>
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => setConfig({ enabled: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-600 focus:ring-red-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-300">API Provider</label>
                            <select
                                value={config.provider}
                                onChange={(e) => setConfig({ provider: e.target.value as 'groq' | 'openai' })}
                                className="w-full text-xs bg-slate-800 border border-slate-700 rounded p-1 text-slate-200 outline-none focus:border-red-500"
                            >
                                <option value="groq">Groq (Fast & Free tier)</option>
                                <option value="openai">OpenAI (Whisper-1)</option>
                                <option value="openrouter">OpenRouter (Unified API)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-300">API Key</label>
                            <input
                                type="password"
                                value={config.apiKey}
                                onChange={(e) => setConfig({ apiKey: e.target.value })}
                                placeholder="Paste your API key here"
                                className="w-full text-xs bg-slate-800 border border-slate-700 rounded p-1 text-slate-200 outline-none focus:border-red-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-300">Font Size ({config.fontSize}px)</label>
                            <input
                                type="range"
                                min="12"
                                max="48"
                                value={config.fontSize}
                                onChange={(e) => setConfig({ fontSize: Number(e.target.value) })}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-300">Opacity ({config.opacity * 100}%)</label>
                            <input
                                type="range"
                                min="0.2"
                                max="1"
                                step="0.1"
                                value={config.opacity}
                                onChange={(e) => setConfig({ opacity: Number(e.target.value) })}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
