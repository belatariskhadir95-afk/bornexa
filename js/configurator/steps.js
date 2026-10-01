/* BORNEXA — configurateur · logique métier de la demande de devis
   Les noms de champs sont ceux du formulaire Netlify « devis » (repris par Make → Notion
   et par la notification EmailJS) : ne pas les renommer. */

/* Parcours selon « Wat zoekt u? » (Type_Aanvraag) */
export const FLOWS = {
  'Laadpaal': ['intent', 'project', 'network', 'service', 'vehicle', 'merk', 'solar', 'photos', 'ready', 'contact'],
  'Energiebeheer': ['intent', 'project', 'goal', 'solar', 'details', 'photos', 'ready', 'contact'],
  'Herstelling / depannage': ['intent', 'repair', 'photos', 'ready', 'contact'],
  'Advies': ['intent', 'advice', 'ready', 'contact']
};
export const DEFAULT_PATH = 'Laadpaal';

/* étape → champ « choix » (boutons radio) */
export const CHOICE = {
  intent: 'Type_Aanvraag',
  project: 'Type_Project',
  network: 'Type_Installatie',
  service: 'Type_Service',
  vehicle: 'Merk_Voertuig',
  merk: 'Gewenst_Merk_Borne',
  solar: 'zonnepanelen',
  goal: 'Energie_Doel'
};
/* étape → autres champs (facultatifs) */
export const FIELDS = {
  details: ['digitale_meter', 'maandfactuur'],
  repair: ['merk_borne', 'probleem'],
  advice: ['advies_vraag'],
  photos: ['foto_bord', 'foto_teller', 'foto_locatie'],
  contact: ['aantal_laadpunten', 'rol_aanvrager', 'naam', 'telefoon', 'email', 'gemeente', 'bericht']
};
/* étapes sans réponse obligatoire */
export const OPTIONAL = new Set(['vehicle', 'details', 'repair', 'advice', 'photos', 'ready']);
/* données personnelles : jamais mémorisées dans le navigateur */
export const PERSONAL = new Set(['naam', 'telefoon', 'email', 'gemeente', 'bericht']);

export const V2H_SERVICE = 'BMW bidirectionele laadpaal (V2H) - BMW Wallbox Professional 7,4 kW';
export const COLLECTIVE = /Bedrijf|Appartement|Parking/;

export const flowFor = (path) => (FLOWS[path] || FLOWS[DEFAULT_PATH]).slice();

/* valeur d'un champ du formulaire (radio, select, texte, fichier) */
export function value(form, name) {
  const el = form.elements[name];
  if (!el) return '';
  if (el instanceof RadioNodeList) return el.value || '';
  if (el.type === 'file') return el.files && el.files.length ? el.files[0].name : '';
  return el.value || '';
}

/* toutes les réponses utiles au récapitulatif et à la scène */
export function answers(form) {
  const a = {};
  for (const name of Object.values(CHOICE)) a[name] = value(form, name);
  for (const list of Object.values(FIELDS)) for (const name of list) a[name] = value(form, name);
  a.photos = FIELDS.photos.filter((n) => value(form, n)).length;
  return a;
}

/* Les réponses d'un autre parcours (ex. on a changé « Wat zoekt u? » en cours de route)
   ne doivent pas partir avec la demande : on les efface juste avant l'envoi. */
export function clearOutside(form, flow) {
  const keep = new Set(flow);
  for (const [stepKey, name] of Object.entries(CHOICE)) {
    if (keep.has(stepKey)) continue;
    const el = form.elements[name];
    if (el instanceof RadioNodeList) for (const r of el) r.checked = false;
  }
  for (const [stepKey, names] of Object.entries(FIELDS)) {
    if (keep.has(stepKey)) continue;
    for (const name of names) {
      const el = form.elements[name];
      if (!el) continue;
      if (el.type === 'file') el.value = '';
      else el.value = '';
    }
  }
  if (!COLLECTIVE.test(value(form, 'Type_Project'))) {
    form.elements.aantal_laadpunten.value = '';
    form.elements.rol_aanvrager.value = '';
  }
}

/* Paramètres de la notification EmailJS : mêmes clés que l'ancien formulaire. */
export function emailParams(form, lang, d) {
  const v = (n) => value(form, n) || '-';
  return {
    client_name: value(form, 'naam'),
    client_email: value(form, 'email'),
    client_phone: value(form, 'telefoon'),
    client_city: value(form, 'gemeente') || d.city,
    request_type: v('Type_Aanvraag'),
    project_type: v('Type_Project'),
    vehicle: v('Merk_Voertuig'),
    charger_brand_wish: v('Gewenst_Merk_Borne'),
    service: v('Type_Service'),
    energy_goal: v('Energie_Doel'),
    solar: v('zonnepanelen'),
    digital_meter: v('digitale_meter'),
    monthly_bill: v('maandfactuur'),
    charger_brand: v('merk_borne'),
    problem: v('probleem'),
    advice: v('advies_vraag'),
    install_type: v('Type_Installatie'),
    points: v('aantal_laadpunten'),
    role: v('rol_aanvrager'),
    extra_info: value(form, 'bericht') || d.none
  };
}

/* Champs obligatoires de la dernière étape (naam, telefoon, email) */
export function invalidContact(form) {
  return ['naam', 'telefoon', 'email'].map((n) => form.elements[n]).filter((el) => {
    el.value = el.value.trim();
    return !el.checkValidity();
  });
}
