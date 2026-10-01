// BORNEXA — kit de dessin partagé (scènes vectorielles)
// Utilisé par :
//   · scripts/energy-journey-scene.mjs   (homepage, préfixe « ej »)
//   · scripts/configurator-scene.mjs     (demande de devis, préfixe « cf »)
// Les identifiants / classes sont préfixés pour qu'une page puisse inclure une scène
// sans collision. Coordonnées : unités de scène (hauteur 900), maison posée à x = 0.

export const H = 900;
export const f = (n) => Math.round(n * 10) / 10;

export function seg(x0, y0, x1, y1) {
  if (y0 === y1) return ` L${x1},${y1}`;
  const xm = (x0 + x1) / 2;
  return ` C${xm},${y0} ${xm},${y1} ${x1},${y1}`;
}

// PRNG déterministe (scène identique à chaque génération)
export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hills({ x0, x1, step, yMin, yMax, seed, bottom = H }) {
  const r = rng(seed), pts = [];
  for (let x = x0; x < x1 + step; x += step * (0.75 + r() * 0.5)) pts.push([f(x), f(yMin + r() * (yMax - yMin))]);
  let d = `M${x0},${bottom} L${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += seg(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]).replace(/(\d+\.\d{2,})/g, (m) => f(+m));
  d += ` L${pts.at(-1)[0]},${bottom} Z`;
  return { d, pts };
}

/* ───────────────────────── maison ───────────────────────── */

// grille des panneaux (2 rangées × 6 colonnes, légère perspective)
export function pvGrid() {
  const top = [48.5, 251.5], bot = [4.4, 295.6];
  let d = 'M26.5,507 L273.5,507';
  for (let k = 1; k < 6; k++) {
    const t = k / 6;
    d += ` M${f(top[0] + t * (top[1] - top[0]))},466 L${f(bot[0] + t * (bot[1] - bot[0]))},548`;
  }
  return d;
}
export const PV_OUTLINE = 'M48.5,466 L251.5,466 L295.6,548 L4.4,548 Z';

/* Morceaux de la maison (dans l'ordre de dessin d'origine). */
export function houseParts(p) {
  return {
    hedge: `<path d="M-206,796 C-206,770 -190,764 -170,766 C-150,756 -120,760 -106,770 C-92,766 -78,774 -78,796 Z" fill="#4E7F6D"/>`,
    heatpump: `<rect x="-68" y="748" width="54" height="48" rx="5" fill="#D3DADD"/>
  <rect x="-68" y="748" width="54" height="8" rx="4" fill="#BEC7CB"/>
  <circle cx="-41" cy="774" r="15" fill="#A9B4BA"/>
  <circle cx="-41" cy="774" r="11.5" fill="#8C989F"/>`,
    walls: `<rect x="0" y="560" width="300" height="236" fill="url(#${p}-g-wall)"/>
  <rect x="0" y="783" width="300" height="13" fill="#CBD2CE"/>
  <path d="M-18,562 L40,452 L260,452 L318,562 Z" fill="#2B3640"/>`,
    pv: `<path d="${PV_OUTLINE}" fill="url(#${p}-g-pv)" stroke="#9DB0C2" stroke-opacity=".7" stroke-width="1.4"/>
  <path d="${pvGrid()}" stroke="#9DB0C2" stroke-opacity=".5" stroke-width="1.1" fill="none"/>`,
    roofEdges: `<rect x="36" y="447" width="228" height="7" rx="3.5" fill="#202A32"/>
  <rect x="-24" y="558" width="348" height="10" rx="2" fill="#1E272E"/>`,
    annex: `<rect x="300" y="644" width="152" height="152" fill="#E1E6E3"/>
  <rect x="296" y="636" width="160" height="10" rx="2" fill="#26313A"/>
  <rect x="300" y="783" width="152" height="13" fill="#C6CEC9"/>`,
    windows: `<g fill="url(#${p}-g-glass)" stroke="#27323B" stroke-width="4">
    <rect x="26" y="664" width="156" height="108" rx="2"/>
    <rect x="34" y="588" width="96" height="52" rx="2"/>
    <rect x="168" y="588" width="96" height="52" rx="2"/>
    <rect x="318" y="678" width="80" height="62" rx="2"/>
    <rect x="252" y="690" width="12" height="106" stroke-width="2.5"/>
  </g>
  <path d="M104,664 V772 M82,588 V640 M216,588 V640" stroke="#27323B" stroke-width="3"/>`,
    door: `<rect x="206" y="690" width="40" height="106" rx="2" fill="#36424C"/>
  <rect x="238" y="738" width="3" height="16" rx="1.5" fill="#C8D1D6"/>`,
    box: `<rect x="428" y="686" width="16" height="28" rx="3" fill="#F7F9F8" stroke="#99A5AB" stroke-width="1.5"/>`,
    driveway: `<rect x="456" y="796" width="452" height="17" fill="#C3CAC6"/>`,
    charger: `<rect x="495" y="716" width="10" height="82" fill="#2C363E"/>
  <rect x="484" y="690" width="32" height="58" rx="9" fill="#F3F5F4" stroke="#C3CBCF" stroke-width="1.5"/>
  <rect x="489" y="696" width="22" height="46" rx="6" fill="#1C252C"/>
  <circle cx="500" cy="712" r="6" fill="none" stroke="#3B4A52" stroke-width="2"/>
  <rect x="486" y="795" width="28" height="6" rx="2" fill="#29323A"/>`
  };
}

/* Maison complète (homepage) : symbole réutilisable via <use>. */
export function houseSymbol(p) {
  const h = houseParts(p);
  return `
<g id="${p}-house">
  ${h.hedge}
  ${h.heatpump}
  ${h.walls}
  ${h.pv}
  ${h.roofEdges}
  ${h.annex}
  ${h.windows}
  ${h.door}
  ${h.box}
  ${h.driveway}
  ${h.charger}
</g>`;
}

export function houseGradients(p) {
  return `<linearGradient id="${p}-g-pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27406A"/><stop offset="1" stop-color="#101B2E"/></linearGradient>
  <linearGradient id="${p}-g-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DCEAF1"/><stop offset=".5" stop-color="#A9C3D2"/><stop offset="1" stop-color="#7F9FB3"/></linearGradient>
  <linearGradient id="${p}-g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5F7F5"/><stop offset="1" stop-color="#E2E7E4"/></linearGradient>`;
}

/* ───────────────────────── décor ───────────────────────── */

export function treeSymbols(p) {
  return `
<g id="${p}-tree"><rect x="-5" y="-62" width="10" height="62" rx="3" fill="#6B5A49"/><circle cx="0" cy="-102" r="44" fill="#5B9381"/><circle cx="-30" cy="-78" r="30" fill="#538A78"/><circle cx="31" cy="-76" r="32" fill="#57907D"/><circle cx="-12" cy="-118" r="20" fill="#72AA96" opacity=".85"/></g>
<g id="${p}-tree-tall"><rect x="-4" y="-44" width="8" height="44" rx="3" fill="#6B5A49"/><ellipse cx="0" cy="-122" rx="27" ry="88" fill="#4F8B78"/><ellipse cx="-9" cy="-136" rx="11" ry="56" fill="#6CA591" opacity=".85"/></g>
<g id="${p}-lamp"><path d="M0,0 V-150 Q0,-160 10,-160 H32" fill="none" stroke="#3A454F" stroke-width="4" stroke-linecap="round"/><rect x="22" y="-164" width="20" height="7" rx="3" fill="#2F3942"/></g>`;
}

/* ───────────────────────── éléments lumineux ───────────────────────── */

export function flow(p, id, kind, d, extra = '') {
  return `<g class="${p}-flow ${p}-flow--${kind}${extra}" id="${id}"><path class="${p}-f-halo" d="${d}"/><path class="${p}-f-core" d="${d}"/><path class="${p}-f-dots" d="${d}"/></g>`;
}
export function win(p, id, x, y, w, h, mull = []) {
  const bars = mull.map((mx) => `M${x + mx},${y} V${y + h}`).join(' ');
  return `<g class="${p}-win" id="${id}"><rect x="${x - 46}" y="${y - 40}" width="${w + 92}" height="${h + 80}" fill="url(#${p}-g-halo-win)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#${p}-g-win)"/>` +
    (bars ? `<path d="${bars}" stroke="#3A3326" stroke-opacity=".55" stroke-width="3"/>` : '') + '</g>';
}
export function led(p, id, cx, cy, r, kind) {
  return `<g class="${p}-led ${p}-led--${kind}" id="${id}"><circle cx="${cx}" cy="${cy}" r="${r * 3}" fill="url(#${p}-g-halo-${kind})"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="${f(r * 0.45)}"/></g>`;
}
export function glowGradients(p) {
  return `<radialGradient id="${p}-g-halo-mint"><stop offset="0" stop-color="#3DF5C2" stop-opacity=".75"/><stop offset="1" stop-color="#3DF5C2" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}-g-halo-amber"><stop offset="0" stop-color="#FFB547" stop-opacity=".8"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}-g-halo-warm"><stop offset="0" stop-color="#FFD98F" stop-opacity=".55"/><stop offset="1" stop-color="#FFD98F" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}-g-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6B0"/><stop offset="1" stop-color="#F2B45C"/></linearGradient>
  <radialGradient id="${p}-g-halo-win"><stop offset="0" stop-color="#FFC870" stop-opacity=".42"/><stop offset=".55" stop-color="#FFC870" stop-opacity=".14"/><stop offset="1" stop-color="#FFC870" stop-opacity="0"/></radialGradient>`;
}

/* ───────────────────────── voiture ─────────────────────────
   Vue de profil, avant à droite. viewBox -40 0 640 120 ; contact au sol (150, 113).
   port : position de la trappe de charge (arrière gauche par défaut). */

export const CAR_BODY = 'M20,96 L16,76 C16,66 22,60 32,57 L60,42 C68,37 76,35 86,35 L168,34 C184,34 194,38 204,45 L234,63 C256,65 274,68 283,73 C290,77 292,85 290,92 L287,96 L257,96 A25,25 0 0 0 207,96 L95,96 A25,25 0 0 0 45,96 Z';

export function wheel(id, cx) {
  const spokes = [-90, -18, 54, 126, 198].map((a) => {
    const r = (a * Math.PI) / 180;
    return `M${cx},92 L${f(cx + Math.cos(r) * 12.5)},${f(92 + Math.sin(r) * 12.5)}`;
  }).join(' ');
  return `<circle cx="${cx}" cy="92" r="21" fill="#1B2228"/><g id="${id}"><circle cx="${cx}" cy="92" r="13.5" fill="#A6B2B9"/><path d="${spokes}" stroke="#6E7C85" stroke-width="2.6" stroke-linecap="round"/><circle cx="${cx}" cy="92" r="4" fill="#4B5860"/></g>`;
}

export function carBodySvg(p, { port = [18, 58] } = {}) {
  return `<svg viewBox="-40 0 640 120" focusable="false">
