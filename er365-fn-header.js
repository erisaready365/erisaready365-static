/* er365-fn-header.js  v2.9  (2026-09-11) */
/**
 * ERISAReady365 - Fiduciary Navigator form-page header
 * ====================================================
 * Loaded by the small mount block on each FN AppPage:
 *
 *     <script>
 *       window.ER365_USER     = { name: '...', email: '...' };
 *       window.ER365_FN_STEP  = 1;    // change per page
 *       window.ER365_FN_TOTAL = 10;   // optional; set 13 after the rebuild
 *     </script>
 *     <script src=".../er365-fn-header.js"></script>
 *     <div id="er365-fn-header-root"></div>
 *
 * THREE INDEPENDENT PARTS, in this order:
 *   1. Session guard   - idle timeout, keep-alive ping, hard exit
 *   2. Multi-select    - virtual checkbox repopulate + aggregate
 *   3. Header render   - logo, welcome line, progress pill
 * Each is self-contained. One failing does not stop the others.
 *
 * TO BUMP THE VERSION: change the VERSION constant on line 1 of the
 * IIFE below. Nothing else carries a version number.
 *
 * ----------------------------------------------------------------
 * v2.9 (2026-09-11)
 *   - Multi-select manager now reads its stored value from EITHER a
 *     bound input OR the unbound _<Q_ID>_Repop calculated value.
 *     Only a Caspio Calculated Value can read [@runtimefield:_Virtual_*],
 *     so the Calc Value must stay as the thing that BUILDS the string.
 *     A Hidden element cannot compute it - its Default value accepts
 *     data-source / DataPart / query-string parameters only.
 *   - Aggregation now attaches ONLY when a bound input is present.
 *     With a Calc Value present, Caspio owns the forward direction and
 *     the manager owns repopulation only.
 *
 * v2.8 (2026-09-11)
 *   - Whole-file rewrite. v2.7 on GitHub had been overwritten with
 *     only the two patch snippets; the header render, the timeout
 *     guard and the opening IIFE were all missing, which is why the
 *     header vanished while the multi-select still installed.
 *   - VERSION is now a single constant.
 *   - Removed 'mousemove' from the activity listeners. It fires
 *     constantly as the cursor drifts, so the idle timer could never
 *     expire. Same fix er365-header.js made in its v4.19.
 *
 * v2.7 / v2.3 (2026-09-11)
 *   - Idle timeout performs a three-step hard exit (clear storage ->
 *     kill the Caspio session via hidden iframe -> navigate away),
 *     matching er365-header.js v4.17. A plain redirect left the
 *     server session alive, so re-login resumed the timed-out page.
 *   - Absorbed the generic multi-select manager that previously lived
 *     in per-page HTMLBlocks.
 *
 * v2.2 (2026-08-18)
 *   - Idle limit 60 min; check interval 30s; keep-alive ping 20 min.
 * ----------------------------------------------------------------
 */

