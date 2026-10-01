/* BORNEXA — Energy Journey · voiture électrique
   Suit une trajectoire SVG (#ej-car-path : sortie d'allée, collines, retour à la maison),
   s'incline selon la pente, roues proportionnelles à la distance parcourue,
   batterie + phares + pastille de charge. */
import { KEY, BATTERY, CAR_HOME, CAR_Y, clamp, lerp, ease, span, range, travel } from './timeline.js';
import { setter } from './sky.js';

const WHEEL_R = 21;
const BAT_LEN = 106;

export function createCar(stage) {
  const $ = (s) => stage.querySelector(s);
  const body = $('#ej-car'), glow = $('#ej-carglow'), chip = $('#ej-chip');
  const wheels = [[$('#ej-wheel-r'), 70], [$('#ej-wheel-f'), 232]];
  const bat = $('#ej-bat'), beam = $('#ej-beam'), headHalo = $('#ej-headhalo'), tail = $('#ej-tail');
  const portSun = $('#ej-port-sun'), portV2H = $('#ej-port-v2h');
  const chipVal = chip.querySelector('.ej-chip-val'), chipBat = chip.querySelector('.ej-chip-bat i');
  const set = setter();

  // table de correspondance de la trajectoire : construite quand le navigateur est libre
  // (la voiture reste garée pendant toute la première moitié de l'histoire)
  const path = $('#ej-car-path'), N = 480;
  let total = 0, xs = null, ys = null;
  function lut() {
    if (xs) return;
    total = path.getTotalLength();
    xs = new Float32Array(N + 1); ys = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const p = path.getPointAtLength((total * i) / N);
      xs[i] = p.x; ys[i] = p.y;
    }
  }
  if ('requestIdleCallback' in window) requestIdleCallback(lut, { timeout: 4000 }); else setTimeout(lut, 1500);
  let lastWheel = null, lastPct = -1, lastMode = '', chipW = 0;
  const measure = () => { chipW = chip.offsetWidth; };

  function sample(s) {           // s : abscisse curviligne 0 → total
    const f = clamp(s / total) * N, i = Math.min(N - 1, Math.floor(f)), t = f - i;
    const x = xs[i] + (xs[i + 1] - xs[i]) * t, y = ys[i] + (ys[i + 1] - ys[i]) * t;
    const a = Math.atan2(ys[i + 1] - ys[i], xs[i + 1] - xs[i]);
    return { x, y, a };
  }

  function pose(T) {
    const q = travel(range(T, KEY.depart, KEY.arrive));
    if (q <= 0) return { x: CAR_HOME, y: CAR_Y, a: 0, dist: 0, q: 0 };
    lut();
    const s = q * total;
    const p = sample(s);
    p.y += Math.sin(s / 34) * 0.7 * Math.sin(Math.PI * q);    // suspension
    p.dist = s; p.q = q;
    return p;
  }

  function level(T, q) {
    let v = lerp(BATTERY.morning, BATTERY.full, ease(span(T, KEY.battery)));
    v = lerp(v, BATTERY.afterDrive, q);
    return lerp(v, BATTERY.afterV2H, ease(span(T, KEY.drain)));
  }

  function render(T, car, cam, L, sky) {
    const tx = (car.x - cam.x - 190) * L.u, ty = (car.y - CAR_Y + cam.y) * L.u;
    const tf = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${((car.a * 180) / Math.PI).toFixed(2)}deg)`;
    set(body, 'transform', tf);
    set(glow, 'transform', tf);

    // roues : rotation = distance / rayon
    const deg = ((car.dist / WHEEL_R) * 180) / Math.PI;
    if (lastWheel === null || Math.abs(deg - lastWheel) > 0.4) {
      lastWheel = deg;
      for (const [el, cx] of wheels) el.setAttribute('transform', `rotate(${deg.toFixed(1)} ${cx} 92)`);
    }

    const lvl = level(T, car.q);
    set(bat, 'strokeDashoffset', (BAT_LEN * (1 - lvl)).toFixed(1));

    // phares : la nuit et en mouvement ; feux arrière + freinage à l'arrivée
    const moving = range(T, KEY.depart - 0.02, KEY.depart + 0.08) * (1 - range(T, KEY.arrive, KEY.arrive + 0.25));
    const lights = Math.max(sky.night, sky.dawn * 0.6) * Math.max(moving, 0.25 * (1 - range(T, 5.9, 6.2)));
    set(beam, 'opacity', lights * moving);
    set(headHalo, 'opacity', 0.35 + lights * 0.65);
    const brake = range(T, 5.42, 5.56) * (1 - range(T, 5.66, 5.86));
    set(tail, 'opacity', 0.28 + sky.night * 0.5 + brake * 0.5);

    // prise de charge : verte en recharge, ambre en V2H
    set(portSun, 'opacity', range(T, 3.0, 3.1) * (1 - range(T, 3.95, 4.05)));
    set(portV2H, 'opacity', range(T, 5.95, 6.05));

    // pastille : niveau de batterie
    const vis = span(T, [KEY.chipCharge[0], KEY.chipCharge[0] + 0.12]) * (1 - range(T, KEY.chipCharge[1] - 0.12, KEY.chipCharge[1])) +
      span(T, [KEY.chipV2H[0], KEY.chipV2H[0] + 0.12]) * (1 - range(T, KEY.chipV2H[1] - 0.15, KEY.chipV2H[1]));
    set(chip, 'opacity', clamp(vis));
    if (vis > 0.01) {
      // centrée au-dessus de la voiture, mais toujours entièrement visible à l'écran
      const half = chipW / 2 + 12;
      const cx = Math.min(L.W - half, Math.max(half, (car.x - cam.x) * L.u)), cy = (car.y - CAR_Y + cam.y) * L.u;
      set(chip, 'transform', `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) translateX(-50%)`);
      const pct = Math.round(lvl * 100);
      if (pct !== lastPct) { lastPct = pct; chipVal.textContent = `${pct} %`; set(chipBat, 'transform', `scaleX(${lvl.toFixed(3)})`); }
      const mode = T > 5 ? 'v2h' : 'sun';
      if (mode !== lastMode) { lastMode = mode; chip.classList.toggle('is-v2h', mode === 'v2h'); }
    }
  }

  return { pose, render, measure };
}
