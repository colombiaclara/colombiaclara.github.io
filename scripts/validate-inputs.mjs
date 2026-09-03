import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const lock = JSON.parse(await readFile('inputs.lock.json', 'utf8'));
const expected = {
  spec: ['0.2.0', '84acc0a204a8effef21ace2babf561b36387a32c', 'e781c75b9a724dd9f8ff4a254319afb49039cb74e3adb58df98ffab73776b784'],
  knowledge: ['0.1.0', '22b20be3ff5758d3d033612362c1c474c30d9f7f', '1e63ca4f832f3c56b7443557c48c963447fe27a670117f94a40b5dc01369c7be'],
  agents: ['0.1.0', '76d3ff84d2cacffc4604affc4f96fbecc874b4f6', 'ca7e7f46cab6fe1bb14eeb0557d6b61967d53efa88ddc06fb0fa011324965123']
};

for (const [name, values] of Object.entries(expected)) {
  const item = lock.inputs[name];
  if (!item || item.version !== values[0] || item.commit !== values[1] || item.zipSha256 !== values[2]) throw new Error(`inputs.lock.json mismatch: ${name}`);
}
if (process.version !== 'v24.20.0') throw new Error(`Node v24.19.0 required, received ${process.version}`);

if (process.env.INPUT_ZIP_DIR) {
  const files = {
    spec: 'colombia-clara-spec-v0.2.0.zip',
    knowledge: 'colombia-clara-knowledge-v0.1.0.zip',
    agents: 'colombia-clara-agents-v0.1.0.zip'
  };
  for (const [name, filename] of Object.entries(files)) {
    const bytes = await readFile(path.join(process.env.INPUT_ZIP_DIR, filename));
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== lock.inputs[name].zipSha256) throw new Error(`ZIP digest mismatch: ${name}`);
  }
}
console.log('Input lock and Node version validated.');
