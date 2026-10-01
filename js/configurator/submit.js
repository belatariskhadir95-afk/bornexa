/* BORNEXA — configurateur · envoi de la demande
   Identique à l'ancien formulaire : Netlify Forms (→ Make → Notion), notification EmailJS,
   conversions GA4, et repli « contact direct » si rien ne répond en 10 s (jamais de faux succès). */
import { clearOutside, emailParams, invalidContact } from './steps.js';
import { dict } from './i18n.js';

export function wireSubmit(form, ctx) {
  const btn = form.querySelector('#btn-submit');
  let sending = false, leadTracked = false;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (sending) return;
    const lang = ctx.lang(), d = dict(lang);

    // validation des champs obligatoires (messages en ligne, focus sur le premier)
    const bad = invalidContact(form);
    for (const n of ['naam', 'telefoon', 'email']) {
      const el = form.elements[n];
      const ko = bad.includes(el);
      el.closest('.float-g').classList.toggle('is-invalid', ko);
      el.setAttribute('aria-invalid', ko ? 'true' : 'false');
    }
    if (bad.length) { bad[0].focus(); return; }

    sending = true;
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.textContent = d.sending;
    clearOutside(form, ctx.flow());
    form.elements.lang.value = lang;
    const params = emailParams(form, lang, d);

    let done = false;
    const finish = () => { if (done) return; done = true; ctx.onSuccess(); track(); };
    const fallback = () => {
      if (done) return; done = true;
      try { localStorage.setItem('bornexa-devis-retry', JSON.stringify(params)); } catch (err) { /* rien */ }
      sending = false; btn.disabled = false; btn.innerHTML = label;
      ctx.onFallback(d);
    };
    const safety = setTimeout(fallback, 10000);

    // notification e-mail (EmailJS) — au mieux, ne bloque jamais l'envoi
    try {
      if (window.emailjs && typeof window.emailjs.send === 'function') {
        window.emailjs.send('service_jnr5z6q', lang === 'fr' ? 'template_8dpqasa' : 'template_trlr0zo', params, { publicKey: 'PIcG3UIV6sB7i2kl2' }).catch(() => {});
      }
    } catch (err) { /* rien */ }

    // enregistrement du lead (Netlify Forms) + confirmation
    fetch('/', { method: 'POST', body: new FormData(form) })
      .then((r) => { clearTimeout(safety); (r && r.ok) ? finish() : fallback(); })
      .catch(() => { clearTimeout(safety); fallback(); });
  });

  // les messages d'erreur disparaissent dès que le champ est corrigé
  form.addEventListener('input', (e) => {
    const g = e.target.closest && e.target.closest('.float-g.is-invalid');
    if (g && e.target.checkValidity()) { g.classList.remove('is-invalid'); e.target.setAttribute('aria-invalid', 'false'); }
  });

  // Conversion : événements GA4 importés dans Google Ads (mêmes noms qu'avant)
  function track() {
    if (leadTracked || typeof window.gtag !== 'function') return;
    leadTracked = true;
    window.gtag('event', 'generate_lead', { currency: 'EUR', value: 1 });
    window.gtag('event', 'SUBMIT_LEAD_FORM', { currency: 'EUR', value: 1 });
  }
}

/* écran de repli : contact direct (téléphone / WhatsApp) */
export function fallbackScreen(d) {
  const el = document.createElement('div');
  el.className = 'cfg-fallback';
  el.innerHTML = `<h3>${d.fallbackTitle}</h3><p>${d.fallbackMsg}</p>` +
    '<div class="cfg-fallback-btns"><a href="tel:+32489247760" class="cfg-next">☎ +32 489 24 77 60</a>' +
    '<a href="https://wa.me/32489247760" target="_blank" rel="noopener noreferrer" class="cfg-wa">WhatsApp</a></div>';
  return el;
}
