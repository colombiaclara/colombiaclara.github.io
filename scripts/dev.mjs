import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const knowledgePath = path.resolve(process.env.KNOWLEDGE_PATH ?? '../colombia-clara-knowledge');
if (existsSync(path.join(knowledgePath, 'dist', 'build-manifest.json'))) {
  const build = spawnSync(process.execPath, ['--experimental-strip-types', 'src/build/cli.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development', PREVIEW_UNPUBLISHED: 'true' }
  });
  if (build.status !== 0) process.exit(build.status ?? 1);
} else if (!existsSync(path.join('dist', 'index.html'))) {
  throw new Error('Knowledge checkout is unavailable and no prebuilt dist exists');
}
await import('./serve.mjs');
