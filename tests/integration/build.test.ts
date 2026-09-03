import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildSite } from '../../src/build/site.ts';
import { buildOptions, createKnowledgeFixture, SPEC_COMMIT } from '../helpers.ts';

test('builds a complete static publication from a PUBLISHED fixture', async () => {
  const knowledge = await createKnowledgeFixture();
  const options = await buildOptions(knowledge);
  const result = await buildSite(options);
  assert.equal(result.publishedArticleIds.length, 1);
  const article = await readFile(path.join(options.outputPath, 'es', 'articulos', 'expediente-tecnico', 'index.html'), 'utf8');
  assert.match(article, /Expediente técnico de prueba/);
  assert.match(article, /Ver evidencia/);
  assert.match(article, /Medio no publicado/);
  assert.doesNotMatch(article, /Vista previa/);
  const search = await readdir(path.join(options.outputPath, 'assets'));
  const index = search.find((file: string) => file.startsWith('search-index.'))!;
  assert.match(await readFile(path.join(options.outputPath, 'assets', index), 'utf8'), /expediente tecnico/);
});

test('REVIEW content is excluded from every production-like public output', async () => {
  const knowledge = await createKnowledgeFixture({ status: 'REVIEW', title: 'SECRETO-DE-REVISION' });
  const options = await buildOptions(knowledge);
  const result = await buildSite(options);
  assert.deepEqual(result.publishedArticleIds, []);
  await assert.rejects(access(path.join(options.outputPath, 'es', 'articulos', 'expediente-tecnico', 'index.html')));
  const files = await readdir(options.outputPath, { recursive: true });
  for (const file of files) {
    const absolute = path.join(options.outputPath, String(file));
    if ((await access(absolute).then(() => true, () => false)) && /\.(?:html|json|xml|txt)$/.test(String(file))) {
      const text = await readFile(absolute, 'utf8').catch(() => '');
      assert.doesNotMatch(text, /SECRETO-DE-REVISION/);
    }
  }
});

test('local preview exposes REVIEW with warning and noindex but no feed entry', async () => {
  const knowledge = await createKnowledgeFixture({ status: 'REVIEW' });
  const options = await buildOptions(knowledge, { previewUnpublished: true, mode: 'preview' });
  await buildSite(options);
  const article = await readFile(path.join(options.outputPath, 'es', 'articulos', 'expediente-tecnico', 'index.html'), 'utf8');
  assert.match(article, /Vista previa — no publicado/);
  assert.match(article, /noindex,nofollow/);
  assert.doesNotMatch(await readFile(path.join(options.outputPath, 'feed.xml'), 'utf8'), /expediente-tecnico/);
  assert.doesNotMatch(await readFile(path.join(options.outputPath, 'sitemap.xml'), 'utf8'), /expediente-tecnico/);
});

test('production rejects preview, invalid commits and insecure public origins', async () => {
  const knowledge = await createKnowledgeFixture();
  await assert.rejects(buildSite(await buildOptions(knowledge, { mode: 'production', previewUnpublished: true })));
  await assert.rejects(buildSite(await buildOptions(knowledge, { mode: 'production', webCommit: 'main' })));
  await assert.rejects(buildSite(await buildOptions(knowledge, { mode: 'production', publicBaseUrl: 'http://example.org' })));
});

test('tampered manifests, broken references and dangerous slugs fail closed', async () => {
  const tampered = await createKnowledgeFixture({ tamper: true });
  await assert.rejects(buildSite(await buildOptions(tampered)), /digest mismatch/i);
  const dangerous = await createKnowledgeFixture({ slug: '../escape' });
  await assert.rejects(buildSite(await buildOptions(dangerous)), /unsafe slug/i);
  const wrongSpec = await createKnowledgeFixture();
  await assert.rejects(buildSite(await buildOptions(wrongSpec, { specCommit: 'f'.repeat(40) })), /unexpected Spec commit/i);
  assert.equal(SPEC_COMMIT.length, 40);
});

test('equivalent builds have identical manifests and hashed asset names', async () => {
  const knowledge = await createKnowledgeFixture();
  const first = await buildOptions(knowledge);
  const second = await buildOptions(knowledge);
  const left = await buildSite(first);
  const right = await buildSite(second);
  assert.equal(left.rootDigest, right.rootDigest);
  assert.equal(await readFile(path.join(first.outputPath, 'build-manifest.json'), 'utf8'), await readFile(path.join(second.outputPath, 'build-manifest.json'), 'utf8'));
});

test('affirmatively licensed media is copied only after digest verification', async () => {
  const knowledge = await createKnowledgeFixture({ mediaLicense: 'CC0-1.0' });
  const options = await buildOptions(knowledge);
  await buildSite(options);
  const assets = await readdir(path.join(options.outputPath, 'assets'));
  assert.equal(assets.some((file: string) => /^[0-9a-f]{64}\.txt$/.test(file)), true);
});
