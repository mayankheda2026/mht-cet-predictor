import { NextRequest, NextResponse } from "next/server";
import { parseIntent, searchColleges } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json({ intent: { raw: "" }, colleges: [] });
  const intent = parseIntent(q);
  const colleges = intent.collegeQuery
    ? await searchColleges(intent.collegeQuery)
    : q.length >= 2 && !intent.percentile
      ? await searchColleges(q)
      : [];
  return NextResponse.json({ intent, colleges });
}
