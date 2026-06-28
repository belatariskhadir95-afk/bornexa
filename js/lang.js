(function () {
  var LANG_KEY = 'bornexa-lang';
  // Langue initiale : ?lang= dans l'URL  >  préférence stockée  >  langue déclarée <html lang>  >  NL.
  // CRITIQUE SEO : sans ceci, les pages FR (<html lang="fr">, ex. borne-recharge-*) rendaient
  // le NL pour Googlebot (qui n'a pas de localStorage) → contenu FR jamais indexé.
  function getInitialLang() {
    try {
      var p = new URLSearchParams(location.search).get('lang');
      if (p === 'fr' || p === 'nl') return p;
    } catch (e) {}
    var stored = localStorage.getItem(LANG_KEY);
    if (stored === 'fr' || stored === 'nl') return stored;
    var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    return htmlLang === 'fr' ? 'fr' : 'nl';
  }
  var lang = getInitialLang();

  function setEl(el, val) {
    if (val === undefined || val === null) return;
    var tag = el.tagName;
    // Form inputs/textareas: update placeholder attribute
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (el.hasAttribute('placeholder')) el.placeholder = val;
      return;
    }
    // Select options: update text
    if (tag === 'OPTION') { el.textContent = val; return; }
    // Elements containing SVG (e.g. "Lees artikel <svg>..."): update first text node only
    if (el.querySelector('svg')) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var node = el.childNodes[i];
        if (node.nodeType === 3 && node.textContent.trim()) {
          node.textContent = val;
          return;
        }
      }
    } else {
      // Use innerHTML to support <br> and HTML entities in translations
      el.innerHTML = val;
    }
  }

  function applyLang() {
    if (typeof translations === 'undefined') return;
    var d = translations[lang];
    if (!d) return;

    // Translate all elements with data-key
    document.querySelectorAll('[data-key]').forEach(function (el) {
      setEl(el, d[el.getAttribute('data-key')]);
    });

    // Nav links that don't carry data-key (hardcoded pages like index.html)
    var svc = document.querySelector('.nav-links a[href="services"]:not([data-key])');
    if (svc) svc.textContent = d.navServices;

    var cta = document.querySelector('.nav-links .nav-cta:not([data-key])');
    if (cta) cta.textContent = d.navQuote;

    var mSvc = document.querySelector('.nav-mobile a[href="services"]:not([data-key])');
    if (mSvc) mSvc.textContent = d.navServices;

    var mCta = document.querySelector('.nav-mobile a[href="devis"]:not([data-key])');
    if (mCta) mCta.textContent = d.navQuote;

    // Lang button label (desktop + mobile)
    var btn = document.getElementById('lang-btn');
    if (btn && !btn.hasAttribute('data-key')) btn.textContent = d.langSwitch;
    var btnM = document.getElementById('lang-btn-mobile');
    if (btnM && !btnM.hasAttribute('data-key')) btnM.textContent = d.langSwitch;

    document.documentElement.lang = lang;

    // Update <title> dynamically (data-nl / data-fr attributes on the <title> element)
    var titleEl = document.querySelector('title');
    if (titleEl) {
      if (!titleEl.getAttribute('data-nl')) {
        titleEl.setAttribute('data-nl', titleEl.textContent.trim());
      }
      var newTitle = titleEl.getAttribute('data-' + lang);
      if (newTitle) document.title = newTitle;
    }

    // Update <meta name="description"> dynamically
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      if (!metaDesc.getAttribute('data-nl')) {
        metaDesc.setAttribute('data-nl', metaDesc.getAttribute('content'));
      }
      var newDesc = metaDesc.getAttribute('data-' + lang);
      if (newDesc) metaDesc.setAttribute('content', newDesc);
    }

    // Update <meta property="og:locale">
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', lang === 'fr' ? 'fr_BE' : 'nl_BE');

    // Handle page-specific bilingual content via data-nl / data-fr attributes
    document.querySelectorAll('[data-nl],[data-fr]').forEach(function(el) {
      if (el.tagName === 'TITLE' || el.tagName === 'META') return;
      var val = el.getAttribute('data-' + lang);
      if (val !== null && val !== '') setEl(el, val);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    function toggleLang() {
      lang = lang === 'nl' ? 'fr' : 'nl';
      localStorage.setItem(LANG_KEY, lang);
      applyLang();
    }
    var btn = document.getElementById('lang-btn');
    if (btn) btn.addEventListener('click', toggleLang);
    var btnM = document.getElementById('lang-btn-mobile');
    if (btnM) btnM.addEventListener('click', toggleLang);
    applyLang();
  });
})();
