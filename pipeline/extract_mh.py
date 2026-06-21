"""Extract Maharashtra & Minority (MH) CAP-round cutoff matrices.

Each branch block looks like:
    01002 - Government College of Engineering, Amravati      <- college header (5-digit)
    0100219110 - Civil Engineering                           <- branch header (10-digit)
    Status:
    Government Autonomous Home University : Autonomous Institute
    State Level                                              <- section
    GOPENS GSCS GSTS ... EWS                                 <- category header row
    Stage
    I  37591 58518 ...                                       <- rank row (per stage)
       (88.95) (82.33) ...                                   <- percentile row
A branch may repeat the (section, header, ranks, pct) group up to 3x
(State Level / Home University / Other Than Home University).
"""
import re
import fitz
from collections import defaultdict
from seattype import decode_seat, decode_status, LEVEL_FROM_SECTION

ROMAN = {"I", "II", "III", "IV", "V", "VI"}
SECTIONS = set(LEVEL_FROM_SECTION.keys())
COLLEGE_RE = re.compile(r"^(\d{4,5})\s*-\s*(.+)$")
BRANCH_RE = re.compile(r"^(\d{10})\s*-\s*(.+)$")
PCT_RE = re.compile(r"^\(?(\d{1,3}\.\d+)\)?$")
RANK_RE = re.compile(r"^\d{1,6}$")


def _rows(page, ytol=3):
    """Cluster page words into visual rows: list of (y, [(x, text), ...])."""
    words = page.get_text("words")
    buckets = []
    for x0, y0, x1, y1, txt, *_ in words:
        if not txt.strip():
            continue
        placed = False
        for b in buckets:
            if abs(b["y"] - y0) <= ytol:
                b["items"].append((x0, txt))
                b["y"] = (b["y"] * b["n"] + y0) / (b["n"] + 1)
                b["n"] += 1
                placed = True
                break
        if not placed:
            buckets.append({"y": y0, "n": 1, "items": [(x0, txt)]})
    buckets.sort(key=lambda b: b["y"])
    return [(b["y"], sorted(b["items"])) for b in buckets]


def _is_header(items):
    caps = [t for _, t in items if re.fullmatch(r"[A-Z][A-Z0-9&]{1,11}", t)]
    return len(caps) >= 4 and any("OPEN" in t or t in ("EWS", "TFWS", "ORPHAN") for t in caps)


def _map_by_x(headers, cells, tol=26):
    """Map header (x,code) -> cell value, aligning by x position.
    If counts match, zip in x-order (robust); else nearest-x within tol."""
    if not headers:
        return {}
    if len(headers) == len(cells):
        return {h[1]: c[1] for h, c in zip(sorted(headers), sorted(cells))}
    out = {}
    used = set()
    for hx, code in headers:
        best, bestd = None, tol + 1
        for i, (cx, val) in enumerate(cells):
            if i in used:
                continue
            d = abs(cx - hx)
            if d < bestd:
                best, bestd, bi = val, d, i
        if best is not None:
            out[code] = best
            used.add(bi)
    return out


def extract(path, cap_round):
    doc = fitz.open(path)
    records = []
    college = {"code": None, "name": None}
    status = {}
    branch = {"code": None, "name": None}
    section = None
    header = None  # list[(x, code)]
    n_branches = 0

    for pi in range(doc.page_count):
        rows = _rows(doc[pi])
        i = 0
        while i < len(rows):
            y, items = rows[i]
            line = " ".join(t for _, t in items).strip()
            first_x = items[0][0] if items else 999

            # --- College header (5-digit, left margin) ---
            mcol = COLLEGE_RE.match(line)
            if mcol and len(mcol.group(1)) == 5 and first_x < 30 and not BRANCH_RE.match(line):
                college = {"code": mcol.group(1), "name": mcol.group(2).strip()}
                i += 1
                continue

            # --- Branch header (10-digit) ---
            mbr = BRANCH_RE.match(line)
            if mbr and first_x < 35:
                branch = {"code": mbr.group(1), "name": mbr.group(2).strip()}
                section, header = None, None
                n_branches += 1
                i += 1
                continue

            # --- Status text ---
            if "Home University :" in line or ("Status" in line and ":" in line and len(line) > 12):
                if "Home University :" in line:
                    status = decode_status(line)
                i += 1
                continue

            # --- Section line ---
            if line in SECTIONS:
                section = line
                i += 1
                continue

            # --- Category header row ---
            if _is_header(items):
                header = [(x, t) for x, t in items if re.fullmatch(r"[A-Z][A-Z0-9&]{1,11}", t)]
                i += 1
                continue

            # --- Stage rank row: roman numeral then integers ---
            if items and items[0][1] in ROMAN and header:
                stage = items[0][1]
                ranks = [(x, t) for x, t in items[1:] if RANK_RE.match(t)]
                # percentile row is the next row
                pcts = []
                if i + 1 < len(rows):
                    pcts = [(x, m.group(1)) for x, t in rows[i + 1][1]
                            if (m := PCT_RE.match(t))]
                rank_map = _map_by_x(header, ranks)
                pct_map = _map_by_x(header, pcts)
                for hx, code in header:
                    rk = rank_map.get(code)
                    pc = pct_map.get(code)
                    if rk is None and pc is None:
                        continue
                    seat = decode_seat(code, section)
                    records.append({
                        "admission_type": "MH",
                        "cap_round": cap_round,
                        "college_code": college["code"],
                        "college_name": college["name"],
                        "branch_code": branch["code"],
                        "branch_name": branch["name"],
                        "section": section,
                        "stage": stage,
                        "merit_rank": int(rk) if rk else None,
                        "percentile": float(pc) if pc else None,
                        "exam": "MHT-CET",
                        **status,
                        **seat,
                    })
                i += 2 if pcts else 1
                continue
            i += 1

    doc.close()
    return records, n_branches
