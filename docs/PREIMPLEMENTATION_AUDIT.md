# Auditoría previa a la implementación

Fecha: 2026-09-02. Alcance: ZIP de release recibidos para Spec v0.2.0, Knowledge v0.1.0 y Agents v0.1.0. Ninguna entidad canónica fue editada.

## Integridad

| Entrada | SHA-256 observado | Resultado |
| --- | --- | --- |
| Spec | `e781c75b9a724dd9f8ff4a254319afb49039cb74e3adb58df98ffab73776b784` | Coincide |
| Knowledge | `1e63ca4f832f3c56b7443557c48c963447fe27a670117f94a40b5dc01369c7be` | Coincide |
| Agents | `ca7e7f46cab6fe1bb14eeb0557d6b61967d53efa88ddc06fb0fa011324965123` | Coincide |

Los ZIP no incluyen `.git`; por tanto prueban integridad del release recibido, pero no demuestran por sí solos la existencia de los commits declarados. Los manifiestos y locks declaran respectivamente `8f79e8c2a1ba2caaaf418549fe0c4cf5ef4399fe`, `10202813c19357533fab0d85e309574bacd7e143` y `ff0f1753d1a5a8867425f1a6143fb44a4f26c574`. CI exige checkouts Git exactos.

## Validaciones ejecutadas

- Spec: `npm ci`; `npm test`. Resultado: 31 schemas resueltos, ejemplos positivos/negativos para 30 entidades, 10 falsos positivos rechazados, enlaces de 104 Markdown comprobados y manifiesto de 165 archivos válido.
- Knowledge: `npm ci`; `npm run build`; `npm test`. Resultado: 29 entidades y 1 Article válidos, 8 mutaciones negativas rechazadas, 7 archivos derivados reproducibles con digest `3896f79667ed26e290431ae51cf449613ea03dbb4498b1d9000e86f82b9a9588`, manifiesto de 64 archivos válido.
- El `spec.lock.json` de Knowledge coincide con Spec v0.2.0, commit, árbol lógico `440fe8…0214` y conjunto de schemas `12054b…a5f4`.
- El único Article real tiene estado `REVIEW`. Su asset tiene `license: RIGHTS_REVIEW_REQUIRED` y `usageRights` explícitamente no publicable.
- La única dependencia de desarrollo de Web es TypeScript 5.9.2 (Apache-2.0); `npm audit --audit-level=high` informó 0 vulnerabilidades al cerrar la implementación.

## Contratos revisados

Se revisaron arquitectura estática, límites build/runtime, contratos Web/Knowledge/build, Node, normalización, GitHub Pages, TypeScript/JavaScript, accesibilidad, rendimiento, búsqueda, SEO, i18n, Cifras, cache, analítica, diseño, seguridad, supply chain, política editorial y schemas. En Agents se revisaron `CiStatusPort`, `PublicationEvidencePort`, `PublicationService.reconcileCi`, `verifyLive` y la transición `BUILDING → LIVE`.

## Decisiones conservadoras

1. El sitio público inicial contiene portada vacía, Cifras vacía, búsqueda vacía, metodología, correcciones y 404. No crea páginas de entidades aisladas del artículo no publicable.
2. El preview local puede representar `REVIEW`, pero conserva medios pendientes fuera del output y elimina el expediente de sitemap, feed e índice.
3. Se implementan los nueve bloques vigentes del schema (`HEADING`, `PARAGRAPH`, `QUOTE`, `LIST`, cuatro referencias y `CALLOUT`). Un discriminante nuevo falla.
4. No se implementa Service Worker en v0.1.0 para evitar servir correcciones obsoletas.
5. Se usa la firma tipográfica provisional “Colombia Clara”; no se inventa logotipo.

## Riesgos y huecos

- Agents v0.1.0 devuelve de `PublicationEvidencePort` solo `live`, `publicUrl` y `webCommit`; no modela todavía Knowledge commit ni digest del manifiesto. Web emite evidencia más rica y documenta la ampliación compatible.
- Los estados de publicación no incluyen un objeto de aprobación enlazado en los derivados de Knowledge; Web aplica los campos exigidos por el schema Article, pero CI debe seguir validando el corpus completo.
- GitHub Pages no ofrece headers HTTP configurables; la CSP por meta no puede expresar `frame-ancestors`. Se documentan headers recomendados para un CDN futuro.
- La conformidad WCAG total requiere revisión manual adicional; los tests automatizados cubren estructura y controles verificables.
