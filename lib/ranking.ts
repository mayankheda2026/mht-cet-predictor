// Shared, framework-agnostic ranking & scoring for the college finder.
//
// This module is intentionally PURE (no Prisma / no React) so the exact same
// scoring and sorting logic can run on the server (lib/finder.ts) and in the
// browser (components/Finder.tsx) — there is a single source of truth and no
// duplicated comparators. Everything here is O(1) per option; sorting is the
// only super-linear step and stays O(n log n), comfortably handling 1000+ rows.

import type { Tier } from "./domain";
import { prestigeTier, type PrestigeTier } from "./prestige";

// ---------------------------------------------------------------------------
// Tunable constants
// ---------------------------------------------------------------------------

// Dream / Target / Safe are decided by a symmetric buffer around the user's
// percentile. cutoff within ±BUFFER of the user → "Target".
export const TARGET_BUFFER = 0.5;

// Best-Match weighting. Components are each normalised to 0–100 *before* this
// weighted sum, so the percentages below are meaningful (a naive
// `100 - abs(diff)` mixes incomparable scales and silently over-weights cutoff).
export const MATCH_WEIGHTS = {
  branch: 0.4, // does the branch match what the student wants / is it in-demand
  reputation: 0.3, // institutional strength from the signals we actually have
  closeness: 0.2, // how well the cutoff fits the student's percentile
  location: 0.1, // preferred city / metro pull
} as const;

// Intrinsic branch demand (placement pull + competitiveness). Used to rank
// branches relative to each other; normalised against MAX_DESIRABILITY.
export const BRANCH_DESIRABILITY: Record<string, number> = {
  "Computer & IT": 2.2,
  "AI & Data Science": 2.0,
  "Electronics & Telecom": 1.3,
  Electrical: 1.0,
  "Mechanical & Allied": 0.9,
  "Chemical & Process": 0.9,
  "Aerospace & Marine": 0.8,
  Instrumentation: 0.7,
  "Civil & Structural": 0.7,
  "Bio & Food": 0.6,
  "Other Engineering": 0.4,
};
const MAX_DESIRABILITY = 2.2;

// Small civic nudge on top of prestige: public / university institutions carry
// real student value (far lower fees, public accountability) that a pure
// competitiveness signal misses. Kept deliberately small so it only breaks ties
// between colleges of comparable prestige — it never lifts a weak college over a
// genuinely stronger private one (PICT, DJ Sanghvi, SPIT all outrank most govt).
const CIVIC_BONUS: Record<string, number> = {
  Government: 8,
  "University Department": 6,
  "University Managed": 5,
  "Un-Aided Private": 0,
  Unknown: 0,
};

