# AI Content Factory

Telegram-driven video processing and YouTube publishing, with separate YouTube channels for each Telegram user.

## User flow

1. A Telegram user sends `/connect` and opens the one-time Google authorization link.
2. The authorized YouTube channel is saved only under that Telegram user. Repeat `/connect` to add more channels.
3. The user sends a supported YouTube or Instagram URL, chooses a destination channel, then selects Public, Private, or Unlisted.
4. The bot processes the video, uploads using that channel's OAuth credentials, refreshes those credentials when required, and records the upload status.

Useful Telegram commands:

- `/start` — show the onboarding message.
- `/connect` — connect another YouTube channel (the link expires after 10 minutes).
- `/channels` — list the caller's connected channels.

## Required setup

1. Copy `.env.example` to `.env` and set the variables.
2. In Google Cloud Console, add `APP_URL/api/auth/youtube/callback` as an authorized OAuth redirect URI. `APP_URL` must be the public HTTPS address of this running app; Telegram users must be able to open it.
3. Put the Google OAuth web-client JSON at `credentials/client_secret.json`.
4. Apply the database migration and generate Prisma:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. Start the app with `npm run dev` locally. For production, set the same variables
   in the hosting provider and set `APP_URL` to its public HTTPS URL. Hosted platforms should set
   `GOOGLE_OAUTH_CLIENT_SECRET_JSON` to the complete OAuth client JSON rather
   than uploading `credentials/client_secret.json`.

## Production deployment

This app is configured for a Docker-based Render Web Service that deploys directly from GitHub.
It needs a long-running Node.js service and PostgreSQL database: it cannot run
correctly on serverless hosting because the Telegram bot uses long polling and
video processing uses local files. The included `render.yaml` builds the app,
runs Prisma migrations before each deploy, and checks `/api/health`.

Before going live:

1. In Render, select **New > Blueprint** and connect this GitHub repository. Use
   the Starter (always-on) instance type; Render Free services sleep after 15
   minutes, which would stop the Telegram bot.
2. Create a Render Postgres database and set `DATABASE_URL`. Then set
   `TELEGRAM_BOT_TOKEN`, `GROQ_API_KEY`, and `GOOGLE_OAUTH_CLIENT_SECRET_JSON`.
3. Deploy once, copy the generated HTTPS URL into `APP_URL`, then redeploy.
4. Add `APP_URL/api/auth/youtube/callback` to the Google OAuth client's authorized redirect URIs.
5. Confirm `https://YOUR_DOMAIN/api/health` returns `{ "status": "ok" }` and test `/connect` in Telegram.

`yt-dlp.exe` is used only during local Windows development. The Docker image
installs the Linux `yt-dlp` binary and FFmpeg for production, so do not replace
the Windows executable in production.

The bot uses long polling, so run only one application instance for a given `TELEGRAM_BOT_TOKEN`.

## Security notes

OAuth state is stored in the database and expires after 10 minutes, binding each authorization to the Telegram user who requested it. Never commit `.env` or `credentials/`. YouTube refresh tokens are stored in the database; use database encryption at rest and a restricted database account in production.
