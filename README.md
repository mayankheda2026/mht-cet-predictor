# CAPSTONE — MHT-CET Admission Intelligence Platform

Enter a percentile, instantly get the **best Maharashtra engineering colleges & branches
you can actually get** — ranked from highest opportunity to safe backup, with full
filtering, fuzzy search and per-college intelligence. Built entirely on the **official
State CET Cell CAP Round 1–4 cutoff lists (AY 2025-26)** as the single source of truth.

```
75,208 cutoff records   ·   372 institutes   ·   2,041 branches   ·   4 CAP rounds
```

---

## 1. Architecture

```
data/raw_pdfs/        8 official CAP PDFs (MH + AI, rounds 1–4)
pipeline/             Python extraction pipeline  ─┐
extracted/            normalized JSON (source of truth)
prisma/               schema + seed (JSON → DB)    ─┤  data layer
lib/                  domain logic (finder, ranking, search, explore, college)
app/  components/      Next.js App Router UI + API routes  ─ application layer
```

Clean separation: **extraction → normalized data → typed domain logic → API → UI.**
Nothing in the UI talks to PDFs; everything flows through the validated dataset.

---

## 2. Data Extraction Pipeline

The two PDF families have completely different layouts, each handled by a dedicated
positional parser (coordinate-based, not naive text flow — which is essential for
matrices and multi-line cells):

| File family | Layout | Parser |
|---|---|---|
| `*MH cutoff.pdf` | Category **matrix** (GOPENS, LSCS, PWDOPENS, TFWS, EWS, ORPHAN…) per branch, up to 3 seat-level sections | `pipeline/extract_mh.py` |
| `*AI cutoff.pdf` | Columnar **rows** (one All-India seat per choice code) | `pipeline/extract_ai.py` |

**Normalization** (`pipeline/seattype.py`, `regions.py`) decodes every seat-type code
using the official legend — `G`/`L` → gender, core → reservation category, `S`/`H`/`O`
→ seat level — plus institute status (funding, autonomy, minority, home university) and
derives region/district and branch group.

**Robustness handled:** multi-line college/branch/course names (resolved by
most-frequent-variant + prefix completion across the corpus), merged/wrapped header
cells, missing values (blank matrix cells), inconsistent formatting, and duplicate rows
(collapsed keeping the closing cutoff).

### Run it

```bash
pip install -r pipeline/requirements.txt
cd pipeline && python3 run.py          # ~25s, writes extracted/*.json + validation.json
```

### Validation report (`extracted/validation.json`)

```
raw_rows                78,999     invalid_percentile_rows        0
deduped_rows            75,208     rows_without_category          0
duplicates_collapsed     3,791     rows_missing_rank             13  (genuinely blank cells)
colleges                   372     distinct_seat_type_codes      91
```

Every extracted figure was spot-checked pixel-for-pixel against the source PDFs
(e.g. VJTI Computer GOPENS R1 = rank 103 / 99.952%).

---

## 3. Admission Logic & Ranking

`lib/finder.ts` implements real MHT-CET seat eligibility:

- **Category** — a candidate contests their own category **and** OPEN; the easiest
  (lowest) eligible cutoff is the admission threshold.
- **Gender** — Female candidates contest both Ladies (`L*`) and Gender-Neutral (`G*`) seats.
- **Seat level (HU/OHU/State)** — derived from the candidate's home-university region vs
  the college's region; State-level + Minority seats are open to all.

**Dream / Target / Safe** classification by margin = `yourPercentile − cutoff`:

| Tier | Rule | Meaning |
|---|---|---|
| **Dream** | margin < 0 (within 4) | cutoff just above you — ambitious |
| **Target** | 0 ≤ margin < 2 | realistic, well-matched |
| **Safe** | margin ≥ 2 | comfortable backup |

**Opportunity score** ranks "Best Matches" so the *strongest college you can actually
get* leads the list (attainable options first, then by cutoff strength, government/
autonomous reputation and branch demand), trailing into aspirational dreams.

---

## 4. Product Surface

- **Finder** (`/`) — percentile-first; returns ranked Dream/Target/Safe options.
- **Explorer** (`/explore`) — 20+ stackable live filters (percentile & rank range,
  category, gender, round, seat level, region, institute type, government, autonomous,
  university department, TFWS, EWS, minority, college, branch group).
- **Colleges** (`/colleges`) — cutoff leaderboard + searchable directory.
- **College intelligence** (`/college/[code]`) — branch line-up, highest/lowest cutoff,
  internal branch ranking, expandable round- & category-wise cutoff matrix.
- **Smart search** (`/search`) — natural queries (`VJTI CS`, `AI DS Pune`,
  `Open category 97 percentile`) with intent parsing + fuzzy/acronym/typo tolerance.

UI is a hand-built **neo-brutalist** system (thick borders, hard shadows, sharp corners,
display type) — `tailwind.config.ts` + `app/globals.css`, no template/UI-kit.

---

## 5. Running the app

```bash
npm install
npx prisma generate
npx prisma db push          # creates prisma/dev.db (SQLite)
node prisma/seed.mjs        # seeds 75k cutoffs (~15s)
npm run dev                 # http://localhost:3000
```

### PostgreSQL (production)

The schema is Postgres-ready. To switch from the zero-config SQLite default:

```prisma
// prisma/schema.prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
```

```bash
DATABASE_URL="postgresql://user:pass@host:5432/capstone"
npx prisma migrate dev --name init && node prisma/seed.mjs
```

The domain/query layer (`lib/*`) and seed script are database-agnostic — no code changes.

---

## 6. Stack

Next.js 14 (App Router) · TypeScript (strict) · Prisma · SQLite/PostgreSQL ·
Tailwind CSS · Python (PyMuPDF) extraction.

> Independent tool. Cutoffs indicate past trends, not a guarantee of admission. Always
> verify on the official DTE / State CET Cell portal.
