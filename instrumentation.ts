export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("./app/bot/telegramBot");

        console.log(
            "🤖 Telegram Bot Auto Started"
        );
    }
}