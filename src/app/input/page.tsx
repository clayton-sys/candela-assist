import InputHub from "@/components/InputHub";

export const metadata = {
  title: "Quick Notes — Candela Assist",
  description:
    "Paste or dictate your session notes and generate a professional document draft.",
};

export default function InputPage() {
  return (
    <div className="bg-midnight-gradient min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        {/* Page header */}
        <div className="mb-8">
          <p className="eyebrow mb-3">Quick Notes</p>
          <h1 className="font-fraunces font-medium text-3xl text-stone mb-2 leading-tight">
            Speak or paste your session notes
          </h1>
          <p className="font-jost font-light text-stone/60 leading-[1.7]">
            No structured form required — we&apos;ll generate a professional
            draft from your raw notes.
          </p>
        </div>

        {/* Hub card */}
        <div className="bg-stone rounded-xl p-6 sm:p-8 shadow-sm">
          <InputHub />
        </div>
      </div>
    </div>
  );
}
