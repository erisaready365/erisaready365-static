/* ============================================================
   er365-nav-items.js
   ERISAReady365 header — nav configuration
   Version: 3.1 (2026-07-21)
   ------------------------------------------------------------
   CHANGES v3.1:
     - Added openIn field to avatar items:
         'modal'  — My Account, Security, Notifications (iframe overlay)
         'newtab' — SOC Academy, Tutorials, FAQs, all Support items
       (destinations are chromeless AppPages, no header injected)

   CHANGES v3.0:
     - Renamed Contribution/Distribution/Loan Management
       → Contribution/Distribution/Loan Reconciliation
       (fiduciary role is to reconcile after each pay period,
        upload documentation, attest — payroll systems do the
        actual money movement)
     - Distribution Reconciliation still contains QDRO + RMD
       sub-workflows as tabs (not separate nav items)
   ------------------------------------------------------------
   PURPOSE:  Pure data — the nav items and dispatch rules the
             header engine (er365-header.js) consumes.
   EDIT THIS FILE when: adding/removing/renaming nav items,
             changing URLs, adjusting dispatchByRole targets.
   DO NOT PUT rendering logic here. Keep this file dumb.
   ------------------------------------------------------------
   Consumed by: er365-header.js (loaded after this file)
   Exposes:     window.ER365_NAV = { items, avatar, dispatchByRole }
   ============================================================ */
