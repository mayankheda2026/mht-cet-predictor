import "./globals.css";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "CAPSTONE — MHT-CET Admission Intelligence",
  description:
    "Enter your percentile, get the best Maharashtra engineering colleges & branches ranked from highest opportunity to lowest. Built on official CAP cutoff data.",
};

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
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <footer className="mt-20 border-t-3 border-ink bg-ink text-paper">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center border-3 border-paper bg-acid font-display text-lg text-ink">
                    C
                  </span>
                  <span className="font-display text-2xl uppercase tracking-tight">Capstone</span>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-paper/70">
                  An independent admission-intelligence tool built on official MHT-CET CAP
                  Round 1–4 cutoff lists (Academic Year 2025-26). Cutoffs indicate past
                  trends and are not a guarantee of admission. Always verify on the official
                  DTE / CET Cell portal before making decisions.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-right">
                {[["75,208", "Cutoffs"], ["372", "Institutes"], ["4", "CAP Rounds"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-2xl leading-none text-acid">{n}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-paper/50">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-8 border-t border-paper/15 pt-5 text-xs text-paper/45">
              Data source: State CET Cell, Government of Maharashtra · Built as an independent capstone project.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
