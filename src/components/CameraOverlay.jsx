import { useRef, useEffect, useState, useCallback } from 'react';
import './CameraOverlay.css';

// Format time utility (seconds -> MM:SS)
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function CameraOverlay({
    stream,
    position = 'bottom-right',
    size = 'medium',
    onPositionChange,
    isRecording = false,
    duration = 0,
    circleMode = false
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const canvasStreamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [isPiPActive, setIsPiPActive] = useState(false);
    const [isPiPSupported, setIsPiPSupported] = useState(false);

    // Check PiP support
    useEffect(() => {
        setIsPiPSupported('pictureInPictureEnabled' in document && document.pictureInPictureEnabled);
    }, []);

    // Canvas Compositing Loop
    const drawCanvas = useCallback(() => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;

        // Wait for video to be ready
        video.onloadedmetadata = () => {
            video.play();
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');

            if (!canvas || !ctx) return;

            // Set canvas size to match video aspect ratio (usually 4:3 or 16:9)
            // We'll use a fixed internal resolution for sharpness
            const width = 640;
            const height = 480;
            canvas.width = width;
            canvas.height = height;

            const render = () => {
                // 1. Draw Camera Frame
                ctx.save();
                ctx.translate(width, 0);
                ctx.scale(-1, 1); // Mirror effect
                ctx.drawImage(video, 0, 0, width, height);
                ctx.restore();

                // 2. Draw Timer & Status IF recording
                if (isRecording) {
                    // Semi-transparent pill background
                    const pillWidth = 140;
                    const pillHeight = 40;
                    const x = width / 2 - pillWidth / 2;
                    const y = height - 60;
                    const radius = 20;

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.beginPath();
                    ctx.roundRect(x, y, pillWidth, pillHeight, radius);
                    ctx.fill();

                    // Red Dot (Blinking)
                    const now = Date.now();
                    if (Math.floor(now / 500) % 2 === 0) {
                        ctx.fillStyle = '#ff4444';
                        ctx.beginPath();
                        ctx.arc(x + 25, y + pillHeight / 2, 6, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = '#cc0000'; // Dimmer red
                        ctx.beginPath();
                        ctx.arc(x + 25, y + pillHeight / 2, 6, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Timer Text
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 24px monospace';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(formatTime(duration), x + 45, y + pillHeight / 2 + 2);
                }

                if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                    animationFrameRef.current = requestAnimationFrame(render);
                }
            };
            render();
        };

        return () => {
            video.pause();
            video.srcObject = null;
        }
    }, [stream, isRecording, duration]);

    // Initialize Canvas Stream
    useEffect(() => {
        if (!stream || !canvasRef.current) return;

        // Start drawing loop logic (simplified for React: we need the latest duration)
        // Actually, requestAnimationFrame loop needs access to LATEST values.
        // We can't restart the loop on every second tick, that's inefficient.
        // Better: Store refs to current state for the loop to read.
    }, [stream]);

    // Correct approach using Refs for animation loop values
    const recordingRef = useRef(isRecording);
    const durationRef = useRef(duration);

    useEffect(() => {
        recordingRef.current = isRecording;
        durationRef.current = duration;
    }, [isRecording, duration]);

    useEffect(() => {
        if (!stream) return;

        const videoSource = document.createElement('video');
        videoSource.srcObject = stream;
        videoSource.muted = true;
        videoSource.playsInline = true;

        let active = true;

        videoSource.onloadedmetadata = () => {
            videoSource.play().catch(e => console.log('Hidden video play error:', e));

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d', { alpha: false }); // Optimize

            if (!canvas || !ctx) return;

            // Set fixed resolution
            canvas.width = 640;
            canvas.height = 480;

            const render = () => {
                if (!active) return;

                // 1. Draw Video
                ctx.save();
                ctx.translate(640, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(videoSource, 0, 0, 640, 480);
                ctx.restore();

                // 2. Draw Overlay
                if (recordingRef.current) {
                    const pillW = 120;
                    const pillH = 36;
                    const x = (640 - pillW) / 2;
                    const y = 480 - 50;

                    // Background
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                    ctx.beginPath();
                    ctx.roundRect(x, y, pillW, pillH, 18);
                    ctx.fill();

                    // Border
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Dot
                    const now = Date.now();
                    const isBlink = Math.floor(now / 500) % 2 === 0;
                    ctx.fillStyle = isBlink ? '#ef4444' : '#991b1b';
                    ctx.beginPath();
                    ctx.arc(x + 20, y + pillH / 2, 5, 0, Math.PI * 2);
                    ctx.fill();

                    // Text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 18px "Inter", monospace';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(formatTime(durationRef.current), x + 35, y + pillH / 2 + 1);
                }

                animationFrameRef.current = requestAnimationFrame(render);
            };
            render();

            // Capture stream from canvas for the MAIN video element to play
            // This is the magic trick: The visible <video> plays the CANVAS stream, not the raw camera stream.
            if (canvas.captureStream) {
                const canvasStream = canvas.captureStream(30);
                canvasStreamRef.current = canvasStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = canvasStream;
                }
            }
        };

        return () => {
            active = false;
            videoSource.pause();
            videoSource.srcObject = null;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [stream]); // Only re-run if stream source changes

    // Auto-enter PiP
    useEffect(() => {
        if (isRecording && isPiPSupported && videoRef.current && !isPiPActive) {
            // Small delay to ensure stream is ready
            setTimeout(() => enterPiP(), 1000);
        }
    }, [isRecording, isPiPSupported]);

    const enterPiP = useCallback(async () => {
        if (!videoRef.current || !isPiPSupported) return;
        try {
            if (document.pictureInPictureElement !== videoRef.current) {
                await videoRef.current.requestPictureInPicture();
                setIsPiPActive(true);
            }
        } catch (error) {
            console.log('PiP failed:', error);
        }
    }, [isPiPSupported]);

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

    // Listen to PiP events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onEnter = () => setIsPiPActive(true);
        const onLeave = () => setIsPiPActive(false);

        video.addEventListener('enterpictureinpicture', onEnter);
        video.addEventListener('leavepictureinpicture', onLeave);

        return () => {
            video.removeEventListener('enterpictureinpicture', onEnter);
            video.removeEventListener('leavepictureinpicture', onLeave);
        };
    }, []);

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

    if (isPiPActive) {
        return (
            <>
                {/* Hidden canvas for processing */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Hidden video that maintains the PiP session */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ position: 'fixed', top: '-9999px', opacity: 0, pointerEvents: 'none' }}
                />

                <div className={`camera-overlay ${position} ${size} pip-active`} onClick={exitPiP}>
                    <div className="pip-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
                        </svg>
                        <span>Timer in Camera</span>
                        <div className="pip-timer">{formatTime(duration)}</div>
                        <small>Click to return</small>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className={`camera-overlay ${position} ${size}`} onClick={cyclePosition}>
            {/* Hidden Canvas */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Video displaying the CANVAS stream, so it looks identical to subsequent PiP */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-video"
            // No srcObject here, it's set via ref in useEffect
            />

            <div className="camera-overlay-border" />

            {/* PiP Button */}
            {isPiPSupported && (
                <button
                    className="pip-btn"
                    onClick={handlePiPToggle}
                    title="Pop out camera + timer"
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
