"""Seat-type code + institute-status decoding for MHT-CET CAP cutoff data.

Official legend (from the MH PDFs):
  Starting char  G = General (gender-neutral pool),  L = Ladies
  End char       H = Home University, O = Other Than Home University, S = State Level
  AI = All India Seat
Reservation cores: OPEN, SC, ST, VJ, NT1, NT2, NT3, OBC, SEBC
Special pools (no G/L gender): PWD (Persons With Disability), DEF (Defence)
Standalone schemes: TFWS (Tuition Fee Waiver), EWS, ORPHAN, MI (Minority)
A leading/embedded R marks the "Reserved" sub-pool (e.g. PWDRSCS, DEFRNT3S).
"""
import re

CATEGORY_CORES = ["OPEN", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "OBC", "SEBC"]
_CORE_RE = "|".join(sorted(CATEGORY_CORES, key=len, reverse=True))

CATEGORY_LABELS = {
    "OPEN": "Open", "SC": "Scheduled Caste (SC)", "ST": "Scheduled Tribe (ST)",
    "VJ": "VJ/DT-NT(A)", "NT1": "NT-B", "NT2": "NT-C", "NT3": "NT-D",
    "OBC": "OBC", "SEBC": "SEBC", "EWS": "EWS", "TFWS": "TFWS",
    "ORPHAN": "Orphan", "PWD": "PWD", "DEF": "Defence", "AI": "All India",
}

LEVEL_FROM_SECTION = {
    "State Level": "State Level",
    "Home University Seats Allotted to Home University Candidates": "Home University",
    "Other Than Home University Seats Allotted to Other Than Home University Candidates": "Other Than Home University",
    "Home University Seats": "Home University",
    "Other Than Home University Seats": "Other Than Home University",
    "Minority Seats": "Minority",
    "All India Seats": "All India",
}
LEVEL_FROM_SUFFIX = {"S": "State Level", "H": "Home University", "O": "Other Than Home University"}


def decode_seat(code, section=None):
    """Return a normalized dict for a raw seat-type column code.

    level is taken from the active section when available (most reliable,
    survives codes whose trailing suffix was truncated by column wrap),
    otherwise inferred from the trailing S/H/O suffix.
    """
    raw = code.strip().upper().replace("&", "")
    out = {
        "seat_type_code": code.strip(),
        "gender": "Gender-Neutral",
        "category": None,
        "is_pwd": False,
        "is_defence": False,
        "is_reserved": False,
        "is_tfws": False,
        "is_ews": False,
        "is_orphan": False,
        "is_minority": False,
        "level": LEVEL_FROM_SECTION.get(section) if section else None,
    }

    def finalize(cat):
        out["category"] = cat
        if out["level"] is None:
            suf = raw[-1] if raw and raw[-1] in LEVEL_FROM_SUFFIX else None
            out["level"] = LEVEL_FROM_SUFFIX.get(suf, "State Level")
        return out

    if raw in ("TFWS", "TFW"):
        out["is_tfws"] = True
        return finalize("TFWS")
    if raw == "EWS":
        out["is_ews"] = True
        return finalize("EWS")
    if raw.startswith("ORPHAN"):
        out["is_orphan"] = True
        return finalize("ORPHAN")
    if raw.startswith("MI"):
        out["is_minority"] = True
        return finalize("OPEN")

    work = raw
    # trailing level suffix
    if work and work[-1] in LEVEL_FROM_SUFFIX and not work.endswith(("SC", "OBC", "SEBC")):
        work = work[:-1]
    if work.startswith("PWD"):
        out["is_pwd"] = True
        work = work[3:]
    elif work.startswith("DEF"):
        out["is_defence"] = True
        work = work[3:]
    if work.startswith("G"):
        out["gender"] = "Gender-Neutral"
        work = work[1:]
    elif work.startswith("L"):
        out["gender"] = "Female"
        work = work[1:]
    if work.startswith("R"):
        out["is_reserved"] = True
        work = work[1:]

    m = re.match(rf"^({_CORE_RE})", work)
    cat = m.group(1) if m else (work or "OPEN")
    return finalize(cat)


# Institute funding / autonomy / minority status -------------------------------
def decode_status(text):
    """Parse a MH 'Status:' line into structured institute attributes."""
    t = (text or "").strip()
    home_univ = None
    m = re.search(r"Home University\s*:?\s*(.+)$", t)
    if m:
        home_univ = m.group(1).strip()
    head = re.split(r"Home University", t)[0].strip()

    funding = "Unknown"
    fmap = [
        ("Government Aided", "Government Aided"),
        ("Govt. Aided", "Government Aided"),
        ("University Department", "University Department"),
        ("University Managed", "University Managed"),
        ("Government", "Government"),
        ("Un-Aided", "Un-Aided Private"),
        ("Unaided", "Un-Aided Private"),
        ("Aided", "Aided"),
    ]
    for key, label in fmap:
        if key.lower() in head.lower():
            funding = label
            break

    is_autonomous = "autonomous" in head.lower()
    minority = None
    mm = re.search(r"(Linguistic Minority[^H]*|Religious Minority[^H]*|Minority[^H]*)", head)
    if mm:
        minority = mm.group(1).strip()
    if home_univ and home_univ.lower() == "autonomous institute":
        home_univ = None  # autonomous institutes are their own home university

    return {
        "funding": funding,
        "is_autonomous": is_autonomous,
        "is_government": funding in ("Government", "Government Aided", "University Department", "University Managed"),
        "is_university_dept": "University Department" in funding,
        "minority_type": minority,
        "is_minority": minority is not None,
        "home_university": home_univ,
        "status_raw": t,
    }
