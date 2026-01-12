import { useState, useEffect } from 'react';
import './DownloadButton.css';

export function DownloadButton() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showButton, setShowButton] = useState(true);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
        } else {
            // Fallback - show instructions
            alert('To install:\n\n1. Click the menu (⋮) in your browser\n2. Select "Install Screen Recorder"\n3. Click "Install"\n\nThe app will be added to your desktop!');
        }
    };

    if (isInstalled) {
        return (
            <div className="download-section installed">
                <div className="installed-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>App Installed</span>
                </div>
            </div>
        );
    }

    return (
        <div className="download-section">
            <div className="download-header">
                <h3>📥 Download App</h3>
                <p>Install for Windows, Mac & Linux</p>
            </div>

            <button className="download-btn" onClick={handleInstall}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                <span>Install App</span>
            </button>

            <div className="download-info">
                <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>No download required</span>
                </div>
                <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>Works offline</span>
                </div>
                <div className="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>Desktop icon</span>
                </div>
            </div>
        </div>
    );
}