(function () {
  var BASE = 'https://secure.erisaready365.com/erisa-ready-365/365-member/';

  // Plan-context nav — 10 parents, 44 children
  var NAV_ITEMS = [
    { id: 'home', label: 'Home', context: 'plan', dispatchByRole: true, order: 1 },

    { id: 'plan-dashboard', label: 'Plan Dashboard', url: BASE + 'plan-dashboard',
      context: 'plan', order: 2 },

    { id: 'my-work', label: 'My Work', context: 'plan', order: 3, children: [
      { id: 'my-tasks',      label: 'My Tasks',      url: BASE + 'my-tasks' },
      { id: 'my-training',   label: 'My Training',   url: BASE + 'my-training' },
      { id: 'my-documents',  label: 'My Documents',  url: BASE + 'my-documents' },
      { id: 'my-calendar',   label: 'My Calendar',   url: BASE + 'my-calendar' },
      { id: 'my-messages',   label: 'My Messages',   url: BASE + 'my-messages' }
    ]},

    { id: 'plan-profile', label: 'Plan Profile', context: 'plan', order: 4, children: [
      { id: 'plan-design',    label: 'Plan Design',    url: BASE + 'plan-design' },
      { id: 'plan-documents', label: 'Plan Documents', url: BASE + 'plan-documents' },
      { id: 'plan-reports',   label: 'Plan Reports',   url: BASE + 'plan-reports' }
    ]},

    { id: 'participant-management', label: 'Participant Management', context: 'plan', order: 5, children: [
      { id: 'participant-profiles',        label: 'Participant Profiles',        url: BASE + 'participant-profiles',        sensitive: true },
      { id: 'eligibility-monitoring',      label: 'Eligibility Monitoring',      url: BASE + 'eligibility-monitoring' },
      { id: 'participant-onboarding',      label: 'Participant Onboarding',      url: BASE + 'participant-onboarding' },
      { id: 'education-tracking',          label: 'Education Tracking',          url: BASE + 'education-tracking' },
      { id: 'contribution-reconciliation', label: 'Contribution Reconciliation', url: BASE + 'contribution-reconciliation', sensitive: true },
      // Distribution Reconciliation contains QDRO + RMD sub-workflows (not separate nav items)
      { id: 'distribution-reconciliation', label: 'Distribution Reconciliation', url: BASE + 'distribution-reconciliation', sensitive: true },
      { id: 'loan-reconciliation',         label: 'Loan Reconciliation',         url: BASE + 'loan-reconciliation',         sensitive: true }
    ]},

    { id: 'participant-communications', label: 'Participant Communications', context: 'plan', order: 6, children: [
      { id: 'participant-messaging',         label: 'Participant Messaging',                url: BASE + 'participant-messaging' },
      { id: 'participant-initial-notices',   label: 'Initial Notices / Tracking / Receipts',url: BASE + 'participant-initial-notices' },
      { id: 'participant-annual-notices',    label: 'Annual Notices / Tracking / Receipts', url: BASE + 'participant-annual-notices' },
      { id: 'participant-document-requests', label: 'Document Requests / Tracking / Receipts', url: BASE + 'participant-document-requests' },
      { id: 'participant-newsletters',       label: 'Participant Newsletters',              url: BASE + 'participant-newsletters' },
      { id: 'required-notices-templates',    label: 'Required Notices Templates',           url: BASE + 'required-notices-templates' },
      { id: 'participant-meeting-minutes',   label: 'Participant Meeting Minutes',          url: BASE + 'participant-meeting-minutes' }
    ]},

    { id: 'committees', label: 'Committees', context: 'plan', order: 7, children: [
      { id: 'committee-rosters',   label: 'Committee Rosters',   url: BASE + 'committee-rosters' },
      { id: 'committee-meetings',  label: 'Committee Meetings',  url: BASE + 'committee-meetings' },
      { id: 'committee-minutes',   label: 'Committee Minutes',   url: BASE + 'committee-minutes' },
      { id: 'committee-documents', label: 'Committee Documents', url: BASE + 'committee-documents' }
    ]},

    { id: 'compliance', label: 'Compliance', context: 'plan', order: 8, children: [
      { id: 'governance-calendar',           label: 'Governance Calendar',              url: BASE + 'governance-calendar' },
      { id: 'fiduciary-navigator',           label: 'Fiduciary Navigator',              url: BASE + 'fiduciary-navigator' },
      { id: 'plan-director',                 label: 'Plan Director',                    url: BASE + 'plan-director' },
      { id: 'fiduciary-analytics',           label: 'Fiduciary Analytics',              url: BASE + 'fiduciary-analytics' },
      { id: 'attestations-roster-org-chart', label: 'Attestations / Roster / Org Chart',url: BASE + 'attestations-roster-org-chart' },
      { id: 'training-management',           label: 'Fiduciary Training Management',    url: BASE + 'training-management' },
      { id: 'fiduciary-records',             label: 'Fiduciary Records',                url: BASE + 'fiduciary-records' }
    ]},

    { id: 'providers', label: 'Providers', context: 'plan', order: 9, children: [
      { id: 'service-providers',        label: 'Service Providers',        url: BASE + 'service-providers' },
      { id: 'provider-contacts',        label: 'Provider Contacts',        url: BASE + 'provider-contacts' },
      { id: 'provider-scorecards',      label: 'Provider Scorecards',      url: BASE + 'provider-scorecards' },
      { id: 'provider-meeting-minutes', label: 'Provider Meeting Minutes', url: BASE + 'provider-meeting-minutes' },
      { id: 'requests-for-proposals',   label: 'Requests for Proposals',   url: BASE + 'requests-for-proposals' }
    ]},

    { id: 'plan-admin', label: 'Plan Admin', context: 'plan', dispatchByRole: true, order: 10, children: [
      { id: 'sponsor-profile',   label: 'Sponsor Profile',   url: BASE + 'sponsor-profile' },
      { id: 'member-management', label: 'Member Management', url: BASE + 'member-management' },
      { id: 'roles-access',      label: 'Roles & Access',    url: BASE + 'roles-access' }
    ]}
  ];

  // Avatar dropdown — plan-agnostic, same for every user
  // openIn: 'modal' launches an iframe overlay on top of current page
  // openIn: 'newtab' calls window.open(url, '_blank')
  // openIn absent (or 'same') = normal in-page navigation
  var AVATAR_MENU = [
    { section: 'My Account', items: [
      { id: 'my-account',    label: 'My Account',    url: BASE + 'my-account',    openIn: 'modal' },
      { id: 'security',      label: 'Security',      url: BASE + 'security',      openIn: 'modal' },
      { id: 'notifications', label: 'Notifications', url: BASE + 'notifications', openIn: 'modal', badge: 'red-dot-on-urgent' }
    ]},
    { section: 'Learning Center', items: [
      { id: 'standards-of-care-soc-academy', label: 'Standards of Care (SOC) Academy', url: BASE + 'standards-of-care-soc-academy', openIn: 'newtab' },
      { id: 'erisa365-tutorials',            label: 'ERISA365 Tutorials',              url: BASE + 'erisa365-tutorials',            openIn: 'newtab' },
      { id: 'faqs',                          label: 'FAQs',                            url: BASE + 'faqs',                          openIn: 'newtab' }
    ]},
    { section: 'Support', items: [
      { id: 'support-tickets',  label: 'Support Tickets',  url: BASE + 'support-tickets',  openIn: 'newtab' },
      { id: 'contact-support',  label: 'Contact Support',  url: BASE + 'contact-support',  openIn: 'newtab' },
      { id: 'community-forum',  label: 'Community Forum',  url: BASE + 'community-forum',  openIn: 'newtab' },
      { id: 'feature-requests', label: 'Feature Requests', url: BASE + 'feature-requests', openIn: 'newtab' }
    ]}
  ];

  // dispatchByRole — Home button + Plan Admin resolve to different URLs by role
  function dispatchByRole(itemId, userRole, userAccess) {
    var isSuperuser = /(^|,)\s*999\s*(,|$)/.test(userAccess || '');

    if (itemId === 'home') {
      if (isSuperuser)                       return BASE + 'home-365-admin';
      if (userRole === '365 Admin')          return BASE + 'home-365-admin';
      if (userRole === '365 Support')        return BASE + 'home-365-support';
      if (userRole === 'Consultant Manager') return BASE + 'home-consultant-manager';
      if (userRole === 'Consultant')         return BASE + 'home-consultant';
      if (userRole === 'Auditor')            return BASE + 'home-auditor';
      if (userRole === 'Plan Sponsor Admin') return BASE + 'home-plan-sponsor-admin';
      if (userRole === 'Plan Sponsor User')  return BASE + 'home-plan-sponsor';
      return 'https://erisaready365.com/contact-support';
    }

    if (itemId === 'plan-admin') {
      if (isSuperuser)                       return BASE + 'plan-admin-365';
      if (userRole === '365 Admin')          return BASE + 'plan-admin-365';
      if (userRole === '365 Support')        return BASE + 'plan-admin-support';
      if (userRole === 'Consultant Manager') return BASE + 'plan-admin-firm';
      if (userRole === 'Consultant')         return BASE + 'plan-admin-consultant';
      if (userRole === 'Plan Sponsor Admin') return BASE + 'plan-admin-sponsor';
      return null;  // Auditor + PSU do not see Plan Admin; upstream filter should hide it
    }

    return null;
  }

  // Expose to global for er365-header.js to consume
  window.ER365_NAV = {
    version: '3.1',
    base: BASE,
    items: NAV_ITEMS,
    avatar: AVATAR_MENU,
    dispatchByRole: dispatchByRole
  };
})();
