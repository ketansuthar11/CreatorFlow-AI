import fs from "fs";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { createOAuthClient } from "@/lib/oauth";

interface UploadOptions {
  channelId: string;
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus?: "public" | "private" | "unlisted";
}

export const uploadToYoutube = async ({ channelId, videoPath, title, description, tags, privacyStatus = "private" }: UploadOptions) => {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new Error("Selected YouTube channel was not found.");

  const oauth2Client = createOAuthClient();
  // Stored channels do not retain an access-token expiry time. Supplying the old
  // access token without that value makes the Google client treat it as current
  // and can result in a 401 instead of refreshing it. Start from the durable
  // refresh token and obtain a new access token for every upload.
  oauth2Client.setCredentials({ refresh_token: channel.refreshToken });
  oauth2Client.on("tokens", async (tokens) => {
    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        accessToken: tokens.access_token ?? channel.accessToken,
        refreshToken: tokens.refresh_token ?? channel.refreshToken,
      },
    });
  });

  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to refresh YouTube credentials for ${channel.channelTitle ?? channel.name}. Reconnect this channel with /connect and try again. (${details})`
    );
  }

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: { title, description, tags, categoryId: "24" },
      status: { privacyStatus, selfDeclaredMadeForKids: false },
    },
    media: { body: fs.createReadStream(videoPath) },
  });

  if (!response.data.id) throw new Error("YouTube did not return a video id.");
  return `https://youtu.be/${response.data.id}`;
};