// Soft metro pull used only when the student has NOT pinned a region.
const METRO_PRIORITY: Record<string, number> = {
  Mumbai: 100,
  Pune: 95,
  Nagpur: 72,
  Nashik: 66,
  "Chh. Sambhajinagar": 60,
  Amravati: 58,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScoreInput = {
  branchGroup: string;
  cutoffPercentile: number;
  margin: number; // userPercentile - cutoffPercentile
  region: string;
  isGovernment: boolean;
  isAutonomous: boolean;
  isUniversityDept: boolean;
  funding: string;
  prestige: number; // 0–100 college prestige (lib/prestige.ts)
};

export type ScorePrefs = {
  branchGroups?: string[]; // branches the student prefers (empty = no preference)
  preferredRegion?: string; // pinned city (empty = no preference)
};

export type ScoreBreakdown = {
  branch: number;
  reputation: number;
  closeness: number;
  location: number;
  match: number; // weighted blend of the four, 0–100
  prestige: number; // 0–100 college prestige (carried through for display & tiebreaks)
  prestigeTier: PrestigeTier;
};

export type SortMode = "cutoff" | "prestige" | "match" | "alpha";
// Default to the objective truth from the CAP PDFs: highest closing cutoff first.
export const DEFAULT_SORT: SortMode = "cutoff";

// ---------------------------------------------------------------------------
// Component scores — each returns 0–100
// ---------------------------------------------------------------------------

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function branchScore(group: string, prefs: ScorePrefs): number {
  const base = clamp(((BRANCH_DESIRABILITY[group] ?? 0.4) / MAX_DESIRABILITY) * 100);
  const wanted = prefs.branchGroups;
  if (!wanted || wanted.length === 0) return base; // no preference → intrinsic demand
  // Matched preferences land in 70–100 (still ordered by intrinsic demand so
  // CS outranks Mechanical among the chosen); non-matches are damped down.
  return wanted.includes(group) ? clamp(70 + base * 0.3) : clamp(base * 0.5);
}

export function reputationScore(o: ScoreInput): number {
  // College prestige (lib/prestige.ts) is the strongest reputation signal we
  // have: it fuses each college's *revealed* flagship OPEN cutoff (the market's
  // verdict, straight from the real 2025-26 CAP data) with an expert-curated
  // region tier band, cross-checked against NIRF and published placement tiers.
  // We anchor reputation on it and add only the small civic nudge above.
  const civic = (CIVIC_BONUS[o.funding] ?? 0) + (o.isAutonomous ? 4 : 0);
  return clamp(o.prestige * 0.9 + civic);
}

// Asymmetric on purpose: a cutoff you clear and sit close to is the sweet spot;
// a "dream" the same distance away is discounted because admission isn't assured.
export function closenessScore(margin: number): number {
  const base = clamp(100 - Math.abs(margin) * 6);
  return margin < 0 ? base * 0.6 : base;
}

export function locationScore(region: string, prefs: ScorePrefs): number {
  if (prefs.preferredRegion) return region === prefs.preferredRegion ? 100 : 30;
  return METRO_PRIORITY[region] ?? 55;
}

export function scoreOption(o: ScoreInput, prefs: ScorePrefs): ScoreBreakdown {
  const branch = branchScore(o.branchGroup, prefs);
  const reputation = reputationScore(o);
  const closeness = closenessScore(o.margin);
  const location = locationScore(o.region, prefs);
  const match = clamp(
    branch * MATCH_WEIGHTS.branch +
      reputation * MATCH_WEIGHTS.reputation +
      closeness * MATCH_WEIGHTS.closeness +
      location * MATCH_WEIGHTS.location,
  );
  return {
    branch: round1(branch),
    reputation: round1(reputation),
    closeness: round1(closeness),
    location: round1(location),
    match: round1(match),
    prestige: round1(o.prestige),
    prestigeTier: prestigeTier(o.prestige),
  };
}

export function classify(margin: number): Tier {
  if (margin < -TARGET_BUFFER) return "Dream"; // cutoff > user + buffer
  if (margin <= TARGET_BUFFER) return "Target"; // within ±buffer
  return "Safe"; // cutoff < user - buffer
}

// ---------------------------------------------------------------------------
// Sorting — one comparator table, reused everywhere
// ---------------------------------------------------------------------------

// Minimal shape a row needs to be ranked. FinderOption satisfies this.
export type Rankable = {
  cutoffPercentile: number;
  collegeName: string;
  branchName: string;
  scores: ScoreBreakdown;
};

type Cmp<T> = (a: T, b: T) => number;

const byCutoff: Cmp<Rankable> = (a, b) =>
  b.cutoffPercentile - a.cutoffPercentile || // 1° highest cutoff
  b.scores.prestige - a.scores.prestige || // 2° college prestige
  b.scores.match - a.scores.match; // 3° best match

const byMatch: Cmp<Rankable> = (a, b) =>
  b.scores.match - a.scores.match ||
  b.scores.prestige - a.scores.prestige ||
  b.cutoffPercentile - a.cutoffPercentile;

// Pure prestige order — the genuinely strongest colleges first, regardless of
// how the cutoff happens to fit. Closeness still breaks ties so an attainable
// option edges out an identical-prestige long-shot.
const byPrestige: Cmp<Rankable> = (a, b) =>
  b.scores.prestige - a.scores.prestige ||
  b.scores.closeness - a.scores.closeness ||
  b.cutoffPercentile - a.cutoffPercentile;

const byAlpha: Cmp<Rankable> = (a, b) =>
  a.collegeName.localeCompare(b.collegeName) || a.branchName.localeCompare(b.branchName);

const COMPARATORS: Record<SortMode, Cmp<Rankable>> = {
  match: byMatch,
  prestige: byPrestige,
  cutoff: byCutoff,
  alpha: byAlpha,
};

export function comparator(mode: SortMode): Cmp<Rankable> {
  return COMPARATORS[mode] ?? byCutoff;
}

/** Returns a NEW sorted array; never mutates the input. */
export function sortOptions<T extends Rankable>(options: readonly T[], mode: SortMode): T[] {
  return [...options].sort(comparator(mode));
}

export const SORT_LABELS: Record<SortMode, string> = {
  cutoff: "Highest Cutoff",
  prestige: "Top Colleges",
  match: "Best Match",
  alpha: "Alphabetical",
};
