import { useRef, useEffect, useState, useCallback } from 'react';
import './CameraOverlay.css';

export function CameraOverlay({ stream, position = 'bottom-right', size = 'medium', onPositionChange, isRecording = false }) {
    const videoRef = useRef(null);
    const [isPiPActive, setIsPiPActive] = useState(false);
    const [isPiPSupported, setIsPiPSupported] = useState(false);

    // Check PiP support
    useEffect(() => {
        setIsPiPSupported('pictureInPictureEnabled' in document && document.pictureInPictureEnabled);
    }, []);

    // Set video stream
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Auto-enter PiP when recording starts
    useEffect(() => {
        if (isRecording && isPiPSupported && videoRef.current && !isPiPActive) {
            enterPiP();
        }
    }, [isRecording, isPiPSupported]);

    // Enter Picture-in-Picture
    const enterPiP = useCallback(async () => {
        if (!videoRef.current || !isPiPSupported) return;

        try {
            await videoRef.current.requestPictureInPicture();
            setIsPiPActive(true);
        } catch (error) {
            console.log('PiP failed:', error);
        }
    }, [isPiPSupported]);

    // Exit Picture-in-Picture
    const exitPiP = useCallback(async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            }
            setIsPiPActive(false);
        } catch (error) {
            console.log('Exit PiP failed:', error);
        }
    }, []);

    // Handle PiP events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleEnterPiP = () => setIsPiPActive(true);
        const handleLeavePiP = () => setIsPiPActive(false);

        video.addEventListener('enterpictureinpicture', handleEnterPiP);
        video.addEventListener('leavepictureinpicture', handleLeavePiP);

        return () => {
            video.removeEventListener('enterpictureinpicture', handleEnterPiP);
            video.removeEventListener('leavepictureinpicture', handleLeavePiP);
        };
    }, []);

    // Exit PiP when stream stops
    useEffect(() => {
        if (!stream && isPiPActive) {
            exitPiP();
        }
    }, [stream, isPiPActive, exitPiP]);

    if (!stream) return null;

    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    const cyclePosition = () => {
        if (isPiPActive) return;
        const currentIndex = positions.indexOf(position);
        const nextIndex = (currentIndex + 1) % positions.length;
        onPositionChange?.(positions[nextIndex]);
    };

    const handlePiPToggle = (e) => {
        e.stopPropagation();
        if (isPiPActive) {
            exitPiP();
        } else {
            enterPiP();
        }
    };

    // If PiP is active, show minimal placeholder
    if (isPiPActive) {
        return (
            <div className={`camera-overlay ${position} ${size} pip-active`} onClick={exitPiP}>
                <div className="pip-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
                    </svg>
                    <span>Camera in PiP</span>
                    <small>Click to return</small>
                </div>
            </div>
        );
    }

    return (
        <div className={`camera-overlay ${position} ${size}`} onClick={cyclePosition}>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video"
            />
            <div className="camera-overlay-border" />

            {/* PiP Button */}
            {isPiPSupported && (
                <button
                    className="pip-btn"
                    onClick={handlePiPToggle}
                    title="Pop out camera to desktop"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
                    </svg>
                </button>
            )}

            <div className="camera-move-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z" />
                </svg>
            </div>
        </div>
    );
}
