// Shared domain constants for MHT-CET admission logic.

export const CATEGORIES = [
  "OPEN", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "OBC", "SEBC", "EWS", "TFWS", "ORPHAN",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<string, string> = {
  OPEN: "Open", SC: "SC", ST: "ST", VJ: "VJ / DT-NT(A)", NT1: "NT-B (NT1)",
  NT2: "NT-C (NT2)", NT3: "NT-D (NT3)", OBC: "OBC", SEBC: "SEBC", EWS: "EWS",
  TFWS: "TFWS", ORPHAN: "Orphan", AI: "All India",
};

export const GENDERS = ["Gender-Neutral", "Female"] as const;
export const REGIONS = [
  "Mumbai", "Pune", "Nagpur", "Nashik", "Chh. Sambhajinagar", "Amravati",
] as const;

export const ADMISSION_TYPES = ["MH", "AI"] as const;

export const BRANCH_GROUPS = [
  "Computer & IT", "AI & Data Science", "Electronics & Telecom", "Electrical",
  "Mechanical & Allied", "Civil & Structural", "Chemical & Process",
  "Instrumentation", "Bio & Food", "Aerospace & Marine", "Other Engineering",
] as const;

export const CAP_ROUNDS = [1, 2, 3, 4] as const;

export type Tier = "Dream" | "Target" | "Safe";

export const TIER_META: Record<Tier, { color: string; blurb: string }> = {
  Dream: { color: "grape", blurb: "Cutoff sits just above you — ambitious but worth a shot." },
  Target: { color: "sky", blurb: "Right in your range — realistic, well-matched options." },
  Safe: { color: "mint", blurb: "Comfortably within reach — strong backups you can rely on." },
};
