import { createHash } from 'node:crypto';
import type {
  Article,
  ArticleContent,
  Claim,
  ContentBlock,
  Entity,
  KnowledgeSnapshot,
  Observation,
  PublicPage,
  Source
} from '../types/canonical.ts';
import { entityById } from '../content/knowledge.ts';
import { assertSafeSlug, escapeHtml, escapeJsonForScript, safeExternalUrl, statusLabel, unreachable } from '../content/safety.ts';
import { es } from '../i18n/es.ts';

export interface RenderContext {
  baseUrl: string;
  assetCss: string;
  searchScript: string;
  searchIndex: string;
  preview: boolean;
}

function routeForEntity(entity: Entity): string | null {
  const slug = assertSafeSlug(entity.slug ?? entity.id.toLowerCase().replaceAll('_', '-'));
  const groups: Record<string, string> = {
    TOPIC: 'temas', SOURCE: 'fuentes', DOCUMENT: 'documentos', PERSON: 'personas',
    ORGANIZATION: 'organizaciones', INSTITUTION: 'organizaciones', PLACE: 'lugares', METRIC: 'cifras'
  };
  const group = groups[entity.entityType];
  return group ? `/es/${group}/${slug}/` : null;
}

function absolute(context: RenderContext, route: string): string {
  return `${context.baseUrl}${route}`;
}

function nav(): string {
  return `<nav aria-label="Navegación principal"><a href="/es/">${es.nav.home}</a><a href="/es/cifras/">${es.nav.figures}</a><a href="/es/buscar/">${es.nav.search}</a></nav>`;
}

