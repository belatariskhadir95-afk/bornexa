/* BORNEXA — Energy Journey · flux d'énergie
   Un flux = trait lumineux qui se dessine de la source vers la cible (reveal 0 → 1),
   puis des particules qui circulent dans le même sens (animation CSS, en pause hors écran).
   Le sens est donné par le tracé : panneaux → borne → voiture le jour, voiture → maison le soir. */
import { setter } from './sky.js';

export function createFlow(el) {
  if (!el) return { update() {} };
  const lines = [el.querySelector('.ej-f-halo'), el.querySelector('.ej-f-core')];
  const dots = el.querySelector('.ej-f-dots');
  const len = Math.ceil(lines[1].getTotalLength()) + 2;
  for (const p of lines) p.style.strokeDasharray = `${len} ${len}`;
  const set = setter();

  /* reveal : part dessinée (0 → 1) · strength : opacité globale (fondu de fin) */
  function update(reveal, strength = 1) {
    const vis = reveal > 0.001 && strength > 0.01;
    set(el, 'visibility', vis ? 'visible' : 'hidden');
    if (!vis) return;
    set(el, 'opacity', strength);
    const off = (len * (1 - reveal)).toFixed(1);
    for (const p of lines) set(p, 'strokeDashoffset', off);
    set(dots, 'opacity', Math.max(0, (reveal - 0.85) / 0.15));
  }

  return { update };
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
