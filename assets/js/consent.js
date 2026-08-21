/* ============================================================================
   THE LOOKING GLASS WARS — Consent banner (Google Consent Mode v2)
   Self-contained. No dependencies. Injects its own styles + markup.

   The consent DEFAULTS live inline in each page's <head>, above the GTM
   loader — they must execute before GTM does. This file only handles the UI
   and the consent 'update' signal.

   Storage key: lgw-consent  ->  "granted" | "denied"
   Reopen the banner from anywhere with:  window.lgwConsent.open()
   ========================================================================== */
(function () {
  var KEY = 'lgw-consent';
  var SIGNALS = ['ad_storage', 'ad_user_data', 'ad_personalization',
                 'analytics_storage', 'functionality_storage', 'personalization_storage'];

  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function read()   { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  function update(state) {
    var payload = {};
    for (var i = 0; i < SIGNALS.length; i++) payload[SIGNALS[i]] = state;
    window.dataLayer = window.dataLayer || [];
    // gtag() is defined by the inline head snippet; fall back to a raw push.
    if (typeof window.gtag === 'function') window.gtag('consent', 'update', payload);
    else window.dataLayer.push(['consent', 'update', payload]);
    window.dataLayer.push({ event: 'consent_' + state });
  }

  var STYLES = '' +
    '.lgw-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'display:flex;gap:22px;align-items:center;justify-content:center;flex-wrap:wrap;' +
      'padding:18px clamp(20px,5vw,48px);' +
      'background:rgba(8,7,10,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);' +
      'border-top:1px solid rgba(201,162,75,.28);' +
      'font-family:Inter,system-ui,-apple-system,sans-serif;font-weight:300;' +
      'color:#b9b2a8;font-size:13px;line-height:1.55;' +
      'transform:translateY(100%);transition:transform .5s cubic-bezier(.16,1,.3,1)}' +
    '.lgw-consent.is-in{transform:translateY(0)}' +
    '.lgw-consent p{margin:0;max-width:60ch}' +
    '.lgw-consent a{color:#c9a24b;text-decoration:none;border-bottom:1px solid rgba(201,162,75,.35)}' +
    '.lgw-consent a:hover{color:#f4f0ea}' +
    '.lgw-consent-actions{display:flex;gap:10px;flex-shrink:0}' +
    '.lgw-consent button{font-family:inherit;font-size:11px;letter-spacing:.14em;text-transform:uppercase;' +
      'padding:11px 20px;border-radius:2px;cursor:pointer;transition:all .3s ease;white-space:nowrap}' +
    '.lgw-consent .lgw-deny{background:transparent;border:1px solid rgba(244,240,234,.22);color:#b9b2a8}' +
    '.lgw-consent .lgw-deny:hover{border-color:rgba(244,240,234,.5);color:#f4f0ea}' +
    '.lgw-consent .lgw-allow{background:#c9a24b;border:1px solid #c9a24b;color:#08070a;font-weight:500}' +
    '.lgw-consent .lgw-allow:hover{background:#dcb75e;border-color:#dcb75e}' +
    '@media (max-width:640px){.lgw-consent{gap:14px;justify-content:flex-start}' +
      '.lgw-consent-actions{width:100%}.lgw-consent button{flex:1}}' +
    '@media (prefers-reduced-motion:reduce){.lgw-consent{transition:none}}';

  var el = null;

  function close() {
    if (!el) return;
    el.classList.remove('is-in');
    var node = el; el = null;
    setTimeout(function () { if (node && node.parentNode) node.parentNode.removeChild(node); }, 500);
  }

  function open() {
    if (el) return;

    if (!document.getElementById('lgw-consent-styles')) {
      var s = document.createElement('style');
      s.id = 'lgw-consent-styles';
      s.textContent = STYLES;
      document.head.appendChild(s);
    }

    el = document.createElement('aside');
    el.className = 'lgw-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<p>We use cookies to understand how visitors explore Wonderland. ' +
      'Analytics stay off until you allow them.</p>' +
      '<div class="lgw-consent-actions">' +
        '<button type="button" class="lgw-deny">Decline</button>' +
        '<button type="button" class="lgw-allow">Allow</button>' +
      '</div>';

    el.querySelector('.lgw-allow').addEventListener('click', function () {
      store('granted'); update('granted'); close();
    });
    el.querySelector('.lgw-deny').addEventListener('click', function () {
      store('denied'); update('denied'); close();
    });

    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { if (el) el.classList.add('is-in'); });
    });
  }

  window.lgwConsent = {
    open: open,
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} open(); },
    state: read
  };

  // Only prompt when no choice has been recorded yet.
  function init() { if (!read()) open(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
