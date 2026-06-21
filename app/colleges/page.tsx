import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { topColleges } from "@/lib/explore";
import { Tag, FundingBadge, pct, SectionTitle } from "@/components/ui";
import CollegeBrowser from "@/components/CollegeBrowser";

export const dynamic = "force-dynamic";

export default async function CollegesPage() {
  const [top, all] = await Promise.all([
    topColleges(12),
    prisma.college.findMany({
      orderBy: [{ region: "asc" }, { name: "asc" }],
      select: { code: true, name: true, region: true, district: true, funding: true, isGovernment: true, isAutonomous: true },
    }),
  ]);

  return (
    <div>
      <SectionTitle kicker="Leaderboard" title="Top Colleges by Cutoff" accent="bg-grape text-white" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((c, i) => (
          <Link key={c.code} href={`/college/${c.code}`}
            className="nb-card group flex items-center gap-3 p-4 transition-all hover:-translate-y-1 hover:shadow-hardlg">
            <span className="grid h-10 min-w-10 place-items-center bg-acid font-display text-lg">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-base leading-tight">{c.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Tag className="bg-white">{c.region}</Tag>
                {c.isGovernment && <Tag className="bg-mint">Govt</Tag>}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl leading-none">{pct(c.peak)}</div>
              <div className="text-[10px] uppercase text-ink/50">peak open</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <SectionTitle kicker="Directory" title={`All ${all.length} Institutes`} />
        <CollegeBrowser colleges={all} />
      </div>
    </div>
  );
}
