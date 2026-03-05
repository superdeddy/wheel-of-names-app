/**
 * Telegram Bot — LOCAL DEVELOPMENT ONLY (Polling Mode)
 * 
 * ⚠️ This file is for local development/testing only.
 * In production, the bot runs as a Netlify Serverless Function
 * using webhook mode. See: netlify/functions/bot.js
 * 
 * Run locally: node bot.js
 * Prerequisites: npm install node-telegram-bot-api
 */

const TelegramBot = require('node-telegram-bot-api');

// Bot Token — reads from environment variable, falls back to hardcoded for local dev
const BOT_TOKEN = process.env.BOT_TOKEN || '8644627075:AAGy5ILsgN7uYqWOOGIYxvZT2w6cxR_wCz0';

// ⚠️ For local dev: Replace with your tunnel URL or localhost
// In production (Netlify): This is set via Environment Variables
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:8080';

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
