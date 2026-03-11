import { DocumentType } from "@/lib/documentTypes";

interface DocumentTypeCardProps {
  doc: DocumentType;
  onSelect: (id: string) => void;
}

const colorMap: Record<string, string> = {
  cerulean: "border-cerulean hover:bg-cerulean/5 hover:border-cerulean",
  gold: "border-gold hover:bg-gold/5 hover:border-gold",
  midnight: "border-midnight hover:bg-midnight/5 hover:border-midnight",
};

const iconBgMap: Record<string, string> = {
  cerulean: "bg-cerulean/10",
  gold: "bg-gold/10",
  midnight: "bg-midnight/10",
};

export default function DocumentTypeCard({ doc, onSelect }: DocumentTypeCardProps) {
  return (
    <button
      onClick={() => onSelect(doc.id)}
      className={`card text-left cursor-pointer border-2 transition-all duration-200 hover:shadow-md group ${colorMap[doc.color]}`}
    >
      <div className={`w-12 h-12 rounded-xl ${iconBgMap[doc.color]} flex items-center justify-center text-2xl mb-4`}>
        {doc.icon}
      </div>
      <h3 className="text-lg font-bold text-midnight mb-2 group-hover:text-cerulean transition-colors">
        {doc.title}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">{doc.description}</p>
      <div className="mt-4 text-sm font-semibold text-cerulean flex items-center gap-1">
        Generate draft
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
