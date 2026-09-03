import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const temp = await mkdtemp(path.join(tmpdir(), 'cc-web-determinism-'));
const outputs = [path.join(temp, 'a'), path.join(temp, 'b')];
try {
  for (const output of outputs) {
    const result = spawnSync(process.execPath, ['--experimental-strip-types', 'src/build/cli.ts'], { stdio: 'inherit', env: { ...process.env, OUTPUT_PATH: output } });
    if (result.status !== 0) throw new Error('Determinism build failed');
  }
  const manifests = await Promise.all(outputs.map(output => readFile(path.join(output, 'build-manifest.json'), 'utf8')));
  if (manifests[0] !== manifests[1]) throw new Error('Build manifests differ');
  console.log(`Determinism passed: ${JSON.parse(manifests[0]).rootDigest}`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
