/* BORNEXA — outils partagés des scènes animées (homepage « Energy Journey » + configurateur de devis) */

/* n'écrit dans le style que si la valeur a changé (évite les recalculs inutiles) */
export function setter() {
  const cache = new WeakMap();
  return (el, prop, val) => {
    if (!el) return;
    if (typeof val === 'number') val = Math.round(val * 1000) / 1000;
    let c = cache.get(el);
    if (!c) cache.set(el, (c = {}));
    if (c[prop] === val) return;
    c[prop] = val;
    el.style[prop] = val;
  };
}

/* Flux d'énergie : trait lumineux qui se dessine de la source vers la cible (reveal 0 → 1),
   puis des particules qui circulent dans le même sens (animation CSS).
   p : préfixe des classes (« ej » homepage, « cf » configurateur). */
export function createFlow(el, p = 'ej') {
  if (!el) return { update() {} };
  const lines = [el.querySelector(`.${p}-f-halo`), el.querySelector(`.${p}-f-core`)];
  const dots = el.querySelector(`.${p}-f-dots`);
  const len = Math.ceil(lines[1].getTotalLength()) + 2;
  for (const l of lines) l.style.strokeDasharray = `${len} ${len}`;
  const set = setter();

  /* reveal : part dessinée (0 → 1) · strength : opacité globale (fondu de fin) */
  function update(reveal, strength = 1) {
    const vis = reveal > 0.001 && strength > 0.01;
    set(el, 'visibility', vis ? 'visible' : 'hidden');
    set(el, 'opacity', vis ? strength : 0);
    const off = (len * (1 - reveal)).toFixed(1);
    for (const l of lines) set(l, 'strokeDashoffset', off);
    set(dots, 'opacity', Math.max(0, (reveal - 0.85) / 0.15));
  }

  return { update, len };
}

/* Câble physique : se branche / se rétracte depuis la borne. */
export function createCable(el) {
  if (!el) return { update() {} };
  const len = Math.ceil(el.getTotalLength()) + 2;
  el.style.strokeDasharray = `${len} ${len}`;
  const set = setter();
  return {
    update(reveal) {
      set(el, 'visibility', reveal > 0.001 ? 'visible' : 'hidden');
      set(el, 'strokeDashoffset', (len * (1 - reveal)).toFixed(1));
    }
  };
}
