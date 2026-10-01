/* BORNEXA — Energy Journey · maison, borne & V2H
   Matin : soleil → panneaux → coffret d'énergie → borne → voiture.
   Soir  : voiture → borne → coffret → pièces de la maison (lumières, pompe à chaleur). */
import { KEY, lerp, ease, span, range } from './timeline.js';
import { createFlow, createCable } from './flow.js';
import { setter } from './sky.js';

export function createHome(stage) {
  const $ = (s) => stage.querySelector(s);
  const set = setter();
  const flows = {
    solar: createFlow($('#ej-flow-solar')),
    charge: createFlow($('#ej-flow-charge')),
    v2h: createFlow($('#ej-flow-v2h')),
    branches: [1, 2, 3, 4].map((i) => createFlow($(`#ej-flow-b${i}`)))
  };
  const cables = [createCable($('#ej-cable-1')), createCable($('#ej-cable-2'))];
  const rays = $('#ej-rays'), pvOn = $('#ej-pv-on'), glint = $('#ej-glint');
  const winDawn = $('#ej-win-dawn');
  const wins = Object.keys(KEY.windows).map((k) => [$(`#ej-win-${k}`), KEY.windows[k]]);
  const led1 = $('#ej-led-1'), box1 = $('#ej-boxled-1'), led2 = $('#ej-led-2'), box2 = $('#ej-boxled-2');
  const fan2 = $('#ej-fan-2'), hpLed = $('#ej-hpled');
  const lamps = [...stage.querySelectorAll('.ej-lamp')];
  let fanOn = null, charging = null, glintX = '';

  function update(T) {
    // ── matin : le soleil active les panneaux
    set(rays, 'opacity', ease(span(T, KEY.sunActive)) * (1 - range(T, 3.6, 4.1)));
    set(pvOn, 'opacity', span(T, KEY.pvOn) * (1 - range(T, 4.2, 4.8)) * 0.9);
    const g = span(T, KEY.glint), gx = lerp(250, 650, g).toFixed(1);
    set(glint, 'opacity', Math.sin(Math.PI * g));
    if (gx !== glintX) { glintX = gx; glint.setAttribute('x', gx); }
    set(winDawn, 'opacity', 1 - range(T, 0.5, 1.0));

    // ── énergie solaire → borne → voiture
    const dayEnd = 1 - range(T, 4.0, 4.25);
    flows.solar.update(ease(span(T, KEY.solarFlow)), dayEnd);
    flows.charge.update(ease(span(T, KEY.chargeFlow)), 1 - range(T, 3.95, 4.08));
    set(box1, 'opacity', span(T, KEY.boxOn) * (1 - range(T, 4.1, 4.4)));
    set(led1, 'opacity', span(T, KEY.chargerOn) * (1 - range(T, 4.05, 4.3)));
    const isCharging = T > 3.05 && T < 4.0;
    if (isCharging !== charging) { charging = isCharging; led1.classList.toggle('is-pulsing', isCharging); }
    cables[0].update(1 - span(T, KEY.unplug));

    // ── soir : lampadaires, retour, rebranchement
    lamps.forEach((el, i) => set(el, 'opacity', range(T, KEY.lamps[0] + i * 0.05, KEY.lamps[0] + 0.2 + i * 0.05)));
    cables[1].update(ease(span(T, KEY.replug)));

    // ── V2H : le flux s'inverse, la maison s'allume pièce par pièce
    flows.v2h.update(ease(span(T, KEY.v2hFlow)));
    flows.branches.forEach((fl, i) => fl.update(ease(span(T, KEY.branches[i]))));
    set(led2, 'opacity', range(T, 6.0, 6.15));
    set(box2, 'opacity', range(T, 6.2, 6.3));
    for (const [el, r] of wins) set(el, 'opacity', span(T, r));
    set(hpLed, 'opacity', range(T, KEY.heatPump, KEY.heatPump + 0.06));
    const on = T > KEY.heatPump;
    if (on !== fanOn) { fanOn = on; fan2.classList.toggle('is-on', on); }
  }

  return { update };
}
