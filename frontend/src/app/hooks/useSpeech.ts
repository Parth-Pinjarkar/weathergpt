/**
 * WeatherGPT - useSpeech Hook
 * Manages Web Speech API voice synthesis & recognition with fallback safety.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SupportedLanguage } from '../i18n';

// Browser SpeechRecognition Type Declarations
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: {
      [index: number]: {
        [index: number]: {
          transcript: string;
        };
      };
    };
  }) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

export function useSpeech(currentLanguage: SupportedLanguage = 'en') {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [hasRecognitionSupport] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const windowWithSpeech = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      return !!(windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition);
    }
    return false;
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const getLanguageCode = useCallback((lang: SupportedLanguage): string => {
    switch (lang) {
      case 'hi':
        return 'hi-IN';
      case 'mr':
        return 'mr-IN';
      case 'ta':
        return 'ta-IN';
      case 'bn':
        return 'bn-IN';
      case 'gu':
        return 'gu-IN';
      case 'kn':
        return 'kn-IN';
      case 'pa':
        return 'pa-IN';
      case 'te':
        return 'te-IN';
      case 'ml':
        return 'ml-IN';
      default:
        return 'en-IN';
    }
  }, []);

  const startListening = useCallback(
    (onResult: (transcript: string) => void, onError?: (error: string) => void) => {
      if (typeof window === 'undefined') return;

      const windowWithSpeech = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };

      const SpeechRecognitionClass =
        windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        if (onError) onError('Speech recognition is not supported in this browser.');
        return;
      }

      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognitionClass();
        recognition.lang = getLanguageCode(currentLanguage);
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            onResult(transcript);
          }
        };

        recognition.onerror = (event) => {
          setIsListening(false);
          if (onError) onError(event.error || 'Speech recognition error');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: unknown) {
        setIsListening(false);
        const msg = err instanceof Error ? err.message : 'Failed to start microphone';
        if (onError) onError(msg);
      }
    },
    [currentLanguage, getLanguageCode]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, langOverride?: SupportedLanguage) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      try {
        window.speechSynthesis.cancel();

        if (!text) return;

        const langToUse = langOverride || currentLanguage;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getLanguageCode(langToUse);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
      }
    },
    [currentLanguage, getLanguageCode]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    hasRecognitionSupport,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
