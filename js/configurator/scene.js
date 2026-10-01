/* BORNEXA — configurateur · la scène « du plan au réel »
   deriveScene() traduit les réponses du formulaire en état visuel ; createScene() l'applique.
   Tout passe par des classes (transitions CSS) et des translations : rien n'est recalculé au scroll. */
import { createFlow, createCable, setter } from '../shared/scene-utils.js';
import { createCar } from './car.js';
import { V2H_SERVICE } from './steps.js';

const BUILDING = { Woning: 'woning', Bedrijf: 'bedrijf', Appartement: 'appartement', Parking: 'parking' };
const NETWORK = { 'Eenfasig (1x230V)': 'mono', 'Driefasig (3x400V)': 'tri400', 'Driefasig zonder N (3x230V)': 'tri230', 'Onbekend': 'unknown' };
const BRANDS = new Set(['Smappee', 'Tesla', 'Wallbox', 'Alfen', 'Easee', 'Zaptec']);

/* ── réponses + étape → ce que la scène doit montrer ── */
export function deriveScene(a, stepKey, flow) {
  const path = a.Type_Aanvraag;
  const idx = stepKey === 'intro' ? -1 : stepKey === 'success' ? flow.length : flow.indexOf(stepKey);
  const readyAt = flow.indexOf('ready');
  const has = (k) => flow.includes(k);
  const passed = (k) => has(k) && idx > flow.indexOf(k);
  const final = idx >= readyAt;
  const charging = !path || path === 'Laadpaal' || path === 'Herstelling / depannage' || path === 'Advies';

  const env = !!path;
  const building = BUILDING[a.Type_Project] || 'woning';
  const buildingBuilt = has('project') ? !!a.Type_Project || final : env;

  let net = 'hidden', netBuilt = false;
  if (has('network')) {
    if (a.Type_Installatie) { net = NETWORK[a.Type_Installatie] || 'unknown'; netBuilt = true; }
    else if (stepKey === 'network') net = 'unknown';
  }

  const svc = a.Type_Service;
  const charger = svc === V2H_SERVICE ? 'bidi' : svc === "Prise renforcee Green'Up" ? 'socket' : 'wallbox';
  const chargerShown = path !== 'Energiebeheer';
  const chargerBuilt = has('service') ? !!svc || final : env && path !== 'Advies' ? true : final;
  const brand = BRANDS.has(a.Gewenst_Merk_Borne) && charger !== 'socket' ? a.Gewenst_Merk_Borne : '';

  let pv = 'hidden';
  if (has('solar')) {
    if (a.zonnepanelen === 'Ja') pv = 'built';
    else if (a.zonnepanelen === 'Gepland') pv = 'planned';
    else if (!a.zonnepanelen && (stepKey === 'solar' || passed('solar'))) pv = stepKey === 'solar' ? 'bp' : 'hidden';
  }

  const carBuilt = !!a.Merk_Voertuig || passed('vehicle') || (env && !has('vehicle')) || final;
  const progress = idx < 0 ? -1 : Math.min(1, idx / Math.max(1, readyAt));

  return {
    stepKey, path, final, charging, env,
    building, buildingBuilt,
    net, netBuilt,
    charger, chargerShown, chargerBuilt,
    replace: svc === 'Vervanging bestaande borne', parcel: svc === 'Eigen borne plaatsen',
    brand,
    pv, sun: a.zonnepanelen === 'Ja',
    carBuilt, progress,
    v2h: svc === V2H_SERVICE,
    energy: path === 'Energiebeheer' && !!a.Energie_Doel,
    repair: path === 'Herstelling / depannage',
    advice: path === 'Advies' && !final,
    collective: building !== 'woning'
  };
}

