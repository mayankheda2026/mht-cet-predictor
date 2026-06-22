// Category-wise college fees for the top-100 MHT-CET engineering colleges.
//
// Data model (important — read before trusting the numbers):
//   • Maharashtra colleges have ONE FRA-approved annual tuition fee. That single
//     per-college number (researched from official college / FRA / DTE sources,
//     latest AY available) is the only real variable.
//   • "Category-wise fees" are NOT separate sticker prices — they are that fee
//     minus the standard government scholarship/freeship concession for the
//     student's category (and income ≤ ₹8L). So every category column below is
//     COMPUTED from the real tuition + development fee via a documented factor.
//   • Figures are the annual tuition + development component. Exam, university and
//     refundable deposit charges (~₹5k–₹20k) are extra and broadly the same for
//     all categories. confidence/year/source are carried per college so the page
//     can be honest about how solid each number is.
//
// Raw fee data lives in data/fees.json (generated from research, prestige-ranked).

import feesRaw from "@/data/fees.json";

export type FeeConfidence = "high" | "medium" | "low" | "none";

export type CollegeFee = {
  code: string;
  name: string;
  funding: string;
  isGovernment: boolean;
  isAutonomous: boolean;
  region: string;
  district: string;
  prestige: number | null;
  prestigeRank: number | null;
  tuition: number | null; // annual tuition fee (OPEN, full)
  development: number | null; // annual development fee, if separately published
  year: string | null; // academic year the figure is for
  confidence: FeeConfidence;
  sourceType: string;
  sourceUrl: string;
  note: string;
};

export const FEES = feesRaw as CollegeFee[];

// --- Category concession model (Maharashtra govt scholarship / freeship schemes) ---
// payable = (tuition + development) × factor, for income-eligible students (≤ ₹8L).
export type FeeCategory = {
  key: string;
  label: string;
  factor: number; // fraction of the tuition+development base the student actually pays
  scheme: string;
};

export const FEE_CATEGORIES: FeeCategory[] = [
  { key: "OPEN", label: "OPEN", factor: 1.0, scheme: "Full fee — no concession" },
  { key: "EWS", label: "EWS", factor: 0.5, scheme: "EBC 50% tuition waiver · income ≤ ₹8L" },
  { key: "OBC", label: "OBC", factor: 0.5, scheme: "Rajarshi Shahu 50% waiver · income ≤ ₹8L" },
  { key: "SEBC", label: "SEBC", factor: 0.5, scheme: "50% tuition waiver · income ≤ ₹8L" },
  { key: "SBC", label: "SBC", factor: 0.5, scheme: "50% tuition waiver · income ≤ ₹8L" },
  { key: "VJ", label: "VJ/DT", factor: 0.5, scheme: "50% tuition waiver · income ≤ ₹8L" },
  { key: "NTB", label: "NT-B", factor: 0.5, scheme: "50% tuition waiver · income ≤ ₹8L" },
  { key: "NTC", label: "NT-C", factor: 0.5, scheme: "50% tuition waiver · income ≤ ₹8L" },
  { key: "NTD", label: "NT-D", factor: 0.5, scheme: "50% tuition waiver · income ≤ ₹8L" },
  { key: "TFWS", label: "TFWS", factor: 0.0, scheme: "Tuition Fee Waiver Scheme · income ≤ ₹8L" },
  { key: "SC", label: "SC", factor: 0.0, scheme: "100% freeship — full tuition waiver" },
  { key: "ST", label: "ST", factor: 0.0, scheme: "100% freeship — full tuition waiver" },
];

/** Tuition + development = the fee the government concession is applied to. */
export function feeBase(f: CollegeFee): number | null {
  if (f.tuition == null) return null;
  return f.tuition + (f.development ?? 0);
}

/** Annual payable for a category, computed from the real fee via its concession factor. */
export function categoryFee(f: CollegeFee, factor: number): number | null {
  const base = feeBase(f);
  if (base == null) return null;
  return Math.round(base * factor);
}

export function inr(n: number | null | undefined): string {
  if (n == null) return "—";
  return "₹" + n.toLocaleString("en-IN");
}

export const CONFIDENCE_LABEL: Record<FeeConfidence, string> = {
  high: "Official",
  medium: "Verified",
  low: "Estimate",
  none: "N/A",
};
