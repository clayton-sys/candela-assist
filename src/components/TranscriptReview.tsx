"use client";

interface TranscriptReviewProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  onProcess: () => void;
  onRerecord: () => void;
  isLoading?: boolean;
}

export default function TranscriptReview({
  transcript,
  onTranscriptChange,
  onProcess,
  onRerecord,
  isLoading = false,
}: TranscriptReviewProps) {
  const hasContent = transcript.trim().length > 0;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="transcript-review" className="form-label">
          Here&apos;s what was recorded — review and edit before processing
        </label>
        <p className="font-mono text-[10px] text-cerulean uppercase tracking-[0.18em] mb-2">
          Remove any client names, dates of birth, case numbers, or other
          identifying details before continuing.
        </p>
        {/* Slightly deeper Warm Stone to signal editable user content */}
        <textarea
          id="transcript-review"
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-stone/60 px-4 py-3 text-midnight font-jost placeholder-midnight/30 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-colors duration-200 resize-y bg-[#DDD5C5]"
          placeholder="Your dictation will appear here…"
        />
      </div>

      {/* Two-step is mandatory — no auto-process, both actions always visible */}
      <button
        onClick={onProcess}
        disabled={!hasContent || isLoading}
        type="button"
        className="btn-primary w-full justify-center"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Processing…
          </span>
        ) : (
          "Process Notes"
        )}
      </button>

      <button
        onClick={onRerecord}
        disabled={isLoading}
        type="button"
        className="btn-secondary w-full justify-center"
      >
        Re-record
      </button>
    </div>
  );
}
