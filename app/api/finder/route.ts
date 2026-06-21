import { NextRequest, NextResponse } from "next/server";
import { findOptions, bucket, curateBest, type FinderInput } from "@/lib/finder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<FinderInput>;
  const pct = Number(body.percentile);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100)
    return NextResponse.json({ error: "percentile must be 0–100" }, { status: 400 });

  const input: FinderInput = {
    percentile: pct,
    category: body.category || "OPEN",
    gender: body.gender === "Female" ? "Female" : "Gender-Neutral",
    homeRegion: body.homeRegion || undefined,
    admissionType: body.admissionType === "AI" ? "AI" : "MH",
    branchGroups: body.branchGroups?.length ? body.branchGroups : undefined,
    region: body.region || undefined,
    rounds: body.rounds?.length ? body.rounds : undefined,
    pwd: body.pwd === true,
  };

  const options = await findOptions(input);
  const b = bucket(options);
  return NextResponse.json({
    input,
    total: options.length,
    counts: { dream: b.dream.length, target: b.target.length, safe: b.safe.length },
    best: curateBest(options),
    dream: b.dream.slice(0, 40),
    target: b.target.slice(0, 40),
    safe: b.safe.slice(0, 40),
  });
}
