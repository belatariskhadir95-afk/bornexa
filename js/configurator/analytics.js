/* Mesure du parcours de devis (GA4).
   Passe par window.gtag déjà configuré par main.js : le mode consentement s'applique tel quel
   (sans accord du visiteur, Google ne reçoit que des signaux anonymes, sans cookies).
   Aucune donnée personnelle : seulement le nom de l'étape et les valeurs des choix (réseau, solaire…). */
const send = (name, params) => {
  if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
};

// choix utiles au suivi commercial (valeurs des boutons radio, jamais du texte libre)
const TRACKED = { Type_Aanvraag: 'path', Type_Project: 'project', Type_Installatie: 'network', zonnepanelen: 'solar', Type_Service: 'service', Gewenst_Merk_Borne: 'brand' };

export function createAnalytics() {
  let started = false, submitted = false, last = 'intro';
  const seen = new Set();
  send('cfg_view');
  window.addEventListener('pagehide', () => {
    if (started && !submitted) send('cfg_abandon', { last_step: last, transport_type: 'beacon' });
  });
  return {
    step(key, index, total, path) {
      if (key === 'intro' || key === 'success') return;
      if (!started) { started = true; send('cfg_start', { path }); }
      last = key;
      const id = `${path}:${key}`;
      if (seen.has(id)) return;
      seen.add(id);
      send('cfg_step', { step: key, step_index: index + 1, steps_total: total, path });
      if (key === 'contact') send('cfg_contact_view', { path });
    },
    answer(name, value) {
      const k = TRACKED[name];
      if (!k) return;
      send('cfg_choice', { field: k, value: String(value).slice(0, 100) });
      if (name === 'Type_Service' && /V2H|bidirection/i.test(value)) send('cfg_v2h', { value: String(value).slice(0, 100) });
    },
    submitted() { submitted = true; }
  };
}
