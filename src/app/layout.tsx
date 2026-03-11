import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Candela Assist — AI Documentation for Case Managers",
  description:
    "Generate professional case management documentation drafts in seconds. Privacy-first. No client PII stored.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone">
        <header className="bg-midnight text-stone shadow-md">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                <span className="text-midnight font-bold text-sm">C</span>
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight">
                  Candela Assist
                </span>
                <span className="hidden sm:inline text-gold text-xs ml-2 font-light italic">
                  La luz que guía
                </span>
              </div>
            </div>
            <a
              href="https://candela.education"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone/60 hover:text-gold text-sm transition-colors"
            >
              candela.education
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        <footer className="mt-16 border-t border-stone/60 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-500">
            <p>
              Candela Assist is a tool to support, not replace, professional
              judgment. Always review and edit AI-generated drafts before use.
            </p>
            <p className="mt-1 text-xs">
              © {new Date().getFullYear()} Candela Education. Privacy-first by
              design.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
