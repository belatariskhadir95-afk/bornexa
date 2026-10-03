/* BORNEXA — configurateur · récapitulatif du projet
   Affiché pendant la configuration (sur la scène / en puces sur mobile) et à l'écran final.
   Les valeurs affichées sont les libellés des cartes choisies (donc traduits par lang.js). */
import { CHOICE, V2H_SERVICE, COLLECTIVE } from './steps.js';
import { dict, fmt } from './i18n.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createSummary(root, form) {
  const aside = root.querySelector('#cfg-summary');
  const list = root.querySelector('#cfg-summary-list');
  const chips = root.querySelector('#cfg-chips');
  const recap = root.querySelector('#cfg-recap');
  const offer = root.querySelector('#cfg-offer');

  /* libellé de la carte cochée pour un champ radio */
  function label(name) {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    if (!el) return '';
    const t = el.closest('.option-card').querySelector('.opt-title');
    return t ? t.textContent.trim() : el.value;
  }

  function items(flow, a, lang) {
    const d = dict(lang), out = [];
    for (const step of flow) {
      const name = CHOICE[step];
      if (name && a[name]) out.push({ step, k: d.labels[name], v: label(name) });
      if (step === 'repair' && a.merk_borne) out.push({ step, k: d.labels.merk_borne, v: form.elements.merk_borne.selectedOptions[0].textContent.trim() });
      if (step === 'photos' && a.photos) out.push({ step, k: d.labels.photos, v: fmt(d.photos, { n: a.photos }) });
    }
    return out;
  }

  /* ce que BORNEXA propose, selon les réponses (formulations vérifiées, sans promesse technique) */
  function proposals(a, lang) {
    const o = dict(lang).offer, out = [];
    const path = a.Type_Aanvraag;
    if (path === 'Energiebeheer') out.push(o.energy, o.base);
    else if (path === 'Herstelling / depannage') out.push(o.repair);
    else if (path === 'Advies') out.push(o.advice);
    else {
      const s = a.Type_Service;
      out.push(s === V2H_SERVICE ? o.v2h : s === "Prise renforcee Green'Up" ? o.socket : s === 'Eigen borne plaatsen' ? o.own : s === 'Vervanging bestaande borne' ? o.replace : o.charger);
      if (s === V2H_SERVICE && a.Type_Installatie !== 'Eenfasig (1x230V)' && a.Type_Installatie !== 'Driefasig (3x400V)') out.push(o.v2hNet);
      else if (a.Type_Installatie === 'Driefasig zonder N (3x230V)') out.push(o.net230, o.netCheck);
      else if (a.Type_Installatie === 'Onbekend') out.push(o.netCheck);
      if (a.zonnepanelen === 'Ja') out.push(o.solar);
      else if (a.zonnepanelen === 'Gepland') out.push(o.solarPlanned);
      if (COLLECTIVE.test(a.Type_Project)) out.push(o.collective);
      out.push(o.base);
    }
    return out;
  }

  function render(flow, current, a, lang) {
    const d = dict(lang);
    const its = items(flow, a, lang);
    const row = (it) => `<li><span class="k">${esc(it.k)}</span><span class="v">${esc(it.v)}</span>` +
      `<button type="button" class="cfg-edit" data-goto="${it.step}" aria-label="${esc(d.edit)} : ${esc(it.k)}">${esc(d.edit)}</button></li>`;
    aside.hidden = current === 'intro' || current === 'success' || !its.length;
    list.innerHTML = its.map(row).join('');
    chips.innerHTML = its.map((it) => `<li>${esc(it.v)}</li>`).join('');
    if (current === 'ready') {
      recap.innerHTML = its.map(row).join('') || `<li class="is-empty">${esc(d.summaryEmpty)}</li>`;
      offer.innerHTML = proposals(a, lang).map((t) => `<li>${t}</li>`).join('');
    }
  }

  return { render };
}
