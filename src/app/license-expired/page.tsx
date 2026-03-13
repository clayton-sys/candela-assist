import Link from "next/link";
import Image from "next/image";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

export default function LicenseExpiredPage() {
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? "Candela";
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@candela.education";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      <div
        className="flex-1 flex flex-col items-center justify-center px-4"
        style={{
          background: "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 100%)",
        }}
      >
        <div className="w-full max-w-md text-center">
          <Image
            src="/candela-logo-primary.svg"
            alt={orgName}
            width={40}
            height={40}
            className="mx-auto mb-6 opacity-60"
          />

          <h1 className="font-fraunces text-3xl text-stone mb-3">
            Subscription Inactive
          </h1>

          <p className="font-jost font-light text-stone/60 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Your organization&apos;s {orgName} subscription is currently inactive.
            To restore access, please contact us.
          </p>

          <a
            href={`mailto:${supportEmail}?subject=Subscription%20Renewal%20%E2%80%94%20${encodeURIComponent(orgName)}`}
            className="inline-flex items-center justify-center btn-primary mb-4"
          >
            Contact {orgName}
          </a>

          <div className="mt-6">
            <Link
              href="/login"
              className="font-mono text-[11px] text-stone/30 hover:text-stone/60 uppercase tracking-[0.18em] transition-colors"
            >
              &larr; Back to sign in
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
