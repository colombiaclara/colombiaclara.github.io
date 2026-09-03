import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const excluded = new Set(['.git', 'node_modules', 'dist', 'coverage', '.tmp', 'REPOSITORY-MANIFEST.md']);
const files = [];
async function visit(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    if (excluded.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(target);
    else files.push(target.replace(/^\.\//, '').split(path.sep).join('/'));
  }
}
await visit('.');
const content = `# Repository manifest\n\nGenerated canonical source inventory. Excludes Git metadata, dependencies, build output, coverage and temporary files.\n\n${files.map(file => `- \`${file}\``).join('\n')}\n`;
if (process.argv.includes('--write')) {
  await writeFile('REPOSITORY-MANIFEST.md', content, 'utf8');
  console.log(`Wrote manifest for ${files.length} files.`);
} else {
  const current = await readFile('REPOSITORY-MANIFEST.md', 'utf8');
  if (current !== content) throw new Error('Repository manifest is stale; run npm run manifest:write');
  console.log(`Repository manifest matches ${files.length} files.`);
}
