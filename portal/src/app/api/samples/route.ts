import { NextRequest, NextResponse } from "next/server";
import { getDatasetSamples } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pose_id = searchParams.get("pose_id") || undefined;
    const contributor_id = searchParams.get("contributor_id") || undefined;
    const review_status = searchParams.get("review_status") || undefined;
    const file_type = searchParams.get("file_type") || undefined;

    const samples = await getDatasetSamples({
      pose_id,
      contributor_id,
      review_status,
      file_type,
    });

    return NextResponse.json({ success: true, samples });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch dataset samples." },
      { status: 500 }
    );
  }
}
