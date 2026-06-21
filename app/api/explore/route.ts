import { NextRequest, NextResponse } from "next/server";
import { exploreCutoffs, type ExploreFilters } from "@/lib/explore";

export const dynamic = "force-dynamic";

const num = (v: string | null) => (v == null || v === "" ? undefined : Number(v));
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : undefined);
const nums = (v: string | null) => list(v)?.map(Number);
const bool = (v: string | null) => v === "1" || v === "true";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const f: ExploreFilters = {
    pctMin: num(p.get("pctMin")), pctMax: num(p.get("pctMax")),
    rankMin: num(p.get("rankMin")), rankMax: num(p.get("rankMax")),
    collegeCode: p.get("collegeCode") || undefined,
    branchGroups: list(p.get("branchGroups")),
    categories: list(p.get("categories")),
    genders: list(p.get("genders")),
    rounds: nums(p.get("rounds")),
    admissionType: p.get("admissionType") || undefined,
    levels: list(p.get("levels")),
    regions: list(p.get("regions")),
    districts: list(p.get("districts")),
    funding: list(p.get("funding")),
    government: bool(p.get("government")),
    autonomous: bool(p.get("autonomous")),
    universityDept: bool(p.get("universityDept")),
    minority: bool(p.get("minority")),
    tfws: bool(p.get("tfws")),
    ews: bool(p.get("ews")),
    seatType: p.get("seatType") || undefined,
    sort: (p.get("sort") as ExploreFilters["sort"]) || "pct_desc",
    page: num(p.get("page")),
    pageSize: num(p.get("pageSize")),
  };
  const res = await exploreCutoffs(f);
  return NextResponse.json(res);
}
