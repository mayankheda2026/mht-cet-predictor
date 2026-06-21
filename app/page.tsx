import Finder from "@/components/Finder";
import Counter from "@/components/Counter";
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
  "⚡ Top Picks @ 95 Percentile", "VJTI CS", "COEP IT", "PICT Computer", "SPIT Mumbai",
  "WCE Sangli", "AI & Data Science", "GCOE CS", "Government Colleges", "TFWS Seats",
  "Home University", "Round 1 → Round 4", "All India Seats", "EWS",
];

const TRUST = [
  { title: "Accurate", sub: "Official cutoff data", icon: IconCheck },
  { title: "Smart Ranking", sub: "Opportunity based", icon: IconRank },
  { title: "Real Insights", sub: "Per-college analysis", icon: IconGear },
  { title: "Trend Based", sub: "Round-wise trends", icon: IconTrend },
  { title: "Fast & Reliable", sub: "Instant results", icon: IconBolt },
];

export default async function Home() {
  const s = await stats();
  return (
    <div>
      {/* Hero */}
      <section className="mb-9 animate-riseIn">
        <span className="inline-flex items-center gap-2 border-3 border-ink bg-white px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.16em] text-grape shadow-hardsm">
          <span className="h-2 w-2 animate-glowPulse rounded-full bg-grape" />
          MHT-CET 2025 • CAP Round 1–4 • Official Data
        </span>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <h1 className="nb-h1 text-[2.7rem] leading-[0.95] sm:text-6xl lg:text-7xl">
              Type a percentile.<br />
              Get the{" "}
              <span className="box-decoration-clone bg-acid px-2 leading-none">best colleges</span>
              <br />
              you can actually get.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/65">
              Admission intelligence built on official Maharashtra CET Cell cutoffs —
              ranked from <b className="text-ink">highest opportunity</b> to safe backup, with
              full filtering, fuzzy search and per-college insight.
            </p>
          </div>

          {/* Stat cards — white surface, bold colour edge, animated count-up */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Stat n={s.cutoffs} l="Cutoffs" sub="Official data" edge="border-l-acid" />
            <Stat n={s.colleges} l="Institutes" sub="Across Maharashtra" edge="border-l-sky" />
            <Stat n={s.branches} l="Branches" sub="All engineering" edge="border-l-grape" />
          </div>
        </div>
      </section>

      {/* Marquee — edge-masked ticker */}
      <div className="marquee-mask mb-9 overflow-hidden border-y-3 border-ink bg-ink py-2.5 text-paper">
        <div className="flex w-max animate-marquee gap-7 whitespace-nowrap font-display text-[13px] uppercase tracking-wide">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span
              key={i}
              className={`flex items-center gap-7 ${m.startsWith("⚡") ? "text-acid" : "text-paper/85"}`}
            >
              {m}
              <span className="text-acid">✦</span>
            </span>
          ))}
        </div>
      </div>

      <Finder />

      {/* Trust strip — five quiet proof points, neo-brutal cards */}
      <section className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TRUST.map((t) => (
          <Trust key={t.title} {...t} />
        ))}
      </section>
    </div>
  );
}

function Stat({ n, l, sub, edge }: { n: number; l: string; sub: string; edge: string }) {
  return (
    <div
      className={`group border-3 border-l-[10px] border-ink ${edge} bg-white px-2 py-4 text-center shadow-hard transition-[transform,box-shadow] duration-200 ease-brut hover:-translate-y-1 hover:shadow-hardlg sm:px-3 sm:py-5`}
    >
      <div className="font-display text-2xl leading-none tabular-nums sm:text-[1.9rem]">
        <Counter to={n} />
      </div>
      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/55">{l}</div>
      <div className="mt-0.5 text-[11px] font-medium text-ink/40">{sub}</div>
    </div>
  );
}

function Trust({ title, sub, icon: Icon }: { title: string; sub: string; icon: () => JSX.Element }) {
  return (
    <div className="nb-card-sm group flex items-center gap-3 p-3.5 transition-[transform,box-shadow] duration-200 ease-brut hover:-translate-y-1 hover:shadow-hard">
      <span className="grid h-10 w-10 shrink-0 place-items-center border-3 border-ink bg-acid shadow-hardsm transition-transform duration-200 ease-brut group-hover:-rotate-6">
        <Icon />
      </span>
      <div className="min-w-0">
        <div className="font-display text-[13px] uppercase leading-tight tracking-tight">{title}</div>
        <div className="truncate text-[11px] font-medium text-ink/50">{sub}</div>
      </div>
    </div>
  );
}

/* — Inline icons (stroke, currentColor) — */
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconRank() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20V10M12 20V4M18 20v-6" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </svg>
  );
}
function IconTrend() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l5-5 4 4 8-9" /><path d="M21 7v5h-5" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" stroke="none">
      <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}
