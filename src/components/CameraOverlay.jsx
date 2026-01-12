import { useRef, useEffect } from 'react';
import './CameraOverlay.css';

export function CameraOverlay({ stream, position = 'bottom-right', size = 'medium', onPositionChange }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!stream) return null;

    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    const cyclePosition = () => {
        const currentIndex = positions.indexOf(position);
        const nextIndex = (currentIndex + 1) % positions.length;
        onPositionChange?.(positions[nextIndex]);
    };

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
            <div className="camera-move-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z" />
                </svg>
            </div>
        </div>
    );
}
