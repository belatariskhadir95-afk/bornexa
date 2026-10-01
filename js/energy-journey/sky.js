/* BORNEXA — Energy Journey · ciel (aube → jour → coucher de soleil → nuit)
   Uniquement des fondus d'opacité et des translations : rien n'est repeint au scroll. */
import { KEY, SKY, clamp, lerp, ease, span, range } from './timeline.js';
import { setter } from '../shared/scene-utils.js';

export { setter };

export function createSky(stage) {
  const $ = (s) => stage.querySelector(s);
  const day = $('.ej-sky-day'), sunset = $('.ej-sky-sunset'), night = $('.ej-sky-night');
  const stars = $('.ej-stars'), sun = $('.ej-sun'), halo = $('.ej-sun-halo'), coreSet = $('.ej-sun-core--set');
  const moon = $('.ej-moon'), sky = $('.ej-sky');
  const tintSunset = $('.ej-tint--sunset'), tintNight = $('.ej-tint--night');
  const set = setter();
  let L = null, sunSize = 0, moonSize = 0;

  function measure(layout) {
    L = layout;
    // horizon et rampe des teintes, en px depuis le haut de la scène
    sky.style.setProperty('--hz', `${Math.round(L.sceneH - 300 * L.u)}px`);
    stage.style.setProperty('--tint-a', `${Math.round(L.sceneH - 600 * L.u)}px`);
    stage.style.setProperty('--tint-b', `${Math.round(L.sceneH - 440 * L.u)}px`);
    sunSize = sun.offsetWidth; moonSize = moon.offsetWidth;
  }

  /* tod : 0 aube · 1 jour · 2 coucher · 3 nuit */
  function update(T) {
    const tod = span(T, KEY.dawn) + span(T, KEY.sunset) + span(T, KEY.night);
    set(day, 'opacity', clamp(tod));
    set(sunset, 'opacity', clamp(tod - 1));
    set(night, 'opacity', clamp(tod - 2));
    set(stars, 'opacity', Math.max((1 - clamp(tod * 1.6)) * 0.7, clamp((tod - 2.3) / 0.7)));
    const warm = clamp((tod - 1.2) / 0.6) * (1 - clamp((tod - 2.05) / 0.6));
    set(tintSunset, 'opacity', warm * 0.16);
    set(tintNight, 'opacity', Math.max((1 - clamp(tod)) * 0.58, clamp(tod - 2) * 0.66));

    // trajectoire du soleil (interpolation entre les 4 repères)
    const P = (L.narrow ? SKY.narrow : SKY.wide).sun;
    const i = Math.min(2, Math.floor(tod)), t = ease(clamp(tod - i));
    const xf = lerp(P[i][0], P[i + 1][0], t), alt = lerp(P[i][1], P[i + 1][1], t);
    const sx = xf * L.W - sunSize / 2, sy = L.sceneH - alt * L.u - sunSize / 2;
    set(sun, 'transform', `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`);
    set(sun, 'opacity', 1 - clamp((tod - 2.35) / 0.4));
    const active = ease(span(T, KEY.sunActive)) * (1 - range(T, 3.9, 4.6));
    set(halo, 'transform', `scale(${(1 + active * 0.45).toFixed(3)})`);
    set(halo, 'opacity', 0.45 + active * 0.5);
    set(coreSet, 'opacity', clamp((tod - 1.3) / 0.6));

    // lune : apparaît à la nuit, monte un peu jusqu'à la fin
    const M = (L.narrow ? SKY.narrow : SKY.wide).moon;
    const malt = M[1] - 80 * (1 - clamp(tod - 2)) + 30 * range(T, 7, 8);
    set(moon, 'transform', `translate3d(${(M[0] * L.W - moonSize / 2).toFixed(1)}px,${(L.sceneH - malt * L.u - moonSize / 2).toFixed(1)}px,0)`);
    set(moon, 'opacity', clamp((tod - 2.2) / 0.6));

    return { tod, night: clamp(tod - 2), dawn: 1 - clamp(tod) };
  }

  return { measure, update };
}
