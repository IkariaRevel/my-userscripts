// ==UserScript==
// @name         YouTube: отключение бесконечной ленты на главной
// @version      1.0
// @description  Останавливает автоподгрузку видео при скролле главной страницы YouTube
// @match        https://www.youtube.com/*
// @run-at       document-start
// @updateURL    https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-disable-inf-feed.user.js
// @downloadURL  https://github.com/IkariaRevel/my-userscripts/raw/refs/heads/main/yt-disable-inf-feed.user.js
// ==/UserScript==

new MutationObserver(() => {
    document.querySelectorAll('ytd-browse[page-subtype="home"] ytd-continuation-item-renderer')
        .forEach(el => el.remove());
}).observe(document.documentElement, { childList: true, subtree: true });
