import assert from 'node:assert/strict';
import test from 'node:test';
import { assertProductionValue, assertPublicBaseUrl, assertSafeRoute, assertSafeSlug, escapeHtml, escapeJsonForScript, isMediaPublishable, isPublishableArticle, normalizeSearch, safeExternalUrl, safeLocalPath, statusLabel } from '../../src/content/safety.ts';
import type { Article } from '../../src/types/canonical.ts';

test('escapes text, attributes and script-closing JSON', () => {
  assert.equal(escapeHtml(`<script a="'">&`), '&lt;script a=&quot;&#39;&quot;&gt;&amp;');
  assert.equal(escapeJsonForScript({ value: '</script>&' }).includes('</script>'), false);
});

test('accepts only safe URL protocols and paths', () => {
  assert.equal(safeExternalUrl('https://example.org/a')?.startsWith('https://'), true);
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(safeExternalUrl('data:text/html,x'), null);
  assert.equal(safeExternalUrl('not a URL'), null);
  assert.equal(safeExternalUrl(42), null);
  assert.equal(safeExternalUrl('https://x.test/\u0000'), null);
  assert.equal(safeLocalPath('/es/articulo/'), '/es/articulo/');
  assert.equal(safeLocalPath('/../secret'), null);
  assert.equal(safeLocalPath(42), null);
});

test('rejects unsafe slugs, routes, commits and origins', () => {
  assert.equal(assertSafeSlug('ruta-segura-2'), 'ruta-segura-2');
  assert.throws(() => assertSafeSlug('../x'));
  assert.throws(() => assertSafeSlug('a%2fb'));
  assert.equal(assertSafeRoute('/es/ruta/'), '/es/ruta/');
  assert.throws(() => assertSafeRoute('/es/../x'));
  assert.equal(assertProductionValue('WEB_COMMIT', 'a'.repeat(40)), 'a'.repeat(40));
  assert.throws(() => assertProductionValue('WEB_COMMIT', 'main'));
  assert.equal(assertPublicBaseUrl('https://example.org/'), 'https://example.org');
  assert.throws(() => assertPublicBaseUrl('http://example.org'));
});

test('normalizes Spanish search deterministically', () => {
  assert.equal(normalizeSearch('  Presupuestó—PÚBLICO  '), 'presupuesto publico');
  assert.equal(normalizeSearch('Niño, acción'), 'nino accion');
});

test('publication eligibility is closed by default', () => {
  const base: Omit<Article, 'status'> = { id: 'a', entityType: 'ARTICLE', slug: 'a', language: 'es', title: 'A', description: 'A', contentSource: 'content.es.md', claimIds: [], sourceIds: [], revision: 1 };
  assert.equal(isPublishableArticle({ ...base, status: 'REVIEW' }), false);
  assert.equal(isPublishableArticle({ ...base, status: 'PUBLISHED' }), false);
  assert.equal(isPublishableArticle({ ...base, status: 'PUBLISHED', publishedAt: '2026-01-01T00:00:00Z', approvalId: 'ok' }), true);
  assert.equal(statusLabel('PUBLISHED'), 'Publicado');
});

test('media requires affirmative rights', () => {
  const base = { id: 'asset_x', entityType: 'MEDIA_ASSET', sourcePath: 'a.jpg', mimeType: 'image/jpeg', sha256: 'a' } as const;
  assert.equal(isMediaPublishable({ ...base, license: 'RIGHTS_REVIEW_REQUIRED' }), false);
  assert.equal(isMediaPublishable({ ...base, usageRights: 'No publicar' }), false);
  assert.equal(isMediaPublishable({ ...base, license: 'CC BY 4.0' }), true);
});
