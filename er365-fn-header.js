/* er365-fn-header.js v1.1 */
/**
 * ERISAReady365 — Fiduciary Navigator App Header (v1.1)
 * ======================================================
 * v1.1 CHANGES (2026-08-18):
 *   - Removed intro block (Plan_Name/5500/Year) — keep in form as HTMLBlock
 *     (form fields don't resolve at AppPage-level script scope)
 *   - Uses FN-specific logo (three-dot wordmark)
 *   - Added "powered by ERISAReady365" logo on right
 *   - Tighter layout — smaller heights, less padding
 *   - Enhanced Log Out with save-draft prompt (matches er365-header.js v4.19 pattern)
 *   - Timeout guard still baked in
 *
 * MOUNT (on each FN AppPage in ONE HTMLBlock):
 *   <script>
 *     window.ER365_USER = {
 *       name: '[@authfield:Full_Name_Formal]',
 *       email: '[@authfield:Email]'
 *     };
 *     window.ER365_FN_STEP = 5;   // CHANGE PER PAGE: 1, 2, 3, ... 10
 *   </script>
 *   <script src="https://cdn.jsdelivr.net/gh/erisaready365/erisaready365-static@SHA/er365-fn-header.js"></script>
 *   <div id="er365-fn-header-root"></div>
 *
 * (c) 2026 RetireWell, LLC. Confidential — Internal Use Only.
 */

