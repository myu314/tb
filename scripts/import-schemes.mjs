// Builds src/data/schemes.json from a checkout of https://github.com/tinted-theming/schemes (MIT).
// Usage: git clone --depth 1 https://github.com/tinted-theming/schemes /tmp/schemes
//        node scripts/import-schemes.mjs /tmp/schemes
import { execFileSync } from 'node:child_process';
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = process.argv[2];
if (!root) {
  console.error('usage: node scripts/import-schemes.mjs <path-to-tinted-theming/schemes>');
  process.exit(1);
}

const SLOTS16 = Array.from({ length: 16 }, (_, i) => 'base0' + i.toString(16).toUpperCase());
const SLOTS24 = [...SLOTS16, ...Array.from({ length: 8 }, (_, i) => 'base1' + i)];

const schemes = [];
for (const system of ['base16', 'base24']) {
  const slots = system === 'base24' ? SLOTS24 : SLOTS16;
  for (const file of readdirSync(join(root, system)).filter((f) => f.endsWith('.yaml')).sort()) {
    const doc = parse(readFileSync(join(root, system, file), 'utf8'));
    const colors = slots.map((s) => {
      const v = String(doc.palette?.[s] ?? '').replace(/^#/, '').toLowerCase();
      if (!/^[0-9a-f]{6}$/.test(v)) throw new Error(`${system}/${file}: bad ${s} "${v}"`);
      return v;
    });
    schemes.push({
      slug: file.replace(/\.yaml$/, ''), // file name, so links to the source resolve
      system,
      name: String(doc.name),
      author: String(doc.author ?? ''),
      ...(doc.description ? { description: String(doc.description) } : {}),
      variant: doc.variant === 'light' ? 'light' : 'dark',
      colors: colors.join(''),
    });
  }
}

const commit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD']).toString().trim();
const date = execFileSync('git', ['-C', root, 'log', '-1', '--format=%cs']).toString().trim();
writeFileSync(
  'src/data/schemes.json',
  JSON.stringify({ source: 'https://github.com/tinted-theming/schemes', commit, date, schemes }) + '\n',
);
copyFileSync(join(root, 'LICENSE'), 'src/data/schemes-LICENSE.txt');
console.log(`wrote ${schemes.length} schemes from ${commit.slice(0, 7)} (${date})`);
