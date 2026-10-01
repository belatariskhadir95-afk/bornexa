// BORNEXA — « Energy Journey » (homepage)
// Génère la scène vectorielle (calques SVG de la séquence au scroll) et l'injecte
// dans index.html entre <!-- EJ:STAGE:START --> et <!-- EJ:STAGE:END -->.
//
//   node scripts/energy-journey-scene.mjs
//
// Toute la géométrie partagée avec js/energy-journey/ (route, maisons, borne, flux)
// est définie ici. Si une coordonnée change, garder js/energy-journey/timeline.js aligné.
import { readFileSync, writeFileSync } from 'node:fs';

const f = (n) => Math.round(n * 10) / 10;
const H = 900;
const LOOP = 3600;                 // maison → même maison, le soir (voir timeline.js)
const HOUSES = [120, 120 + LOOP];  // x monde de chaque maison

// Profil de la route (bord supérieur) : tangentes horizontales à chaque point.
const ROAD = [[-1600, 812], [1150, 812], [1700, 782], [2200, 818], [2700, 792], [3350, 812], [6000, 812]];

function seg(x0, y0, x1, y1) {
  if (y0 === y1) return ` L${x1},${y1}`;
  const xm = (x0 + x1) / 2;
  return ` C${xm},${y0} ${xm},${y1} ${x1},${y1}`;
}
function profile(dy = 0, from = 0, to = ROAD.length - 1) {
  let d = ` L${ROAD[from][0]},${ROAD[from][1] + dy}`;
  for (let i = from + 1; i <= to; i++) d += seg(ROAD[i - 1][0], ROAD[i - 1][1] + dy, ROAD[i][0], ROAD[i][1] + dy);
  return d;
}
function profileReverse(dy = 0) {
  const n = ROAD.length - 1;
  let d = ` L${ROAD[n][0]},${ROAD[n][1] + dy}`;
  for (let i = n; i > 0; i--) d += seg(ROAD[i][0], ROAD[i][1] + dy, ROAD[i - 1][0], ROAD[i - 1][1] + dy);
  return d;
}
function roadY(x) {
  for (let i = 1; i < ROAD.length; i++) {
    const [x0, y0] = ROAD[i - 1], [x1, y1] = ROAD[i];
    if (x > x1) continue;
    if (y0 === y1) return y0;
    const xm = (x0 + x1) / 2;
    let lo = 0, hi = 1;
    for (let k = 0; k < 40; k++) {
      const t = (lo + hi) / 2, mt = 1 - t;
      const bx = mt * mt * mt * x0 + 3 * mt * mt * t * xm + 3 * mt * t * t * xm + t * t * t * x1;
      if (bx < x) lo = t; else hi = t;
    }
    const t = (lo + hi) / 2, mt = 1 - t;
    return mt * mt * mt * y0 + 3 * mt * mt * t * y0 + 3 * mt * t * t * y1 + t * t * t * y1;
  }
  return ROAD.at(-1)[1];
}

