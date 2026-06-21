import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const E = join(__dirname, "..", "extracted");
const prisma = new PrismaClient();

const load = (f) => JSON.parse(readFileSync(join(E, f), "utf8"));

async function main() {
  const colleges = load("colleges.json");
  const branches = load("branches.json");
  const cutoffs = load("cutoffs.json");
  console.log(`seeding ${colleges.length} colleges, ${branches.length} branches, ${cutoffs.length} cutoffs`);

  await prisma.cutoff.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.college.deleteMany();

  await prisma.college.createMany({
    data: colleges.map((c) => ({
      code: c.code, name: c.name, funding: c.funding || "Unknown",
      isGovernment: !!c.is_government, isAutonomous: !!c.is_autonomous,
      isUniversityDept: !!c.is_university_dept, isMinority: !!c.is_minority,
      minorityType: c.minority_type || null, homeUniversity: c.home_university || null,
      region: c.region || "Maharashtra", district: c.district || c.region || "Maharashtra",
    })),
  });

  // Only keep branches whose college exists (all do) and dedupe by code.
  const seenB = new Set();
  const branchData = branches.filter((b) => b.college_code && !seenB.has(b.code) && seenB.add(b.code))
    .map((b) => ({ code: b.code, name: b.name, group: b.group || "Other Engineering", collegeCode: b.college_code }));
  await prisma.branch.createMany({ data: branchData });
  const validBranch = new Set(branchData.map((b) => b.code));
  const validCollege = new Set(colleges.map((c) => c.code));

  let n = 0;
  const batch = [];
  const flush = async () => {
    if (!batch.length) return;
    await prisma.cutoff.createMany({ data: batch.splice(0, batch.length) });
  };
  for (const r of cutoffs) {
    if (!validCollege.has(r.college_code) || !validBranch.has(r.branch_code)) continue;
    batch.push({
      collegeCode: r.college_code, branchCode: r.branch_code,
      admissionType: r.admission_type, capRound: r.cap_round,
      section: r.section || "", level: r.level || "", stage: r.stage || "I",
      seatTypeCode: r.seat_type_code || "", category: r.category || "OPEN",
      gender: r.gender || "Gender-Neutral",
      isPwd: !!r.is_pwd, isDefence: !!r.is_defence, isReserved: !!r.is_reserved,
      isTfws: !!r.is_tfws, isEws: !!r.is_ews, isOrphan: !!r.is_orphan, isMinority: !!r.is_minority,
      meritRank: r.merit_rank ?? null, percentile: r.percentile ?? null,
    });
    n++;
    if (batch.length >= 2000) await flush();
  }
  await flush();
  console.log(`seeded ${n} cutoffs`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
