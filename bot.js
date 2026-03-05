/**
 * Telegram Bot Setup Script for Wheel of Names Mini App
 * 
 * This script configures the Telegram bot to serve the Mini App.
 * Run: node bot.js
 * 
 * Prerequisites:
 *   npm install node-telegram-bot-api
 */

const TelegramBot = require('node-telegram-bot-api');

// Bot Token from BotFather
const BOT_TOKEN = '8644627075:AAGy5ILsgN7uYqWOOGIYxvZT2w6cxR_wCz0';

// ⚠️ IMPORTANT: Replace this with your actual deployed URL (must be HTTPS)
// Examples:
//   - Vercel:  https://your-app.vercel.app
//   - Netlify: https://your-app.netlify.app
//   - GitHub Pages: https://username.github.io/wheel-of-names-app
const WEB_APP_URL = 'https://qld-childhood-champion-nest.trycloudflare.com';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'there';

    bot.sendMessage(chatId,
        `🎡 *Welcome to Wheel of Names, ${firstName}!*\n\n` +
        `Spin the wheel to randomly pick a winner from your list of names.\n\n` +
        `Tap the button below to open the app! 👇`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🎡 Open Wheel of Names',
                        web_app: { url: WEB_APP_URL }
                    }
                ]]
            }
        }
    );
});

// /help command
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `🎡 *Wheel of Names Help*\n\n` +
        `• Add names to the wheel\n` +
        `• Tap SPIN to randomly select a winner\n` +
        `• Remove winners & spin again\n` +
        `• Shuffle or clear all names\n` +
        `• Names are saved automatically!\n\n` +
        `Use /start to open the app.`,
        { parse_mode: 'Markdown' }
    );
});

console.log('🎡 Wheel of Names Bot is running...');
console.log('   Send /start to your bot in Telegram to open the Mini App.');
