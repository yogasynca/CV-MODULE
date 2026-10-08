import { NextRequest, NextResponse } from "next/server";
import { updateSampleReview } from "@/lib/storage";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, reviewer_id, reviewer_name, rejection_reason } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'APPROVED' or 'REJECTED'." },
        { status: 400 }
      );
    }

    const updated = await updateSampleReview(
      id,
      status,
      reviewer_id || "reviewer_unknown",
      reviewer_name || "Reviewer",
      rejection_reason
    );

    if (!updated) {
      return NextResponse.json({ error: "Sample not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Sample ${status.toLowerCase()} successfully.`,
      sample: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update review status." },
      { status: 500 }
    );
  }
}
