import { useState, useEffect, useRef, useCallback } from 'react';
import './Countdown.css';

export function Countdown({ seconds = 3, onComplete }) {
    const [count, setCount] = useState(seconds);
    const onCompleteRef = useRef(onComplete);
    const hasCompletedRef = useRef(false);

    // Keep callback ref updated
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Play beep sound
    const playBeep = useCallback((isLast) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = isLast ? 880 : 440;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);

            // Close audio context after sound plays
            setTimeout(() => audioContext.close(), 300);
        } catch (e) {
            // Audio might not be available
            console.log('Audio not available');
        }
    }, []);

    // Countdown timer
    useEffect(() => {
        // Play beep for current number
        playBeep(count === 1);

        // If count reaches 0, call onComplete
        if (count === 0) {
            if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                // Small delay to ensure UI updates
                setTimeout(() => {
                    onCompleteRef.current?.();
                }, 100);
            }
            return;
        }

        // Set timer for next count
        const timer = setTimeout(() => {
            setCount(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count, playBeep]);

    // Don't render when count is 0
    if (count === 0) return null;

    return (
        <div className="countdown-overlay">
            <div className="countdown-circle">
                <span className="countdown-number">{count}</span>
            </div>
        </div>
    );
}