function layout(context: RenderContext, page: { title: string; description: string; route: string; body: string; noindex?: boolean; jsonLd?: unknown }): string {
  const jsonLd = page.jsonLd ? escapeJsonForScript(page.jsonLd) : '';
  const jsonHash = jsonLd ? ` 'sha256-${createHash('sha256').update(jsonLd).digest('base64')}'` : '';
  const robots = page.noindex ? '<meta name="robots" content="noindex,nofollow">' : '';
  const preview = context.preview ? '<aside class="preview-banner" role="status">Vista previa — no publicado</aside>' : '';
  const structured = jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : '';
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'${jsonHash}; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests">
  <title>${escapeHtml(page.title)} · ${es.siteName}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:type" content="website">
  <link rel="canonical" href="${escapeHtml(absolute(context, page.route))}">
  <link rel="stylesheet" href="${escapeHtml(context.assetCss)}">
  ${robots}${structured}
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  ${preview}
  <header class="site-header"><a class="wordmark" href="/es/" aria-label="Colombia Clara, portada"><span>Colombia</span><strong>Clara</strong></a>${nav()}</header>
  <main id="contenido">${page.body}</main>
  <footer><p><strong>Colombia Clara</strong> — investigación pública con trazabilidad.</p><p><a href="/es/metodologia/">Metodología</a> · <a href="/es/correcciones/">Correcciones</a> · <a href="/build-info.json">Procedencia del build</a></p></footer>
</body>
</html>\n`;
}

export function renderHome(context: RenderContext, articles: Article[]): PublicPage {
  const body = articles.length === 0
    ? `<section class="hero empty"><p class="eyebrow">${es.empty.eyebrow}</p><h1>${es.empty.title}</h1><p>${es.empty.body}</p><a class="text-link" href="/es/metodologia/">Cómo publicamos →</a></section>
      <section class="trust-grid" aria-labelledby="criterios"><h2 id="criterios">Antes de publicar</h2><article><span>01</span><h3>Rastrear</h3><p>Cada afirmación debe conservar su fuente y localizador.</p></article><article><span>02</span><h3>Verificar</h3><p>La evidencia se revisa antes de adquirir estado público.</p></article><article><span>03</span><h3>Responder</h3><p>Las correcciones permanecen visibles y versionadas.</p></article></section>`
    : `<section class="hero"><p class="eyebrow">Investigaciones verificadas</p><h1>Hechos con contexto.<br>Fuentes a la vista.</h1><p>Publicamos únicamente expedientes aprobados y trazables.</p></section><section class="article-grid" aria-labelledby="ultimas"><h2 id="ultimas">Últimas investigaciones</h2>${articles.map(article => `<article><p class="meta">${escapeHtml(statusLabel(article.status))}</p><h3><a href="/es/articulos/${escapeHtml(article.slug)}/">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.description)}</p><time datetime="${escapeHtml(article.publishedAt ?? '')}">${escapeHtml(formatDate(article.publishedAt))}</time></article>`).join('')}</section>`;
  return { route: '/es/', title: 'Portada', description: 'Investigación pública con evidencia, contexto y trazabilidad.', html: layout(context, { title: 'Portada', description: 'Investigación pública con evidencia, contexto y trazabilidad.', route: '/es/', body }), sitemap: true, searchable: false };
}

function formatDate(value?: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value));
}

function renderEntityLink(snapshot: KnowledgeSnapshot, id: string): string {
  const entity = entityById(snapshot, id);
  const route = routeForEntity(entity);
  const label = entity.name ?? entity.title ?? entity.id;
  return route ? `<a href="${escapeHtml(route)}">${escapeHtml(label)}</a>` : escapeHtml(label);
}

function renderClaim(snapshot: KnowledgeSnapshot, id: string): string {
  const claim = entityById<Claim>(snapshot, id, 'CLAIM');
  const evidence = claim.evidenceIds.map(item => entityById(snapshot, item));
  const details = evidence.map(item => {
    const sourceId = typeof item.sourceId === 'string' ? item.sourceId : null;
    const locator = typeof item.locator === 'object' && item.locator ? JSON.stringify(item.locator) : '';
    return `<li>${sourceId ? renderEntityLink(snapshot, sourceId) : 'Evidencia canónica'}${locator ? ` — ${escapeHtml(locator)}` : ''}</li>`;
  }).join('');
  return `<aside class="evidence-card"><p class="badge">${escapeHtml(claim.claimType)} · ${escapeHtml(claim.verificationStatus)}</p><p>${escapeHtml(claim.statement)}</p><details><summary>Ver evidencia</summary><ul>${details}</ul></details></aside>`;
}

function renderSource(snapshot: KnowledgeSnapshot, id: string): string {
  const source = entityById<Source>(snapshot, id, 'SOURCE');
  const url = safeExternalUrl(source.url);
  const title = escapeHtml(source.title);
  return `<aside class="source-card"><p class="badge">Fuente · ${escapeHtml(source.sourceClass)}</p><p>${url ? `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${title}</a>` : title}</p>${source.publicationDate ? `<time datetime="${escapeHtml(source.publicationDate)}">${escapeHtml(formatDate(source.publicationDate))}</time>` : ''}</aside>`;
}

function renderObservation(snapshot: KnowledgeSnapshot, id: string): string {
  const observation = entityById<Observation>(snapshot, id, 'OBSERVATION');
  const revision = observation.revisions.find(item => item.id === observation.currentRevisionId);
  if (!revision) throw new Error(`Missing current revision for ${id}`);
  const value = typeof revision.value === 'number' ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 }).format(revision.value) : revision.value;
  return `<figure class="number-card"><figcaption>${escapeHtml(observation.period)}</figcaption><p><strong>${escapeHtml(value)}</strong> ${escapeHtml(revision.unit)}</p><p>Revisión: ${escapeHtml(revision.revisionType)} · Fuente: ${renderEntityLink(snapshot, revision.sourceId)}</p>${revision.uncertainty?.qualitativeNote ? `<p>${escapeHtml(revision.uncertainty.qualitativeNote)}</p>` : ''}</figure>`;
}

function renderBlock(snapshot: KnowledgeSnapshot, block: ContentBlock): string {
  switch (block.type) {
    case 'HEADING': return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
    case 'PARAGRAPH': return `<p>${escapeHtml(block.text)}</p>`;
    case 'QUOTE': return `<blockquote><p>${escapeHtml(block.text)}</p></blockquote>`;
    case 'LIST': {
      const tag = block.ordered ? 'ol' : 'ul';
      return `<${tag}>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
    }
    case 'CLAIM_REF': return renderClaim(snapshot, block.targetId);
    case 'SOURCE_REF': return renderSource(snapshot, block.targetId);
    case 'OBSERVATION_REF': return renderObservation(snapshot, block.targetId);
    case 'ASSET_REF': return '<aside class="media-withheld" role="note"><strong>Medio no publicado</strong><p>El expediente contiene un recurso visual que no se muestra hasta verificar sus derechos de uso.</p></aside>';
    case 'CALLOUT': return `<aside class="callout ${block.kind.toLowerCase()}"><strong>${escapeHtml(block.kind)}</strong><p>${escapeHtml(block.text)}</p></aside>`;
    default: return unreachable(block);
  }
}

