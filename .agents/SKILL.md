---
name: Wheel of Names Telegram Mini App
description: A premium fullscreen Telegram Mini App for random name selection, built with vanilla HTML/CSS/JS and Canvas API. Deployed entirely on Netlify (static + serverless).
---

# Wheel of Names — Skill Reference

## Overview

This skill covers the development and maintenance of the **Wheel of Names** Telegram Mini App — a random name picker with a Canvas-rendered spinning wheel, physics-based animation, winner detection, confetti celebrations, and full Telegram Mini App API integration.

**Deployment**: Entirely on **Netlify** (static files + serverless functions). No separate server needed.

## Project Path
```
E:\Documents\Google Antigravity\wheel-of-names-app
```

## Architecture

The app has two parts, both hosted on Netlify:

1. **Static Files** (`index.html`, `index.css`, `app.js`) — The Mini App UI
2. **Serverless Functions** (`netlify/functions/bot.js`, `setup.js`) — The Telegram bot (webhook mode)

### Bot: Polling vs Webhook

| Mode | File | Usage |
|------|------|-------|
| **Webhook** (production) | `netlify/functions/bot.js` | Runs on Netlify Functions, no server needed |
| **Polling** (local dev) | `bot.js` | Runs on your computer via `node bot.js` |

## Core Concepts

### 1. Telegram Mini App SDK

| API | Purpose | Platform |
|-----|---------|----------|
| `tg.ready()` | Signal app is loaded | All |
| `tg.expand()` | Maximize height | All |
| `tg.requestFullscreen()` | Full immersive mode | Mobile only |
| `tg.disableVerticalSwipes()` | Prevent swipe-to-close | All |
| `tg.setHeaderColor(color)` | Match header theme | All |
| `tg.setBackgroundColor(color)` | Match bg theme | All |
| `tg.setBottomBarColor(color)` | Match bottom bar theme | All |
| `tg.lockOrientation()` | Lock to portrait | Mobile |
| `tg.HapticFeedback` | Tactile feedback | Mobile |
| `tg.BackButton` | Native back navigation | All |
| `tg.safeAreaInset` | Device notch/camera insets | Fullscreen |
| `tg.contentSafeAreaInset` | Telegram UI insets | All |

#### Platform-Specific Behavior
```javascript
const platform = (tg.platform || '').toLowerCase();
const isMobile = ['android', 'android_x', 'ios'].includes(platform);
// Only request fullscreen on mobile
if (isMobile && tg.requestFullscreen) {
    tg.requestFullscreen();
}
```

#### Safe Area CSS Variables
JavaScript sets these on `:root`, consumed by CSS:
```css
--tg-safe-area-top    /* Device notch/island */
--tg-safe-area-bottom /* Home indicator */
--tg-safe-area-left   /* Edge insets */
--tg-safe-area-right  /* Edge insets */
--tg-content-safe-top    /* Telegram header */
--tg-content-safe-bottom /* Telegram bottom bar */
```

### 2. Canvas Wheel Rendering

- **Segments**: Equal-angle arcs colored from a 25-color palette
- **Text**: Radially oriented names along segment bisectors
- **Center**: Gradient-filled circle with decorative border
- **Resolution**: Uses `devicePixelRatio` for crisp rendering on HiDPI screens

### 3. Spin Physics Engine

```
Phase: Cubic Ease-Out
Formula: eased = 1 - (1 - progress)³
Duration: 4000-6000ms (randomized)
Rotation: 5-10 full rotations + random offset
```

### 4. Winner Detection Algorithm

The pointer sits at 12 o'clock (top of wheel = angle `-π/2` in canvas coordinates):

```javascript
const sliceAngle = (2 * Math.PI) / names.length;
const pointerAngle = ((-Math.PI / 2 - currentRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
const winnerIndex = Math.floor(pointerAngle / sliceAngle) % names.length;
```

**Critical**: The `-Math.PI / 2` offset is essential — without it, the winner calculation will be off by one or more segments.

### 5. Netlify Serverless Bot

The webhook handler (`netlify/functions/bot.js`):
- Receives POST requests from Telegram
- Uses native Node.js `https` module to call Telegram Bot API (no npm dependencies)
- Reads `BOT_TOKEN` from `process.env`
- Auto-detects `WEB_APP_URL` from Netlify's site URL

The setup function (`netlify/functions/setup.js`):
- One-time registration endpoint: visit `/setup` after deploy
- Registers webhook URL with Telegram
- Sets bot commands (`/start`, `/help`)
- Configures the Mini App menu button

## File Structure

| File | Purpose |
|------|---------|
| `app.js` | Single IIFE containing all client logic (~666 lines) |
| `index.css` | Complete design system, animations, responsive rules (~800 lines) |
| `index.html` | Markup, meta tags, Telegram SDK script include |
| `netlify/functions/bot.js` | **Production** — Serverless webhook handler |
| `netlify/functions/setup.js` | **One-time** — Webhook + bot command registration |
| `netlify.toml` | Netlify config (publish dir, functions dir) |
| `bot.js` | **Local dev only** — Polling mode bot |

## Common Tasks

### Deploying to Netlify
1. Push code to GitHub
2. Connect repo to Netlify
3. Set `BOT_TOKEN` in Netlify Environment Variables
4. Deploy, then visit `https://your-site.netlify.app/setup` once
5. Test with `/start` in Telegram

### Adding a new Telegram SDK feature
1. Check if the API exists: `if (tg.newApiMethod) { ... }`
2. Wrap in try/catch for graceful fallback
3. Add platform detection if mobile-only
4. Update safe-area CSS variables if layout-related

### Modifying the wheel appearance
1. Edit `SEGMENT_COLORS` array in `app.js` for colors
2. Modify `drawWheel()` function for visual changes
3. Adjust the Canvas dimensions in `resizeCanvas()`

### Adding new bot commands
1. Add handler in `netlify/functions/bot.js` (production)
2. Add handler in `bot.js` (local dev)
3. Register the command in `netlify/functions/setup.js`
4. Visit `/setup` again after deployment

## Deployment Checklist

- [ ] Set `BOT_TOKEN` in Netlify Environment Variables
- [ ] Deploy site from GitHub
- [ ] Visit `/setup` to register webhook
- [ ] Test `/start` in Telegram on mobile (Android + iOS)
- [ ] Verify fullscreen mode works on mobile
- [ ] Verify desktop shows expanded (non-fullscreen) mode
- [ ] Test winner detection accuracy
