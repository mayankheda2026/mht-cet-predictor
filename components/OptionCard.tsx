import Link from "next/link";
import type { FinderOption } from "@/lib/finder";
import { Tag, TierBadge, PrestigeBadge, pct, rank } from "./ui";

const TIER_EDGE: Record<string, string> = {
  Dream: "border-l-grape", Target: "border-l-sky", Safe: "border-l-mint",
};

export default function OptionCard({ o, idx }: { o: FinderOption; idx?: number }) {
  const cushion = o.margin >= 0;
  const fit = cushion ? `+${o.margin.toFixed(2)}` : o.margin.toFixed(2);
  return (
    <Link
      href={`/college/${o.collegeCode}`}
      className={`nb-card group block border-l-[10px] ${TIER_EDGE[o.tier]} p-4 transition-[transform,box-shadow] duration-200 ease-brut hover:-translate-y-[3px] hover:shadow-hardlg focus-visible:-translate-y-[3px] focus-visible:shadow-hardlg sm:p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          {idx != null && (
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center border-3 border-ink bg-acid font-display text-base tabular-nums shadow-hardsm">
              {idx + 1}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <TierBadge tier={o.tier} />
              <PrestigeBadge tier={o.scores.prestigeTier} />
              <Tag className="bg-white">{o.branchGroup}</Tag>
              {o.isGovernment && <Tag className="bg-mint">Govt</Tag>}
              {o.isAutonomous && <Tag className="bg-gold">Autonomous</Tag>}
            </div>
            <h3 className="mt-2 font-display text-lg leading-tight tracking-tight">{o.branchName}</h3>
            <p className="mt-0.5 truncate text-sm font-semibold text-ink/75 transition-colors group-hover:text-ink">
              {o.collegeName}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink/45">
              {o.region} · {o.district} · {o.seatTypeCode} · Round {o.capRound}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-display text-2xl leading-none tabular-nums sm:text-[28px]">{pct(o.cutoffPercentile)}</div>
          <div className="mt-1 text-[11px] text-ink/50">closing rank {rank(o.cutoffRank)}</div>
          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            <span
              className={`inline-block border-2 border-ink px-2 py-0.5 text-[11px] font-bold tabular-nums ${cushion ? "bg-acid" : "bg-flame text-white"}`}
              title={cushion ? "Percentile cushion above the cutoff" : "Percentile short of the cutoff"}
            >
              {fit}
            </span>
            <span
              className="inline-flex items-center gap-1 bg-ink px-2 py-0.5 text-[11px] font-bold tabular-nums text-paper"
              title="Weighted match: 40% branch · 30% reputation · 20% cutoff fit · 10% location"
            >
              {Math.round(o.scores.match)}<span className="text-acid">★</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
