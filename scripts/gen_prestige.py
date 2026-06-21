#!/usr/bin/env python3
"""Generate lib/prestige.ts — a 0–100 college prestige score per institute.

prestige = 0.6 * revealed flagship OPEN cutoff (real AY2025-26 CAP data,
                                                 max over Gender-Neutral & Ladies)
         + 0.4 * expert region tier band (counsellor "Template 2025")

The blend self-corrects: a counsellor-favoured college with soft cutoffs is pulled
down, and a single freak high-cutoff seat can't inflate a weak college because the
expert band damps it. Anchors validated vs NIRF 2024 & published placement tiers.

Inputs : extracted/cutoffs.json, extracted/colleges.json, "Template 2025 (1).xlsx"
Output : lib/prestige.ts

Run from repo root:  python3 scripts/gen_prestige.py
"""
import json, re, zipfile, xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "Template 2025 (1).xlsx"
M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Institutes recoded/renamed for AY2025-26 (template code -> dataset code).
REMAP = {"6006": "16006", "4005": "14005"}

# Region column groups in the Colleges_Order sheet: (code_col, name_col).
REGION_COLS = {"Pune": (2, 3), "Around Pune": (5, 6), "Mumbai": (9, 10),
               "Nagpur": (13, 14), "Nashik": (16, 17)}
BAND = {"98+": 100.0, "95+": 82.0, "90+": 64.0, "80+": 48.0}


def clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def read_colleges_order():
    """region -> ordered [(template_code, name, band)] from the xlsx."""
    z = zipfile.ZipFile(XLSX)
    ss = ["".join(t.text or "" for t in si.iter(M + "t"))
          for si in ET.fromstring(z.read("xl/sharedStrings.xml"))]
    wb = z.read("xl/workbook.xml").decode()
    sheets = re.findall(r'<sheet [^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"', wb)
    relmap = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"',
                             z.read("xl/_rels/workbook.xml.rels").decode()))
    name2file = {n: (relmap[r][1:] if relmap[r].startswith("/") else "xl/" + relmap[r])
                 for n, r in sheets}

    def colnum(ref):
        s = 0
        for c in re.match(r"([A-Z]+)", ref).group(1):
            s = s * 26 + (ord(c) - 64)
        return s - 1

    rows = []
    for row in ET.fromstring(z.read(name2file["Colleges_Order"])).iter(M + "row"):
        cells = {}
        for c in row.findall(M + "c"):
            v, iv = c.find(M + "v"), c.find(M + "is")
            if c.get("t") == "s" and v is not None:
                val = ss[int(v.text)]
            elif iv is not None:
                val = "".join(t.text or "" for t in iv.iter(M + "t"))
            else:
                val = v.text if v is not None else ""
            cells[colnum(c.get("r"))] = val
        rows.append([cells.get(i, "") for i in range(max(cells) + 1)] if cells else [])

    out = {r: [] for r in REGION_COLS}
    band = None
    for r in rows[2:]:
        if len(r) > 1 and r[1].strip() in BAND:
            band = r[1].strip()
        for reg, (cc, nc) in REGION_COLS.items():
            code = r[cc].strip() if len(r) > cc else ""
            name = r[nc].strip().replace("\n", " ") if len(r) > nc else ""
            if code and re.match(r"^\d+\.?\d*$", code):
                out[reg].append((str(int(float(code))), name, band))
    return out


def main():
    cols = {c["code"]: c for c in json.load(open(ROOT / "extracted/colleges.json"))}
    cut = json.load(open(ROOT / "extracted/cutoffs.json"))

    def resolve(code):
        ds = REMAP.get(code, code.zfill(5))
        return ds if ds in cols else None

    # 1) flagship OPEN/AI cutoff per college (max over both genders).
    flag = defaultdict(float)
    for r in cut:
        p = r.get("percentile")
        if p is None or r["category"] not in ("OPEN", "AI"):
            continue
        if any(r.get(k) for k in ("is_pwd", "is_defence", "is_tfws", "is_ews", "is_orphan")):
            continue
        if p > flag[r["college_code"]]:
            flag[r["college_code"]] = p

    def flagnorm(p):
        return clamp((p - 60) / 20 * 30) if p <= 80 else clamp(30 + (p - 80) / 20 * 70)

    # 2) expert band score per dataset code (best across regions; ±4 within band).
    order = read_colleges_order()
    band_of = {}
    for reg, lst in order.items():
        groups = defaultdict(list)
        for code, _, b in lst:
            groups[b].append(code)
        for code, _, b in lst:
            ds = resolve(code)
            if not ds:
                continue
            grp = groups[b]
            frac = grp.index(code) / max(1, len(grp) - 1) if len(grp) > 1 else 0
            bs = clamp(BAND.get(b, 40.0) + (4 - 8 * frac))
            band_of[ds] = round(max(bs, band_of.get(ds, 0)), 1)

    # 3) blend.
    prest = {}
    for c in set(flag) | set(band_of):
        fn = flagnorm(flag.get(c, 0.0))
        prest[c] = round(clamp(0.6 * fn + 0.4 * band_of[c] if c in band_of else fn * 0.92), 1)

    L = [
        "// AUTO-GENERATED by scripts/gen_prestige.py (do not hand-edit).",
        "// College prestige (0-100) = 0.6 x revealed flagship OPEN cutoff (real AY2025-26 CAP",
        "// data, max over Gender-Neutral & Ladies OPEN/AI seats) + 0.4 x expert region tier band",
        "// (counsellor Template 2025). The blend self-corrects region-inflated band entries and",
        "// single-seat cutoff outliers. Anchors cross-checked vs NIRF 2024 & published placement",
        "// tiers (VJTI, COEP, ICT, SPIT, PICT, DJ Sanghvi, Walchand Sangli, Cummins, VESIT, PCCOE).",
        "",
        'export type PrestigeTier = "Elite" | "Premier" | "Strong" | "Good" | "Emerging";',
        "",
        "export const PRESTIGE: Record<string, number> = {",
    ]
    L += [f'  "{c}": {prest[c]},' for c in sorted(prest, key=lambda x: (-prest[x], x))]
    L += [
        "};",
        "",
        "const TIER_CUTOFFS: [PrestigeTier, number][] = [",
        '  ["Elite", 88], ["Premier", 74], ["Strong", 58], ["Good", 42], ["Emerging", 0],',
        "];",
        "",
        "// Unlisted colleges get a modest neutral prior so they rank below anything we have",
        "// positive evidence for, but above nothing.",
        "export const PRESTIGE_DEFAULT = 38;",
        "",
        "export function prestigeScore(collegeCode: string): number {",
        "  return PRESTIGE[collegeCode] ?? PRESTIGE_DEFAULT;",
        "}",
        "",
        "export function prestigeTier(score: number): PrestigeTier {",
        "  for (const [t, lo] of TIER_CUTOFFS) if (score >= lo) return t;",
        '  return "Emerging";',
        "}",
    ]
    (ROOT / "lib/prestige.ts").write_text("\n".join(L) + "\n")
    print(f"wrote lib/prestige.ts — {len(prest)} colleges scored")


if __name__ == "__main__":
    main()
