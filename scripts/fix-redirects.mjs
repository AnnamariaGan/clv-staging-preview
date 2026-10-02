// Post-build: Astro genera i redirect statici come <path>.html/index.html
// (directory), ma gli host statici come GitHub Pages servono i .html come file.
// Questo script appiattisce ogni dist/pages/<name>.html/index.html in
// dist/pages/<name>.html, così i vecchi link continuano a funzionare.
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist/pages';
if (!existsSync(dir)) {
  process.exit(0);
}

// Se viene passata una base (es. '/clv-staging-preview' in staging), antepone la
// base alle destinazioni root-relative dei redirect generati da Astro, che
// altrimenti resterebbero senza prefisso e404 su hosting con subpath.
const base = (process.argv[2] ?? '').replace(/\/+$/, '');
const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// content="0;url=/x/" e href="/x/": antepone la base, salvo prefisso già presente.
const re = new RegExp(`(content="0;\\s*url=|href=")\\/(?!${esc}/)([^/"])`, 'g');

let fixed = 0;
let prefixed = 0;
for (const entry of readdirSync(dir)) {
  if (!entry.endsWith('.html')) continue;
  const nested = join(dir, entry, 'index.html');
  const flat = join(dir, entry);
  if (existsSync(nested)) {
    const content = readFileSync(nested, 'utf8');
    rmSync(join(dir, entry), { recursive: true });
    const out = base ? content.replace(re, `$1${base}/$2`) : content;
    prefixed += out !== content ? 1 : 0;
    writeFileSync(flat, out);
    fixed++;
  }
}
console.log(`fix-redirects: ${fixed} redirect appiattiti, ${prefixed} con base anteposta`);
