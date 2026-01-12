import { useRef, useEffect } from 'react';
import './Preview.css';

export function Preview({ stream, isRecording }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={`preview-container ${isRecording ? 'recording' : ''}`}>
            {stream ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="preview-video"
                    />
                    {isRecording && (
                        <div className="recording-indicator">
                            <span className="recording-dot" />
                            <span>REC</span>
                        </div>
                    )}
                </>
            ) : (
                <div className="preview-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.41 15.95L12 12.36l2.59 3.59L17 13.32l4 5.68H3l6.41-3.05z" />
                    </svg>
                    <p>Select a screen to preview</p>
                </div>
            )}
        </div>
    );
}
