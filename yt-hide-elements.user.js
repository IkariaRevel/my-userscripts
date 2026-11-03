// ==UserScript==
// @name         YouTube: Скрыть элементы интерфейса (выбор в настройках скрипта)
// @namespace    local.yt.hider
// @version      1.1
// @description  Модульное скрытие элементов YouTube через переключение data-атрибутов
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @updateURL    https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-hide-elements.user.js
// @downloadURL  https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-hide-elements.user.js
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // СПИСОК ЭЛЕМЕНТОВ ДЛЯ СКРЫТИЯ
    // Для добавления нового элемента добавьте сюда один объект:
    // =========================================================================
    const CONFIG = [
        {
            id: 'home-chips',
            title: 'Горизонтальное меню категорий на главной ("Все", "Видеоигры"...)',
            selector: 'ytd-browse[page-subtype="home"] #header.ytd-rich-grid-renderer',
            defaultState: true
        },


        {
            id: 'video-views',
            title: 'Количество просмотров у видео',
            selector: [
                /* 1. Страница ролика: под плеером и внутри развернутого описания */
                'ytd-watch-metadata #view-count',
                'ytd-video-view-count-renderer',
                ':is(#info-container, #info-strings) yt-formatted-string > span:first-of-type:not(:only-of-type)',

                /* 2. Лента со старой разметкой Polymer: просмотры перед датой */
                '#metadata-line > :is(.inline-metadata-item, span):first-of-type:not(:only-of-type)',

                /* 3. Лента с новой разметкой: просмотры на 2-й строке (если есть дата) */
                ':is([class*="metadata-row"], [class*="MetadataRow"]):not(:first-child) > span:first-child:has(~ :is([class*="delimiter"], [class*="Delimiter"]))',

                /* 4. Лента с новой разметкой: просмотры на 1-й строке (не трогая автора) */
                ':is([class*="metadata-row"], [class*="MetadataRow"]) > span:not(:first-child):has(+ :is([class*="delimiter"], [class*="Delimiter"]))',

                /* 5. Значок-треугольник перед просмотрами */
                ':is([class*="metadata-row"], [class*="MetadataRow"]) :is([class*="LeadingIcon"], [class*="leading-icon"])'
            ].join(', '),
            defaultState: true
        },


        {
            id: 'channel-avatars',
            title: 'Аватары каналов и авторов (везде, включая кнопку профиля — закомментировано по умолчанию)',
            selector: [
                /* 1. Карточки видео (ленты, поиск, боковые панели) */
                '.yt-lockup-metadata-view-model__avatar',
                'ytd-rich-grid-media #avatar-container',
                'ytd-video-renderer #channel-thumbnail',
                'ytd-compact-video-renderer #channel-thumbnail',
                'ytd-channel-renderer #avatar-section',

                /* 2. Страница ролика и шапка канала */
                'ytd-video-owner-renderer #avatar',
                'yt-page-header-view-model yt-decorated-avatar-view-model',
                'ytd-c4-tabbed-header-renderer #avatar',

                /* 3. Комментарии, чат стримов (все типы сообщений), Shorts */
                '#author-thumbnail',
                '#author-photo',
                'ytd-reel-player-overlay-renderer #channel-avatar',

                /* 4. Аватар в выпадающем окне уведомлений */
                'ytd-notification-renderer #avatar',

                /* 5. Кнопка профиля в правом верхнем углу шапки */
                /* '#avatar-btn', */

                /* 6. Универсальный фолбэк для любых прочих блоков */
                'yt-avatar-shape'
            ].join(', '),
            defaultState: true
        }






    ];







    const STORAGE_KEY = 'yt_hidden_elements_state';
    const state = GM_getValue(STORAGE_KEY, {});

    // Инициализация дефолтных значений
    CONFIG.forEach(item => {
        if (state[item.id] === undefined) {
            state[item.id] = item.defaultState;
        }
    });

    // 1. Формирование единого статического CSS-блока
    // Связка: html[data-hide-id] selector { display: none !important; }
    const cssRules = CONFIG.map(item =>
        `html[data-hide-${item.id}] :is(${item.selector}) { display: none !important; }` // Защита составных селекторов через :is
    ).join('\n');

    const style = document.createElement('style');
    style.id = 'yt-hider-styles';
    style.textContent = cssRules;
    (document.head || document.documentElement).appendChild(style);

    // 2. Установка data-атрибутов на <html> сразу при запуске
    function applyAttributes() {
        CONFIG.forEach(item => {
            document.documentElement.toggleAttribute(`data-hide-${item.id}`, !!state[item.id]);
        });
    }
    applyAttributes();





    // =========================================================================
    // ИНТЕРФЕЙС НАСТРОЕК (вызывается из меню Tampermonkey)
    // =========================================================================
    function openSettings() {
        if (document.getElementById('yt-hider-dialog')) return;

        const dialog = document.createElement('dialog');
        dialog.id = 'yt-hider-dialog';
        dialog.style.cssText = `
            border: 1px solid #3f3f3f; border-radius: 8px; background: #212121;
            color: #fff; padding: 20px; font-family: Roboto, Arial, sans-serif;
            width: 440px; max-width: 90vw; box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        `;

        const listHtml = CONFIG.map(item => `
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; margin-bottom: 10px;">
                <input type="checkbox" data-id="${item.id}" ${state[item.id] ? 'checked' : ''} style="cursor: pointer;">
                ${item.title}
            </label>
        `).join('');

        dialog.innerHTML = `
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 14px; border-bottom: 1px solid #3f3f3f; padding-bottom: 8px;">
                Скрытие элементов
            </div>
            <div style="max-height: 60vh; overflow-y: auto;">
                ${listHtml}
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
                <button id="yt-hider-close" style="background: #3ea6ff; color: #000; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 500; cursor: pointer;">
                    Закрыть
                </button>
            </div>
        `;

        // Обработка переключения галочек
        dialog.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"]')) {
                const id = e.target.dataset.id;
                state[id] = e.target.checked;
                GM_setValue(STORAGE_KEY, state);
                applyAttributes();
            }
        });

       // Гарантированное удаление окна диалога при любом способе закрытия
        dialog.addEventListener('close', () => dialog.remove());
        dialog.querySelector('#yt-hider-close').addEventListener('click', () => dialog.close());

        document.body.appendChild(dialog);
        dialog.showModal();
    }

    GM_registerMenuCommand('⚙ Настройки скрытия элементов', openSettings);
})();
