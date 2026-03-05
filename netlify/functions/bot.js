/**
 * Netlify Serverless Function — Telegram Bot Webhook Handler
 * 
 * Receives incoming Telegram updates via POST request from Telegram's webhook.
 * Handles /start and /help commands for the Wheel of Names Mini App.
 * 
 * Environment Variables (set in Netlify dashboard):
 *   BOT_TOKEN   - Telegram Bot API token from @BotFather
 *   WEB_APP_URL - HTTPS URL of the deployed Mini App (auto-detected if not set)
 */

const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;

/**
 * Send a message via Telegram Bot API using Node.js https module
 */
function sendMessage(chatId, text, options = {}) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
            ...options,
        });

        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve({ ok: false, raw: data }); }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

/**
 * Get the Mini App URL — uses WEB_APP_URL env var,
 * or auto-detects from the Netlify site URL
 */
function getWebAppUrl(siteUrl) {
    if (process.env.WEB_APP_URL) {
        return process.env.WEB_APP_URL;
    }
    if (siteUrl) {
        return siteUrl;
    }
    return process.env.URL || 'https://your-app.netlify.app';
}

/**
 * Handle incoming Telegram update
 */
async function handleUpdate(update, siteUrl) {
    const message = update.message;
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();
    const firstName = message.from?.first_name || 'there';
    const webAppUrl = getWebAppUrl(siteUrl);

    // /start command
    if (text === '/start' || text.startsWith('/start ')) {
        await sendMessage(chatId,
            `🎡 *Welcome to Wheel of Names, ${firstName}!*\n\n` +
            `Spin the wheel to randomly pick a winner from your list of names.\n\n` +
            `Tap the button below to open the app! 👇`,
            {
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🎡 Open Wheel of Names',
                            web_app: { url: webAppUrl }
                        }
                    ]]
                }
            }
        );
        return;
    }

    // /help command
    if (text === '/help') {
        await sendMessage(chatId,
            `🎡 *Wheel of Names Help*\n\n` +
            `• Add names to the wheel\n` +
            `• Tap SPIN to randomly select a winner\n` +
            `• Remove winners & spin again\n` +
            `• Shuffle or clear all names\n` +
            `• Names are saved automatically!\n\n` +
            `Use /start to open the app.`
        );
        return;
    }
}

/**
 * Netlify Function Handler
 */
exports.handler = async (event) => {
    // Only accept POST requests (from Telegram webhook)
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Wheel of Names Bot is active! 🎡' }),
        };
    }

    if (!BOT_TOKEN) {
        console.error('BOT_TOKEN environment variable is not set!');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'BOT_TOKEN not configured' }),
        };
    }

    try {
        const update = JSON.parse(event.body);
        const host = event.headers?.host;
        const siteUrl = host ? `https://${host}` : null;

        await handleUpdate(update, siteUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true }),
        };
    } catch (error) {
        console.error('Error processing update:', error);
        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true }),
        };
    }
};
