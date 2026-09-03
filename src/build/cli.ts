import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { buildSite } from './site.ts';
import type { BuildOptions } from '../types/canonical.ts';

interface InputLock {
  inputs: {
    spec: { commit: string };
    knowledge: { commit: string };
  };
}

const root = process.cwd();
const lock = JSON.parse(await readFile(path.join(root, 'inputs.lock.json'), 'utf8')) as InputLock;
const mode = (process.env.BUILD_MODE ?? (process.env.NODE_ENV === 'production' ? 'production' : 'local')) as BuildOptions['mode'];
const previewUnpublished = process.env.PREVIEW_UNPUBLISHED === 'true';
const resolvedMode: BuildOptions['mode'] = previewUnpublished && mode !== 'production' ? 'preview' : mode;
const options: BuildOptions = {
  knowledgePath: path.resolve(root, process.env.KNOWLEDGE_PATH ?? '../colombia-clara-knowledge'),
  specPath: path.resolve(root, process.env.SPEC_PATH ?? '../colombia-clara-spec'),
  outputPath: path.resolve(root, process.env.OUTPUT_PATH ?? 'dist'),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:4173',
  mode: resolvedMode,
  previewUnpublished,
  sourceDateEpoch: Number(process.env.SOURCE_DATE_EPOCH ?? '1788316800'),
  specCommit: process.env.SPEC_COMMIT ?? lock.inputs.spec.commit,
  knowledgeCommit: process.env.KNOWLEDGE_COMMIT ?? lock.inputs.knowledge.commit,
  webCommit: process.env.WEB_COMMIT ?? 'local-uncommitted'
};

const result = await buildSite(options);
console.log(`Built ${result.pages.length} routes; ${result.publishedArticleIds.length} published article(s); sha256:${result.rootDigest}`);
