"use client";

import { useState } from "react";

interface PrivacyNoticeProps {
  onAcknowledge: () => void;
}

export default function PrivacyNotice({ onAcknowledge }: PrivacyNoticeProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 bg-midnight/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone rounded-2xl shadow-2xl max-w-lg w-full p-8">
        {/* Eyebrow */}
        <p className="eyebrow mb-3">Before you begin</p>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <svg
            className="w-6 h-6 text-cerulean flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 className="font-fraunces font-medium text-xl text-midnight">
            Privacy Reminder
          </h2>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-xl p-4 mb-5 border-l-4 border-cerulean">
          <p className="font-jost font-semibold text-midnight text-sm">
            Do not enter any identifying client information —
          </p>
          <p className="font-jost font-light text-midnight/80 text-sm leading-[1.7] mt-1">
            no names, dates of birth, case numbers, or other identifying
            details. Describe the client using neutral terms only (e.g.{" "}
            <em>&ldquo;the client&rdquo;</em>,{" "}
            <em>&ldquo;a 34-year-old participant&rdquo;</em>). This keeps the
            tool compliant and protects both you and your clients.
          </p>
        </div>

        <p className="font-jost font-light text-midnight/60 text-sm mb-6 leading-[1.7]">
          Candela Assist does not store any inputs or outputs. You are the PII
          filter — describe situations in general, non-identifying terms.
        </p>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-stone/60 accent-gold cursor-pointer"
          />
          <span className="font-jost font-medium text-sm text-midnight leading-relaxed">
            I understand. I will not enter any identifying client information.
          </span>
        </label>

        <button
          onClick={onAcknowledge}
          disabled={!checked}
          className="btn-primary w-full"
        >
          Continue to Form
        </button>
      </div>
    </div>
  );
}
