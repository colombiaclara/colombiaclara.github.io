import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const mode = process.argv[2];
const root = path.resolve(process.env.OUTPUT_PATH ?? 'dist');

async function files(directory = root) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await files(target)); else output.push(target);
  }
  return output.sort();
}

const all = await files();
const htmlFiles = all.filter(file => file.endsWith('.html'));
if (!htmlFiles.length) throw new Error('No HTML output found');

if (mode === 'links') {
  const known = new Set(all.map(file => `/${path.relative(root, file).split(path.sep).join('/')}`));
  const buildInfo = JSON.parse(await readFile(path.join(root, 'build-info.json'), 'utf8'));
  const basePath = new URL(buildInfo.publicBaseUrl).pathname.replace(/\/$/, '');
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const value = match[1];
      if (!value || /^(?:https?:|#|mailto:)/.test(value)) continue;
      let clean = value.split('#')[0].split('?')[0];
      if (basePath && clean.startsWith(`${basePath}/`)) clean = clean.slice(basePath.length);
      const candidate = clean.endsWith('/') ? `${clean}index.html` : clean;
      if (!known.has(candidate)) throw new Error(`Broken link in ${file}: ${value}`);
    }
  }
  console.log(`Link check passed for ${htmlFiles.length} HTML files.`);
} else if (mode === 'seo') {
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const required of ['<title>', 'name="description"', 'rel="canonical"', 'Content-Security-Policy']) if (!html.includes(required)) throw new Error(`Missing ${required} in ${file}`);
    if (/\bon(?:click|load|error)=/i.test(html)) throw new Error(`Inline handler in ${file}`);
  }
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  if (sitemap.includes('gasto-militar-eeuu')) throw new Error('REVIEW article leaked into sitemap');
  const deployed = await Promise.all(all.map(file => readFile(file).then(bytes => bytes.toString('utf8'))));
  if (deployed.some(text => text.includes('RIGHTS_REVIEW_REQUIRED'))) throw new Error('Pending rights metadata leaked');
  console.log(`SEO/security structure passed for ${htmlFiles.length} HTML files.`);
} else if (mode === 'performance') {
  const budgets = { '.html': 50_000, '.css': 50_000, '.js': 50_000 };
  let largest = 0;
  for (const file of all) {
    const extension = path.extname(file);
    const limit = budgets[extension];
    if (!limit) continue;
    const bytes = await readFile(file);
    const compressed = gzipSync(bytes, { level: 9 }).length;
    largest = Math.max(largest, compressed);
    if (compressed > limit) throw new Error(`${path.relative(root, file)} exceeds ${limit} compressed bytes: ${compressed}`);
  }
  const homeFiles = [path.join(root, 'es', 'index.html'), ...all.filter(file => /assets\/(?:site|search)\./.test(file))];
  const initial = (await Promise.all(homeFiles.map(async file => gzipSync(await readFile(file), { level: 9 }).length))).reduce((sum, value) => sum + value, 0);
  if (initial > 500_000) throw new Error(`Initial transfer exceeds 500 KB: ${initial}`);
  console.log(`Performance budgets passed; initial compressed transfer ${initial} bytes, largest checked asset ${largest} bytes.`);
} else {
  throw new Error(`Unknown output check: ${mode}`);
}
