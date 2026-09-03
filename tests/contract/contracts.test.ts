import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { loadKnowledge, verifyDerivedManifest } from '../../src/content/knowledge.ts';
import { SPEC_COMMIT, createKnowledgeFixture } from '../helpers.ts';

test('input lock pins all three repository identities', async () => {
  const lock = JSON.parse(await readFile('inputs.lock.json', 'utf8'));
  assert.equal(lock.inputs.spec.commit, SPEC_COMMIT);
  assert.equal(lock.inputs.knowledge.commit.length, 40);
  assert.equal(lock.inputs.agents.commit.length, 40);
  assert.equal(lock.inputs.spec.schemaSetSha256, 'e5580b30ad8a10c4cd25caa1e326c1473f1859b661ae404594f6ab1b9e859165');
});

test('Web contains no copied canonical schemas', async () => {
  const files = await readdir('.', { recursive: true });
  assert.equal(files.some((file: string) => /^schemas[\\/].*\.schema\.json$/.test(String(file))), false);
});

test('Knowledge manifest and all supported block contracts load', async () => {
  const root = await createKnowledgeFixture();
  const manifest = await verifyDerivedManifest(root);
  assert.equal(manifest.specCommit, SPEC_COMMIT);
  const snapshot = await loadKnowledge(root, SPEC_COMMIT);
  const blocks = snapshot.content.values().next().value?.blocks.map(block => block.type);
  assert.deepEqual(blocks, ['HEADING', 'PARAGRAPH', 'QUOTE', 'LIST', 'CLAIM_REF', 'SOURCE_REF', 'OBSERVATION_REF', 'ASSET_REF', 'CALLOUT']);
});

test('external Spec exposes every contracted content block', async () => {
  const specPath = path.resolve(process.env.SPEC_PATH ?? '../colombia-clara-spec');
  const schema = await readFile(path.join(specPath, 'schemas', 'article-content.schema.json'), 'utf8');
  for (const type of ['HEADING', 'PARAGRAPH', 'QUOTE', 'LIST', 'CLAIM_REF', 'SOURCE_REF', 'OBSERVATION_REF', 'ASSET_REF', 'CALLOUT']) assert.match(schema, new RegExp(`"${type}"`));
});
