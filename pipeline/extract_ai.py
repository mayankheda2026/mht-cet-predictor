"""Extract All-India (AI) CAP-round cutoff rows.

Columnar layout (x-bands), one record per choice code:
  Sr.No(~65) | Merit(~97) Pct(~119) | ChoiceCode(~181) |
  Institute(~235-470) | Course(~510-615) | Exam(~660) | Type(~720) | SeatType(~790)
Course & institute names may wrap across two text lines within a record band.
"""
import re
import fitz

CHOICE_RE = re.compile(r"^\d{10}$")
MERITPCT_RE = re.compile(r"^(\d{1,7})$")
PCT_RE = re.compile(r"^\((\d{1,3}\.\d+)\)$")


def extract(path, cap_round):
    doc = fitz.open(path)
    records = []
    for pi in range(doc.page_count):
        words = [w for w in doc[pi].get_text("words") if w[4].strip()]
        # anchors = choice codes in the choice-code column
        anchors = sorted([(w[1], w[0], w[4]) for w in words
                          if 170 <= w[0] <= 200 and CHOICE_RE.match(w[4])])
        if not anchors:
            continue
        # vertical band boundaries between successive anchors
        ys = [a[0] for a in anchors]
        bounds = []
        for k in range(len(ys)):
            top = (ys[k - 1] + ys[k]) / 2 if k > 0 else ys[k] - 14
            bot = (ys[k] + ys[k + 1]) / 2 if k + 1 < len(ys) else ys[k] + 16
            bounds.append((top, bot))

        for (top, bot), (ay, ax, choice) in zip(bounds, anchors):
            band = [w for w in words if top <= w[1] < bot]

            def col(lo, hi):
                return [w for w in band if lo <= w[0] < hi]

            def joined(lo, hi):
                ws = sorted(col(lo, hi), key=lambda w: (round(w[1] / 4), w[0]))
                return " ".join(w[4] for w in ws).strip()

            # merit rank + percentile (x 85-145)
            merit = pct = None
            for w in sorted(col(80, 150), key=lambda w: w[0]):
                if PCT_RE.match(w[4]):
                    pct = float(PCT_RE.match(w[4]).group(1))
                elif MERITPCT_RE.match(w[4]) and merit is None:
                    merit = int(w[4])

            institute = joined(230, 475)
            institute = re.sub(r"^\d{4,5}\s*-\s*", "", institute).strip()
            course = joined(505, 620)
            exam_ws = col(650, 705)
            exam = exam_ws[0][4] if exam_ws else "JEE"
            seat_ws = col(770, 820)
            seat_type = seat_ws[0][4] if seat_ws else "AI"

            if not institute and not course:
                continue
            records.append({
                "admission_type": "AI",
                "cap_round": cap_round,
                "college_code": choice[:5],
                "college_name": institute,
                "branch_code": choice,
                "branch_name": course,
                "section": "All India Seats",
                "stage": "I",
                "merit_rank": merit,
                "percentile": pct,
                "exam": exam,
                "seat_type_code": seat_type,
                "category": "AI",
                "gender": "Gender-Neutral",
                "level": "All India",
                "is_pwd": False, "is_defence": False, "is_reserved": False,
                "is_tfws": False, "is_ews": False, "is_orphan": False,
                "is_minority": False,
            })
    doc.close()
    return records
