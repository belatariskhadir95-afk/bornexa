/* BORNEXA — Energy Journey (homepage)
   Récit au scroll : soleil → panneaux → borne → voiture → route → soir → V2H.
   Le scroll est le seul moteur : position des blocs du DOM → temps de l'histoire T (0 → 8),
   lissé légèrement, puis appliqué aux modules (ciel, caméra, voiture, maison, textes).
   html.ej-anim (posé dans <head>) = expérience animée ; sinon image fixe (mouvement réduit). */
import { T_STATIC } from './timeline.js';
import { createSky } from './sky.js';
import { createCamera } from './camera.js';
import { createCar } from './car.js';
import { createHome } from './home.js';
import { createCaptions } from './captions.js';

const root = document.querySelector('[data-ej]');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let instance = null;

function start() {
  if (!root) return;
  if (instance) instance.destroy();
  document.documentElement.classList.toggle('ej-anim', !motion.matches);
  instance = createJourney(root, !motion.matches);
}

function createJourney(root, animated) {
  const stage = root.querySelector('.ej-stage');
  const scene = stage.querySelector('.ej-scene'), world = stage.querySelector('.ej-layer--world');
  const steps = [root.querySelector('.ej-hero'), ...root.querySelectorAll('.ej-step')];
  const sky = createSky(stage), camera = createCamera(stage), car = createCar(stage), home = createHome(stage);
  const captions = animated ? createCaptions(root) : null;

  let L = null, bounds = [0], top = 0, active = true, raf = 0, last = 0;
  let Tcur = animated ? 0 : T_STATIC, Ttar = Tcur;

  function measure() {
    // l'échelle --u est calculée par le CSS (100vw / 100vh) : on la relit sur le calque monde
    // (900 unités de haut) → aucun saut entre la 1re image et le JS, et rien à réécrire au resize
    const cs = getComputedStyle(stage);
    const W = window.innerWidth, H = stage.clientHeight, sceneH = scene.clientHeight;
    const u = world.getBoundingClientRect().height / 900;
    L = { W, H, sceneH, u, Ws: W / u, narrow: parseFloat(cs.getPropertyValue('--narrow')) === 1 };
    sky.measure(L);
    car.measure();
    if (animated) {
      // bornes de chaque bloc en « px de scroll depuis le haut de la section »
      top = root.getBoundingClientRect().top + window.scrollY;
      // une étape commence quand sa carte arrive à 10 vh de sa position épinglée (sticky)
      // hauteur de la scène (100lvh) plutôt que innerHeight : stable quand la barre d'adresse
      // mobile se replie → pas de saut de l'histoire
      const vh = stage.clientHeight || window.innerHeight, pushes = [];
      bounds = [0];
      for (let i = 1; i < steps.length; i++) {
        const el = steps[i], card = el.querySelector('.ej-card');
        const pin = (card && parseFloat(getComputedStyle(card).top)) || 0;
        const liTop = el.getBoundingClientRect().top + window.scrollY - top;
        bounds.push(liTop - pin - 0.1 * vh);
        // la carte épinglée est poussée vers le haut quand la fin de son bloc l'atteint
        pushes.push(liTop + el.offsetHeight - (card ? card.offsetHeight : 0) - pin);
      }
      bounds.push(Math.max(bounds[bounds.length - 1] + 1, root.offsetHeight - vh));
      for (let i = 1; i < bounds.length; i++) bounds[i] = Math.max(bounds[i], bounds[i - 1] + 1);
      if (captions) captions.setFades(pushes.map((s) => [tOf(s - 0.03 * vh), tOf(s + 0.1 * vh)]));
      Ttar = target();
    }
  }

  const target = () => tOf(window.scrollY - top);

  /* position de scroll (px depuis le haut de la section) → temps de l'histoire T */
  function tOf(s) {
    if (s <= 0) return 0;
    for (let i = 0; i < bounds.length - 1; i++) {
      if (s < bounds[i + 1]) return i + (s - bounds[i]) / (bounds[i + 1] - bounds[i]);
    }
    return bounds.length - 1;
  }

  function render(T) {
    const pose = car.pose(T);
    const cam = camera.compute(T, L, pose);
    camera.apply(cam, L);
    const tod = sky.update(T);
    home.update(T);
    car.render(T, pose, cam, L, tod);
    if (captions) captions.update(T);
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const diff = Ttar - Tcur;
    Tcur = Math.abs(diff) > 1.5 ? Ttar : Tcur + diff * (1 - Math.exp(-dt / 0.085));
    if (Math.abs(Ttar - Tcur) < 0.0005) Tcur = Ttar;
    render(Tcur);
    if (Tcur !== Ttar && active) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  const kick = () => { if (!raf && active) raf = requestAnimationFrame(frame); };

  const onScroll = () => { Ttar = target(); kick(); };
  let resizeQueued = false;
  const onResize = () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      measure();
      if (animated) { Tcur = Ttar; }
      render(Tcur);
    });
  };

  // pause hors écran (rAF + animations CSS d'ambiance)
  const io = new IntersectionObserver(([e]) => {
    active = e.isIntersecting;
    root.classList.toggle('is-paused', !active);
    if (active && animated) { Ttar = target(); kick(); }
  });
  const ro = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null;
  const mo = new MutationObserver(onResize);             // changement de langue → hauteurs des textes

  measure();
  if (animated) Tcur = Ttar;
  render(Tcur);
  io.observe(root);
  if (ro) { ro.observe(stage); ro.observe(root); }
  window.addEventListener('resize', onResize, { passive: true });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (animated) window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', onResize, { once: true });
  root.classList.add('is-ready');

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('load', onResize);
      window.removeEventListener('resize', onResize);
      io.disconnect(); mo.disconnect();
      if (ro) ro.disconnect();
      if (captions) captions.reset();
      root.classList.remove('is-ready', 'is-paused');
    }
  };
}

if (root) {
  start();
  // l'utilisateur change sa préférence « réduire les animations » : on bascule proprement
  if (motion.addEventListener) motion.addEventListener('change', start);
}
