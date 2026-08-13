/* ===========================
   BORNEXA – main.js
   Minimal vanilla JS, no frameworks
   =========================== */

(function () {
  'use strict';

  /* ── Scroll nav ── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile menu ── */
  const toggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('nav-mobile');
  if (toggle && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.remove('open');
      toggle.classList.remove('open');
      document.body.classList.remove('nav-lock');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menu openen');
    };
    toggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      toggle.classList.toggle('open', open);          // anime le hamburger en croix
      document.body.classList.toggle('nav-lock', open); // scroll-lock
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    // Fermeture au clic extérieur + touche Échap
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('open') && !e.target.closest('#nav')) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-q, .faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling || (btn.parentElement && btn.parentElement.nextElementSibling);
      const isOpen = btn.classList.contains('active');
      document.querySelectorAll('.faq-q, .faq-question').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-expanded', 'false');
        const a = b.nextElementSibling || (b.parentElement && b.parentElement.nextElementSibling);
        if (a) a.classList.remove('open');
      });
      if (!isOpen && answer) {
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        answer.classList.add('open');
      }
    });
  });

  /* ── Reveal on scroll ── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ── Counter animation ── */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target || el.textContent);
    const lang = document.documentElement.lang || 'nl';
    const suffix = (lang === 'fr' && el.dataset.suffixFr) ? el.dataset.suffixFr : (el.dataset.suffix || '');
    const duration = 1400;
    const start = performance.now();
    const isFloat = target % 1 !== 0;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = (isFloat ? value.toFixed(1) : Math.round(value)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counterEls = document.querySelectorAll('[data-counter]');
  if (counterEls.length) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          counterIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => counterIO.observe(el));
  }

  /* ── Mobile sticky CTA ── */
  (function () {
    const t = {
      nl: { quote: 'Offerte', call: 'Bellen' },
      fr: { quote: 'Devis', call: 'Appeler' }
    };
    let lang = localStorage.getItem('bornexa-lang') || 'nl';

    const cta = document.createElement('div');
    cta.className = 'mobile-cta';
    cta.id = 'mobile-cta';
    cta.setAttribute('aria-label', 'Snelle acties');
    cta.innerHTML =
      '<a href="devis" class="mcta-btn mcta-quote">' +
        '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>' +
        '<span class="mcta-quote-lbl">' + t[lang].quote + '</span>' +
      '</a>' +
      '<a href="tel:+32489247760" class="mcta-btn mcta-phone">' +
        '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>' +
        '<span class="mcta-call-lbl">' + t[lang].call + '</span>' +
      '</a>' +
      '<a href="https://wa.me/32489247760" class="mcta-btn mcta-whatsapp" target="_blank" rel="noopener noreferrer">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
        '<span>WhatsApp</span>' +
      '</a>';

    document.body.appendChild(cta);

    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'lang') {
          lang = document.documentElement.lang || 'nl';
          const ql = cta.querySelector('.mcta-quote-lbl');
          const cl = cta.querySelector('.mcta-call-lbl');
          if (ql) ql.textContent = t[lang].quote;
          if (cl) cl.textContent = t[lang].call;
        }
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  })();

  /* ── Google Analytics 4 + bannière de consentement RGPD (load-on-consent) ──
     ⚠️ ÉTAPE REQUISE : remplacer 'G-XXXXXXXXXX' par le vrai ID GA4 (Admin → Flux de données).
     Tant que l'ID reste le placeholder, AUCUN script ne se charge et AUCUNE bannière ne s'affiche.
     Aucune donnée n'est collectée avant le clic « Accepter » (conforme RGPD/Belgique). */
  (function () {
    var GA_ID = 'G-RVC22RR3N9'; // ID GA4 BORNEXA
    if (GA_ID === 'G-XXXXXXXXXX' || !/^G-[A-Z0-9]{4,}$/.test(GA_ID)) return; // pas configuré → ne rien faire
    var KEY = 'bornexa-consent'; // 'granted' | 'denied'

    function loadGA() {
      if (window.__gaLoaded) return;
      window.__gaLoaded = true;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, { anonymize_ip: true });
    }

    var consent = localStorage.getItem(KEY);
    if (consent === 'granted') { loadGA(); return; }
    if (consent === 'denied') { return; }

    var lang = document.documentElement.lang || localStorage.getItem('bornexa-lang') || 'nl';
    var T = {
      nl: { msg: 'We gebruiken anonieme statistieken (Google Analytics) om de site te verbeteren.', ok: 'Akkoord', no: 'Weigeren', link: 'Privacy' },
      fr: { msg: 'Nous utilisons des statistiques anonymes (Google Analytics) pour améliorer le site.', ok: 'Accepter', no: 'Refuser', link: 'Confidentialité' }
    };
    var l = T[lang] || T.nl;

    var bar = document.createElement('div');
    bar.id = 'consent-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', l.msg);
    var bottomPx = (window.innerWidth < 768) ? '88px' : '14px'; // ne pas masquer le sticky CTA mobile
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:' + bottomPx + ';z-index:9999;max-width:760px;margin:0 auto;background:#0B1E3C;color:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.3);display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:.88rem;line-height:1.45';
    bar.innerHTML = '<span style="flex:1;min-width:200px">' + l.msg + ' <a href="privacy" style="color:#1ADBA8;text-decoration:underline">' + l.link + '</a></span>';

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;flex-shrink:0';
    var no = document.createElement('button');
    no.type = 'button'; no.textContent = l.no;
    no.style.cssText = 'background:transparent;border:1px solid rgba(255,255,255,.3);color:#fff;padding:9px 14px;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit';
    var ok = document.createElement('button');
    ok.type = 'button'; ok.textContent = l.ok;
    ok.style.cssText = 'background:#00C896;border:none;color:#0B1E3C;padding:9px 16px;border-radius:8px;font-weight:800;cursor:pointer;font-family:inherit';
    no.addEventListener('click', function () { localStorage.setItem(KEY, 'denied'); bar.remove(); });
    ok.addEventListener('click', function () { localStorage.setItem(KEY, 'granted'); bar.remove(); loadGA(); });
    btns.appendChild(no); btns.appendChild(ok); bar.appendChild(btns);
    document.body.appendChild(bar);
  })();

})();


