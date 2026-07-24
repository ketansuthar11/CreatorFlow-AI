import { google } from "googleapis";
import path from "path";

const CREDENTIALS_PATH = path.join(
    process.cwd(),
    "credentials",
    "client_secret.json"
);

export const oauth2Client = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/youtube.upload"],
});