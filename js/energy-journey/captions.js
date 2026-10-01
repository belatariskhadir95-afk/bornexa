/* BORNEXA — Energy Journey · textes du récit
   Les cartes sont du vrai contenu HTML (SEO, lecteurs d'écran) qui défile normalement ;
   on ne fait qu'un fondu d'entrée / de sortie synchronisé avec l'histoire.
   La sortie est calée sur la géométrie réelle (moment où la carte épinglée est poussée). */
import { clamp } from './timeline.js';
import { setter } from './sky.js';

export function createCaptions(root) {
  const cards = [...root.querySelectorAll('.ej-step .ej-card')];
  const set = setter();
  let fades = [];

  /* fades[i] = [T début, T fin] du fondu de sortie de la carte i */
  function setFades(list) { fades = list; }

  function update(T) {
    cards.forEach((el, i) => {
      const local = T - (i + 1);                   // bloc 0 = hero
      const inn = clamp((local + 0.04) / 0.16);
      const f = fades[i];
      const out = i === cards.length - 1 || !f ? 1 : 1 - clamp((T - f[0]) / Math.max(0.01, f[1] - f[0]));
      set(el, 'opacity', inn * out);
      set(el, 'transform', `translate3d(0,${((1 - clamp((local + 0.04) / 0.2)) * 10).toFixed(1)}px,0)`);
    });
  }

  function reset() {
    for (const el of cards) { el.style.opacity = ''; el.style.transform = ''; }
  }

  return { update, reset, setFades, cards };
}
