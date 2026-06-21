"use client";
import { useEffect, useMemo, useState } from "react";
import type { FinderOption } from "@/lib/finder";
import { CATEGORIES, CATEGORY_LABEL, REGIONS, BRANCH_GROUPS, TIER_META } from "@/lib/domain";
import { sortOptions, SORT_LABELS, DEFAULT_SORT, type SortMode } from "@/lib/ranking";
import OptionCard from "./OptionCard";

const SORT_MODES: SortMode[] = ["cutoff", "match", "alpha"];

type Result = {
  total: number;
  counts: { dream: number; target: number; safe: number };
  best: FinderOption[];
  dream: FinderOption[];
  target: FinderOption[];
  safe: FinderOption[];
};

const TABS = ["Best Matches", "Dream", "Target", "Safe"] as const;

export default function Finder() {
  const [percentile, setPercentile] = useState("");
  const [category, setCategory] = useState("OPEN");
  const [gender, setGender] = useState("Gender-Neutral");
  const [admissionType, setAdmissionType] = useState<"MH" | "AI">("MH");
  const [pwd, setPwd] = useState(false);
  const [homeRegion, setHomeRegion] = useState("");
  const [region, setRegion] = useState("");
  const [branchGroups, setBranchGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Best Matches");
  const [sort, setSort] = useState<SortMode>(DEFAULT_SORT);
  const [err, setErr] = useState("");

  const toggle = (g: string) =>
    setBranchGroups((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));

  // Deep-link prefill from /?p=95.5&cat=OPEN&region=Pune&bg=Computer%20%26%20IT
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get("p");
    if (!p) return;
    setPercentile(p);
    if (sp.get("cat")) setCategory(sp.get("cat")!);
    if (sp.get("region")) setRegion(sp.get("region")!);
    if (sp.get("bg")) setBranchGroups([sp.get("bg")!]);
    const pn = parseFloat(p);
    if (pn >= 0 && pn <= 100) {
      setLoading(true);
      fetch("/api/finder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percentile: pn, category: sp.get("cat") || "OPEN", gender: "Gender-Neutral",
          admissionType: "MH", region: sp.get("region") || "", branchGroups: sp.get("bg") ? [sp.get("bg")] : [],
        }),
      }).then((r) => r.json()).then((d) => { setRes(d); setTab("Best Matches"); }).finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    const p = parseFloat(percentile);
    if (!(p >= 0 && p <= 100)) { setErr("Enter a percentile between 0 and 100."); return; }
    setErr(""); setLoading(true); setRes(null);
    try {
      const r = await fetch("/api/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentile: p, category, gender, admissionType, pwd, homeRegion, region, branchGroups }),
      });
      const data = await r.json();
      if (!r.ok) { setErr(data.error || "Something went wrong"); return; }
      setRes(data); setTab("Best Matches");
    } finally { setLoading(false); }
  }

  // Pick the active tier, then apply the chosen sort once (memoised so we only
  // re-sort when the data, tab or sort mode actually changes — cheap for 1000+).
  const list = useMemo(() => {
    if (!res) return [];
    const base =
      tab === "Dream" ? res.dream : tab === "Target" ? res.target : tab === "Safe" ? res.safe : res.best;
    return sortOptions(base, sort);
  }, [res, tab, sort]);

  return (
    <div>
      {/* ---- Form ---- */}
      <form onSubmit={run} className="nb-card p-5 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_2fr]">
          <div className="border-3 border-ink bg-acid p-5 shadow-hardsm">
            <label className="nb-label">Your Percentile</label>
            <input
              autoFocus
              inputMode="decimal"
              value={percentile}
              onChange={(e) => setPercentile(e.target.value)}
              placeholder="95.50"
              className="w-full border-b-5 border-ink bg-transparent pb-1 font-display text-6xl outline-none placeholder:text-ink/30"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink/70">
              MHT-CET / JEE percentile · type & hit enter
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="nb-input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>)}
              </select>
            </Field>
            <Field label="Gender">
              <div className="flex gap-2">
                {[["Gender-Neutral", "All"], ["Female", "Female"]].map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setGender(v)}
                    className={`nb-chip flex-1 justify-center py-3 ${gender === v ? "nb-chip-on" : ""}`}>{l}</button>
                ))}
              </div>
            </Field>
            <Field label="Seat Type">
              <div className="flex gap-2">
                {[[false, "General"], [true, "PWD"]].map(([v, l]) => (
                  <button type="button" key={String(v)} onClick={() => setPwd(v as boolean)}
                    className={`nb-chip flex-1 justify-center py-3 ${pwd === v ? "nb-chip-on" : ""}`}>{l as string}</button>
                ))}
              </div>
            </Field>
            <Field label="Admission Type">
              <div className="flex gap-2">
                {(["MH", "AI"] as const).map((v) => (
                  <button type="button" key={v} onClick={() => setAdmissionType(v)}
                    className={`nb-chip flex-1 justify-center py-3 ${admissionType === v ? "nb-chip-on" : ""}`}>
                    {v === "MH" ? "MH State" : "All India"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Home University Region">
              <select value={homeRegion} onChange={(e) => setHomeRegion(e.target.value)} className="nb-input"
                disabled={admissionType === "AI"}>
                <option value="">Not sure / any</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Preferred College Region">
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="nb-input">
                <option value="">All regions</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Quick action">
              <button type="submit" disabled={loading} className="nb-btn-ink w-full py-3 text-lg">
                {loading ? "Crunching…" : "Find My Colleges →"}
              </button>
            </Field>
          </div>
        </div>

        <div className="mt-5">
          <label className="nb-label">Preferred Branches <span className="text-ink/40">(optional — leave empty for all)</span></label>
          <div className="flex flex-wrap gap-2">
            {BRANCH_GROUPS.map((g) => (
              <button type="button" key={g} onClick={() => toggle(g)}
                className={`nb-chip ${branchGroups.includes(g) ? "nb-chip-on" : ""}`}>{g}</button>
            ))}
          </div>
        </div>
        {err && <p className="mt-4 border-3 border-ink bg-flame px-3 py-2 font-bold text-white">{err}</p>}
      </form>

      {/* ---- Results ---- */}
      {res && (
        <div className="mt-8">
          {res.total === 0 ? (
            <div className="nb-card p-8 text-center">
              <div className="font-display text-2xl">No matching seats found</div>
              <p className="mt-2 text-ink/70">Try widening your filters — clear the region or branch selection.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-3 gap-3">
                <Bucket title="Dream" n={res.counts.dream} blurb={TIER_META.Dream.blurb} bg="bg-grape text-white" />
                <Bucket title="Target" n={res.counts.target} blurb={TIER_META.Target.blurb} bg="bg-sky text-white" />
                <Bucket title="Safe" n={res.counts.safe} blurb={TIER_META.Safe.blurb} bg="bg-mint" />
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2 border-b-3 border-ink pb-3">
                {TABS.map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`nb-chip ${tab === t ? "nb-chip-on" : ""}`}>{t}</button>
                ))}
                <span className="ml-auto text-sm font-bold text-ink/60">
                  {res.total} options
                </span>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="nb-label mb-0 mr-1">Sort by</span>
                {SORT_MODES.map((m) => (
                  <button key={m} onClick={() => setSort(m)}
                    className={`nb-chip ${sort === m ? "nb-chip-on" : ""}`}>{SORT_LABELS[m]}</button>
                ))}
                <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-ink/50">
                  {list.length} shown
                </span>
              </div>

              {list.length === 0 ? (
                <p className="nb-card-sm p-6 text-ink/70">No options in this tier — check the other tabs.</p>
              ) : (
                <div className="grid gap-4">
                  {list.map((o, i) => (
                    <OptionCard key={`${o.collegeCode}-${o.branchCode}`} o={o} idx={tab === "Best Matches" ? i : undefined} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="nb-label">{label}</label>
      {children}
    </div>
  );
}

function Bucket({ title, n, blurb, bg }: { title: string; n: number; blurb: string; bg: string }) {
  return (
    <div className={`border-3 border-ink ${bg} p-3 shadow-hardsm sm:p-4`}>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm uppercase tracking-tight sm:text-base">{title}</span>
        <span className="font-display text-2xl sm:text-3xl">{n}</span>
      </div>
      <p className="mt-1 hidden text-xs opacity-90 sm:block">{blurb}</p>
    </div>
  );
}
