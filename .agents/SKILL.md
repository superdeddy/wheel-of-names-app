---
name: Wheel of Names Telegram Mini App
description: A premium fullscreen Telegram Mini App for random name selection, built with vanilla HTML/CSS/JS and Canvas API.
---

# Wheel of Names — Skill Reference

## Overview

This skill covers the development and maintenance of the **Wheel of Names** Telegram Mini App — a random name picker with a Canvas-rendered spinning wheel, physics-based animation, winner detection, confetti celebrations, and full Telegram Mini App API integration.

## Project Path
```
E:\Documents\Google Antigravity\wheel-of-names-app
```

## Core Concepts

### 1. Telegram Mini App SDK

The app integrates deeply with the Telegram WebApp SDK. Key APIs used:

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

The wheel is rendered using the Canvas 2D API:

- **Segments**: Equal-angle arcs colored from a 10-color palette
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

### 5. Confetti Particle System

- 80 particles spawned on winner
- Random colors from segment palette
- Gravity simulation: `vy += 0.15` per frame
- Angular velocity for rotation
- 3-second lifetime

### 6. Design System

| Token | Value |
|-------|-------|
| Background | `#0a0a1a` (deep navy) |
| Accent 1 | `#7c5cfc` (purple) |
| Accent 2 | `#ff6b9d` (pink) |
| Accent 3 | `#00d4aa` (teal) |
| Font | Inter, system fallbacks |
| Glass BG | `rgba(255,255,255,0.06)` |
| Border radius | 10-32px scale |

## File Structure

| File | Lines | Description |
|------|-------|-------------|
| `app.js` | ~666 | Single IIFE containing all client logic |
| `index.css` | ~800 | Complete design system, animations, responsive rules |
| `index.html` | ~110 | Markup, meta tags, Telegram SDK script include |
| `bot.js` | ~64 | Node.js Telegram bot (polling mode) |

## Common Tasks

### Adding a new Telegram SDK feature
1. Check if the API exists: `if (tg.newApiMethod) { ... }`
2. Wrap in try/catch for graceful fallback
3. Add platform detection if mobile-only
4. Update safe-area CSS variables if layout-related

### Modifying the wheel appearance
1. Edit `SEGMENT_COLORS` array in `app.js` for colors
2. Modify `drawWheel()` function for visual changes
3. Adjust the Canvas dimensions in `resizeCanvas()`

### Changing spin behavior
1. Modify `totalDuration` for spin length
2. Modify total rotation multiplier for speed
3. Change easing function in the animation loop

### Adding new name management features
1. Add UI in `index.html` inside `.panel-body`
2. Style in `index.css` inside the Names Panel section
3. Add logic in `app.js` inside the Name Management section
4. Call `saveNames()` after any changes to persist

## Deployment Checklist

- [ ] Update `WEB_APP_URL` in `bot.js` with production URL
- [ ] Deploy static files (`index.html`, `index.css`, `app.js`) to HTTPS host
- [ ] Deploy `bot.js` to persistent Node.js runtime
- [ ] Set bot profile photo via BotFather
- [ ] Test on both Android and iOS Telegram clients
- [ ] Verify fullscreen mode works on mobile
- [ ] Verify desktop shows expanded (non-fullscreen) mode
- [ ] Test winner detection accuracy
