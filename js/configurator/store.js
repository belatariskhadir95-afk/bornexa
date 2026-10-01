/* BORNEXA — configurateur · reprise après rafraîchissement
   sessionStorage (effacé à la fermeture de l'onglet). Jamais les données personnelles
   ni les fichiers : seulement les choix du projet et l'étape en cours. */
import { CHOICE, FIELDS, PERSONAL } from './steps.js';

const KEY = 'bornexa-cfg';

export function save(form, stepKey) {
  try {
    const data = { step: stepKey, v: {} };
    for (const name of Object.values(CHOICE)) data.v[name] = form.elements[name].value || '';
    for (const list of Object.values(FIELDS)) {
      for (const name of list) {
        const el = form.elements[name];
        if (!el || el.type === 'file' || PERSONAL.has(name)) continue;
        data.v[name] = el.value || '';
      }
    }
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) { /* stockage indisponible : on continue sans reprise */ }
}

export function restore(form) {
  let data = null;
  try { data = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  if (!data || !data.v) return null;
  for (const [name, val] of Object.entries(data.v)) {
    const el = form.elements[name];
    if (!el || !val) continue;
    if (el instanceof RadioNodeList) {
      for (const r of el) r.checked = r.value === val;
    } else if (el.type !== 'file') {
      el.value = val;
    }
  }
  return data.step || null;
}

export function clear() {
  try { sessionStorage.removeItem(KEY); } catch (e) { /* rien */ }
}
