// v2.6 — three-step hard exit, matching er365-header.js v4.17.
    // A plain redirect leaves the Caspio server session alive, so the
    // next login resumes the page the user timed out from.
    function hardExit(reason) {
      if (window.__er365_exiting) return;
      window.__er365_exiting = true;
      try { console.warn('[ER365] Hard exit — ' + reason); } catch (e) {}

      // 1. clear client-side state
      try { localStorage.clear(); }   catch (e) {}
      try { sessionStorage.clear(); } catch (e) {}

      // 3. navigate away (runs once, whichever path gets there first)
      var navigated = false;
      function go() {
        if (navigated) return;
        navigated = true;
        var sep = REDIRECT_URL.indexOf('?') > -1 ? '&' : '?';
        window.location.replace(REDIRECT_URL + sep + 'er365=' + Date.now());
      }

      // 2. kill the server session via a hidden iframe, then go
      try {
        var f = document.createElement('iframe');
        f.style.cssText = 'position:absolute;left:-9999px;top:-9999px;' +
                          'width:1px;height:1px;border:0;';
        f.onload  = go;
        f.onerror = go;
        f.src = LOGOUT_URL;
        (document.body || document.documentElement).appendChild(f);
        setTimeout(go, 1500);   // never wait longer than this
      } catch (e) {
        go();
      }
    }

    function check() {
      var stored = parseInt(localStorage.getItem(STORAGE_KEY) || String(lastActivity), 10);
      var idleMs = Date.now() - stored;
      if (idleMs > IDLE_LIMIT_MS) {
        hardExit('idle ' + Math.round(idleMs / 1000) + 's (limit ' +
                 Math.round(IDLE_LIMIT_MS / 1000) + 's)');
      }
    }
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

NOTE ON localStorage.clear()
  This wipes er365_last_activity along with everything else. That is
  intentional and harmless — the page is navigating away, and a fresh
  login re-seeds it. It also wipes the jump-back breadcrumb
  (er365_jump), which is correct: after a timeout there is nothing
  to return to.

NOTE ON LOGOUT_URL
  x202vq is the ERISAReady365 Caspio auth realm. If you ever change
  realms, set window.ER365_TIMEOUT_CFG = { logoutUrl: '/users/<realm>/logout' }
  in the mount block rather than editing this file.


=============================================================
PATCH 2 — GENERIC MULTI-SELECT MANAGER
=============================================================

WHERE:  immediately AFTER the closing of installTimeoutGuard() —
        that is, after the line

    })();

        that ends the timeout IIFE, and BEFORE the line

    var FN_LOGO_URL = 'https://erisaready365.com/wp-content/uploads/...

ADD everything between the dashed lines:

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // ============================================================
  // v2.6 — GENERIC MULTI-SELECT MANAGER
  // Self-discovering: finds any _Virtual_<Q_ID>_<Option_ID> checkbox
  // on whatever page it runs on. Repopulates them from the parent
  // Hidden field on load, and aggregates them back to a comma-wrapped
  // string on every change.
  //
  // REQUIRES, per page and per multi-select question: the parent
  // question must exist on the form as a HIDDEN form element named
  // for its Q_ID. If it does not, this logs a warning naming the
  // field and does nothing for it.
  //
  // Set window.ER365_MULTI_DEBUG = true in a page's mount block for
  // per-option logging while troubleshooting.
  // ============================================================
  (function installMultiSelect() {
    if (window.__er365_multi_installed) return;
    window.__er365_multi_installed = true;

    var DEBUG = !!window.ER365_MULTI_DEBUG;
    function log(msg) { if (DEBUG) { try { console.log('[MULTI] ' + msg); } catch (e) {} } }
    function warn(msg) { try { console.warn('[MULTI] ' + msg); } catch (e) {} }

    function findParentInput(fieldName) {
      return document.querySelector(
        'input[id^="' + fieldName + '-"]:not([id^="_Virtual"]),' +
        'textarea[id^="' + fieldName + '-"]:not([id^="_Virtual"])'
      );
    }

    function virtualsFor(fieldName) {
      return document.querySelectorAll(
        'input[type="checkbox"][id^="_Virtual_' + fieldName + '_"]'
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

    function aggregate(fieldName) {
      var ids = [], v = virtualsFor(fieldName);
      for (var i = 0; i < v.length; i++) {
        var id = optionIdOf(v[i]);
        if (id && v[i].checked) ids.push(id);
      }
      return ids.length ? ',' + ids.join(',') + ',' : '';
    }

    // Text inputs: React reads the native value setter, so use it.
    function setInputValue(input, value) {
      try {
        var s = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype, 'value').set;
        s.call(input, value);
      } catch (e) { input.value = value; }
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Checkboxes: .click() first — React ignores the native checked
    // setter. Fall back to the setter only if the click did not take.
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

    function repopulate() {
      discoverFields().forEach(function (field) {
        var parent = findParentInput(field);
        if (!parent) {
          warn('no parent input for ' + field +
               ' — add ' + field + ' as a Hidden form element on this page');
          return;
        }
        var stored = parent.value || '';
        log(field + ' stored="' + stored + '"');
        var v = virtualsFor(field);
        for (var i = 0; i < v.length; i++) {
          var id = optionIdOf(v[i]);
          if (!id) continue;
          var want = stored.indexOf(',' + id + ',') !== -1;
          if (want !== v[i].checked) {
            setChecked(v[i], want);
            log((want ? 'checked ' : 'unchecked ') + 'option ' + id + ' on ' + field);
          }
        }
      });
    }

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

    // Flex renders in phases; these are retries, not duplicates —
    // the dataset guard above makes re-attachment a no-op.
    pass();
    setTimeout(pass, 250);
    setTimeout(pass, 1000);
    setTimeout(pass, 2000);

    try {
      console.log('%c[ER365] Multi-select manager v2.6 installed',
                  'color:#4A7EDE');
    } catch (e) {}
  })();
