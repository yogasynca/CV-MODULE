import { NextRequest, NextResponse } from "next/server";
import { uploadToGoogleDrive } from "@/lib/storage/google-drive";
import { saveDatasetSample } from "@/lib/storage";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"];
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Support both single file ("file") and multiple files ("files")
    let files = formData.getAll("files") as File[];
    if (files.length === 0) {
      const singleFile = formData.get("file") as File | null;
      if (singleFile) files = [singleFile];
    }

    const poseId = formData.get("pose_id") as string | null;
    const contributorId = (formData.get("contributor_id") as string) || "anonymous_contributor";
    const contributorName = (formData.get("contributor_name") as string) || "Team Member";
    const contributorEmail = (formData.get("contributor_email") as string) || "";
    const datasetVersion = (formData.get("dataset_version") as string) || "0.1";
    const notes = (formData.get("notes") as string) || "";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    if (!poseId) {
      return NextResponse.json({ error: "No yoga pose selected." }, { status: 400 });
    }

    const uploadedSamples = [];
    const errors = [];

    for (const file of files) {
      // Validate size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: Exceeds 100MB limit.`);
        continue;
      }

      // Determine type
      const mimeType = file.type || "application/octet-stream";
      const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType) || /\.(jpe?g|png|webp)$/i.test(file.name);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType) || /\.(mp4|mov|webm|mkv)$/i.test(file.name);

      if (!isImage && !isVideo) {
        errors.push(`${file.name}: Unsupported file format.`);
        continue;
      }

      const fileType = isImage ? "image" : "video";

      // Convert file to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Sanitize file name
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      // Upload to Google Drive (Server-Side Abstraction)
      const gdriveResult = await uploadToGoogleDrive(
        buffer,
        sanitizedFileName,
        mimeType,
        poseId,
        fileType
      );

      // Save metadata record
      const savedRecord = await saveDatasetSample({
        pose_id: poseId,
        contributor_id: contributorId,
        contributor_name: contributorName,
        contributor_email: contributorEmail,
        file_name: sanitizedFileName,
        file_type: fileType,
        file_size: file.size,
        mime_type: mimeType,
        storage_path: gdriveResult.storagePath,
        gdrive_file_id: gdriveResult.fileId,
        gdrive_web_view_link: gdriveResult.webViewLink,
        dataset_version: datasetVersion,
        notes: notes,
      });

      uploadedSamples.push(savedRecord);
    }

    if (uploadedSamples.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(" | ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully processed and uploaded ${uploadedSamples.length} sample(s).`,
        sample: uploadedSamples[0],
        samples: uploadedSamples,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during upload." },
      { status: 500 }
    );
  }
}
