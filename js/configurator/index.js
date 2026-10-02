/* BORNEXA — configurateur de projet (demande de devis)
   « Construisez votre projet de recharge » : chaque réponse construit la scène.
   Le formulaire reste le formulaire Netlify « devis » (mêmes champs) ; ce module ne fait
   que la navigation, l'affichage et l'animation. Sans JS : toutes les étapes s'affichent. */
import { DEFAULT_PATH, CHOICE, OPTIONAL, COLLECTIVE, flowFor, answers, value } from './steps.js';
import { detectLang, dict, fmt } from './i18n.js';
import { createScene, deriveScene } from './scene.js';
import { createProgress } from './progress.js';
import { createSummary } from './summary.js';
import { wireSubmit, fallbackScreen } from './submit.js';
import * as store from './store.js';
import { createAnalytics } from './analytics.js';

const root = document.querySelector('[data-cfg]');
if (root) boot(root);

function boot(root) {
  const form = root.querySelector('#devis-form');
  const intro = root.querySelector('#cfg-intro');
  const success = root.querySelector('#success-screen');
  const live = root.querySelector('#cfg-live');
  const stepEls = {};
  for (const el of root.querySelectorAll('.cfg-step')) stepEls[el.dataset.step] = el;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lang = detectLang();
  let flow = flowFor(value(form, 'Type_Aanvraag') || DEFAULT_PATH);
  let current = 'intro';
  let advanceTimer = 0, pointerAt = 0;

  form.noValidate = true;                     // messages d'erreur gérés par submit.js
  form.elements.lang.value = lang;

  const scene = createScene(root.querySelector('.cf-stage'), { reduced });
  const progress = createProgress(root);
  const summary = createSummary(root, form);
  const ga = createAnalytics();

  /* ── rendu d'une étape ── */
  function render({ instant = false } = {}) {
    const a = answers(form);
    for (const [key, el] of Object.entries(stepEls)) el.classList.toggle('is-active', key === current);
    intro.hidden = current !== 'intro';
    progress.render(flow, current, stepEls, lang);
    summary.render(flow, current, a, lang);
    scene.apply(deriveScene(a, current, flow), { instant });
    updateNext();
    if (current === 'contact') root.querySelector('#copro-extra').hidden = !COLLECTIVE.test(a.Type_Project);
    relabelPhotos(a.Type_Aanvraag);
  }

  function go(key, { instant = false, focus = true } = {}) {
    clearTimeout(advanceTimer);
    current = key;
    render({ instant });
    if (key !== 'intro' && key !== 'success') store.save(form, key);
    ga.step(key, flow.indexOf(key), flow.length, value(form, 'Type_Aanvraag') || DEFAULT_PATH);
    if (instant) return;
    reveal();
    const h = key === 'intro' ? null : stepEls[key] && stepEls[key].querySelector('h2');
    if (h && focus) h.focus({ preventScroll: true });
    if (h) live.textContent = fmt(dict(lang).live, { n: flow.indexOf(key) + 1, total: flow.length, title: h.textContent.trim() });
  }

  /* garde la scène et la question en vue (sans détourner le scroll) */
  function reveal() {
    const narrow = window.matchMedia('(max-width: 999px)').matches;
    const target = narrow ? root : root.querySelector('.cfg-panel');
    const r = target.getBoundingClientRect();
    if (narrow || r.top < 0 || r.top > window.innerHeight * 0.4) {
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }

  const answered = (key) => {
    const name = CHOICE[key];
    return !name || OPTIONAL.has(key) || !!value(form, name);
  };
  function updateNext() {
    const el = stepEls[current];
    const btn = el && el.querySelector('.cfg-next');
    if (btn) btn.disabled = !answered(current);
  }

  function next() {
    if (current === 'intro') return go(flow[0]);
    if (!answered(current)) return;
    const i = flow.indexOf(current);
    if (i < flow.length - 1) go(flow[i + 1]);
  }
  function back() {
    const i = flow.indexOf(current);
    go(i > 0 ? flow[i - 1] : 'intro');
  }

  /* ── réponses ── */
  function onAnswer(input) {
    if (input.name === 'Type_Aanvraag') flow = flowFor(input.value);
    ga.answer(input.name, input.value);
    render();
    store.save(form, current);
  }

  form.addEventListener('pointerdown', (e) => { if (e.target.closest('.option-card')) pointerAt = performance.now(); });
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'radio') onAnswer(t);
    else if (t.type === 'file') onFile(t);
    else if (t.tagName === 'SELECT') store.save(form, current);
  });
  // au clic / toucher sur une carte : on avance tout seul (les flèches du clavier ne font que choisir)
  form.addEventListener('click', (e) => {
    const t = e.target;
    if (t.type !== 'radio' || performance.now() - pointerAt > 800) return;
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(next, reduced ? 150 : 520);
  });
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const t = e.target;
    if (t.type === 'radio') {
      e.preventDefault();
      if (!t.checked) { t.checked = true; onAnswer(t); }
      next();
    } else if (t.tagName === 'INPUT' && t.type !== 'submit' && current !== 'contact') {
      e.preventDefault();
      next();
    }
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('cfg-next') && b.type === 'button') { e.preventDefault(); next(); }
    else if (b.classList.contains('cfg-back')) { e.preventDefault(); back(); }
    else if (b.id === 'cfg-start') { e.preventDefault(); go(flow[0]); }
    else if (b.dataset.goto && stepEls[b.dataset.goto]) { e.preventDefault(); go(b.dataset.goto); }
  });
  form.addEventListener('input', (e) => { if (e.target.tagName === 'TEXTAREA') store.save(form, current); });

  /* ── photos ── */
  function onFile(input) {
    const zone = input.closest('.upload-zone');
    const f = input.files && input.files[0];
    zone.classList.toggle('filled', !!f);
    zone.querySelector('.uz-status').textContent = f ? '✓ ' + (f.name.length > 28 ? f.name.slice(0, 26) + '…' : f.name) : '';
    const badge = zone.querySelector('.uz-badge');
    if (f) badge.textContent = dict(lang).added;
    render();
  }
  // en « slim energiebeheer », la 3e photo devient l'onduleur / les panneaux
  function relabelPhotos(path) {
    const l = root.querySelector('#uz-l3'), s = root.querySelector('#uz-s3');
    const energy = path === 'Energiebeheer';
    const L = energy ? ['Omvormer / zonnepanelen', 'Onduleur / panneaux'] : ['Locatie laadpaal', 'Emplacement de la borne'];
    const S = energy ? ['Indien aanwezig (optioneel)', 'Si présent (optionnel)'] : ['Garage, oprit of gevel', 'Garage, allée ou façade'];
    if (l.dataset.nl !== L[0]) {
      l.dataset.nl = L[0]; l.dataset.fr = L[1]; s.dataset.nl = S[0]; s.dataset.fr = S[1];
      l.textContent = lang === 'fr' ? L[1] : L[0]; s.textContent = lang === 'fr' ? S[1] : S[0];
    }
  }

  /* ── envoi ── */
  wireSubmit(form, {
    lang: () => lang,
    flow: () => flow,
    onSuccess() {
      ga.submitted();
      store.clear();
      form.hidden = true;
      root.querySelector('#cfg-progress').hidden = true;
      success.hidden = false;
      current = 'success';
      scene.apply(deriveScene(answers(form), 'success', flow));
      root.querySelector('#cfg-summary').hidden = true;
      success.querySelector('h2').focus({ preventScroll: true });
      reveal();
    },
    onFallback(d) {
      form.hidden = true;
      root.querySelector('#cfg-progress').hidden = true;
      const el = fallbackScreen(d);
      form.after(el);
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
  });

  /* ── langue : lang.js traduit les textes statiques, on recompose le reste ── */
  new MutationObserver(() => {
    const l = document.documentElement.lang === 'fr' ? 'fr' : 'nl';
    if (l === lang) return;
    lang = l; form.elements.lang.value = lang;
    render({ instant: true });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  /* ── redimensionnement ── */
  const onResize = () => { scene.measure(); };
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(root.querySelector('.cfg-visual'));
  else window.addEventListener('resize', onResize);

  /* ── reprise après rafraîchissement ── */
  const saved = store.restore(form);
  flow = flowFor(value(form, 'Type_Aanvraag') || DEFAULT_PATH);
  if (saved && (saved === 'success' || !stepEls[saved] || !flow.includes(saved))) current = 'intro';
  else if (saved) current = saved;
  for (const input of form.querySelectorAll('input[type="file"]')) if (input.files && input.files.length) onFile(input);
  render({ instant: true });
  document.documentElement.classList.add('cfg-ready');
}
