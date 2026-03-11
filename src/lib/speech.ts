// ── Minimal type declarations for the Web Speech API ──────────────────────────
// SpeechRecognition is not yet in TypeScript's lib.dom.d.ts as a global constructor,
// so we declare what we need here and extend Window accordingly.

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechRecognitionResultEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList; // SpeechRecognitionResultList IS in lib.dom.d.ts
}

export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the browser supports the Web Speech API.
 * Must be called client-side only (after hydration).
 */
export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Creates and configures a SpeechRecognition instance.
 * Returns null if the API is not available.
 * Audio is processed entirely on-device by the browser — nothing is sent to Candela servers.
 */
export function createRecognition(): SpeechRecognitionInstance | null {
  if (!isSpeechSupported()) return null;

  const SRConstructor =
    window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!SRConstructor) return null;

  const recognition = new SRConstructor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  return recognition;
}
