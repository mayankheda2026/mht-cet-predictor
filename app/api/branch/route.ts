import { NextRequest, NextResponse } from "next/server";
import { getBranchCutoffMatrix } from "@/lib/college";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
  const data = await getBranchCutoffMatrix(code);
  return NextResponse.json(data);
}
