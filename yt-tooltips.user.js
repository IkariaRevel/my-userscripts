// ==UserScript==
// @name         YouTube: настраиваемые подсказки названий видео (совместимо с DeArrow)
// @namespace    local.yt.custom_tooltip
// @version      1.0
// @description  Замена нативных системных подсказок с полным названием видео на настраиваемые
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/username/my-userscripts/main/yt-tooltips.user.js
// @downloadURL  https://raw.githubusercontent.com/username/my-userscripts/main/yt-tooltips.user.js
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'yt_custom_tooltip_config';
    const DEFAULT_CONFIG = {
        fontSize: 26,
        delay: 300,
        maxWidth: 520,
        textColor: '#392d14',
        bg: '#ded0ba',
        fontFamily: 'Calibri, Roboto, Arial, sans-serif',
        borderWidth: 1,
        borderColor: '#5e4b21',
        shadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
    };

    const state = Object.assign({}, DEFAULT_CONFIG, GM_getValue(STORAGE_KEY, {}));

    let tooltipEl = null;
    let showTimer = null;
    let activeElements = [];
    let activeArea = null;
    let lastX = 0;
    let lastY = 0;

    // Динамический поиск целевого заголовка с нативным title внутри карточки
    function getTitleTarget(target) {
        const elWithTitle = target.closest('[title]');
        if (!elWithTitle) return null;

        const card = elWithTitle.closest('ytd-rich-item-renderer, ytd-rich-grid-media, yt-lockup-view-model, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer');
        if (!card) return null;

        // Исключение служебных элементов карточки (превью, автор, аватар, меню)
        if (elWithTitle.closest('ytd-thumbnail, #thumbnail, #channel-name, ytd-channel-name, #avatar, #avatar-container, yt-avatar-shape, #menu, button, yt-icon-button, ytd-badge-supported-renderer, #metadata-line, [class*="metadata-view-model__metadata"]')) {
            return null;
        }

        return elWithTitle;
    }

    // Инициализация единого DOM-элемента подсказки
    function initTooltip() {
        if (tooltipEl || !document.body) return;
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'yt-custom-tooltip';
        applyTooltipStyles();
        document.body.appendChild(tooltipEl);
    }

    // Применение стилей к всплывающему блоку на основе текущих настроек
    function applyTooltipStyles() {
        if (!tooltipEl) return;
        tooltipEl.style.cssText = `
            position: fixed;
            z-index: 9999999;
            pointer-events: none;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.15s ease, visibility 0.15s ease;
            background: ${state.bg};
            color: ${state.textColor};
            border: ${state.borderWidth}px solid ${state.borderColor};
            border-radius: 6px;
            padding: 6px 10px;
            line-height: 1.35;
            box-shadow: ${state.shadow};
            font-family: ${state.fontFamily};
            font-size: ${state.fontSize}px;
            max-width: ${state.maxWidth}px;
            word-break: break-word;
        `;
    }

    // Расчёт координат с защитой от выхода за границы экрана
    function updatePosition(clientX, clientY) {
        if (!tooltipEl || tooltipEl.style.visibility !== 'visible') return;
        const offset = 14;
        const rect = tooltipEl.getBoundingClientRect();
        let x = clientX + offset;
        let y = clientY + offset;

        if (x + rect.width > window.innerWidth - 10) {
            x = window.innerWidth - rect.width - 10;
        }
        if (y + rect.height > window.innerHeight - 10) {
            y = clientY - rect.height - offset;
        }
        tooltipEl.style.left = `${Math.max(10, x)}px`;
        tooltipEl.style.top = `${Math.max(10, y)}px`;
    }

    // Отображение подсказки
    function showTooltip(text, clientX, clientY) {
        initTooltip();
        tooltipEl.textContent = text;
        tooltipEl.style.visibility = 'visible';
        tooltipEl.style.opacity = '1';
        updatePosition(clientX, clientY);
    }

    // Скрытие подсказки и восстановление атрибутов title
    function hideTooltip() {
        clearTimeout(showTimer);
        if (tooltipEl) {
            tooltipEl.style.opacity = '0';
            tooltipEl.style.visibility = 'hidden';
        }
        if (activeElements.length) {
            activeElements.forEach(el => {
                if (el.dataset.customTooltipText) {
                    el.setAttribute('title', el.dataset.customTooltipText);
                    delete el.dataset.customTooltipText;
                }
            });
            activeElements = [];
        }
        activeArea = null;
    }

    // Делегированный перехват наведения на фазе захвата
    document.addEventListener('pointerover', (e) => {
        const targetWithTitle = getTitleTarget(e.target);
        if (!targetWithTitle) return;

        const card = targetWithTitle.closest('ytd-rich-item-renderer, ytd-rich-grid-media, yt-lockup-view-model, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer');

        // Корневой заголовок (h3) в приоритете, чтобы не останавливаться на промежуточных ссылках
        const titleArea = targetWithTitle.closest('h3, [class*="heading"]') || targetWithTitle.closest('#details, #meta, [class*="metadata"]') || targetWithTitle;

        if (activeArea && activeArea === titleArea) return;
        if (activeArea && activeArea !== titleArea) hideTooltip();

        // Сбор ВСЕХ элементов с title: заголовок h3, вложенная ссылка и промежуточные предки
        const elementsSet = new Set();
        if (titleArea.hasAttribute('title')) elementsSet.add(titleArea);
        titleArea.querySelectorAll('[title]').forEach(el => elementsSet.add(el));
        elementsSet.add(targetWithTitle);

        let parent = titleArea.parentElement;
        while (parent && parent !== card) {
            if (parent.hasAttribute('title')) elementsSet.add(parent);
            parent = parent.parentElement;
        }

        const elements = Array.from(elementsSet);
        const titleText = targetWithTitle.getAttribute('title') || elements[0].getAttribute('title');
        if (!titleText || !titleText.trim()) return;

        activeArea = titleArea;
        activeElements = elements;

        elements.forEach(el => {
            el.dataset.customTooltipText = el.getAttribute('title');
            el.removeAttribute('title');
        });

        lastX = e.clientX;
        lastY = e.clientY;

        clearTimeout(showTimer);
        showTimer = setTimeout(() => {
            showTooltip(titleText, lastX, lastY);
        }, state.delay);
    }, true);

    // Отслеживание перемещения и постоянное подавление повторных вставок title от DeArrow
    document.addEventListener('pointermove', (e) => {
        if (!activeArea) return;
        lastX = e.clientX;
        lastY = e.clientY;

        if (activeArea.hasAttribute('title')) activeArea.removeAttribute('title');
        activeArea.querySelectorAll('[title]').forEach(el => el.removeAttribute('title'));

        if (tooltipEl && tooltipEl.style.visibility === 'visible') {
            updatePosition(lastX, lastY);
        }
    }, true);

    // Скрытие при реальном выходе курсора за границы блока заголовка
    document.addEventListener('pointerout', (e) => {
        if (!activeArea) return;
        if (!activeArea.contains(e.relatedTarget)) {
            hideTooltip();
        }
    }, true);

    // Сброс при клике и скролле страницы
    document.addEventListener('pointerdown', hideTooltip, true);
    window.addEventListener('scroll', hideTooltip, true);

    // =========================================================================
    // ИНТЕРФЕЙС НАСТРОЕК (вызывается из меню расширения)
    // =========================================================================
    function openSettings() {
        if (document.getElementById('yt-tooltip-dialog')) return;

        const dialog = document.createElement('dialog');
        dialog.id = 'yt-tooltip-dialog';
        dialog.style.cssText = `
            border: 1px solid #3f3f3f; border-radius: 8px; background: #212121;
            color: #fff; padding: 20px; font-family: Roboto, Arial, sans-serif;
            width: 440px; max-width: 90vw; box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        `;

        dialog.innerHTML = `
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 16px; border-bottom: 1px solid #3f3f3f; padding-bottom: 8px;">
                Настройки подсказки названий
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px; max-height: 65vh; overflow-y: auto; padding-right: 4px;">
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Задержка появления (мс):</span>
                    <input type="number" id="cfg-delay" min="0" max="1500" step="50" value="${state.delay}" style="width: 80px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Шрифт (font-family):</span>
                    <input type="text" id="cfg-fontFamily" value="${state.fontFamily}" style="width: 180px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Размер шрифта (px):</span>
                    <input type="number" id="cfg-fontSize" min="12" max="32" value="${state.fontSize}" style="width: 80px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Макс. ширина (px):</span>
                    <input type="number" id="cfg-maxWidth" min="200" max="800" step="20" value="${state.maxWidth}" style="width: 80px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Цвет текста:</span>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="color" id="pick-textColor" value="${state.textColor}" style="width: 28px; height: 28px; padding: 0; border: 1px solid #3f3f3f; border-radius: 4px; background: none; cursor: pointer;">
                        <input type="text" id="cfg-textColor" value="${state.textColor}" style="width: 140px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                    </div>
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Цвет фона:</span>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="color" id="pick-bg" value="${state.bg}" style="width: 28px; height: 28px; padding: 0; border: 1px solid #3f3f3f; border-radius: 4px; background: none; cursor: pointer;">
                        <input type="text" id="cfg-bg" value="${state.bg}" style="width: 140px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                    </div>
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Толщина границы (px):</span>
                    <input type="number" id="cfg-borderWidth" min="0" max="10" value="${state.borderWidth}" style="width: 80px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Цвет границы:</span>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="color" id="pick-borderColor" value="${state.borderColor}" style="width: 28px; height: 28px; padding: 0; border: 1px solid #3f3f3f; border-radius: 4px; background: none; cursor: pointer;">
                        <input type="text" id="cfg-borderColor" value="${state.borderColor}" style="width: 140px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                    </div>
                </label>
                <label style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>Параметры тени (box-shadow):</span>
                    <input type="text" id="cfg-shadow" value="${state.shadow}" style="width: 180px; background: #121212; border: 1px solid #3f3f3f; color: #fff; padding: 4px 6px; border-radius: 4px;">
                </label>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <button id="yt-tooltip-close" style="background: #3ea6ff; color: #000; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 500; cursor: pointer;">
                    Закрыть
                </button>
            </div>
        `;

        dialog.addEventListener('input', (e) => {
            const id = e.target.id;
            const val = e.target.value;

            // Двусторонняя синхронизация визуальной палитры и текстового HEX
            if (id.startsWith('pick-')) {
                const textInput = dialog.querySelector('#cfg-' + id.slice(5));
                if (textInput) textInput.value = val;
            } else if (id.startsWith('cfg-')) {
                const picker = dialog.querySelector('#pick-' + id.slice(4));
                if (picker && /^#[0-9a-fA-F]{6}$/i.test(val)) picker.value = val;
            }

            // Актуализация состояния из полей ввода
            state.fontSize = Number(dialog.querySelector('#cfg-fontSize').value) || DEFAULT_CONFIG.fontSize;
            state.delay = Number(dialog.querySelector('#cfg-delay').value) || 0;
            state.maxWidth = Number(dialog.querySelector('#cfg-maxWidth').value) || DEFAULT_CONFIG.maxWidth;
            state.textColor = dialog.querySelector('#cfg-textColor').value || DEFAULT_CONFIG.textColor;
            state.bg = dialog.querySelector('#cfg-bg').value || DEFAULT_CONFIG.bg;
            state.fontFamily = dialog.querySelector('#cfg-fontFamily').value || DEFAULT_CONFIG.fontFamily;
            state.borderWidth = Number(dialog.querySelector('#cfg-borderWidth').value) ?? DEFAULT_CONFIG.borderWidth;
            state.borderColor = dialog.querySelector('#cfg-borderColor').value || DEFAULT_CONFIG.borderColor;
            state.shadow = dialog.querySelector('#cfg-shadow').value || DEFAULT_CONFIG.shadow;

            GM_setValue(STORAGE_KEY, state);
            applyTooltipStyles();
        });

        dialog.addEventListener('close', () => dialog.remove());
        dialog.querySelector('#yt-tooltip-close').addEventListener('click', () => dialog.close());

        document.body.appendChild(dialog);
        dialog.showModal();
    }

    GM_registerMenuCommand('⚙ Настройки размера подсказок', openSettings);
})();
