"use client";
import { useEffect, useMemo, useState } from "react";
import type { FinderOption } from "@/lib/finder";
import { CATEGORIES, CATEGORY_LABEL, REGIONS, BRANCH_GROUPS, TIER_META } from "@/lib/domain";
import { sortOptions, SORT_LABELS, DEFAULT_SORT, type SortMode } from "@/lib/ranking";
import OptionCard from "./OptionCard";
import PercentileMeter from "./PercentileMeter";

const SORT_MODES: SortMode[] = ["cutoff", "prestige", "match", "alpha"];

const fmtTop = (top: number) =>
  top <= 0 ? "0" : top < 1 ? top.toFixed(2) : top < 10 ? top.toFixed(1) : Math.round(top).toString();

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
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Best Matches");
  const [sort, setSort] = useState<SortMode>(DEFAULT_SORT);
  const [err, setErr] = useState("");

  const toggle = (g: string) =>
    setBranchGroups((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));

  const pnum = parseFloat(percentile);
  const meterVal = isFinite(pnum) && pnum >= 0 && pnum <= 100 ? pnum : null;

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

  const list = useMemo(() => {
    if (!res) return [];
    const base =
      tab === "Dream" ? res.dream : tab === "Target" ? res.target : tab === "Safe" ? res.safe : res.best;
    return sortOptions(base, sort);
  }, [res, tab, sort]);

  return (
    <div>
      {/* ---- Form ---- */}
      <form onSubmit={run} className="nb-card p-5 shadow-hardlg sm:p-7">
        <div className="grid gap-7 lg:grid-cols-[1.05fr_1fr]">
          {/* LEFT — percentile + signature meter */}
          <div className="lg:border-r-3 lg:border-ink/10 lg:pr-7">
            <div className="flex items-baseline justify-between">
              <label htmlFor="pct" className="nb-label mb-0">Your Percentile</label>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">MHT-CET / JEE</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
              <input
                id="pct"
                autoFocus
                inputMode="decimal"
                value={percentile}
                onChange={(e) => setPercentile(e.target.value)}
                placeholder="95.50"
                aria-describedby="pct-meter"
                className="w-[3.4em] bg-transparent font-display text-6xl leading-none tabular-nums text-grape outline-none placeholder:text-grape/20 sm:text-7xl"
              />
              {meterVal != null ? (
                <div className="leading-tight animate-popIn">
                  <div className="font-display text-xl uppercase tracking-tight text-grape sm:text-2xl">
                    Top {fmtTop(100 - meterVal)}%
                  </div>
                  <div className="text-sm font-semibold text-ink/45">of CET students</div>
                </div>
              ) : (
                <div className="text-sm font-semibold leading-tight text-ink/40">
                  Type or drag<br />to begin
                </div>
              )}
            </div>

            <div id="pct-meter" className="mt-6">
              <PercentileMeter value={meterVal} onChange={(val) => setPercentile(val.toFixed(2))} />
            </div>
          </div>

          {/* RIGHT — controls */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="nb-input">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>)}
                </select>
              </Field>
              <Field label="Admission Type">
                <select value={admissionType} onChange={(e) => setAdmissionType(e.target.value as "MH" | "AI")} className="nb-input">
                  <option value="MH">MH State Level</option>
                  <option value="AI">All India</option>
                </select>
              </Field>
              <Field label="Gender">
                <div className="flex gap-2">
                  {[["Gender-Neutral", "All"], ["Female", "Female"]].map(([val, l]) => (
                    <button type="button" key={val} onClick={() => setGender(val)} aria-pressed={gender === val}
                      className={`nb-chip flex-1 justify-center py-3 ${gender === val ? "nb-chip-on" : ""}`}>{l}</button>
                  ))}
                </div>
              </Field>
              <Field label="Seat Type">
                <select value={pwd ? "pwd" : "all"} onChange={(e) => setPwd(e.target.value === "pwd")} className="nb-input">
                  <option value="all">All Seats</option>
                  <option value="pwd">PWD Reserved</option>
                </select>
              </Field>
            </div>

            <div>
              <label className="nb-label">Preferred branches <span className="normal-case tracking-normal text-ink/35">— optional</span></label>
              <div className="flex flex-wrap gap-1.5">
                {BRANCH_GROUPS.map((g) => (
                  <button type="button" key={g} onClick={() => toggle(g)} aria-pressed={branchGroups.includes(g)}
                    className={`nb-chip text-xs ${branchGroups.includes(g) ? "nb-chip-on" : ""}`}>{g}</button>
                ))}
              </div>
            </div>

            {/* Advanced filters — progressive disclosure keeps the form calm */}
            <div>
              <button
                type="button"
                onClick={() => setAdvanced((a) => !a)}
                aria-expanded={advanced}
                className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-widest text-ink/55 transition-colors hover:text-ink"
              >
                <span className={`grid h-5 w-5 place-items-center border-2 border-ink transition-transform duration-200 ease-brut ${advanced ? "rotate-45 bg-acid" : "bg-white"}`}>+</span>
                Advanced — region & home university
              </button>
              {advanced && (
                <div className="mt-3 grid animate-riseIn gap-4 sm:grid-cols-2">
                  <Field label="Home University Region">
                    <select value={homeRegion} onChange={(e) => setHomeRegion(e.target.value)} className="nb-input" disabled={admissionType === "AI"}>
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
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nb-btn-acid group mt-auto w-full py-5 text-xl shadow-hard"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-[3px] border-ink/25 border-t-ink" />
                  Crunching…
                </>
              ) : (
                <>
                  Find My Colleges
                  <span className="transition-transform duration-200 ease-brut group-hover:translate-x-1.5">→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {err && (
          <p className="mt-4 flex items-center gap-2 border-3 border-ink bg-flame px-3 py-2 font-bold text-white animate-popIn">
            <span aria-hidden>⚠</span> {err}
          </p>
        )}
      </form>

      {/* ---- Loading skeleton ---- */}
      {loading && !res && <ResultsSkeleton />}

      {/* ---- Results ---- */}
      {res && !loading && (
        <div className="mt-8 animate-riseIn">
          {res.total === 0 ? (
            <div className="nb-card p-10 text-center">
              <div className="font-display text-2xl">No matching seats found</div>
              <p className="mt-2 text-ink/60">Try widening your filters — clear the region or branch selection.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-3 gap-3">
                <Bucket title="Dream" n={res.counts.dream} blurb={TIER_META.Dream.blurb} bg="bg-grape text-white" active={tab === "Dream"} onClick={() => setTab("Dream")} />
                <Bucket title="Target" n={res.counts.target} blurb={TIER_META.Target.blurb} bg="bg-sky text-white" active={tab === "Target"} onClick={() => setTab("Target")} />
                <Bucket title="Safe" n={res.counts.safe} blurb={TIER_META.Safe.blurb} bg="bg-mint" active={tab === "Safe"} onClick={() => setTab("Safe")} />
              </div>

              <div className="sticky top-[60px] z-30 -mx-1 mb-4 flex flex-wrap items-center gap-2 border-b-3 border-ink bg-paper/85 px-1 py-3 backdrop-blur-md">
                {TABS.map((t) => (
                  <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}
                    className={`nb-chip ${tab === t ? "nb-chip-on" : ""}`}>{t}</button>
                ))}
                <span className="ml-auto text-sm font-bold text-ink/50">{res.total} options</span>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="nb-label mb-0 mr-1">Sort</span>
                {SORT_MODES.map((m) => (
                  <button key={m} onClick={() => setSort(m)} aria-pressed={sort === m}
                    className={`nb-chip ${sort === m ? "nb-chip-on" : ""}`}>{SORT_LABELS[m]}</button>
                ))}
                <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-ink/45">{list.length} shown</span>
              </div>

              {list.length === 0 ? (
                <p className="nb-card-sm p-6 text-ink/60">No options in this tier — check the other tabs.</p>
              ) : (
                <div className="stagger grid gap-4">
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

function Bucket({ title, n, blurb, bg, active, onClick }: { title: string; n: number; blurb: string; bg: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group border-3 border-ink ${bg} p-3 text-left shadow-hardsm transition-[transform,box-shadow] duration-200 ease-brut hover:-translate-y-[2px] hover:shadow-hard sm:p-4 ${active ? "-translate-y-[2px] shadow-hard ring-[3px] ring-ink ring-offset-2 ring-offset-paper" : ""}`}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm uppercase tracking-tight sm:text-base">{title}</span>
        <span className="font-display text-2xl tabular-nums sm:text-3xl">{n}</span>
      </div>
      <p className="mt-1 hidden text-xs opacity-90 sm:block">{blurb}</p>
    </button>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8">
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <div key={i} className="nb-skeleton h-20" />)}
      </div>
      <div className="grid gap-4">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="nb-skeleton h-[104px]" />)}
      </div>
    </div>
  );
}
