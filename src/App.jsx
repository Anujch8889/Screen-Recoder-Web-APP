import { useState, useCallback } from 'react';
import { useScreenCapture } from './hooks/useScreenCapture';
import { useCameraCapture } from './hooks/useCameraCapture';
import { useMicrophoneCapture } from './hooks/useMicrophoneCapture';
import { useMediaRecorder } from './hooks/useMediaRecorder';
import { SourceSelector } from './components/SourceSelector';
import { Preview } from './components/Preview';
import { CameraOverlay } from './components/CameraOverlay';
import { Countdown } from './components/Countdown';
import { RecordingControls } from './components/RecordingControls';
import { RecordingsGallery, saveRecording } from './components/RecordingsGallery';
import { InstallPrompt } from './components/InstallPrompt';
import { DownloadButton } from './components/DownloadButton';
import { FloatingControls } from './components/FloatingControls';
import { Settings } from './components/Settings';
import './App.css';

function App() {
  // State
  const [showCountdown, setShowCountdown] = useState(false);
  const [cameraPosition, setCameraPosition] = useState('bottom-right');
  const [galleryRefresh, setGalleryRefresh] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [floatingMode, setFloatingMode] = useState('controls-only'); // 'controls-only' or 'controls-with-camera'

  // Hooks
  const screen = useScreenCapture();
  const camera = useCameraCapture();
  const mic = useMicrophoneCapture();
  const recorder = useMediaRecorder();

  // Handle source selection
  const handleSelectSource = useCallback(async () => {
    try {
      await screen.startCapture({ systemAudio: true });

      // Start mic if enabled
      if (micEnabled) {
        try {
          await mic.startMicrophone();
        } catch (e) {
          console.warn('Mic access denied:', e);
        }
      }

      // Start camera if enabled
      if (cameraEnabled) {
        try {
          await camera.startCamera();
        } catch (e) {
          console.warn('Camera access denied:', e);
        }
      }
    } catch (err) {
      console.error('Failed to start capture:', err);
    }
  }, [screen, mic, camera, micEnabled, cameraEnabled]);

  // Toggle camera
  const handleToggleCamera = useCallback(async () => {
    if (camera.isActive) {
      camera.stopCamera();
      setCameraEnabled(false);
    } else {
      try {
        await camera.startCamera();
        setCameraEnabled(true);
      } catch (e) {
        console.warn('Camera access denied:', e);
      }
    }
  }, [camera]);

  // Toggle microphone
  const handleToggleMic = useCallback(async () => {
    if (mic.isActive) {
      mic.stopMicrophone();
      setMicEnabled(false);
    } else {
      try {
        await mic.startMicrophone();
        setMicEnabled(true);
      } catch (e) {
        console.warn('Mic access denied:', e);
      }
    }
  }, [mic]);

  // Start recording with countdown
  const handleStartRecording = useCallback(() => {
    if (!screen.isCapturing) return;
    setShowCountdown(true);
  }, [screen.isCapturing]);

  // Called when countdown completes
  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setIsMinimized(true); // Minimize UI during recording
    recorder.startRecording(screen.stream, camera.stream, mic.stream);
  }, [recorder, screen.stream, camera.stream, mic.stream]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    recorder.stopRecording();
    setIsMinimized(false); // Show UI after stopping
  }, [recorder]);

  // Save recording
  const handleSaveRecording = useCallback(async () => {
    if (recorder.recordedBlob) {
      try {
        await saveRecording(recorder.recordedBlob, `Recording`);
        setGalleryRefresh(r => r + 1);
      } catch (e) {
        console.error('Failed to save:', e);
      }
    }
    recorder.downloadRecording('screen-recording');
  }, [recorder]);

  // Discard recording
  const handleDiscardRecording = useCallback(() => {
    recorder.resetRecording();
    screen.stopCapture();
    camera.stopCamera();
    mic.stopMicrophone();
    setCameraEnabled(false);
    setMicEnabled(true);
  }, [recorder, screen, camera, mic]);

  return (
    <div className="app-root" style={{ paddingTop: 'var(--titlebar-height)' }}>
      <div className={`app ${isMinimized ? 'minimized' : ''}`}>
        <header className="app-header">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
            <h1>Screen Recorder</h1>
          </div>
          <div className="header-actions">
            <button className="settings-btn" onClick={() => setShowSettings(true)} title="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
          </div>
          <p className="tagline">Record your screen, camera & microphone</p>
        </header>

        <main className="app-main">
          <div className="recorder-section">
            <Preview
              stream={screen.stream}
              isRecording={recorder.isRecording}
            />

            <SourceSelector
              onSelectSource={handleSelectSource}
              cameraEnabled={camera.isActive}
              micEnabled={mic.isActive}
              onToggleCamera={handleToggleCamera}
              onToggleMic={handleToggleMic}
              cameraDevices={camera.devices}
              micDevices={mic.devices}
              selectedCamera={camera.selectedDevice}
              selectedMic={mic.selectedDevice}
              onSelectCamera={camera.switchCamera}
              onSelectMic={mic.switchMicrophone}
              audioLevel={mic.audioLevel}
              disabled={recorder.isRecording}
            />

            <RecordingControls
              isRecording={recorder.isRecording}
              isPaused={recorder.isPaused}
              duration={recorder.duration}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onPause={recorder.pauseRecording}
              onResume={recorder.resumeRecording}
              disabled={!screen.isCapturing}
              hasRecording={!!recorder.recordedBlob}
              onDownload={handleSaveRecording}
              onDiscard={handleDiscardRecording}
            />
          </div>

          <aside className="sidebar">
            <DownloadButton />

            <RecordingsGallery refreshTrigger={galleryRefresh} />

            <div className="info-card">
              <h3>Tips</h3>
              <ul>
                <li>Click "Screen" to select what to record</li>
                <li>Toggle camera for PIP overlay</li>
                <li>Enable microphone for narration</li>
                <li>Recordings save to your browser</li>
              </ul>
            </div>
          </aside>
        </main>

        {/* Camera Overlay - Show based on floatingMode setting */}
        {camera.isActive && camera.stream && floatingMode === 'controls-only' && (
          <CameraOverlay
            stream={camera.stream}
            position={cameraPosition}
            size="medium"
            onPositionChange={setCameraPosition}
            isRecording={recorder.isRecording}
            duration={recorder.duration}
            circleMode={true}
          />
        )}

        {/* Countdown Overlay */}
        {showCountdown && (
          <Countdown
            seconds={3}
            onComplete={handleCountdownComplete}
          />
        )}

        {/* Settings Panel */}
        <Settings
          floatingMode={floatingMode}
          onFloatingModeChange={setFloatingMode}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* PWA Install Prompt */}
        <InstallPrompt />

        {/* Floating Controls during recording */}
        <FloatingControls
          isRecording={recorder.isRecording}
          isPaused={recorder.isPaused}
          duration={recorder.duration}
          onPause={recorder.pauseRecording}
          onResume={recorder.resumeRecording}
          onStop={handleStopRecording}
          micEnabled={mic.isActive}
          onToggleMic={handleToggleMic}
          cameraEnabled={camera.isActive}
          onToggleCamera={handleToggleCamera}
          cameraStream={camera.stream}
          floatingMode={floatingMode}
        />

        <footer className="app-footer">
          <p>Works on Windows, macOS & Web • No installation required</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
