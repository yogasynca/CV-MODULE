import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const clientId = process.env.GDRIVE_CLIENT_ID || "729596963071-46gnp2i93jso6t5ump3o57e9pl1nkern.apps.googleusercontent.com";
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET || "";
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/gdrive/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "GDRIVE_CLIENT_SECRET must be set in .env.local before initiating OAuth." },
      { status: 400 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  return NextResponse.redirect(authUrl);
}
