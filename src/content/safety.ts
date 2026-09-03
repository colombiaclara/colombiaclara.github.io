import type { Article, ArticleStatus, MediaAsset } from '../types/canonical.ts';

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COMMIT = /^[0-9a-f]{40}$/;
const CONTROL = /[\u0000-\u001f\u007f]/;

export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

export function assertSafeSlug(slug: string): string {
  if (!SAFE_SLUG.test(slug) || slug.includes('..') || /%2f|%5c/i.test(slug)) {
    throw new Error(`Unsafe slug: ${slug}`);
  }
  return slug;
}

export function assertSafeRoute(route: string): string {
  if (!route.startsWith('/') || route.includes('..') || route.includes('\\') || /%2f|%5c/i.test(route) || CONTROL.test(route)) {
    throw new Error(`Unsafe route: ${route}`);
  }
  return route;
}

export function safeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || CONTROL.test(raw)) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export function safeLocalPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || CONTROL.test(raw) || raw.includes('..') || raw.includes('\\')) return null;
  return /^\/[a-zA-Z0-9/_\-.]*$/.test(raw) ? raw : null;
}

export function isPublishableArticle(article: Article): boolean {
  return article.status === 'PUBLISHED'
    && Number.isInteger(article.revision)
    && (article.revision ?? 0) >= 1
    && typeof article.publishedAt === 'string'
    && article.publishedAt.length > 0
    && typeof article.approvalId === 'string'
    && article.approvalId.length > 0;
}

export function isMediaPublishable(asset: MediaAsset): boolean {
  const rights = `${asset.license ?? ''} ${asset.usageRights ?? ''} ${asset.rightsStatus ?? ''}`.toUpperCase();
  if (!asset.sourcePath || !asset.sha256) return false;
  return !rights.includes('RIGHTS_REVIEW_REQUIRED')
    && !rights.includes('PENDING')
    && !rights.includes('NO PUBLICAR')
    && Boolean(asset.license || asset.usageRights);
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO').replace(/[^a-z0-9ñ]+/g, ' ').trim();
}

export function statusLabel(status: ArticleStatus): string {
  const labels: Record<ArticleStatus, string> = {
    DRAFT: 'Borrador',
    RESEARCH: 'En investigación',
    REVIEW: 'En revisión',
    APPROVED: 'Aprobado',
    PUBLISHED: 'Publicado',
    DEPRECATED: 'Retirado',
    ARCHIVED: 'Archivado'
  };
  return labels[status];
}

export function assertProductionValue(name: string, value: string): string {
  if (!COMMIT.test(value)) throw new Error(`${name} must be an exact 40-character commit`);
  return value;
}

export function assertPublicBaseUrl(value: string): string {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
    throw new Error('PUBLIC_BASE_URL must use https outside localhost');
  }
  parsed.hash = '';
  parsed.search = '';
  return parsed.href.replace(/\/$/, '');
}

export function unreachable(value: never): never {
  throw new Error(`Unsupported content block: ${JSON.stringify(value)}`);
}
