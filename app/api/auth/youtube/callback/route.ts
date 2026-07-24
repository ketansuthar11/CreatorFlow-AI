import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { createOAuthClient } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    if (!code || !state) return NextResponse.json({ error: "Missing OAuth response values." }, { status: 400 });

    const authorization = await prisma.authorizationRequest.findUnique({ where: { state } });
    if (!authorization || authorization.expiresAt < new Date()) {
      return NextResponse.json({ error: "This connection link has expired. Return to Telegram and use /connect again." }, { status: 400 });
    }

    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json({ error: "Google did not provide reusable YouTube credentials. Please use /connect again." }, { status: 400 });
    }
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const channelResponse = await youtube.channels.list({ part: ["snippet"], mine: true });
    const youtubeChannel = channelResponse.data.items?.[0];
    if (!youtubeChannel?.id) return NextResponse.json({ error: "No YouTube channel was found for this Google account." }, { status: 400 });

    const title = youtubeChannel.snippet?.title ?? "YouTube channel";
    const user = await prisma.user.findUniqueOrThrow({ where: { telegramId: authorization.telegramId } });
    await prisma.channel.upsert({
      where: { userId_channelId: { userId: user.id, channelId: youtubeChannel.id } },
      update: { name: title, channelTitle: title, accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
      create: { userId: user.id, name: title, channelTitle: title, channelId: youtubeChannel.id, accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
    });
    await prisma.authorizationRequest.delete({ where: { id: authorization.id } });

    return new NextResponse("<h1>Channel connected.</h1><p>Return to Telegram and send a video URL.</p>", { headers: { "content-type": "text/html; charset=utf-8" } });
  } catch (error) {
    console.error("YouTube OAuth callback failed", error);
    return NextResponse.json({ error: "Unable to connect this YouTube channel." }, { status: 500 });
  }
}
