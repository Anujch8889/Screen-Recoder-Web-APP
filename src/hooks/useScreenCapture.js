import { useState, useCallback, useRef } from 'react';

export function useScreenCapture() {
    const [stream, setStream] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState(null);
    const [displaySurface, setDisplaySurface] = useState(null);
    const streamRef = useRef(null);

    const startCapture = useCallback(async (options = {}) => {
        try {
            setError(null);

            const displayMediaOptions = {
                video: {
                    displaySurface: options.displaySurface || 'monitor',
                    width: { ideal: 1920, max: 3840 },
                    height: { ideal: 1080, max: 2160 },
                    frameRate: { ideal: 60, max: 60 }
                },
                audio: options.systemAudio !== false ? {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } : false,
                preferCurrentTab: options.preferCurrentTab || false,
                selfBrowserSurface: 'include',
                systemAudio: 'include',
                surfaceSwitching: 'include',
                monitorTypeSurfaces: 'include'
            };

            const mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

            // Get the display surface type
            const videoTrack = mediaStream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            setDisplaySurface(settings.displaySurface || 'unknown');

            // Handle stream end
            videoTrack.onended = () => {
                stopCapture();
            };

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setIsCapturing(true);

            return mediaStream;
        } catch (err) {
            setError(err.message || 'Failed to capture screen');
            setIsCapturing(false);
            throw err;
        }
    }, []);

    const stopCapture = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
        setIsCapturing(false);
        setDisplaySurface(null);
    }, []);

    return {
        stream,
        isCapturing,
        error,
        displaySurface,
        startCapture,
        stopCapture
    };
}
