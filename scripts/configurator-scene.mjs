// BORNEXA — configurateur de devis : scène vectorielle « du plan au réel »
// Génère la scène et l'injecte dans devis.html entre <!-- CF:STAGE:START --> et <!-- CF:STAGE:END -->.
//
//   node scripts/configurator-scene.mjs
//
// Chaque objet existe en deux versions : « plan » (.cf-bp, traits d'architecte, clonée au chargement) et
// « construit » (.cf-solid, illustré). js/configurator/scene.js bascule de l'une à l'autre
// selon les réponses. Coordonnées en unités de scène (hauteur 900, monde 0 → 1800).
// Repères partagés avec js/configurator/scene.js : voiture garée (845, 808), coffret (596, 686→714).
import { readFileSync, writeFileSync } from 'node:fs';
import {
  H, f, hills, houseParts, houseGradients, pvGrid, PV_OUTLINE, CAR_BODY,
  flow as kitFlow, win as kitWin, led as kitLed, glowGradients, carBodySvg, carGlowSvg, compact, inject
} from './scene-kit.mjs';

const P = 'cf';
const flow = (...a) => kitFlow(P, ...a);
const win = (...a) => kitWin(P, ...a);
const led = (...a) => kitLed(P, ...a);
const W = 1800;                  // largeur du monde
const X0 = 160;                  // origine du bâtiment
const PORT = [236, 60];          // trappe de charge à l'avant (voiture garée nez vers la borne)

/* objet « plan → construit » */
// la version « plan » (.cf-bp) est clonée depuis .cf-solid par js/configurator/scene.js (page plus légère)
const obj = (id, inner, extra = '') => `<g class="cf-o" id="cf-o-${id}"${extra}><g class="cf-solid">${inner}</g></g>`;
const at = (x, inner) => `<g transform="translate(${x} 0)">${inner}</g>`;

/* ───────────────────────── route d'approche (perspective) ───────────────────────── */

// trajectoire du point de contact des roues : du lointain (colline à droite) à l'allée
const CAR_SEGS = [
  [[1760, 664], [1640, 664], [1560, 672], [1460, 690]],
  [[1460, 690], [1360, 708], [1300, 742], [1210, 770]],
  [[1210, 770], [1120, 798], [1030, 808], [930, 808]]
];
const PARK = [845, 808];
function bez(s, t) {
  const m = 1 - t;
  const a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
  return [a * s[0][0] + b * s[1][0] + c * s[2][0] + d * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + d * s[3][1]];
}
function carPathD() {
  return `M${CAR_SEGS[0][0]}` + CAR_SEGS.map((s) => ` C${s[1]} ${s[2]} ${s[3]}`).join('') + ` L${PARK}`;
}
function roadShape() {
  const pts = [];
  CAR_SEGS.forEach((s, i) => { for (let k = i ? 1 : 0; k <= 24; k++) pts.push(bez(s, k / 24)); });
  pts.push(PARK, [760, 808]);
  const w = (y) => 7 + 23 * Math.max(0, Math.min(1, (y - 664) / 144));
  const top = pts.map(([x, y]) => `${f(x)},${f(y - 0.42 * w(y))}`);
  const bot = pts.map(([x, y]) => `${f(x)},${f(y + 0.58 * w(y))}`).reverse();
  const mid = pts.slice(0, -2).map(([x, y]) => `${f(x)},${f(y + 0.16 * w(y))}`);
  return { band: `M${top.join(' L')} L${bot.join(' L')} Z`, mid: `M${mid.join(' L')}` };
}

/* ───────────────────────── décor ───────────────────────── */

