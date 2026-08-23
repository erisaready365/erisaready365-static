/* er365-fn-header.js v2.1 */
/**
 * v2.1 (2026-08-18) — removed Log Out link + dialog (Caspio Save button not reliably findable via selector).
 * Users end session by closing tab or via 90-min idle timeout redirect.
 */

(function () {
  'use strict';
  try { console.log('%c[ER365] FN Header v2.1 loaded', 'color:#4A7EDE;font-weight:bold'); } catch (e) {}

  (function installTimeoutGuard() {
    if (window.__er365_timeout_installed) return;
    window.__er365_timeout_installed = true;
    var cfg = window.ER365_TIMEOUT_CFG || {};
    var IDLE_LIMIT_MS = cfg.idleLimitMs || 90 * 60 * 1000;
    var REDIRECT_URL = cfg.redirectUrl || 'https://erisaready365.com/';
    var STORAGE_KEY = 'er365_last_activity';
    var lastActivity = Date.now();
    function bump() { lastActivity = Date.now(); try { localStorage.setItem(STORAGE_KEY, lastActivity); } catch (e) {} }
    bump();
    ['mousemove','keydown','click','scroll','touchstart'].forEach(function (evt) {
      document.addEventListener(evt, bump, { passive: true });
    });
    function check() {
      var stored = parseInt(localStorage.getItem(STORAGE_KEY) || String(lastActivity), 10);
      if (Date.now() - stored > IDLE_LIMIT_MS) window.location.href = REDIRECT_URL;
    }
    setInterval(check, 60 * 1000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { check(); bump(); }
    });
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
