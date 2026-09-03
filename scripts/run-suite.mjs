import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const suite = process.argv[2];
if (!/^(unit|contract|integration|e2e|accessibility|security)$/.test(suite)) throw new Error(`Unknown suite: ${suite}`);
const directory = path.join('tests', suite);
const files = (await readdir(directory)).filter(file => file.endsWith('.test.ts')).sort().map(file => path.join(directory, file));
if (!files.length) throw new Error(`No tests found for ${suite}`);
const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', ...files], { stdio: 'inherit', env: process.env });
if (result.status !== 0) process.exitCode = result.status ?? 1;
