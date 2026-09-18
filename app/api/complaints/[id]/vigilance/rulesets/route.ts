import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/auth-guard";
import { getAllRulesets } from "@/lib/vigilance/rules";

export async function GET(_req: NextRequest) {
  try {
    await requireOrgAuth();
    const rulesets = getAllRulesets();
    return NextResponse.json({
      count: rulesets.length,
      rulesets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