// PRNG déterministe (scène identique à chaque génération)
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hills({ x0, x1, step, yMin, yMax, seed, bottom = H }) {
  const r = rng(seed), pts = [];
  for (let x = x0; x < x1 + step; x += step * (0.75 + r() * 0.5)) pts.push([f(x), f(yMin + r() * (yMax - yMin))]);
  let d = `M${x0},${bottom} L${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += seg(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]).replace(/(\d+\.\d{2,})/g, (m) => f(+m));
  d += ` L${pts.at(-1)[0]},${bottom} Z`;
  return { d, pts };
}

/* ───────────────────────── calques de fond ───────────────────────── */

function farLayer() {
  const m = -500, lw = 3800;
  const ridge = hills({ x0: m, x1: m + lw, step: 420, yMin: 590, yMax: 612, seed: 7, bottom: 720 });
  // village flamand stylisé (toits + clocher)
  const houses = [[600, 46, 600, 22], [650, 38, 606, 18], [694, 52, 598, 24], [752, 30, 604, 16],
    [892, 40, 602, 20], [938, 56, 596, 26], [1000, 36, 606, 16], [1042, 48, 600, 22], [1094, 30, 606, 16]];
  let v = '';
  for (const [x, w, top, rh] of houses) v += `M${x},622 V${top} L${x + w / 2},${top - rh} L${x + w},${top} V622 Z `;
  v += 'M790,622 V548 L802,486 L814,548 V622 Z M814,622 V574 L849,556 L884,574 V622 Z';
  let turb = '';
  for (const x of [1640, 1785, 1935]) {
    turb += `<path d="M${x - 2.4},614 L${x - 1},492 L${x + 1},492 L${x + 2.4},614 Z" fill="#C6D6DC"/>` +
      `<rect x="${x - 4}" y="487" width="11" height="7" rx="2" fill="#C6D6DC"/>` +
      `<g transform="translate(${x} 490)"><g class="ej-rotor" style="animation-delay:${((x * 7) % 900) / -100}s">` +
      [0, 120, 240].map((a) => `<path transform="rotate(${a})" d="M0,0 L-2.4,-8 L0,-46 L2.4,-8 Z"/>`).join('') +
      '</g></g>';
  }
  return layer('far', m, lw, 0.12,
    `<path d="${ridge.d}" fill="#BACED5"/><path d="${v}" fill="#A8BEC7"/><g fill="#C6D6DC">${turb}</g>`);
}

function backLayer() {
  const m = -700, lw = 4600;
  const h = hills({ x0: m, x1: m + lw, step: 400, yMin: 616, yMax: 656, seed: 11 });
  return layer('back', m, lw, 0.3, `<path d="${h.d}" fill="#A5C2B8"/>`);
}

function midLayer() {
  const m = -1100, lw = 6000;
  const h = hills({ x0: m, x1: m + lw, step: 340, yMin: 668, yMax: 718, seed: 23 });
  let trees = '';
  h.pts.forEach(([x, y], i) => {
    if (i % 3 !== 1) return;
    trees += `<circle cx="${x}" cy="${f(y - 8)}" r="16"/><circle cx="${f(x + 18)}" cy="${f(y - 2)}" r="12"/>`;
  });
  return layer('mid', m, lw, 0.55, `<path d="${h.d}" fill="#86AC9D"/><g fill="#79A090">${trees}</g>`);
}

/* ───────────────────────── calque monde (route, maisons) ───────────────────────── */

const HOUSE = `
<g id="ej-house">
  <path d="M-206,796 C-206,770 -190,764 -170,766 C-150,756 -120,760 -106,770 C-92,766 -78,774 -78,796 Z" fill="#4E7F6D"/>
  <rect x="-68" y="748" width="54" height="48" rx="5" fill="#D3DADD"/>
  <rect x="-68" y="748" width="54" height="8" rx="4" fill="#BEC7CB"/>
  <circle cx="-41" cy="774" r="15" fill="#A9B4BA"/>
  <circle cx="-41" cy="774" r="11.5" fill="#8C989F"/>
  <rect x="0" y="560" width="300" height="236" fill="url(#ej-g-wall)"/>
  <rect x="0" y="783" width="300" height="13" fill="#CBD2CE"/>
  <path d="M-18,562 L40,452 L260,452 L318,562 Z" fill="#2B3640"/>
  <path d="M48.5,466 L251.5,466 L295.6,548 L4.4,548 Z" fill="url(#ej-g-pv)" stroke="#9DB0C2" stroke-opacity=".7" stroke-width="1.4"/>
  <path d="${pvGrid()}" stroke="#9DB0C2" stroke-opacity=".5" stroke-width="1.1" fill="none"/>
  <rect x="36" y="447" width="228" height="7" rx="3.5" fill="#202A32"/>
  <rect x="-24" y="558" width="348" height="10" rx="2" fill="#1E272E"/>
  <rect x="300" y="644" width="152" height="152" fill="#E1E6E3"/>
  <rect x="296" y="636" width="160" height="10" rx="2" fill="#26313A"/>
  <rect x="300" y="783" width="152" height="13" fill="#C6CEC9"/>
  <g fill="url(#ej-g-glass)" stroke="#27323B" stroke-width="4">
    <rect x="26" y="664" width="156" height="108" rx="2"/>
    <rect x="34" y="588" width="96" height="52" rx="2"/>
    <rect x="168" y="588" width="96" height="52" rx="2"/>
    <rect x="318" y="678" width="80" height="62" rx="2"/>
    <rect x="252" y="690" width="12" height="106" stroke-width="2.5"/>
  </g>
  <path d="M104,664 V772 M82,588 V640 M216,588 V640" stroke="#27323B" stroke-width="3"/>
  <rect x="206" y="690" width="40" height="106" rx="2" fill="#36424C"/>
  <rect x="238" y="738" width="3" height="16" rx="1.5" fill="#C8D1D6"/>
  <rect x="428" y="686" width="16" height="28" rx="3" fill="#F7F9F8" stroke="#99A5AB" stroke-width="1.5"/>
  <rect x="456" y="796" width="452" height="17" fill="#C3CAC6"/>
  <rect x="495" y="716" width="10" height="82" fill="#2C363E"/>
  <rect x="484" y="690" width="32" height="58" rx="9" fill="#F3F5F4" stroke="#C3CBCF" stroke-width="1.5"/>
  <rect x="489" y="696" width="22" height="46" rx="6" fill="#1C252C"/>
  <circle cx="500" cy="712" r="6" fill="none" stroke="#3B4A52" stroke-width="2"/>
  <rect x="486" y="795" width="28" height="6" rx="2" fill="#29323A"/>
</g>`;

// grille des panneaux (2 rangées × 6 colonnes, légère perspective)
function pvGrid() {
  const top = [48.5, 251.5], bot = [4.4, 295.6];
  let d = 'M26.5,507 L273.5,507';
  for (let k = 1; k < 6; k++) {
    const t = k / 6;
    d += ` M${f(top[0] + t * (top[1] - top[0]))},466 L${f(bot[0] + t * (bot[1] - bot[0]))},548`;
  }
  return d;
}

const TREES = `
<g id="ej-tree"><rect x="-5" y="-62" width="10" height="62" rx="3" fill="#6B5A49"/><circle cx="0" cy="-102" r="44" fill="#5B9381"/><circle cx="-30" cy="-78" r="30" fill="#538A78"/><circle cx="31" cy="-76" r="32" fill="#57907D"/><circle cx="-12" cy="-118" r="20" fill="#72AA96" opacity=".85"/></g>
<g id="ej-tree-tall"><rect x="-4" y="-44" width="8" height="44" rx="3" fill="#6B5A49"/><ellipse cx="0" cy="-122" rx="27" ry="88" fill="#4F8B78"/><ellipse cx="-9" cy="-136" rx="11" ry="56" fill="#6CA591" opacity=".85"/></g>
<g id="ej-lamp"><path d="M0,0 V-150 Q0,-160 10,-160 H32" fill="none" stroke="#3A454F" stroke-width="4" stroke-linecap="round"/><rect x="22" y="-164" width="20" height="7" rx="3" fill="#2F3942"/></g>`;

const TREE_SPOTS = [
  [-430, 'tree', 1.1], [-330, 'tall', 0.95], [-230, 'tree', 1.15], [-120, 'tall', 1],
  [1010, 'tree', 0.95], [1100, 'tall', 0.9], [1480, 'tree', 1.1], [1590, 'tall', 0.85, 'sm'],
  [2060, 'tree', 0.9, 'sm'], [2290, 'tall', 1.05], [2350, 'tree', 1.2], [2860, 'tree', 0.95, 'sm'],
  [3180, 'tall', 0.9], [3300, 'tree', 1], [3470, 'tree', 1.1],
  [4610, 'tree', 1.1], [4720, 'tall', 1], [5050, 'tree', 1, 'sm'], [5400, 'tree', 1.15], [5700, 'tall', 0.9]
];
export const LAMPS = [1240, 1820, 2400, 2980, 3540];

function worldLayer() {
  const m = -1600, lw = 7600;
  const trees = TREE_SPOTS.map(([x, kind, s, sm]) =>
    `<use href="#ej-${kind === 'tall' ? 'tree-tall' : 'tree'}"${sm ? ' class="ej-sm-hide"' : ''} transform="translate(${x} ${f(roadY(x) - 30)}) scale(${s})"/>`).join('');
  const lamps = LAMPS.map((x) => `<use href="#ej-lamp" transform="translate(${x} ${f(roadY(x) - 4)})"/>`).join('');
  const houses = HOUSES.map((x) => `<use href="#ej-house" transform="translate(${x} 0)"/>`).join('');
  // ventilateurs des pompes à chaleur (celui de la maison du soir tourne quand le V2H l'alimente)
  const fans = HOUSES.map((x, i) => `<g transform="translate(${x - 41} 774)"><g class="ej-fan" id="ej-fan-${i + 1}">` +
    [0, 120, 240].map((a) => `<path transform="rotate(${a})" d="M0,0 C4,-3 5,-9 1,-10.5 C-2,-8 -2,-3 0,0 Z"/>`).join('') +
    '</g></g>').join('');
  const cables = HOUSES.map((x, i) => {
    const o = x - 120;
    return `<path class="ej-cable" id="ej-cable-${i + 1}" d="M${620 + o},748 C${644 + o},800 ${676 + o},806 ${679 + o},762"/>`;
  }).join('');
  const lawn = `M${m},${H}` + profile(-30) + ` L${m + lw},${H} Z`;
  const road = `M${m},812` + profile(0).slice(1).replace(/^L[^ ]+/, '') + profileReverse(26) + ' Z';
  const ground = `M${m},${H}` + profile(27) + ` L${m + lw},${H} Z`;
  // trajectoire de la voiture : sortie d'allée → route (collines) → allée de la maison, le soir
  const carPath = `M805,808 C975,808 980,824 1150,824` + profile(12, 1, 5).replace(/^ L[^ ]+/, '') +
    ` L4060,824 C4230,824 4235,808 ${805 + LOOP},808`;
  const body = `
<defs>
  <linearGradient id="ej-g-pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27406A"/><stop offset="1" stop-color="#101B2E"/></linearGradient>
  <linearGradient id="ej-g-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DCEAF1"/><stop offset=".5" stop-color="#A9C3D2"/><stop offset="1" stop-color="#7F9FB3"/></linearGradient>
  <linearGradient id="ej-g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5F7F5"/><stop offset="1" stop-color="#E2E7E4"/></linearGradient>
  ${TREES}
  ${HOUSE}
</defs>
<path d="${lawn}" fill="#76A391"/>
${trees}
${lamps}
${houses}
<g fill="#7D8A91">${fans}</g>
${cables}
<path d="${road}" fill="#3A4550"/>
<path d="M${m},812${profile(0).slice(1).replace(/^L[^ ]+/, '')}" fill="none" stroke="#5A6670" stroke-width="2"/>
<path d="M${m},827${profile(15).slice(1).replace(/^L[^ ]+/, '')}" fill="none" stroke="#E6ECEF" stroke-opacity=".5" stroke-width="2.2" stroke-dasharray="26 24"/>
<path d="${ground}" fill="#4B7767"/>
<path d="M${m},839${profile(27).slice(1).replace(/^L[^ ]+/, '')}" fill="none" stroke="#86939A" stroke-width="3"/>
<path id="ej-car-path" d="${carPath}" fill="none" stroke="none"/>`;
  return layer('world', m, lw, 1, body);
}

/* ───────────────────────── calque lumineux (au-dessus de la nuit) ───────────────────────── */

function flow(id, kind, d, extra = '') {
  return `<g class="ej-flow ej-flow--${kind}${extra}" id="${id}"><path class="ej-f-halo" d="${d}"/><path class="ej-f-core" d="${d}"/><path class="ej-f-dots" d="${d}"/></g>`;
}
function win(id, x, y, w, h, mull = []) {
  const bars = mull.map((mx) => `M${x + mx},${y} V${y + h}`).join(' ');
  return `<g class="ej-win" id="${id}"><rect x="${x - 46}" y="${y - 40}" width="${w + 92}" height="${h + 80}" fill="url(#ej-g-halo-win)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#ej-g-win)"/>` +
    (bars ? `<path d="${bars}" stroke="#3A3326" stroke-opacity=".55" stroke-width="3"/>` : '') + '</g>';
}
function led(id, cx, cy, r, kind) {
  return `<g class="ej-led ej-led--${kind}" id="${id}"><circle cx="${cx}" cy="${cy}" r="${r * 3}" fill="url(#ej-g-halo-${kind})"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="${f(r * 0.45)}"/></g>`;
}

function glowLayer() {
  const m = -1600, lw = 7600;
  const [A, B] = HOUSES;              // maison du matin / maison du soir
  // rayons du soleil → panneaux (maison du matin)
  const rays = [190, 260, 330].map((x) => {
    const x1 = x + (A - 120), y1 = 505, x0 = x1 + 198, y0 = y1 - 169;
    return `<line class="ej-ray" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/><line class="ej-ray-core" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
  }).join('');
  const pv = (dx) => `M${48.5 + dx},466 L${251.5 + dx},466 L${295.6 + dx},548 L${4.4 + dx},548 Z`;
  const gridA = pvGrid().replace(/(-?\d+\.?\d*),(\d+)/g, (_, x, y) => `${f(+x + A)},${y}`);
  const solar = `M${A + 260},528 L${A + 306},556 Q${A + 314},561 ${A + 314},570 L${A + 314},624 Q${A + 314},636 ${A + 326},636 ` +
    `L${A + 424},636 Q${A + 436},636 ${A + 436},648 L${A + 436},776 Q${A + 436},786 ${A + 446},786 L${A + 488},786 Q${A + 500},786 ${A + 500},774 L${A + 500},748`;
  const charge = `M${A + 500},748 C${A + 524},800 ${A + 556},806 ${A + 559},762`;
  const v2h = `M${B + 559},762 C${B + 556},806 ${B + 524},800 ${B + 500},748 L${B + 500},780 Q${B + 500},792 ${B + 490},792 ` +
    `L${B + 446},792 Q${B + 436},792 ${B + 436},782 L${B + 436},714`;
  const branches = [
    `M${B + 428},702 C${B + 416},702 ${B + 408},708 ${B + 400},709`,
    `M${B + 428},708 C${B + 380},770 ${B + 240},778 ${B + 184},752`,
    `M${B + 430},694 C${B + 400},640 ${B + 320},612 ${B + 266},614`,
    `M${B + 430},712 C${B + 340},812 ${B + 100},812 ${B - 12},776`
  ];
  const lamps = LAMPS.map((x, i) => {
    const b = f(roadY(x) - 4);
    return `<g class="ej-lamp" id="ej-lamp-${i + 1}"><path d="M${x + 24},${f(b - 156)} L${x + 40},${f(b - 156)} L${x + 96},${f(b + 22)} L${x - 32},${f(b + 22)} Z" fill="url(#ej-g-cone)"/>` +
      `<circle cx="${x + 32}" cy="${f(b - 154)}" r="30" fill="url(#ej-g-halo-warm)"/><ellipse cx="${x + 32}" cy="${f(b - 156)}" rx="9" ry="3.4" fill="#FFE9B5"/></g>`;
  }).join('');
  const body = `
<defs>
  <radialGradient id="ej-g-halo-mint"><stop offset="0" stop-color="#3DF5C2" stop-opacity=".75"/><stop offset="1" stop-color="#3DF5C2" stop-opacity="0"/></radialGradient>
  <radialGradient id="ej-g-halo-amber"><stop offset="0" stop-color="#FFB547" stop-opacity=".8"/><stop offset="1" stop-color="#FFB547" stop-opacity="0"/></radialGradient>
  <radialGradient id="ej-g-halo-warm"><stop offset="0" stop-color="#FFD98F" stop-opacity=".55"/><stop offset="1" stop-color="#FFD98F" stop-opacity="0"/></radialGradient>
  <linearGradient id="ej-g-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6B0"/><stop offset="1" stop-color="#F2B45C"/></linearGradient>
  <radialGradient id="ej-g-halo-win"><stop offset="0" stop-color="#FFC870" stop-opacity=".42"/><stop offset=".55" stop-color="#FFC870" stop-opacity=".14"/><stop offset="1" stop-color="#FFC870" stop-opacity="0"/></radialGradient>
  <linearGradient id="ej-g-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE2A6" stop-opacity=".42"/><stop offset="1" stop-color="#FFE2A6" stop-opacity="0"/></linearGradient>
  <linearGradient id="ej-g-ray" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4CF" stop-opacity="0"/><stop offset="1" stop-color="#FFF1C2" stop-opacity=".85"/></linearGradient>
  <linearGradient id="ej-g-glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="ej-clip-pv"><path d="${pv(A)}"/></clipPath>
</defs>
<g id="ej-rays" class="ej-hide-init">${rays}</g>
<g clip-path="url(#ej-clip-pv)"><rect id="ej-glint" x="${A - 60}" y="440" width="64" height="130" fill="url(#ej-g-glint)" transform="skewX(-22)"/></g>
<g id="ej-pv-on" class="ej-hide-init"><path d="${pv(A)}" fill="#3DF5C2" fill-opacity=".1" stroke="#5BF5C8" stroke-width="1.6"/><path d="${gridA}" fill="none" stroke="#5BF5C8" stroke-opacity=".8" stroke-width="1.4"/></g>
${win('ej-win-dawn', A + 34, 588, 96, 52, [48])}
${flow('ej-flow-solar', 'sun', solar)}
${flow('ej-flow-charge', 'sun', charge)}
${led('ej-boxled-1', A + 436, 694, 2.8, 'mint')}
${led('ej-led-1', A + 500, 712, 6, 'mint')}
${win('ej-win-kitchen', B + 318, 678, 80, 62)}
${win('ej-win-living', B + 26, 664, 156, 108, [78])}
${win('ej-win-up2', B + 168, 588, 96, 52, [48])}
${win('ej-win-up1', B + 34, 588, 96, 52, [48])}
${branches.map((d, i) => flow(`ej-flow-b${i + 1}`, 'v2h', d, ' ej-flow--thin')).join('\n')}
${flow('ej-flow-v2h', 'v2h', v2h)}
${led('ej-boxled-2', B + 436, 694, 2.8, 'amber')}
${led('ej-led-2', B + 500, 712, 6, 'amber')}
${led('ej-hpled', B - 22, 756, 2.2, 'amber')}
<g id="ej-lamps">${lamps}</g>`;
  return layer('glow', m, lw, 1, body);
}

