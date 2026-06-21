"use client";
import { useState } from "react";
import { Tag, pct, rank } from "./ui";

type Branch = {
  code: string; name: string; group: string;
  openCutoff: number | null; openRank: number | null;
  maxCutoff: number | null; minCutoff: number | null;
  rounds: number[]; seatTypeCount: number;
};
type Row = {
  capRound: number; percentile: number | null; meritRank: number | null;
  category: string; gender: string; level: string; seatTypeCode: string; admissionType: string;
};

export default function BranchMatrix({ branch, index }: { branch: Branch; index: number }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [cat, setCat] = useState("OPEN");
  const [round, setRound] = useState<number | "all">("all");

  async function expand() {
    setOpen((o) => !o);
    if (!rows && !loading) {
      setLoading(true);
      const r = await fetch(`/api/branch?code=${branch.code}`);
      const d = await r.json();
      setRows(d.rows ?? []);
      setLoading(false);
    }
  }

  const cats = rows ? [...new Set(rows.map((r) => r.category))] : [];
  const filtered = (rows ?? []).filter((r) => (cat === "ALL" || r.category === cat) && (round === "all" || r.capRound === round));

  return (
    <div className="nb-card-sm">
      <button onClick={expand} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-acid/30">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-7 min-w-7 place-items-center bg-ink px-1 font-display text-xs text-paper">{index + 1}</span>
          <div className="min-w-0">
            <div className="truncate font-display text-base leading-tight">{branch.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <Tag className="bg-white">{branch.group}</Tag>
              <span className="text-xs text-ink/50">Rounds {branch.rounds.join(", ")} · {branch.seatTypeCount} seat types</span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-xl leading-none">{pct(branch.openCutoff)}</div>
          <div className="text-[11px] text-ink/50">Open · rank {rank(branch.openRank)}</div>
        </div>
      </button>

      {open && (
        <div className="border-t-3 border-ink p-4">
          {loading && <p className="text-ink/60">Loading cutoffs…</p>}
          {rows && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-display uppercase tracking-widest text-ink/60">Category</span>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="border-3 border-ink bg-white px-2 py-1 text-sm">
                  <option value="ALL">All</option>
                  {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="ml-2 text-xs font-display uppercase tracking-widest text-ink/60">Round</span>
                <select value={round} onChange={(e) => setRound(e.target.value === "all" ? "all" : Number(e.target.value))} className="border-3 border-ink bg-white px-2 py-1 text-sm">
                  <option value="all">All</option>
                  {branch.rounds.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-3 border-ink text-left font-display text-[11px] uppercase tracking-wide">
                      <Th>Round</Th><Th>Seat Type</Th><Th>Category</Th><Th>Gender</Th><Th>Level</Th><Th>Percentile</Th><Th>Rank</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={i} className="border-b border-ink/15 hover:bg-acid/20">
                        <Td>{r.capRound}</Td>
                        <Td><span className="font-mono text-xs">{r.seatTypeCode}</span></Td>
                        <Td>{r.category}</Td>
                        <Td>{r.gender === "Female" ? "Ladies" : "All"}</Td>
                        <Td className="text-xs">{r.level}</Td>
                        <Td className="font-display">{pct(r.percentile)}</Td>
                        <Td>{rank(r.meritRank)}</Td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><Td className="text-ink/50">No rows for this filter.</Td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="px-2 py-2">{children}</th>;
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-2 py-1.5 ${className}`}>{children}</td>;
