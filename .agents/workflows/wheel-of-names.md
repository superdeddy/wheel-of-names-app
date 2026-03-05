---
name: wheel-of-names
description: How to develop, test, and deploy the Wheel of Names Telegram Mini App
---

# Wheel of Names — Development Workflow

## Project Location
`E:\Documents\Google Antigravity\wheel-of-names-app`

## Tech Stack
- **Frontend**: Vanilla HTML + CSS + JavaScript (no build step)
- **Bot (production)**: Netlify Functions (serverless webhook)
- **Bot (local dev)**: Node.js with `node-telegram-bot-api` (polling)
- **SDK**: Telegram WebApp SDK v8.0
- **Rendering**: Canvas 2D API

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Entry point, SDK script, structure |
| `index.css` | Design system, responsive styles, Telegram safe-area CSS |
| `app.js` | All client-side logic (IIFE module, ~666 lines) |
| `netlify/functions/bot.js` | Production bot (webhook) |
| `netlify/functions/setup.js` | One-time webhook registration |
| `bot.js` | Local dev bot (polling) |

---

## Local Development

### 1. Start Local Server
// turbo
```bash
cd E:\Documents\Google Antigravity\wheel-of-names-app
npx -y http-server . -p 8080 -c-1
```

### 2. (Optional) Expose via Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:8080 --no-autoupdate
```
> Copy the generated `trycloudflare.com` URL and update `WEB_APP_URL` env var or pass it when starting the bot.

### 3. Start Telegram Bot (Local Polling)
```bash
cd E:\Documents\Google Antigravity\wheel-of-names-app
WEB_APP_URL=https://your-tunnel-url.trycloudflare.com node bot.js
```

### 4. Test in Telegram
1. Open the bot in Telegram
2. Send `/start`
3. Tap **"🎡 Open Wheel of Names"**

---

## Production Deployment (Netlify)

### First-time Setup
1. Push code to GitHub
2. Connect repo to Netlify (auto-deploys from `main` branch)
3. Set **Environment Variables** in Netlify dashboard:
   - `BOT_TOKEN` = your Telegram bot token
4. **Trigger a redeploy** after setting env vars
5. Visit `https://your-site.netlify.app/setup` once to register the webhook
6. Done! Bot is live 🚀

### Subsequent Deploys
Just push to `main` — Netlify auto-deploys. No need to re-register webhook.

---

## Architecture Notes

### Bot: Webhook vs Polling
- **Production (Netlify)**: Uses webhook mode — Telegram sends HTTP POST to `/.netlify/functions/bot`
- **Local dev**: Uses polling mode — `bot.js` polls Telegram API every few seconds
- The webhook handler uses native `fetch()` (no npm deps for production)

### Telegram Fullscreen
- Fullscreen is **only requested on mobile** platforms (`android`, `android_x`, `ios`)
- Desktop platforms (`tdesktop`, `web`, `macos`) use expanded mode instead

### Winner Detection
- Pointer is at top = angle `-π/2` in canvas coords
- Formula: `pointerAngle = (-π/2 - currentRotation) mod 2π`
- Winner index: `floor(pointerAngle / sliceAngle)`

### Safe Area CSS Variables
Set by JavaScript from `tg.safeAreaInset` and `tg.contentSafeAreaInset`:
- `--tg-safe-area-top/bottom/left/right`
- `--tg-content-safe-top/bottom`

---

## Important Reminders
- **Netlify env vars** are the single source of truth for `BOT_TOKEN` in production
- `WEB_APP_URL` is auto-detected from Netlify's site URL if not explicitly set
- Cloudflare quick tunnels are **temporary** — URL changes on every restart
- Names are stored in `localStorage` under key `wheelOfNames`
- All frontend code is a single IIFE (no module imports)
- After changing bot commands, visit `/setup` again to re-register
