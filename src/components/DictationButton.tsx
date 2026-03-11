"use client";

import { useState, useEffect, useRef } from "react";
import {
  isSpeechSupported,
  createRecognition,
  SpeechRecognitionInstance,
  SpeechRecognitionResultEvent,
  SpeechRecognitionErrorEvent,
} from "@/lib/speech";

interface DictationButtonProps {
  onTranscriptReady: (transcript: string) => void;
  disabled?: boolean;
}

export default function DictationButton({
  onTranscriptReady,
  disabled,
}: DictationButtonProps) {
  // null = hydrating (avoid SSR mismatch), true/false = resolved
  const [supported, setSupported] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(isSpeechSupported());
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = () => {
    const recognition = createRecognition();
    if (!recognition) return;

    setMicError(null);
    transcriptRef.current = "";
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      transcriptRef.current = text;
    };

    recognition.onend = () => {
      stopTimer();
      setIsRecording(false);
      recognitionRef.current = null;
      const final = transcriptRef.current.trim();
      if (final) {
        onTranscriptReady(final);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      stopTimer();
      setIsRecording(false);
      recognitionRef.current = null;
      if (event.error === "not-allowed") {
        setMicError(
          "Microphone access was denied. Click the 🔒 icon in your browser's address bar and allow microphone access, then try again."
        );
      } else if (event.error === "no-speech") {
        setMicError("No speech was detected. Please try again.");
      } else {
        setMicError(`Microphone error: ${event.error}. Please try again.`);
      }
    };

    recognition.start();
    setIsRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    stopTimer();
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Suppress during SSR / hydration to avoid mismatch
  if (supported === null) return null;

  if (!supported) {
    return (
      <p className="font-mono text-[10px] text-cerulean/60 italic uppercase tracking-[0.18em]">
        Dictation available in Chrome — paste your notes to get started.
      </p>
    );
  }

  if (isRecording) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={stopRecording}
          type="button"
          aria-label={`Stop recording — ${formatTime(elapsed)}`}
          className="relative h-14 w-14 rounded-full bg-gold flex items-center justify-center flex-shrink-0 hover:bg-gold-dark transition-colors"
        >
          {/* Pulsing ring */}
          <span
            className="absolute inset-0 rounded-full bg-gold animate-ping opacity-40"
            aria-hidden="true"
          />
          {/* Mic icon */}
          <svg
            className="w-6 h-6 text-midnight relative z-10"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>
        <p className="font-mono text-[10px] text-gold uppercase tracking-[0.18em]">
          {formatTime(elapsed)} · tap to stop
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={startRecording}
        disabled={disabled}
        type="button"
        aria-label="Start recording"
        className="h-14 w-14 rounded-full bg-midnight flex items-center justify-center flex-shrink-0 hover:bg-midnight-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {/* Gold mic icon */}
        <svg
          className="w-6 h-6 text-gold"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
        <span className="sr-only">Start recording</span>
      </button>
      {micError && (
        <p role="alert" className="font-jost text-sm text-error max-w-[200px] leading-[1.5]">
          {micError}
        </p>
      )}
    </div>
  );
}
