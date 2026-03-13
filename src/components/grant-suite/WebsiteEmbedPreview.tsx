"use client";

import type { LogicModelData } from "./LogicModelGrid";

interface WebsiteEmbedPreviewProps {
  data: LogicModelData;
  programContext: {
    programName: string;
    vertical: string;
    population: string;
    theoryOfChange: string;
  };
  shareUrl?: string;
}

export default function WebsiteEmbedPreview({
  data,
  programContext,
  shareUrl,
}: WebsiteEmbedPreviewProps) {
  const outputs = data.outputs ?? [];

  const embedCode = shareUrl
    ? `<iframe src="${shareUrl}" width="100%" height="400" frameborder="0" style="border-radius:12px;border:1px solid #e5e7eb;"></iframe>`
    : "";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-midnight/40 mb-1">
          Website Embed Widget
        </p>
        <p className="font-jost text-sm text-midnight/50">
          Preview of the embeddable impact widget for your website
        </p>
      </div>

      {/* Widget preview */}
      <div className="bg-white rounded-xl border border-stone/40 shadow-sm overflow-hidden mb-6">
        {/* Widget header */}
        <div className="bg-midnight px-6 py-4">
          <p className="font-fraunces text-lg text-stone">
            {programContext.programName}
          </p>
          <p className="font-jost text-xs text-stone/40">
            {programContext.vertical}
          </p>
        </div>
        <div className="h-[2px] bg-gold" />

        {/* Metric cards */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {outputs.slice(0, 4).map((output, i) => (
              <div key={i} className="text-center">
                <p className="font-fraunces text-xl text-midnight font-semibold">
                  {output.target}
                </p>
                <p className="font-jost text-[10px] text-midnight/40 mt-0.5">
                  {output.metric}
                </p>
              </div>
            ))}
          </div>

          {/* Theory of change (condensed) */}
          <div className="mt-4 pt-4 border-t border-stone/20">
            <p className="font-fraunces italic text-xs text-midnight/60 leading-relaxed line-clamp-2">
              {data.theoryOfChange}
            </p>
          </div>
        </div>
      </div>

      {/* Embed code */}
      {shareUrl ? (
        <div>
          <p className="font-jost font-semibold text-xs text-midnight/60 mb-2">
            Embed Code
          </p>
          <div className="bg-midnight rounded-lg p-4 overflow-x-auto">
            <code className="font-mono text-xs text-gold/80 break-all">
              {embedCode}
            </code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(embedCode)}
            className="mt-2 font-jost text-xs text-cerulean hover:text-cerulean-dark transition-colors"
          >
            Copy embed code
          </button>
        </div>
      ) : (
        <div className="bg-stone/20 rounded-lg p-5 text-center">
          <p className="font-jost text-sm text-midnight/40">
            Share your logic model first to get an embed code
          </p>
        </div>
      )}
    </div>
  );
}
