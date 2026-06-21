import Link from "next/link";
import type { FinderOption } from "@/lib/finder";
import { Tag, TierBadge, pct, rank } from "./ui";

const TIER_EDGE: Record<string, string> = {
  Dream: "border-l-grape", Target: "border-l-sky", Safe: "border-l-mint",
};

export default function OptionCard({ o, idx }: { o: FinderOption; idx?: number }) {
  const fit = o.margin >= 0
    ? `+${o.margin.toFixed(2)} cushion`
    : `${o.margin.toFixed(2)} short`;
  return (
    <Link
      href={`/college/${o.collegeCode}`}
      className={`nb-card group block border-l-[10px] ${TIER_EDGE[o.tier]} p-4 transition-all hover:-translate-y-[2px] hover:shadow-hardlg`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {idx != null && (
              <span className="grid h-6 min-w-6 place-items-center bg-ink px-1 font-display text-xs text-paper">
                {idx + 1}
              </span>
            )}
            <TierBadge tier={o.tier} />
            <Tag className="bg-white">{o.branchGroup}</Tag>
            {o.isGovernment && <Tag className="bg-mint">Govt</Tag>}
            {o.isAutonomous && <Tag className="bg-gold">Autonomous</Tag>}
          </div>
          <h3 className="mt-2 font-display text-lg leading-tight">{o.branchName}</h3>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink/80">{o.collegeName}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-ink/50">
            {o.region} · {o.district} · {o.seatTypeCode} · Round {o.capRound}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-2xl leading-none">{pct(o.cutoffPercentile)}</div>
          <div className="mt-1 text-xs text-ink/60">rank {rank(o.cutoffRank)}</div>
          <div className={`mt-2 inline-block px-2 py-0.5 text-[11px] font-bold ${o.margin >= 0 ? "bg-acid" : "bg-flame text-white"}`}>
            {fit}
          </div>
          <div
            className="mt-1.5 inline-block bg-ink px-2 py-0.5 text-[11px] font-bold text-paper"
            title="Weighted match: 40% branch · 30% reputation · 20% cutoff fit · 10% location"
          >
            {Math.round(o.scores.match)} match
          </div>
        </div>
      </div>
    </Link>
  );
}
