import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
import { prestigeScore, prestigeTier, type PrestigeTier } from "./prestige";

export type ExploreFilters = {
  pctMin?: number; pctMax?: number;
  rankMin?: number; rankMax?: number;
  collegeCode?: string;
  branchGroups?: string[];
  categories?: string[];
  genders?: string[];
  rounds?: number[];
  admissionType?: string; // MH | AI | ""
  levels?: string[]; // Home University | Other Than Home University | State Level | All India
  regions?: string[];
  districts?: string[];
  funding?: string[];
  government?: boolean;
  autonomous?: boolean;
  universityDept?: boolean;
  minority?: boolean;
  tfws?: boolean;
  ews?: boolean;
  seatType?: string;
  sort?: "pct_desc" | "pct_asc" | "rank_asc" | "college";
  page?: number;
  pageSize?: number;
};

export async function exploreCutoffs(f: ExploreFilters) {
  const where: Prisma.CutoffWhereInput = { percentile: { not: null } };
  const and: Prisma.CutoffWhereInput[] = [];

  if (f.pctMin != null || f.pctMax != null)
    where.percentile = { gte: f.pctMin ?? 0, lte: f.pctMax ?? 100 };
  if (f.rankMin != null || f.rankMax != null)
    where.meritRank = { gte: f.rankMin ?? 0, lte: f.rankMax ?? 9_999_999 };
  if (f.collegeCode) where.collegeCode = f.collegeCode;
  if (f.categories?.length) where.category = { in: f.categories };
  if (f.genders?.length) where.gender = { in: f.genders };
  if (f.rounds?.length) where.capRound = { in: f.rounds };
  if (f.admissionType) where.admissionType = f.admissionType;
  if (f.levels?.length) where.level = { in: f.levels };
  if (f.seatType) where.seatTypeCode = f.seatType;
  if (f.tfws) where.isTfws = true;
  if (f.ews) where.isEws = true;
  if (f.minority) where.isMinority = true;

  const collegeWhere: Prisma.CollegeWhereInput = {};
  if (f.regions?.length) collegeWhere.region = { in: f.regions };
  if (f.districts?.length) collegeWhere.district = { in: f.districts };
  if (f.funding?.length) collegeWhere.funding = { in: f.funding };
  if (f.government) collegeWhere.isGovernment = true;
  if (f.autonomous) collegeWhere.isAutonomous = true;
  if (f.universityDept) collegeWhere.isUniversityDept = true;
  if (f.minority) collegeWhere.isMinority = true;
  if (Object.keys(collegeWhere).length) where.college = collegeWhere;

  if (f.branchGroups?.length) where.branch = { group: { in: f.branchGroups } };
  if (and.length) where.AND = and;

  const orderBy: Prisma.CutoffOrderByWithRelationInput[] =
    f.sort === "pct_asc" ? [{ percentile: "asc" }]
    : f.sort === "rank_asc" ? [{ meritRank: "asc" }]
    : f.sort === "college" ? [{ collegeCode: "asc" }]
    : [{ percentile: "desc" }];

  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(100, f.pageSize ?? 40);

  const [total, rows] = await Promise.all([
    prisma.cutoff.count({ where }),
    prisma.cutoff.findMany({
      where, orderBy, skip: (page - 1) * pageSize, take: pageSize,
      select: {
        id: true, percentile: true, meritRank: true, category: true, gender: true,
        level: true, seatTypeCode: true, admissionType: true, capRound: true,
        collegeCode: true, branchCode: true,
        college: { select: { name: true, region: true, district: true, funding: true, isGovernment: true } },
        branch: { select: { name: true, group: true } },
      },
    }),
  ]);
  return { total, page, pageSize, rows, pages: Math.ceil(total / pageSize) };
}

export async function facets() {
  const [regions, districts, funding] = await Promise.all([
    prisma.college.findMany({ distinct: ["region"], select: { region: true }, orderBy: { region: "asc" } }),
    prisma.college.findMany({ distinct: ["district"], select: { district: true }, orderBy: { district: "asc" } }),
    prisma.college.findMany({ distinct: ["funding"], select: { funding: true }, orderBy: { funding: "asc" } }),
  ]);
  return {
    regions: regions.map((r) => r.region),
    districts: districts.map((d) => d.district),
    funding: funding.map((f) => f.funding),
  };
}

export type TopCollege = {
  code: string; name: string; region: string; funding: string;
  isGovernment: boolean; isAutonomous: boolean;
  peak: number; prestige: number; tier: PrestigeTier;
};

export async function topColleges(limit = 24): Promise<TopCollege[]> {
  // Rank colleges high→low by their strongest real CAP closing cutoff (the
  // objective figure straight from the official round PDFs). We count OPEN and
  // All-India seats across both Gender-Neutral and Ladies pools so women-only
  // colleges are ranked on their genuine selectivity, and we attach the prestige
  // tier (lib/prestige.ts) purely as a label/tiebreak — never to reorder cutoffs.
  const rows = await prisma.cutoff.findMany({
    where: { category: { in: ["OPEN", "AI"] }, percentile: { not: null } },
    select: { collegeCode: true, percentile: true, college: { select: { name: true, region: true, funding: true, isGovernment: true, isAutonomous: true } } },
  });
  const best = new Map<string, TopCollege>();
  for (const r of rows) {
    if (r.percentile == null) continue;
    const cur = best.get(r.collegeCode);
    if (!cur || r.percentile > cur.peak) {
      const prestige = prestigeScore(r.collegeCode);
      best.set(r.collegeCode, {
        code: r.collegeCode, name: r.college.name, region: r.college.region,
        funding: r.college.funding, isGovernment: r.college.isGovernment,
        isAutonomous: r.college.isAutonomous, peak: r.percentile,
        prestige, tier: prestigeTier(prestige),
      });
    }
  }
  return [...best.values()]
    .sort((a, b) => b.peak - a.peak || b.prestige - a.prestige)
    .slice(0, limit);
}