(function () {
  'use strict';

  try { console.log('%c[ER365] FN Header v1.1 loaded', 'color:#4A7EDE;font-weight:bold'); } catch (e) {}

  // ---------------------------------------------------------
  // TIMEOUT GUARD (self-installing, guards against double-install)
  // ---------------------------------------------------------
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
    try { console.log('%c[ER365] Timeout guard installed — idle ' + (IDLE_LIMIT_MS / 60000) + ' min → ' + REDIRECT_URL, 'color:#4A7EDE'); } catch (e) {}
  })();

  // ---------------------------------------------------------
  // Config
  // ---------------------------------------------------------
  var FN_LOGO_URL = 'https://erisaready365.com/wp-content/uploads/2026/07/Fiduciary-Navigator-Bold-Large-FONT-scaled.png';
  var POWERED_BY_URL = 'https://erisaready365.com/wp-content/uploads/2026/07/ERISA-READY-365-With-1-tm-bottom-BOLD-TAG.webp';
  var LOGOUT_URL = '/users/x202vq/logout';
  var USER = window.ER365_USER || {};
  var STEP = parseInt(window.ER365_FN_STEP || 1, 10);
  var TOTAL = parseInt(window.ER365_FN_TOTAL || 10, 10);
  var PCT = Math.round((STEP / TOTAL) * 100);

  // ---------------------------------------------------------
  // Styles
  // ---------------------------------------------------------
  var CSS = [
    '.er365-fn-hdr { font-family: Calibri, "Segoe UI", Arial, sans-serif; color: #002855; margin-bottom: 16px; padding: 12px 20px; }',
    '.er365-fn-hdr-top { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 4px; flex-wrap: wrap; gap: 15px; }',
    '.er365-fn-hdr-brand { display: flex; align-items: flex-end; }',
    '.er365-fn-hdr-brand img { height: 60px; width: auto; display: block; }',
    '.er365-fn-hdr-right { display: flex; align-items: center; gap: 12px; }',
    '.er365-fn-hdr-poweredby { display: flex; align-items: center; gap: 8px; }',
    '.er365-fn-hdr-poweredby span { font-size: 12px; color: #777; font-style: italic; font-family: Arial, sans-serif; }',
    '.er365-fn-hdr-poweredby img { height: 32px; width: auto; display: block; }',
    '.er365-fn-hdr-user { font-size: 12px; color: #3363AD; margin-left: 14px; padding-left: 14px; border-left: 1px solid #d0d0d0; }',
    '.er365-fn-hdr-user a { color: #b0392f; text-decoration: none; margin-left: 10px; font-weight: 600; }',
    '.er365-fn-hdr-user a:hover { text-decoration: underline; }',
    '.er365-fn-hdr-progress-bar { width: 100%; background: #eef2f6; border-radius: 25px; height: 44px; position: relative; overflow: hidden; margin-top: 10px; }',
    '.er365-fn-hdr-progress-fill { background: #002855; height: 100%; width: ' + PCT + '%; border-radius: 25px 0 0 25px; transition: width 0.4s ease; }',
    '.er365-fn-hdr-progress-text { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 600; font-size: 15px; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }',
    // Logout dialog
    '.er365-fn-hdr-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.35); z-index: 9998; }',
    '.er365-fn-hdr-dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; padding: 28px 32px; border-radius: 10px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25); z-index: 10001; max-width: 460px; width: calc(100% - 32px); font-family: Calibri, "Segoe UI", Arial, sans-serif; }',
    '.er365-fn-hdr-dialog h3 { margin: 0 0 12px; color: #002855; font-size: 18px; }',
    '.er365-fn-hdr-dialog p { margin: 0 0 24px; color: #444; line-height: 1.5; }',
    '.er365-fn-hdr-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }',
    '.er365-fn-hdr-btn { padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; }',
    '.er365-fn-hdr-btn-primary { background: #002855; color: #ffffff; }',
    '.er365-fn-hdr-btn-secondary { background: #eef2f6; color: #002855; }',
    '.er365-fn-hdr-btn-danger { background: #b0392f; color: #ffffff; }',
    // Mobile
    '@media (max-width: 700px) {',
    '  .er365-fn-hdr { padding: 10px 12px; }',
    '  .er365-fn-hdr-brand img { height: 44px; }',
    '  .er365-fn-hdr-poweredby img { height: 26px; }',
    '  .er365-fn-hdr-user { font-size: 11px; margin-left: 8px; padding-left: 8px; }',
    '  .er365-fn-hdr-progress-bar { height: 36px; }',
    '  .er365-fn-hdr-progress-text { font-size: 13px; }',
    '}'
  ].join('\n');

  // ---------------------------------------------------------
  // Build
  // ---------------------------------------------------------
  function safe(v, fallback) { return (!v || String(v).indexOf('[@') === 0) ? (fallback || '') : v; }

  function buildHeader() {
    var wrap = document.createElement('div');
    wrap.className = 'er365-fn-hdr';

    // Top row: FN logo left, powered-by + welcome + logout right
    var top = document.createElement('div');
    top.className = 'er365-fn-hdr-top';

    var brand = document.createElement('div');
    brand.className = 'er365-fn-hdr-brand';
    brand.innerHTML = '<img src="' + FN_LOGO_URL + '" alt="Fiduciary Navigator">';
    top.appendChild(brand);

    var right = document.createElement('div');
    right.className = 'er365-fn-hdr-right';
    right.innerHTML =
      '<div class="er365-fn-hdr-poweredby">' +
        '<span>powered by</span>' +
        '<img src="' + POWERED_BY_URL + '" alt="ERISAReady365">' +
      '</div>' +
      '<div class="er365-fn-hdr-user">' +
        'Welcome, <strong>' + safe(USER.name, 'User') + '</strong>' +
        '<a href="#" class="er365-fn-hdr-logout">Log Out</a>' +
      '</div>';
    top.appendChild(right);
    wrap.appendChild(top);

    // Progress bar
    var bar = document.createElement('div');
    bar.className = 'er365-fn-hdr-progress-bar';
    bar.innerHTML =
      '<div class="er365-fn-hdr-progress-fill"></div>' +
      '<div class="er365-fn-hdr-progress-text">Step ' + STEP + ' of ' + TOTAL + '</div>';
    wrap.appendChild(bar);

    return wrap;
  }

  // ---------------------------------------------------------
  // Logout with save-draft prompt
  // ---------------------------------------------------------
  function attemptLogout() {
    var backdrop = document.createElement('div');
    backdrop.className = 'er365-fn-hdr-backdrop';

    var dlg = document.createElement('div');
    dlg.className = 'er365-fn-hdr-dialog';
    dlg.setAttribute('role', 'alertdialog');
    dlg.innerHTML =
      '<h3>You have an in-progress form</h3>' +
      '<p>You are currently completing the Fiduciary Navigator. If you log out now, any unsaved answers on this page will be lost. Your prior saved pages remain as a Draft you can resume from your Home page (My Fiduciary Attestations).</p>' +
      '<div class="er365-fn-hdr-dialog-actions">' +
      '  <button class="er365-fn-hdr-btn er365-fn-hdr-btn-secondary" data-action="cancel">Cancel</button>' +
      '  <button class="er365-fn-hdr-btn er365-fn-hdr-btn-danger" data-action="discard">Discard &amp; Log Out</button>' +
      '  <button class="er365-fn-hdr-btn er365-fn-hdr-btn-primary" data-action="save">Save Draft &amp; Log Out</button>' +
      '</div>';

    function cleanup() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
    }

    dlg.addEventListener('click', function (e) {
      var action = e.target && e.target.getAttribute('data-action');
      if (!action) return;
      cleanup();
      if (action === 'cancel') return;
      if (action === 'save') {
        // Look for a Save button — Caspio names them like "Save and Continue", "Save and Close"
        var saveBtn =
          document.querySelector('button[value*="Save and Close"]') ||
          document.querySelector('button[value*="Save and Continue"]') ||
          document.querySelector('input[type="submit"][value*="Save"]');
        if (saveBtn) {
          saveBtn.click();
          setTimeout(performLogout, 900);
        } else {
          alert('Could not find a Save button on this page. Please save manually then log out.');
        }
        return;
      }
      if (action === 'discard') performLogout();
    });
    backdrop.addEventListener('click', cleanup);
    document.body.appendChild(backdrop);
    document.body.appendChild(dlg);
  }

  function performLogout() {
    window.location.href = LOGOUT_URL;
  }

  // ---------------------------------------------------------
  // Boot
  // ---------------------------------------------------------
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
    var logout = header.querySelector('.er365-fn-hdr-logout');
    if (logout) logout.addEventListener('click', function (e) { e.preventDefault(); attemptLogout(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
