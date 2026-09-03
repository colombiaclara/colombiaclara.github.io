import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildSite } from '../../src/build/site.ts';
import { buildOptions, createKnowledgeFixture } from '../helpers.ts';

test('malicious canonical text remains inert in HTML, metadata and JSON-LD', async () => {
  const payload = `</script><script onerror="alert(1)">x`;
  const options = await buildOptions(await createKnowledgeFixture({ title: payload }));
  await buildSite(options);
  const html = await readFile(path.join(options.outputPath, 'es', 'articulos', 'expediente-tecnico', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /<script onerror=/);
  assert.match(html, /&lt;\/script&gt;&lt;script onerror=/);
  assert.match(html, /\\u003c\/script\\u003e\\u003cscript onerror/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /<[^>]+\son(?:click|load|error)="/i);
});

test('pending-rights media is neither copied nor referenced', async () => {
  const options = await buildOptions(await createKnowledgeFixture({ mediaLicense: 'RIGHTS_REVIEW_REQUIRED' }));
  await buildSite(options);
  const assets = await readdir(path.join(options.outputPath, 'assets'));
  assert.equal(assets.some((file: string) => file.endsWith('.txt')), false);
  const html = await readFile(path.join(options.outputPath, 'es', 'articulos', 'expediente-tecnico', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /media\/test\.txt/);
});

test('public deployment contains no source maps, secrets or unpublished markers', async () => {
  const options = await buildOptions(await createKnowledgeFixture());
  await buildSite(options);
  const files = await readdir(options.outputPath, { recursive: true });
  assert.equal(files.some((file: string) => String(file).endsWith('.map')), false);
  for (const file of files) {
    const absolute = path.join(options.outputPath, String(file));
    const text = await readFile(absolute, 'utf8').catch(() => '');
    assert.doesNotMatch(text, /(?:BEGIN (?:RSA|OPENSSH) PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|RIGHTS_REVIEW_REQUIRED)/);
  }
});
