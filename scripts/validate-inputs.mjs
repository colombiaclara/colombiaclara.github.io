import { readFile } from 'node:fs/promises';

const lock = JSON.parse(await readFile('inputs.lock.json', 'utf8'));
if (lock.schemaVersion !== '1.0.0') throw new Error('Unsupported inputs.lock.json schemaVersion');
for (const [name, role] of [['spec', 'normative-authority'], ['knowledge', 'canonical-content']]) {
  const item = lock.inputs?.[name];
  if (!item || item.name !== `colombia-clara-${name}` || item.role !== role) throw new Error(`inputs.lock.json mismatch: ${name}`);
  if (!/^\d+\.\d+\.\d+$/.test(item.version) || !/^[0-9a-f]{40}$/.test(item.commit) || !/^[0-9a-f]{64}$/.test(item.treeSha256)) {
    throw new Error(`inputs.lock.json has invalid immutable provenance: ${name}`);
  }
}
if (lock.inputs.agents) throw new Error('Web content inputs must not include the Agents runtime');
if (process.version !== 'v24.20.0') throw new Error(`Node v24.20.0 required, received ${process.version}`);
console.log('Spec/Knowledge input lock and Node version validated.');