/* ───────────────────────── premier plan ───────────────────────── */

function frontLayer() {
  const m = -2200, lw = 9800;
  const bush = (x) => `<circle cx="${x}" cy="902" r="42"/><circle cx="${x + 40}" cy="906" r="33"/><circle cx="${x - 36}" cy="908" r="29"/>`;
  const bushes = [-1900, -1100, -300, 420, 1150, 1900, 2650, 3350, 4100, 4800, 5500, 6250, 7000].map(bush).join('');
  const tall = (x) => `<g class="ej-sm-hide" transform="translate(${x} 930) scale(1.9)"><rect x="-4" y="-44" width="8" height="44" rx="3" fill="#3F3A33"/><ellipse cx="0" cy="-122" rx="27" ry="88" fill="#3D6A5A"/><ellipse cx="-9" cy="-136" rx="11" ry="56" fill="#4C7C6B"/></g>`;
  return layer('front', m, lw, 1.3, `<g fill="#43705E">${bushes}</g>${tall(2300)}${tall(3400)}`);
}

/* ───────────────────────── voiture ───────────────────────── */

const BODY = 'M20,96 L16,76 C16,66 22,60 32,57 L60,42 C68,37 76,35 86,35 L168,34 C184,34 194,38 204,45 L234,63 C256,65 274,68 283,73 C290,77 292,85 290,92 L287,96 L257,96 A25,25 0 0 0 207,96 L95,96 A25,25 0 0 0 45,96 Z';
function wheel(id, cx) {
  const spokes = [-90, -18, 54, 126, 198].map((a) => {
    const r = (a * Math.PI) / 180;
    return `M${cx},92 L${f(cx + Math.cos(r) * 12.5)},${f(92 + Math.sin(r) * 12.5)}`;
  }).join(' ');
  return `<circle cx="${cx}" cy="92" r="21" fill="#1B2228"/><g id="${id}"><circle cx="${cx}" cy="92" r="13.5" fill="#A6B2B9"/><path d="${spokes}" stroke="#6E7C85" stroke-width="2.6" stroke-linecap="round"/><circle cx="${cx}" cy="92" r="4" fill="#4B5860"/></g>`;
}
function carBody() {
  return `<div class="ej-car" id="ej-car"><svg viewBox="-40 0 640 120" focusable="false">
<defs>
  <linearGradient id="ej-g-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8FAFB"/><stop offset=".55" stop-color="#E3E9EC"/><stop offset="1" stop-color="#C3CDD3"/></linearGradient>
  <linearGradient id="ej-g-cabin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2C3A47"/><stop offset=".62" stop-color="#1A252F"/><stop offset="1" stop-color="#36495C"/></linearGradient>
  <clipPath id="ej-clip-body"><path d="${BODY}"/></clipPath>
</defs>
<ellipse cx="150" cy="114" rx="134" ry="5.5" fill="#000" opacity=".2"/>
<path d="${BODY}" fill="url(#ej-g-body)"/>
<rect x="0" y="80" width="300" height="20" fill="#B5C1C8" opacity=".55" clip-path="url(#ej-clip-body)"/>
<path d="M66,46 L88,40 L166,39 C178,39 187,42 195,47 L220,62 L66,62 Z" fill="url(#ej-g-cabin)"/>
<path d="M128,38 L131,62" stroke="#EDF1F3" stroke-width="5"/>
<path d="M131,62 L133,94 M200,52 L202,92" stroke="#C2CCD1" stroke-width="1.3" fill="none"/>
<rect x="100" y="66" width="16" height="3.5" rx="1.75" fill="#8F9CA4"/><rect x="164" y="66" width="16" height="3.5" rx="1.75" fill="#8F9CA4"/>
<path d="M200,50 L214,48 L214,56 L204,57 Z" fill="#1E2A33"/>
<rect x="18" y="58" width="12" height="8" rx="2" fill="#D3DCE0" stroke="#A9B5BB" stroke-width="1"/>
<path d="M262,69 L286,75" stroke="#AEBBC2" stroke-width="4" stroke-linecap="round"/>
<path d="M17,70 L31,64" stroke="#7D3B3B" stroke-width="4" stroke-linecap="round"/>
${wheel('ej-wheel-r', 70)}
${wheel('ej-wheel-f', 232)}
</svg></div>`;
}
function carGlow() {
  return `<div class="ej-car ej-carglow" id="ej-carglow"><svg viewBox="-40 0 640 120" focusable="false">
<defs>
  <linearGradient id="ej-g-beam" gradientUnits="userSpaceOnUse" x1="288" y1="0" x2="600" y2="0"><stop offset="0" stop-color="#FFF6DC" stop-opacity=".55"/><stop offset="1" stop-color="#FFF6DC" stop-opacity="0"/></linearGradient>
  <linearGradient id="ej-g-bat" gradientUnits="userSpaceOnUse" x1="100" y1="0" x2="206" y2="0"><stop offset="0" stop-color="#00C896"/><stop offset="1" stop-color="#5CF3C8"/></linearGradient>
  <radialGradient id="ej-g-tail"><stop offset="0" stop-color="#FF4D4D" stop-opacity=".7"/><stop offset="1" stop-color="#FF4D4D" stop-opacity="0"/></radialGradient>
  <radialGradient id="ej-g-head"><stop offset="0" stop-color="#F2FAFF" stop-opacity=".8"/><stop offset="1" stop-color="#F2FAFF" stop-opacity="0"/></radialGradient>
</defs>
<path id="ej-beam" d="M288,72 L600,46 L600,106 L288,82 Z" fill="url(#ej-g-beam)" opacity="0"/>
<circle id="ej-headhalo" cx="284" cy="74" r="12" fill="url(#ej-g-head)" opacity="0"/>
<path d="M263,69.5 L285,75" stroke="#F4FBFF" stroke-width="3" stroke-linecap="round"/>
<g id="ej-tail" opacity=".3"><circle cx="24" cy="67" r="16" fill="url(#ej-g-tail)"/><path d="M18,69.5 L30,64.5" stroke="#FF5A5A" stroke-width="3" stroke-linecap="round"/></g>
<path d="M100,91 L206,91" stroke="#0E1A20" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>
<path id="ej-bat" d="M100,91 L206,91" stroke="url(#ej-g-bat)" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="106 106" stroke-dashoffset="83"/>
<circle id="ej-port-sun" cx="24" cy="62" r="2.6" fill="#3DF5C2" opacity="0"/>
<circle id="ej-port-v2h" cx="24" cy="62" r="2.6" fill="#FFB547" opacity="0"/>
</svg></div>`;
}

