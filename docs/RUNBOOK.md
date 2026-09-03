# Runbook

## Build local

1. Compruebe Node `24.19.0` y los commits de los checkouts hermanos.
2. Ejecute `npm ci`.
3. Ejecute `SPEC_PATH=… KNOWLEDGE_PATH=… npm run check`.
4. Abra `npm run preview` solo para inspección local.

## Fallo de validación

- Digest: descarte el checkout y recupere el commit exacto; no regenere el lock.
- Referencia o schema: corrija Knowledge mediante su flujo editorial; Web no repara el corpus.
- Bloque desconocido: añada renderer y pruebas antes de aceptar la nueva versión de Spec.
- Presupuesto: reduzca la salida o apruebe una excepción mediante ADR; no eleve silenciosamente el límite.
- Determinismo: busque orden de filesystem, locale, timestamps o datos ambientales.

## Publicación y rollback

Use únicamente `Trusted GitHub Pages deployment` desde un commit protegido. Confirme la evidencia antes de que Agents marque `LIVE`. Para rollback ejecute el workflow desde la versión anterior; no modifique `gh-pages`.

## Corrección urgente

Genere una revisión canónica nueva, aprobación humana y commit Knowledge. Reconstruya Web; confirme que la URL, manifest y corrección visible corresponden al mismo build.