function treeAt(x, y, s, tall) {
  const inner = tall
    ? '<rect x="-4" y="-44" width="8" height="44" rx="3" fill="#6B5A49"/><ellipse cx="0" cy="-122" rx="27" ry="88" fill="#4F8B78"/><ellipse cx="-9" cy="-136" rx="11" ry="56" fill="#6CA591" opacity=".85"/>'
    : '<rect x="-5" y="-62" width="10" height="62" rx="3" fill="#6B5A49"/><circle cx="0" cy="-102" r="44" fill="#5B9381"/><circle cx="-30" cy="-78" r="30" fill="#538A78"/><circle cx="31" cy="-76" r="32" fill="#57907D"/><circle cx="-12" cy="-118" r="20" fill="#72AA96" opacity=".85"/>';
  return `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
}

function farLayer() {
  const ridge = hills({ x0: -200, x1: W + 200, step: 380, yMin: 596, yMax: 626, seed: 5, bottom: 760 });
  const mid = hills({ x0: -200, x1: W + 200, step: 300, yMin: 650, yMax: 700, seed: 17, bottom: 900 });
  let dots = '';
  mid.pts.forEach(([x, y], i) => { if (i % 3 === 1) dots += `<circle cx="${x}" cy="${f(y - 8)}" r="14"/><circle cx="${f(x + 16)}" cy="${f(y - 2)}" r="10"/>`; });
  return `<div class="cf-layer cf-layer--far" style="--lw:${W};--d:.45"><svg viewBox="0 0 ${W} ${H}" focusable="false">` +
    obj('far', `<path d="${ridge.d}" fill="#B8CDD4"/><path d="${mid.d}" fill="#93B6A8"/><g fill="#82A898">${dots}</g>`) +
    '</svg></div>';
}

/* ───────────────────────── bâtiments (selon « Type project ») ───────────────────────── */

function buildingWoning() {
  const h = houseParts(P);
  return h.hedge + h.heatpump + h.walls + h.roofEdges + h.annex + h.windows + h.door + h.box;
}
function buildingBedrijf() {
  const mull = [74, 126, 178, 230, 282].map((x) => `M${x},572 V768`).join(' ');
  return `<rect x="-10" y="540" width="380" height="12" rx="2" fill="#26313A"/>
  <rect x="0" y="552" width="360" height="244" fill="url(#cf-g-wall)"/>
  <rect x="0" y="783" width="360" height="13" fill="#CBD2CE"/>
  <rect x="22" y="572" width="316" height="196" rx="2" fill="url(#cf-g-glass)" stroke="#27323B" stroke-width="4"/>
  <path d="${mull} M22,637 H338 M22,703 H338" stroke="#27323B" stroke-width="2.5"/>
  <rect x="136" y="704" width="88" height="8" rx="2" fill="#26313A"/>
  <rect x="150" y="712" width="60" height="84" fill="#36424C"/>
  <rect x="360" y="640" width="92" height="156" fill="#DDE3E1"/>
  <rect x="356" y="632" width="100" height="10" rx="2" fill="#26313A"/>
  <rect x="360" y="783" width="92" height="13" fill="#C6CEC9"/>
  <rect x="374" y="664" width="40" height="56" rx="2" fill="url(#cf-g-glass)" stroke="#27323B" stroke-width="3"/>
  <rect x="428" y="686" width="16" height="28" rx="3" fill="#F7F9F8" stroke="#99A5AB" stroke-width="1.5"/>`;
}
function buildingAppartement() {
  let w = '', b = '';
  for (const y of [490, 566, 642]) {
    for (const x of [24, 108, 192, 276]) w += `<rect x="${x}" y="${y}" width="66" height="50" rx="2"/>`;
    b += `<rect x="14" y="${y + 52}" width="164" height="6" rx="2" fill="#26313A"/><rect x="14" y="${y + 30}" width="164" height="22" fill="#A9C3D2" fill-opacity=".35" stroke="#27323B" stroke-width="1.5"/>`;
  }
  return `<rect x="-8" y="460" width="396" height="12" rx="2" fill="#26313A"/>
  <rect x="0" y="472" width="380" height="324" fill="url(#cf-g-wall)"/>
  <rect x="0" y="783" width="380" height="13" fill="#CBD2CE"/>
  <g fill="url(#cf-g-glass)" stroke="#27323B" stroke-width="3">${w}<rect x="24" y="722" width="66" height="50" rx="2"/><rect x="276" y="722" width="66" height="50" rx="2"/></g>
  ${b}
  <rect x="160" y="718" width="48" height="78" fill="#36424C"/>
  <rect x="380" y="690" width="72" height="106" fill="#DDE3E1"/>
  <rect x="376" y="682" width="80" height="10" rx="2" fill="#26313A"/>
  <rect x="390" y="732" width="34" height="64" fill="#5A6770"/>
  <rect x="428" y="686" width="16" height="28" rx="3" fill="#F7F9F8" stroke="#99A5AB" stroke-width="1.5"/>`;
}
function smallCar(x) {
  return `<g transform="translate(${x} 735) scale(.5)"><path d="${CAR_BODY}" fill="#8E9AA2"/><path d="M66,46 L88,40 L166,39 C178,39 187,42 195,47 L220,62 L66,62 Z" fill="#2E3A44"/><circle cx="70" cy="92" r="21" fill="#1B2228"/><circle cx="232" cy="92" r="21" fill="#1B2228"/></g>`;
}
function buildingParking() {
  const cols = [-14, 150, 314, 436].map((x) => `<rect x="${x}" y="662" width="9" height="134" fill="#3A4650"/>`).join('');
  return `<rect x="-40" y="796" width="500" height="17" fill="#4A5560"/>
  <path d="M-20,800 V812 M140,800 V812 M300,800 V812 M450,800 V812" stroke="#E6ECEF" stroke-width="2.5"/>
  ${smallCar(4)}${smallCar(168)}
  ${cols}
  <rect x="-30" y="650" width="490" height="12" rx="3" fill="#2C3640"/>
  <rect x="428" y="686" width="16" height="28" rx="3" fill="#F7F9F8" stroke="#99A5AB" stroke-width="1.5"/>`;
}

/* panneaux photovoltaïques, un jeu par type de bâtiment */
function pvRows(xs, y0, len, rise) {
  return xs.map((x) => `<path d="M${x},${y0} L${x + len},${y0} L${x + len + 12},${y0 - rise} L${x + 12},${y0 - rise} Z" fill="url(#cf-g-pv)" stroke="#9DB0C2" stroke-opacity=".7" stroke-width="1.4"/>` +
    `<path d="M${x + len / 2},${y0} L${x + len / 2 + 12},${y0 - rise}" stroke="#9DB0C2" stroke-opacity=".5" stroke-width="1.1"/>`).join('');
}
const PV = {
  woning: houseParts(P).pv,
  bedrijf: pvRows([24, 134, 244], 540, 92, 24),
  appartement: pvRows([20, 120, 220], 460, 84, 22),
  parking: pvRows([-20, 100, 220, 340], 650, 108, 22)
};
/* trajet de l'énergie solaire : panneaux → coffret (haut du coffret = 596, 686) */
const SOLAR = {
  woning: 'M420,528 L466,556 Q474,561 474,570 L474,624 Q474,636 486,636 L584,636 Q596,636 596,648 L596,686',
  bedrijf: 'M420,526 L520,526 Q532,526 532,538 L532,620 Q532,632 544,632 L584,632 Q596,632 596,644 L596,686',
  appartement: 'M420,446 L548,446 Q560,446 560,458 L560,664 Q560,676 572,676 L584,676 Q596,676 596,686',
  parking: 'M420,636 L584,636 Q596,636 596,648 L596,686'
};
/* fenêtres qui s'allument le soir (V2H) */
const WINDOWS = {
  woning: [[318, 678, 80, 62], [26, 664, 156, 108, [78]], [168, 588, 96, 52, [48]], [34, 588, 96, 52, [48]]],
  bedrijf: [[22, 706, 316, 62, [52, 104, 156, 208, 260]], [22, 639, 316, 63, [52, 104, 156, 208, 260]], [22, 572, 316, 64, [52, 104, 156, 208, 260]]],
  appartement: [[276, 722, 66, 50], [24, 642, 66, 50], [192, 566, 66, 50], [108, 490, 66, 50], [276, 642, 66, 50]],
  parking: []
};

/* ───────────────────────── borne (selon « Type service ») ───────────────────────── */

const CHARGER = {
  wallbox: houseParts(P).charger,
  bidi: `<rect x="495" y="716" width="10" height="82" fill="#2C363E"/>
  <rect x="480" y="680" width="40" height="68" rx="6" fill="#1F262C" stroke="#3A464F" stroke-width="1.5"/>
  <rect x="486" y="690" width="28" height="3" rx="1.5" fill="#55636D"/>
  <circle cx="500" cy="716" r="7" fill="none" stroke="#3B4A52" stroke-width="2"/>
  <rect x="486" y="795" width="28" height="6" rx="2" fill="#29323A"/>`,
  socket: `<rect x="430" y="728" width="16" height="20" rx="3" fill="#F3F5F4" stroke="#C3CBCF" stroke-width="1.5"/>
  <circle cx="438" cy="738" r="4.5" fill="none" stroke="#5A6770" stroke-width="1.5"/>
  <rect x="452" y="770" width="20" height="12" rx="3" fill="#2C363E"/>`,
  old: `<rect x="495" y="716" width="10" height="82" fill="#5E676D"/>
  <rect x="482" y="694" width="36" height="46" rx="3" fill="#9AA3A8" stroke="#6E777C" stroke-width="1.5"/>
  <rect x="488" y="702" width="24" height="10" rx="1" fill="#55606A"/>
  <rect x="486" y="795" width="28" height="6" rx="2" fill="#4A5258"/>`,
  parcel: `<rect x="456" y="774" width="28" height="22" rx="2" fill="#C9A26B" stroke="#9C7A4A" stroke-width="1.2"/>
  <path d="M456,783 H484 M470,774 V796" stroke="#9C7A4A" stroke-width="1.2"/>`
};

/* ───────────────────────── raccordement (selon « Type installatie ») ───────────────────────── */

// conducteurs : L1 brun, L2 noir, L3 gris, N bleu (couleurs normalisées)
const WIRE = { L1: '#A0663A', L2: '#3B4248', L3: '#A3A9AE', N: '#3B82F6' };
const NET = {
  mono: ['L1', 'N'],
  tri400: ['L1', 'L2', 'L3', 'N'],
  tri230: ['L1', 'L2', 'L3'],
  unknown: []
};
const GRID_D = 'M720,852 H616 Q604,852 604,840 V714';
function strands(wires) {
  if (!wires.length) return `<path d="${GRID_D}" fill="none" stroke="#7E8A91" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/>`;
  return wires.map((w, i) => `<path d="${GRID_D}" transform="translate(${f(-i * 4)} ${f(-i * 4)})" fill="none" stroke="${WIRE[w]}" stroke-width="2.6" stroke-linecap="round"/>`).join('');
}
function callout(id, label, wires) {
  const dots = wires.map((w, i) => `<circle cx="${538 + i * 13}" cy="603" r="4.5" fill="${WIRE[w]}" stroke="#0B1A14" stroke-width="1"/>`).join('');
  const tx = wires.length ? 538 + wires.length * 13 + 4 : 538;
  return `<g class="cf-net" id="cf-callout-${id}"><path d="M600,686 V622" stroke="#5CF3C8" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="3 3"/>` +
    `<rect x="522" y="586" width="${wires.length ? 156 : 64}" height="34" rx="9" fill="#04110C" fill-opacity=".9" stroke="#3DF5C2" stroke-opacity=".45" stroke-width="1.2"/>${dots}` +
    `<text x="${tx}" y="608" font-size="14" font-weight="700" fill="#F2FFFA">${label}</text></g>`;
}

/* ───────────────────────── calques ───────────────────────── */

function mainLayer() {
  const road = roadShape();
  const lawn = `M0,${H} L0,782 L${W},782 L${W},${H} Z`;
  const ground = `M0,${H} L0,846 L${W},846 L${W},${H} Z`;
  const trees = [[40, 784, 1.05, 0], [-26, 784, 1, 1], [1290, 760, .8, 0], [1380, 742, .7, 1], [1560, 700, .55, 0]]
    .map(([x, y, s, t]) => treeAt(x, y, s, t)).join('');
  const buildings = ['woning', 'bedrijf', 'appartement', 'parking'].map((b) => obj(`bld-${b}`, at(X0, {
    woning: buildingWoning, bedrijf: buildingBedrijf, appartement: buildingAppartement, parking: buildingParking
  }[b]()), ` data-variant="${b}"`)).join('');
  const pv = Object.keys(PV).map((b) => obj(`pv-${b}`, at(X0, PV[b]), ` data-variant="${b}"`)).join('');
  const chargers = Object.keys(CHARGER).map((c) => obj(`chg-${c}`, at(X0, CHARGER[c]), ` data-variant="${c}"`)).join('');
  const net = Object.keys(NET).map((n) => obj(`net-${n}`, strands(NET[n]), ` data-variant="${n}"`)).join('');
  return `<div class="cf-layer cf-layer--main" style="--lw:${W};--d:1"><svg viewBox="0 0 ${W} ${H}" focusable="false">
<defs>${houseGradients(P)}</defs>
${obj('lawn', `<path d="${lawn}" fill="#76A391"/>`)}
${obj('trees', trees)}
${obj('road', `<path d="${road.band}" fill="#3A4550"/><path d="${road.mid}" fill="none" stroke="#E6ECEF" stroke-opacity=".45" stroke-width="2" stroke-dasharray="18 16"/>`)}
${obj('drive', '<rect x="616" y="796" width="452" height="17" fill="#C3CAC6"/>')}
${obj('ground', `<path d="${ground}" fill="#4B7767"/>`)}
${buildings}
${pv}
${net}
${chargers}
<path class="cf-cable" id="cf-cable" d="M660,748 C672,800 740,806 753,762"/>
<path class="cf-cable" id="cf-cable-socket" d="M598,748 C604,808 740,808 753,762"/>
<path id="cf-car-path" d="${carPathD()}" fill="none" stroke="none"/>
</svg></div>`;
}

function glowLayer() {
  const BOX = 'M604,700 H614 Q624,700 624,710 V776 Q624,786 634,786 H648 Q660,786 660,774 V748';
  const BOX_SOCKET = 'M604,708 Q610,708 610,716 V738 Q610,744 604,744 H598';
  const CHARGE = 'M660,748 C672,800 740,806 753,762';
  const CHARGE_SOCKET = 'M598,748 C604,808 740,808 753,762';
  const V2H = 'M753,762 C740,806 672,800 660,748 L660,780 Q660,792 650,792 L634,792 Q624,792 624,782 L624,716 Q624,706 614,706 H604';
  const branches = [
    'M588,702 C576,702 568,708 560,709',
    'M588,708 C540,770 400,778 344,752',
    'M590,694 C560,640 480,612 426,614',
    'M590,712 C500,812 260,812 148,776'
  ];
  const wins = Object.keys(WINDOWS).map((b) => `<g class="cf-wins" data-variant="${b}">` +
    WINDOWS[b].map(([x, y, w, h, m], i) => win(`cf-win-${b}-${i}`, X0 + x, y, w, h, m || [])).join('') + '</g>').join('');
  return `<div class="cf-layer cf-layer--glow" style="--lw:${W};--d:1"><svg viewBox="0 0 ${W} ${H}" focusable="false">
<defs>${glowGradients(P)}</defs>
${wins}
<g class="cf-canopy-lights" id="cf-canopy-lights"><ellipse cx="${X0 + 70}" cy="668" rx="26" ry="5" fill="#FFE9B5"/><ellipse cx="${X0 + 250}" cy="668" rx="26" ry="5" fill="#FFE9B5"/></g>
${flow('cf-flow-grid', 'sun', GRID_D)}
${Object.keys(SOLAR).map((b) => flow(`cf-flow-solar-${b}`, 'sun', SOLAR[b], ` cf-flow--solar" data-variant="${b}`)).join('\n')}
${flow('cf-flow-box', 'sun', BOX)}
${flow('cf-flow-box-socket', 'sun', BOX_SOCKET)}
${flow('cf-flow-charge', 'sun', CHARGE)}
${flow('cf-flow-charge-socket', 'sun', CHARGE_SOCKET)}
${flow('cf-flow-v2h', 'v2h', V2H)}
${branches.map((d, i) => flow(`cf-flow-b${i + 1}`, 'v2h', d, ' cf-flow--thin')).join('\n')}
${led('cf-led-box', 596, 694, 2.8, 'mint')}
${led('cf-led-chg', 660, 712, 6, 'mint')}
${led('cf-led-v2h', 660, 716, 6, 'amber')}
${callout('mono', '1×230 V', NET.mono)}
${callout('tri400', '3×400 V + N', NET.tri400)}
${callout('tri230', '3×230 V', NET.tri230)}
${callout('unknown', '?', NET.unknown)}
<g class="cf-tag" id="cf-tag"><rect x="620" y="752" width="80" height="16" rx="5" fill="#04110C" fill-opacity=".88" stroke="#3DF5C2" stroke-opacity=".4"/><text id="cf-tag-text" x="660" y="764" font-size="10.5" font-weight="700" text-anchor="middle" fill="#F2FFFA"></text></g>
<g class="cf-badge" id="cf-badge-repair"><circle cx="660" cy="660" r="15" fill="#FFB547"/><path d="M660,651 V662 M660,667 V668" stroke="#1B1306" stroke-width="3.2" stroke-linecap="round"/></g>
<g class="cf-badge" id="cf-badge-fixed"><circle cx="660" cy="660" r="15" fill="#12E3A6"/><path d="M653,660 L658,665 L667,655" fill="none" stroke="#04140E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
<g class="cf-badge" id="cf-badge-energy"><rect x="514" y="586" width="68" height="40" rx="10" fill="#04110C" fill-opacity=".9" stroke="#3DF5C2" stroke-opacity=".45"/><rect class="cf-bar" x="528" y="596" width="8" height="22" rx="2" fill="#3DF5C2"/><rect class="cf-bar" x="544" y="596" width="8" height="22" rx="2" fill="#3DF5C2"/><rect class="cf-bar" x="560" y="596" width="8" height="22" rx="2" fill="#3DF5C2"/></g>
<g class="cf-badge" id="cf-badge-advice"><path d="M302,374 h92 a12,12 0 0 1 12,12 v34 a12,12 0 0 1 -12,12 h-56 l-14,14 v-14 h-22 a12,12 0 0 1 -12,-12 v-34 a12,12 0 0 1 12,-12 z" fill="#04110C" fill-opacity=".9" stroke="#3DF5C2" stroke-opacity=".5"/><text x="348" y="412" font-size="22" font-weight="800" text-anchor="middle" fill="#5CF3C8">?</text></g>
</svg></div>`;
}

function stage() {
  return `<div class="cf-stage" aria-hidden="true">
  <div class="cf-sky">
    <div class="cf-sky-l cf-sky-day"></div><div class="cf-sky-l cf-sky-dusk"></div><div class="cf-sky-l cf-sky-night"></div>
    <div class="cf-stars"></div>
    <div class="cf-sun"><i class="cf-sun-halo"></i><i class="cf-sun-core"></i></div>
    <div class="cf-moon"></div>
  </div>
  <div class="cf-scene">
    ${farLayer()}
    ${mainLayer()}
    <div class="cf-car cf-car--bp" id="cf-car-bp">${carBodySvg(P + 'b', { port: PORT })}</div>
    <div class="cf-car" id="cf-car">${carBodySvg(P, { port: PORT })}</div>
  </div>
  <div class="cf-tint"></div>
  <div class="cf-scene cf-scene--glow">
    ${glowLayer()}
    <div class="cf-car cf-carglow" id="cf-carglow">${carGlowSvg(P, { port: PORT })}</div>
  </div>
  <div class="cf-chip" id="cf-chip"><span class="cf-chip-bat"><i></i></span><b class="cf-chip-val">22 %</b><span class="cf-chip-lbl cf-chip-lbl--sun" data-nl="laden" data-fr="recharge">laden</span><span class="cf-chip-lbl cf-chip-lbl--v2h" data-nl="V2H → woning" data-fr="V2H → maison">V2H → woning</span></div>
</div>`;
}

const out = compact(stage());
inject(new URL('../devis.html', import.meta.url), '<!-- CF:STAGE:START -->', '<!-- CF:STAGE:END -->', out, readFileSync, writeFileSync);
console.log(`✅ Scène du configurateur injectée (${(out.length / 1024).toFixed(1)} Ko)`);
