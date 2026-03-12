import Image from "next/image";

export default function NotFound() {
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://candela.education";
  const logoUrl = process.env.NEXT_PUBLIC_ORG_LOGO_URL || "/candela-logo-primary.svg";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: "#1B2B3A",
        fontFamily: "var(--font-jost), system-ui, sans-serif",
      }}
    >
      <Image src={logoUrl} alt={orgName} width={32} height={32} className="mb-4 opacity-60" />

      <p className="font-mono text-[10px] text-gold/50 uppercase tracking-[0.2em] mb-6">
        Grant Suite
      </p>

      <h1 className="font-fraunces text-2xl text-stone text-center mb-3">
        Logic model not found
      </h1>
      <p className="font-jost text-sm text-stone/50 text-center max-w-sm leading-relaxed mb-8">
        This logic model may have been removed or the link may be incorrect.
      </p>

      <a
        href={appUrl}
        className="inline-flex items-center gap-2 font-jost font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        style={{ backgroundColor: "#E9C03A", color: "#1B2B3A" }}
      >
        Learn more about {orgName}
      </a>
    </div>
  );
}
