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

const DIST = 'dist';

// Éléments racine à NE PAS publier (build, vcs, sources lourdes, docs internes)
const SKIP = new Set([
  'node_modules', 'dist', '.git', '.github', '.claude',
  'photos-gbp', 'print-qr',
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

console.log(`✅ Build terminé → dist/ (CSS + JS minifiés, ${webpCount} images en WebP)`);
