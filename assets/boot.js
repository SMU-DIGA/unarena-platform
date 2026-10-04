/* Loaded synchronously in every page's <head>, before first paint, so the
   page never flashes the wrong language or theme. common.js does the rest.

   Language: ?lang=en|zh, else the stored choice, else the browser's language.
   A ?lang link is remembered, so following one into the site keeps that
   language on the pages it links to. Theme: ?theme=light|dark pins the mode
   for one view (a print, a screenshot) without touching the stored choice. */
(function () {
  var d = document.documentElement;
  var qs = new URLSearchParams(location.search);
  var stored = {};
  try {
    stored.lang = localStorage.getItem('una-lang');
    stored.theme = localStorage.getItem('una-theme');
  } catch (e) { /* storage blocked: fall back to defaults */ }

  var lang = qs.get('lang');
  if (lang === 'en' || lang === 'zh') {
    try { localStorage.setItem('una-lang', lang); } catch (e) { /* ignore */ }
  } else {
    lang = stored.lang;
  }
  if (lang !== 'en' && lang !== 'zh') {
    lang = /^zh\b/i.test(navigator.language || '') ? 'zh' : 'en';
  }
  d.lang = lang === 'zh' ? 'zh-CN' : 'en';

  var theme = qs.get('theme');
  if (theme !== 'light' && theme !== 'dark') theme = stored.theme;
  if (theme === 'light' || theme === 'dark') d.setAttribute('data-theme', theme);

  d.classList.add('js');
})();
