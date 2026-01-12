import { useState, useCallback, useEffect, useRef } from 'react';

export function useMicrophoneCapture() {
    const [stream, setStream] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const streamRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

    // Enumerate microphone devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const audioDevices = allDevices.filter(d => d.kind === 'audioinput');
                setDevices(audioDevices);
                if (audioDevices.length > 0 && !selectedDevice) {
                    setSelectedDevice(audioDevices[0].deviceId);
                }
            } catch (err) {
                console.error('Failed to enumerate devices:', err);
            }
        };

        getDevices();
        navigator.mediaDevices.addEventListener('devicechange', getDevices);
        return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    }, []);

    const startMicrophone = useCallback(async (deviceId = null) => {
        try {
            setError(null);

            const constraints = {
                audio: {
                    deviceId: deviceId || selectedDevice ? { exact: deviceId || selectedDevice } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Set up audio level monitoring
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(mediaStream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = { audioContext, analyser };

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average / 255);
                animationRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();

            streamRef.current = mediaStream;
            setStream(mediaStream);
            setIsActive(true);

            return mediaStream;
        } catch (err) {
            setError(err.message || 'Failed to access microphone');
            setIsActive(false);
            throw err;
        }
    }, [selectedDevice]);

    const stopMicrophone = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (analyserRef.current) {
            analyserRef.current.audioContext.close();
            analyserRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
        setIsActive(false);
        setAudioLevel(0);
    }, []);

    const switchMicrophone = useCallback(async (deviceId) => {
        setSelectedDevice(deviceId);
        if (isActive) {
            stopMicrophone();
            await startMicrophone(deviceId);
        }
    }, [isActive, stopMicrophone, startMicrophone]);

    return {
        stream,
        isActive,
        error,
        devices,
        selectedDevice,
        audioLevel,
        startMicrophone,
        stopMicrophone,
        switchMicrophone
    };
}
