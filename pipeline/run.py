"""Run the full extraction pipeline across all 8 CAP PDFs.

Outputs (in ../extracted/):
  cutoffs.json        every normalized cutoff row (single source of truth)
  colleges.json       college master (code, name, status, region, district)
  branches.json       branch master (code, name, normalized branch group)
  validation.json     accuracy / coverage report
"""
import json
import os
import re
import glob
import sys
from collections import defaultdict, Counter

import extract_mh
import extract_ai
from regions import region_for_college, branch_group_for, clean_college_name

OUT = os.path.join(os.path.dirname(__file__), "..", "extracted")
RAW = os.path.join(os.path.dirname(__file__), "..", "data", "raw_pdfs")
ROUND_RE = re.compile(r"round\s*(\d)", re.I)


def main():
    all_rows = []
    report = {"files": [], "warnings": []}

    for path in sorted(glob.glob(os.path.join(RAW, "*.pdf"))):
        fn = os.path.basename(path)
        rnd = int(ROUND_RE.search(fn).group(1))
        is_ai = "AI" in fn
        print(f"[extract] {fn} (round {rnd}, {'AI' if is_ai else 'MH'})", flush=True)
        if is_ai:
            rows = extract_ai.extract(path, rnd)
            nb = len({r["branch_code"] for r in rows})
        else:
            rows, nb = extract_mh.extract(path, rnd)
        report["files"].append({"file": fn, "round": rnd,
                                "type": "AI" if is_ai else "MH",
                                "rows": len(rows), "branch_blocks": nb})
        all_rows.extend(rows)
        print(f"           -> {len(rows)} rows", flush=True)

    # --- Dedupe (same college/branch/round/seat/section/gender) -------------
    seen = {}
    deduped = []
    dups = 0
    for r in all_rows:
        key = (r["admission_type"], r["cap_round"], r["college_code"],
               r["branch_code"], r.get("seat_type_code"), r.get("section"),
               r.get("stage"))
        if key in seen:
            dups += 1
            # keep the worse (higher) rank = the closing cutoff
            prev = seen[key]
            if (r["merit_rank"] or 0) > (prev["merit_rank"] or 0):
                deduped[prev["_i"]] = r
                r["_i"] = prev["_i"]
                seen[key] = r
            continue
        r["_i"] = len(deduped)
        seen[key] = r
        deduped.append(r)
    for r in deduped:
        r.pop("_i", None)

    # --- Canonical names: most frequent variant per code (fixes column-wrap
    #     truncation/merge artefacts in multi-line names) ---------------------
    coll_names = defaultdict(Counter)
    branch_names = defaultdict(Counter)
    coll_status = {}
    for r in deduped:
        if r["college_code"] and r["college_name"]:
            coll_names[r["college_code"]][clean_college_name(r["college_name"])] += 1
        if r["branch_code"] and r["branch_name"]:
            branch_names[r["branch_code"]][r["branch_name"].strip()] += 1
        # capture richest (non-AI) status per college
        if r.get("status_raw") and r["college_code"] not in coll_status:
            coll_status[r["college_code"]] = r

    # Global vocabulary of complete (balanced-paren) branch names for
    # prefix-completion of always-wrapped variants.
    vocab = Counter()
    for c, ctr in branch_names.items():
        for n, k in ctr.items():
            if n.count("(") == n.count(")"):
                vocab[n] += k
    vocab_list = [n for n, _ in vocab.most_common()]

    def best_name(counter, complete=False):
        name = counter.most_common(1)[0][0]
        if complete and name.count("(") > name.count(")"):
            for cand in vocab_list:
                if cand.startswith(name) and len(cand) > len(name):
                    name = cand
                    break
            name += ")" * (name.count("(") - name.count(")"))  # balance source-truncated parens
        return name

    # --- Build college + branch masters ------------------------------------
    colleges = {}
    branches = {}
    for r in deduped:
        cc = r["college_code"]
        if cc and cc not in colleges:
            name = best_name(coll_names[cc]) if coll_names[cc] else clean_college_name(r["college_name"])
            region, district = region_for_college(cc, name)
            s = coll_status.get(cc, r)
            colleges[cc] = {
                "code": cc, "name": name,
                "funding": s.get("funding", "Unknown"),
                "is_government": bool(s.get("is_government")),
                "is_autonomous": bool(s.get("is_autonomous")),
                "is_university_dept": bool(s.get("is_university_dept")),
                "is_minority": bool(s.get("is_minority")),
                "minority_type": s.get("minority_type"),
                "home_university": s.get("home_university"),
                "region": region, "district": district,
            }
        bc = r["branch_code"]
        if bc and bc not in branches:
            bname = best_name(branch_names[bc], complete=True) if branch_names[bc] else r["branch_name"]
            branches[bc] = {
                "code": bc, "name": bname,
                "college_code": cc,
                "group": branch_group_for(bname),
            }

    # Propagate canonical names + college status onto every row.
    for r in deduped:
        if r["college_code"] in colleges:
            r["college_name"] = colleges[r["college_code"]]["name"]
        if r["branch_code"] in branches:
            r["branch_name"] = branches[r["branch_code"]]["name"]
            r["branch_group"] = branches[r["branch_code"]]["group"]

    # Backfill college status/region from MH onto AI-only colleges already handled.
    # Enrich AI rows missing funding using college master.
    for r in deduped:
        c = colleges.get(r["college_code"])
        if c:
            r.setdefault("region", c["region"])
            r.setdefault("district", c["district"])

    # --- Validation report --------------------------------------------------
    rank_ok = sum(1 for r in deduped if r["merit_rank"] is not None)
    pct_ok = sum(1 for r in deduped if r["percentile"] is not None)
    bad_pct = [r for r in deduped if r["percentile"] is not None and not (0 <= r["percentile"] <= 100)]
    no_cat = [r for r in deduped if not r.get("category")]
    pct_range_rank = [r for r in deduped
                      if r["merit_rank"] and r["percentile"]
                      and r["merit_rank"] < 200 and r["percentile"] < 50]

    report["summary"] = {
        "raw_rows": len(all_rows),
        "deduped_rows": len(deduped),
        "duplicates_collapsed": dups,
        "colleges": len(colleges),
        "branches": len(branches),
        "rows_with_rank": rank_ok,
        "rows_with_percentile": pct_ok,
        "rows_missing_rank": len(deduped) - rank_ok,
        "rows_missing_percentile": len(deduped) - pct_ok,
        "invalid_percentile_rows": len(bad_pct),
        "rows_without_category": len(no_cat),
        "by_admission_type": dict(Counter(r["admission_type"] for r in deduped)),
        "by_round": dict(Counter(r["cap_round"] for r in deduped)),
        "by_category": dict(Counter(r.get("category") for r in deduped)),
        "by_seat_level": dict(Counter(r.get("level") for r in deduped)),
        "by_gender": dict(Counter(r.get("gender") for r in deduped)),
        "by_region": dict(Counter(c["region"] for c in colleges.values())),
        "distinct_seat_type_codes": len({r.get("seat_type_code") for r in deduped}),
    }
    if bad_pct:
        report["warnings"].append(f"{len(bad_pct)} rows with out-of-range percentile")
    if no_cat:
        report["warnings"].append(f"{len(no_cat)} rows without a decoded category")

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "cutoffs.json"), "w") as f:
        json.dump(deduped, f)
    with open(os.path.join(OUT, "colleges.json"), "w") as f:
        json.dump(list(colleges.values()), f, indent=1)
    with open(os.path.join(OUT, "branches.json"), "w") as f:
        json.dump(list(branches.values()), f, indent=1)
    with open(os.path.join(OUT, "validation.json"), "w") as f:
        json.dump(report, f, indent=2)

    print("\n=== VALIDATION SUMMARY ===")
    print(json.dumps(report["summary"], indent=2))
    print("warnings:", report["warnings"])


if __name__ == "__main__":
    main()
