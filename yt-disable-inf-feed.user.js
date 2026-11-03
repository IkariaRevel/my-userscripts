// ==UserScript==
// @name         YouTube: Отключение бесконечной ленты на главной
// @version      1.0
// @description  Останавливает автоподгрузку видео при скролле главной страницы YouTube
// @match        https://www.youtube.com/*
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/username/my-userscripts/main/yt-tooltips.user.js
// @downloadURL  https://raw.githubusercontent.com/username/my-userscripts/main/yt-tooltips.user.js
// ==/UserScript==

new MutationObserver(() => {
    document.querySelectorAll('ytd-browse[page-subtype="home"] ytd-continuation-item-renderer')
        .forEach(el => el.remove());
}).observe(document.documentElement, { childList: true, subtree: true });