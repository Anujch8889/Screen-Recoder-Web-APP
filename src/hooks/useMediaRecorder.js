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
    const animationFrameRef = useRef(null);
    const canvasRef = useRef(null);
    const screenVideoRef = useRef(null);
    const cameraVideoRef = useRef(null);

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

    // Create composited stream with camera overlay burned in
    const createCompositedStream = (screenStream, cameraStream) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvasRef.current = canvas;

        // Create video elements for streams
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = screenStream;
        screenVideo.muted = true;
        screenVideo.play();
        screenVideoRef.current = screenVideo;

        let cameraVideo = null;
        if (cameraStream) {
            cameraVideo = document.createElement('video');
            cameraVideo.srcObject = cameraStream;
            cameraVideo.muted = true;
            cameraVideo.play();
            cameraVideoRef.current = cameraVideo;
        }

        // Wait for screen video to be ready
        return new Promise((resolve) => {
            screenVideo.onloadedmetadata = () => {
                // Set canvas size to match screen capture
                canvas.width = screenVideo.videoWidth || 1920;
                canvas.height = screenVideo.videoHeight || 1080;

                // Start the draw loop
                const drawFrame = () => {
                    if (!canvasRef.current) return;

                    // Draw screen capture (full canvas)
                    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

                    // Draw camera overlay (circular, bottom-right)
                    if (cameraVideo && cameraVideo.readyState >= 2) {
                        const radius = Math.min(canvas.width, canvas.height) * 0.12; // 12% of smallest dimension
                        const padding = 30;
                        const x = canvas.width - radius - padding;
                        const y = canvas.height - radius - padding;

                        // Draw circular clip
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();

                        // Draw camera (mirrored)
                        ctx.translate(x + radius, y - radius);
                        ctx.scale(-1, 1);
                        ctx.drawImage(cameraVideo, 0, 0, radius * 2, radius * 2);
                        ctx.restore();

                        // Draw border around camera
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }

                    animationFrameRef.current = requestAnimationFrame(drawFrame);
                };

                drawFrame();

                // Capture stream from canvas (30 FPS)
                const canvasStream = canvas.captureStream(30);
                resolve(canvasStream);
            };
        });
    };

    const mergeAudioTracks = (screenStream, micStream) => {
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

        return audioTracks;
    };

    const startRecording = useCallback(async (screenStream, cameraStream = null, micStream = null) => {
        try {
            setError(null);
            chunksRef.current = [];

            // Create composited video stream (screen + camera overlay)
            const compositedStream = await createCompositedStream(screenStream, cameraStream);

            // Merge audio tracks
            const audioTracks = mergeAudioTracks(screenStream, micStream);

            // Combine video and audio
            const tracks = [...compositedStream.getVideoTracks(), ...audioTracks];
            const finalStream = new MediaStream(tracks);

            const mimeType = getSupportedMimeType();

            const recorder = new MediaRecorder(finalStream, {
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

                // Cleanup
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                canvasRef.current = null;
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

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
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