(function () {
  'use strict';

  var VERSION = '2.9';

  try {
    console.log('%c[ER365] FN Header v' + VERSION + ' loaded',
                'color:#4A7EDE;font-weight:bold');
  } catch (e) {}


  /* ==============================================================
     1.  SESSION GUARD
     ============================================================== */
  (function installTimeoutGuard() {
    if (window.__er365_timeout_installed) return;
    window.__er365_timeout_installed = true;

    var cfg               = window.ER365_TIMEOUT_CFG || {};
    var IDLE_LIMIT_MS     = cfg.idleLimitMs || 60 * 60 * 1000;
    var KEEP_ALIVE_MS     = cfg.keepAliveMs || 20 * 60 * 1000;
    var CHECK_INTERVAL_MS = 30 * 1000;
    var REDIRECT_URL      = cfg.redirectUrl || 'https://erisaready365.com/';
    var LOGOUT_URL        = cfg.logoutUrl   || '/users/x202vq/logout';
    var STORAGE_KEY       = 'er365_last_activity';
    var lastActivity      = Date.now();

    function bump() {
      lastActivity = Date.now();
      try { localStorage.setItem(STORAGE_KEY, lastActivity); } catch (e) {}
    }
    bump();

    ['keydown', 'click', 'scroll', 'touchstart'].forEach(function (evt) {
      document.addEventListener(evt, bump, { passive: true });
    });

    function hardExit(reason) {
      if (window.__er365_exiting) return;
      window.__er365_exiting = true;
      try { console.warn('[ER365] Hard exit - ' + reason); } catch (e) {}

      try { localStorage.clear(); }   catch (e) {}
      try { sessionStorage.clear(); } catch (e) {}

      var navigated = false;
      function go() {
        if (navigated) return;
        navigated = true;
        var sep = REDIRECT_URL.indexOf('?') > -1 ? '&' : '?';
        window.location.replace(REDIRECT_URL + sep + 'er365=' + Date.now());
      }

      try {
        var f = document.createElement('iframe');
        f.style.cssText = 'position:absolute;left:-9999px;top:-9999px;' +
                          'width:1px;height:1px;border:0;';
        f.onload  = go;
        f.onerror = go;
        f.src = LOGOUT_URL;
        (document.body || document.documentElement).appendChild(f);
        setTimeout(go, 1500);
      } catch (e) {
        go();
      }
    }

    function check() {
      var stored = parseInt(localStorage.getItem(STORAGE_KEY) ||
                            String(lastActivity), 10);
      var idleMs = Date.now() - stored;
      if (idleMs > IDLE_LIMIT_MS) {
        hardExit('idle ' + Math.round(idleMs / 1000) + 's (limit ' +
                 Math.round(IDLE_LIMIT_MS / 1000) + 's)');
      }
    }
    setInterval(check, CHECK_INTERVAL_MS);

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { check(); bump(); }
    });

    function keepAlivePing() {
      try {
        fetch(window.location.pathname + (window.location.search || ''), {
          method: 'HEAD',
          credentials: 'include',
          cache: 'no-store'
        }).catch(function () {});
      } catch (e) {}
    }
    setInterval(keepAlivePing, KEEP_ALIVE_MS);

    try {
      console.log('%c[ER365] Session guard - idle ' +
                  (IDLE_LIMIT_MS / 60000) + ' min, keep-alive every ' +
                  (KEEP_ALIVE_MS / 60000) + ' min', 'color:#4A7EDE');
    } catch (e) {}
  })();


  /* ==============================================================
     2.  MULTI-SELECT MANAGER
     ============================================================== */
  (function installMultiSelect() {
    if (window.__er365_multi_installed) return;
    window.__er365_multi_installed = true;

    var DEBUG = !!window.ER365_MULTI_DEBUG;
    function log(m)  { if (DEBUG) { try { console.log('[MULTI] ' + m); } catch (e) {} } }
    function warn(m) { try { console.warn('[MULTI] ' + m); } catch (e) {} }

    function findParentInput(field) {
      return document.querySelector(
        'input[id^="' + field + '-"]:not([id^="_Virtual"]),' +
        'textarea[id^="' + field + '-"]:not([id^="_Virtual"])'
      );
    }

    function virtualsFor(field) {
      return document.querySelectorAll(
        'input[type="checkbox"][id^="_Virtual_' + field + '_"]'
      );
    }

    function discoverFields() {
      var seen = {}, out = [];
      var all = document.querySelectorAll('input[type="checkbox"][id^="_Virtual_"]');
      for (var i = 0; i < all.length; i++) {
        var m = all[i].id.match(/^_Virtual_([A-Za-z0-9_]+?)_(\d+)-/);
        if (m && !seen[m[1]]) { seen[m[1]] = true; out.push(m[1]); }
      }
      return out;
    }

    function optionIdOf(el) {
      var m = el.id.match(/_(\d+)-[^_]*$/);
      return m ? m[1] : null;
    }

    function aggregate(field) {
      var ids = [], v = virtualsFor(field);
      for (var i = 0; i < v.length; i++) {
        var id = optionIdOf(v[i]);
        if (id && v[i].checked) ids.push(id);
      }
      return ids.length ? ',' + ids.join(',') + ',' : '';
    }

    function setInputValue(input, value) {
      try {
        var s = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype, 'value').set;
        s.call(input, value);
      } catch (e) { input.value = value; }
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function setChecked(input, want) {
      if (input.checked === want) return;
      try { input.click(); } catch (e) {}
      if (input.checked !== want) {
        try {
          var s = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'checked').set;
          s.call(input, want);
          input.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) {}
      }
    }

    var warned = {};

    // The stored comma-wrapped string can come from either:
    //   'input' - a bound form element (manager owns forward + back)
    //   'repop' - the unbound _<Q_ID>_Repop calculated value
    //             (Caspio's Calc Value owns forward; manager owns back)
    function readStored(field) {
      var input = findParentInput(field);
      if (input) return { src: 'input', el: input, value: input.value || '' };
      var rep = document.querySelector('[id^="_' + field + '_Repop"]');
      if (rep) return { src: 'repop', el: rep,
                        value: (rep.textContent || rep.value || '').trim() };
      return null;
    }

    function repopulate() {
      discoverFields().forEach(function (field) {
        var found = readStored(field);
        if (!found) {
          if (!warned[field]) {
            warned[field] = true;
            warn('no value source for ' + field + ' - this page needs ' +
                 'either ' + field + ' as a bound form element, or a ' +
                 '_' + field + '_Repop calculated value');
          }
          return;
        }
        var stored = found.value;
        log(field + ' stored="' + stored + '" via ' + found.src);
        var v = virtualsFor(field);
        for (var i = 0; i < v.length; i++) {
          var id = optionIdOf(v[i]);
          if (!id) continue;
          var want = stored.indexOf(',' + id + ',') !== -1;
          if (want !== v[i].checked) {
            setChecked(v[i], want);
            log((want ? 'checked ' : 'unchecked ') + id + ' on ' + field);
          }
        }
      });
    }

    // Only attach when a bound input exists. If the page uses a Caspio
    // Calculated Value, Caspio already owns the forward direction and a
    // second writer would be a second source of truth.
    function attachAggregation() {
      discoverFields().forEach(function (field) {
        var parent = findParentInput(field);
        if (!parent) return;
        var v = virtualsFor(field);
        for (var i = 0; i < v.length; i++) {
          if (v[i].dataset.er365Agg) continue;
          v[i].dataset.er365Agg = '1';
          v[i].addEventListener('change', function () {
            var out = aggregate(field);
            setInputValue(parent, out);
            log(field + ' aggregated to "' + out + '"');
          });
        }
      });
    }

    function pass() { repopulate(); attachAggregation(); }

    pass();
    setTimeout(pass, 250);
    setTimeout(pass, 1000);
    setTimeout(pass, 2000);

    try {
      console.log('%c[ER365] Multi-select manager v' + VERSION + ' installed',
                  'color:#4A7EDE');
    } catch (e) {}
  })();


  /* ==============================================================
     3.  HEADER RENDER
     ============================================================== */
  var FN_LOGO_URL = 'https://erisaready365.com/wp-content/uploads/2026/08/Fiduciary-Navigator-Bold-Large-lg-font-longated-scaled.webp';
  var USER  = window.ER365_USER || {};
  var STEP  = parseInt(window.ER365_FN_STEP  || 1,  10);
  var TOTAL = parseInt(window.ER365_FN_TOTAL || 10, 10);
  var PCT   = Math.round((STEP / TOTAL) * 100);

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

  function safe(v, fallback) {
    return (!v || String(v).indexOf('[@') === 0) ? (fallback || '') : v;
  }

  function buildHeader() {
    var wrap = document.createElement('div');
    wrap.className = 'er365-fn-hdr';

    var top = document.createElement('div');
    top.className = 'er365-fn-hdr-top';
    top.innerHTML =
      '<div class="er365-fn-hdr-brand">' +
        '<img src="' + FN_LOGO_URL + '" alt="Fiduciary Navigator">' +
      '</div>' +
      '<div class="er365-fn-hdr-user">Welcome, <strong>' +
        safe(USER.name, 'User') + '</strong></div>';
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
    try { console.log('%c[ER365] Header rendered - step ' + STEP + ' of ' +
                      TOTAL, 'color:#4A7EDE'); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
