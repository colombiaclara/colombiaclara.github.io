import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildSite } from '../../src/build/site.ts';
import { buildOptions, createKnowledgeFixture } from '../helpers.ts';

test('all primary routes are real HTML and remain useful without JavaScript', async () => {
  const options = await buildOptions(await createKnowledgeFixture());
  await buildSite(options);
  const routes = ['es/index.html', 'es/articulos/expediente-tecnico/index.html', 'es/cifras/index.html', 'es/temas/tema-de-prueba/index.html', 'es/fuentes/source-01990f6e-3c23-7a11-8a22-1234567890ab/index.html', 'es/buscar/index.html', '404.html'];
  for (const route of routes) {
    const html = await readFile(path.join(options.outputPath, route), 'utf8');
    assert.match(html, /<main id="contenido">/);
    assert.match(html, /Saltar al contenido/);
    assert.match(html, /<h1>/);
  }
  const article = await readFile(path.join(options.outputPath, routes[1]), 'utf8');
  assert.match(article, /Una afirmación técnica verificable/);
  assert.match(article, /Fuente técnica de prueba/);
  assert.match(article, /42/);
});

test('GitHub Pages project base path is applied to internal links and assets', async () => {
  const options = await buildOptions(await createKnowledgeFixture());
  await buildSite(options);
  const home = await readFile(path.join(options.outputPath, 'es', 'index.html'), 'utf8');
  assert.match(home, /href="\/colombia-clara\/assets\/site\./);
  assert.match(home, /href="\/colombia-clara\/es\/cifras\//);
  const names = await readdir(path.join(options.outputPath, 'assets'));
  assert.equal(names.some((name: string) => /^site\.[0-9a-f]{16}\.css$/.test(name)), true);
});
