import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CAPSTONE — MHT-CET Admission Intelligence",
  description:
    "Enter your percentile, get the best Maharashtra engineering colleges & branches ranked from highest opportunity to lowest. Built on official CAP cutoff data.",
};

const NAV = [
  { href: "/", label: "Finder" },
  { href: "/explore", label: "Explore" },
  { href: "/colleges", label: "Colleges" },
  { href: "/search", label: "Search" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="sticky top-0 z-50 border-b-3 border-ink bg-paper">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="group flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center border-3 border-ink bg-acid font-display text-lg shadow-hardsm">
                C
              </span>
              <span className="font-display text-xl uppercase tracking-tight">Capstone</span>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="border-3 border-transparent px-2 py-1.5 font-display text-sm uppercase tracking-tight hover:border-ink hover:bg-white hover:shadow-hardsm sm:px-3"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t-3 border-ink bg-ink text-paper">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="font-display text-2xl uppercase">Capstone</div>
            <p className="mt-2 max-w-xl text-sm text-paper/70">
              An independent admission-intelligence tool built on official MHT-CET CAP
              Round 1–4 cutoff lists (Academic Year 2025-26). Cutoffs indicate past
              trends and are not a guarantee of admission. Verify on the official DTE /
              CET Cell portal before making decisions.
            </p>
            <p className="mt-4 text-xs text-paper/50">
              Data: State CET Cell, Govt. of Maharashtra · 75,208 cutoff records · 372 institutes · 4 CAP rounds.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
