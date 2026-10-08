import { NextResponse } from "next/server";
import { getDatasetStats } from "@/lib/storage";

export async function GET() {
  try {
    const stats = await getDatasetStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to compute dataset statistics." },
      { status: 500 }
    );
  }
}
