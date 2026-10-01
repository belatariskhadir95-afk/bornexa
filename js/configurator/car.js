/* BORNEXA — configurateur · la voiture
   Elle remonte la route (#cf-car-path) du lointain vers la maison à chaque étape :
   perspective (elle grandit en approchant), inclinaison selon la pente, roues
   proportionnelles à la distance. Nez vers la gauche (miroir), trappe de charge à l'avant. */
import { setter } from '../shared/scene-utils.js';

const PARK_X = 845, PARK_Y = 808;          // place devant la borne (cf. scripts/configurator-scene.mjs)
const Y_FAR = 664, S_FAR = 0.56;           // échelle de profondeur
const WHEEL_R = 21, BAT_LEN = 106;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createCar(stage, { reduced }) {
  const $ = (s) => stage.querySelector(s);
  const body = $('#cf-car'), bp = $('#cf-car-bp'), glow = $('#cf-carglow'), chip = $('#cf-chip');
  const wheels = [[$('#cf-wheel-r'), 70], [$('#cf-wheel-f'), 232], [$('#cfb-wheel-r'), 70], [$('#cfb-wheel-f'), 232]];
  const bat = $('#cf-bat'), beam = $('#cf-beam'), head = $('#cf-headhalo'), tail = $('#cf-tail');
  const portSun = $('#cf-port-sun'), portV2H = $('#cf-port-v2h');
  const chipVal = chip.querySelector('.cf-chip-val'), chipBat = chip.querySelector('.cf-chip-bat i');
  const path = $('#cf-car-path');
  const set = setter();

  // table de la trajectoire (abscisse curviligne → x, y)
  const N = 320, total = path.getTotalLength();
  const xs = new Float32Array(N + 1), ys = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) { const p = path.getPointAtLength((total * i) / N); xs[i] = p.x; ys[i] = p.y; }

  let L = null, cam = 0, sNow = total, sFrom = total, sTo = total, t0 = 0, dur = 0, raf = 0, onFrame = null;
  let dist = 0, level = 0.22, lvlFrom = 0.22, lvlTo = 0.22, lt0 = 0, ldur = 0, lastPct = -1, chipW = 0;

  /* abscisse curviligne où la route passe à l'abscisse x (x décroît le long du tracé) */
  function sAtX(x) {
    if (x >= xs[0]) return 0;
    if (x <= xs[N]) return total;
    let lo = 0, hi = N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] > x) lo = m; else hi = m; }
    const t = (xs[lo] - x) / (xs[lo] - xs[hi] || 1);
    return ((lo + t) / N) * total;
  }
  function sample(s) {
    const f = clamp(s / total) * N, i = Math.min(N - 1, Math.floor(f)), k = f - i;
    return {
      x: xs[i] + (xs[i + 1] - xs[i]) * k,
      y: ys[i] + (ys[i + 1] - ys[i]) * k,
      a: -Math.atan2(ys[i + 1] - ys[i], xs[i] - xs[i + 1])   // nez à gauche : pente « en avant »
    };
  }

  /* progression 0 → 1 (garée) ; < 0 = hors champ, à droite */
  function sFor(p) {
    if (!L) return total;
    const entry = sAtX(cam + L.Ws + 90), first = sAtX(cam + L.Ws - 200);
    if (p < 0) return entry;
    return first + (total - first) * clamp(p);
  }

  function place() {
    if (!L) return;
    const p = sample(sNow);
    if (sNow >= total - 0.5) { p.x = PARK_X; p.y = PARK_Y; p.a = 0; }
    const sc = S_FAR + (1 - S_FAR) * clamp((p.y - Y_FAR) / (PARK_Y - Y_FAR));
    const moving = raf && sTo !== sFrom ? Math.sin(Math.PI * clamp((performance.now() - t0) / dur)) : 0;
    const bob = Math.sin(dist / 30) * 0.6 * moving;
    const tx = (p.x - cam - 190) * L.u, ty = (p.y - PARK_Y + bob) * L.u;
    const tf = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${((p.a * 180) / Math.PI).toFixed(2)}deg) scale(${(-sc).toFixed(3)},${sc.toFixed(3)})`;
    set(body, 'transform', tf); set(bp, 'transform', tf); set(glow, 'transform', tf);
    const deg = ((dist / WHEEL_R) * 180) / Math.PI;
    for (const [el, cx] of wheels) if (el) el.setAttribute('transform', `rotate(${deg.toFixed(1)} ${cx} 92)`);
    // pastille au-dessus de la voiture, toujours visible à l'écran
    const half = chipW / 2 + 10;
    const cx = Math.min(L.W - half, Math.max(half, (p.x - cam) * L.u));
    set(chip, 'transform', `translate3d(${cx.toFixed(1)}px,${(ty * sc).toFixed(1)}px,0) translateX(-50%)`);
    if (onFrame) onFrame(clamp(sNow / total));
  }

  function tick(now) {
    raf = 0;
    const k = dur ? clamp((now - t0) / dur) : 1;
    const prev = sNow;
    sNow = sFrom + (sTo - sFrom) * easeInOut(k);
    dist += sNow - prev;                    // signé : les roues tournent à l'envers en marche arrière
    const lk = ldur ? clamp((now - lt0) / ldur) : 1;
    level = lvlFrom + (lvlTo - lvlFrom) * lk;
    drawLevel();
    place();
    if (k < 1 || lk < 1) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  function drawLevel() {
    set(bat, 'strokeDashoffset', (BAT_LEN * (1 - level)).toFixed(1));
    const pct = Math.round(level * 100);
    if (pct !== lastPct) { lastPct = pct; chipVal.textContent = `${pct} %`; set(chipBat, 'transform', `scaleX(${level.toFixed(3)})`); }
  }

  return {
    measure(layout, camX) {
      L = layout; cam = camX; chipW = chip.offsetWidth;
      place();
    },
    setCam(camX) { cam = camX; place(); },
    onFrame(fn) { onFrame = fn; },
    /* avance (ou recule) jusqu'à la progression p */
    go(p, { instant = false } = {}) {
      const target = sFor(p);
      if (instant || reduced || !L) { sFrom = sTo = sNow = target; place(); return 0; }
      if (Math.abs(target - sNow) < 0.5) return 0;
      sFrom = sNow; sTo = target; t0 = performance.now();
      dur = Math.min(1700, 650 + Math.abs(target - sNow) * 1.1);
      kick();
      return dur;
    },
    battery(to, ms = 0) {
      if (reduced || !ms) { level = lvlFrom = lvlTo = to; drawLevel(); return; }
      lvlFrom = level; lvlTo = to; lt0 = performance.now(); ldur = ms; kick();
    },
    port(kind) {            // '' | 'sun' | 'v2h'
      set(portSun, 'opacity', kind === 'sun' ? 1 : 0);
      set(portV2H, 'opacity', kind === 'v2h' ? 1 : 0);
    },
    lights(night) {
      set(beam, 'opacity', 0);
      set(head, 'opacity', night ? 0.9 : 0.35);
      set(tail, 'opacity', night ? 0.75 : 0.3);
    },
    chip(mode) {            // '' | 'sun' | 'v2h'
      chip.classList.toggle('is-on', !!mode);
      chip.classList.toggle('is-v2h', mode === 'v2h');
      chipW = chip.offsetWidth;
    },
    get progress() { return clamp(sNow / total); },
    destroy() { cancelAnimationFrame(raf); }
  };
}
