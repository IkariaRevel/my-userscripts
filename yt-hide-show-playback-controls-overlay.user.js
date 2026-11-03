// ==UserScript==
// @name         YouTube Скрыть-показать управление воспроизведением
// @namespace    local.yt.player.toggle
// @version      1.0
// @description  Кнопка в правом верхнем углу плеера для скрытия и показа оверлея
// @match        *://*.youtube.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @updateURL    https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-hide-show-playback-controls-overlay.user.js
// @downloadURL  https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-hide-show-playback-controls-overlay.user.js
// ==/UserScript==

(function() {
    'use strict';

    const toggleCSS = `
        /* 1. Кнопка переключателя */
        #yt-toggle-controls-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 34px;
            height: 34px;
            background: rgba(18, 18, 18, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2147483647 !important;
            opacity: 0.35;
            transition: opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
            color: #b0b0b0;
            padding: 0;
            outline: none;
            backdrop-filter: blur(4px);
        }

        #yt-toggle-controls-btn:hover {
            opacity: 1 !important;
            background: rgba(24, 24, 24, 0.85);
            color: #ffffff;
        }

        /* 2. Состояние: элементы скрыты (индикация янтарным цветом) */
        #movie_player.yt-controls-hidden-active #yt-toggle-controls-btn {
            color: #d09a3f;
            border-color: rgba(208, 154, 63, 0.4);
            opacity: 0.65;
        }

        #movie_player.yt-controls-hidden-active #yt-toggle-controls-btn:hover {
            opacity: 1 !important;
        }

        /* 3. Подавление всех элементов управления, оверлеев и быстрых действий в Fullscreen при включённом режиме*/
        #movie_player.yt-controls-hidden-active .ytp-chrome-bottom,
        #movie_player.yt-controls-hidden-active .ytp-chrome-top,
        #movie_player.yt-controls-hidden-active .ytp-gradient-bottom,
        #movie_player.yt-controls-hidden-active .ytp-gradient-top,
        #movie_player.yt-controls-hidden-active .ytp-progress-bar-container,
        #movie_player.yt-controls-hidden-active .ytp-overlay-top-left,
        #movie_player.yt-controls-hidden-active .ytp-fullscreen-metadata,
        #movie_player.yt-controls-hidden-active yt-player-overlay-video-details-renderer,
        #movie_player.yt-controls-hidden-active .ytp-popup,
        #movie_player.yt-controls-hidden-active .ytp-tooltip,
        /* Быстрые действия справа внизу (лайк, дизлайк, комментарии, поделиться) */
        #movie_player.yt-controls-hidden-active .ytp-fullscreen-quick-actions,
        #movie_player.yt-controls-hidden-active .ytp-overlay-bottom-right,
        #movie_player.yt-controls-hidden-active yt-player-quick-action-buttons,
        /* Сетка рекомендаций и стрелка внизу экрана в полноэкранном режиме */
        #movie_player.yt-controls-hidden-active .ytp-fullscreen-grid,
        #movie_player.yt-controls-hidden-active .ytp-fullscreen-grid-expand-button {
            display: none !important;
            pointer-events: none !important;
        }
    `;

    if (typeof GM_addStyle === 'function') {
        GM_addStyle(toggleCSS);
    } else {
        const style = document.createElement('style');
        style.textContent = toggleCSS;
        (document.head || document.documentElement).appendChild(style);
    }

    // Иконка "Глаз" (панель видна)
    const ICON_EYE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;

    // Иконка "Перечеркнутый глаз" (панель скрыта)
    const ICON_EYE_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

    function injectButton() {
        const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (!player || document.getElementById('yt-toggle-controls-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'yt-toggle-controls-btn';
        btn.title = 'Скрыть панель управления';
        btn.innerHTML = ICON_EYE;

        // Блокировка всплытия событий, чтобы клик по кнопке не ставил видео на паузу
        ['click', 'mousedown', 'mouseup', 'pointerdown', 'dblclick'].forEach(evt => {
            btn.addEventListener(evt, e => e.stopPropagation());
        });

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = player.classList.toggle('yt-controls-hidden-active');
            btn.innerHTML = isHidden ? ICON_EYE_OFF : ICON_EYE;
            btn.title = isHidden ? 'Показать панель управления' : 'Скрыть панель управления';
        });

        player.appendChild(btn);
    }

    // Поддержка SPA-навигации YouTube
    window.addEventListener('yt-navigate-finish', injectButton);

    const observer = new MutationObserver(() => {
        if (!document.getElementById('yt-toggle-controls-btn')) {
            injectButton();
        }
    });

    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    injectButton();
})();
