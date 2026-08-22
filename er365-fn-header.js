/* er365-fn-header.js v1.7 */
/**
 * v1.7 CHANGES (2026-08-18):
 *   - Welcome/Log Out font: 16px → 18px
 * TEMPLATE LOCKED — reuse pattern for other Architect apps.
 */

(function () {
  'use strict';
  try { console.log('%c[ER365] FN Header v1.7 loaded', 'color:#4A7EDE;font-weight:bold'); } catch (e) {}

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

  var FN_LOGO_URL = 'https://erisaready365.com/wp-content/uploads/2026/07/Fiduciary-Navigator-Bold-Large-FONT-scaled.png';
  var LOGOUT_URL = '/users/x202vq/logout';
  var USER = window.ER365_USER || {};
  var STEP = parseInt(window.ER365_FN_STEP || 1, 10);
  var TOTAL = parseInt(window.ER365_FN_TOTAL || 10, 10);
  var PCT = Math.round((STEP / TOTAL) * 100);

  var CSS = [
    '.er365-fn-hdr { font-family: Calibri, "Segoe UI", Arial, sans-serif; color: #002855; margin-bottom: 16px; padding: 14px 20px; }',
    '.er365-fn-hdr-top { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }',
    '.er365-fn-hdr-brand img { height: 127px; width: auto; display: block; }',
    '.er365-fn-hdr-user { font-size: 18px; color: #3363AD; text-align: right; font-weight: 400; padding-bottom: 4px; }',
    '.er365-fn-hdr-user strong { color: #3363AD; font-weight: 600; }',
    '.er365-fn-hdr-user a { color: #3363AD; text-decoration: none; margin-left: 14px; font-weight: 600; font-size: 18px; }',
    '.er365-fn-hdr-user a:hover { text-decoration: underline; }',
    '.er365-fn-hdr-progress-track { width: 100%; background: #002855; border-radius: 25px; padding: 10px 0; display: flex; align-items: center; }',
    '.er365-fn-hdr-progress-pill { width: ' + PCT + '%; min-width: 110px; height: 50px; background: #3363AD; border-radius: 50px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 15px; font-weight: 700; font-family: Arial, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,0.4); transition: width 0.4s ease; letter-spacing: 0.3px; }',
    '.er365-fn-hdr-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.35); z-index: 9998; }',
    '.er365-fn-hdr-dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; padding: 28px 32px; border-radius: 10px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25); z-index: 10001; max-width: 460px; width: calc(100% - 32px); font-family: Calibri, "Segoe UI", Arial, sans-serif; }',
    '.er365-fn-hdr-dialog h3 { margin: 0 0 12px; color: #002855; font-size: 18px; }',
    '.er365-fn-hdr-dialog p { margin: 0 0 24px; color: #444; line-height: 1.5; }',
    '.er365-fn-hdr-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }',
    '.er365-fn-hdr-btn { padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; }',
    '.er365-fn-hdr-btn-primary { background: #002855; color: #ffffff; }',
    '.er365-fn-hdr-btn-secondary { background: #eef2f6; color: #002855; }',
    '.er365-fn-hdr-btn-danger { background: #b0392f; color: #ffffff; }',
    '@media (max-width: 700px) {',
    '  .er365-fn-hdr { padding: 10px 12px; }',
    '  .er365-fn-hdr-brand img { height: 90px; }',
    '  .er365-fn-hdr-user { font-size: 15px; }',
    '  .er365-fn-hdr-user a { font-size: 15px; margin-left: 10px; }',
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
      '<div class="er365-fn-hdr-user">Welcome, <strong>' + safe(USER.name, 'User') + '</strong><a href="#" class="er365-fn-hdr-logout">Log Out</a></div>';
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

  function attemptLogout() {
    var backdrop = document.createElement('div');
    backdrop.className = 'er365-fn-hdr-backdrop';
    var dlg = document.createElement('div');
    dlg.className = 'er365-fn-hdr-dialog';
    dlg.innerHTML =
      '<h3>You have an in-progress form</h3>' +
      '<p>You are currently completing the Fiduciary Navigator. If you log out now, any unsaved answers on this page will be lost. Your prior saved pages remain as a Draft you can resume from your Home page (My Fiduciary Attestations).</p>' +
      '<div class="er365-fn-hdr-dialog-actions">' +
      '  <button class="er365-fn-hdr-btn er365-fn-hdr-btn-secondary" data-action="cancel">Cancel</button>' +
      '  <button class="er365-fn-hdr-btn er365-fn-hdr-btn-danger" data-action="discard">Discard &amp; Log Out</button>' +
      '  <button class="er365-fn-hdr-btn er365-fn-hdr-btn-primary" data-action="save">Save Draft &amp; Log Out</button>' +
      '</div>';
    function cleanup() { if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); if (dlg.parentNode) dlg.parentNode.removeChild(dlg); }
    dlg.addEventListener('click', function (e) {
      var action = e.target && e.target.getAttribute('data-action');
      if (!action) return;
      cleanup();
      if (action === 'cancel') return;
      if (action === 'save') {
        var saveBtn = document.querySelector('button[value*="Save and Close"]') ||
                      document.querySelector('button[value*="Save and Continue"]') ||
                      document.querySelector('input[type="submit"][value*="Save"]');
        if (saveBtn) { saveBtn.click(); setTimeout(performLogout, 900); }
        else { alert('Could not find a Save button. Please save manually then log out.'); }
        return;
      }
      if (action === 'discard') performLogout();
    });
    backdrop.addEventListener('click', cleanup);
    document.body.appendChild(backdrop);
    document.body.appendChild(dlg);
  }
  function performLogout() { window.location.href = LOGOUT_URL; }

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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
