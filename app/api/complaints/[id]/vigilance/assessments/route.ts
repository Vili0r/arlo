import { NextRequest, NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { JurisdictionCode } from "@/lib/vigilance/types";
import { runGlobalAssessment } from "@/lib/actions/vigilance-engine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { orgId } = await requireOrgAuth();

    const [assessments, answers] = await Promise.all([
      prisma.vigilanceJurisdictionAssessment.findMany({
        where: { orgId, complaintId: id },
        orderBy: { jurisdiction: "asc" },
      }),
      prisma.vigilanceQuestionAnswer.findMany({
        where: { orgId, complaintId: id },
        orderBy: { questionId: "asc" },
      }),
    ]);

    return NextResponse.json({
      complaintId: id,
      assessments,
      answers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const jurisdictions: JurisdictionCode[] | undefined = body.jurisdictions;
    const orgSlug: string = body.orgSlug || "default";

    const result = await runGlobalAssessment({
      complaintId: id,
      orgSlug,
      jurisdictions,
      reason: body.reason || "API triggered global vigilance assessment",
    });

    return NextResponse.json({
      complaintId: id,
      success: true,
      assessments: result.savedAssessments,
      evaluation: result.evaluationResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Evaluation error" },
      { status: 500 }
    );
  }
}
