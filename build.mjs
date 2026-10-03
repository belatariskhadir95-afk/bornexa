// BORNEXA — build de production.
// 1) Copie le site dans dist/ (sauf sources lourdes / docs internes)
// 2) Minifie le CSS et le JS (esbuild)
// 3) Convertit les images JPG/PNG en WebP et réécrit les <img> vers .webp
//    (l'og:image reste en JPG pour la compatibilité des réseaux sociaux)
// Les fichiers source restent intacts ; dist/ est régénéré à chaque build.
// Lancer :  npm install   puis   npm run build
import esbuild from 'esbuild';
import sharp from 'sharp';
import { cpSync, rmSync, existsSync, readdirSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { prerenderLang } from './scripts/prerender-lang.mjs';

const DIST = 'dist';

// dictionnaire de traduction (le même que celui du navigateur) pour pré-rendre les pages FR
function loadTranslations() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(readFileSync('js/translations.js', 'utf8') + ';this.__T = translations;', ctx);
  return ctx.__T;
}
const TRANSLATIONS = loadTranslations();
// pages redirigées en 301 dans _redirects : pas de jumeau FR (sinon /fr/<ancienne-url> servirait un doublon)
const REDIRECTED = new Set(
  readFileSync('_redirects', 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(/\s+/)).filter((p) => p.length >= 3 && /^30[12]/.test(p[2]))
    .map((p) => [p[0], p[1]].map((u) => u.replace(/^\//, '').replace(/\.html$/, '').replace(/\/$/, '') || 'index'))
    // « /page.html → /page » n'est qu'une URL propre : seule une redirection vers une AUTRE page compte
    .filter(([from, to]) => from && from !== to && !from.includes('*'))
    .map(([from]) => from)
);

// Éléments racine à NE PAS publier (build, vcs, sources lourdes, docs internes)
const SKIP = new Set([
  'node_modules', 'dist', '.git', '.github', '.claude', 'docs',
  'photos-gbp', 'print-qr', 'vetements', 'scripts', 'tmp',
  'build.mjs', 'package.json', 'package-lock.json',
  'CLAUDE.md', 'PROJECT_CONTEXT.md', 'VALIDATION-TECHNIQUE.md',
  'MARKETING-PRELANCEMENT.md', 'GUIDE-SEARCH-CONSOLE.md', 'annuaires-bornexa.md',
  'BORNEXA-Plan-Lancement.html', 'BORNEXA-Plan-Lancement.pdf', 'test devis.pdf'
]);

// 1) repartir propre
if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);

// 2) copier chaque élément racine vers dist/ (sauf exclusions)
for (const entry of readdirSync('.')) {
  if (SKIP.has(entry)) continue;
  if (entry.endsWith('-Vistaprint.pdf')) continue;
  cpSync(entry, join(DIST, entry), { recursive: true });
}

// 3) minifier le CSS (style.css + feuilles dédiées, ex. energy-journey.css)
for (const f of readdirSync('dist/css')) {
  if (!f.endsWith('.css')) continue;
  await esbuild.build({
    entryPoints: [`dist/css/${f}`],
    outfile: `dist/css/${f}`,
    minify: true,
    allowOverwrite: true,
    loader: { '.css': 'css' }
  });
}

// 4) minifier chaque fichier JS
for (const f of readdirSync('dist/js')) {
  if (f.endsWith('.js')) {
    await esbuild.build({
      entryPoints: [`dist/js/${f}`],
      outfile: `dist/js/${f}`,
      minify: true,
      allowOverwrite: true
    });
  }
}

// 4b) Expériences animées (homepage « Energy Journey », configurateur de devis) : les modules ES
//     de chaque dossier sont regroupés en UN fichier minifié, au même chemin que le point d'entrée
//     (les pages ne changent pas). En local, les modules restent séparés (lisibles).
for (const app of ['energy-journey', 'configurator']) {
  const dir = `dist/js/${app}`;
  if (!existsSync(`${dir}/index.js`)) continue;
  await esbuild.build({
    entryPoints: [`js/${app}/index.js`],
    outfile: `${dir}/index.js`,
    bundle: true,
    format: 'esm',
    minify: true,
    target: ['es2019'],
    allowOverwrite: true
  });
  for (const f of readdirSync(dir)) if (f !== 'index.js') rmSync(join(dir, f));
}
// modules partagés : déjà inclus dans chaque bundle
if (existsSync('dist/js/shared')) rmSync('dist/js/shared', { recursive: true, force: true });

// 5) convertir les images JPG/PNG en WebP
const imgDir = join(DIST, 'images');
let webpCount = 0;
const responsive = new Map(); // base → { full, widths } pour les srcset
if (existsSync(imgDir)) {
  for (const f of readdirSync(imgDir)) {
    if (/\.(jpe?g|png)$/i.test(f)) {
      const out = f.replace(/\.(jpe?g|png)$/i, '.webp');
      await sharp(join(imgDir, f)).webp({ quality: 80 }).toFile(join(imgDir, out));
      webpCount++;
      // photos de chantiers (bornexa-*) : variantes réduites pour srcset (affichées à ±140–340 px de large)
      if (/^bornexa-/i.test(f)) {
        const meta = await sharp(join(imgDir, f)).metadata();
        const base = out.replace(/\.webp$/, '');
        const widths = [480, 960].filter((w) => w < (meta.width || 0));
        for (const w of widths) await sharp(join(imgDir, f)).resize({ width: w }).webp({ quality: 78 }).toFile(join(imgDir, `${base}-${w}.webp`));
        responsive.set(base, { full: meta.width, widths });
      }
    }
  }
}

// 6) réécrire les <img src="images/X.jpg|png"> en .webp dans tout le HTML de dist
//    (ne touche PAS aux <meta og:image> / twitter:image qui restent en JPG)
//    + srcset/sizes sur les photos de chantiers (sizes du source conservé, sinon valeur par défaut)
function rewriteHtml(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { rewriteHtml(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    let html = readFileSync(p, 'utf8');
    html = html.replace(/(<img\b[^>]*\bsrc=")images\/([^"]+)\.(jpe?g|png)(")/gi, '$1images/$2.webp$4');
    html = html.replace(/<img\b[^>]*\bsrc="images\/([^"]+)\.webp"[^>]*>/gi, (tag, base) => {
      const r = responsive.get(base);
      if (!r || !r.widths.length || /\bsrcset=/i.test(tag)) return tag;
      const set = [...r.widths.map((w) => `images/${base}-${w}.webp ${w}w`), `images/${base}.webp ${r.full}w`].join(', ');
      const sizes = /\bsizes=/i.test(tag) ? '' : ' sizes="(max-width: 600px) 90vw, 400px"';
      return tag.replace(/<img\b/i, `<img srcset="${set}"${sizes}`);
    });
    writeFileSync(p, html);
  }
}
rewriteHtml(DIST);

// 7) Générer les versions FR sous /fr/ (le NL reste à la racine, URLs inchangées)
//    Signaux SEO critiques (title, meta, og, canonical, hreflang) écrits EN DUR en FR ;
//    le corps est rendu en FR par lang.js (qui lit <html lang="fr">). Liens internes → /fr/,
//    assets rendus absolus (/css /js /images) pour ne pas casser sous le sous-dossier.
const SITE = 'https://www.bornexa.be';
const FR_SKIP = new Set(['404.html', 'BORNEXA-Plan-Lancement.html']);
function isNoindex(h) { return /name=["']robots["'][^>]*noindex/i.test(h); }
function rootUrlFor(slug) { return `${SITE}/${slug === 'index' ? '' : slug}`; }
function frUrlFor(slug) { return `${SITE}/fr/${slug === 'index' ? '' : slug}`; }

// pages NL-primary + indexables → candidates à un jumeau FR
const frSlugs = new Set();
for (const f of readdirSync(DIST).filter(f => f.endsWith('.html'))) {
  if (FR_SKIP.has(f)) continue;
  if (REDIRECTED.has(f.replace(/\.html$/, ''))) continue;
  const h = readFileSync(join(DIST, f), 'utf8');
  if (!/<html[^>]*\blang=["']nl["']/i.test(h)) continue;
  if (isNoindex(h)) continue;
  frSlugs.add(f.replace(/\.html$/, ''));
}

// titre / description / og en FR à partir des attributs data-fr (jumeaux /fr/ et pages FR natives)
function applyFrHead(html) {
  const frTitle = (html.match(/<title[^>]*\sdata-fr="([^"]*)"/i) || [])[1];
  const frDesc = (html.match(/<meta name="description"[^>]*\sdata-fr="([^"]*)"/i) || [])[1];
  if (frTitle) html = html.replace(/(<title[^>]*>)[^<]*(<\/title>)/i, `$1${frTitle}$2`);
  if (frDesc) html = html.replace(/(<meta name="description"[^>]*\bcontent=")[^"]*(")/i, `$1${frDesc}$2`);
  if (frTitle) html = html.replace(/(<meta property="og:title"[^>]*content=")[^"]*(")/i, `$1${frTitle}$2`);
  if (frDesc) html = html.replace(/(<meta property="og:description"[^>]*content=")[^"]*(")/i, `$1${frDesc}$2`);
  if (frTitle) html = html.replace(/(<meta name="twitter:title"[^>]*content=")[^"]*(")/i, `$1${frTitle}$2`);
  if (frDesc) html = html.replace(/(<meta name="twitter:description"[^>]*content=")[^"]*(")/i, `$1${frDesc}$2`);
  return html;
}
const prStats = { pages: 0, replaced: 0, removedBlocks: 0, emptiedBlocks: 0, scriptTexts: 0 };
function prerenderFr(html) {
  const { html: out, stats } = prerenderLang(html, TRANSLATIONS.fr, 'fr');
  prStats.pages++;
  for (const k of ['replaced', 'removedBlocks', 'emptiedBlocks', 'scriptTexts']) prStats[k] += stats[k];
  return out;
}

// pose un jeu d'alternates réciproque complet (nl racine / fr sous-dossier / x-default racine)
function wireAlternates(html, rootUrl, frUrl, canonical, locale) {
  html = html.replace(/(<link rel="canonical"[^>]*href=")[^"]*(")/i, `$1${canonical}$2`);
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]*"[^>]*>/gi, '');
  html = html.replace(/(<link rel="canonical"[^>]*>)/i,
    `$1\n  <link rel="alternate" hreflang="nl" href="${rootUrl}">` +
    `\n  <link rel="alternate" hreflang="fr" href="${frUrl}">` +
    `\n  <link rel="alternate" hreflang="x-default" href="${rootUrl}">`);
  html = html.replace(/(<meta property="og:locale"[^>]*content=")[^"]*(")/i, `$1${locale}$2`);
  return html;
}

// données structurées par langue : <script type="application/ld+json" data-lang="nl|fr"> — chaque version ne garde que la sienne
const keepLdLang = (html, lang) => html.replace(/\s*<script type="application\/ld\+json" data-lang="(nl|fr)">[\s\S]*?<\/script>/g, (m, l) => (l === lang ? m : ''));

mkdirSync(join(DIST, 'fr'), { recursive: true });
let frCount = 0;
for (const slug of frSlugs) {
  const rootUrl = rootUrlFor(slug), frUrl = frUrlFor(slug);
  const src = readFileSync(join(DIST, `${slug}.html`), 'utf8');
  let fr = src;
  fr = fr.replace(/(<html[^>]*)\blang=["']nl["']/i, '$1lang="fr"');
  fr = applyFrHead(fr);
  fr = fr.replace(/(<meta property="og:url"[^>]*content=")[^"]*(")/i, `$1${frUrl}$2`);
  fr = wireAlternates(fr, rootUrl, frUrl, frUrl, 'fr_BE');
  // corps de page en FR dans le HTML lui-même (avant la réécriture des liens : lang.js cible href="services"…)
  fr = prerenderFr(fr);
  fr = keepLdLang(fr, 'fr');
  // liens internes (slugs nus) → /fr/… s'ils ont un jumeau FR, sinon vers la racine
  // (sous /fr/, un lien relatif « privacy » se résoudrait en /fr/privacy, qui n'existe pas)
  fr = fr.replace(/href="([a-z0-9][a-z0-9-]*)(#[^"]*)?"/gi, (m, s, anchor) =>
    frSlugs.has(s) ? `href="/fr/${s === 'index' ? '' : s}${anchor || ''}"` : `href="/${s}${anchor || ''}"`);
  fr = fr.replace(/href="\/"/g, 'href="/fr/"');
  // assets relatifs → absolus (sinon 404 sous /fr/…)
  fr = fr.replace(/\b(href|src)="(css\/|js\/|images\/)/gi, '$1="/$2');
  fr = fr.replace(/\bsrcset="([^"]*)"/gi, (m, v) => `srcset="${v.replace(/(^|,\s*)images\//g, '$1/images/')}"`);
  writeFileSync(join(DIST, 'fr', `${slug}.html`), fr);
  frCount++;
}

// 7b) pages FR « natives » à la racine (<html lang="fr">, ex. borne-recharge-uccle) : même pré-rendu FR
let frNativeCount = 0;
for (const f of readdirSync(DIST).filter((x) => x.endsWith('.html'))) {
  if (FR_SKIP.has(f)) continue;
  const p = join(DIST, f);
  const h = readFileSync(p, 'utf8');
  if (!/<html[^>]*\blang=["']fr["']/i.test(h)) continue;
  if (isNoindex(h)) continue; // outils internes et pages légales : on n'y touche pas
  let out = keepLdLang(prerenderFr(applyFrHead(h)), 'fr');
  // liens internes → jumeau /fr/ quand il existe (sinon un visiteur FR retombait sur la page NL)
  out = out.replace(/href="([a-z0-9][a-z0-9-]*)(#[^"]*)?"/gi, (m, s, anchor) =>
    frSlugs.has(s) ? `href="/fr/${s === 'index' ? '' : s}${anchor || ''}"` : m);
  out = out.replace(/href="\/"/g, 'href="/fr/"');
  writeFileSync(p, out);
  frNativeCount++;
}

// 8) sur chaque page NL racine : ajouter l'alternate fr réciproque
for (const slug of frSlugs) {
  const p = join(DIST, `${slug}.html`);
  const html = readFileSync(p, 'utf8');
  writeFileSync(p, keepLdLang(wireAlternates(html, rootUrlFor(slug), frUrlFor(slug), rootUrlFor(slug), 'nl_BE'), 'nl'));
}

// 9) sitemap.xml : lastmod = date du dernier commit git + alternates fr + entrées /fr/
function sourceFileForLoc(loc) {
  let path = loc.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
  if (path === '') path = 'index';
  return path.endsWith('.html') ? path : `${path}.html`;
}
function gitLastMod(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  } catch { return null; }
}
const sitemapPath = join(DIST, 'sitemap.xml');
let sitemapUpdated = 0;
let sitemapDropped = 0;
const frEntries = [];
if (existsSync(sitemapPath)) {
  let xml = readFileSync(sitemapPath, 'utf8');
  xml = xml.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (!loc) return block;
    const file = sourceFileForLoc(loc);
    const slug = file.replace(/\.html$/, '');
    // une URL en noindex ou redirigée n'a rien à faire dans le sitemap (contradiction signalée par Search Console)
    if (REDIRECTED.has(slug)) { sitemapDropped++; return ''; }
    if (existsSync(file) && isNoindex(readFileSync(file, 'utf8'))) { sitemapDropped++; return ''; }
    const date = existsSync(file) ? gitLastMod(file) : null;
    if (date && /<lastmod>[^<]*<\/lastmod>/.test(block)) {
      block = block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${date}</lastmod>`);
      sitemapUpdated++;
    }
    // page avec jumeau FR : ajoute l'alternate fr + prépare l'entrée /fr/
    if (frSlugs.has(slug)) {
      if (!/hreflang="fr"/.test(block)) {
        block = block.replace(/(<xhtml:link rel="alternate" hreflang="nl"[^>]*>)/,
          `$1\n    <xhtml:link rel="alternate" hreflang="fr" href="${frUrlFor(slug)}"/>`);
      }
      frEntries.push(
        `  <url>\n    <loc>${frUrlFor(slug)}</loc>\n` +
        `    <xhtml:link rel="alternate" hreflang="nl" href="${rootUrlFor(slug)}"/>\n` +
        `    <xhtml:link rel="alternate" hreflang="fr" href="${frUrlFor(slug)}"/>\n` +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${rootUrlFor(slug)}"/>\n` +
        (date ? `    <lastmod>${date}</lastmod>\n` : '') +
        `    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
    }
    return block;
  });
  xml = xml.replace(/<\/urlset>/, `${frEntries.join('\n')}\n</urlset>`);
  writeFileSync(sitemapPath, xml);
}

// 9b) cache : /css/* et /js/* sont servis « immutable » 1 an → chaque référence porte l'empreinte du fichier
//     (?v=<hash>). Un fichier modifié change d'URL : plus jamais d'ancienne version servie depuis le cache.
const assetHash = new Map();
const hashOf = (rel) => {
  if (!assetHash.has(rel)) {
    const p = join(DIST, rel);
    assetHash.set(rel, existsSync(p) ? createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 10) : null);
  }
  return assetHash.get(rel);
};
let versioned = 0;
(function stamp(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { stamp(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const html = readFileSync(p, 'utf8');
    const out = html.replace(/\b(src|href)="(\/?)((?:js|css)\/[^"?#]+\.(?:js|css))(?:\?v=[^"]*)?"/g, (m, a, slash, rel) => {
      const h = hashOf(rel);
      if (!h) return m;
      versioned++;
      return `${a}="${slash}${rel}?v=${h}"`;
    });
    if (out !== html) writeFileSync(p, out);
  }
})(DIST);

// 10) flux RSS régénéré à chaque build à partir des articles (JSON-LD BlogPosting / Article) : jamais périmé
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const htmlDecode = (s) => String(s).replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
const feedItems = [];
for (const f of readdirSync(DIST).filter((x) => x.endsWith('.html'))) {
  const slug = f.replace(/\.html$/, '');
  if (REDIRECTED.has(slug)) continue;
  const h = readFileSync(join(DIST, f), 'utf8');
  if (isNoindex(h) || !/<html[^>]*\blang=["']nl["']/i.test(h)) continue;
  for (const m of h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data; try { data = JSON.parse(m[1]); } catch { continue; }
    const post = (data['@graph'] || [data]).find((n) => [].concat(n['@type'] || []).some((t) => t === 'BlogPosting' || t === 'Article' || t === 'TechArticle'));
    if (!post || !post.datePublished) continue;
    const title = post.headline || (h.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || slug;
    const desc = post.description || (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    feedItems.push({ slug, title: htmlDecode(title), desc: htmlDecode(desc), date: post.datePublished });
    break;
  }
}
feedItems.sort((a, b) => b.date.localeCompare(a.date));
if (feedItems.length) {
  const rfc = (d) => new Date(`${d}T09:00:00+02:00`).toUTCString();
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>BORNEXA – Laadpaal &amp; Wallbox Blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Laadpaal- en wallbox-installateur in Vlaams-Brabant en Brussel. Artikels over installatie, kostprijs, normen, laden op zon en smart charging.</description>
    <language>nl-BE</language>
    <lastBuildDate>${rfc(feedItems[0].date)}</lastBuildDate>
    <generator>BORNEXA build</generator>
${feedItems.map((it) => `    <item>
      <title>${xmlEsc(it.title)}</title>
      <link>${SITE}/${it.slug}</link>
      <guid isPermaLink="true">${SITE}/${it.slug}</guid>
      <pubDate>${rfc(it.date)}</pubDate>
      <dc:creator>BORNEXA</dc:creator>
      <description>${xmlEsc(it.desc)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`;
  writeFileSync(join(DIST, 'feed.xml'), feed);
}

console.log(`✅ Build terminé → dist/ (CSS + JS minifiés, ${webpCount} images en WebP, ${frCount} pages FR /fr/, ${sitemapUpdated} lastmod sitemap, ${sitemapDropped} URL retirées du sitemap)`);
console.log(`   Empreintes cache : ${versioned} références · Flux RSS : ${feedItems.length} articles · Pré-rendu FR : ${prStats.pages} pages, ${prStats.replaced} textes traduits, ${prStats.removedBlocks + prStats.emptiedBlocks} blocs NL retirés, ${prStats.scriptTexts} textes de script · Pages FR natives reliées aux jumeaux /fr/ : ${frNativeCount}`);
