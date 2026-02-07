import { useState, useEffect } from 'react';
import { Settings, ExternalLink, Activity, Youtube, ChevronLeft, Save } from 'lucide-react';

function App() {
  const [status, setStatus] = useState<'idle' | 'recording' | 'error'>('idle');
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'groq' | 'openai' | 'openrouter' | 'gemini'>('groq');

  useEffect(() => {
    // Load config from storage
    chrome.storage.local.get(['extension_config'], (result) => {
      const config = result.extension_config as any;
      if (config) {
        setApiKey(config.apiKey || '');
        setProvider(config.provider || 'groq');
      }
    });

    // Check if we are on a YouTube page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url?.includes('youtube.com/watch')) {
        setVideoTitle(tab.title?.replace(' - YouTube', '') || 'Unknown Video');
        setStatus('recording');
      } else {
        setStatus('idle');
      }
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.local.get(['extension_config'], (result) => {
      const currentConfig = result.extension_config || {
        fontSize: 24,
        opacity: 0.8,
        enabled: true,
        language: 'original'
      };

      const updatedConfig = {
        ...currentConfig,
        apiKey,
        provider
      };

      chrome.storage.local.set({ extension_config: updatedConfig }, () => {
        setShowSettings(false);
        // Alert user it's saved
        console.log('Settings saved');
      });
    });
  };

  if (showSettings) {
    return (
      <div className="p-4 font-sans text-slate-200 w-[320px]">
        <header className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setShowSettings(false)}
            className="p-1 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Settings</h1>
        </header>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              API Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'groq' | 'openai' | 'openrouter' | 'gemini')}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-red-500 transition-colors"
            >
              <option value="groq">Groq (Recommended - Fast)</option>
              <option value="openai">OpenAI (Whisper-1)</option>
              <option value="openrouter">OpenRouter (Unified API)</option>
              <option value="gemini">Google Gemini (Free Tier)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-red-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500">
              Your key is stored locally and securely in your browser.
            </p>
          </div>

          <button
            onClick={saveSettings}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold text-white transition-all bg-red-600 rounded-lg hover:bg-red-700 active:scale-95 shadow-lg shadow-red-900/20"
          >
            <Save size={18} />
            Save Configuration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 font-sans text-slate-200 w-[320px]">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-red-500">
          <Youtube size={24} />
          <h1 className="text-lg font-bold text-white">Subtitle Gen</h1>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 transition-colors rounded-full hover:bg-slate-800 cursor-pointer"
        >
          <Settings size={18} className="text-slate-400" />
        </button>
      </header>

      <div className="p-4 mb-6 border border-slate-700 rounded-xl bg-slate-800/50">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-sm font-medium text-slate-300">
            {status === 'recording' ? 'Active & Listening' : 'Standing By'}
          </span>
        </div>

        {videoTitle ? (
          <p className="text-xs text-slate-400 line-clamp-2">{videoTitle}</p>
        ) : (
          <p className="text-xs text-slate-500">No active video detected</p>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={() => alert('Live transcript feature coming soon! Checking for active transcription chunks...')}
          className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold text-black transition-colors bg-white rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <Activity size={18} />
          View Live Transcript
        </button>

        <button
          onClick={() => {
            const dashboardUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            window.open(dashboardUrl, '_blank');
          }}
          className="flex items-center justify-center w-full gap-2 py-3 text-sm font-medium transition-colors border rounded-lg border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
        >
          <ExternalLink size={18} />
          Open Dashboard
        </button>
      </div>

      <footer className="mt-8 text-xs text-center text-slate-600">
        Powered by OpenAI Whisper & Next.js
      </footer>
    </div>
  );
}

export default App;