<defs>
  <linearGradient id="${p}-g-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8FAFB"/><stop offset=".55" stop-color="#E3E9EC"/><stop offset="1" stop-color="#C3CDD3"/></linearGradient>
  <linearGradient id="${p}-g-cabin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2C3A47"/><stop offset=".62" stop-color="#1A252F"/><stop offset="1" stop-color="#36495C"/></linearGradient>
  <clipPath id="${p}-clip-body"><path d="${CAR_BODY}"/></clipPath>
</defs>
<ellipse cx="150" cy="114" rx="134" ry="5.5" fill="#000" opacity=".2"/>
<path d="${CAR_BODY}" fill="url(#${p}-g-body)"/>
<rect x="0" y="80" width="300" height="20" fill="#B5C1C8" opacity=".55" clip-path="url(#${p}-clip-body)"/>
<path d="M66,46 L88,40 L166,39 C178,39 187,42 195,47 L220,62 L66,62 Z" fill="url(#${p}-g-cabin)"/>
<path d="M128,38 L131,62" stroke="#EDF1F3" stroke-width="5"/>
<path d="M131,62 L133,94 M200,52 L202,92" stroke="#C2CCD1" stroke-width="1.3" fill="none"/>
<rect x="100" y="66" width="16" height="3.5" rx="1.75" fill="#8F9CA4"/><rect x="164" y="66" width="16" height="3.5" rx="1.75" fill="#8F9CA4"/>
<path d="M200,50 L214,48 L214,56 L204,57 Z" fill="#1E2A33"/>
<rect x="${port[0]}" y="${port[1]}" width="12" height="8" rx="2" fill="#D3DCE0" stroke="#A9B5BB" stroke-width="1"/>
<path d="M262,69 L286,75" stroke="#AEBBC2" stroke-width="4" stroke-linecap="round"/>
<path d="M17,70 L31,64" stroke="#7D3B3B" stroke-width="4" stroke-linecap="round"/>
${wheel(`${p}-wheel-r`, 70)}
${wheel(`${p}-wheel-f`, 232)}
</svg>`;
}

export function carGlowSvg(p, { port = [18, 58] } = {}) {
  const [px, py] = [port[0] + 6, port[1] + 4];
  return `<svg viewBox="-40 0 640 120" focusable="false">
