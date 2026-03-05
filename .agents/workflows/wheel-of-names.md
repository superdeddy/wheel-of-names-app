---
name: wheel-of-names
description: How to develop, test, and deploy the Wheel of Names Telegram Mini App
---

# Wheel of Names — Development Workflow

## Project Location
`E:\Documents\Google Antigravity\wheel-of-names-app`

## Tech Stack
- **Frontend**: Vanilla HTML + CSS + JavaScript (no build step)
- **Bot**: Node.js with `node-telegram-bot-api`
- **SDK**: Telegram WebApp SDK v8.0
- **Rendering**: Canvas 2D API

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Entry point, SDK script, structure |
| `index.css` | Design system, responsive styles, Telegram safe-area CSS |
| `app.js` | All client-side logic (IIFE module, ~666 lines) |
| `bot.js` | Telegram bot `/start` and `/help` commands |

---

## Development

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
> Copy the generated `trycloudflare.com` URL and update `WEB_APP_URL` in `bot.js`.

### 3. Start Telegram Bot
```bash
cd E:\Documents\Google Antigravity\wheel-of-names-app
npm start
```

### 4. Test in Telegram
1. Open the bot in Telegram
2. Send `/start`
3. Tap **"🎡 Open Wheel of Names"**

---

## Architecture Notes

### Telegram Fullscreen
- Fullscreen is **only requested on mobile** platforms (`android`, `android_x`, `ios`)
- Desktop platforms (`tdesktop`, `web`, `macos`) use expanded mode instead
- Platform detection: `tg.platform`

### Winner Detection
- Pointer is at top = angle `-π/2` in canvas coords
- Formula: `pointerAngle = (-π/2 - currentRotation) mod 2π`
- Winner index: `floor(pointerAngle / sliceAngle)`

### Safe Area CSS Variables
Set by JavaScript from `tg.safeAreaInset` and `tg.contentSafeAreaInset`:
- `--tg-safe-area-top/bottom/left/right`
- `--tg-content-safe-top/bottom`

### CSS Classes (toggled by JS)
- `body.in-telegram` — Running inside Telegram client
- `body.tg-fullscreen` — Fullscreen mode active (adds safe-area padding)

---

## Deployment

### Static Files → Netlify / Vercel
Deploy: `index.html`, `index.css`, `app.js`

### Bot → VPS / Railway
1. Set `WEB_APP_URL` in `bot.js` to production URL
2. `npm install && npm start`

---

## Important Reminders
- **Bot token** is in `bot.js` line 14
- **`WEB_APP_URL`** must be HTTPS and updated for each deployment
- Cloudflare quick tunnels are **temporary** — URL changes on every restart
- Names are stored in `localStorage` under key `wheelOfNames`
- All frontend code is a single IIFE (no module imports)
