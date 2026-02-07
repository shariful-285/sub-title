import { createRoot } from 'react-dom/client';
import { ContentApp } from './ContentApp';
import { AudioCapture } from './audioCapture';
import './content.css';

console.log('Content script injected.');

// Initialize Audio Capture
const capture = new AudioCapture();
(window as any)._audioCapture = capture;

// Inject Subtitle Root
const rootDiv = document.createElement('div');
rootDiv.id = 'youtube-subtitle-generator-root';
document.body.appendChild(rootDiv);

const root = createRoot(rootDiv);
root.render(<ContentApp />);

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TRANSCRIPT_RESULT') {
        const { text, start } = message.payload;
        console.log('New transcript:', text);
        import('./store/useSubtitleStore').then(({ useSubtitleStore }) => {
            useSubtitleStore.getState().addSegment({
                start: start,
                end: start + 30, // Match 30s chunk
                text: text
            });
            useSubtitleStore.getState().setError(null);
        });
    } else if (message.type === 'TRANSCRIPT_ERROR') {
        console.error('Transcription error:', message.payload.error);
        import('./store/useSubtitleStore').then(({ useSubtitleStore }) => {
            useSubtitleStore.getState().setError(message.payload.error);
        });
    }
});

