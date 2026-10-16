import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/gdrive/callback`;

  if (error) {
    return NextResponse.redirect(`${protocol}://${host}/settings?gdrive_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${protocol}://${host}/settings?gdrive_error=missing_auth_code`);
  }

  const clientId = process.env.GDRIVE_CLIENT_ID || "";
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${protocol}://${host}/settings?gdrive_error=${encodeURIComponent("GDRIVE_CLIENT_ID or GDRIVE_CLIENT_SECRET is missing in environment variables.")}`
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // Save/update .env.local file if filesystem is writable (local development)
      try {
        const envPath = path.join(process.cwd(), ".env.local");
        let envContent = "";
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, "utf-8");
        }

        const updateKey = (content: string, key: string, val: string) => {
          const regex = new RegExp(`^${key}=.*$`, "m");
          if (regex.test(content)) {
            return content.replace(regex, `${key}=${val}`);
          } else {
            return `${content}\n${key}=${val}`;
          }
        };

        envContent = updateKey(envContent, "GDRIVE_CLIENT_ID", clientId);
        envContent = updateKey(envContent, "GDRIVE_CLIENT_SECRET", clientSecret);
        envContent = updateKey(envContent, "GDRIVE_REFRESH_TOKEN", tokens.refresh_token);

        fs.writeFileSync(envPath, envContent.trim() + "\n", "utf-8");
      } catch (writeErr) {
        console.warn("Could not write .env.local (read-only serverless environment):", writeErr);
      }

      process.env.GDRIVE_REFRESH_TOKEN = tokens.refresh_token;

      return NextResponse.redirect(
        `${protocol}://${host}/settings?gdrive_success=connected&token=${encodeURIComponent(tokens.refresh_token)}`
      );
    }

    return NextResponse.redirect(
      `${protocol}://${host}/settings?gdrive_error=no_refresh_token_granted`
    );
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${protocol}://${host}/settings?gdrive_error=${encodeURIComponent(err.message || "Failed to exchange OAuth token")}`
    );
  }
}
