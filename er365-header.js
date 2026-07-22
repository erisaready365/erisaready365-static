/* er365-header.js v4.1 */
/**
 * ERISAReady365 Header Component (v4.1)
 * =====================================
 *
 * v4.1 CHANGES (2026-07-21) — CONTEXT FILTERING:
 *   - Reads window.ER365_CONTEXT ('home' | 'plan') and filters nav accordingly
 *   - 'home' context: hides all items with context:'plan' → renders just logo + welcome + avatar
 *   - 'plan' context (default if unset): full nav
 *   - Hamburger auto-hides when nav is empty (no orphan mobile menu button)
 *
 * v4.0 CHANGES (2026-07-21) — SINGLE-SOURCE HOSTING REFACTOR:
 *   - Reads nav from window.ER365_NAV.items (external nav-items file)
 *     Fallback: fetch from Caspio DataPage endpoint (window.ER365_NAV_URL)
 *     Last resort: FALLBACK_NAV_ITEMS hardcoded here
 *   - Reads avatar menu from window.ER365_NAV.avatar (sectioned)
 *     Fallback: hardcoded 2-item + Logout
 *   - Supports dispatchByRole in two shapes:
 *       (a) item.dispatchByRole === true → calls window.ER365_NAV.dispatchByRole()
 *       (b) item.dispatchByRole = {accessId: url, ...} → legacy per-item lookup
 *   - Accepts both item.url (new) and item.page (legacy) field names
 *   - Accepts both nested (item.children) and flat (item.parent) nav shapes
 *   - user.role (singular, name string) now distinct from user.roles (access IDs CSV)
 *
 * MOUNT (in AppPage HTMLBlock):
 *   <script>
 *     window.ER365_USER = {
 *       name:'[@authfield:Full_Name_Formal]',
 *       company:'[@authfield:Company_Name]',
 *       email:'[@authfield:Email]',
 *       role:'[@authfield:User_Role]',       // singular = role NAME string
 *       roles:'[@authfield:User_Access]',    // CSV of access IDs
 *       access:'[@authfield:User_Access]'    // alias
 *     };
 *     window.ER365_ACTIVE_PAGE = 'plan-dashboard';
 *     window.ER365_CFG = { logoUrl:'...', logoutUrl:'/users/x202vq/logout' };
 *   </script>
 *   <script src="<CASPIO_FILES>/er365-nav-items.js?v=X.Y"></script>
 *   <script src="<CASPIO_FILES>/er365-header.js?v=X.Y"></script>
 *   <div id="er365-header-root"></div>
 *
 * (c) 2026 RetireWell, LLC. Confidential — Internal Use Only.
 */

