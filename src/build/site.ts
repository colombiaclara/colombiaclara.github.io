import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { canonicalJson, createBuildManifest, sha256 } from './canonical-json.ts';
import { collectReachableIds, entityById, loadKnowledge } from '../content/knowledge.ts';
import {
  assertProductionValue,
  assertPublicBaseUrl,
  isMediaPublishable,
  isPublishableArticle,
  normalizeSearch
} from '../content/safety.ts';
import {
  render404,
  renderArticle,
  renderEntityPage,
  renderFigures,
  renderHome,
  renderInfoPage,
  renderSearch,
  type RenderContext
} from '../templates/render.ts';
import type { BuildOptions, MediaAsset, PublicPage } from '../types/canonical.ts';

const WEB_VERSION = '0.1.0';

function outputPathForRoute(root: string, route: string): string {
  if (route === '/404.html') return path.join(root, '404.html');
  const clean = route.replace(/^\//, '').replace(/\/$/, '');
  return path.join(root, clean, 'index.html');
}

function prefixPublicPaths(html: string, basePath: string): string {
  if (!basePath) return html;
  return html.replaceAll('href="/', `href="${basePath}/`).replaceAll('src="/', `src="${basePath}/`).replaceAll('data-search-index="/', `data-search-index="${basePath}/`);
}

async function writePage(root: string, page: PublicPage, basePath: string): Promise<void> {
  const target = outputPathForRoute(root, page.route);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, prefixPublicPaths(page.html, basePath), 'utf8');
}

function validateOptions(options: BuildOptions): void {
  if (options.previewUnpublished && options.mode === 'production') throw new Error('PREVIEW_UNPUBLISHED cannot be enabled in production');
  assertPublicBaseUrl(options.publicBaseUrl);
  if (!Number.isSafeInteger(options.sourceDateEpoch) || options.sourceDateEpoch <= 0) throw new Error('SOURCE_DATE_EPOCH must be a positive integer');
  if (options.mode === 'production') {
    assertProductionValue('SPEC_COMMIT', options.specCommit);
    assertProductionValue('KNOWLEDGE_COMMIT', options.knowledgeCommit);
    assertProductionValue('WEB_COMMIT', options.webCommit);
  }
}

