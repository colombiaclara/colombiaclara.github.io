export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ArticleStatus =
  | 'DRAFT'
  | 'RESEARCH'
  | 'REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'DEPRECATED'
  | 'ARCHIVED';

export interface Article {
  id: string;
  entityType: 'ARTICLE';
  slug: string;
  language: string;
  title: string;
  description: string;
  status: ArticleStatus;
  contentSource: string;
  claimIds: string[];
  sourceIds: string[];
  metricIds?: string[];
  observationIds?: string[];
  entityIds?: string[];
  topicIds?: string[];
  mediaAssetIds?: string[];
  authors?: Array<{ type: 'HUMAN' | 'AGENT'; id: string }>;
  publishedAt?: string;
  modifiedAt?: string;
  revision?: number;
  approvalId?: string;
  socialImageAssetId?: string;
}

export type ContentBlock =
  | { type: 'HEADING'; level: 1 | 2 | 3 | 4; text: string }
  | { type: 'PARAGRAPH'; text: string }
  | { type: 'QUOTE'; text: string }
  | { type: 'LIST'; ordered: boolean; items: string[] }
  | { type: 'CLAIM_REF'; targetId: string }
  | { type: 'SOURCE_REF'; targetId: string }
  | { type: 'OBSERVATION_REF'; targetId: string }
  | { type: 'ASSET_REF'; targetId: string }
  | { type: 'CALLOUT'; kind: 'NOTE' | 'WARNING' | 'CONTEXT'; text: string };

export interface ArticleContent {
  articleId: string;
  language: string;
  blocks: ContentBlock[];
}

export interface Entity {
  id: string;
  entityType: string;
  name?: string;
  title?: string;
  description?: string;
  slug?: string;
  aliases?: Array<{ value: string; language?: string; type?: string }>;
  [key: string]: unknown;
}

export interface Source extends Entity {
  entityType: 'SOURCE';
  title: string;
  sourceClass: string;
  url?: string;
  publicationDate?: string;
  retrievedAt: string;
  license?: string;
}

export interface Claim extends Entity {
  entityType: 'CLAIM';
  statement: string;
  claimType: string;
  verificationStatus: string;
  evidenceIds: string[];
}

export interface ObservationRevision {
  id: string;
  revisionType: string;
  value: number | string;
  unit: string;
  currency?: string;
  priceBasis?: string;
  referenceYear?: number;
  publishedAt: string;
  effectiveAt?: string;
  sourceId: string;
  methodologyVersion?: string;
  uncertainty?: { qualitativeNote?: string };
}

export interface Observation extends Entity {
  entityType: 'OBSERVATION';
  seriesId: string;
  period: string;
  placeId?: string;
  revisions: ObservationRevision[];
  currentRevisionId: string;
}

export interface MediaAsset extends Entity {
  entityType: 'MEDIA_ASSET';
  sourcePath: string;
  mimeType: string;
  sha256: string;
  license?: string;
  usageRights?: string;
  rightsStatus?: string;
}

export interface CatalogEntry {
  entityType: string;
  id: string;
  name: string | null;
  path: string;
}

export interface DerivedManifest {
  algorithm: string;
  knowledgeVersion: string;
  specCommit: string;
  files: Array<{ path: string; sha256: string }>;
}

export interface KnowledgeSnapshot {
  root: string;
  catalog: CatalogEntry[];
  entities: Map<string, Entity>;
  articles: Article[];
  content: Map<string, ArticleContent>;
  manifest: DerivedManifest;
  routes: {
    canonical: Array<{ articleId: string; route: string }>;
    legacy: Array<Record<string, unknown>>;
  };
}

export interface BuildOptions {
  knowledgePath: string;
  specPath: string;
  outputPath: string;
  publicBaseUrl: string;
  mode: 'local' | 'production' | 'preview';
  previewUnpublished: boolean;
  sourceDateEpoch: number;
  specCommit: string;
  knowledgeCommit: string;
  webCommit: string;
}

export interface PublicPage {
  route: string;
  title: string;
  description: string;
  html: string;
  sitemap: boolean;
  searchable: boolean;
}
