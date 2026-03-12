"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-24">
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
        <span className="text-red-400 text-xl">!</span>
      </div>
      <h2 className="font-fraunces text-xl text-midnight mb-2">
        Something went wrong
      </h2>
      <p className="font-jost text-sm text-midnight/50 max-w-xs text-center leading-relaxed mb-6">
        We couldn&apos;t load this logic model. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-midnight font-jost font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
