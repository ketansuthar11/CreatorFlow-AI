import fs from "fs";
import path from "path";
import { google } from "googleapis";

const credentials = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "credentials", "client_secret.json"), "utf-8")
);
const { client_id, client_secret, redirect_uris } = credentials.web;

export const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
export const YOUTUBE_CHANNEL_READ_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

// OAuth clients are mutable. One client per request prevents concurrent uploads
// from accidentally using another channel's credentials.
export function createOAuthClient() {
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}
