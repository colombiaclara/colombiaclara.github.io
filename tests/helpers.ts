import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { canonicalJson, sha256 } from '../src/build/canonical-json.ts';
import type { BuildOptions } from '../src/types/canonical.ts';

export const SPEC_COMMIT = 'eddd4f0cdc5caef169cf6be40a00f526ef6752f4';
export const KNOWLEDGE_COMMIT = '10202813c19357533fab0d85e309574bacd7e143';
export const WEB_COMMIT = '1111111111111111111111111111111111111111';

async function json(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, canonicalJson(value), 'utf8');
}

export async function createKnowledgeFixture(options: { status?: string; slug?: string; title?: string; mediaLicense?: string; tamper?: boolean } = {}): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'cc-web-fixture-'));
  const ids = {
    article: 'article_01990f6e-3c29-7a11-8a22-1234567890ab',
    claim: 'claim_01990f6e-3c21-7a11-8a22-1234567890ab',
    evidence: 'evidence_01990f6e-3c22-7a11-8a22-1234567890ab',
    source: 'source_01990f6e-3c23-7a11-8a22-1234567890ab',
    metric: 'metric_01990f6e-3c25-7a11-8a22-1234567890ab',
    series: 'series_01990f6e-3c26-7a11-8a22-1234567890ab',
    observation: 'obs_01990f6e-3c27-7a11-8a22-1234567890ab',
    place: 'place_01990f6e-3c2a-7a11-8a22-1234567890ab',
    topic: 'topic_01990f6e-3c2b-7a11-8a22-1234567890ab',
    asset: 'asset_01990f6e-3c2c-7a11-8a22-1234567890ab'
  };
  const status = options.status ?? 'PUBLISHED';
  const article = {
    id: ids.article, entityType: 'ARTICLE', slug: options.slug ?? 'expediente-tecnico', language: 'es',
    title: options.title ?? 'Expediente técnico de prueba', description: 'Fixture no editorial para verificar la publicación estática.',
    status, contentSource: 'content.es.md', claimIds: [ids.claim], sourceIds: [ids.source], metricIds: [ids.metric],
    observationIds: [ids.observation], entityIds: [ids.place], topicIds: [ids.topic], mediaAssetIds: [ids.asset],
    authors: [{ type: 'HUMAN', id: 'test-editor' }], revision: 1,
    ...(status === 'PUBLISHED' ? { publishedAt: '2026-01-02T00:00:00Z', approvalId: 'approval_test_001' } : {})
  };
  const entities = [
    { path: `articles/${ids.article}/article.json`, value: article, name: article.title },
    { path: `claims/${ids.claim}.json`, value: { id: ids.claim, entityType: 'CLAIM', statement: 'Una afirmación técnica verificable.', language: 'es', claimType: 'FACTUAL', verificationStatus: 'VERIFIED', evidenceIds: [ids.evidence], aboutIds: [ids.metric] }, name: null },
    { path: `evidence/${ids.evidence}.json`, value: { id: ids.evidence, entityType: 'EVIDENCE', claimId: ids.claim, sourceId: ids.source, locator: { type: 'PAGE', value: '12' }, excerpt: 'Dato de prueba.' }, name: null },
    { path: `sources/${ids.source}.json`, value: { id: ids.source, entityType: 'SOURCE', title: 'Fuente técnica de prueba', publisherId: ids.topic, sourceClass: 'PRIMARY_OFFICIAL', url: 'https://example.org/source', publicationDate: '2026-01-01', retrievedAt: '2026-01-02T00:00:00Z', license: 'CC0-1.0' }, name: 'Fuente técnica de prueba' },
    { path: `metrics/${ids.metric}.json`, value: { id: ids.metric, entityType: 'METRIC', name: 'Indicador técnico', slug: 'indicador-tecnico', description: 'Métrica de prueba.', measurementType: 'COUNT', canonicalUnit: 'items', methodologySourceIds: [ids.source] }, name: 'Indicador técnico' },
    { path: `series/${ids.series}.json`, value: { id: ids.series, entityType: 'SERIES', name: 'Serie técnica', metricId: ids.metric, placeId: ids.place, frequency: 'ANNUAL' }, name: 'Serie técnica' },
    { path: `observations/${ids.observation}.json`, value: { id: ids.observation, entityType: 'OBSERVATION', seriesId: ids.series, period: '2026', placeId: ids.place, revisions: [{ id: 'obsrev_01990f6e-3c28-7a11-8a22-1234567890ab', revisionType: 'INITIAL', value: 42, unit: 'items', publishedAt: '2026-01-01', sourceId: ids.source, retrievedAt: '2026-01-02T00:00:00Z' }], currentRevisionId: 'obsrev_01990f6e-3c28-7a11-8a22-1234567890ab' }, name: null },
    { path: `places/${ids.place}.json`, value: { id: ids.place, entityType: 'PLACE', name: 'Lugar de prueba', slug: 'lugar-de-prueba', placeType: 'COUNTRY' }, name: 'Lugar de prueba' },
    { path: `topics/${ids.topic}.json`, value: { id: ids.topic, entityType: 'TOPIC', name: 'Tema de prueba', slug: 'tema-de-prueba', description: 'Tema no editorial.' }, name: 'Tema de prueba' },
    { path: `media-assets/${ids.asset}.json`, value: { id: ids.asset, entityType: 'MEDIA_ASSET', mediaType: 'IMAGE', sourcePath: 'media/test.txt', mimeType: 'text/plain', sha256: sha256('fixture-media\n'), license: options.mediaLicense ?? 'RIGHTS_REVIEW_REQUIRED', usageRights: 'Prueba interna' }, name: null }
  ];
  for (const entity of entities) await json(path.join(root, entity.path), entity.value);
  await mkdir(path.join(root, 'media'), { recursive: true });
  await writeFile(path.join(root, 'media', 'test.txt'), 'fixture-media\n', 'utf8');
  const content = {
    articleId: ids.article, language: 'es', blocks: [
      { type: 'HEADING', level: 1, text: 'Expediente técnico' },
      { type: 'PARAGRAPH', text: 'Contenido de prueba sin valor editorial.' },
      { type: 'QUOTE', text: 'Cita técnica.' },
      { type: 'LIST', ordered: false, items: ['Uno', 'Dos'] },
      { type: 'CLAIM_REF', targetId: ids.claim },
      { type: 'SOURCE_REF', targetId: ids.source },
      { type: 'OBSERVATION_REF', targetId: ids.observation },
      { type: 'ASSET_REF', targetId: ids.asset },
      { type: 'CALLOUT', kind: 'CONTEXT', text: 'Contexto de prueba.' }
    ]
  };
  const catalog = entities.map(entity => ({ entityType: entity.value.entityType, id: entity.value.id, name: entity.name, path: entity.path }));
  const derived = {
    'catalog.json': catalog,
    'routes.json': { canonical: [{ articleId: ids.article, route: `/es/articulos/${article.slug}/` }], legacy: [] },
    [`articles/${ids.article}/content.es.json`]: content,
    'id-index.json': Object.fromEntries(entities.map(entity => [entity.value.id, { entityType: entity.value.entityType, path: entity.path }])),
    'reverse-references.json': {},
    'provenance-summary.json': { sourceClasses: { PRIMARY_OFFICIAL: 1 } }
  };
  for (const [relative, value] of Object.entries(derived)) await json(path.join(root, 'dist', relative), value);
  const files = [];
  for (const relative of Object.keys(derived).sort()) files.push({ path: relative, sha256: sha256(await readFile(path.join(root, 'dist', relative))) });
  await json(path.join(root, 'dist', 'build-manifest.json'), { algorithm: 'CC-DERIVED-SHA256-V1', files, knowledgeVersion: 'test-only', specCommit: SPEC_COMMIT });
  if (options.tamper) await writeFile(path.join(root, 'dist', 'catalog.json'), '{}\n', 'utf8');
  return root;
}

export async function buildOptions(knowledgePath: string, overrides: Partial<BuildOptions> = {}): Promise<BuildOptions> {
  const outputPath = await mkdtemp(path.join(tmpdir(), 'cc-web-output-'));
  return {
    knowledgePath,
    specPath: path.resolve(process.env.SPEC_PATH ?? '../colombia-clara-spec'),
    outputPath,
    publicBaseUrl: 'https://example.org/colombia-clara',
    mode: 'local',
    previewUnpublished: false,
    sourceDateEpoch: 1788316800,
    specCommit: SPEC_COMMIT,
    knowledgeCommit: KNOWLEDGE_COMMIT,
    webCommit: WEB_COMMIT,
    ...overrides
  };
}
