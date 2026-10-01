/* BORNEXA — Energy Journey · scénario
   Le « temps de l'histoire » T va de 0 à 8 : un pas entier par bloc du DOM
   (0 = hero, 1 = intro, 2 = solaire, 3 = recharge, 4 = route, 5 = soir, 6 = V2H, 7 = fin).
   T est calculé depuis la position des blocs (index.js) : le rythme se règle dans le CSS
   (hauteur des blocs), les moments clés ci-dessous restent valables.
   Géométrie : alignée sur scripts/energy-journey-scene.mjs. */

export const LOOP = 3600;            // distance maison du matin → maison du soir (même maison)
export const CAR_HOME = 805;         // x monde de la voiture garée (maison du matin)
export const CAR_Y = 808;            // y monde du contact roues/allée (voiture garée)

export const KEY = {
  dawn: [0.3, 0.95],                 // aube → jour
  sunActive: [1.05, 1.85],           // le soleil « s'active », rayons vers les panneaux
  glint: [1.25, 2.05],
  pvOn: [1.3, 1.9],
  solarFlow: [2.0, 2.6],             // panneaux → coffret → borne
  boxOn: [2.25, 2.4],
  chargerOn: [2.5, 2.85],
  chargeFlow: [3.0, 3.22],           // borne → voiture
  battery: [3.18, 3.86],             // 22 % → 100 %
  chipCharge: [3.05, 4.1],
  unplug: [3.98, 4.1],
  depart: 4.1,
  arrive: 5.62,
  sunset: [4.25, 4.95],
  night: [4.95, 5.5],
  lamps: [4.95, 5.35],
  replug: [5.66, 5.9],
  chipV2H: [5.86, 7.6],
  v2hFlow: [6.02, 6.38],             // voiture → borne → coffret (sens inversé)
  branches: [[6.3, 6.42], [6.36, 6.52], [6.44, 6.6], [6.5, 6.72]],
  windows: { kitchen: [6.4, 6.48], living: [6.5, 6.6], up2: [6.58, 6.66], up1: [6.64, 6.74] },
  heatPump: 6.7,
  drain: [6.1, 6.95]                 // décharge V2H
};

export const BATTERY = { morning: 0.22, full: 1, afterDrive: 0.82, afterV2H: 0.64 };

/* Cadrages caméra (x MONDE, la maison du matin commence à x = 120) :
   le point « cx » est placé à la fraction « at » de la largeur d'écran. */
export const FRAMES = {
  wide: {
    hero: { cx: 370, at: 0.73 },
    home: { cx: 500, at: 0.665 },
    charge: { cx: 500, at: 0.665 },
    follow: 0.46,
    home2: { cx: 500 + LOOP, at: 0.665 }
  },
  narrow: {
    hero: { cx: 410, at: 0.5 },
    home: { cx: 400, at: 0.5 },
    charge: { cx: 650, at: 0.5 },
    follow: 0.34,
    home2: { cx: 420 + LOOP, at: 0.5 }
  }
};

/* Soleil / lune : x en fraction de largeur, alt en unités au-dessus du bas de la scène. */
export const SKY = {
  wide: { sun: [[0.7, 300], [0.76, 690], [0.9, 330], [0.92, 150]], moon: [0.6, 770] },
  narrow: { sun: [[0.74, 300], [0.8, 640], [0.86, 330], [0.88, 150]], moon: [0.2, 600] }
};

/* Image fixe (mouvement réduit / sans scroll) : recharge solaire en cours. */
export const T_STATIC = 3.72;

/* ── utilitaires ── */
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (T, a, b) => clamp((T - a) / (b - a));
export const ease = (t) => t * t * (3 - 2 * t);
export const span = (T, r) => range(T, r[0], r[1]);

/* Profil de vitesse : accélération, croisière, freinage (position 0 → 1). */
export function travel(t) {
  const a = 0.16, d = 0.22, v = 1 / (1 - a / 2 - d / 2);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < a) return (v * t * t) / (2 * a);
  if (t < 1 - d) return v * (a / 2 + (t - a));
  const r = 1 - t;
  return 1 - (v * r * r) / (2 * d);
}
