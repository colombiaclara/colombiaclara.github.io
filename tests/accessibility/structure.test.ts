import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSite } from '../../src/build/site.ts';
import { buildOptions, createKnowledgeFixture } from '../helpers.ts';

test('representative pages expose landmarks, labels, focus and accessible data', async () => {
  const options = await buildOptions(await createKnowledgeFixture());
  await buildSite(options);
  const pages = ['es/index.html', 'es/articulos/expediente-tecnico/index.html', 'es/cifras/index.html', 'es/temas/tema-de-prueba/index.html', 'es/buscar/index.html', '404.html'];
  for (const page of pages) {
    const html = await readFile(path.join(options.outputPath, page), 'utf8');
    assert.match(html, /<html lang="es">/);
    assert.match(html, /<header class="site-header">/);
    assert.match(html, /<nav aria-label="Navegación principal">/);
    assert.match(html, /<main id="contenido">/);
    assert.match(html, /<footer>/);
  }
  const search = await readFile(path.join(options.outputPath, 'es', 'buscar', 'index.html'), 'utf8');
  assert.match(search, /<label for="q">/);
  assert.match(search, /role="status" aria-live="polite"/);
  const metric = await readFile(path.join(options.outputPath, 'es', 'cifras', 'indicador-tecnico', 'index.html'), 'utf8');
  assert.match(metric, /<caption>Observaciones publicadas<\/caption>/);
  assert.match(metric, /<th scope="row">/);
  const assets = await readFile(new URL('../../src/styles/main.css', import.meta.url), 'utf8');
  assert.match(assets, /:focus-visible/);
  assert.match(assets, /prefers-reduced-motion/);
  assert.match(assets, /@media print/);
});
