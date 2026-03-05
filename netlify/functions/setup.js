/**
 * Netlify Serverless Function — Webhook Setup
 * 
 * Visit this URL once after deployment to register the Telegram webhook:
 *   https://your-app.netlify.app/.netlify/functions/setup
 * 
 * This will:
 *   1. Register the webhook URL with Telegram
 *   2. Set bot commands (/start, /help)
 *   3. Configure the bot's menu button to open the Mini App
 * 
 * Environment Variables required:
 *   BOT_TOKEN - Telegram Bot API token
 */

const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;

function callTelegramAPI(method, body = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);

        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${BOT_TOKEN}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        }, (res) => {
            let result = '';
            res.on('data', (chunk) => result += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(result)); }
                catch (e) { resolve({ ok: false, raw: result }); }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

exports.handler = async (event) => {
    if (!BOT_TOKEN) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'BOT_TOKEN environment variable is not set!' }),
        };
    }

    const host = event.headers?.host;
    const siteUrl = `https://${host}`;
    const webhookUrl = `${siteUrl}/.netlify/functions/bot`;
    const webAppUrl = process.env.WEB_APP_URL || siteUrl;

    const results = {};

    try {
        // 1. Set webhook
        results.setWebhook = await callTelegramAPI('setWebhook', {
            url: webhookUrl,
            allowed_updates: ['message'],
            drop_pending_updates: true,
        });

        // 2. Set bot commands
        results.setMyCommands = await callTelegramAPI('setMyCommands', {
            commands: [
                { command: 'start', description: '🎡 Open Wheel of Names' },
                { command: 'help', description: '❓ How to use' },
            ],
        });

        // 3. Set menu button to open Mini App
        results.setChatMenuButton = await callTelegramAPI('setChatMenuButton', {
            menu_button: {
                type: 'web_app',
                text: '🎡 Open App',
                web_app: { url: webAppUrl },
            },
        });

        // 4. Get webhook info to verify
        results.webhookInfo = await callTelegramAPI('getWebhookInfo');

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: `
<!DOCTYPE html>
<html>
<head>
    <title>Wheel of Names — Bot Setup</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #0a0a1a; color: #f0f0ff; }
        h1 { color: #7c5cfc; }
        .success { color: #00d4aa; font-size: 1.2rem; }
        .info { background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.3); border-radius: 12px; padding: 16px; margin: 12px 0; }
        pre { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; }
        a { color: #ff6b9d; }
    </style>
</head>
<body>
    <h1>🎡 Bot Setup Complete!</h1>
    <p class="success">✅ Webhook registered successfully!</p>
    <div class="info">
        <strong>Webhook URL:</strong><br>
        <code>${webhookUrl}</code>
    </div>
    <div class="info">
        <strong>Mini App URL:</strong><br>
        <code>${webAppUrl}</code>
    </div>
    <p>Your bot is now fully configured and running on Netlify! 🚀</p>
    <p>Open your bot in Telegram and send <strong>/start</strong> to test it.</p>
    <h3>API Responses:</h3>
    <pre>${JSON.stringify(results, null, 2)}</pre>
</body>
</html>`,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message, results }),
        };
    }
};