<defs>
  <linearGradient id="${p}-g-beam" gradientUnits="userSpaceOnUse" x1="288" y1="0" x2="600" y2="0"><stop offset="0" stop-color="#FFF6DC" stop-opacity=".55"/><stop offset="1" stop-color="#FFF6DC" stop-opacity="0"/></linearGradient>
  <linearGradient id="${p}-g-bat" gradientUnits="userSpaceOnUse" x1="100" y1="0" x2="206" y2="0"><stop offset="0" stop-color="#00C896"/><stop offset="1" stop-color="#5CF3C8"/></linearGradient>
  <radialGradient id="${p}-g-tail"><stop offset="0" stop-color="#FF4D4D" stop-opacity=".7"/><stop offset="1" stop-color="#FF4D4D" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}-g-head"><stop offset="0" stop-color="#F2FAFF" stop-opacity=".8"/><stop offset="1" stop-color="#F2FAFF" stop-opacity="0"/></radialGradient>
</defs>
<path id="${p}-beam" d="M288,72 L600,46 L600,106 L288,82 Z" fill="url(#${p}-g-beam)" opacity="0"/>
<circle id="${p}-headhalo" cx="284" cy="74" r="12" fill="url(#${p}-g-head)" opacity="0"/>
<path d="M263,69.5 L285,75" stroke="#F4FBFF" stroke-width="3" stroke-linecap="round"/>
<g id="${p}-tail" opacity=".3"><circle cx="24" cy="67" r="16" fill="url(#${p}-g-tail)"/><path d="M18,69.5 L30,64.5" stroke="#FF5A5A" stroke-width="3" stroke-linecap="round"/></g>
<path d="M100,91 L206,91" stroke="#0E1A20" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>
<path id="${p}-bat" d="M100,91 L206,91" stroke="url(#${p}-g-bat)" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="106 106" stroke-dashoffset="83"/>
<circle id="${p}-port-sun" cx="${px}" cy="${py}" r="2.6" fill="#3DF5C2" opacity="0"/>
<circle id="${p}-port-v2h" cx="${px}" cy="${py}" r="2.6" fill="#FFB547" opacity="0"/>
</svg>`;
}

/* compactage du balisage généré */
export const compact = (s) => s.replace(/\n\s*\n/g, '\n').replace(/>\s+</g, '><');

/* injection entre deux marqueurs d'un fichier HTML */
export function inject(fileUrl, startMark, endMark, markup, readFileSync, writeFileSync) {
  const html = readFileSync(fileUrl, 'utf8');
  const a = html.indexOf(startMark), b = html.indexOf(endMark);
  if (a < 0 || b < 0) throw new Error(`Marqueurs ${startMark} / ${endMark} introuvables`);
  writeFileSync(fileUrl, html.slice(0, a + startMark.length) + '\n' + markup + '\n' + html.slice(b));
}
