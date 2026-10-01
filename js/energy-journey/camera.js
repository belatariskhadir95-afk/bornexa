/* BORNEXA — Energy Journey · caméra & parallaxe
   La caméra glisse entre des cadrages (maison du matin → suivi de la voiture → maison du soir).
   Chaque calque est déplacé selon sa profondeur (translate3d uniquement : compositeur GPU). */
import { FRAMES, CAR_Y, lerp, ease, range } from './timeline.js';
import { setter } from './sky.js';

export function createCamera(stage) {
  const layers = [...stage.querySelectorAll('.ej-layer')].map((el) => ({
    el,
    m: parseFloat(el.style.getPropertyValue('--m')),
    d: parseFloat(el.style.getPropertyValue('--d'))
  }));
  const set = setter();

  function compute(T, L, car) {
    const F = L.narrow ? FRAMES.narrow : FRAMES.wide;
    const at = (fr) => fr.cx - fr.at * L.Ws;
    let x = at(F.hero);
    x = lerp(x, at(F.home), ease(range(T, 0.35, 1.2)));
    x = lerp(x, at(F.charge), ease(range(T, 2.75, 3.25)));
    const follow = range(T, 4.05, 4.5) * (1 - range(T, 5.3, 5.85));
    x = lerp(x, car.x - F.follow * L.Ws, ease(range(T, 4.05, 4.5)));
    x = lerp(x, at(F.home2), ease(range(T, 5.3, 5.85)));
    // grue légère : la caméra accompagne le relief de la route
    const y = (CAR_Y - car.y + 16) * 0.45 * ease(follow);
    return { x, y };
  }

  function apply(cam, L) {
    for (const l of layers) {
      const tx = (l.m - cam.x * l.d) * L.u, ty = cam.y * l.d * L.u;
      set(l.el, 'transform', `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`);
    }
  }

  return { compute, apply };
}
