import { useVideoSync } from './hooks/useVideoSync';
import { SubtitleOverlay } from './components/SubtitleOverlay';
import { SubtitleControls } from './components/SubtitleControls';

export const ContentApp = () => {
    useVideoSync();
    return (
        <>
            <SubtitleOverlay />
            <SubtitleControls />
        </>
    );
};