/* ── Bascule de thème clair/foncé (redesign 2026-08) ──
   Suit l'OS par défaut ; le bouton force et mémorise le choix.
   Injecté dans chaque .nav-inner : aucune modification des pages. */
;(function () {
  var root = document.documentElement;
  try { var saved = localStorage.getItem('bx-theme'); if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved); } catch (e) {}
  function eff() { return root.getAttribute('data-theme') || (window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); }
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"/></svg>';
  function icon() { return eff() === 'dark' ? SUN : MOON; }
  function build() {
    var bars = document.querySelectorAll('.nav-inner');
    for (var i = 0; i < bars.length; i++) {
      var nav = bars[i];
      if (nav.querySelector('.theme-btn')) continue;
      var b = document.createElement('button');
      b.className = 'theme-btn'; b.type = 'button';
      b.setAttribute('aria-label', 'Wissel thema / Changer de thème');
      b.innerHTML = icon();
      b.addEventListener('click', function () {
        var t = eff() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', t);
        try { localStorage.setItem('bx-theme', t); } catch (e) {}
        var all = document.querySelectorAll('.theme-btn');
        for (var k = 0; k < all.length; k++) all[k].innerHTML = t === 'dark' ? SUN : MOON;
      });
      var lang = nav.querySelector('.btn-lang');
      var toggle = nav.querySelector('.nav-toggle');
      if (lang && lang.parentNode) lang.parentNode.insertBefore(b, lang);
      else if (toggle && toggle.parentNode) toggle.parentNode.insertBefore(b, toggle);
      else nav.appendChild(b);
    }
  }
  if (document.readyState !== 'loading') build();
  else document.addEventListener('DOMContentLoaded', build);
})();


/* ── Hero : champ d'énergie animé (homepage uniquement) ── */
;(function () {
  var c = document.getElementById('hero-field');
  if (!c) return;
  var hero = c.closest('.hero'), glow = document.getElementById('hero-glow');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var x = c.getContext('2d'), w, h, dpr, parts = [], mx = -999, my = -999, raf;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(110, w / 12)); parts = [];
    for (var i = 0; i < n; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, vx: (-0.12 - Math.random() * 0.45), vy: (Math.random() - 0.5) * 0.22, r: Math.random() * 1.6 + 0.5 });
  }
  function draw() {
    x.clearRect(0, 0, w, h);
    for (var i = 0; i < parts.length; i++) {
      var a = parts[i];
      for (var j = i + 1; j < parts.length; j++) {
        var b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
        if (d < 14000) { x.strokeStyle = 'rgba(70,236,190,' + (0.13 * (1 - d / 14000)) + ')'; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
      }
    }
    for (var k = 0; k < parts.length; k++) {
      var p = parts[k];
      if (mx > -900) { var ex = p.x - mx, ey = p.y - my, ed = Math.sqrt(ex * ex + ey * ey); if (ed < 120) { var f = (120 - ed) / 120 * 1.3; p.x += ex / ed * f; p.y += ey / ed * f; } }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = w + 20; if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fillStyle = 'rgba(100,236,192,.9)'; x.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  size();
  window.addEventListener('resize', size);
  if (reduce) { draw(); cancelAnimationFrame(raf); } else { draw(); }
  if (!reduce && hero) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
      if (glow) { glow.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; glow.style.opacity = '1'; }
    });
    hero.addEventListener('pointerleave', function () { mx = -999; my = -999; if (glow) glow.style.opacity = '0'; });
  }
})();