(function () {
  'use strict';

  try { console.log('%c[ER365] Header v4.0 loaded', 'color:#4A7EDE;font-weight:bold'); } catch(e){}

  // ---------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------

  var CFG = window.ER365_CFG || {};

  var LOGO_URL =
    CFG.logoUrl ||
    'https://erisaready365.com/wp-content/uploads/2026/07/ERISAReady-365-ICON-no-background.png';

  var LOGOUT_URL = CFG.logoutUrl || '/users/x202vq/logout';
  var PROFILE_PAGE = CFG.profilePage || 'my-account';
  var ACCOUNT_PAGE = CFG.accountPage || 'my-account';

  var MOBILE_BREAKPOINT_PX = CFG.mobileBreakpointPx || 1100;

  var FORM_PAGE_MARKERS = CFG.formPageMarkers || [
    'fiduciary-navigator',
    'plan-director',
    'committee-membership',
    'fiduciary-director',
    'fiduciary-finder'
  ];

  // Last-resort fallback if window.ER365_NAV.items is undefined AND no DataPage endpoint.
  // Should almost never fire in production — the external nav-items file is authoritative.
  var FALLBACK_NAV_ITEMS = [
    { id:'plan-dashboard', label:'Plan Dashboard',
      url:'https://secure.erisaready365.com/erisa-ready-365/365-member/plan-dashboard',
      roles:[], parent:null }
  ];

  // Fallback avatar menu (used only if window.ER365_NAV.avatar undefined)
  var FALLBACK_AVATAR = [
    { section:'My Account', items:[
      { id:'my-account', label:'My Account', url:'#' }
    ]}
  ];

  // ---------------------------------------------------------
  // STYLES
  // ---------------------------------------------------------

  var CSS = [
    '#er365-header {',
    '  position: sticky; top: 0; z-index: 9999;',
    '  display: flex; align-items: center;',
    '  padding: 18px 40px; background: #ffffff;',
    '  border-bottom: 1px solid #e6ebf1;',
    '  font-family: Calibri, "Segoe UI", Arial, sans-serif;',
    '  font-size: 16px; color: #002855;',
    '  min-height: 96px; box-sizing: border-box;',
    '}',
    '.er365-hdr-left { display: flex; align-items: center; gap: 14px; white-space: nowrap; flex-shrink: 0; }',
    '.er365-hdr-logo img { height: 66px; display: block; }',
    '.er365-hdr-sep { color: #b0b8c4; font-weight: 400; padding: 0 4px; }',
    '.er365-hdr-company { color: #002855; font-weight: 600; }',
    '.er365-hdr-welcome { color: #002855; font-weight: 400; }',
    '.er365-hdr-welcome strong { font-weight: 600; }',
    '.er365-hdr-right { margin-left: auto; display: flex; align-items: center; gap: 26px; }',
    '.er365-hdr-nav { display: flex; align-items: center; gap: 26px; }',
    '.er365-hdr-nav-item { position: relative; }',
    '.er365-hdr-nav a, .er365-hdr-nav button.er365-hdr-nav-parent {',
    '  color: #002855; text-decoration: none; background: none; border: none;',
    '  font: inherit; padding: 8px 2px; cursor: pointer; white-space: nowrap;',
    '  border-bottom: 2px solid transparent; transition: border-color 0.15s, color 0.15s;',
    '}',
    '.er365-hdr-nav a:hover, .er365-hdr-nav button.er365-hdr-nav-parent:hover {',
    '  border-bottom-color: #002855;',
    '}',
    '.er365-hdr-nav a.er365-hdr-active, .er365-hdr-nav button.er365-hdr-nav-parent.er365-hdr-active {',
    '  color: #4A7EDE; border-bottom-color: #4A7EDE; font-weight: 600;',
    '}',
    '.er365-hdr-nav-caret { display: inline-block; margin-left: 4px; font-size: 10px; }',
    '.er365-hdr-submenu {',
    '  display: none; position: fixed;',
    '  background: #ffffff; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);',
    '  border-radius: 6px; min-width: 240px; padding: 6px 0; margin-top: 6px; z-index: 10000;',
    '}',
    '.er365-hdr-nav-item.er365-hdr-open .er365-hdr-submenu { display: block; }',
    '.er365-hdr-submenu a {',
    '  display: block; padding: 10px 16px; color: #002855;',
    '  text-decoration: none; border-bottom: none;',
    '}',
    '.er365-hdr-submenu a:hover { background: #f0f4f9; border-bottom: none; }',
    '.er365-hdr-submenu a.er365-hdr-active { color: #4A7EDE; font-weight: 600; }',
    '.er365-hdr-avatar {',
    '  width: 46px; height: 46px; border-radius: 50%; background: #002855;',
    '  color: #ffffff; display: flex; align-items: center; justify-content: center;',
    '  font-weight: 600; font-size: 16px; cursor: pointer; border: none;',
    '  position: relative; user-select: none; flex-shrink: 0;',
    '}',
    '.er365-hdr-avatar:hover { background: #001f42; }',
    '.er365-hdr-avatar-menu {',
    '  display: none; position: fixed;',
    '  background: #ffffff; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);',
    '  border-radius: 6px; min-width: 240px; padding: 6px 0; z-index: 10000; text-align: left;',
    '}',
    '.er365-hdr-avatar-wrap.er365-hdr-open .er365-hdr-avatar-menu { display: block; }',
    '.er365-hdr-avatar-wrap { position: relative; }',
    '.er365-hdr-avatar-menu .er365-hdr-avatar-section {',
    '  padding: 6px 16px 4px; color: #7a8598; font-size: 11px; font-weight: 700;',
    '  text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;',
    '}',
    '.er365-hdr-avatar-menu .er365-hdr-avatar-section:first-child { margin-top: 0; }',
    '.er365-hdr-avatar-menu .er365-hdr-avatar-divider {',
    '  height: 1px; background: #eef2f6; margin: 4px 0;',
    '}',
    '.er365-hdr-avatar-menu a {',
    '  display: block; padding: 9px 16px; color: #002855;',
    '  text-decoration: none; font-weight: 500; font-size: 14px;',
    '}',
    '.er365-hdr-avatar-menu a:hover { background: #f0f4f9; }',
    '.er365-hdr-avatar-menu a.er365-hdr-logout {',
    '  color: #b0392f; border-top: 1px solid #eef2f6; margin-top: 4px;',
    '}',
    '.er365-hdr-hamburger {',
    '  display: none; background: none; border: none; cursor: pointer;',
    '  width: 48px; height: 48px; padding: 0; border-radius: 6px; flex-shrink: 0;',
    '}',
    '.er365-hdr-hamburger:hover { background: #f0f4f9; }',
    '.er365-hdr-hamburger span {',
    '  display: block; width: 26px; height: 3px; background: #002855;',
    '  margin: 5px auto; border-radius: 2px;',
    '}',
    '.er365-hdr-overlay {',
    '  position: fixed; top: 0; right: 0; bottom: 0; width: 320px; max-width: 85vw;',
    '  background: #ffffff; box-shadow: -2px 0 16px rgba(0, 0, 0, 0.15);',
    '  transform: translateX(100%); transition: transform 0.25s;',
    '  z-index: 10000; padding: 60px 0 20px; overflow-y: auto;',
    '}',
    '.er365-hdr-overlay.er365-hdr-open { transform: translateX(0); }',
    '.er365-hdr-overlay-close {',
    '  position: absolute; top: 12px; right: 12px; background: none; border: none;',
    '  font-size: 24px; cursor: pointer; color: #002855; padding: 6px 12px;',
    '}',
    '.er365-hdr-overlay ul { list-style: none; margin: 0; padding: 0; }',
    '.er365-hdr-overlay li a {',
    '  display: block; padding: 14px 24px; color: #002855;',
    '  text-decoration: none; font-weight: 600; font-size: 16px;',
    '  border-bottom: 1px solid #eef2f6;',
    '}',
    '.er365-hdr-overlay li.er365-hdr-child a {',
    '  padding-left: 44px; font-weight: 500; font-size: 15px;',
    '}',
    '.er365-hdr-overlay li a:hover { background: #f0f4f9; }',
    '.er365-hdr-overlay li a.er365-hdr-active {',
    '  color: #4A7EDE; font-weight: 700; background: #f0f4f9;',
    '  border-left: 3px solid #4A7EDE; padding-left: 21px;',
    '}',
    '.er365-hdr-overlay li.er365-hdr-child a.er365-hdr-active { padding-left: 41px; }',
    '.er365-hdr-backdrop {',
    '  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.35);',
    '  z-index: 9998; opacity: 0; pointer-events: none; transition: opacity 0.2s;',
    '}',
    '.er365-hdr-backdrop.er365-hdr-open { opacity: 1; pointer-events: auto; }',
    '.er365-hdr-dialog {',
    '  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);',
    '  background: #ffffff; padding: 28px 32px; border-radius: 10px;',
    '  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25); z-index: 10001;',
    '  max-width: 460px; width: calc(100% - 32px);',
    '}',
    '.er365-hdr-dialog h3 { margin: 0 0 12px; color: #002855; font-size: 18px; }',
    '.er365-hdr-dialog p { margin: 0 0 24px; color: #444; line-height: 1.5; }',
    '.er365-hdr-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }',
    '.er365-hdr-btn { padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; }',
    '.er365-hdr-btn-primary { background: #002855; color: #ffffff; }',
    '.er365-hdr-btn-secondary { background: #eef2f6; color: #002855; }',
    '.er365-hdr-btn-danger { background: #b0392f; color: #ffffff; }',
    '@media (max-width: ' + (MOBILE_BREAKPOINT_PX - 1) + 'px) {',
    '  #er365-header { padding: 14px 20px; min-height: 78px; }',
    '  .er365-hdr-logo img { height: 52px; }',
    '  .er365-hdr-nav { display: none; }',
    '  .er365-hdr-welcome, .er365-hdr-company, .er365-hdr-sep { display: none; }',
    '  .er365-hdr-hamburger { display: block; }',
    '  .er365-hdr-avatar { width: 40px; height: 40px; font-size: 14px; }',
    '  .er365-hdr-right { gap: 14px; }',
    '}',
    '@media (max-width: 420px) {',
    '  #er365-header { padding: 12px 12px; min-height: 68px; }',
    '  .er365-hdr-logo img { height: 40px; }',
    '  .er365-hdr-avatar { width: 36px; height: 36px; font-size: 13px; }',
    '  .er365-hdr-hamburger { width: 40px; height: 40px; }',
    '  .er365-hdr-hamburger span { width: 22px; }',
    '  .er365-hdr-right { gap: 10px; }',
    '}'
  ].join('\n');

  // ---------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------

  function injectStyles() {
    if (document.querySelector('style[data-er365-hdr]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-er365-hdr', 'true');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function itemUrl(item) { return item.url || item.page || ''; }

  function normalizeRole(role) { return (role || '').trim().toLowerCase(); }

  function normalizeRolesInput(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(String).map(function (s) { return s.trim(); }).filter(Boolean);
    return String(input).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function hasRoleGlobal(roleName) {
    var target = normalizeRole(roleName);
    return (window.ER365 && window.ER365.roles || []).some(function (r) {
      return normalizeRole(r) === target;
    });
  }

  function hasAnyRoleGlobal(roleList) {
    var wanted = normalizeRolesInput(roleList);
    if (wanted.length === 0) return true;
    return wanted.some(hasRoleGlobal);
  }

  function userCanSee(item) {
    var allowed = item.roles;
    if (!allowed || allowed.length === 0) return true;
    return allowed.some(hasRoleGlobal);
  }

  function getInitials(name) {
    if (!name || name.indexOf('[@') === 0) return 'U';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function safeText(str, fallback) {
    if (!str || (typeof str === 'string' && str.indexOf('[@') === 0)) return fallback || '';
    return str;
  }

  function detectActivePage() {
    if (window.ER365_ACTIVE_PAGE) return String(window.ER365_ACTIVE_PAGE).toLowerCase();
    var url = (window.location.hash + window.location.pathname).toLowerCase();
    var m = url.match(/apppage\/([^/?#&]+)/);
    if (m) return m[1];
    var parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1].toLowerCase() : '';
  }

  function isActive(item, activePage) {
    if (!activePage) return false;
    var target = String(itemUrl(item)).toLowerCase();
    if (!target) return false;
    // Match by item id (preferred) OR by URL substring
    if (item.id && item.id.toLowerCase() === activePage) return true;
    return target === activePage || activePage.indexOf(target) !== -1 || target.indexOf(activePage) !== -1;
  }

  // ---------------------------------------------------------
  // Dispatch by role — supports both shapes
  // ---------------------------------------------------------

  function resolveDispatchedUrl(item) {
    // Shape (a): item.dispatchByRole === true → call module-level function
    if (item.dispatchByRole === true && window.ER365_NAV && typeof window.ER365_NAV.dispatchByRole === 'function') {
      var user = window.ER365_USER || {};
      var out = window.ER365_NAV.dispatchByRole(item.id, user.role, user.access || user.roles);
      return out || itemUrl(item);
    }
    // Shape (b): item.dispatchByRole = {accessId: url, default: url}
    if (typeof item.dispatchByRole === 'object' && item.dispatchByRole) {
      var normalized = (window.ER365 && window.ER365.roles || []).map(function(r){ return String(r).trim(); });
      for (var key in item.dispatchByRole) {
        if (!item.dispatchByRole.hasOwnProperty(key)) continue;
        if (key === 'default') continue;
        var ids = String(key).split(',').map(function(s){ return s.trim(); });
        for (var i = 0; i < ids.length; i++) {
          if (normalized.indexOf(ids[i]) !== -1) return item.dispatchByRole[key];
        }
      }
      if (item.dispatchByRole['default']) return item.dispatchByRole['default'];
    }
    return itemUrl(item);
  }

  // ---------------------------------------------------------
  // Load nav items — external file → Caspio endpoint → hardcoded
  // ---------------------------------------------------------

  function loadNavItems(callback) {
    // 1) Caspio DataPage endpoint (future dynamic nav table)
    var url = window.ER365_NAV_URL || CFG.navUrl;
    if (url) {
      fetch(url, { credentials: 'include' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (rows) {
          if (!Array.isArray(rows) || rows.length === 0) return useExternalOrFallback(callback);
          var items = rows
            .filter(function (r) { return String(r.Is_Active).toLowerCase() !== 'false'; })
            .map(function (r) {
              return {
                id: r.Nav_ID || r.Label,
                label: r.Label,
                url: r.Page_Or_URL,
                sort: Number(r.Sort_Order || 999),
                roles: (r.Allowed_Roles || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
                parent: r.Parent_Item_ID || null
              };
            })
            .sort(function (a, b) { return a.sort - b.sort; });
          callback(items);
        })
        .catch(function (err) {
          console.warn('[ER365 Header] Nav fetch failed:', err.message, '— trying external nav file.');
          useExternalOrFallback(callback);
        });
      return;
    }
    useExternalOrFallback(callback);
  }

  function useExternalOrFallback(callback) {
    // 2) External nav-items.js file (window.ER365_NAV.items)
    if (window.ER365_NAV && Array.isArray(window.ER365_NAV.items) && window.ER365_NAV.items.length > 0) {
      try { console.log('[ER365 Header] Using external nav-items v' + (window.ER365_NAV.version || '?') + ' — ' + window.ER365_NAV.items.length + ' items'); } catch(e){}
      callback(window.ER365_NAV.items);
      return;
    }
    // 3) Last-resort hardcoded fallback
    console.warn('[ER365 Header] No nav source found — using hardcoded FALLBACK_NAV_ITEMS');
    callback(FALLBACK_NAV_ITEMS);
  }

  function filterByContext(items) {
    var ctx = (window.ER365_CONTEXT || 'plan').toLowerCase();
    return items.filter(function (it) {
      // Item with no context set is universally visible (backward compat)
      if (!it.context) return true;
      return String(it.context).toLowerCase() === ctx;
    });
  }

  function nestNav(items) {
    items = filterByContext(items);
    // Already nested (my nav-items.js shape) — return as-is
    if (items.length && items[0].children !== undefined) return items;
    // Flat with parent references (legacy Caspio DataPage shape) — nest them
    var byId = {};
    items.forEach(function (i) { if (i.id) byId[i.id] = i; });
    var roots = [];
    items.forEach(function (item) {
      if (item.parent && byId[item.parent]) {
        var p = byId[item.parent];
        (p.children = p.children || []).push(item);
      } else {
        roots.push(item);
      }
    });
    return roots;
  }

  // ---------------------------------------------------------
  // Build DOM — desktop nav
  // ---------------------------------------------------------

  function buildDesktopNav(items) {
    var nested = nestNav(items);
    var activePage = detectActivePage();
    var nav = document.createElement('nav');
    nav.className = 'er365-hdr-nav';
    nav.setAttribute('aria-label', 'Primary navigation');

    nested.forEach(function (item) {
      if (!userCanSee(item)) return;
      var container = document.createElement('div');
      container.className = 'er365-hdr-nav-item';

      var visibleChildren = (item.children || []).filter(userCanSee);
      var parentActive = isActive(item, activePage) ||
        visibleChildren.some(function (c) { return isActive(c, activePage); });

      if (visibleChildren.length > 0) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'er365-hdr-nav-parent' + (parentActive ? ' er365-hdr-active' : '');
        btn.textContent = item.label;
        btn.setAttribute('data-page', itemUrl(item));
        var caret = document.createElement('span');
        caret.className = 'er365-hdr-nav-caret';
        caret.textContent = '▾';
        btn.appendChild(caret);
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          document.querySelectorAll('.er365-hdr-nav-item.er365-hdr-open').forEach(function (el) {
            if (el !== container) el.classList.remove('er365-hdr-open');
          });
          var opening = !container.classList.contains('er365-hdr-open');
          container.classList.toggle('er365-hdr-open');
          if (opening) {
            var r = btn.getBoundingClientRect();
            sub.style.top   = (r.bottom + 6) + 'px';
            sub.style.right = (window.innerWidth - r.right) + 'px';
          }
        });
        container.appendChild(btn);

        var sub = document.createElement('div');
        sub.className = 'er365-hdr-submenu';
        visibleChildren.forEach(function (child) {
          var a = document.createElement('a');
          a.textContent = child.label;
          a.href = '#';
          a.setAttribute('data-page', itemUrl(child));
          if (isActive(child, activePage)) a.className = 'er365-hdr-active';
          a.addEventListener('click', function (e) {
            e.preventDefault();
            container.classList.remove('er365-hdr-open');
            navigateTo(resolveDispatchedUrl(child));
          });
          sub.appendChild(a);
        });
        container.appendChild(sub);
      } else {
        var a = document.createElement('a');
        a.textContent = item.label;
        a.href = '#';
        a.setAttribute('data-page', itemUrl(item));
        if (parentActive) a.className = 'er365-hdr-active';
        a.addEventListener('click', function (e) {
          e.preventDefault();
          navigateTo(resolveDispatchedUrl(item));
        });
        container.appendChild(a);
      }
      nav.appendChild(container);
    });
    return nav;
  }

  // ---------------------------------------------------------
  // Build DOM — avatar menu (sectioned when window.ER365_NAV.avatar present)
  // ---------------------------------------------------------

  function buildAvatarMenu(user) {
    var wrap = document.createElement('div');
    wrap.className = 'er365-hdr-avatar-wrap';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'er365-hdr-avatar';
    btn.textContent = getInitials(user.name);
    btn.setAttribute('aria-label', 'Account menu');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var opening = !wrap.classList.contains('er365-hdr-open');
      wrap.classList.toggle('er365-hdr-open');
      if (opening) {
        var r = btn.getBoundingClientRect();
        menu.style.top   = (r.bottom + 8) + 'px';
        menu.style.right = (window.innerWidth - r.right) + 'px';
      }
    });
    wrap.appendChild(btn);

    var menu = document.createElement('div');
    menu.className = 'er365-hdr-avatar-menu';

    // Sectioned avatar from window.ER365_NAV.avatar
    var sections = (window.ER365_NAV && Array.isArray(window.ER365_NAV.avatar) && window.ER365_NAV.avatar.length > 0)
      ? window.ER365_NAV.avatar
      : FALLBACK_AVATAR;

    sections.forEach(function (section, idx) {
      if (idx > 0) {
        var divider = document.createElement('div');
        divider.className = 'er365-hdr-avatar-divider';
        menu.appendChild(divider);
      }
      var header = document.createElement('div');
      header.className = 'er365-hdr-avatar-section';
      header.textContent = section.section;
      menu.appendChild(header);

      (section.items || []).forEach(function (i) {
        var a = document.createElement('a');
        a.textContent = i.label;
        a.href = '#';
        a.setAttribute('data-page', itemUrl(i));
        a.addEventListener('click', function (e) {
          e.preventDefault();
          wrap.classList.remove('er365-hdr-open');
          navigateTo(itemUrl(i));
        });
        menu.appendChild(a);
      });
    });

    // Logout always at bottom
    var logout = document.createElement('a');
    logout.textContent = 'Log Out';
    logout.href = '#';
    logout.className = 'er365-hdr-logout';
    logout.addEventListener('click', function (e) {
      e.preventDefault();
      wrap.classList.remove('er365-hdr-open');
      attemptLogout();
    });
    menu.appendChild(logout);
    wrap.appendChild(menu);
    return wrap;
  }

  // ---------------------------------------------------------
  // Build DOM — mobile overlay (renders parents + children)
  // ---------------------------------------------------------

  function buildOverlayNav(items) {
    var overlay = document.createElement('div');
    overlay.className = 'er365-hdr-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Navigation menu');

    var closeBtn = document.createElement('button');
    closeBtn.className = 'er365-hdr-overlay-close';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeOverlay);
    overlay.appendChild(closeBtn);

    var ul = document.createElement('ul');
    var activePage = detectActivePage();
    var nested = nestNav(items);

    nested.forEach(function (parent) {
      if (!userCanSee(parent)) return;
      var parentLi = document.createElement('li');
      var parentA = document.createElement('a');
      parentA.textContent = parent.label;
      parentA.href = '#';
      parentA.setAttribute('data-page', itemUrl(parent));
      if (isActive(parent, activePage)) parentA.className = 'er365-hdr-active';
      parentA.addEventListener('click', function (e) {
        e.preventDefault();
        closeOverlay();
        navigateTo(resolveDispatchedUrl(parent));
      });
      parentLi.appendChild(parentA);
      ul.appendChild(parentLi);

      // Render children indented below (mobile users need direct access)
      (parent.children || []).filter(userCanSee).forEach(function (child) {
        var childLi = document.createElement('li');
        childLi.className = 'er365-hdr-child';
        var childA = document.createElement('a');
        childA.textContent = child.label;
        childA.href = '#';
        childA.setAttribute('data-page', itemUrl(child));
        if (isActive(child, activePage)) childA.className = 'er365-hdr-active';
        childA.addEventListener('click', function (e) {
          e.preventDefault();
          closeOverlay();
          navigateTo(resolveDispatchedUrl(child));
        });
        childLi.appendChild(childA);
        ul.appendChild(childLi);
      });
    });

    overlay.appendChild(ul);
    return overlay;
  }

  // ---------------------------------------------------------
  // Build header shell
  // ---------------------------------------------------------

  function buildHeader(navItems) {
    var user = window.ER365_USER || {};
    var name = safeText(user.name, 'User');
    var company = safeText(user.company, '');

    var header = document.createElement('header');
    header.id = 'er365-header';

    var left = document.createElement('div');
    left.className = 'er365-hdr-left';

    var logoWrap = document.createElement('div');
    logoWrap.className = 'er365-hdr-logo';
    var logoImg = document.createElement('img');
    logoImg.src = LOGO_URL;
    logoImg.onerror = function(){
      this.style.display='none';
      var t=document.createElement('span');
      t.textContent='ERISAReady365';
      t.style.cssText='font-weight:700;font-size:20px;color:#002855';
      this.parentNode.appendChild(t);
    };
    logoImg.alt = 'ERISAReady365';
    logoWrap.appendChild(logoImg);
    left.appendChild(logoWrap);

    if (company) {
      var sep1 = document.createElement('span');
      sep1.className = 'er365-hdr-sep';
      sep1.textContent = '|';
      left.appendChild(sep1);
      var companyEl = document.createElement('span');
      companyEl.className = 'er365-hdr-company';
      companyEl.textContent = company;
      left.appendChild(companyEl);
    }

    var sep2 = document.createElement('span');
    sep2.className = 'er365-hdr-sep';
    sep2.textContent = '|';
    left.appendChild(sep2);

    var welcome = document.createElement('span');
    welcome.className = 'er365-hdr-welcome';
    welcome.innerHTML = 'Welcome, <strong></strong>';
    welcome.querySelector('strong').textContent = name;
    left.appendChild(welcome);
    header.appendChild(left);

    var right = document.createElement('div');
    right.className = 'er365-hdr-right';
    right.appendChild(buildDesktopNav(navItems));
    right.appendChild(buildAvatarMenu(user));

    // Only render hamburger if there ARE nav items (Home context has none)
    var visibleNavItems = filterByContext(navItems);
    if (visibleNavItems.length > 0) {
      var hamburger = document.createElement('button');
      hamburger.type = 'button';
      hamburger.className = 'er365-hdr-hamburger';
      hamburger.setAttribute('aria-label', 'Open navigation menu');
      hamburger.innerHTML = '<span></span><span></span><span></span>';
      hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        openOverlay();
      });
      right.appendChild(hamburger);
    }
    header.appendChild(right);

    var backdrop = document.createElement('div');
    backdrop.className = 'er365-hdr-backdrop';
    backdrop.addEventListener('click', closeOverlay);
    document.body.appendChild(backdrop);
    // Only build mobile overlay if there are nav items to show
    if (visibleNavItems.length > 0) {
      document.body.appendChild(buildOverlayNav(navItems));
    }

    document.addEventListener('click', function () {
      document.querySelectorAll('.er365-hdr-open').forEach(function (el) {
        el.classList.remove('er365-hdr-open');
      });
    });
    return header;
  }

  // ---------------------------------------------------------
  // Overlay + routing + logout + gating (unchanged from v3.2)
  // ---------------------------------------------------------

  function openOverlay() {
    var overlay = document.querySelector('.er365-hdr-overlay');
    var backdrop = document.querySelector('.er365-hdr-backdrop');
    if (overlay) overlay.classList.add('er365-hdr-open');
    if (backdrop) backdrop.classList.add('er365-hdr-open');
  }
  function closeOverlay() {
    var overlay = document.querySelector('.er365-hdr-overlay');
    var backdrop = document.querySelector('.er365-hdr-backdrop');
    if (overlay) overlay.classList.remove('er365-hdr-open');
    if (backdrop) backdrop.classList.remove('er365-hdr-open');
  }

  function navigateTo(pageOrUrl) {
    if (!pageOrUrl) return;
    if (/^https?:\/\//i.test(pageOrUrl)) {
      window.location.href = pageOrUrl;
      return;
    }
    if (window.CaspioBridge && typeof window.CaspioBridge.goToAppPage === 'function') {
      window.CaspioBridge.goToAppPage(pageOrUrl);
      return;
    }
    window.ER365_ACTIVE_PAGE = pageOrUrl;
    window.location.hash = '#/AppPage/' + pageOrUrl;
    setTimeout(refreshActiveState, 0);
  }

  function refreshActiveState() {
    var activePage = detectActivePage();
    document.querySelectorAll('#er365-header .er365-hdr-active, .er365-hdr-overlay .er365-hdr-active').forEach(function (el) {
      el.classList.remove('er365-hdr-active');
    });
    document.querySelectorAll('#er365-header a[data-page], #er365-header button[data-page], .er365-hdr-overlay a[data-page]').forEach(function (el) {
      var page = (el.getAttribute('data-page') || '').toLowerCase();
      if (page && (page === activePage || activePage.indexOf(page) !== -1 || page.indexOf(activePage) !== -1)) {
        el.classList.add('er365-hdr-active');
      }
    });
    document.querySelectorAll('#er365-header .er365-hdr-nav-item').forEach(function (container) {
      var anyChildActive = container.querySelector('.er365-hdr-submenu a.er365-hdr-active');
      if (anyChildActive) {
        var parentBtn = container.querySelector('button.er365-hdr-nav-parent');
        if (parentBtn) parentBtn.classList.add('er365-hdr-active');
      }
    });
  }

  function isCurrentlyOnFormPage() {
    var url = (window.location.pathname + window.location.hash).toLowerCase();
    return FORM_PAGE_MARKERS.some(function (m) { return url.indexOf(m) !== -1; });
  }

  function attemptLogout() {
    if (isCurrentlyOnFormPage()) showDraftLogoutPrompt();
    else performLogout();
  }

  function showDraftLogoutPrompt() {
    var backdrop = document.createElement('div');
    backdrop.className = 'er365-hdr-backdrop er365-hdr-open';
    backdrop.style.zIndex = 10000;

    var dlg = document.createElement('div');
    dlg.className = 'er365-hdr-dialog';
    dlg.setAttribute('role', 'alertdialog');
    dlg.innerHTML =
      '<h3>You have an in-progress form</h3>' +
      '<p>You are currently completing a form. If you log out now, any unsaved answers on this page will be lost. What would you like to do?</p>' +
      '<div class="er365-hdr-dialog-actions">' +
      '  <button class="er365-hdr-btn er365-hdr-btn-secondary" data-action="cancel">Cancel</button>' +
      '  <button class="er365-hdr-btn er365-hdr-btn-danger" data-action="discard">Discard &amp; Log Out</button>' +
      '  <button class="er365-hdr-btn er365-hdr-btn-primary" data-action="save">Save Draft &amp; Log Out</button>' +
      '</div>';

    function cleanup() { backdrop.remove(); dlg.remove(); }
    dlg.addEventListener('click', function (e) {
      var action = e.target && e.target.getAttribute('data-action');
      if (!action) return;
      cleanup();
      if (action === 'cancel') return;
      if (action === 'save') {
        var saveBtn =
          document.querySelector('button[value*="Save and Continue"]') ||
          document.querySelector('button[value*="Save and Close"]') ||
          document.querySelector('input[type=submit][value*="Save"]');
        if (saveBtn) { saveBtn.click(); setTimeout(performLogout, 800); }
        else { alert('Could not locate a Save button on this page. Please save manually, then log out.'); }
        return;
      }
      if (action === 'discard') performLogout();
    });
    backdrop.addEventListener('click', cleanup);
    document.body.appendChild(backdrop);
    document.body.appendChild(dlg);
  }

  function performLogout() {
    if (window.location.protocol === 'file:') {
      alert('Log Out (demo mode).\n\nIn Caspio production this would redirect to: ' + LOGOUT_URL);
      return;
    }
    window.location.href = LOGOUT_URL;
  }

  function applyGating(root) {
    var scope = root || document;
    var els = scope.querySelectorAll('[data-er365-roles]');
    els.forEach(function (el) {
      var required = normalizeRolesInput(el.getAttribute('data-er365-roles'));
      if (required.length === 0) return;
      if (!hasAnyRoleGlobal(required)) {
        el.style.display = 'none';
        el.setAttribute('data-er365-hidden', 'true');
      } else {
        if (el.getAttribute('data-er365-hidden') === 'true') {
          el.style.display = '';
          el.removeAttribute('data-er365-hidden');
        }
      }
    });
  }

  function watchDomForGating() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) applyGating(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function exposeGlobals() {
    var user = window.ER365_USER || {};
    // Support user.roles (CSV of access IDs) OR user.access (alias)
    var rolesInput = user.roles != null ? user.roles : (user.access != null ? user.access : user.role);
    var rolesArray = normalizeRolesInput(rolesInput);

    window.ER365 = window.ER365 || {};
    window.ER365.roles = rolesArray;
    window.ER365.role = user.role || '';  // singular role name
    window.ER365.access = rolesArray;      // alias
    window.ER365.hasRole = hasRoleGlobal;
    window.ER365.hasAnyRole = hasAnyRoleGlobal;
    window.ER365.gateElement = function (el, requiredRoles) {
      if (!el) return;
      var req = normalizeRolesInput(requiredRoles);
      if (req.length === 0) { el.style.display = ''; return; }
      el.style.display = hasAnyRoleGlobal(req) ? '' : 'none';
    };
    window.ER365.reapplyGating = function () { applyGating(document); };
    window.ER365.refreshActive = refreshActiveState;
  }

  // ---------------------------------------------------------
  // Boot
  // ---------------------------------------------------------

  function boot() {
    try { console.log('%c[ER365] boot() running, user:', 'color:#4A7EDE;font-weight:bold', window.ER365_USER); } catch(e){}
    if (document.querySelector('#er365-header')) return;
    injectStyles();
    exposeGlobals();
    applyGating(document);
    watchDomForGating();
    loadNavItems(function (items) {
      var root = document.querySelector('#er365-header-root');
      var header = buildHeader(items);
      if (root) root.parentNode.replaceChild(header, root);
      else document.body.insertBefore(header, document.body.firstChild);
      applyGating(document);
      window.addEventListener('hashchange', refreshActiveState);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
