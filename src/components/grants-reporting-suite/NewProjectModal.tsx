"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-semibold text-midnight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            New Project
          </h2>
          <button onClick={onClose} className="text-midnight/30 hover:text-midnight/60">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label
            className="block text-xs font-medium text-midnight/60 mb-1.5"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Youth Mentorship Program"
            className="w-full px-3 py-2 border border-midnight/10 rounded-lg text-sm text-midnight placeholder:text-midnight/25 focus:outline-none focus:ring-2 focus:ring-cerulean/30 focus:border-cerulean"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-midnight/50 hover:text-midnight/70 transition-colors"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-cerulean text-white rounded-lg text-sm font-medium hover:bg-cerulean-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
