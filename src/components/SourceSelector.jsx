import './SourceSelector.css';

export function SourceSelector({
    onSelectSource,
    cameraEnabled,
    micEnabled,
    onToggleCamera,
    onToggleMic,
    cameraDevices,
    micDevices,
    selectedCamera,
    selectedMic,
    onSelectCamera,
    onSelectMic,
    audioLevel,
    disabled
}) {
    return (
        <div className="source-selector">
            <div className="source-buttons">
                <button
                    className="source-btn primary"
                    onClick={() => onSelectSource('screen')}
                    disabled={disabled}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z" />
                    </svg>
                    <span>Screen</span>
                </button>
            </div>

            <div className="media-toggles">
                <div className="toggle-group">
                    <button
                        className={`toggle-btn ${cameraEnabled ? 'active' : ''}`}
                        onClick={onToggleCamera}
                        disabled={disabled}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            {cameraEnabled ? (
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            ) : (
                                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                            )}
                        </svg>
                    </button>
                    {cameraDevices.length > 1 && (
                        <select
                            className="device-select"
                            value={selectedCamera || ''}
                            onChange={(e) => onSelectCamera(e.target.value)}
                            disabled={disabled}
                        >
                            {cameraDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="toggle-group">
                    <button
                        className={`toggle-btn ${micEnabled ? 'active' : ''}`}
                        onClick={onToggleMic}
                        disabled={disabled}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            {micEnabled ? (
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                            ) : (
                                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V20c0 .55.45 1 1 1s1-.45 1-1v-2.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                            )}
                        </svg>
                    </button>
                    {micEnabled && (
                        <div className="audio-meter">
                            <div
                                className="audio-level"
                                style={{ width: `${audioLevel * 100}%` }}
                            />
                        </div>
                    )}
                    {micDevices.length > 1 && (
                        <select
                            className="device-select"
                            value={selectedMic || ''}
                            onChange={(e) => onSelectMic(e.target.value)}
                            disabled={disabled}
                        >
                            {micDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Mic ${device.deviceId.slice(0, 5)}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
        </div>
    );
}
