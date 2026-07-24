import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOAuthClient, YOUTUBE_CHANNEL_READ_SCOPE, YOUTUBE_UPLOAD_SCOPE } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  if (!state) return NextResponse.json({ error: "Missing connection state." }, { status: 400 });

  const authorization = await prisma.authorizationRequest.findUnique({ where: { state } });
  if (!authorization || authorization.expiresAt < new Date()) {
    return NextResponse.json({ error: "This connection link has expired. Return to Telegram and use /connect again." }, { status: 400 });
  }

  const url = createOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state,
    scope: [YOUTUBE_UPLOAD_SCOPE, YOUTUBE_CHANNEL_READ_SCOPE],
  });
  return NextResponse.redirect(url);
}