/* ───────────────────────── assemblage ───────────────────────── */

function layer(name, m, lw, d, inner) {
  return `<div class="ej-layer ej-layer--${name}" style="--m:${m};--lw:${lw};--d:${d}"><svg viewBox="${m} 0 ${lw} ${H}" focusable="false">${inner}</svg></div>`;
}

function stage() {
  return `<div class="ej-stage" aria-hidden="true">
  <div class="ej-sky">
    <div class="ej-sky-l ej-sky-dawn"></div><div class="ej-sky-l ej-sky-day"></div><div class="ej-sky-l ej-sky-sunset"></div><div class="ej-sky-l ej-sky-night"></div>
    <div class="ej-stars"></div>
    <div class="ej-sun"><i class="ej-sun-halo"></i><i class="ej-sun-core"></i><i class="ej-sun-core ej-sun-core--set"></i></div>
    <div class="ej-moon"></div>
  </div>
  <div class="ej-scene">
    ${farLayer()}
    ${backLayer()}
    ${midLayer()}
    ${worldLayer()}
    ${carBody()}
    ${frontLayer()}
  </div>
  <div class="ej-ground"></div>
  <div class="ej-tint ej-tint--sunset"></div>
  <div class="ej-tint ej-tint--night"></div>
  <div class="ej-scene ej-scene--glow">
    ${glowLayer()}
    ${carGlow()}
  </div>
  <div class="ej-chip" id="ej-chip"><span class="ej-chip-bat"><i></i></span><b class="ej-chip-val">22 %</b><span class="ej-chip-lbl ej-chip-lbl--sun" data-nl="zonnestroom" data-fr="énergie solaire">zonnestroom</span><span class="ej-chip-lbl ej-chip-lbl--v2h" data-nl="V2H → woning" data-fr="V2H → maison">V2H → woning</span></div>
</div>`;
}

const out = stage()
  .replace(/\n\s*\n/g, '\n')
  .replace(/>\s+</g, '><');

const FILE = new URL('../index.html', import.meta.url);
const html = readFileSync(FILE, 'utf8');
const START = '<!-- EJ:STAGE:START -->', END = '<!-- EJ:STAGE:END -->';
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < 0) throw new Error('Marqueurs EJ:STAGE introuvables dans index.html');
writeFileSync(FILE, html.slice(0, a + START.length) + '\n' + out + '\n' + html.slice(b));
console.log(`✅ Scène Energy Journey injectée (${(out.length / 1024).toFixed(1)} Ko)`);
