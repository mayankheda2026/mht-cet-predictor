import { facets } from "@/lib/explore";
import { prisma } from "@/lib/prisma";
import ExploreClient from "@/components/ExploreClient";
import { SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const [f, colleges] = await Promise.all([
    facets(),
    prisma.college.findMany({ select: { code: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <SectionTitle kicker="20+ Filters" title="Cutoff Explorer" accent="bg-sky text-white" />
      <p className="-mt-3 mb-6 max-w-2xl text-ink/70">
        Stack any combination of filters across all 75,208 cutoff records. Everything updates live.
      </p>
      <ExploreClient facets={f} colleges={colleges} />
    </div>
  );
}
