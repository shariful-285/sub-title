import { useSubtitleStore } from './store/useSubtitleStore';

export class AudioCapture {
    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private videoElement: HTMLVideoElement | null = null;
    private observer: MutationObserver | null = null;
    private chunkInterval: number = 30000; // 30 seconds to avoid rate limits

    constructor() {
        this.init();
    }

    private init() {
        if (!document.body) {
            console.warn('Document body not available, delaying AudioCapture init.');
            setTimeout(() => this.init(), 500);
            return;
        }

        // Observer to detect video element
        this.observer = new MutationObserver(() => {
            const video = document.querySelector('video');
            if (video && video !== this.videoElement) {
                console.log('Video element changed or found via observer');
                this.stop(); // Clean up previous session
                this.videoElement = video;
                this.startCapture(video);
            }
        });

        this.observer.observe(document.body, { childList: true, subtree: true });

        // Check initially
        const video = document.querySelector('video');
        if (video) {
            console.log('Video element found initially');
            this.videoElement = video;
            this.startCapture(video);
        }
    }

    private startCapture(video: HTMLVideoElement) {
        // Wait for video to be ready if it's not
        if (video.readyState < 2) { // HAVE_CURRENT_DATA
            console.log('Video metadata not loaded, waiting...');
            video.addEventListener('loadedmetadata', () => this.startCapture(video), { once: true });
            return;
        }

        console.log('Starting capture for video', video);
        try {
            // @ts-ignore - captureStream is supported in Chrome
            if (typeof video.captureStream !== 'function') {
                console.error('video.captureStream() is not supported on this element');
                return;
            }

            const fullStream = (video as any).captureStream();

            // Extract ONLY audio tracks to avoid overhead and issues with MediaRecorder
            const audioTracks = fullStream.getAudioTracks();
            if (audioTracks.length === 0) {
                console.warn('No audio tracks found in captured stream');
                // Some videos might load audio later? 
                // For now, if no audio, we might just fail or wait.
            }

            this.stream = new MediaStream(audioTracks);

            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not supported`);
                return;
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.sendChunk(event.data);
                }
            };

            this.mediaRecorder.start(this.chunkInterval);
            console.log('MediaRecorder started');
            useSubtitleStore.getState().setIsRecording(true);
            useSubtitleStore.getState().setError(null);

        } catch (e) {
            console.error('Error starting capture:', e);
        }
    }

    public stop() {
        console.log('Stopping previous capture session...');
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.mediaRecorder = null;
        this.stream = null;
        useSubtitleStore.getState().setIsRecording(false);
    }

    public destroy() {
        this.stop();
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    private sendChunk(blob: Blob) {
        if (!this.videoElement) return;

        const timestamp = this.videoElement.currentTime;

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result;
            if (typeof base64data === 'string') {
                chrome.runtime.sendMessage({
                    type: 'AUDIO_CHUNK',
                    payload: {
                        data: base64data,
                        timestamp: timestamp,
                        videoUrl: window.location.href
                    }
                });
            }
        };
    }
}
