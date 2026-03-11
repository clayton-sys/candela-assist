"use client";

import { useState } from "react";

interface PrivacyNoticeProps {
  onAcknowledge: () => void;
}

export default function PrivacyNotice({ onAcknowledge }: PrivacyNoticeProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 bg-midnight/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-midnight">
            Privacy Reminder
          </h2>
        </div>

        <div className="bg-stone rounded-xl p-4 mb-6 border-l-4 border-cerulean">
          <p className="text-midnight text-sm leading-relaxed">
            <strong>Do not enter any identifying client information</strong> —
            no names, dates of birth, case numbers, or other identifying
            details.
          </p>
          <p className="text-midnight/80 text-sm leading-relaxed mt-2">
            Describe the client using neutral terms only (e.g.{" "}
            <em>"the client"</em>, <em>"a 34-year-old participant"</em>). This
            keeps the tool compliant and protects both you and your clients.
          </p>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Candela Assist does not store any inputs or outputs. You are the PII
          filter — describe situations in general, non-identifying terms.
        </p>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-cerulean focus:ring-cerulean accent-cerulean cursor-pointer"
          />
          <span className="text-sm text-midnight font-medium leading-relaxed">
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
