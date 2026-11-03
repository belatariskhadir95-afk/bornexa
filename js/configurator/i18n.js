/* BORNEXA — configurateur · textes dynamiques NL / FR
   Les textes statiques des étapes sont dans devis.html (data-nl / data-fr, gérés par lang.js).
   Ici : uniquement ce que le JS compose (progression, récapitulatif, proposition, états). */

/* Même ordre de priorité que js/lang.js : ?lang= > URL /fr/ > préférence > <html lang> */
export function detectLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'fr' || q === 'nl') return q;
  } catch (e) { /* URL non lisible */ }
  if (location.pathname.indexOf('/fr/') === 0) return 'fr';
  try {
    const s = localStorage.getItem('bornexa-lang');
    if (s === 'fr' || s === 'nl') return s;
  } catch (e) { /* stockage indisponible */ }
  return (document.documentElement.getAttribute('lang') || '').toLowerCase() === 'fr' ? 'fr' : 'nl';
}

const DICT = {
  nl: {
    kicker: 'Stap {n}',
    stepOf: 'Stap {n} van {total}',
    live: 'Stap {n} van {total}: {title}',
    chapters: { project: 'Project', network: 'Net', charger: 'Laadpaal', solar: 'Zon', goal: 'Doel', repair: 'Probleem', advice: 'Vraag', photos: "Foto's", contact: 'Contact' },
    labels: {
      Type_Aanvraag: 'Aanvraag', Type_Project: 'Project', Type_Installatie: 'Net', Type_Service: 'Dienst',
      Merk_Voertuig: 'Wagen', Gewenst_Merk_Borne: 'Laadpaal', zonnepanelen: 'Zonnepanelen', Energie_Doel: 'Doel',
      merk_borne: 'Merk laadpaal', photos: "Foto's", model_voertuig: 'Model', thuisbatterij: 'Thuisbatterij', afstand_bord: 'Afstand'
    },
    photos: '{n} toegevoegd',
    edit: 'Wijzig',
    summaryEmpty: 'Uw keuzes verschijnen hier.',
    added: 'Toegevoegd ✓',
    sending: 'Bezig…',
    offer: {
      base: 'Een conforme installatie volgens het AREI, met keuring; voor de melding bij de netbeheerder bezorgen wij u alle technische gegevens.',
      charger: 'Plaatsing van uw laadpaal met de juiste beveiliging.',
      socket: 'Plaatsing van een versterkt Green&#39;Up-stopcontact.',
      own: 'Plaatsing en aansluiting van uw eigen laadpaal.',
      replace: 'Demontage van uw oude laadpaal en plaatsing van de nieuwe.',
      v2h: 'Bidirectioneel laden (V2H) met de BMW Wallbox Professional 11 kW, na controle van de compatibiliteit van uw BMW.',
      v2hNet: 'In België werkt V2H van BMW enkel met de Wallbox Professional 11 kW, op een net 3×400 V + N. Op een monofasig net of op 3×230 V zonder N is V2H vandaag niet mogelijk: wij bekijken samen de beste oplossing.',
      battery: 'Met een thuisbatterij stemmen wij het laden op zon af op uw batterij en haar omvormer.',
      solar: 'Laden op uw zonne-energie: we stemmen de laadpaal af op uw panelen.',
      solarPlanned: 'Klaar voor uw toekomstige zonnepanelen.',
      netCheck: 'We controleren uw elektrisch net bij het gratis plaatsbezoek.',
      net230: 'Op 3×230 V zonder N laadt een laadpaal monofasig: tot 7,4 kW op een kring van 32 A. <a href="laadpaal-3x230v" target="_blank" rel="noopener">Waarom?</a>',
      collective: 'Een oplossing voor meerdere laadpunten, met verdeling van het vermogen.',
      energy: 'Advies en installatie van Smappee Infinity voor uw doel.',
      repair: 'Diagnose ter plaatse, ook voor laadpalen die wij niet plaatsten.',
      advice: 'Eerlijk en vrijblijvend advies over uw vraag.'
    },
    fallbackTitle: 'Verzending onzeker',
    fallbackMsg: 'De verbinding is mislukt. Neem even rechtstreeks contact op — we behandelen uw aanvraag meteen:',
    city: 'Niet opgegeven',
    none: 'Geen'
  },
  fr: {
    kicker: 'Étape {n}',
    stepOf: 'Étape {n} sur {total}',
    live: 'Étape {n} sur {total} : {title}',
    chapters: { project: 'Projet', network: 'Réseau', charger: 'Borne', solar: 'Solaire', goal: 'Objectif', repair: 'Problème', advice: 'Question', photos: 'Photos', contact: 'Contact' },
    labels: {
      Type_Aanvraag: 'Demande', Type_Project: 'Projet', Type_Installatie: 'Réseau', Type_Service: 'Service',
      Merk_Voertuig: 'Voiture', Gewenst_Merk_Borne: 'Borne', zonnepanelen: 'Panneaux solaires', Energie_Doel: 'Objectif',
      merk_borne: 'Marque de la borne', photos: 'Photos', model_voertuig: 'Modèle', thuisbatterij: 'Batterie domestique', afstand_bord: 'Distance'
    },
    photos: '{n} ajoutée(s)',
    edit: 'Modifier',
    summaryEmpty: 'Vos choix apparaissent ici.',
    added: 'Ajouté ✓',
    sending: 'Envoi…',
    offer: {
      base: 'Une installation conforme au RGIE, avec le contrôle ; pour la déclaration au gestionnaire de réseau, nous vous fournissons toutes les données techniques.',
      charger: 'Pose de votre borne avec les protections adaptées.',
      socket: 'Pose d&#39;une prise renforcée Green&#39;Up.',
      own: 'Pose et raccordement de votre propre borne.',
      replace: 'Dépose de votre ancienne borne et pose de la nouvelle.',
      v2h: 'Recharge bidirectionnelle (V2H) avec la BMW Wallbox Professional 11 kW, après vérification de la compatibilité de votre BMW.',
      v2hNet: 'En Belgique, le V2H de BMW ne fonctionne qu&#39;avec la Wallbox Professional 11 kW, sur un réseau 3×400 V + N. Sur un réseau monophasé ou en 3×230 V sans N, le V2H n&#39;est pas possible aujourd&#39;hui : nous étudions ensemble la meilleure solution.',
      battery: 'Avec une batterie domestique, nous accordons la recharge solaire avec votre batterie et son onduleur.',
      solar: 'Recharge sur votre énergie solaire : nous accordons la borne à vos panneaux.',
      solarPlanned: 'Prête pour vos futurs panneaux solaires.',
      netCheck: 'Nous vérifions votre réseau électrique lors de la visite gratuite.',
      net230: 'En 3×230 V sans N, une borne charge en monophasé : jusqu&#39;à 7,4 kW sur un circuit de 32 A. <a href="laadpaal-3x230v" target="_blank" rel="noopener">Pourquoi ?</a>',
      collective: 'Une solution pour plusieurs points de charge, avec répartition de la puissance.',
      energy: 'Conseil et installation de Smappee Infinity pour votre objectif.',
      repair: 'Diagnostic sur place, y compris pour les bornes que nous n&#39;avons pas installées.',
      advice: 'Un conseil honnête et sans engagement sur votre question.'
    },
    fallbackTitle: 'Envoi incertain',
    fallbackMsg: 'La connexion a échoué. Contactez-nous directement — nous traitons votre demande tout de suite :',
    city: 'Non précisé',
    none: 'Aucune'
  }
};

export function dict(lang) { return DICT[lang] || DICT.nl; }

export function fmt(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
