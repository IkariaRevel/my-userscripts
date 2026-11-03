// ==UserScript==
// @name         YouTube: Восстановить старый дизайн (комментарии снизу видео)
// @namespace    local.yt.restore_layout
// @version      1.0
// @description  Возврат классического расположения описания, комментариев и ленты рекомендаций
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/username/my-userscripts/main/yt-tooltips.user.js
// @downloadURL  https://raw.githubusercontent.com/username/my-userscripts/main/yt-tooltips.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Список экспериментальных флагов нового интерфейса
    const FLAGS = {
        web_watch_eligible_to_switch_to_grid: false,
        web_watch_enable_single_column_grid_view: false,
        web_fixed_panel_watch_next_grid_swap: false,
        web_watch_fixed_default_panels: false,
        web_engagement_panel_show_description: false,
        web_watch_move_summary_to_sd: false,
        web_watch_hero_list: false,
        web_watch_split_scroll: false,
        web_side_rail_dismissible_panels: false,
        kevlar_watch_hide_comments_while_panel_open: false,
        disable_theater_mode: false, // Принудительно возвращает режим кинотеатра и хоткей T
    };

    // Подмена значений флагов через Proxy
    const forceFlags = (target) =>
        new Proxy(target, {
            get: (t, prop) => (prop in FLAGS ? FLAGS[prop] : t[prop]),
        });

    // Перехват создания вложенных объектов конфигурации YouTube до рендеринга страницы
    function trap(obj, prop, callback) {
        let val = obj[prop];
        if (val) val = callback(val) ?? val;
        Object.defineProperty(obj, prop, {
            configurable: true,
            enumerable: true,
            get: () => val,
            set: (v) => {
                val = v ? callback(v) ?? v : v;
            },
        });
    }

    trap(window, 'yt', (yt) => {
        trap(yt, 'config_', (cfg) => {
            trap(cfg, 'EXPERIMENT_FLAGS', (ef) => forceFlags(ef));
        });
    });

})();