// Pré-rendu d'une langue au build (utilisé par build.mjs pour les pages FR).
//
// Pourquoi : les pages /fr/ (et les pages FR « natives » comme borne-recharge-uccle) contiennent dans leur HTML
// le texte NL ; js/lang.js le remplace par le FR dans le navigateur. Les robots qui n'exécutent pas le JavaScript
// (robots IA, aperçus, une partie de Bing) voyaient donc du néerlandais sur des URL françaises.
//
// Ce module reproduit applyLang() de js/lang.js sans navigateur, par éditions ciblées sur le HTML source
// (positions fournies par parse5) : tout ce qui n'est pas traduit reste octet pour octet identique.
// lang.js continue de tourner dans le navigateur et réapplique les mêmes valeurs (idempotent).
import { parse } from 'parse5';

const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const attr = (n, name) => { const a = n.attrs && n.attrs.find((x) => x.name === name); return a ? a.value : null; };
const hasClass = (n, c) => { const v = attr(n, 'class'); return !!v && v.split(/\s+/).includes(c); };
const kids = (n) => n.childNodes || [];

function hasSvgDescendant(n) {
  for (const k of kids(n)) { if (k.tagName === 'svg' || (k.tagName && hasSvgDescendant(k))) return true; }
  return false;
}
function unescapeJs(s) {
  return s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (m, c) => {
    if (c[0] === 'u') return String.fromCharCode(parseInt(c.slice(1), 16));
    if (c[0] === 'x') return String.fromCharCode(parseInt(c.slice(1), 16));
    return ({ n: '\n', t: '\t', r: '\r' })[c] ?? c;
  });
}
// style="…display:none…" → retire la déclaration display:none
function styleWithoutHidden(style) {
  return style.split(';').map((d) => d.trim()).filter((d) => d && !/^display\s*:\s*none$/i.test(d)).join(';');
}

/**
 * @param {string} html  page complète
 * @param {object} dict  translations[lang] (js/translations.js)
 * @param {'fr'|'nl'} lang langue à rendre
 * @returns {{ html: string, stats: object }}
 */
