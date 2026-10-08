import { NextResponse } from "next/server";
import { testGoogleDriveConnection } from "@/lib/storage/google-drive";

export async function GET() {
  const result = await testGoogleDriveConnection();
  return NextResponse.json(result);
}
