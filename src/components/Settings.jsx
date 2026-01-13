import { useState } from 'react';
import './Settings.css';

export function Settings({
    floatingMode,
    onFloatingModeChange,
    isOpen,
    onClose
}) {
    if (!isOpen) return null;

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h3>⚙️ Settings</h3>
                    <button className="settings-close" onClick={onClose}>×</button>
                </div>

                <div className="settings-content">
                    <div className="settings-section">
                        <h4>📹 Floating Bar Mode</h4>
                        <p className="settings-description">
                            Choose how the camera appears during recording
                        </p>

                        <div className="settings-options">
                            <label className={`settings-option ${floatingMode === 'controls-only' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="floatingMode"
                                    value="controls-only"
                                    checked={floatingMode === 'controls-only'}
                                    onChange={() => onFloatingModeChange('controls-only')}
                                />
                                <div className="option-content">
                                    <span className="option-title">🎮 Controls Only</span>
                                    <span className="option-desc">
                                        Floating bar shows only controls. Camera appears as circular overlay on your screen (will be captured in video).
                                    </span>
                                </div>
                            </label>

                            <label className={`settings-option ${floatingMode === 'controls-with-camera' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="floatingMode"
                                    value="controls-with-camera"
                                    checked={floatingMode === 'controls-with-camera'}
                                    onChange={() => onFloatingModeChange('controls-with-camera')}
                                />
                                <div className="option-content">
                                    <span className="option-title">📷 Controls + Camera</span>
                                    <span className="option-desc">
                                        Floating bar shows both controls and camera preview. No in-page overlay. Best when capturing specific window (not entire screen).
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
