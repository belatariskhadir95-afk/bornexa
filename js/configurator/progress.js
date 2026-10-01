/* BORNEXA — configurateur · progression (chapitres + « Stap 3 van 9 ») */
import { dict, fmt } from './i18n.js';

export function createProgress(root) {
  const box = root.querySelector('#cfg-progress');
  const rail = root.querySelector('#cfg-rail');
  const count = root.querySelector('#cfg-count');
  const bar = root.querySelector('#cfg-bar');

  /* chapitres du parcours, dans l'ordre (« Project », « Net », « Laadpaal »…) */
  function chapters(flow, stepEls) {
    const list = [];
    for (const key of flow) {
      const ch = stepEls[key].dataset.chapter;
      const last = list[list.length - 1];
      if (last && last.ch === ch) last.steps.push(key); else list.push({ ch, steps: [key] });
    }
    return list;
  }

  function render(flow, current, stepEls, lang) {
    const d = dict(lang);
    const idx = flow.indexOf(current);
    box.hidden = idx < 0;
    if (idx < 0) return;
    const chs = chapters(flow, stepEls);
    rail.innerHTML = chs.map(({ ch, steps }) => {
      const first = flow.indexOf(steps[0]), lastI = flow.indexOf(steps[steps.length - 1]);
      const state = idx > lastI ? 'is-done' : idx >= first ? 'is-current' : '';
      const p = state === 'is-current' ? Math.round(((idx - first + 1) / steps.length) * 100) : 0;
      return `<li class="${state}" style="--p:${p}%"${state === 'is-current' ? ' aria-current="step"' : ''}>${d.chapters[ch] || ch}</li>`;
    }).join('');
    count.textContent = fmt(d.stepOf, { n: idx + 1, total: flow.length });
    bar.style.transform = `scaleX(${((idx + 1) / flow.length).toFixed(3)})`;
    // numéro dans l'en-tête de chaque étape du parcours
    flow.forEach((key, i) => {
      const k = stepEls[key].querySelector('[data-cfg-num]');
      if (k) k.textContent = fmt(d.kicker, { n: String(i + 1).padStart(2, '0') });
    });
  }

  return { render };
}
