import { google } from "googleapis";
import { Readable } from "stream";

// Environment configuration for Google Drive (Server-Side ONLY)
const gdriveClientEmail = process.env.GDRIVE_CLIENT_EMAIL || "";
const gdrivePrivateKey = (process.env.GDRIVE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const gdriveClientId = process.env.GDRIVE_CLIENT_ID || "";
const gdriveClientSecret = process.env.GDRIVE_CLIENT_SECRET || "";
const gdriveRefreshToken = process.env.GDRIVE_REFRESH_TOKEN || "";
const gdriveRootFolderId = process.env.GDRIVE_ROOT_FOLDER_ID || "";

export const isGoogleDriveConfigured = Boolean(
  (gdriveClientEmail && gdrivePrivateKey) ||
    (gdriveClientId && gdriveClientSecret && gdriveRefreshToken)
);

export interface UploadResult {
  fileId: string;
  fileName: string;
  storagePath: string;
  webViewLink?: string;
  sizeBytes: number;
}

/**
 * Initialize authenticated Google Drive API client (Server-Side Only)
 */
function getDriveClient() {
  if (!isGoogleDriveConfigured) {
    throw new Error("Google Drive credentials not configured in environment variables.");
  }

  // 1. Service Account Authentication
  if (gdriveClientEmail && gdrivePrivateKey) {
    const auth = new google.auth.JWT({
      email: gdriveClientEmail,
      key: gdrivePrivateKey,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    return google.drive({ version: "v3", auth });
  }

  // 2. OAuth2 Refresh Token Authentication
  if (gdriveClientId && gdriveClientSecret && gdriveRefreshToken) {
    const oauth2Client = new google.auth.OAuth2(gdriveClientId, gdriveClientSecret);
    oauth2Client.setCredentials({ refresh_token: gdriveRefreshToken });
    return google.drive({ version: "v3", auth: oauth2Client });
  }

  throw new Error("Invalid Google Drive authentication configuration.");
}

/**
 * Find or create a subfolder inside a parent Google Drive folder.
 */
async function getOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  const queryParts = [
    `mimeType = 'application/vnd.google-apps.folder'`,
    `name = '${folderName}'`,
    `trashed = false`,
  ];
  if (parentFolderId) {
    queryParts.push(`'${parentFolderId}' in parents`);
  }

  const query = queryParts.join(" and ");
  const listRes = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    return listRes.data.files[0].id!;
  }

  // Create folder
  const folderMetadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentFolderId) {
    folderMetadata.parents = [parentFolderId];
  }

  const createRes = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id, name",
  });

  return createRes.data.id!;
}

/**
 * Upload a dataset media file into the project owner's Google Drive hierarchy:
 *   YogaSync-Dataset / raw / <pose_id> / <images|videos> / <filename>
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  poseId: string,
  fileType: "image" | "video"
): Promise<UploadResult> {
  if (!isGoogleDriveConfigured) {
    throw new Error(
      "Google Drive is not configured on this server. Please ensure GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, and GDRIVE_REFRESH_TOKEN are added to your environment variables (e.g., in Vercel Settings)."
    );
  }

  const drive = getDriveClient();

  // Root Dataset folder
  let rootId = gdriveRootFolderId;
  if (!rootId) {
    rootId = await getOrCreateFolder(drive, "YogaSync-Dataset");
  }

  // Subfolders: raw -> <pose_id> -> <images|videos>
  const rawFolderId = await getOrCreateFolder(drive, "raw", rootId);
  const poseFolderId = await getOrCreateFolder(drive, poseId, rawFolderId);
  const typeFolderId = await getOrCreateFolder(
    drive,
    fileType === "image" ? "images" : "videos",
    poseFolderId
  );

  const readableStream = new Readable();
  readableStream.push(fileBuffer);
  readableStream.push(null);

  const fileMetadata: any = {
    name: fileName,
    parents: [typeFolderId],
  };

  const media = {
    mimeType,
    body: readableStream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, size",
  });

  const storagePath = `YogaSync-Dataset/raw/${poseId}/${fileType === "image" ? "images" : "videos"}/${fileName}`;

  return {
    fileId: response.data.id || `file_${Date.now()}`,
    fileName: response.data.name || fileName,
    storagePath,
    webViewLink: response.data.webViewLink || undefined,
    sizeBytes: fileBuffer.length,
  };
}

/**
 * Diagnostic helper to check Google Drive connectivity and storage quota.
 */
export async function testGoogleDriveConnection(): Promise<{
  connected: boolean;
  message: string;
  storageQuota?: { limit?: string; usage?: string };
  user?: { displayName?: string; emailAddress?: string };
  tokenExpired?: boolean;
  needsSetup?: boolean;
}> {
  if (!isGoogleDriveConfigured) {
    return {
      connected: false,
      needsSetup: true,
      message: "Google Drive credentials not configured on this server. (Missing GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, or GDRIVE_REFRESH_TOKEN in environment variables).",
    };
  }

  try {
    const drive = getDriveClient();
    const about = await drive.about.get({
      fields: "user, storageQuota",
    });
    return {
      connected: true,
      user: {
        displayName: about.data.user?.displayName || "Project Owner",
        emailAddress: about.data.user?.emailAddress || undefined,
      },
      message: `Connected successfully to Google Drive (${about.data.user?.displayName || "Project Owner"}).`,
      storageQuota: {
        limit: about.data.storageQuota?.limit || undefined,
        usage: about.data.storageQuota?.usage || undefined,
      },
    };
  } catch (error: any) {
    const errMsg = String(error?.message || error);
    const isExpired =
      errMsg.includes("invalid_grant") ||
      errMsg.includes("expired") ||
      errMsg.includes("revoked");

    return {
      connected: false,
      tokenExpired: isExpired,
      message: isExpired
        ? "Google Drive OAuth token has expired (Google 7-day testing limit). Please reconnect your Google account in Settings."
        : `Failed to connect to Google Drive: ${errMsg}`,
    };
  }
}
