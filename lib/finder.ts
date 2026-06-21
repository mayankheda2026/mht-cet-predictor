import { prisma } from "./prisma";
import type { Tier } from "./domain";
import { classify, scoreOption, sortOptions, type ScoreBreakdown } from "./ranking";
import { prestigeScore } from "./prestige";

export { classify } from "./ranking";

export type FinderInput = {
  percentile: number;
  category: string;
  gender: string; // "Gender-Neutral" | "Female"
  homeRegion?: string; // user's home-university region (for HU/OHU eligibility)
  admissionType: "MH" | "AI";
  branchGroups?: string[];
  region?: string; // preferred college region filter
  rounds?: number[]; // CAP rounds to consider (default: all)
  pwd?: boolean; // PWD (Person with Disability) seats instead of general seats
};

// How far ABOVE the student's percentile we still surface a college as a
// "reach"/Dream. margin = userPercentile - cutoff, so -5 means cutoffs up to
// 5 percentile points above the student are shown as ambitious-but-possible.
const REACH_FLOOR = -5;

export type FinderOption = {
  collegeCode: string;
  collegeName: string;
  region: string;
  district: string;
  funding: string;
  isGovernment: boolean;
  isAutonomous: boolean;
  isUniversityDept: boolean;
  branchCode: string;
  branchName: string;
  branchGroup: string;
  cutoffPercentile: number;
  cutoffRank: number | null;
  seatTypeCode: string;
  category: string;
  level: string;
  capRound: number;
  margin: number; // userPercentile - cutoff
  tier: Tier;
  scores: ScoreBreakdown; // 0–100 sub-scores + weighted match
  match: number; // == scores.match, convenience alias for sorting/display
};

// Reservation pools a candidate may be admitted under (they always also
// contest OPEN). Female candidates contest both Ladies and Gender-Neutral seats.
function eligibilityWhere(input: FinderInput) {
  const cats = input.category === "OPEN" ? ["OPEN"] : [input.category, "OPEN"];
  const genders = input.gender === "Female" ? ["Female", "Gender-Neutral"] : ["Gender-Neutral"];
  const rounds = input.rounds && input.rounds.length ? input.rounds : [1, 2, 3, 4];
  return {
    admissionType: input.admissionType,
    capRound: { in: rounds },
    percentile: { not: null },
    // Accuracy: a general candidate competes ONLY on general seats. PWD and
    // Defence seats carry much lower cutoffs and, since we keep the lowest
    // cutoff per college+branch, they otherwise masquerade as the real cutoff
    // and make colleges look far easier than they are.
    isPwd: input.pwd === true,
    isDefence: false,
    ...(input.admissionType === "MH"
      ? { category: { in: cats }, gender: { in: genders } }
      : {}),
  };
}

export async function findOptions(input: FinderInput): Promise<FinderOption[]> {
  const isHome = (region: string) => input.homeRegion && region === input.homeRegion;

  const rows = await prisma.cutoff.findMany({
    where: eligibilityWhere(input),
    select: {
      collegeCode: true, branchCode: true, capRound: true, percentile: true,
      meritRank: true, seatTypeCode: true, category: true, level: true, gender: true,
      college: {
        select: {
          name: true, region: true, district: true, funding: true,
          isGovernment: true, isAutonomous: true, isUniversityDept: true,
        },
      },
      branch: { select: { name: true, group: true } },
    },
  });

  // Best (lowest) eligible cutoff per (college,branch), respecting HU/OHU level rules.
  const best = new Map<string, FinderOption>();
  for (const r of rows) {
    if (r.percentile == null) continue;
    const region = r.college.region;
    // Level eligibility for MH seats:
    if (input.admissionType === "MH") {
      if (r.level === "Home University" && !isHome(region)) continue;
      if (r.level === "Other Than Home University" && isHome(region)) continue;
      // State Level + Minority are open to all; AI handled separately
    }
    if (input.region && region !== input.region) continue;
    if (input.branchGroups?.length && !input.branchGroups.includes(r.branch.group)) continue;

    const key = `${r.collegeCode}|${r.branchCode}`;
    const prev = best.get(key);
    if (!prev || r.percentile < prev.cutoffPercentile) {
      const margin = +(input.percentile - r.percentile).toFixed(4);
      const scores = scoreOption(
        {
          branchGroup: r.branch.group,
          cutoffPercentile: r.percentile,
          margin,
          region,
          isGovernment: r.college.isGovernment,
          isAutonomous: r.college.isAutonomous,
          isUniversityDept: r.college.isUniversityDept,
          funding: r.college.funding,
          prestige: prestigeScore(r.collegeCode),
        },
        { branchGroups: input.branchGroups, preferredRegion: input.region },
      );
      best.set(key, {
        collegeCode: r.collegeCode,
        collegeName: r.college.name,
        region,
        district: r.college.district,
        funding: r.college.funding,
        isGovernment: r.college.isGovernment,
        isAutonomous: r.college.isAutonomous,
        isUniversityDept: r.college.isUniversityDept,
        branchCode: r.branchCode,
        branchName: r.branch.name,
        branchGroup: r.branch.group,
        cutoffPercentile: r.percentile,
        cutoffRank: r.meritRank,
        seatTypeCode: r.seatTypeCode,
        category: r.category,
        level: r.level,
        capRound: r.capRound,
        margin,
        tier: classify(margin),
        scores,
        match: scores.match,
      });
    }
  }

  // Keep options within a sensible reach window (don't show impossible dreams),
  // then return them ranked by relevance (best match first). The "Best Matches"
  // shortlist is the head of this list; callers/UI can re-sort with sortOptions.
  const out = [...best.values()].filter((o) => o.margin >= REACH_FLOOR);
  return sortOptions(out, "match");
}

// "Best Matches" should always span the spectrum — a few aspirational reaches,
// the on-target sweet spot, and strong safe backups — instead of a pure
// match-ranked slice that structurally squeezes reaches out. We guarantee
// representation from each tier, then hand back a relevance-ranked blend the
// UI can re-sort.
export function curateBest(options: FinderOption[]): FinderOption[] {
  const b = bucket(options);
  const blend = [...b.dream.slice(0, 20), ...b.target.slice(0, 24), ...b.safe.slice(0, 40)];
  return sortOptions(blend, "match");
}

export function bucket(options: FinderOption[]) {
  return {
    dream: options.filter((o) => o.tier === "Dream"),
    target: options.filter((o) => o.tier === "Target"),
    safe: options.filter((o) => o.tier === "Safe"),
  };
}
