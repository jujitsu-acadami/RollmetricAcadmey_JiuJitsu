import { useState, useEffect, useCallback } from 'react';
import { VoiceCueSettings } from '../types';

export function useSpeechSynthesis(settings: VoiceCueSettings) {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const handleVoicesChanged = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        // The list of voices is loaded asynchronously.
        handleVoicesChanged();
        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speak = useCallback((text: string) => {
        if (!settings.enabled || !text || typeof window.speechSynthesis === 'undefined') {
            return;
        }

        // Cancel any ongoing speech to prevent overlap.
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const { style } = settings;
        
        // Find a suitable default voice
        let selectedVoice = voices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Google US English'));

        if (style === 'Neutral Instructor') {
            const maleVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'));
            selectedVoice = maleVoice || selectedVoice;
            utterance.pitch = 1;
            utterance.rate = 1;
        } else if (style === 'Encouraging Coach') {
            const femaleVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'));
            selectedVoice = femaleVoice || selectedVoice;
            utterance.pitch = 1.1;
            utterance.rate = 1.05;
        }
        // 'Quiet Mode' is handled by the `enabled` flag, so no specific case is needed.

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        window.speechSynthesis.speak(utterance);

    }, [settings, voices]);

    const cancel = useCallback(() => {
        if (typeof window.speechSynthesis !== 'undefined') {
            window.speechSynthesis.cancel();
        }
    }, []);

    return { speak, cancel };
}
