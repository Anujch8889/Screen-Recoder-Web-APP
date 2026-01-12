import './RecordingControls.css';

export function RecordingControls({
    isRecording,
    isPaused,
    duration,
    onStart,
    onStop,
    onPause,
    onResume,
    disabled,
    hasRecording,
    onDownload,
    onDiscard
}) {
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="recording-controls">
            {!isRecording && !hasRecording && (
                <button
                    className="control-btn record"
                    onClick={onStart}
                    disabled={disabled}
                >
                    <div className="record-icon" />
                    <span>Start Recording</span>
                </button>
            )}

            {isRecording && (
                <>
                    <div className="timer">
                        <span className="timer-dot" />
                        {formatTime(duration)}
                    </div>

                    <div className="control-group">
                        {isPaused ? (
                            <button className="control-btn resume" onClick={onResume}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                <span>Resume</span>
                            </button>
                        ) : (
                            <button className="control-btn pause" onClick={onPause}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                                <span>Pause</span>
                            </button>
                        )}

                        <button className="control-btn stop" onClick={onStop}>
                            <div className="stop-icon" />
                            <span>Stop</span>
                        </button>
                    </div>
                </>
            )}

            {hasRecording && !isRecording && (
                <div className="post-recording">
                    <div className="recording-complete">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        <span>Recording Complete!</span>
                    </div>

                    <div className="control-group">
                        <button className="control-btn download" onClick={onDownload}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                            </svg>
                            <span>Download</span>
                        </button>

                        <button className="control-btn discard" onClick={onDiscard}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                            <span>Discard</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
