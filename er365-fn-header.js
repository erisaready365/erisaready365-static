/* er365-fn-header.js v2.2 */
/**
 * v2.2 (2026-08-18):
 *   - Restored console.log confirmation for timeout guard install
 *   - Lowered timeout to 60 min (safety buffer)
 *   - Check interval bumped 60s → 30s (beats server-side timers more reliably)
 *   - Added keep-alive ping every 20 min to refresh Caspio server session cookie
 */

(function () {
  'use strict';
  try { console.log('%c[ER365] FN Header v2.2 loaded', 'color:#4A7EDE;font-weight:bold'); } catch (e) {}

  (function installTimeoutGuard() {
    if (window.__er365_timeout_installed) return;
    window.__er365_timeout_installed = true;
    var cfg = window.ER365_TIMEOUT_CFG || {};
    var IDLE_LIMIT_MS = cfg.idleLimitMs || 60 * 60 * 1000;       // 60 min idle → redirect
    var CHECK_INTERVAL_MS = 30 * 1000;                            // Check every 30s (was 60s)
    var KEEP_ALIVE_MS = cfg.keepAliveMs || 20 * 60 * 1000;        // Ping Caspio every 20 min
    var REDIRECT_URL = cfg.redirectUrl || 'https://erisaready365.com/';
    var STORAGE_KEY = 'er365_last_activity';
    var lastActivity = Date.now();

    function bump() {
      lastActivity = Date.now();
      try { localStorage.setItem(STORAGE_KEY, lastActivity); } catch (e) {}
    }
    bump();

    // Activity listeners — reset idle timer on any user interaction
    ['mousemove','keydown','click','scroll','touchstart'].forEach(function (evt) {
      document.addEventListener(evt, bump, { passive: true });
    });

    // Idle check — redirect if user has been inactive too long
    function check() {
      var stored = parseInt(localStorage.getItem(STORAGE_KEY) || String(lastActivity), 10);
      if (Date.now() - stored > IDLE_LIMIT_MS) {
        window.location.href = REDIRECT_URL;
      }
    }
    setInterval(check, CHECK_INTERVAL_MS);

    // Tab-focus recovery — catch throttled setInterval on background tabs
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        check();
        bump();
      }
    });

    // Keep-alive ping — refresh Caspio session cookie while user is present
    // HEAD request to current page, sends cookies, minimal bandwidth
    function keepAlivePing() {
      try {
        fetch(window.location.pathname + (window.location.search || ''), {
          method: 'HEAD',
          credentials: 'include',
          cache: 'no-store'
        }).catch(function () { /* silent */ });
      } catch (e) { /* fetch not supported — silent fail */ }
    }
    setInterval(keepAlivePing, KEEP_ALIVE_MS);

    try {
      console.log('%c[ER365] Timeout guard installed — idle ' + (IDLE_LIMIT_MS / 60000) + ' min → ' + REDIRECT_URL, 'color:#4A7EDE');
      console.log('%c[ER365] Keep-alive ping every ' + (KEEP_ALIVE_MS / 60000) + ' min', 'color:#4A7EDE');
    } catch (e) {}
  })();

  var FN_LOGO_URL = 'https://erisaready365.com/wp-content/uploads/2026/08/Fiduciary-Navigator-Bold-Large-lg-font-longated-scaled.webp';
  var USER = window.ER365_USER || {};
  var STEP = parseInt(window.ER365_FN_STEP || 1, 10);
  var TOTAL = parseInt(window.ER365_FN_TOTAL || 10, 10);
  var PCT = Math.round((STEP / TOTAL) * 100);

  var CSS = [
    '.er365-fn-hdr { font-family: Calibri, "Segoe UI", Arial, sans-serif; color: #002855; margin-bottom: 16px; padding: 14px 20px; }',
    '.er365-fn-hdr-top { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }',
    '.er365-fn-hdr-brand img { height: 102px; width: auto; display: block; }',
    '.er365-fn-hdr-user { font-size: 16px; color: #3363AD; text-align: right; font-weight: 400; padding-bottom: 4px; }',
    '.er365-fn-hdr-user strong { color: #3363AD; font-weight: 600; }',
    '.er365-fn-hdr-progress-track { width: 100%; background: #002855; border-radius: 25px; padding: 10px 0; display: flex; align-items: center; }',
    '.er365-fn-hdr-progress-pill { width: ' + PCT + '%; min-width: 110px; height: 50px; background: #3363AD; border-radius: 50px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 15px; font-weight: 700; font-family: Arial, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,0.4); transition: width 0.4s ease; letter-spacing: 0.3px; }',
    '#clear-icon { display: none !important; }',
    '@media (max-width: 700px) {',
    '  .er365-fn-hdr { padding: 10px 12px; }',
    '  .er365-fn-hdr-brand img { height: 72px; }',
    '  .er365-fn-hdr-user { font-size: 14px; }',
    '  .er365-fn-hdr-progress-pill { height: 42px; font-size: 13px; min-width: 90px; }',
    '}'
  ].join('\n');

  function safe(v, fallback) { return (!v || String(v).indexOf('[@') === 0) ? (fallback || '') : v; }

  function buildHeader() {
    var wrap = document.createElement('div');
    wrap.className = 'er365-fn-hdr';
    var top = document.createElement('div');
    top.className = 'er365-fn-hdr-top';
    top.innerHTML =
      '<div class="er365-fn-hdr-brand"><img src="' + FN_LOGO_URL + '" alt="Fiduciary Navigator"></div>' +
      '<div class="er365-fn-hdr-user">Welcome, <strong>' + safe(USER.name, 'User') + '</strong></div>';
    wrap.appendChild(top);
    var track = document.createElement('div');
    track.className = 'er365-fn-hdr-progress-track';
    var pill = document.createElement('div');
    pill.className = 'er365-fn-hdr-progress-pill';
    pill.textContent = STEP + ' of ' + TOTAL;
    track.appendChild(pill);
    wrap.appendChild(track);
    return wrap;
  }

  function injectStyles() {
    if (document.querySelector('style[data-er365-fn-hdr]')) return;
    var s = document.createElement('style');
    s.setAttribute('data-er365-fn-hdr', 'true');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function boot() {
    if (document.querySelector('.er365-fn-hdr')) return;
    injectStyles();
    var header = buildHeader();
    var root = document.querySelector('#er365-fn-header-root');
    if (root) root.parentNode.replaceChild(header, root);
    else document.body.insertBefore(header, document.body.firstChild);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
