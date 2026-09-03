import { spawnSync } from 'node:child_process';
import path from 'node:path';

const knowledgePath = path.resolve(process.env.KNOWLEDGE_PATH ?? '../colombia-clara-knowledge');
const specPath = path.resolve(process.env.SPEC_PATH ?? '../colombia-clara-spec');
const commands = [
  [specPath, ['test']],
  [knowledgePath, ['run', 'build']],
  [knowledgePath, ['test']]
];
for (const [cwd, args] of commands) {
  const result = spawnSync('npm', args, { cwd, stdio: 'inherit', env: { ...process.env, npm_config_offline: 'true', npm_config_audit: 'false' } });
  if (result.status !== 0) throw new Error(`Input validation failed in ${cwd}: npm ${args.join(' ')}`);
}
console.log('Spec and Knowledge validation completed.');
