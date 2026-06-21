"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES, GENDERS, BRANCH_GROUPS, CAP_ROUNDS, ADMISSION_TYPES } from "@/lib/domain";
import { Tag, pct, rank } from "./ui";

const LEVELS = ["State Level", "Home University", "Other Than Home University", "All India"];

type Row = {
  id: number; percentile: number | null; meritRank: number | null; category: string;
  gender: string; level: string; seatTypeCode: string; admissionType: string; capRound: number;
  collegeCode: string; branchCode: string;
  college: { name: string; region: string; district: string; funding: string; isGovernment: boolean };
  branch: { name: string; group: string };
};

export default function ExploreClient({ facets, colleges }: {
  facets: { regions: string[]; districts: string[]; funding: string[] };
  colleges: { code: string; name: string }[];
}) {
  const [pctMin, setPctMin] = useState(""); const [pctMax, setPctMax] = useState("");
  const [rankMin, setRankMin] = useState(""); const [rankMax, setRankMax] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [rounds, setRounds] = useState<number[]>([]);
  const [branchGroups, setBranchGroups] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [admissionType, setAdmissionType] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [funding, setFunding] = useState<string[]>([]);
  const [government, setGovernment] = useState(false);
  const [autonomous, setAutonomous] = useState(false);
  const [tfws, setTfws] = useState(false);
  const [ews, setEws] = useState(false);
  const [minority, setMinority] = useState(false);
  const [sort, setSort] = useState("pct_desc");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<{ total: number; rows: Row[]; pages: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const arr = (a: (string | number)[]) => (a.length ? a.join(",") : "");
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    const set = (k: string, v: string | number | boolean | undefined) => {
      if (v !== undefined && v !== "" && v !== false) p.set(k, String(v));
    };
    set("pctMin", pctMin); set("pctMax", pctMax); set("rankMin", rankMin); set("rankMax", rankMax);
    set("categories", arr(categories)); set("genders", arr(genders)); set("rounds", arr(rounds));
    set("branchGroups", arr(branchGroups)); set("levels", arr(levels)); set("regions", arr(regions));
    set("admissionType", admissionType); set("collegeCode", collegeCode); set("funding", arr(funding));
    set("government", government); set("autonomous", autonomous); set("tfws", tfws); set("ews", ews);
    set("minority", minority); set("sort", sort); set("page", page);
    return p.toString();
  }, [pctMin, pctMax, rankMin, rankMax, categories, genders, rounds, branchGroups, levels, regions, admissionType, collegeCode, funding, government, autonomous, tfws, ews, minority, sort, page]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/explore?${qs}`).then((r) => r.json()).then((d) => { if (alive) { setData(d); setLoading(false); } });
    return () => { alive = false; };
  }, [qs]);

  useEffect(() => { setPage(1); }, [pctMin, pctMax, rankMin, rankMax, categories, genders, rounds, branchGroups, levels, regions, admissionType, collegeCode, funding, government, autonomous, tfws, ews, minority, sort]);

  const tgl = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, v: T) =>
    set((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const reset = () => {
    setPctMin(""); setPctMax(""); setRankMin(""); setRankMax(""); setCategories([]); setGenders([]);
    setRounds([]); setBranchGroups([]); setLevels([]); setRegions([]); setAdmissionType(""); setCollegeCode("");
    setFunding([]); setGovernment(false); setAutonomous(false); setTfws(false); setEws(false); setMinority(false); setSort("pct_desc");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Filters */}
      <aside className="nb-card h-max p-4 lg:sticky lg:top-20">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-display text-lg uppercase">Filters</span>
          <button onClick={reset} className="nb-chip">Reset</button>
        </div>

        <Group label="Percentile range">
          <div className="flex gap-2">
            <input value={pctMin} onChange={(e) => setPctMin(e.target.value)} placeholder="min" className="nb-input py-2 text-base" inputMode="decimal" />
            <input value={pctMax} onChange={(e) => setPctMax(e.target.value)} placeholder="max" className="nb-input py-2 text-base" inputMode="decimal" />
          </div>
        </Group>
        <Group label="Merit rank range">
          <div className="flex gap-2">
            <input value={rankMin} onChange={(e) => setRankMin(e.target.value)} placeholder="min" className="nb-input py-2 text-base" inputMode="numeric" />
            <input value={rankMax} onChange={(e) => setRankMax(e.target.value)} placeholder="max" className="nb-input py-2 text-base" inputMode="numeric" />
          </div>
        </Group>
        <Group label="Admission type">
          <Chips opts={ADMISSION_TYPES as unknown as string[]} active={admissionType ? [admissionType] : []} onPick={(v) => setAdmissionType((c) => (c === v ? "" : v))} />
        </Group>
        <Group label="College">
          <select value={collegeCode} onChange={(e) => setCollegeCode(e.target.value)} className="nb-input py-2 text-base">
            <option value="">Any college</option>
            {colleges.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </Group>
        <Group label="Branch group">
          <Chips opts={BRANCH_GROUPS as unknown as string[]} active={branchGroups} onPick={(v) => tgl(setBranchGroups, v)} />
        </Group>
        <Group label="Category">
          <Chips opts={CATEGORIES as unknown as string[]} active={categories} onPick={(v) => tgl(setCategories, v)} />
        </Group>
        <Group label="Gender">
          <Chips opts={["Gender-Neutral", "Female"]} labels={{ "Gender-Neutral": "All", Female: "Ladies" }} active={genders} onPick={(v) => tgl(setGenders, v)} />
        </Group>
        <Group label="Seat level">
          <Chips opts={LEVELS} active={levels} onPick={(v) => tgl(setLevels, v)} />
        </Group>
        <Group label="CAP round">
          <Chips opts={CAP_ROUNDS.map(String)} active={rounds.map(String)} onPick={(v) => tgl(setRounds, Number(v))} />
        </Group>
        <Group label="Region">
          <Chips opts={facets.regions} active={regions} onPick={(v) => tgl(setRegions, v)} />
        </Group>
        <Group label="Institute type">
          <Chips opts={facets.funding} active={funding} onPick={(v) => tgl(setFunding, v)} />
        </Group>
        <Group label="Special">
          <div className="flex flex-wrap gap-2">
            <Toggle on={government} set={setGovernment}>Government</Toggle>
            <Toggle on={autonomous} set={setAutonomous}>Autonomous</Toggle>
            <Toggle on={tfws} set={setTfws}>TFWS</Toggle>
            <Toggle on={ews} set={setEws}>EWS</Toggle>
            <Toggle on={minority} set={setMinority}>Minority</Toggle>
          </div>
        </Group>
      </aside>

      {/* Results */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b-3 border-ink pb-3">
          <span className="font-display text-lg">
            {loading ? "Loading…" : `${data?.total.toLocaleString("en-IN") ?? 0} records`}
          </span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border-3 border-ink bg-white px-3 py-2 font-bold">
            <option value="pct_desc">Percentile: high → low</option>
            <option value="pct_asc">Percentile: low → high</option>
            <option value="rank_asc">Merit rank: best first</option>
            <option value="college">College code</option>
          </select>
        </div>

        <div className="overflow-x-auto border-3 border-ink bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-ink text-paper">
              <tr className="text-left font-display text-[11px] uppercase tracking-wide">
                <Th>College / Branch</Th><Th>Seat</Th><Th>Cat</Th><Th>Round</Th><Th>Percentile</Th><Th>Rank</Th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/15 align-top hover:bg-acid/20">
                  <Td>
                    <Link href={`/college/${r.collegeCode}`} className="font-display leading-tight hover:underline">{r.branch.name}</Link>
                    <div className="text-xs text-ink/60">{r.college.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      <Tag className="bg-white">{r.college.region}</Tag>
                      {r.college.isGovernment && <Tag className="bg-mint">Govt</Tag>}
                      <Tag className="bg-white">{r.branch.group}</Tag>
                    </div>
                  </Td>
                  <Td><div className="font-mono text-xs">{r.seatTypeCode}</div><div className="text-[11px] text-ink/50">{r.level}</div></Td>
                  <Td>{r.category}</Td>
                  <Td>{r.capRound}<div className="text-[11px] text-ink/50">{r.admissionType}</div></Td>
                  <Td className="font-display text-base">{pct(r.percentile)}</Td>
                  <Td>{rank(r.meritRank)}</Td>
                </tr>
              ))}
              {data && data.rows.length === 0 && !loading && (
                <tr><Td className="p-6 text-center text-ink/50">No records match these filters.</Td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="nb-btn py-2">← Prev</button>
            <span className="px-3 font-display">{page} / {data.pages}</span>
            <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="nb-btn py-2">Next →</button>
          </div>
        )}
      </section>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 border-b border-ink/10 pb-4 last:border-0">
      <div className="nb-label">{label}</div>
      {children}
    </div>
  );
}
function Chips({ opts, active, onPick, labels }: { opts: string[]; active: string[]; onPick: (v: string) => void; labels?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => (
        <button key={o} onClick={() => onPick(o)} className={`nb-chip !text-xs ${active.includes(o) ? "nb-chip-on" : ""}`}>
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}
function Toggle({ on, set, children }: { on: boolean; set: (f: (v: boolean) => boolean) => void; children: React.ReactNode }) {
  return <button onClick={() => set((v) => !v)} className={`nb-chip !text-xs ${on ? "nb-chip-on" : ""}`}>{children}</button>;
}
const Th = ({ children }: { children: React.ReactNode }) => <th className="px-3 py-2">{children}</th>;
const Td = ({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) => <td colSpan={colSpan} className={`px-3 py-2 ${className}`}>{children}</td>;
