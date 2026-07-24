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

5. Start the app with `npm run dev` (or your production process).

The bot uses long polling, so run only one application instance for a given `TELEGRAM_BOT_TOKEN`.

## Security notes

OAuth state is stored in the database and expires after 10 minutes, binding each authorization to the Telegram user who requested it. Never commit `.env` or `credentials/`. YouTube refresh tokens are stored in the database; use database encryption at rest and a restricted database account in production.
