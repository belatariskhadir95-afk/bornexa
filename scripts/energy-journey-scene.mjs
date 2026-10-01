// BORNEXA — « Energy Journey » (homepage)
// Génère la scène vectorielle (calques SVG de la séquence au scroll) et l'injecte
// dans index.html entre <!-- EJ:STAGE:START --> et <!-- EJ:STAGE:END -->.
//
//   node scripts/energy-journey-scene.mjs
//
// Toute la géométrie partagée avec js/energy-journey/ (route, maisons, borne, flux)
// est définie ici. Si une coordonnée change, garder js/energy-journey/timeline.js aligné.
// Le dessin commun (maison, voiture, arbres…) vient de scripts/scene-kit.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import {
  H, f, seg, hills, pvGrid, houseSymbol, houseGradients, treeSymbols,
  flow as kitFlow, win as kitWin, led as kitLed, glowGradients, carBodySvg, carGlowSvg, compact, inject
} from './scene-kit.mjs';

const P = 'ej';
const flow = (...a) => kitFlow(P, ...a);
const win = (...a) => kitWin(P, ...a);
const led = (...a) => kitLed(P, ...a);

const LOOP = 3600;                 // maison → même maison, le soir (voir timeline.js)
const HOUSES = [120, 120 + LOOP];  // x monde de chaque maison

// Profil de la route (bord supérieur) : tangentes horizontales à chaque point.
const ROAD = [[-1600, 812], [1150, 812], [1700, 782], [2200, 818], [2700, 792], [3350, 812], [6000, 812]];

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
  ${houseGradients(P)}
  ${treeSymbols(P)}
  ${houseSymbol(P)}
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
  ${glowGradients(P)}
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

function carBody() {
  return `<div class="ej-car" id="ej-car">${carBodySvg(P)}</div>`;
}
function carGlow() {
  return `<div class="ej-car ej-carglow" id="ej-carglow">${carGlowSvg(P)}</div>`;
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

const out = compact(stage());
inject(new URL('../index.html', import.meta.url), '<!-- EJ:STAGE:START -->', '<!-- EJ:STAGE:END -->', out, readFileSync, writeFileSync);
console.log(`✅ Scène Energy Journey injectée (${(out.length / 1024).toFixed(1)} Ko)`);
