"use client";

import { useState } from "react";

interface OutputDisplayProps {
  draft: string;
  docTitle: string;
  onReset: () => void;
  onEdit: () => void;
}

export default function OutputDisplay({
  draft,
  docTitle,
  onReset,
  onEdit,
}: OutputDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      {/* Action row */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="eyebrow mb-1">Draft generated</p>
          <h2 className="font-fraunces font-medium text-2xl text-midnight">
            {docTitle}
          </h2>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit} className="btn-outline text-sm px-4 py-2">
            ← Edit
          </button>
          <button
            onClick={onReset}
            className="btn-secondary text-sm px-4 py-2"
          >
            New
          </button>
        </div>
      </div>

      {/* Output card */}
      <div className="bg-stone rounded-xl shadow-sm overflow-hidden">
        {/* Card header bar */}
        <div className="bg-midnight px-5 py-3 flex items-center justify-between">
          <p className="eyebrow text-cerulean">Your Draft</p>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 font-jost font-semibold text-xs px-4 py-1.5 rounded-lg tracking-[0.04em] uppercase transition-all duration-200 ${
              copied
                ? "bg-gold text-midnight"
                : "border border-cerulean text-cerulean hover:bg-cerulean hover:text-white"
            }`}
          >
            {copied ? (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy to Clipboard
              </>
            )}
          </button>
        </div>

        {/* Draft body */}
        <div className="p-6 sm:p-8">
          <pre className="whitespace-pre-wrap font-jost font-light text-midnight text-sm leading-[1.7]">
            {draft}
          </pre>
        </div>
      </div>

      {/* Review reminder */}
      <div className="mt-5 p-4 bg-gold/10 border border-gold/30 rounded-xl flex gap-3">
        <svg
          className="w-4 h-4 text-gold-dark flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <p className="font-jost font-light text-sm text-midnight/80 leading-[1.7]">
          <strong className="font-semibold text-midnight">
            Always review before use.
          </strong>{" "}
          AI-generated drafts may contain errors or miss important context. Edit
          as needed before entering into your case management system.
        </p>
      </div>
    </div>
  );
}
