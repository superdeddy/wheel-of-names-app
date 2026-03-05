/* ========================================
   WHEEL OF NAMES — APP.JS
   Main Application Logic
   ======================================== */

(function () {
    'use strict';

    // ─── Telegram SDK (Full API) ────────────────
    const tg = window.Telegram?.WebApp;
    let isFullscreen = false;

    function initTelegram() {
        if (!tg) return;

        // 1. Signal readiness to Telegram
        tg.ready();

        // 2. Expand to maximum available height first
        tg.expand();

        // 3. Set colors to match our dark theme
        if (tg.setHeaderColor) tg.setHeaderColor('#0a0a1a');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0a0a1a');
        if (tg.setBottomBarColor) tg.setBottomBarColor('#0a0a1a');

        // 4. Disable vertical swipes to prevent accidental app close
        if (tg.disableVerticalSwipes) {
            tg.disableVerticalSwipes();
        }

        // 5. Lock orientation to portrait for best wheel experience
        if (tg.lockOrientation) {
            try { tg.lockOrientation(); } catch (e) { /* not supported */ }
        }

        // 6. Request FULLSCREEN — only on MOBILE platforms, not desktop
        const platform = (tg.platform || '').toLowerCase();
        const isMobile = ['android', 'android_x', 'ios'].includes(platform);
        if (isMobile && tg.requestFullscreen) {
            try {
                tg.requestFullscreen();
            } catch (e) {
                console.log('Fullscreen not available, using expanded mode');
            }
        }

        // 7. Listen for fullscreen state changes
        if (tg.onEvent) {
            tg.onEvent('fullscreenChanged', () => {
                isFullscreen = tg.isFullscreen;
                document.body.classList.toggle('tg-fullscreen', isFullscreen);
                // Re-layout after fullscreen change
                setTimeout(() => {
                    resizeCanvas();
                    drawWheel();
                }, 100);
            });

            tg.onEvent('fullscreenFailed', (event) => {
                console.log('Fullscreen failed:', event?.error);
                isFullscreen = false;
                document.body.classList.remove('tg-fullscreen');
            });

            // Listen for viewport changes (safe area updates)
            tg.onEvent('viewportChanged', (event) => {
                if (event.isStateStable) {
                    resizeCanvas();
                    drawWheel();
                }
            });
        }

        // 8. Mark body with Telegram class for CSS adjustments
        document.body.classList.add('in-telegram');
        if (tg.isFullscreen) {
            isFullscreen = true;
            document.body.classList.add('tg-fullscreen');
        }

        // 9. Apply Telegram safe area CSS variables if available
        applyTelegramSafeArea();
    }

    function applyTelegramSafeArea() {
        if (!tg) return;
        const root = document.documentElement;

        // Telegram provides safe area insets for fullscreen mode
        if (tg.safeAreaInset) {
            root.style.setProperty('--tg-safe-area-top', (tg.safeAreaInset.top || 0) + 'px');
            root.style.setProperty('--tg-safe-area-bottom', (tg.safeAreaInset.bottom || 0) + 'px');
            root.style.setProperty('--tg-safe-area-left', (tg.safeAreaInset.left || 0) + 'px');
            root.style.setProperty('--tg-safe-area-right', (tg.safeAreaInset.right || 0) + 'px');
        }

        // Content safe area (accounts for Telegram header/bottom bar)
        if (tg.contentSafeAreaInset) {
            root.style.setProperty('--tg-content-safe-top', (tg.contentSafeAreaInset.top || 0) + 'px');
            root.style.setProperty('--tg-content-safe-bottom', (tg.contentSafeAreaInset.bottom || 0) + 'px');
        }
    }

    // Initialize Telegram immediately
    initTelegram();

    // ─── Color Palette for Segments ─────────────
    const SEGMENT_COLORS = [
        '#7c5cfc', '#ff6b9d', '#00d4aa', '#ffa726', '#29b6f6',
        '#ef5350', '#ab47bc', '#26a69a', '#ff7043', '#66bb6a',
        '#5c6bc0', '#ec407a', '#42a5f5', '#ffca28', '#8d6e63',
        '#78909c', '#d4e157', '#26c6da', '#ff8a65', '#9ccc65',
        '#7e57c2', '#f06292', '#4dd0e1', '#ffb74d', '#81c784',
    ];

    // ─── State ──────────────────────────────────
    let names = [];
    let isSpinning = false;
    let currentRotation = 0;
    let lastWinnerName = '';

    // ─── DOM Elements ───────────────────────────
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');
    const nameInput = document.getElementById('nameInput');
    const addBtn = document.getElementById('addBtn');
    const namesList = document.getElementById('namesList');
    const namesCount = document.getElementById('namesCount');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const panelToggle = document.getElementById('panelToggle');
    const namesPanel = document.getElementById('namesPanel');
    const wheelWrapper = document.getElementById('wheelWrapper');
    const winnerModal = document.getElementById('winnerModal');
    const winnerNameEl = document.getElementById('winnerName');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const removeWinnerBtn = document.getElementById('removeWinnerBtn');
    const confettiCanvas = document.getElementById('confettiCanvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    const bgParticles = document.getElementById('bgParticles');

    // ─── Default Names ──────────────────────────
    const DEFAULT_NAMES = [
        'Alice', 'Bob', 'Charlie', 'Diana', 'Edward',
        'Fiona', 'George', 'Hannah'
    ];

    // ─── Init ───────────────────────────────────
    function init() {
        loadNames();
        createBgParticles();
        resizeCanvas();
        drawWheel();
        renderNamesList();
        bindEvents();
        window.addEventListener('resize', () => {
            resizeCanvas();
            drawWheel();
            resizeConfetti();
        });
    }

    // ─── Canvas Resize ──────────────────────────
    function resizeCanvas() {
        const wrapper = wheelWrapper;
        const size = wrapper.clientWidth;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function resizeConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }

    // ─── Background Particles ───────────────────
    function createBgParticles() {
        bgParticles.innerHTML = '';
        const count = 15;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'bg-particle';
            const size = Math.random() * 6 + 2;
            const colors = ['#7c5cfc', '#ff6b9d', '#00d4aa', '#ffa726'];
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDuration = (Math.random() * 15 + 10) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';
            bgParticles.appendChild(p);
        }
    }

    // ─── Persistence ────────────────────────────
    function loadNames() {
        try {
            const saved = localStorage.getItem('wheelOfNames');
            if (saved) {
                names = JSON.parse(saved);
                if (!Array.isArray(names) || names.length === 0) {
                    names = [...DEFAULT_NAMES];
                }
            } else {
                names = [...DEFAULT_NAMES];
            }
        } catch {
            names = [...DEFAULT_NAMES];
        }
    }

    function saveNames() {
        try {
            localStorage.setItem('wheelOfNames', JSON.stringify(names));
        } catch { /* quota exceeded, ignore */ }
    }

    // ─── Draw Wheel ─────────────────────────────
    function drawWheel(rotation = currentRotation) {
        const size = canvas.style.width ? parseInt(canvas.style.width) : 300;
        const cx = size / 2;
        const cy = size / 2;
        const radius = (size / 2) - 4;

        ctx.clearRect(0, 0, size, size);

        if (names.length === 0) {
            drawEmptyWheel(cx, cy, radius);
            return;
        }

        const sliceAngle = (2 * Math.PI) / names.length;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        // Draw segments
        names.forEach((name, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

            // Segment
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Subtle border between segments
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Text
            ctx.save();
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = `600 ${getTextSize(names.length, radius)}px Inter, sans-serif`;
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 4;

            const textMaxWidth = radius * 0.55;
            let displayName = name;
            const measured = ctx.measureText(displayName);
            if (measured.width > textMaxWidth) {
                while (ctx.measureText(displayName + '…').width > textMaxWidth && displayName.length > 1) {
                    displayName = displayName.slice(0, -1);
                }
                displayName += '…';
            }

            ctx.fillText(displayName, radius - 14, 4);
            ctx.shadowBlur = 0;
            ctx.restore();
        });

        ctx.restore();

        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner ring glow
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 1, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Center circle (behind button)
        const centerR = size * 0.12;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerR);
        grad.addColorStop(0, '#1a1a3e');
        grad.addColorStop(1, '#0d0d24');
        ctx.beginPath();
        ctx.arc(cx, cy, centerR, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawEmptyWheel(cx, cy, radius) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#1a1a3e';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = '500 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Add names to begin!', cx, cy);
    }

    function getTextSize(count, radius) {
        if (count <= 4) return Math.min(16, radius * 0.09);
        if (count <= 8) return Math.min(14, radius * 0.075);
        if (count <= 12) return Math.min(12, radius * 0.065);
        if (count <= 20) return Math.min(10, radius * 0.055);
        return Math.min(8, radius * 0.045);
    }

    // ─── Spin Engine ────────────────────────────
    function spin() {
        if (isSpinning || names.length < 2) return;

        isSpinning = true;
        spinBtn.disabled = true;
        wheelWrapper.classList.add('spinning');

        // Random target: 5-10 full rotations + random offset
        const extraRotations = (Math.floor(Math.random() * 5) + 5) * 2 * Math.PI;
        const randomOffset = Math.random() * 2 * Math.PI;
        const targetRotation = currentRotation + extraRotations + randomOffset;
        const spinDuration = 4000 + Math.random() * 2000; // 4-6 seconds
        const startTime = performance.now();
        const startRotation = currentRotation;

        // Tick sound simulation interval
        let lastTickSegment = -1;

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);

            // Cubic ease-out for natural deceleration
            const eased = 1 - Math.pow(1 - progress, 3);

            currentRotation = startRotation + (targetRotation - startRotation) * eased;
            drawWheel(currentRotation);

            // Haptic tick on segment changes
            if (tg?.HapticFeedback && names.length > 0) {
                const normalizedRotation = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                const sliceAngle = (2 * Math.PI) / names.length;
                const currentSegment = Math.floor(normalizedRotation / sliceAngle);
                if (currentSegment !== lastTickSegment) {
                    lastTickSegment = currentSegment;
                    if (progress < 0.95) {
                        tg.HapticFeedback.impactOccurred('light');
                    }
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                onSpinComplete();
            }
        }

        requestAnimationFrame(animate);
    }

    function onSpinComplete() {
        isSpinning = false;
        spinBtn.disabled = false;
        wheelWrapper.classList.remove('spinning');

        // Determine winner
        // The pointer is at the top (12 o'clock position)
        // In canvas coords, top = angle -π/2 (or 3π/2)
        // Segments are drawn starting from angle 0 (3 o'clock) going clockwise
        // After rotation, segment i occupies: [rotation + i*slice, rotation + (i+1)*slice]
        // We need to find which segment is at the pointer angle (-π/2)
        const sliceAngle = (2 * Math.PI) / names.length;
        const pointerAngle = ((-Math.PI / 2 - currentRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const winnerIndex = Math.floor(pointerAngle / sliceAngle) % names.length;

        lastWinnerName = names[winnerIndex];
        showWinner(lastWinnerName);

        // Haptic
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }

    // ─── Winner Modal ───────────────────────────
    function showWinner(name) {
        winnerNameEl.textContent = name;
        winnerModal.classList.add('active');
        resizeConfetti();
        startConfetti();
    }

    function hideWinner() {
        winnerModal.classList.remove('active');
        stopConfetti();
    }

    // ─── Confetti System ────────────────────────
    let confettiParticles = [];
    let confettiAnimId = null;

    function startConfetti() {
        confettiParticles = [];
        const w = confettiCanvas.width;
        const h = confettiCanvas.height;

        for (let i = 0; i < 120; i++) {
            confettiParticles.push({
                x: w / 2 + (Math.random() - 0.5) * w * 0.6,
                y: h * 0.4,
                vx: (Math.random() - 0.5) * 12,
                vy: -(Math.random() * 12 + 4),
                color: SEGMENT_COLORS[Math.floor(Math.random() * SEGMENT_COLORS.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                gravity: 0.15 + Math.random() * 0.1,
                opacity: 1,
                shape: Math.random() > 0.5 ? 'rect' : 'circle',
            });
        }

        function animateConfetti() {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            let alive = false;

            confettiParticles.forEach(p => {
                p.x += p.vx;
                p.vy += p.gravity;
                p.y += p.vy;
                p.rotation += p.rotSpeed;
                p.vx *= 0.99;
                p.opacity -= 0.003;

                if (p.opacity <= 0) return;
                alive = true;

                confettiCtx.save();
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate((p.rotation * Math.PI) / 180);
                confettiCtx.globalAlpha = Math.max(0, p.opacity);
                confettiCtx.fillStyle = p.color;

                if (p.shape === 'rect') {
                    confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    confettiCtx.beginPath();
                    confettiCtx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
                    confettiCtx.fill();
                }

                confettiCtx.restore();
            });

            if (alive) {
                confettiAnimId = requestAnimationFrame(animateConfetti);
            }
        }

        animateConfetti();
    }

    function stopConfetti() {
        if (confettiAnimId) {
            cancelAnimationFrame(confettiAnimId);
            confettiAnimId = null;
        }
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }

    // ─── Name Management ────────────────────────
    function addName(name) {
        name = name.trim();
        if (!name) return;
        names.push(name);
        saveNames();
        drawWheel();
        renderNamesList();
    }

    function removeName(index) {
        names.splice(index, 1);
        saveNames();
        drawWheel();
        renderNamesList();
    }

    function removeNameByValue(name) {
        const idx = names.indexOf(name);
        if (idx !== -1) {
            removeName(idx);
        }
    }

    function shuffleNames() {
        for (let i = names.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [names[i], names[j]] = [names[j], names[i]];
        }
        saveNames();
        drawWheel();
        renderNamesList();
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }
    }

    function clearAllNames() {
        if (names.length === 0) return;
        names = [];
        saveNames();
        drawWheel();
        renderNamesList();
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('heavy');
        }
    }

    // ─── Render Names List ──────────────────────
    function renderNamesList() {
        namesCount.textContent = names.length;

        if (names.length === 0) {
            namesList.innerHTML = '<li class="names-empty">No names added yet.<br>Add some names to get started! 🎯</li>';
            spinBtn.disabled = true;
            return;
        }

        spinBtn.disabled = names.length < 2;

        namesList.innerHTML = names.map((name, i) => {
            const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
            return `
                <li class="name-item" data-index="${i}">
                    <span class="name-color-dot" style="background: ${color}; color: ${color}"></span>
                    <span class="name-text">${escapeHtml(name)}</span>
                    <button class="name-delete-btn" data-index="${i}" aria-label="Remove ${escapeHtml(name)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </li>
            `;
        }).join('');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── Event Bindings ─────────────────────────
    function bindEvents() {
        // Spin
        spinBtn.addEventListener('click', spin);

        // Add name
        addBtn.addEventListener('click', () => {
            addName(nameInput.value);
            nameInput.value = '';
            nameInput.focus();
        });

        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addName(nameInput.value);
                nameInput.value = '';
            }
        });

        // Delete name (delegated)
        namesList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.name-delete-btn');
            if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index, 10);
                removeName(index);
                if (tg?.HapticFeedback) {
                    tg.HapticFeedback.impactOccurred('light');
                }
            }
        });

        // Shuffle
        shuffleBtn.addEventListener('click', shuffleNames);

        // Clear all
        clearBtn.addEventListener('click', () => {
            if (names.length > 0) {
                clearAllNames();
            }
        });

        // Panel toggle
        panelToggle.addEventListener('click', () => {
            namesPanel.classList.toggle('collapsed');
        });

        // Winner modal
        closeModalBtn.addEventListener('click', hideWinner);

        removeWinnerBtn.addEventListener('click', () => {
            removeNameByValue(lastWinnerName);
            hideWinner();
        });

        // Close modal on overlay click
        winnerModal.addEventListener('click', (e) => {
            if (e.target === winnerModal) {
                hideWinner();
            }
        });

        // Telegram back button
        if (tg?.BackButton) {
            tg.BackButton.onClick(() => {
                if (winnerModal.classList.contains('active')) {
                    hideWinner();
                } else {
                    tg.close();
                }
            });
        }
    }

    // ─── Launch ─────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
