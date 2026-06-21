"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Tag } from "@/components/ui";

type Intent = { raw: string; percentile?: number; category?: string; region?: string; branchGroup?: string; collegeQuery?: string };
type Hit = { code: string; name: string; region: string; district: string; score: number };

const EXAMPLES = ["VJTI CS", "COEP IT", "AI DS Pune", "Open category 97 percentile", "Best colleges at 95 percentile", "Government Computer Mumbai"];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    if (!q.trim()) { setIntent(null); setHits([]); return; }
    setLoading(true);
    t.current = setTimeout(async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setIntent(d.intent); setHits(d.colleges ?? []); setLoading(false);
    }, 180);
  }, [q]);

  const finderHref = intent?.percentile
    ? `/?p=${intent.percentile}` : null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="nb-h1 text-4xl sm:text-5xl">Smart Search</h1>
      <p className="mt-2 text-ink/70">Type naturally — college names, abbreviations, branches, regions or a percentile. Fuzzy & typo-tolerant.</p>

      <div className="relative mt-6">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. VJTI CS  ·  AI DS Pune  ·  Open 97 percentile"
          className="nb-input border-5 py-5 text-2xl shadow-hard" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (
          <button key={e} onClick={() => setQ(e)} className="nb-chip">{e}</button>
        ))}
      </div>

      {intent && (intent.percentile || intent.category || intent.region || intent.branchGroup) && (
        <div className="mt-6 nb-card p-4">
          <div className="nb-label">Understood as</div>
          <div className="flex flex-wrap items-center gap-2">
            {intent.percentile != null && <Tag className="bg-acid">{intent.percentile} percentile</Tag>}
            {intent.category && <Tag className="bg-sky text-white">{intent.category}</Tag>}
            {intent.branchGroup && <Tag className="bg-grape text-white">{intent.branchGroup}</Tag>}
            {intent.region && <Tag className="bg-gold">{intent.region}</Tag>}
          </div>
          {intent.percentile != null && (
            <Link href={buildFinderLink(intent)} className="nb-btn-ink mt-4 inline-flex">
              Run Finder for {intent.percentile} percentile →
            </Link>
          )}
        </div>
      )}

      <div className="mt-6">
        {loading && <p className="text-ink/50">Searching…</p>}
        {!loading && q && hits.length === 0 && !intent?.percentile && (
          <p className="nb-card-sm p-4 text-ink/60">No colleges matched. Try an abbreviation like “VJTI”, “COEP”, “PICT”.</p>
        )}
        <div className="grid gap-2">
          {hits.map((h) => (
            <Link key={h.code} href={`/college/${h.code}`}
              className="nb-card-sm group flex items-center justify-between gap-3 p-4 transition-all hover:-translate-y-[2px] hover:shadow-hard">
              <div className="min-w-0">
                <div className="font-display leading-tight group-hover:underline">{h.name}</div>
                <div className="mt-1 flex gap-1.5"><Tag className="bg-ink text-paper">{h.code}</Tag><span className="text-xs text-ink/50">{h.region} · {h.district}</span></div>
              </div>
              <span className="font-display text-ink/30 group-hover:text-ink">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildFinderLink(i: Intent): string {
  const p = new URLSearchParams();
  if (i.percentile != null) p.set("p", String(i.percentile));
  if (i.category) p.set("cat", i.category);
  if (i.region) p.set("region", i.region);
  if (i.branchGroup) p.set("bg", i.branchGroup);
  return `/?${p.toString()}`;
}