export function createScene(stage, { reduced }) {
  const $ = (s) => stage.querySelector(s);
  const visual = stage.parentElement;
  const set = setter();

  // version « plan » de chaque objet, clonée depuis la version construite (page plus légère)
  for (const o of stage.querySelectorAll('.cf-o')) {
    const solid = o.querySelector('.cf-solid');
    const plan = solid.cloneNode(true);
    plan.setAttribute('class', 'cf-bp');
    o.insertBefore(plan, solid);
  }

  const O = (k) => $(`#cf-o-${k}`);
  const objects = [...stage.querySelectorAll('.cf-o')];
  const flows = {};
  for (const el of stage.querySelectorAll('.cf-flow')) flows[el.id.replace('cf-flow-', '')] = createFlow(el, 'cf');
  const cable = createCable($('#cf-cable')), cableSocket = createCable($('#cf-cable-socket'));
  const car = createCar(stage, { reduced });
  const layers = [...stage.querySelectorAll('.cf-layer')].map((el) => ({ el, d: parseFloat(el.style.getPropertyValue('--d')) || 1 }));
  const world = $('.cf-layer--main');
  const tag = $('#cf-tag'), tagText = $('#cf-tag-text');
  const callouts = [...stage.querySelectorAll('.cf-net')];
  const wins = [...stage.querySelectorAll('.cf-wins')];
  const badges = { repair: $('#cf-badge-repair'), fixed: $('#cf-badge-fixed'), energy: $('#cf-badge-energy'), advice: $('#cf-badge-advice') };
  const leds = { box: $('#cf-led-box'), chg: $('#cf-led-chg'), v2h: $('#cf-led-v2h') };

  let L = null, cam = 0, S = null, seq = [], phase = '', played = false;

  /* ── cadrage : la maison, la borne et la place de parking toujours visibles ── */
  function measure() {
    const W = visual.clientWidth, Hc = visual.clientHeight;
    const u = world.getBoundingClientRect().height / 900;
    if (!u) return;
    L = { W, H: Hc, u, Ws: W / u };
    cam = Math.max(0, Math.min(60, 1045 - L.Ws));
    car.measure(L, cam);
    drift(car.progress);
  }
  // légère parallaxe : le décor glisse pendant que la voiture approche
  function drift(p) {
    if (!L) return;
    const off = (1 - p) * 36;
    for (const l of layers) set(l.el, 'transform', `translate3d(${(-(cam + off) * l.d * L.u).toFixed(1)}px,0,0)`);
  }
  car.onFrame(drift);

  const show = (el, on) => el && el.classList.toggle('is-on', !!on);
  const state = (el, mode) => {                 // 'hidden' | 'bp' | 'planned' | 'built'
    if (!el) return;
    el.classList.toggle('is-hidden', mode === 'hidden');
    el.classList.toggle('is-built', mode === 'built');
    el.classList.toggle('is-planned', mode === 'planned');
  };
  const later = (ms, fn) => { const id = setTimeout(fn, reduced ? 0 : ms); seq.push(id); };
  const stopSeq = () => { seq.forEach(clearTimeout); seq = []; };

  function setTime(time) {
    stage.classList.toggle('is-day', time === 'day' || time === 'night');
    stage.classList.toggle('is-night', time === 'night');
    car.lights(time === 'night');
  }

  /* ── état « configuration » (avant le récapitulatif) ── */
  function applyBase(s) {
    for (const k of ['lawn', 'trees', 'road', 'drive', 'ground', 'far']) state(O(k), s.env || s.final ? 'built' : 'bp');
    for (const b of ['woning', 'bedrijf', 'appartement', 'parking']) state(O(`bld-${b}`), b !== s.building ? 'hidden' : s.buildingBuilt ? 'built' : 'bp');
    for (const b of ['woning', 'bedrijf', 'appartement', 'parking']) state(O(`pv-${b}`), b !== s.building ? 'hidden' : s.pv);
    for (const n of ['mono', 'tri400', 'tri230', 'unknown']) state(O(`net-${n}`), n !== s.net ? 'hidden' : s.netBuilt ? 'built' : 'bp');
    for (const c of ['wallbox', 'bidi', 'socket']) state(O(`chg-${c}`), !s.chargerShown || c !== s.charger ? 'hidden' : s.chargerBuilt ? 'built' : 'bp');
    state(O('chg-old'), s.replace && s.chargerBuilt && !s.final ? 'built' : 'hidden');
    state(O('chg-parcel'), s.parcel && s.chargerBuilt && !s.final ? 'built' : 'hidden');
    stage.classList.toggle('is-replacing', s.replace && s.chargerBuilt);
    for (const c of callouts) show(c, s.netBuilt && c.id === `cf-callout-${s.net}`);
    if (tagText.textContent !== s.brand) tagText.textContent = s.brand;
    show(tag, !!s.brand && s.chargerShown && s.chargerBuilt);
    stage.classList.toggle('is-car-built', s.carBuilt);
    stage.classList.toggle('is-solar', s.sun);
    stage.classList.toggle('is-started', s.progress >= 0);
    show(badges.repair, s.repair && !s.final);
    show(badges.fixed, s.repair && s.final);
    show(badges.energy, s.energy);
    show(badges.advice, s.advice);
    for (const w of wins) w.classList.toggle('is-variant', w.dataset.variant === s.building);

    // flux du raccordement et du solaire (vers le coffret, puis la borne)
    const grid = s.netBuilt && s.net !== 'unknown';
    flows.grid.update(s.netBuilt ? 1 : 0, s.net === 'unknown' ? 0.35 : 1);
    for (const b of ['woning', 'bedrijf', 'appartement', 'parking']) flows[`solar-${b}`].update(s.pv === 'built' && b === s.building ? 1 : 0);
    const feed = (grid || s.pv === 'built' || s.energy) && s.chargerShown && s.chargerBuilt;
    flows.box.update(feed && s.charger !== 'socket' ? 1 : 0, 0.85);
    flows['box-socket'].update(feed && s.charger === 'socket' ? 1 : 0, 0.85);
    show(leds.box, grid || s.pv === 'built' || s.energy);
  }

  /* ── fin de parcours : la voiture arrive, se recharge, puis (V2H) alimente la maison ── */
  function finale(s, replay) {
    const socket = s.charger === 'socket';
    const plug = (on) => { (socket ? cableSocket : cable).update(on ? 1 : 0); (socket ? cable : cableSocket).update(0); };
    const charge = (on) => {
      flows[socket ? 'charge-socket' : 'charge'].update(on ? 1 : 0);
      flows[socket ? 'charge' : 'charge-socket'].update(0);
    };
    const night = (on) => {
      setTime(on ? 'night' : 'day');
      for (const w of wins) for (const g of w.querySelectorAll('.cf-win')) g.classList.remove('is-on');
    };
    // le flux s'inverse : voiture → borne → coffret → pièces de la maison
    const v2hOn = (instant) => {
      const step = (ms, fn) => (instant ? fn() : later(ms, fn));
      night(true);
      charge(false);
      flows.v2h.update(1);
      [1, 2, 3, 4].forEach((i, k) => step(500 + k * 260, () => flows[`b${i}`].update(s.building === 'woning' ? 1 : 0)));
      const w = wins.find((x) => x.dataset.variant === s.building);
      if (w) [...w.querySelectorAll('.cf-win')].forEach((g, k) => step(900 + k * 280, () => g.classList.add('is-on')));
      show($('#cf-canopy-lights'), s.building === 'parking');
      show(leds.chg, false); show(leds.v2h, true);
      car.port('v2h'); car.chip('v2h'); car.battery(0.78, instant ? 0 : 2600);
    };

    if (!replay) {                                            // déjà joué : état final directement
      setTime(s.v2h && s.charging ? 'night' : 'day');
      if (s.charging) {
        plug(true);
        if (s.v2h) v2hOn(true);
        else { charge(true); show(leds.chg, true); car.port('sun'); car.chip('sun'); car.battery(1); }
      }
      return;
    }
    setTime('day');
    if (!s.charging) return;
    const arrive = car.go(1);
    later(arrive + 150, () => { plug(true); });
    later(arrive + 650, () => {
      charge(true); show(leds.chg, true); car.port('sun'); car.chip('sun');
      car.battery(1, 2400);
    });
    if (s.v2h) later(arrive + 3600, () => v2hOn(false));
  }

  function clearFinale() {
    stopSeq();
    cable.update(0); cableSocket.update(0);
    for (const k of ['charge', 'charge-socket', 'v2h', 'b1', 'b2', 'b3', 'b4']) flows[k].update(0);
    for (const w of wins) for (const g of w.querySelectorAll('.cf-win')) g.classList.remove('is-on');
    show($('#cf-canopy-lights'), false);
    show(leds.chg, false); show(leds.v2h, false);
    car.port(''); car.chip(''); car.battery(0.22);
  }

  /* ── point d'entrée : nouvel état ── */
  function apply(s, { instant = false } = {}) {
    const prev = S; S = s;
    applyBase(s);
    const nextPhase = s.final ? 'final' : 'config';
    if (nextPhase === 'config') {
      if (phase === 'final') { clearFinale(); played = false; }
      setTime('blueprint');
      car.go(s.progress, { instant });
    } else if (phase !== 'final') {
      finale(s, !instant && !played);
      played = true;
      if (instant) car.go(1, { instant: true });
    } else if (prev && (prev.v2h !== s.v2h || prev.charger !== s.charger || prev.building !== s.building)) {
      clearFinale(); finale(s, false);
    }
    phase = nextPhase;
    stage.classList.toggle('is-success', s.stepKey === 'success');
  }

  measure();
  stage.classList.add('is-ready');
  return { apply, measure, destroy() { stopSeq(); car.destroy(); } };
}
