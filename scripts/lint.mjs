import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const failures = [];
const patterns = [
  [/\beval\s*\(/, 'eval is forbidden'],
  [/new\s+Function\s*\(/, 'new Function is forbidden'],
  [/\.innerHTML\s*=/, 'innerHTML assignment is forbidden'],
  [/\bon(?:click|load|error|focus|mouseover)\s*=/i, 'inline event handler is forbidden']
];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(target);
    else if (/\.(?:ts|mjs)$/.test(entry.name)) {
      const text = await readFile(target, 'utf8');
      for (const [pattern, message] of patterns) if (pattern.test(text)) failures.push(`${target}: ${message}`);
      if (/\bDate\.now\s*\(/.test(text)) failures.push(`${target}: nondeterministic Date.now is forbidden`);
      if (/Math\.random\s*\(/.test(text)) failures.push(`${target}: nondeterministic Math.random is forbidden`);
    }
  }
}

await visit('src');
await visit('scripts');
if (failures.length) throw new Error(`Lint failed:\n${failures.join('\n')}`);
console.log('Lint passed: security and determinism rules checked.');
