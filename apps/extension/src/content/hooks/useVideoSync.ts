import { useEffect, useRef } from 'react';
import { useSubtitleStore } from '../store/useSubtitleStore';

export function useVideoSync() {
    const updateCurrentText = useSubtitleStore(state => state.updateCurrentText);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        // Find the YouTube video player
        // YouTube uses varying selectors; usually 'video' tag is sufficient
        // but we might want to target specific containers if multiple.
        const findVideo = () => {
            const v = document.querySelector('video');
            if (v) {
                videoRef.current = v;
                attachListeners(v);
            } else {
                // Retry a few times if video not loaded yet?
                setTimeout(findVideo, 1000);
            }
        };

        findVideo();

        return () => {
            if (videoRef.current) {
                removeListeners(videoRef.current);
            }
        };
    }, []);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            updateCurrentText(videoRef.current.currentTime);
        }
    };

    const attachListeners = (video: HTMLVideoElement) => {
        video.addEventListener('timeupdate', handleTimeUpdate);
    };

    const removeListeners = (video: HTMLVideoElement) => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
    };

    return videoRef;
}
