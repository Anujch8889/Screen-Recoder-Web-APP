import { useState, useEffect } from 'react';
import './FloatingControls.css';

export function FloatingControls({
    isRecording,
    isPaused,
    duration,
    onPause,
    onResume,
    onStop,
    micEnabled,
    onToggleMic,
    cameraEnabled,
    onToggleCamera
}) {
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Format time as MM:SS or HH:MM:SS
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Dragging logic
    const handleMouseDown = (e) => {
        if (e.target.closest('button')) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x)),
                y: Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y))
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isRecording) return null;

    return (
        <div
            className={`floating-controls ${isDragging ? 'dragging' : ''}`}
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
        >
            {/* Recording indicator */}
            <div className="fc-recording-status">
                <span className={`fc-dot ${isPaused ? 'paused' : 'recording'}`} />
                <span className="fc-timer">{formatTime(duration)}</span>
            </div>

            {/* Control buttons */}
            <div className="fc-buttons">
                {/* Pause / Resume */}
                <button
                    className={`fc-btn ${isPaused ? 'resume' : 'pause'}`}
                    onClick={isPaused ? onResume : onPause}
                    title={isPaused ? 'Resume' : 'Pause'}
                >
                    {isPaused ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    )}
                </button>

                {/* Stop */}
                <button
                    className="fc-btn stop"
                    onClick={onStop}
                    title="Stop Recording"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h12v12H6z" />
                    </svg>
                </button>

                {/* Divider */}
                <div className="fc-divider" />

                {/* Mic Toggle */}
                <button
                    className={`fc-btn mic ${micEnabled ? 'active' : 'muted'}`}
                    onClick={onToggleMic}
                    title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                >
                    {micEnabled ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V20c0 .55.45 1 1 1s1-.45 1-1v-2.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                        </svg>
                    )}
                </button>

                {/* Camera Toggle */}
                <button
                    className={`fc-btn camera ${cameraEnabled ? 'active' : ''}`}
                    onClick={onToggleCamera}
                    title={cameraEnabled ? 'Hide Camera' : 'Show Camera'}
                >
                    {cameraEnabled ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Drag handle indicator */}
            <div className="fc-drag-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
                    <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
            </div>
        </div>
    );
}
