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

const DIST = 'dist';

// Éléments racine à NE PAS publier (build, vcs, sources lourdes, docs internes)
const SKIP = new Set([
  'node_modules', 'dist', '.git', '.github', '.claude',
  'photos-gbp', 'print-qr', 'vetements',
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

// 3) minifier le CSS
await esbuild.build({
  entryPoints: ['dist/css/style.css'],
  outfile: 'dist/css/style.css',
  minify: true,
  allowOverwrite: true,
  loader: { '.css': 'css' }
});

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

// 5) convertir les images JPG/PNG en WebP
const imgDir = join(DIST, 'images');
let webpCount = 0;
if (existsSync(imgDir)) {
  for (const f of readdirSync(imgDir)) {
    if (/\.(jpe?g|png)$/i.test(f)) {
      const out = f.replace(/\.(jpe?g|png)$/i, '.webp');
      await sharp(join(imgDir, f)).webp({ quality: 80 }).toFile(join(imgDir, out));
      webpCount++;
    }
  }
}

// 6) réécrire les <img src="images/X.jpg|png"> en .webp dans tout le HTML de dist
//    (ne touche PAS aux <meta og:image> / twitter:image qui restent en JPG)
function rewriteHtml(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { rewriteHtml(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    let html = readFileSync(p, 'utf8');
    html = html.replace(/(<img\b[^>]*\bsrc=")images\/([^"]+)\.(jpe?g|png)(")/gi, '$1images/$2.webp$4');
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
  const h = readFileSync(join(DIST, f), 'utf8');
  if (!/<html[^>]*\blang=["']nl["']/i.test(h)) continue;
  if (isNoindex(h)) continue;
  frSlugs.add(f.replace(/\.html$/, ''));
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

mkdirSync(join(DIST, 'fr'), { recursive: true });
let frCount = 0;
for (const slug of frSlugs) {
  const rootUrl = rootUrlFor(slug), frUrl = frUrlFor(slug);
  const src = readFileSync(join(DIST, `${slug}.html`), 'utf8');
  const frTitle = (src.match(/<title[^>]*\sdata-fr="([^"]*)"/i) || [])[1];
  const frDesc = (src.match(/<meta name="description"[^>]*\sdata-fr="([^"]*)"/i) || [])[1];
  let fr = src;
  fr = fr.replace(/(<html[^>]*)\blang=["']nl["']/i, '$1lang="fr"');
  if (frTitle) fr = fr.replace(/(<title[^>]*>)[^<]*(<\/title>)/i, `$1${frTitle}$2`);
  if (frDesc) fr = fr.replace(/(<meta name="description"[^>]*\bcontent=")[^"]*(")/i, `$1${frDesc}$2`);
  if (frTitle) fr = fr.replace(/(<meta property="og:title"[^>]*content=")[^"]*(")/i, `$1${frTitle}$2`);
  if (frDesc) fr = fr.replace(/(<meta property="og:description"[^>]*content=")[^"]*(")/i, `$1${frDesc}$2`);
  fr = fr.replace(/(<meta property="og:url"[^>]*content=")[^"]*(")/i, `$1${frUrl}$2`);
  fr = wireAlternates(fr, rootUrl, frUrl, frUrl, 'fr_BE');
  // liens internes (slugs nus) → /fr/… uniquement s'ils ont un jumeau FR
  fr = fr.replace(/href="([a-z0-9][a-z0-9-]*)(#[^"]*)?"/gi, (m, s, anchor) =>
    frSlugs.has(s) ? `href="/fr/${s === 'index' ? '' : s}${anchor || ''}"` : m);
  fr = fr.replace(/href="\/"/g, 'href="/fr/"');
  // assets relatifs → absolus (sinon 404 sous /fr/…)
  fr = fr.replace(/\b(href|src)="(css\/|js\/|images\/)/gi, '$1="/$2');
  writeFileSync(join(DIST, 'fr', `${slug}.html`), fr);
  frCount++;
}

// 8) sur chaque page NL racine : ajouter l'alternate fr réciproque
for (const slug of frSlugs) {
  const p = join(DIST, `${slug}.html`);
  const html = readFileSync(p, 'utf8');
  writeFileSync(p, wireAlternates(html, rootUrlFor(slug), frUrlFor(slug), rootUrlFor(slug), 'nl_BE'));
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
const frEntries = [];
if (existsSync(sitemapPath)) {
  let xml = readFileSync(sitemapPath, 'utf8');
  xml = xml.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (!loc) return block;
    const file = sourceFileForLoc(loc);
    const slug = file.replace(/\.html$/, '');
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

console.log(`✅ Build terminé → dist/ (CSS + JS minifiés, ${webpCount} images en WebP, ${frCount} pages FR /fr/, ${sitemapUpdated} lastmod sitemap)`);
