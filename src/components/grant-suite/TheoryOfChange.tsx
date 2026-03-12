export default function TheoryOfChange({ text }: { text: string }) {
  return (
    <div
      id="theory-of-change"
      className="mx-6 mb-6 px-6 py-5 bg-white rounded-lg border border-[#e5e7eb]"
      style={{ borderLeft: "4px solid #E9C03A" }}
    >
      <p
        className="font-mono text-[10px] uppercase tracking-[0.1em] mb-3"
        style={{ color: "#3A6B8A" }}
      >
        Theory of Change
      </p>
      <p className="font-fraunces italic text-sm text-midnight leading-[1.7]">
        {text}
      </p>
    </div>
  );
}