export function renderArticle(context: RenderContext, snapshot: KnowledgeSnapshot, article: Article, content: ArticleContent): PublicPage {
  const body = `<article class="article"><header><p class="eyebrow">Investigación · ${escapeHtml(statusLabel(article.status))}</p><h1>${escapeHtml(article.title)}</h1><p class="dek">${escapeHtml(article.description)}</p><div class="article-meta"><span>Revisión ${escapeHtml(article.revision ?? '')}</span>${article.publishedAt ? `<time datetime="${escapeHtml(article.publishedAt)}">${escapeHtml(formatDate(article.publishedAt))}</time>` : ''}</div></header><div class="article-body">${content.blocks.map(block => renderBlock(snapshot, block)).join('')}</div><footer class="article-provenance"><h2>Procedencia</h2><p>Artículo canónico: <code>${escapeHtml(article.id)}</code>. Las fuentes y evidencias mostradas se resolvieron durante el build.</p></footer></article>`;
  return {
    route: `/es/articulos/${assertSafeSlug(article.slug)}/`,
    title: article.title,
    description: article.description,
    html: layout(context, { title: article.title, description: article.description, route: `/es/articulos/${article.slug}/`, body, noindex: context.preview, jsonLd: context.preview ? undefined : { '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.description, datePublished: article.publishedAt, url: absolute(context, `/es/articulos/${article.slug}/`) } }),
    sitemap: !context.preview,
    searchable: !context.preview
  };
}

export function renderFigures(context: RenderContext, snapshot: KnowledgeSnapshot, reachable: Set<string>): PublicPage {
  const metrics = [...snapshot.entities.values()].filter(entity => entity.entityType === 'METRIC' && reachable.has(entity.id));
  const body = `<section class="page-head"><p class="eyebrow">Datos con contexto</p><h1>Cifras</h1><p>Cada valor conserva unidad, periodo, revisión, metodología y fuente. No mezclamos series incompatibles.</p></section>${metrics.length ? `<section class="metric-list">${metrics.map(metric => `<article><p class="badge">Métrica</p><h2><a href="${escapeHtml(routeForEntity(metric) ?? '#')}">${escapeHtml(metric.name)}</a></h2><p>${escapeHtml(metric.description ?? '')}</p></article>`).join('')}</section>` : '<section class="empty-panel"><h2>Sin cifras publicadas</h2><p>Las métricas en revisión permanecen fuera del sitio público.</p></section>'}`;
  return { route: '/es/cifras/', title: 'Cifras', description: 'Métricas públicas con metodología, revisiones y fuentes.', html: layout(context, { title: 'Cifras', description: 'Métricas públicas con metodología, revisiones y fuentes.', route: '/es/cifras/', body }), sitemap: true, searchable: false };
}

export function renderEntityPage(context: RenderContext, snapshot: KnowledgeSnapshot, entity: Entity, reachable: Set<string>): PublicPage | null {
  if (!reachable.has(entity.id)) return null;
  const route = routeForEntity(entity);
  if (!route) return null;
  const title = entity.name ?? entity.title ?? entity.id;
  let extra = '';
  if (entity.entityType === 'SOURCE') extra = renderSource(snapshot, entity.id);
  if (entity.entityType === 'METRIC') {
    const observations = [...snapshot.entities.values()].filter(item => item.entityType === 'OBSERVATION' && reachable.has(item.id));
    extra = `<div class="data-table"><table><caption>Observaciones publicadas</caption><thead><tr><th>Periodo</th><th>Valor</th><th>Unidad</th><th>Revisión</th></tr></thead><tbody>${observations.map(item => {
      const observation = item as Observation;
      const revision = observation.revisions.find(value => value.id === observation.currentRevisionId);
      return revision ? `<tr><th scope="row">${escapeHtml(observation.period)}</th><td>${escapeHtml(revision.value)}</td><td>${escapeHtml(revision.unit)}</td><td>${escapeHtml(revision.revisionType)}</td></tr>` : '';
    }).join('')}</tbody></table></div>`;
  }
  const body = `<article class="entity"><p class="eyebrow">${escapeHtml(entity.entityType)}</p><h1>${escapeHtml(title)}</h1>${entity.description ? `<p class="dek">${escapeHtml(entity.description)}</p>` : ''}${extra}<p class="canonical-id">ID canónico: <code>${escapeHtml(entity.id)}</code></p></article>`;
  return { route, title, description: entity.description ?? `Ficha pública de ${title}.`, html: layout(context, { title, description: entity.description ?? `Ficha pública de ${title}.`, route, body, noindex: context.preview }), sitemap: !context.preview, searchable: !context.preview };
}

export function renderSearch(context: RenderContext): PublicPage {
  const body = `<section class="page-head"><p class="eyebrow">Índice local</p><h1>Buscar</h1><p>La búsqueda consulta únicamente contenido publicado incluido en este build.</p></section><section class="search-panel"><label for="q">Buscar en Colombia Clara</label><input id="q" type="search" autocomplete="off" data-search-index="${escapeHtml(context.searchIndex)}"><p id="search-status" role="status" aria-live="polite">Escribe una palabra para comenzar.</p><ol id="search-results"></ol><noscript><p>La búsqueda interactiva requiere JavaScript. Puedes navegar por la <a href="/es/">portada</a> y <a href="/es/cifras/">Cifras</a> sin JavaScript.</p></noscript></section><script type="module" src="${escapeHtml(context.searchScript)}"></script>`;
  return { route: '/es/buscar/', title: 'Buscar', description: 'Busca únicamente en el contenido publicado de Colombia Clara.', html: layout(context, { title: 'Buscar', description: 'Busca únicamente en el contenido publicado de Colombia Clara.', route: '/es/buscar/', body, noindex: true }), sitemap: false, searchable: false };
}

export function renderInfoPage(context: RenderContext, kind: 'methodology' | 'corrections'): PublicPage {
  const methodology = kind === 'methodology';
  const route = methodology ? '/es/metodologia/' : '/es/correcciones/';
  const title = methodology ? 'Metodología' : 'Correcciones';
  const description = methodology ? 'Cómo verificamos, aprobamos y publicamos.' : 'Política de correcciones visibles y versionadas.';
  const body = methodology
    ? '<article class="prose"><p class="eyebrow">Cómo trabajamos</p><h1>Metodología</h1><p>Colombia Clara separa los datos canónicos de su presentación. Cada build valida las fuentes, referencias, revisiones y permisos de publicación.</p><h2>Puerta editorial</h2><p>Solo los artículos con estado <strong>PUBLISHED</strong>, revisión aprobada y fecha de publicación llegan al sitio. La ausencia de artículos públicos nunca reduce este control.</p><h2>Fuentes y cifras</h2><p>Las afirmaciones enlazan su evidencia. Las cifras conservan unidad, periodo, geografía, revisión y metodología; no calculamos comparaciones no definidas por el expediente.</p></article>'
    : '<article class="prose"><p class="eyebrow">Registro público</p><h1>Correcciones</h1><p>Las correcciones sustantivas se conservan como revisiones visibles. Nunca sustituimos silenciosamente la evidencia de una publicación.</p><p>No hay correcciones públicas registradas en este build.</p></article>';
  return { route, title, description, html: layout(context, { title, description, route, body }), sitemap: true, searchable: false };
}

export function render404(context: RenderContext): PublicPage {
  const body = '<section class="hero empty"><p class="eyebrow">Error 404</p><h1>Esta página no existe.</h1><p>La ruta pudo cambiar o todavía no está publicada.</p><a class="text-link" href="/es/">Volver a la portada →</a></section>';
  return { route: '/404.html', title: 'Página no encontrada', description: 'La página solicitada no existe.', html: layout(context, { title: 'Página no encontrada', description: 'La página solicitada no existe.', route: '/404.html', body, noindex: true }), sitemap: false, searchable: false };
}
