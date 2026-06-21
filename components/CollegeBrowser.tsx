"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Tag, FundingBadge } from "./ui";

type C = { code: string; name: string; region: string; district: string; funding: string; isGovernment: boolean; isAutonomous: boolean };

export default function CollegeBrowser({ colleges }: { colleges: C[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [govOnly, setGovOnly] = useState(false);
  const regions = useMemo(() => [...new Set(colleges.map((c) => c.region))].sort(), [colleges]);

  const filtered = useMemo(() => {
    const nq = q.toLowerCase().trim();
    return colleges.filter((c) =>
      (!region || c.region === region) &&
      (!govOnly || c.isGovernment) &&
      (!nq || c.name.toLowerCase().includes(nq) || c.code.includes(nq) || c.district.toLowerCase().includes(nq)));
  }, [colleges, q, region, govOnly]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, code, district…"
          className="nb-input max-w-md flex-1" />
        <select value={region} onChange={(e) => setRegion(e.target.value)} className="nb-input max-w-[200px]">
          <option value="">All regions</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={() => setGovOnly((v) => !v)} className={`nb-chip py-3 ${govOnly ? "nb-chip-on" : ""}`}>Govt only</button>
        <span className="text-sm font-bold text-ink/60">{filtered.length} shown</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link key={c.code} href={`/college/${c.code}`}
            className="nb-card-sm group block p-3 transition-all hover:-translate-y-[2px] hover:shadow-hard">
            <div className="flex items-center gap-2">
              <Tag className="bg-ink text-paper">{c.code}</Tag>
              <span className="text-xs text-ink/50">{c.region}</span>
            </div>
            <div className="mt-1.5 font-display text-sm leading-tight group-hover:underline">{c.name}</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <FundingBadge funding={c.funding} isGov={c.isGovernment} />
              {c.isAutonomous && <Tag className="bg-gold">Auto</Tag>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
