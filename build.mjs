// BORNEXA — build de production.
// Copie le site dans dist/ (élément par élément) puis minifie le CSS et le JS (esbuild).
// Les fichiers source restent intacts ; dist/ est régénéré à chaque build.
// Lancer :  npm install   puis   npm run build
import esbuild from 'esbuild';
import { cpSync, rmSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
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

console.log('✅ Build terminé → dossier dist/ (CSS + JS minifiés)');
