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
      <section className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-block bg-flame px-3 py-1 font-display text-xs uppercase tracking-widest text-white shadow-hardsm">
              MHT-CET 2025 · CAP Round 1–4
            </span>
            <h1 className="nb-h1 mt-4 text-5xl sm:text-7xl">
              Type a percentile.<br />
              Get the <span className="bg-acid px-2">best colleges</span><br />
              you can actually get.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink/70">
              Admission intelligence built on official Maharashtra CET Cell cutoff data —
              ranked from <b>highest opportunity</b> to safe backup, with full filtering,
              fuzzy search and per-college insight.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <HeroStat n={s.cutoffs.toLocaleString("en-IN")} l="Cutoffs" bg="bg-acid" />
            <HeroStat n={s.colleges} l="Institutes" bg="bg-sky text-white" />
            <HeroStat n={s.branches.toLocaleString("en-IN")} l="Branches" bg="bg-grape text-white" />
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="mb-8 overflow-hidden border-y-3 border-ink bg-ink py-2 text-paper">
        <div className="flex w-max animate-marquee gap-6 whitespace-nowrap font-display text-sm uppercase tracking-wide">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-6">{m}<span className="text-acid">✦</span></span>
          ))}
        </div>
      </div>

      <Finder />

      {/* Feature strip */}
      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Feature href="/explore" bg="bg-sky text-white" title="Advanced Explorer"
          body="Stack 20+ filters — percentile & rank range, category, gender, round, level, region, TFWS, EWS, government & autonomous." />
        <Feature href="/colleges" bg="bg-mint" title="College Intelligence"
          body="Every institute: branch line-up, highest & lowest cutoff, round-wise trends and internal branch ranking." />
        <Feature href="/search" bg="bg-gold" title="Smart Search"
          body={`Ask like a human: "VJTI CS", "AI DS Pune", "Open category 97 percentile". Fuzzy + typo tolerant.`} />
      </section>
    </div>
  );
}

function HeroStat({ n, l, bg }: { n: React.ReactNode; l: string; bg: string }) {
  return (
    <div className={`border-3 border-ink ${bg} p-3 text-center shadow-hardsm`}>
      <div className="font-display text-2xl leading-none">{n}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">{l}</div>
    </div>
  );
}

function Feature({ href, bg, title, body }: { href: string; bg: string; title: string; body: string }) {
  return (
    <Link href={href} className={`nb-card group block p-5 transition-all hover:-translate-y-1 hover:shadow-hardlg ${bg}`}>
      <div className="font-display text-xl uppercase">{title}</div>
      <p className="mt-2 text-sm opacity-90">{body}</p>
      <div className="mt-4 font-display text-sm uppercase tracking-wide group-hover:underline">Open →</div>
    </Link>
  );
}