export function prerenderLang(html, dict, lang = 'fr') {
  const other = lang === 'fr' ? 'nl' : 'fr';
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const els = [];
  (function walk(n, anc) {
    if (n.tagName) els.push({ n, anc });
    for (const k of kids(n)) walk(k, n.tagName ? [...anc, n] : anc);
    if (n.content) for (const k of kids(n.content)) walk(k, anc); // <template>
  })(doc, []);

  // blocs bilingues par identifiant (hero-nl / hero-fr, content-nl / content-fr…)
  const ids = new Set(els.map((e) => attr(e.n, 'id')).filter(Boolean));
  const pairBase = (id, suffix) => (id && id.endsWith('-' + suffix) ? id.slice(0, -suffix.length - 1) : null);

  // textes posés par les petits scripts de page :
  //   getElementById('x').textContent = isFr ? 'FR' : 'NL';   (aussi « fr ? … : … », guillemets simples ou doubles, innerHTML)
  const scriptText = new Map();
  for (const { n } of els) {
    if (n.tagName !== 'script' || attr(n, 'src')) continue;
    const code = kids(n).map((t) => t.value || '').join('');
    const re = /getElementById\(\s*(['"])([^'"]+)\1\s*\)\.(textContent|innerHTML)\s*=\s*(?:isFr\(\)|isFr|isFR|fr)\s*\?\s*(['"])((?:\\.|(?!\4)[^\\])*)\4\s*:\s*(['"])((?:\\.|(?!\6)[^\\])*)\6/g;
    for (const m of code.matchAll(re)) scriptText.set(m[2], { val: unescapeJs(lang === 'fr' ? m[5] : m[7]), html: m[3] === 'innerHTML' });
    // var nl = { clé: '…' }; var fr = { clé: '…' };  puis  getElementById('id').textContent = t.clé
    const dictBlock = code.match(new RegExp(`var\\s+${lang}\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};`));
    if (dictBlock) {
      const d = {};
      for (const m of dictBlock[1].matchAll(/([A-Za-z0-9_]+)\s*:\s*(['"])((?:\\.|(?!\2)[^\\])*)\2/g)) d[m[1]] = unescapeJs(m[3]);
      for (const m of code.matchAll(/getElementById\(\s*(['"])([^'"]+)\1\s*\)\.(textContent|innerHTML)\s*=\s*t\.([A-Za-z0-9_]+)/g)) {
        if (d[m[4]] != null && !scriptText.has(m[2])) scriptText.set(m[2], { val: d[m[4]], html: m[3] === 'innerHTML' });
      }
    }
    // dictionnaire { 'id': ["NL", "FR"] } appliqué par …textContent = t[id][fr ? 1 : 0]
    if (/\[\s*fr\s*\?\s*1\s*:\s*0\s*\]/.test(code) && /\.textContent\s*=/.test(code)) {
      const dre = /(['"])([A-Za-z0-9_-]+)\1\s*:\s*\[\s*(['"])((?:\\.|(?!\3)[^\\])*)\3\s*,\s*(['"])((?:\\.|(?!\5)[^\\])*)\5\s*\]/g;
      for (const m of code.matchAll(dre)) if (!scriptText.has(m[2])) scriptText.set(m[2], { val: unescapeJs(lang === 'fr' ? m[6] : m[4]), html: false });
    }
  }

  // cas « nav » sans data-key gérés par lang.js (premier élément correspondant uniquement)
  const special = new Map();
  const firstMatch = (pred) => els.find(({ n, anc }) => pred(n, anc));
  const inside = (anc, cls) => anc.some((a) => hasClass(a, cls));
  const addSpecial = (hit, key) => { if (hit && !attr(hit.n, 'data-key') && dict[key] != null) special.set(hit.n, dict[key]); };
  addSpecial(firstMatch((n, anc) => n.tagName === 'a' && attr(n, 'href') === 'services' && inside(anc, 'nav-links')), 'navServices');
  addSpecial(firstMatch((n, anc) => hasClass(n, 'nav-cta') && inside(anc, 'nav-links')), 'navQuote');
  addSpecial(firstMatch((n, anc) => n.tagName === 'a' && attr(n, 'href') === 'services' && inside(anc, 'nav-mobile')), 'navServices');
  addSpecial(firstMatch((n, anc) => n.tagName === 'a' && attr(n, 'href') === 'devis' && inside(anc, 'nav-mobile')), 'navQuote');
  addSpecial(firstMatch((n) => attr(n, 'id') === 'lang-btn'), 'langSwitch');
  addSpecial(firstMatch((n) => attr(n, 'id') === 'lang-btn-mobile'), 'langSwitch');

  const edits = [];          // { s, e, t }
  const covered = [];        // zones déjà réécrites (on ignore tout ce qui s'y trouve)
  const isCovered = (pos) => covered.some(([s, e]) => pos >= s && pos < e);
  const stats = { replaced: 0, placeholders: 0, removedBlocks: 0, emptiedBlocks: 0, shownBlocks: 0, scriptTexts: 0, skippedNoEndTag: 0 };

  const innerRange = (loc) => (loc && loc.startTag && loc.endTag ? [loc.startTag.endOffset, loc.endTag.startOffset] : null);

  // ancres : le bloc de l'autre langue disparaît avec ses id (ex. id="rol") ; le bloc conservé porte
  // souvent la variante suffixée (id="rol-fr"). On lui rend l'id de base pour que les sommaires (#rol) marchent.
  {
    const isOtherBlock = (n) => attr(n, 'data-lang-block') === other || (() => { const b = pairBase(attr(n, 'id'), other); return !!b && ids.has(`${b}-${lang}`); })();
    const removedIds = new Set();
    for (const { n, anc } of els) {
      const id = attr(n, 'id');
      if (!id) continue;
      if (attr(n, 'data-lang-block') === other || anc.some(isOtherBlock)) removedIds.add(id);
    }
    const keptIds = new Set([...ids].filter((x) => !removedIds.has(x)));
    const renamed = new Map();
    for (const { n, anc } of els) {
      const id = attr(n, 'id');
      const base = pairBase(id, lang);
      if (!base || !removedIds.has(base) || keptIds.has(base)) continue;
      if (anc.some((x) => attr(x, `data-${lang}`) || attr(x, 'data-key'))) continue; // contenu réécrit par un ancêtre
      const al = n.sourceCodeLocation && n.sourceCodeLocation.attrs && n.sourceCodeLocation.attrs.id;
      if (!al) continue;
      edits.push({ s: al.startOffset, e: al.endOffset, t: `id="${escAttr(base)}"` });
      renamed.set(id, base);
    }
    if (renamed.size) {
      for (const { n, anc } of els) {
        if (n.tagName !== 'a') continue;
        const href = attr(n, 'href');
        if (!href || !href.startsWith('#') || !renamed.has(href.slice(1))) continue;
        if (anc.some((x) => attr(x, `data-${lang}`) || attr(x, 'data-key'))) continue;
        const hl = n.sourceCodeLocation && n.sourceCodeLocation.attrs && n.sourceCodeLocation.attrs.href;
        if (hl) edits.push({ s: hl.startOffset, e: hl.endOffset, t: `href="#${escAttr(renamed.get(href.slice(1)))}"` });
      }
      stats.renamedIds = renamed.size;
    }
  }
  function setStyleAttr(n, loc, transform) {
    const a = loc.attrs && loc.attrs.style;
    const cur = attr(n, 'style');
    const next = transform(cur || '');
    if (cur === null) {
      if (!next) return;
      const at = loc.startTag.endOffset - (html[loc.startTag.endOffset - 2] === '/' ? 2 : 1);
      edits.push({ s: at, e: at, t: ` style="${escAttr(next)}"` });
    } else if (a) {
      edits.push({ s: a.startOffset, e: a.endOffset, t: next ? `style="${escAttr(next)}"` : '' });
    }
  }

  for (const { n } of els) {
    const loc = n.sourceCodeLocation;
    if (!loc || isCovered(loc.startOffset)) continue;
    const tag = n.tagName;
    if (tag === 'title' || tag === 'meta' || tag === 'script' || tag === 'style') continue;
    const id = attr(n, 'id');

    // 1) blocs de l'autre langue
    if (attr(n, 'data-lang-block') === other) {
      edits.push({ s: loc.startOffset, e: loc.endOffset, t: '' });
      covered.push([loc.startOffset, loc.endOffset]); stats.removedBlocks++; continue;
    }
    const baseOther = pairBase(id, other);
    if (baseOther && ids.has(`${baseOther}-${lang}`)) {
      const r = innerRange(loc);
      if (r) { edits.push({ s: r[0], e: r[1], t: '' }); covered.push(r); stats.emptiedBlocks++; }
      setStyleAttr(n, loc, (st) => (/display\s*:\s*none/i.test(st) ? st : (st ? st.replace(/;?\s*$/, ';') : '') + 'display:none'));
      continue;
    }
    const baseLang = pairBase(id, lang);
    if ((baseLang && ids.has(`${baseLang}-${other}`)) || attr(n, 'data-lang-block') === lang) {
      const st = attr(n, 'style');
      if (st && /display\s*:\s*none/i.test(st)) { setStyleAttr(n, loc, styleWithoutHidden); stats.shownBlocks++; }
      // bloc masqué aussi par l'attribut hidden / aria-hidden="true" (ex. simulateur)
      for (const a of ['hidden', 'aria-hidden']) {
        const al = loc.attrs && loc.attrs[a];
        if (al && (a === 'hidden' || attr(n, a) === 'true')) edits.push({ s: al.startOffset, e: al.endOffset, t: '' });
      }
      // en-tête de l'autre langue vidé : le titre de cette version (souvent un <h2>) devient le <h1> de la page
      if (baseLang && /^hero/.test(baseLang)) {
        const desc = els.filter((e) => e.anc.includes(n));
        const hasH1 = desc.some((e) => e.n.tagName === 'h1');
        const h2 = desc.find((e) => e.n.tagName === 'h2');
        const l2 = h2 && h2.n.sourceCodeLocation;
        if (!hasH1 && l2 && l2.startTag && l2.endTag) {
          edits.push({ s: l2.startTag.startOffset + 1, e: l2.startTag.startOffset + 3, t: 'h1' });
          edits.push({ s: l2.endTag.startOffset + 2, e: l2.endTag.startOffset + 4, t: 'h1' });
          stats.promotedH1 = (stats.promotedH1 || 0) + 1;
        }
      }
    }

    // texte alternatif traduit d'une image (data-alt-fr / data-alt-nl), comme lang.js
    if (tag === 'img') {
      const altLang = attr(n, `data-alt-${lang}`);
      const al = loc.attrs && loc.attrs.alt;
      if (altLang && al) { edits.push({ s: al.startOffset, e: al.endOffset, t: `alt="${escAttr(altLang)}"` }); stats.alts = (stats.alts || 0) + 1; }
      continue;
    }

    // 2) valeur traduite : data-<lang> > data-key > cas nav > script de page
    let v = null;
    const dataLang = attr(n, `data-${lang}`);
    if (dataLang !== null && dataLang !== '') v = dataLang;
    else { const k = attr(n, 'data-key'); if (k && dict[k] != null) v = String(dict[k]); }
    let asText = false;
    if (v === null && special.has(n)) { v = special.get(n); asText = true; }
    if (v === null && id && scriptText.has(id)) { const st = scriptText.get(id); v = st.val; asText = !st.html; stats.scriptTexts++; }
    if (v === null) continue;

    // 3) même sémantique que setEl() de lang.js
    if (tag === 'input' || tag === 'textarea') {
      const a = loc.attrs && loc.attrs.placeholder;
      if (a) { edits.push({ s: a.startOffset, e: a.endOffset, t: `placeholder="${escAttr(v)}"` }); stats.placeholders++; }
      continue;
    }
    const r = innerRange(loc);
    if (!r) { stats.skippedNoEndTag++; continue; }
    if (tag === 'option' || asText) {
      edits.push({ s: r[0], e: r[1], t: escText(v) }); covered.push(r); stats.replaced++; continue;
    }
    if (hasSvgDescendant(n)) {
      const t = kids(n).find((k) => k.nodeName === '#text' && k.value.trim());
      if (t && t.sourceCodeLocation) { edits.push({ s: t.sourceCodeLocation.startOffset, e: t.sourceCodeLocation.endOffset, t: escText(v) }); stats.replaced++; }
      continue;
    }
    edits.push({ s: r[0], e: r[1], t: v }); covered.push(r); stats.replaced++;
  }

  // application de la fin vers le début (positions stables)
  edits.sort((a, b) => b.s - a.s || b.e - a.e);
  let out = html;
  let last = Infinity;
  for (const ed of edits) {
    if (ed.e > last) continue; // chevauchement (ne devrait pas arriver) : on garde l'édition la plus tardive
    out = out.slice(0, ed.s) + ed.t + out.slice(ed.e);
    last = ed.s;
  }
  return { html: out, stats };
}
