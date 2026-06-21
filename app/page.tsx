import Link from "next/link";
import Finder from "@/components/Finder";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function stats() {
  const [cutoffs, colleges, branches] = await Promise.all([
    prisma.cutoff.count(),
    prisma.college.count(),
    prisma.branch.count(),
  ]);
  return { cutoffs, colleges, branches };
}

const MARQUEE = [
  "VJTI CS", "COEP IT", "PICT Computer", "SPIT Mumbai", "WCE Sangli",
  "AI & Data Science", "Government Colleges", "TFWS Seats", "Home University",
  "Round 1 → Round 4", "All India Seats", "EWS", "Best @ 95 percentile",
];

export default async function Home() {
  const s = await stats();
  return (
    <div>
      {/* Hero */}
      <section className="mb-9 animate-riseIn">
        <span className="inline-flex items-center gap-2 border-3 border-ink bg-white px-3 py-1 font-display text-[11px] uppercase tracking-[0.16em] shadow-hardsm">
          <span className="h-2 w-2 animate-glowPulse rounded-full bg-acid" />
          MHT-CET 2025-26 · CAP Round 1–4 · Official data
        </span>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <h1 className="nb-h1 text-[2.7rem] leading-[0.92] sm:text-6xl lg:text-7xl">
              Type a percentile.<br />
              Get the{" "}
              <span className="relative inline-block">
                <span className="absolute inset-x-0 bottom-1 h-4 -skew-x-6 bg-acid sm:bottom-2 sm:h-6" />
                <span className="relative">best colleges</span>
              </span>
              <br />
              you can actually get.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/65">
              Admission intelligence on the official Maharashtra CET Cell cutoffs —
              every college ranked from <b className="text-ink">highest opportunity</b> to
              safe backup, with prestige tiers, deep filters and per-college insight.
            </p>
          </div>

          {/* Stat strip — quiet, premium, hairline-divided */}
          <div className="nb-panel flex items-stretch divide-x-[3px] divide-ink">
            <Stat n={s.cutoffs.toLocaleString("en-IN")} l="Cutoffs" />
            <Stat n={s.colleges} l="Institutes" />
            <Stat n={s.branches.toLocaleString("en-IN")} l="Branches" />
          </div>
        </div>
      </section>

      {/* Marquee — subtler, edge-masked */}
      <div className="marquee-mask mb-9 overflow-hidden border-y-3 border-ink bg-ink py-2.5 text-paper">
        <div className="flex w-max animate-marquee gap-7 whitespace-nowrap font-display text-[13px] uppercase tracking-wide">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-7 text-paper/85">{m}<span className="text-acid">✦</span></span>
          ))}
        </div>
      </div>

      <Finder />

      {/* Feature strip — white panels, colour as accent only (the 70/30 rule) */}
      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="nb-h1 text-2xl sm:text-3xl">Go deeper</h2>
          <span className="hidden text-sm font-semibold text-ink/45 sm:block">Three more ways in</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature href="/explore" accent="bg-sky" title="Advanced Explorer"
            body="Stack 20+ live filters — percentile & rank range, category, gender, round, level, region, TFWS, EWS, government & autonomous." />
          <Feature href="/colleges" accent="bg-mint" title="College Intelligence"
            body="Every institute: prestige tier, branch line-up, highest & lowest cutoff, round-wise trends and internal branch ranking." />
          <Feature href="/search" accent="bg-gold" title="Smart Search"
            body={`Ask like a human: "VJTI CS", "AI DS Pune", "Open category 97 percentile". Fuzzy + typo tolerant.`} />
        </div>
      </section>
    </div>
  );
}

function Stat({ n, l }: { n: React.ReactNode; l: string }) {
  return (
    <div className="flex-1 px-4 py-4 text-center sm:px-5 sm:py-5">
      <div className="font-display text-2xl leading-none sm:text-3xl">{n}</div>
      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/55">{l}</div>
    </div>
  );
}

function Feature({ href, accent, title, body }: { href: string; accent: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="nb-card group relative block overflow-hidden p-5 transition-[transform,box-shadow] duration-200 ease-brut hover:-translate-y-1 hover:shadow-hardlg"
    >
      <span className={`mb-4 inline-block h-2.5 w-10 ${accent}`} />
      <div className="font-display text-xl uppercase tracking-tight">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-ink/65">{body}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 font-display text-sm uppercase tracking-wide">
        Open
        <span className="transition-transform duration-200 ease-brut group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
