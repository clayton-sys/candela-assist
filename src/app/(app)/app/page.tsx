import Link from "next/link";
import { FileText, BarChart3 } from "lucide-react";

export const metadata = {
  title: "Dashboard — Candela Assist",
};

const PRODUCTS = [
  {
    title: "Candela Assist",
    description:
      "Document client progress, referrals, and safety plans — without entering any identifying client information.",
    href: "/app/assist",
    icon: FileText,
  },
  {
    title: "Grants & Reporting Suite",
    description:
      "Build logic models, evaluation plans, and reporting dashboards to strengthen your grant applications.",
    href: "/app/impact-studio",
    icon: BarChart3,
    isNew: true,
  },
];

export default function AppDashboard() {
  return (
    <div className="min-h-full">
      <div className="bg-midnight px-8 py-8 border-b border-gold/20">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[10px] text-gold/50 uppercase tracking-[0.2em] mb-1">
            Dashboard
          </p>
          <h1 className="font-fraunces text-2xl text-stone leading-none">
            Welcome back
          </h1>
        </div>
      </div>
      <div className="h-[3px] bg-gold" />

      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRODUCTS.map(({ title, description, href, icon: Icon, isNew }) => (
            <Link
              key={href}
              href={href}
              className="group block rounded-xl border border-stone/60 overflow-hidden bg-white hover:border-gold/40 transition-colors"
            >
              {/* Header band */}
              <div className="bg-midnight px-5 py-4 border-t-[3px] border-gold flex items-center gap-3">
                <Icon className="w-5 h-5 text-gold" />
                <span className="font-fraunces text-base text-stone leading-none">
                  {title}
                </span>
                {isNew && (
                  <span className="text-[9px] font-mono uppercase tracking-[0.1em] bg-gold/20 text-gold px-1.5 py-0.5 rounded ml-auto">
                    New
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="px-5 py-5">
                <p className="font-jost text-sm text-midnight/60 leading-relaxed">
                  {description}
                </p>
                <p className="font-jost text-sm font-medium text-cerulean mt-4 group-hover:text-cerulean-dark transition-colors">
                  Open &rarr;
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
