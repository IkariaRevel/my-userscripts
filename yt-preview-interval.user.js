// ==UserScript==
// @name         YouTube: главная страница — расстояние между превью
// @namespace    local.yt.grid
// @version      1.0
// @description  Настройка расстояния между миниатюрами на главной странице YouTube
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @updateURL    https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-preview-interval.user.js
// @downloadURL  https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-preview-interval.user.js
// ==/UserScript==

(function() {
    'use strict';

    const customCSS = `
        :root {
          /* Настройки расстояния между карточками на главной */
            --custom-grid-gap-x: 26px;                  /* Расстояние по горизонтали (в YT по умолчанию: 16px) */
            --custom-grid-gap-y: 60px;                  /* Расстояние по вертикали (в YT по умолчанию: 40px) */
        }

        /* 1. Переопределение внутренних переменных расчёта сетки YouTube */
        ytd-rich-grid-renderer {
            --ytd-rich-grid-item-margin: var(--custom-grid-gap-x) !important;
            --ytd-rich-grid-row-margin: var(--custom-grid-gap-y) !important;
        }

        /* 2. Горизонтальные отступы и устранение перекоса первой колонки */
        ytd-rich-item-renderer[rendered-from-rich-grid],
        ytd-rich-item-renderer {
            margin-left: calc(var(--custom-grid-gap-x) / 2) !important;
            margin-right: calc(var(--custom-grid-gap-x) / 2) !important;
        }

        ytd-rich-item-renderer[is-in-first-column] {
            margin-left: calc(var(--custom-grid-gap-x) / 2) !important;
        }

        /* 3. Вертикальные отступы между рядами видео */
        /* Для разметки со строками-контейнерами ytd-rich-grid-row */
        ytd-rich-grid-row {
            margin-bottom: var(--custom-grid-gap-y) !important;
        }

        /* Обнуление нижнего отступа внутри строки, чтобы отступы не удваивались */
        ytd-rich-grid-row ytd-rich-item-renderer {
            margin-bottom: 0 !important;
        }

        /* Для разметки с прямыми карточками без строк-обёрток */
        #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer {
            margin-bottom: var(--custom-grid-gap-y) !important;
        }

        /* Разделительные секции (Shorts, полки каналов) */
        ytd-rich-section-renderer {
            margin-bottom: var(--custom-grid-gap-y) !important;
        }
    `;

    if (typeof GM_addStyle === 'function') {
        GM_addStyle(customCSS);
    } else {
        const inject = () => {
            const style = document.createElement('style');
            style.id = 'yt-grid-spacing';
            style.textContent = customCSS;
            (document.head || document.documentElement).appendChild(style);
        };
        if (document.documentElement) {
            inject();
        } else {
            document.addEventListener('DOMContentLoaded', inject);
        }
    }
})();
