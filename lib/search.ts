import { prisma } from "./prisma";
import { CATEGORIES } from "./domain";

// ---- tiny fuzzy helpers -----------------------------------------------------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const STOP = new Set(["of", "and", "the", "for", "in", "to", "amp", "s"]);
function acronym(name: string): string {
  return name
    .split(/[^a-zA-Z]+/)
    .filter((w) => w && !STOP.has(w.toLowerCase()))
    .map((w) => w[0])
    .join("")
    .toLowerCase();
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

// token-aware fuzzy score 0..1
function fuzzy(query: string, target: string): number {
  const q = norm(query), t = norm(target);
  if (!q) return 0;
  if (t.includes(q)) return 1;
  const qt = q.split(" "), tt = t.split(" ");
  let hit = 0;
  for (const w of qt) {
    if (w.length < 2) continue;
    if (tt.some((x) => x.includes(w) || x === w)) { hit += 1; continue; }
    if (tt.some((x) => Math.abs(x.length - w.length) <= 2 && lev(x, w) <= (w.length > 5 ? 2 : 1))) hit += 0.8;
  }
  return hit / qt.length;
}

// ---- in-memory index (tiny: ~370 colleges, ~2k branches) --------------------
type Idx = {
  colleges: { code: string; name: string; region: string; district: string; acr: string }[];
  branchGroups: string[];
};
let _idx: Idx | null = null;
let _idxAt = 0;
async function index(): Promise<Idx> {
  if (_idx && Date.now() - _idxAt < 60_000) return _idx;
  const colleges = await prisma.college.findMany({
    select: { code: true, name: true, region: true, district: true },
  });
  _idx = {
    colleges: colleges.map((c) => ({ ...c, acr: acronym(c.name) })),
    branchGroups: [],
  };
  _idxAt = Date.now();
  return _idx;
}

// ---- query intent parsing ---------------------------------------------------
const CITY_WORDS = ["mumbai", "pune", "nagpur", "nashik", "amravati", "aurangabad",
  "sambhajinagar", "kolhapur", "solapur", "thane", "navi mumbai"];
const BRANCH_WORDS: [string, string][] = [
  ["cs", "Computer & IT"], ["cse", "Computer & IT"], ["comp", "Computer & IT"],
  ["it", "Computer & IT"], ["computer", "Computer & IT"], ["information", "Computer & IT"],
  ["ai", "AI & Data Science"], ["ds", "AI & Data Science"], ["data", "AI & Data Science"],
  ["ml", "AI & Data Science"], ["aiml", "AI & Data Science"],
  ["entc", "Electronics & Telecom"], ["extc", "Electronics & Telecom"],
  ["electronics", "Electronics & Telecom"], ["telecom", "Electronics & Telecom"],
  ["electrical", "Electrical"], ["mechanical", "Mechanical & Allied"], ["mech", "Mechanical & Allied"],
  ["civil", "Civil & Structural"], ["chemical", "Chemical & Process"],
  ["robotics", "Mechanical & Allied"], ["instrumentation", "Instrumentation"],
];

export type ParsedIntent = {
  percentile?: number;
  category?: string;
  region?: string;
  branchGroup?: string;
  collegeQuery?: string;
  raw: string;
};

export function parseIntent(raw: string): ParsedIntent {
  const low = " " + norm(raw) + " ";
  const out: ParsedIntent = { raw };
  const pm = raw.match(/(\d{1,2}(?:\.\d+)?)\s*(?:percentile|%ile|%|pct)?/i);
  if (pm && /percentile|%ile|%|pct/i.test(raw)) out.percentile = parseFloat(pm[1]);
  else if (pm && parseFloat(pm[1]) >= 30 && parseFloat(pm[1]) <= 100 && /\b(at|percentile|score)\b/i.test(raw))
    out.percentile = parseFloat(pm[1]);
  for (const c of CATEGORIES) if (low.includes(" " + c.toLowerCase() + " ")) out.category = c;
  if (/\bopen\b/i.test(raw)) out.category = "OPEN";
  for (const city of CITY_WORDS) if (low.includes(" " + city + " ")) {
    out.region = city === "aurangabad" || city === "sambhajinagar" ? "Chh. Sambhajinagar"
      : city.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  }
  for (const [w, g] of BRANCH_WORDS) if (low.includes(" " + w + " ")) { out.branchGroup = g; break; }
  // residual tokens → likely a college name/abbr
  let resid = low;
  for (const w of [...CITY_WORDS, ...BRANCH_WORDS.map((b) => b[0]), ...CATEGORIES.map((c) => c.toLowerCase()),
    "percentile", "best", "college", "colleges", "at", "in", "for", "category", "seats", "seat"])
    resid = resid.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
  resid = resid.replace(/\d+(\.\d+)?/g, " ").replace(/\s+/g, " ").trim();
  if (resid.length >= 2) out.collegeQuery = resid;
  return out;
}

export type CollegeHit = {
  code: string; name: string; region: string; district: string; score: number;
};

export async function searchColleges(q: string, limit = 12): Promise<CollegeHit[]> {
  const idx = await index();
  const nq = norm(q);
  const scored = idx.colleges.map((c) => {
    let s = fuzzy(q, c.name);
    if (c.acr.includes(nq) || nq === c.acr) s = Math.max(s, 0.95);
    if (nq.length >= 2 && c.acr.startsWith(nq)) s = Math.max(s, 0.85);
    return { code: c.code, name: c.name, region: c.region, district: c.district, score: s };
  });
  return scored.filter((c) => c.score > 0.35).sort((a, b) => b.score - a.score).slice(0, limit);
}
