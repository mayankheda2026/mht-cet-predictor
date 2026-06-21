import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollegeIntel } from "@/lib/college";
import { Stat, Tag, FundingBadge, pct, rank } from "@/components/ui";
import BranchMatrix from "@/components/BranchMatrix";

export const dynamic = "force-dynamic";

export default async function CollegePage({ params }: { params: { code: string } }) {
  const intel = await getCollegeIntel(params.code);
  if (!intel) notFound();
  const { college, branches, highest, lowest, branchCount, cutoffCount } = intel;

  return (
    <div>
      <Link href="/colleges" className="mb-4 inline-block font-display text-sm uppercase tracking-wide hover:bg-acid">← All colleges</Link>

      <header className="nb-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="bg-ink text-paper">{college.code}</Tag>
          <FundingBadge funding={college.funding} isGov={college.isGovernment} />
          {college.isAutonomous && <Tag className="bg-gold">Autonomous</Tag>}
          {college.isUniversityDept && <Tag className="bg-sky text-white">University Dept</Tag>}
          {college.isMinority && <Tag className="bg-grape text-white">Minority{college.minorityType ? ` · ${college.minorityType}` : ""}</Tag>}
        </div>
        <h1 className="nb-h1 mt-3 text-3xl sm:text-5xl">{college.name}</h1>
        <p className="mt-2 font-semibold uppercase tracking-wide text-ink/60">
          {college.region} Region · {college.district} District
          {college.homeUniversity ? ` · ${college.homeUniversity}` : ""}
        </p>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Branches" value={branchCount} />
        <Stat label="Cutoff Records" value={cutoffCount.toLocaleString("en-IN")} accent="bg-sky text-white" />
        <Stat label="Top Cutoff" value={highest ? pct(highest.openCutoff) : "—"} accent="bg-grape text-white" />
        <Stat label="Entry Cutoff" value={lowest ? pct(lowest.openCutoff) : "—"} accent="bg-mint" />
      </div>

      {highest && lowest && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Highlight label="Most Competitive Branch" accent="bg-grape text-white"
            name={highest.name} cut={highest.openCutoff} rk={highest.openRank} />
          <Highlight label="Most Accessible Branch" accent="bg-mint"
            name={lowest.name} cut={lowest.openCutoff} rk={lowest.openRank} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="nb-h1 mb-1 text-2xl">Branch Ranking</h2>
        <p className="mb-4 text-sm text-ink/60">
          Ranked by Open / Gender-Neutral cutoff — most competitive first. Click a branch for round-wise & category-wise cutoffs.
        </p>
        <div className="grid gap-3">
          {branches.map((b, i) => (
            <BranchMatrix key={b.code} branch={b} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Highlight({ label, accent, name, cut, rk }: { label: string; accent: string; name: string; cut: number | null; rk: number | null }) {
  return (
    <div className="nb-card p-5">
      <span className={`inline-block ${accent} px-2 py-0.5 text-[11px] font-display uppercase tracking-widest`}>{label}</span>
      <h3 className="mt-2 font-display text-xl leading-tight">{name}</h3>
      <div className="mt-2 flex items-end gap-3">
        <div className="font-display text-3xl">{pct(cut)}</div>
        <div className="pb-1 text-sm text-ink/60">closing rank {rank(rk)}</div>
      </div>
    </div>
  );
}
