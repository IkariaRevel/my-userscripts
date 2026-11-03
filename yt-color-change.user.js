// ==UserScript==
// @name         YouTube: изменение цветов
// @namespace    local.yt.theme
// @version      2.0
// @description  Прямая стилизация DOM YouTube без лагов
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @updateURL    https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-color-change.user.js
// @downloadURL  https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-color-change.user.js
// ==/UserScript==

(function() {
    'use strict';

     // Коэффициент высоты карточек ленты (высота = ширина * коэффициент; 0 — отключить (не 0.0)
     const CARD_HEIGHT_RATIO = 0.88;

    // === Настройки процедурной текстуры ===
    const TEXTURE_CONFIG = {
        enabled: true,              // true — включить, false — отключить (будет 'none')
        type: 'turbulence',         // 'turbulence' или 'fractalNoise'
        baseFrequency: 0.75,         // Зернистость (0.01 — крупный шум, 0.9 — мелкий песок)
        numOctaves: 1,              // Детализация (целое число: 1..3)
        seed: 0,                    // Вариант распределения шума
        opacity: 0.20,              // Прозрачность текстуры (0.0..1.0)
    };

    const bgTextureValue = TEXTURE_CONFIG.enabled
        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='${TEXTURE_CONFIG.type}' baseFrequency='${TEXTURE_CONFIG.baseFrequency}' numOctaves='${TEXTURE_CONFIG.numOctaves}' seed='${TEXTURE_CONFIG.seed}' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)' opacity='${TEXTURE_CONFIG.opacity}'/%3E%3C/svg%3E")`
        : 'none';

    const customCSS = `
        :root {

          /* Текстура фона (генерируется из TEXTURE_CONFIG) */
            --custom-bg-texture: ${bgTextureValue};

          /* Настройки сепии */
            --sepia-bg-density: 25%;                      /* Плотность сепии для фона */
            --sepia-text-density: 55%;                    /* Плотность сепии для текста */
            --sepia-thumb-density: 5%;                   /* Плотность сепии для обложек-превью */

            --sepia-tint-bg: #382618;                     /* Тёплый оттенок для фонов */
            --sepia-tint-text: #f5d5a0;                   /* Тёплый оттенок для текста */

          /* Базовые цвета для быстрой настройки */
            --raw-bg-base: #444444;                       /* "111111" Основной фон: Заливает пустоты по краям страницы, промежутки между роликами в ленте, область вокруг видеоплеера? верхнюю шапку с поиском, боковое меню */
            --raw-bg-card: #434242;                       /* "161616" фон описания видео, фон комментариев */
            --raw-text-main: #b0b0b0;                     /* Основной текст: названия видео, текст комментариев */
            --raw-text-muted: #757575;                    /* Второстепенный текст: название канала, число просмотров и подписчиков, дата публикации */

          /* --- Дополнительные цветовые зоны --- */
            --raw-sidebar-text: #b0b0b0;                  /* 1. Текст пунктов бокового меню */
            --raw-sidebar-icon: #888888;                  /* 1. Пиктограммы бокового меню */

            --raw-channel-shelf-title: #d0d0d0;           /* 2. Заголовки разделов в каналах ("Видео", "Популярные") */

            --raw-shorts-title: #b0b0b0;                  /* 3. Названия Shorts в сетке и на главной */

            --raw-tab-active-text: #d0d0d0;               /* 4. Текст активной вкладки канала */
            --raw-tab-active-bar: #d0d0d0;                /* 4. Полоска-подчеркивание активной вкладки */

            --raw-duration-text: #cccccc;                 /* 5. Цифры длительности ролика */
            --raw-duration-bg: rgba(22, 22, 22, 0.3);     /* 5. Фон плашки длительности ролика */

         /* Обложки */
            --custom-thumb-saturation: 0.45 !important;    /* Насыщенность обложек (1 = 100% норма, 0 = черно-белое) */
            --custom-thumb-sepia: var(--sepia-thumb-density) !important; /* Плотность сепии обложек */
            --raw-card-feed-bg: rgba(5, 2, 0, 0.05);      /* Фон карточек в лентах */
            --raw-card-feed-hover: rgba(255, 136, 0, 0.03); /* Фон карточек при наведении курсора*/

           /* разные цвета: золтисто-янтарный CRT - (255, 176, 0), огненно-оранжевый индикатор тлеющего разряда (255, 106, 0), сбалансированный для сепии (255, 136, 0) */

           /* Рамка карточек ленты */
            --raw-card-feed-border: rgba(255, 220, 0, 0.28);       /* (0.48) В покое */
            --raw-card-feed-border-hover: rgba(255, 136, 0, 0.98); /* При наведении */
           /* Тень карточек ленты */
            --raw-card-feed-shadow: 0px 0px 8px rgba(0, 0, 0, 0.3); /* В покое */
            --raw-card-feed-shadow-hover: 0px 0px 12px rgba(255, 136, 0, 0.93); /* При наведении */




          /* Автоматический пересчёт цветов с учётом раздельной сепии */
            --custom-bg-base: color-mix(in srgb, var(--raw-bg-base), var(--sepia-tint-bg) var(--sepia-bg-density)) !important;
            --custom-bg-card: color-mix(in srgb, var(--raw-bg-card), var(--sepia-tint-bg) var(--sepia-bg-density)) !important;


            --custom-text-main: color-mix(in srgb, var(--raw-text-main), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-text-muted: color-mix(in srgb, var(--raw-text-muted), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-sidebar-text: color-mix(in srgb, var(--raw-sidebar-text), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-sidebar-icon: color-mix(in srgb, var(--raw-sidebar-icon), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-channel-shelf-title: color-mix(in srgb, var(--raw-channel-shelf-title), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-shorts-title: color-mix(in srgb, var(--raw-shorts-title), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-tab-active-text: color-mix(in srgb, var(--raw-tab-active-text), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-tab-active-bar: color-mix(in srgb, var(--raw-tab-active-bar), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-duration-text: color-mix(in srgb, var(--raw-duration-text), var(--sepia-tint-text) var(--sepia-text-density)) !important;
            --custom-duration-bg: var(--raw-duration-bg) !important;
        }

    /* 1. Отключение Ambient Mode (профессионального освещения / подсветки) */
        #cinematics,
        #cinematicContainer,
        #cinematic,
        ytd-watch-flexy[cinematic-active] #cinematics {
            display: none !important;
        }

     /* 2. Фон страницы и шапки */
        html,
        body {
            background-color: var(--custom-bg-base) !important;
        }

        /* Текстура задаётся только корневому контейнеру и подложке шапки */
        ytd-app,
        #background.ytd-masthead {
            background-color: var(--custom-bg-base) !important;
            background-image: var(--custom-bg-texture) !important;
            background-repeat: repeat !important;
            background-size: 200px 200px !important;
        }

        /* У шапки сбрасывается внутренний фон, чтобы работала её подложка #background */
        ytd-masthead,
        #container.ytd-masthead {
            background: transparent !important;
            background-color: transparent !important;
        }

    /* 3. Блок описания видео, боковая панель и карточки */
        ytd-watch-metadata #description,
        #description-inner.ytd-watch-metadata,
        ytd-engagement-panel-section-list-renderer,
        ytd-item-section-renderer[section-identifier="comment-item-section"] {
            background-color: var(--custom-bg-card) !important;
            background-image: var(--custom-bg-texture) !important;
            background-repeat: repeat !important;
            background-size: 200px 200px !important;
            border-radius: 8px !important;
        }

    /* 4. Приглушение яркости текста */
        #title.ytd-watch-metadata h1,
        #video-title,
        ytd-comment-view-model #content-text,
        #content-text,
        yt-formatted-string.ytd-watch-metadata {
            color: var(--custom-text-main) !important;
        }

    /* 5. Второстепенные надписи (счётчики, даты) */
        #owner-sub-count,
        #info-strings,
        .ytd-video-meta-block span,
        #vote-count-middle {
            color: var(--custom-text-muted) !important;
        }






    /* 7. Приглушение обложек видео с возвратом нормальной яркости */

        /* В покое: яркость, контрастность; насыщенность и сепия стандартные */
        ytd-thumbnail img,
        yt-thumbnail-view-model img {
            filter: brightness(1) contrast(1) saturate(var(--custom-thumb-saturation, 1)) sepia(var(--custom-thumb-sepia, 0%)) !important;
            transition: filter 0.15s ease;
        }

        /* При наведении: яркость, контрастность; цветность и сепия не меняются */
        ytd-thumbnail:hover img,
        yt-thumbnail-view-model:hover img,
        ytd-rich-item-renderer:hover ytd-thumbnail img,
        ytd-compact-video-renderer:hover ytd-thumbnail img,
        yt-lockup-view-model:hover yt-thumbnail-view-model img {
            filter: brightness(1) contrast(1) saturate(var(--custom-thumb-saturation, 1)) sepia(var(--custom-thumb-sepia, 0%)) !important;
        }

    /* 8. Полное подавление динамической цветной подсветки карточек */
        yt-touch-feedback-shape,
        .yt-spec-touch-feedback-shape__hover-effect,
        .yt-spec-touch-feedback-shape__stroke,
        .yt-spec-touch-feedback-shape__fill,
        .ytSpecTouchFeedbackShapeHovered,
        ytd-rich-item-renderer.ytd-rich-item-renderer-highlight,
        ytd-rich-item-renderer[is-highlighted] {
            display: none !important;
            background: transparent !important;
            box-shadow: none !important;
        }


    /* 9. Карточки в ленте, поиске и боковой панели */

        /* В покое */
        ytd-rich-item-renderer,
        ytd-compact-video-renderer,
        ytd-video-renderer {
            border: 1px solid var(--raw-card-feed-border) !important;
            background-color: var(--raw-card-feed-bg) !important;
            box-shadow: var(--raw-card-feed-shadow) !important;
            border-radius: 12px !important;
            transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease !important;
        }

        /* При наведении курсора */
        ytd-rich-item-renderer:hover,
        ytd-compact-video-renderer:hover,
        ytd-video-renderer:hover {
            background-color: var(--raw-card-feed-hover) !important;
            border-color: var(--raw-card-feed-border-hover) !important;
            box-shadow: var(--raw-card-feed-shadow-hover) !important;
        }

          /* 9.1. Фиксация единой высоты карточек на главной */
             ${CARD_HEIGHT_RATIO > 0 ? `
                 /* Фиксация пропорций внешнего контейнера карточки */
                 ytd-rich-item-renderer {
                     aspect-ratio: 1 / ${CARD_HEIGHT_RATIO} !important;
                     height: auto !important;
                     overflow: hidden !important;
                 }

                 /* Растягивание внутреннего контента на всю высоту без дублирования теней */
                 ytd-rich-item-renderer yt-lockup-view-model,
                 ytd-rich-item-renderer ytd-rich-grid-media {
                     height: 100% !important;
                 }
             ` : ''}


    /* 10. Полная блокировка перекрашивания названий и метаданных в ленте */
        .yt-lockup-metadata-view-model__title,
        .yt-lockup-metadata-view-model__title a,
        .yt-lockup-metadata-view-model__title h3,
        .ytLockupMetadataViewModelTitle,
        .ytLockupMetadataViewModelTitle a,
        .yt-lockup-metadata-view-model-wiz__title,
        ytd-rich-grid-media #video-title,
        #video-title.ytd-rich-grid-media,
        yt-formatted-string#video-title {
            color: var(--custom-text-main) !important;
        }

           /* Принудительный сброс динамических инлайн-стилей и ховера при наведении */
           yt-lockup-view-model:hover :is(.yt-lockup-metadata-view-model__title, .ytLockupMetadataViewModelTitle, a, h3),
           :is(.yt-lockup-metadata-view-model__title, .ytLockupMetadataViewModelTitle)[style*="color:"],
           :is(.yt-lockup-metadata-view-model__title, .ytLockupMetadataViewModelTitle) a[style*="color:"] {
               color: var(--custom-text-main) !important;
            }

            /* Фиксация цвета второстепенных строк (автор, просмотры) от подкрашивания */
            .yt-lockup-metadata-view-model__metadata,
            .ytLockupMetadataViewModelMetadata,
            .ytContentMetadataViewModelMetadataText,
            :is(.yt-lockup-metadata-view-model__metadata, .ytLockupMetadataViewModelMetadata)[style*="color:"] {
                color: var(--custom-text-muted) !important;
            }
     /* 11. Боковое меню: названия и пиктограммы */
        ytd-guide-entry-renderer #title,
        ytd-guide-entry-renderer yt-formatted-string,
        ytd-mini-guide-entry-renderer .title,
        #guide-section-title.ytd-guide-section-renderer {
            color: var(--custom-sidebar-text) !important;
        }
        ytd-guide-entry-renderer yt-icon,
        ytd-guide-entry-renderer .yt-icon-shape svg,
        ytd-guide-entry-renderer yt-icon-shape svg,
        ytd-mini-guide-entry-renderer yt-icon,
        ytd-mini-guide-entry-renderer .yt-icon-shape svg {
            color: var(--custom-sidebar-icon) !important;
            fill: var(--custom-sidebar-icon) !important;
        }

    /* 12. Названия разделов/полок на страницах каналов */
        ytd-shelf-renderer #title,
        ytd-shelf-renderer #title-text,
        ytd-shelf-renderer h2,
        ytd-rich-shelf-renderer #title,
        ytd-rich-shelf-renderer #title-text,
        ytd-item-section-renderer #title,
        ytd-channel-sub-menu-renderer #title {
            color: var(--custom-channel-shelf-title) !important;
        }

    /* 13. Названия Shorts (десктопная лента, сетка каналов, плеер) */
        .shortsLockupViewModelHost h3,
        .shortsLockupViewModelHost a,
        .shortsLockupViewModelHost span,
        .shortsLockupViewModelHost .yt-core-attributed-string,
        ytm-shorts-lockup-view-model h3,
        ytm-shorts-lockup-view-model a,
        ytm-shorts-lockup-view-model span,
        ytm-shorts-lockup-view-model-v2 h3,
        ytm-shorts-lockup-view-model-v2 a,
        ytm-shorts-lockup-view-model-v2 span,
        #video-title.ytd-rich-grid-slim-media,
        ytd-rich-grid-slim-media #video-title,
        ytd-rich-grid-slim-media h3,
        ytd-rich-grid-slim-media a,
        ytd-rich-grid-slim-media span,
        ytd-reel-item-renderer #video-title,
        ytd-reel-item-renderer h3,
        ytd-reel-item-renderer a,
        ytd-reel-item-renderer span,
        yt-shorts-video-title-view-model h2,
        yt-shorts-video-title-view-model span {
            color: var(--custom-shorts-title) !important;
        }

        /* Принудительный сброс динамических инлайн-цветов при наведении на Shorts */
        .shortsLockupViewModelHost:hover :is(h3, a, span),
        ytm-shorts-lockup-view-model:hover :is(h3, a, span),
        ytd-rich-grid-slim-media:hover #video-title,
        :is(.shortsLockupViewModelHost, ytm-shorts-lockup-view-model, ytd-rich-grid-slim-media) [style*="color:"] {
            color: var(--custom-shorts-title) !important;
        }

    /* 14. Выделенный пункт навигации канала (текст и полоска-подчеркивание) */
        /* 14.1. Текст активной вкладки */
        .yt-tab-shape-wiz__tab--tab-selected,
        yt-tab-shape[aria-selected="true"] .yt-tab-shape-wiz__tab,
        yt-tab-shape[aria-selected="true"] div,
        .yt-tab-shape-wiz--selected .yt-tab-shape-wiz__tab,
        tp-yt-paper-tab.iron-selected .tab-content,
        tp-yt-paper-tab.iron-selected {
            color: var(--custom-tab-active-text) !important;
        }

        /* 14.2. Текст неактивных вкладок */
        yt-tab-shape:not([aria-selected="true"]) .yt-tab-shape-wiz__tab,
        yt-tab-shape:not([aria-selected="true"]) div {
            color: var(--custom-text-main) !important;
        }

        /* 14.3. Прозрачность фона кнопок вкладок */
        yt-tab-shape,
        yt-tab-shape[aria-selected="true"],
        .yt-tab-shape-wiz,
        .yt-tab-shape-wiz--selected,
        .yt-tab-shape-wiz__tab,
        .yt-tab-shape-wiz__tab--tab-selected {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
        }

        /* 14.4. Точный селектор бегунка (camelCase из вашей сборки YouTube) */
        div.tabGroupShapeSlider,
        .tabGroupShapeSlider,
        .tabGroupShapeSliderTransition,
        [class*="tabGroupShapeSlider"],
        /* Kebab-case дублирование для универсальности */
        .yt-tab-group-shape-wiz__slider,
        [class*="tab-group-shape-wiz__slider"] {
            background: var(--custom-tab-active-bar) !important;
            background-color: var(--custom-tab-active-bar) !important;
        }

    /* 15. Длительность ролика в углу миниатюры (текст и подложка) */
        /* Текст времени */
        badge-shape .badge-shape-wiz__text,
        badge-shape [class*="badge-shape__text"],
        badge-shape [class*="BadgeShapeText"],
        badge-shape div,
        badge-shape span,
        .badge-shape-wiz__text,
        ytd-thumbnail-overlay-time-status-renderer #text,
        ytd-thumbnail-overlay-time-status-renderer span {
            color: var(--custom-duration-text) !important;
        }

        /* Подложка времени и переопределение внутренних оверлейных переменных */
        ytd-thumbnail-overlay-time-status-renderer,
        ytd-thumbnail-overlay-time-status-renderer badge-shape,
        .badge-shape-wiz--thumbnail-badge:not(.badge-shape-wiz--thumbnail-live) {
            background: var(--custom-duration-bg) !important;
            background-color: var(--custom-duration-bg) !important;
            --yt-spec-static-overlay-background-solid: var(--custom-duration-bg) !important;
            --yt-spec-static-overlay-text-primary: var(--custom-duration-text) !important;
        }

    `;

    if (typeof GM_addStyle === 'function') {
        GM_addStyle(customCSS);
    } else {
        const inject = () => {
            const style = document.createElement('style');
            style.id = 'yt-direct-theme';
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
