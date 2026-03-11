import { DocumentType } from "@/lib/documentTypes";

interface DocumentTypeCardProps {
  doc: DocumentType;
  onSelect: (id: string) => void;
}

const eyebrowMap: Record<string, string> = {
  "progress-note": "CLIENT CONTACT",
  "referral-letter": "WARM REFERRAL",
  "safety-plan": "CRISIS PLANNING",
};

export default function DocumentTypeCard({ doc, onSelect }: DocumentTypeCardProps) {
  const eyebrow = eyebrowMap[doc.id] ?? "DOCUMENT TYPE";

  return (
    <button
      onClick={() => onSelect(doc.id)}
      className="group text-left cursor-pointer bg-stone rounded-xl shadow-sm border-l-4 border-gold p-5 transition-all duration-200 hover:shadow-md hover:border-gold-dark hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {/* Eyebrow */}
      <p className="eyebrow mb-3">{eyebrow}</p>

      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-midnight flex items-center justify-center text-xl mb-3 flex-shrink-0">
        {doc.icon}
      </div>

      {/* Title */}
      <h3 className="font-fraunces font-medium text-lg text-midnight mb-2 leading-tight">
        {doc.title}
      </h3>

      {/* Description */}
      <p className="font-jost font-light text-midnight/70 text-sm leading-[1.7]">
        {doc.description}
      </p>

      {/* CTA */}
      <div className="mt-4 font-jost font-semibold text-sm text-cerulean tracking-[0.04em] uppercase flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-150">
        Generate draft
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}
