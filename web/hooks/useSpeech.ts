'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Lang } from '../lib/i18n';

// BCP-47 locale mappings for Indian languages
const LANG_LOCALE_MAP: Record<Lang, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
};

// Web Speech API SpeechRecognition interface declaration
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: IWindowSpeechRecognition, ev: { error: string }) => void) | null;
  onresult: ((this: IWindowSpeechRecognition, ev: {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: {
        [index: number]: { transcript: string };
        isFinal: boolean;
      };
    };
  }) => void) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => IWindowSpeechRecognition;
  webkitSpeechRecognition?: new () => IWindowSpeechRecognition;
}

export function useSpeechRecognition({
  lang,
  onTranscript,
}: {
  lang: Lang;
  onTranscript?: (text: string) => void;
}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as WindowWithSpeech;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as WindowWithSpeech;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setIsSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = LANG_LOCALE_MAP[lang] || 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (ev) => {
        setError(ev.error);
        setIsListening(false);
      };

      rec.onresult = (ev) => {
        let finalTranscript = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const item = ev.results[i];
          if (item && item[0]) {
            finalTranscript += item[0].transcript;
          }
        }
        if (finalTranscript && onTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setIsListening(false);
    }
  }, [lang, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
  };
}

export function useSpeechSynthesis({ lang }: { lang: Lang }) {
  const [isSupported, setIsSupported] = useState(false);
  const [hasVoice, setHasVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const checkVoiceAvailability = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      setHasVoice(false);
      return;
    }

    setIsSupported(true);
    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = lang.toLowerCase();
    const targetLocale = (LANG_LOCALE_MAP[lang] || 'en-IN').toLowerCase();

    const matchingVoice = voices.find((v) => {
      const vLang = v.lang.toLowerCase();
      return (
        vLang.startsWith(targetPrefix) ||
        vLang === targetLocale ||
        vLang.replace('_', '-').startsWith(targetPrefix)
      );
    });

    setHasVoice(Boolean(matchingVoice));
  }, [lang]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      setHasVoice(false);
      return;
    }

    checkVoiceAvailability();

    window.speechSynthesis.addEventListener('voiceschanged', checkVoiceAvailability);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', checkVoiceAvailability);
    };
  }, [checkVoiceAvailability]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_LOCALE_MAP[lang] || 'en-IN';

      const voices = window.speechSynthesis.getVoices();
      const targetPrefix = lang.toLowerCase();
      const targetLocale = (LANG_LOCALE_MAP[lang] || 'en-IN').toLowerCase();

      const matchedVoice = voices.find((v) => {
        const vLang = v.lang.toLowerCase();
        return (
          vLang === targetLocale ||
          vLang.startsWith(targetPrefix) ||
          vLang.replace('_', '-').startsWith(targetPrefix)
        );
      });

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [lang]
  );

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isSupported: isSupported && hasVoice,
    isSpeaking,
    speak,
    stop,
  };
}
