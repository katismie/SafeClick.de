/* Only explicit marketing opt-in may load Meta. No pre-consent events are buffered. */
(() => {
  'use strict';
  const pixelId = '1686772673495132';
  const enabled = document.documentElement.dataset.metaPixel === 'enabled';
  let script = null;
  let initialized = false;
  let pageViewSent = false;
  let allowed = false;
  const readConsentCookie = () => String(document.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('CookieConsent=')) || '';
  let consentCookie = readConsentCookie();

  function hasMarketingConsent() {
    const cmp = window.Cookiebot;
    return Boolean(cmp && cmp.hasResponse === true &&
      cmp.consent && cmp.consent.method === 'explicit' && cmp.consent.marketing === true);
  }

  function clearMetaCookies() {
    // Remove known first-party Meta identifiers, including parent-path variants.
    const host = location.hostname;
    const paths = new Set(['/']);
    const parts = location.pathname.split('/').filter(Boolean);
    let path = '';
    for (const part of parts) {
      path += '/' + part;
      paths.add(path);
      paths.add(path + '/');
    }
    for (const name of ['_fbp', '_fbc']) {
      for (const cookiePath of paths) {
        const expired = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + cookiePath + '; SameSite=Lax';
        document.cookie = expired;
        document.cookie = expired + '; domain=' + host;
        document.cookie = expired + '; domain=.' + host;
      }
    }
  }

  function stopMeta() {
    allowed = false;
    if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
    clearMetaCookies();
    if (script) {
      // Removing a tag alone cannot unload code already running. Reload after
      // revocation so the next document never loads Meta without fresh consent.
      script.onload = null;
      script.remove();
      script = null;
      location.reload();
    }
  }

  function startMeta() {
    if (!enabled || script || !hasMarketingConsent()) return;
    if (window.fbq) return; // Do not cooperate with a second, unmanaged pixel.
    const fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = window._fbq = fbq;
    fbq('consent', 'revoke');
    fbq('set', 'autoConfig', false, pixelId);
    const tag = document.createElement('script');
    tag.async = true;
    tag.setAttribute('data-cookieconsent', 'marketing');
    tag.src = 'https://connect.facebook.net/en_US/fbevents.js';
    tag.onload = () => {
      if (!allowed || !hasMarketingConsent() || readConsentCookie() !== consentCookie) { stopMeta(); return; }
      fbq('init', pixelId);
      fbq('consent', 'grant');
      initialized = true;
      if (!pageViewSent) {
        pageViewSent = true;
        fbq('trackSingle', pixelId, 'PageView');
      }
    };
    tag.onerror = () => {
      // Leave measurement off after a failed/blocked SDK download.
      initialized = false;
    };
    script = tag;
    document.head.append(tag);
  }

  function syncConsent() {
    consentCookie = readConsentCookie();
    allowed = hasMarketingConsent();
    if (allowed) startMeta();
    else if (script || initialized || (window.Cookiebot && window.Cookiebot.hasResponse)) stopMeta();
  }
  for (const event of ['CookiebotOnConsentReady', 'CookiebotOnAccept', 'CookiebotOnDecline']) {
    window.addEventListener(event, syncConsent);
  }
  // Recheck the consent cookie as well as the CMP state on returning.
  function recheckConsent() {
    if (script && readConsentCookie() !== consentCookie) { stopMeta(); return; }
    syncConsent();
  }
  window.addEventListener('pageshow', recheckConsent);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recheckConsent(); });
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const action = target && target.closest('[data-cookie-action]');
    if (action) {
      event.preventDefault();
      const cmp = window.Cookiebot;
      const feedback = document.querySelector('[data-cookie-feedback]');
      if (!cmp || typeof cmp.renew !== 'function' || typeof cmp.withdraw !== 'function') {
        if (feedback) feedback.textContent = 'Cookie-Einstellungen sind gerade nicht verfügbar. Bitte laden Sie die Seite erneut. Marketing bleibt ohne Einwilligung deaktiviert.';
        return;
      }
      if (action.dataset.cookieAction === 'withdraw') {
        cmp.withdraw();
        stopMeta();
        if (feedback) feedback.textContent = 'Ihre Einwilligung wurde widerrufen.';
      } else cmp.renew();
      return;
    }
    if (target && target.closest('[data-meta-event="mehr-erfahren"]') && enabled && initialized) {
      // Recheck on every activation; events before opt-in/load are discarded.
      if (!hasMarketingConsent() || readConsentCookie() !== consentCookie) { stopMeta(); return; }
      window.fbq('trackSingleCustom', pixelId, 'MehrErfahrenClick');
    }
  });
  syncConsent();
})();