export async function buildSite(options: BuildOptions): Promise<{ rootDigest: string; pages: string[]; publishedArticleIds: string[] }> {
  validateOptions(options);
  const baseUrl = assertPublicBaseUrl(options.publicBaseUrl);
  const basePath = new URL(baseUrl).pathname.replace(/\/$/, '');
  await rm(options.outputPath, { recursive: true, force: true });
  await mkdir(path.join(options.outputPath, 'assets'), { recursive: true });

  const snapshot = await loadKnowledge(options.knowledgePath, options.specCommit);
  const published = snapshot.articles.filter(isPublishableArticle);
  const visible = options.previewUnpublished ? snapshot.articles : published;
  const reachable = collectReachableIds(snapshot, visible);

  const cssSource = await readFile(new URL('../styles/main.css', import.meta.url), 'utf8');
  const cssName = `site.${sha256(cssSource).slice(0, 16)}.css`;
  await writeFile(path.join(options.outputPath, 'assets', cssName), cssSource, 'utf8');
  const searchSource = await readFile(new URL('../browser/search/search.ts', import.meta.url), 'utf8');
  const searchJs = stripTypeScriptTypes(searchSource, { mode: 'strip', sourceMap: false });
  const searchName = `search.${sha256(searchJs).slice(0, 16)}.js`;
  await writeFile(path.join(options.outputPath, 'assets', searchName), searchJs, 'utf8');

  const searchRecords = options.previewUnpublished ? [] : published.map(article => {
    const content = snapshot.content.get(article.id);
    const text = [article.title, article.description, ...(content?.blocks.flatMap(block => 'text' in block ? [block.text] : block.type === 'LIST' ? block.items : []) ?? [])].join(' ');
    return { title: article.title, description: article.description, url: `${basePath}/es/articulos/${article.slug}/`, normalized: normalizeSearch(text) };
  });
  const searchJson = canonicalJson(searchRecords);
  const searchIndexName = `search-index.${sha256(searchJson).slice(0, 16)}.json`;
  await writeFile(path.join(options.outputPath, 'assets', searchIndexName), searchJson, 'utf8');

  const context: RenderContext = {
    baseUrl,
    assetCss: `/assets/${cssName}`,
    searchScript: `/assets/${searchName}`,
    searchIndex: `/assets/${searchIndexName}`,
    preview: options.previewUnpublished
  };
  const pages: PublicPage[] = [renderHome(context, visible), renderFigures(context, snapshot, reachable), renderSearch(context), renderInfoPage(context, 'methodology'), renderInfoPage(context, 'corrections'), render404(context)];
  for (const article of visible) {
    const content = snapshot.content.get(article.id);
    if (!content) throw new Error(`Missing content for ${article.id}`);
    pages.push(renderArticle(context, snapshot, article, content));
  }
  for (const entity of snapshot.entities.values()) {
    const page = renderEntityPage(context, snapshot, entity, reachable);
    if (page) pages.push(page);
  }
  const routes = new Set<string>();
  for (const page of pages) {
    if (routes.has(page.route)) throw new Error(`Duplicate output route: ${page.route}`);
    routes.add(page.route);
    await writePage(options.outputPath, page, basePath);
  }

  for (const id of reachable) {
    const entity = snapshot.entities.get(id);
    if (entity?.entityType !== 'MEDIA_ASSET') continue;
    const asset = entityById<MediaAsset>(snapshot, id, 'MEDIA_ASSET');
    if (!isMediaPublishable(asset)) continue;
    const source = path.join(snapshot.root, asset.sourcePath);
    const bytes = await readFile(source);
    if (sha256(bytes) !== asset.sha256) throw new Error(`Media digest mismatch: ${asset.id}`);
    const extension = path.extname(asset.sourcePath).toLowerCase();
    await cp(source, path.join(options.outputPath, 'assets', `${asset.sha256}${extension}`));
  }

  const sitemapPages = options.previewUnpublished ? [] : pages.filter(page => page.sitemap).map(page => page.route).sort();
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPages.map(route => `  <url><loc>${baseUrl}${route}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(options.outputPath, 'sitemap.xml'), sitemap, 'utf8');
  const feedEntries = options.previewUnpublished ? [] : published.map(article => `  <entry><id>${baseUrl}/es/articulos/${article.slug}/</id><title>${article.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</title><link href="${baseUrl}/es/articulos/${article.slug}/"/><updated>${article.modifiedAt ?? article.publishedAt}</updated><summary>${article.description.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</summary></entry>`);
  await writeFile(path.join(options.outputPath, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><id>${baseUrl}/</id><title>Colombia Clara</title><updated>${new Date(options.sourceDateEpoch * 1000).toISOString()}</updated>${feedEntries.join('')}</feed>\n`, 'utf8');
  await writeFile(path.join(options.outputPath, 'robots.txt'), options.previewUnpublished ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`, 'utf8');
  await writeFile(path.join(options.outputPath, '.nojekyll'), '', 'utf8');
  await writeFile(path.join(options.outputPath, 'THIRD_PARTY_NOTICES.txt'), 'No third-party browser runtime packages or media are included in this build.\n', 'utf8');
  await writeFile(path.join(options.outputPath, 'index.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="description" content="Entrada a Colombia Clara."><meta http-equiv="Content-Security-Policy" content="default-src 'self'; object-src 'none'; base-uri 'none'"><meta http-equiv="refresh" content="0;url=${basePath}/es/"><title>Colombia Clara</title><link rel="canonical" href="${baseUrl}/es/"></head><body><main><h1>Colombia Clara</h1><p><a href="${basePath}/es/">Ir a Colombia Clara</a></p></main></body></html>\n`, 'utf8');

  const buildInfo = {
    schemaVersion: '1.0.0',
    siteVersion: WEB_VERSION,
    specCommit: options.specCommit,
    knowledgeCommit: options.knowledgeCommit,
    webCommit: options.webCommit,
    builtAt: new Date(options.sourceDateEpoch * 1000).toISOString(),
    publicBaseUrl: baseUrl,
    mode: options.mode,
    nodeVersion: process.version,
    publishedArticleIds: published.map(article => article.id).sort(),
    publishedArticles: published.map(article => ({ id: article.id, url: `${baseUrl}/es/articulos/${article.slug}/` })).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  };
  await writeFile(path.join(options.outputPath, 'build-info.json'), canonicalJson(buildInfo), 'utf8');
  const manifest = await createBuildManifest(options.outputPath);
  await writeFile(path.join(options.outputPath, 'build-manifest.json'), canonicalJson(manifest), 'utf8');
  return { rootDigest: manifest.rootDigest, pages: [...routes].sort(), publishedArticleIds: published.map(article => article.id).sort() };
}
