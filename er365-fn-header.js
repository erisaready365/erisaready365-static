/* er365-fn-header.js v1.0 */
/**
 * ERISAReady365 — Fiduciary Navigator App Header
 * ===============================================
 * Minimal header for FN form pages (Pages 1-10). Renders:
 *   - Small logo + "Fiduciary Navigator" wordmark
 *   - Welcome, [Name]
 *   - Progress bar (Step N of 10)
 *   - Intro block (Submitter | Plan_Name | Plan_5500_Number | Plan_Year | Convention)
 *   - Log Out link (with in-progress-form guard)
 *   - Timeout redirect guard baked in
 *
<script src="https://cdn.jsdelivr.net/gh/erisaready365/erisaready365-static@8a0ad1c/er365-fn-header.js"></script> *
 * MOUNT (on each FN AppPage in one HTMLBlock):
 *   <script>
 *     window.ER365_USER = {
 *       name: '[@authfield:Full_Name_Formal]',
 *       email: '[@authfield:Email]',
 *       submitterName: '[@field:Submitter_Name]',
 *       planName: '[@field:Plan_Name]',
 *       plan5500: '[@field:Plan_5500_Number]',
 *       planYear: '[@field:Plan_Year]',
 *       planYearLabel: '[@field:Plan_Year_Convention_Label]'
 *     };
 *     window.ER365_FN_STEP = 5;     // CHANGE PER PAGE: 1, 2, 3, ... 10
 *     window.ER365_FN_TOTAL = 10;   // constant; can omit
 *   </script>
 *   <script src="https://cdn.jsdelivr.net/gh/USER/REPO@SHA/er365-fn-header.js"></script>
 *   <div id="er365-fn-header-root"></div>
 *
 * (c) 2026 RetireWell, LLC. Confidential — Internal Use Only.
 */

(function () {
  'use strict';

  try { console.log('%c[ER365] FN Header v1.0 loaded', 'color:#4A7EDE;font-weight:bold'); } catch (e) {}

  // ---------- Timeout guard (self-installing, guards against double-install) ----------
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

  // ---------- Configuration ----------
  var LOGO_URL = 'https://erisaready365.com/wp-content/uploads/2026/07/ERISAReady-365-ICON-no-background.png';
  var APP_NAME = 'Fiduciary Navigator';
  var LOGOUT_URL = '/users/x202vq/logout';
  var USER = window.ER365_USER || {};
  var STEP = parseInt(window.ER365_FN_STEP || 1, 10);
  var TOTAL = parseInt(window.ER365_FN_TOTAL || 10, 10);
  var PCT = Math.round((STEP / TOTAL) * 100);

  // ---------- Styles ----------
  var CSS = [
    '.er365-fn-hdr { font-family: Calibri, "Segoe UI", Arial, sans-serif; color: #002855; margin-bottom: 20px; }',
    '.er365-fn-hdr-top { display: flex; align-items: center; padding: 14px 24px 10px; }',
    '.er365-fn-hdr-brand { display: flex; align-items: center; gap: 12px; flex: 1; }',
    '.er365-fn-hdr-brand img { height: 44px; display: block; }',
    '.er365-fn-hdr-app { font-size: 15px; font-weight: 600; color: #002855; letter-spacing: 0.3px; }',
    '.er365-fn-hdr-welcome { font-size: 13px; color: #3363AD; }',
    '.er365-fn-hdr-welcome a { color: #b0392f; text-decoration: none; margin-left: 12px; }',
    '.er365-fn-hdr-welcome a:hover { text-decoration: underline; }',
    '.er365-fn-hdr-progress-bar { background: #eef2f6; border-radius: 20px; height: 34px; position: relative; margin: 6px 24px 12px; overflow: hidden; }',
    '.er365-fn-hdr-progress-fill { background: #002855; height: 100%; width: ' + PCT + '%; border-radius: 20px 0 0 20px; transition: width 0.4s ease; }',
    '.er365-fn-hdr-progress-text { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 600; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }',
    '.er365-fn-hdr-intro { padding: 8px 24px 0; font-size: 15px; color: #002855; font-weight: 600; }',
    '.er365-fn-hdr-hr { height: 2px; background: #002855; border: none; margin: 10px 24px 0; }',
    '@media (max-width: 700px) {',
    '  .er365-fn-hdr-top { padding: 12px 14px 8px; }',
    '  .er365-fn-hdr-brand img { height: 36px; }',
    '  .er365-fn-hdr-app { font-size: 13px; }',
    '  .er365-fn-hdr-welcome { font-size: 12px; }',
    '  .er365-fn-hdr-progress-bar, .er365-fn-hdr-intro, .er365-fn-hdr-hr { margin-left: 14px; margin-right: 14px; }',
    '}'
  ].join('\n');

  // ---------- Build ----------
  function safe(v, fallback) { return (!v || String(v).indexOf('[@') === 0) ? (fallback || '') : v; }

  function buildHeader() {
    var wrap = document.createElement('div');
    wrap.className = 'er365-fn-hdr';

    // Top row: logo + app name + welcome/logout
    var top = document.createElement('div');
    top.className = 'er365-fn-hdr-top';
    top.innerHTML =
      '<div class="er365-fn-hdr-brand">' +
        '<img src="' + LOGO_URL + '" alt="ERISAReady365">' +
        '<span class="er365-fn-hdr-app">' + APP_NAME + '</span>' +
      '</div>' +
      '<div class="er365-fn-hdr-welcome">' +
        'Welcome, <strong>' + safe(USER.name, 'User') + '</strong>' +
        '<a href="#" class="er365-fn-hdr-logout">Log Out</a>' +
      '</div>';
    wrap.appendChild(top);

    // Progress bar
    var bar = document.createElement('div');
    bar.className = 'er365-fn-hdr-progress-bar';
    bar.innerHTML =
      '<div class="er365-fn-hdr-progress-fill"></div>' +
      '<div class="er365-fn-hdr-progress-text">Step ' + STEP + ' of ' + TOTAL + '</div>';
    wrap.appendChild(bar);

    // Intro block (Submitter | Plan | 5500# | Year | Convention)
    var intro = document.createElement('p');
    intro.className = 'er365-fn-hdr-intro';
    intro.innerHTML =
      '<strong>' + safe(USER.submitterName, USER.name) + '</strong><br>' +
      '<strong>' + safe(USER.planName) + '&nbsp;|&nbsp;' + safe(USER.plan5500) + '</strong><br>' +
      '<strong>For Plan Year&nbsp;' + safe(USER.planYear) + '&nbsp;|&nbsp;' + safe(USER.planYearLabel) + '</strong>';
    wrap.appendChild(intro);

    // HR
    var hr = document.createElement('hr');
    hr.className = 'er365-fn-hdr-hr';
    wrap.appendChild(hr);

    return wrap;
  }

  function attachLogoutHandler(root) {
    var link = root.querySelector('.er365-fn-hdr-logout');
    if (!link) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      // Simple confirm — full "save draft?" flow can be added later matching er365-header.js pattern
      if (confirm('Log out now? Your progress on this page will be saved as a draft if you have already clicked Save.')) {
        window.location.href = LOGOUT_URL;
      }
    });
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
    attachLogoutHandler(header);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
