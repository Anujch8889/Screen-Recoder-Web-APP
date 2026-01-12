import { useState, useEffect } from 'react';
import './RecordingsGallery.css';

const DB_NAME = 'ScreenRecorderDB';
const STORE_NAME = 'recordings';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

export async function saveRecording(blob, name) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const recording = {
            name: name || `Recording ${new Date().toLocaleString()}`,
            blob,
            date: new Date().toISOString(),
            size: blob.size
        };

        const request = store.add(recording);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllRecordings() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteRecording(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export function RecordingsGallery({ refreshTrigger }) {
    const [recordings, setRecordings] = useState([]);
    const [playingId, setPlayingId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadRecordings();
    }, [refreshTrigger]);

    const loadRecordings = async () => {
        try {
            const data = await getAllRecordings();
            setRecordings(data.reverse());
        } catch (err) {
            console.error('Failed to load recordings:', err);
        }
    };

    const handleDownload = (recording) => {
        const url = URL.createObjectURL(recording.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${recording.name}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDelete = async (id) => {
        try {
            await deleteRecording(id);
            loadRecordings();
        } catch (err) {
            console.error('Failed to delete recording:', err);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (recordings.length === 0) return null;

    return (
        <div className="gallery-container">
            <button className="gallery-toggle" onClick={() => setIsOpen(!isOpen)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                </svg>
                <span>Recordings ({recordings.length})</span>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
            </button>

            {isOpen && (
                <div className="gallery-list">
                    {recordings.map((recording) => (
                        <div key={recording.id} className="recording-item">
                            <div className="recording-info">
                                <span className="recording-name">{recording.name}</span>
                                <span className="recording-meta">
                                    {formatDate(recording.date)} • {formatSize(recording.size)}
                                </span>
                            </div>

                            <div className="recording-actions">
                                <button
                                    className="action-btn play"
                                    onClick={() => setPlayingId(playingId === recording.id ? null : recording.id)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        {playingId === recording.id ? (
                                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                        ) : (
                                            <path d="M8 5v14l11-7z" />
                                        )}
                                    </svg>
                                </button>

                                <button
                                    className="action-btn download"
                                    onClick={() => handleDownload(recording)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                    </svg>
                                </button>

                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDelete(recording.id)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                    </svg>
                                </button>
                            </div>

                            {playingId === recording.id && (
                                <video
                                    className="recording-player"
                                    src={URL.createObjectURL(recording.blob)}
                                    controls
                                    autoPlay
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
