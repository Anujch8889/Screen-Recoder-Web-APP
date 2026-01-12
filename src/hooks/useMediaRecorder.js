import { useState, useCallback, useRef } from 'react';

export function useMediaRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(null);
    const [recordedBlob, setRecordedBlob] = useState(null);

    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    const getSupportedMimeType = () => {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/webm';
    };

    const mergeStreams = (screenStream, cameraStream, micStream) => {
        const tracks = [];

        // Add video track from screen
        if (screenStream) {
            const videoTrack = screenStream.getVideoTracks()[0];
            if (videoTrack) tracks.push(videoTrack);
        }

        // Create audio context to mix audio sources
        const audioTracks = [];

        // Add screen audio if available
        if (screenStream) {
            const screenAudio = screenStream.getAudioTracks()[0];
            if (screenAudio) audioTracks.push(screenAudio);
        }

        // Add microphone audio
        if (micStream) {
            const micAudio = micStream.getAudioTracks()[0];
            if (micAudio) audioTracks.push(micAudio);
        }

        // Add all audio tracks
        audioTracks.forEach(track => tracks.push(track));

        return new MediaStream(tracks);
    };

    const startRecording = useCallback((screenStream, cameraStream = null, micStream = null) => {
        try {
            setError(null);
            chunksRef.current = [];

            const combinedStream = mergeStreams(screenStream, cameraStream, micStream);
            const mimeType = getSupportedMimeType();

            const recorder = new MediaRecorder(combinedStream, {
                mimeType,
                videoBitsPerSecond: 8000000 // 8 Mbps for high quality
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setRecordedBlob(blob);
                chunksRef.current = [];
            };

            recorder.onerror = (e) => {
                setError(e.error?.message || 'Recording failed');
                setIsRecording(false);
            };

            recorderRef.current = recorder;
            recorder.start(1000); // Collect data every second

            // Start duration timer
            startTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

            setIsRecording(true);
            setIsPaused(false);
            setRecordedBlob(null);

        } catch (err) {
            setError(err.message || 'Failed to start recording');
            throw err;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setIsRecording(false);
        setIsPaused(false);
    }, []);

    const pauseRecording = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.pause();
            clearInterval(timerRef.current);
            setIsPaused(true);
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state === 'paused') {
            recorderRef.current.resume();
            const pausedDuration = duration;
            startTimeRef.current = Date.now() - (pausedDuration * 1000);
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
            setIsPaused(false);
        }
    }, [duration]);

    const downloadRecording = useCallback((filename = 'recording') => {
        if (!recordedBlob) return;

        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [recordedBlob]);

    const resetRecording = useCallback(() => {
        setRecordedBlob(null);
        setDuration(0);
        setError(null);
    }, []);

    return {
        isRecording,
        isPaused,
        duration,
        error,
        recordedBlob,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        downloadRecording,
        resetRecording
    };
}
