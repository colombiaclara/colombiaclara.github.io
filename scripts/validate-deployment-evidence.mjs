import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [evidencePath = 'deployment-evidence.json'] = process.argv.slice(2);
const specRoot = path.resolve(process.env.SPEC_PATH ?? '../colombia-clara-spec');
const { validatorFor } = await import(pathToFileURL(path.join(specRoot, 'scripts/validator.mjs')).href);
const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
const result = validatorFor('deployment-evidence.schema.json')(evidence);
if (!result.valid) throw new Error(`Deployment evidence is invalid:\n${result.errors.join('\n')}`);
console.log('Deployment evidence contract validated.');
