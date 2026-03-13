import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Candela",
  description:
    "Contact Candela for pricing on AI tools, training, and consulting for nonprofit organizations.",
};

export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <p className="font-mono text-[10px] text-cerulean uppercase tracking-[0.2em] mb-2">
        Pricing
      </p>
      <h1 className="font-fraunces text-3xl sm:text-4xl text-midnight leading-tight mb-6">
        Plans for every organization
      </h1>
      <p className="font-jost text-base text-midnight/70 leading-relaxed mb-8">
        We work with nonprofits of all sizes. Reach out and we&apos;ll find the
        right fit for your team.
      </p>
      <div className="bg-stone rounded-xl border border-stone/60 p-8 text-center">
        <p className="font-fraunces text-lg text-midnight mb-2">
          Let&apos;s talk
        </p>
        <p className="font-jost text-sm text-midnight/50 mb-5">
          We&apos;ll walk through your needs and put together a plan that works
          for your organization.
        </p>
        <a
          href="mailto:hello@candela.education"
          className="inline-block font-jost text-sm font-medium bg-gold text-midnight px-6 py-2.5 rounded-md hover:bg-gold-dark transition-colors"
        >
          Contact us
        </a>
      </div>
    </div>
  );
}
