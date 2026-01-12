import { useState, useCallback, useEffect, useRef } from 'react';

export function useCameraCapture() {
    const [stream, setStream] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const streamRef = useRef(null);

    // Enumerate camera devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0 && !selectedDevice) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error('Failed to enumerate devices:', err);
            }
        };

        getDevices();
        navigator.mediaDevices.addEventListener('devicechange', getDevices);
        return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    }, []);

    const startCamera = useCallback(async (deviceId = null) => {
        try {
            setError(null);

            const constraints = {
                video: {
                    deviceId: deviceId || selectedDevice ? { exact: deviceId || selectedDevice } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setIsActive(true);

            return mediaStream;
        } catch (err) {
            setError(err.message || 'Failed to access camera');
            setIsActive(false);
            throw err;
        }
    }, [selectedDevice]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
        setIsActive(false);
    }, []);

    const switchCamera = useCallback(async (deviceId) => {
        setSelectedDevice(deviceId);
        if (isActive) {
            stopCamera();
            await startCamera(deviceId);
        }
    }, [isActive, stopCamera, startCamera]);

    return {
        stream,
        isActive,
        error,
        devices,
        selectedDevice,
        startCamera,
        stopCamera,
        switchCamera
    };
}
