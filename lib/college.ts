import { prisma } from "./prisma";

export async function getCollegeIntel(code: string) {
  const college = await prisma.college.findUnique({ where: { code } });
  if (!college) return null;

  const cutoffs = await prisma.cutoff.findMany({
    where: { collegeCode: code },
    select: {
      branchCode: true, capRound: true, percentile: true, meritRank: true,
      category: true, gender: true, level: true, seatTypeCode: true, admissionType: true,
      branch: { select: { name: true, group: true } },
    },
  });

  // Headline metric per branch = OPEN / Gender-Neutral / State-or-HU, Round 1 if present.
  type BranchAgg = {
    code: string; name: string; group: string;
    openCutoff: number | null; openRank: number | null;
    maxCutoff: number; minCutoff: number; rounds: Set<number>;
    seatTypes: Set<string>;
  };
  const byBranch = new Map<string, BranchAgg>();
  for (const c of cutoffs) {
    if (c.percentile == null) continue;
    let b = byBranch.get(c.branchCode);
    if (!b) {
      b = {
        code: c.branchCode, name: c.branch.name, group: c.branch.group,
        openCutoff: null, openRank: null, maxCutoff: -1, minCutoff: 101,
        rounds: new Set(), seatTypes: new Set(),
      };
      byBranch.set(c.branchCode, b);
    }
    b.rounds.add(c.capRound);
    b.seatTypes.add(c.seatTypeCode);
    b.maxCutoff = Math.max(b.maxCutoff, c.percentile);
    b.minCutoff = Math.min(b.minCutoff, c.percentile);
    const headline = c.category === "OPEN" && c.gender === "Gender-Neutral";
    if (headline) {
      // prefer Round 1, then earliest round; prefer State/HU level
      if (b.openCutoff == null || c.capRound === 1) {
        if (b.openCutoff == null || c.percentile > b.openCutoff) {
          b.openCutoff = c.percentile;
          b.openRank = c.meritRank;
        }
      }
    }
  }

  const branches = [...byBranch.values()]
    .map((b) => ({
      code: b.code, name: b.name, group: b.group,
      openCutoff: b.openCutoff, openRank: b.openRank,
      maxCutoff: b.maxCutoff < 0 ? null : b.maxCutoff,
      minCutoff: b.minCutoff > 100 ? null : b.minCutoff,
      rounds: [...b.rounds].sort(),
      seatTypeCount: b.seatTypes.size,
    }))
    .sort((a, b) => (b.openCutoff ?? b.maxCutoff ?? 0) - (a.openCutoff ?? a.maxCutoff ?? 0));

  const withOpen = branches.filter((b) => b.openCutoff != null);
  return {
    college,
    branchCount: branches.length,
    cutoffCount: cutoffs.length,
    highest: withOpen[0] ?? null,
    lowest: withOpen[withOpen.length - 1] ?? null,
    branches,
  };
}

export async function getBranchCutoffMatrix(branchCode: string) {
  const rows = await prisma.cutoff.findMany({
    where: { branchCode },
    select: {
      capRound: true, percentile: true, meritRank: true, category: true,
      gender: true, level: true, seatTypeCode: true, admissionType: true,
    },
    orderBy: [{ capRound: "asc" }, { percentile: "desc" }],
  });
  const branch = await prisma.branch.findUnique({
    where: { code: branchCode }, include: { college: true },
  });
  return { branch, rows };
}
