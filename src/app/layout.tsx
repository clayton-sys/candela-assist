import type { Metadata } from "next";
import { Fraunces, Jost, DM_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["300", "400", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: "400",
});

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_TITLE ?? "Candela Assist"}`,
  description:
    "AI tools for nonprofits — case management documentation, grant writing, and more.",
  icons: {
    icon: "/candela-logo-primary.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`min-h-screen flex flex-col bg-stone text-midnight ${fraunces.variable} ${jost.variable} ${dmMono.variable} font-jost`}
      >
        {children}
      </body>
    </html>
  );
}
