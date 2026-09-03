import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from '../build/canonical-json.ts';
import type {
  Article,
  ArticleContent,
  CatalogEntry,
  DerivedManifest,
  Entity,
  KnowledgeSnapshot
} from '../types/canonical.ts';

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

function referencedIds(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const fields = ['claimIds', 'sourceIds', 'metricIds', 'observationIds', 'entityIds', 'topicIds', 'mediaAssetIds', 'evidenceIds', 'aboutIds', 'datasetIds'];
  return fields.flatMap(field => Array.isArray(record[field]) ? record[field] as string[] : []);
}

export async function verifyDerivedManifest(root: string): Promise<DerivedManifest> {
  const manifestPath = path.join(root, 'dist', 'build-manifest.json');
  const manifest = await readJson<DerivedManifest>(manifestPath);
  if (manifest.algorithm !== 'CC-DERIVED-SHA256-V1') throw new Error(`Unsupported Knowledge manifest algorithm: ${manifest.algorithm}`);
  const seen = new Set<string>();
  for (const entry of manifest.files) {
    if (seen.has(entry.path) || entry.path.includes('..') || path.isAbsolute(entry.path)) throw new Error(`Unsafe or duplicate derived path: ${entry.path}`);
    seen.add(entry.path);
    const content = await readFile(path.join(root, 'dist', entry.path));
    if (sha256(content) !== entry.sha256) throw new Error(`Knowledge digest mismatch: ${entry.path}`);
  }
  return manifest;
}

export async function loadKnowledge(root: string, expectedSpecCommit: string): Promise<KnowledgeSnapshot> {
  const manifest = await verifyDerivedManifest(root);
  if (manifest.specCommit !== expectedSpecCommit) throw new Error(`Knowledge derives from unexpected Spec commit: ${manifest.specCommit}`);
  const catalog = await readJson<CatalogEntry[]>(path.join(root, 'dist', 'catalog.json'));
  const routes = await readJson<KnowledgeSnapshot['routes']>(path.join(root, 'dist', 'routes.json'));
  const entities = new Map<string, Entity>();
  const articles: Article[] = [];
  const content = new Map<string, ArticleContent>();

  for (const entry of catalog) {
    if (entities.has(entry.id)) throw new Error(`Duplicate canonical ID: ${entry.id}`);
    const entity = await readJson<Entity>(path.join(root, entry.path));
    if (entity.id !== entry.id || entity.entityType !== entry.entityType) throw new Error(`Catalog mismatch for ${entry.id}`);
    entities.set(entity.id, entity);
    if (entity.entityType === 'ARTICLE') {
      const article = entity as unknown as Article;
      articles.push(article);
      const contentPath = path.join(root, 'dist', 'articles', article.id, `content.${article.language}.json`);
      const articleContent = await readJson<ArticleContent>(contentPath);
      if (articleContent.articleId !== article.id || articleContent.language !== article.language) throw new Error(`Article content mismatch: ${article.id}`);
      content.set(article.id, articleContent);
    }
  }

  for (const entity of entities.values()) {
    for (const id of referencedIds(entity)) {
      if (!entities.has(id)) throw new Error(`Broken canonical reference ${entity.id} -> ${id}`);
    }
  }
  for (const articleContent of content.values()) {
    for (const block of articleContent.blocks) {
      if ('targetId' in block && !entities.has(block.targetId)) throw new Error(`Broken block reference ${articleContent.articleId} -> ${block.targetId}`);
    }
  }

  const routeSet = new Set<string>();
  for (const route of routes.canonical) {
    if (routeSet.has(route.route)) throw new Error(`Duplicate canonical route: ${route.route}`);
    routeSet.add(route.route);
    if (!entities.has(route.articleId)) throw new Error(`Route references unknown article: ${route.articleId}`);
  }
  return { root, catalog, entities, articles, content, manifest, routes };
}

export function entityById<T extends Entity>(snapshot: KnowledgeSnapshot, id: string, expectedType?: string): T {
  const entity = snapshot.entities.get(id);
  if (!entity) throw new Error(`Unknown entity: ${id}`);
  if (expectedType && entity.entityType !== expectedType) throw new Error(`Expected ${expectedType} for ${id}, received ${entity.entityType}`);
  return entity as T;
}

export function collectReachableIds(snapshot: KnowledgeSnapshot, articles: Article[]): Set<string> {
  const reachable = new Set<string>(articles.map(article => article.id));
  const queue = [...reachable];
  while (queue.length) {
    const id = queue.shift()!;
    const entity = snapshot.entities.get(id);
    if (entity) {
      for (const target of referencedIds(entity)) {
        if (!reachable.has(target)) { reachable.add(target); queue.push(target); }
      }
    }
    const articleContent = snapshot.content.get(id);
    if (articleContent) {
      for (const block of articleContent.blocks) {
        if ('targetId' in block && !reachable.has(block.targetId)) { reachable.add(block.targetId); queue.push(block.targetId); }
      }
    }
  }
  return reachable;
}
