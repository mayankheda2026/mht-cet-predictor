"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Tag } from "./ui";
import {
  FEE_CATEGORIES,
  CONFIDENCE_LABEL,
  categoryFee,
  feeBase,
  inr,
  type CollegeFee,
  type FeeConfidence,
} from "@/lib/fees";

type SortMode = "rank" | "low" | "high" | "alpha";

const CONF_BG: Record<FeeConfidence, string> = {
  high: "bg-mint",
  medium: "bg-gold",
  low: "bg-white text-ink/60",
  none: "bg-flame text-white",
};

export default function FeesBrowser({ fees }: { fees: CollegeFee[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [govOnly, setGovOnly] = useState(false);
  const [officialOnly, setOfficialOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("rank");

  const regions = useMemo(
    () => [...new Set(fees.map((f) => f.region).filter(Boolean))].sort(),
    [fees],
  );

  const rows = useMemo(() => {
    const nq = q.toLowerCase().trim();
    const filtered = fees.filter(
      (f) =>
        (!region || f.region === region) &&
        (!govOnly || f.isGovernment) &&
        (!officialOnly || f.confidence === "high") &&
        (!nq ||
          f.name.toLowerCase().includes(nq) ||
          f.code.includes(nq) ||
          f.district.toLowerCase().includes(nq)),
    );
    const base = (f: CollegeFee) => feeBase(f);
    const cmp: Record<SortMode, (a: CollegeFee, b: CollegeFee) => number> = {
      rank: (a, b) => (a.prestigeRank ?? 9999) - (b.prestigeRank ?? 9999),
      low: (a, b) => (base(a) ?? Infinity) - (base(b) ?? Infinity),
      high: (a, b) => (base(b) ?? -1) - (base(a) ?? -1),
      alpha: (a, b) => a.name.localeCompare(b.name),
    };
    return [...filtered].sort(cmp[sort]);
  }, [fees, q, region, govOnly, officialOnly, sort]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name, code, district…"
          className="nb-input max-w-md flex-1"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="nb-input max-w-[180px]"
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="nb-input max-w-[190px]"
        >
          <option value="rank">Sort: Top colleges</option>
          <option value="low">Sort: Lowest fee</option>
          <option value="high">Sort: Highest fee</option>
          <option value="alpha">Sort: A–Z</option>
        </select>
        <button
          onClick={() => setGovOnly((v) => !v)}
          className={`nb-chip py-3 ${govOnly ? "nb-chip-on" : ""}`}
        >
          Govt only
        </button>
        <button
          onClick={() => setOfficialOnly((v) => !v)}
          className={`nb-chip py-3 ${officialOnly ? "nb-chip-on" : ""}`}
        >
          Official only
        </button>
        <span className="text-sm font-bold text-ink/60">{rows.length} shown</span>
      </div>

      {/* Table */}
      <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-ink/55">
        <span className="inline-block bg-acid px-2 py-0.5 text-ink">₹ = annual tuition + development fee</span>
        <span className="font-normal normal-case">· CAP / govt quota · excludes exam, university &amp; deposit charges</span>
      </div>
      <div className="nb-panel overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Annual tuition plus development fee by category (CAP / government
            quota), in rupees. Excludes exam, university and refundable deposit
            charges.
          </caption>
          <thead>
            <tr className="bg-ink text-paper">
              <th className="sticky left-0 z-10 min-w-[230px] bg-ink px-3 py-2.5 text-left font-display text-xs uppercase tracking-wide">
                College
              </th>
              {FEE_CATEGORIES.map((c) => (
                <th
                  key={c.key}
                  title={c.scheme}
                  className={`whitespace-nowrap px-3 py-2.5 text-right font-display text-xs uppercase tracking-wide ${
                    c.key === "OPEN" ? "text-acid" : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const base = feeBase(f);
              return (
                <tr
                  key={f.code}
                  className={`border-t-2 border-line ${i % 2 ? "bg-cloud/40" : "bg-white"}`}
                >
                  <th
                    className={`sticky left-0 z-10 max-w-[260px] px-3 py-2.5 text-left align-top font-normal ${
                      i % 2 ? "bg-cloud" : "bg-white"
                    }`}
                  >
                    <Link
                      href={`/college/${f.code}`}
                      className="font-display text-[13px] leading-tight hover:underline"
                    >
                      {f.prestigeRank ? (
                        <span className="mr-1 text-ink/40">#{f.prestigeRank}</span>
                      ) : null}
                      {f.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Tag className="bg-ink text-paper">{f.code}</Tag>
                      {f.isGovernment && <Tag className="bg-mint">Govt</Tag>}
                      <Tag className={CONF_BG[f.confidence]} >
                        {CONFIDENCE_LABEL[f.confidence]}
                        {f.year ? ` · ${f.year}` : ""}
                      </Tag>
                      {f.sourceUrl && (
                        <a
                          href={f.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={f.note}
                          className="nb-tag bg-white underline decoration-sky decoration-2"
                        >
                          source ↗
                        </a>
                      )}
                    </div>
                  </th>
                  {base == null ? (
                    <td
                      colSpan={FEE_CATEGORIES.length}
                      className="px-3 py-2.5 text-center text-ink/45"
                      title={f.note}
                    >
                      Fee not published — data unavailable
                    </td>
                  ) : (
                    FEE_CATEGORIES.map((c) => {
                      const amt = categoryFee(f, c.factor);
                      const isOpen = c.key === "OPEN";
                      const isFree = amt === 0;
                      return (
                        <td
                          key={c.key}
                          className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${
                            isOpen ? "bg-acid/25 font-display" : ""
                          } ${isFree ? "text-mint" : ""}`}
                        >
                          {isFree ? "Free" : inr(amt)}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
