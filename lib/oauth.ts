import fs from "fs";
import path from "path";
import { google } from "googleapis";

export const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
export const YOUTUBE_CHANNEL_READ_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

function loadOAuthCredentials() {
  const rawCredentials = process.env.GOOGLE_OAUTH_CLIENT_SECRET_JSON
    ?? fs.readFileSync(path.join(process.cwd(), "credentials", "client_secret.json"), "utf-8");
  return JSON.parse(rawCredentials).web as {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

// OAuth clients are mutable. One client per request prevents concurrent uploads
// from accidentally using another channel's credentials.
export function createOAuthClient() {
  const { client_id, client_secret, redirect_uris } = loadOAuthCredentials();
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}
