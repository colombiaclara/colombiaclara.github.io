import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const roots = ['src', 'scripts', 'tests', 'docs', '.github'];
const extensions = new Set(['.ts', '.mjs', '.json', '.md', '.yml', '.yaml', '.css']);
const failures = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(target);
    else if (extensions.has(path.extname(entry.name))) {
      const text = await readFile(target, 'utf8');
      if (!text.endsWith('\n')) failures.push(`${target}: missing final newline`);
      if (/[ \t]+$/m.test(text)) failures.push(`${target}: trailing whitespace`);
      if (text.includes('\r')) failures.push(`${target}: CRLF is not allowed`);
      if (path.extname(entry.name) === '.json') {
        try { JSON.parse(text); } catch (error) { failures.push(`${target}: invalid JSON (${error.message})`); }
      }
    }
  }
}

for (const root of roots) await visit(root);
if (failures.length) throw new Error(`Format check failed:\n${failures.join('\n')}`);
console.log('Format check passed.');
