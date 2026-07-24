import { randomUUID } from "crypto";
import TelegramBot, { type Message } from "node-telegram-bot-api";
import { processUrl } from "@/services/processUrl";
import { uploadToYoutube } from "@/services/uploadYoutube";
import { prisma } from "@/lib/prisma";

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.APP_URL?.replace(/\/$/, "");

function canUseTelegramUrlButton(url: string) {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

type PendingUpload = { url: string; channelId?: string };
const pendingUploads = new Map<number, PendingUpload>();

function isSupportedUrl(text: string) {
  return /(?:youtube\.com|youtu\.be|instagram\.com)/i.test(text);
}

async function ensureUser(message: Message) {
  return prisma.user.upsert({
    where: { telegramId: String(message.from?.id ?? message.chat.id) },
    update: { name: message.from?.first_name },
    create: { telegramId: String(message.from?.id ?? message.chat.id), name: message.from?.first_name },
  });
}

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required to start the Telegram bot.");

const bot: TelegramBot = (global as typeof globalThis & { telegramBot?: TelegramBot }).telegramBot
  ?? new TelegramBot(token, { polling: true });

if (!(global as typeof globalThis & { telegramBot?: TelegramBot }).telegramBot) {
  console.log("Telegram Bot Started");

  bot.on("message", async (msg) => {
    try {
    const chatId = msg.chat.id;
    const text = msg.text?.trim() ?? "";
    const user = await ensureUser(msg);

    if (text === "/start") {
      return void bot.sendMessage(chatId, "Welcome! Use /connect to add a YouTube channel, then send a YouTube or Instagram URL to upload it.");
    }
    if (text === "/channels") {
      const channels = await prisma.channel.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
      return void bot.sendMessage(chatId, channels.length ? `Your channels:\n${channels.map((channel) => `• ${channel.channelTitle ?? channel.name}`).join("\n")}` : "No channels connected. Use /connect first.");
    }
    if (text === "/connect") {
      if (!appUrl) return void bot.sendMessage(chatId, "The bot is missing APP_URL. Ask the administrator to configure its public HTTPS URL.");
      const state = randomUUID();
      await prisma.authorizationRequest.deleteMany({ where: { telegramId: user.telegramId } });
      await prisma.authorizationRequest.create({
        data: { state, telegramId: user.telegramId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });
      const connectUrl = `${appUrl}/api/auth/youtube?state=${state}`;

      if (!canUseTelegramUrlButton(connectUrl)) {
        await bot.sendMessage(
          chatId,
          `Local mode: copy this address and open it in a browser on this computer (link expires in 10 minutes):\n${connectUrl}`,
        );
        return;
      }

      await bot.sendMessage(chatId, "Connect a YouTube channel (link expires in 10 minutes):", {
        reply_markup: { inline_keyboard: [[{ text: "Connect YouTube channel", url: connectUrl }]] },
      });
      return;
    }
    if (!isSupportedUrl(text)) {
      return void bot.sendMessage(chatId, "Send a YouTube or Instagram URL. Commands: /connect, /channels");
    }

    const channels = await prisma.channel.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    if (!channels.length) return void bot.sendMessage(chatId, "Connect a YouTube channel first with /connect.");
    pendingUploads.set(chatId, { url: text });
    return void bot.sendMessage(chatId, "Choose the destination channel:", {
      reply_markup: { inline_keyboard: channels.map((channel) => [{ text: channel.channelTitle ?? channel.name, callback_data: `channel:${channel.id}` }]) },
    });
    } catch (error) {
      console.error("Telegram message handling failed", error);
      await bot.sendMessage(msg.chat.id, "❌ Something went wrong. Please try again in a moment.");
    }
  });

  bot.on("callback_query", async (query) => {
    try {
    const message = query.message;
    if (!message || !query.data) return;
    const chatId = message.chat.id;
    const user = await prisma.user.findUnique({ where: { telegramId: String(query.from.id) } });
    const pending = pendingUploads.get(chatId);
    if (!user || !pending) return void bot.answerCallbackQuery(query.id, { text: "No pending upload found. Send the video URL again." });

    if (query.data.startsWith("channel:")) {
      const channelId = query.data.slice("channel:".length);
      const channel = await prisma.channel.findFirst({ where: { id: channelId, userId: user.id } });
      if (!channel) return void bot.answerCallbackQuery(query.id, { text: "That channel is not available." });
      pending.channelId = channel.id;
      await bot.answerCallbackQuery(query.id);
      return void bot.editMessageText(`Channel: ${channel.channelTitle ?? channel.name}\n\nChoose YouTube privacy:`, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: { inline_keyboard: [["public", "private", "unlisted"].map((privacy) => ({ text: privacy[0].toUpperCase() + privacy.slice(1), callback_data: `privacy:${privacy}` }))] },
      });
    }

    if (!query.data.startsWith("privacy:") || !pending.channelId) {
      return void bot.answerCallbackQuery(query.id, { text: "Choose a channel before selecting privacy." });
    }
    const privacy = query.data.slice("privacy:".length) as "public" | "private" | "unlisted";
    if (!(["public", "private", "unlisted"] as string[]).includes(privacy)) return void bot.answerCallbackQuery(query.id);
    const channel = await prisma.channel.findFirst({ where: { id: pending.channelId, userId: user.id } });
    if (!channel) return void bot.answerCallbackQuery(query.id, { text: "That channel is no longer available." });

    await bot.answerCallbackQuery(query.id);
    const progress = await bot.sendMessage(chatId, "Processing started…");
    const upload = await prisma.upload.create({ data: { title: "Processing video", status: "processing", channelId: channel.id } });
    try {
      const result = await processUrl(pending.url, async (status) => {
        await bot.editMessageText(status, { chat_id: chatId, message_id: progress.message_id });
      });
      const youtubeUrl = await uploadToYoutube({ channelId: channel.id, videoPath: result.outputPath, title: result.metadata.youtubeTitle, description: result.metadata.description, tags: result.metadata.tags, privacyStatus: privacy });
      await prisma.upload.update({ where: { id: upload.id }, data: { title: result.metadata.youtubeTitle, youtubeUrl, status: "completed" } });
      pendingUploads.delete(chatId);
      await bot.editMessageText(`✅ Uploaded to ${channel.channelTitle ?? channel.name}\n\n🎬 ${result.metadata.youtubeTitle}\n🔒 Privacy: ${privacy}\n🔗 ${youtubeUrl}`, { chat_id: chatId, message_id: progress.message_id });
    } catch (error) {
      console.error("Upload failed", error);
      await prisma.upload.update({ where: { id: upload.id }, data: { status: "failed" } });
      await bot.editMessageText("❌ Processing failed. Please try again.", { chat_id: chatId, message_id: progress.message_id });
    }
    } catch (error) {
      console.error("Telegram callback handling failed", error);
      if (query.message) await bot.sendMessage(query.message.chat.id, "❌ Something went wrong. Please send the video URL again.");
    }
  });

  (global as typeof globalThis & { telegramBot?: TelegramBot }).telegramBot = bot;
}

export default bot;
