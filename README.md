# Colombia Clara Web

Generador estático auditable para la publicación pública de Colombia Clara. Consume `colombia-clara-spec` y `colombia-clara-knowledge` en build time, genera HTML real en `dist/` y no necesita Node, base de datos, backend ni Agents en producción.

## Contrato de publicación

El filtro es cerrado: solo entra un artículo con `status: PUBLISHED`, `revision >= 1`, `publishedAt` y `approvalId`. Un medio requiere derechos afirmativos; `RIGHTS_REVIEW_REQUIRED`, permisos pendientes o faltantes lo excluyen. El piloto de Knowledge v0.1.0 está en `REVIEW`, por eso el build público inicial muestra un estado vacío y no filtra su título, cuerpo, ruta ni imagen.

## Requisitos

- Node `24.20.0` exacto (`.node-version`, `.nvmrc` y `package.json`).
- Checkouts hermanos de Spec `8f79e8c2a1ba2caaaf418549fe0c4cf5ef4399fe` y Knowledge `10202813c19357533fab0d85e309574bacd7e143`.
- `npm ci` para instalar TypeScript `5.9.2` fijado.

## Inicio rápido

```bash
nvm use
npm ci
SPEC_PATH=../colombia-clara-spec KNOWLEDGE_PATH=../colombia-clara-knowledge npm run build
npm run preview
```

La vista local queda en `http://127.0.0.1:4173/es/`. Para revisar contenido no publicado localmente:

```bash
SPEC_PATH=../colombia-clara-spec KNOWLEDGE_PATH=../colombia-clara-knowledge npm run dev
```

Ese modo añade “Vista previa — no publicado”, `noindex,nofollow`, excluye sitemap/feed y no puede activarse con `BUILD_MODE=production`.

## Verificación completa

```bash
SPEC_PATH=../colombia-clara-spec KNOWLEDGE_PATH=../colombia-clara-knowledge npm run check
```

Los comandos individuales documentados en `package.json` cubren formato, lint, `tsc --noEmit`, contratos externos, pruebas unitarias/integración/E2E estructural/accesibilidad/seguridad, links, SEO, presupuestos y determinismo.

## Producción

El build confiable exige `SPEC_COMMIT`, `KNOWLEDGE_COMMIT`, `WEB_COMMIT`, `SOURCE_DATE_EPOCH`, `PUBLIC_BASE_URL`, `BUILD_MODE=production` y `PREVIEW_UNPUBLISHED=false`. El workflow preparado reconstruye desde checkouts exactos, publica únicamente `dist/` en `gh-pages`, verifica por HTTP y emite `deployment-evidence.json`. Antes del primer despliegue deben crearse los tres repositorios bajo la misma organización o ajustarse las rutas declarativas, proteger `main`, `gh-pages` y el environment `production`, y aprobar la URL pública.

No se realizó ningún push ni despliegue durante la creación de v0.1.0.

## Documentación

Arquitectura, renderizado, seguridad, accesibilidad, rendimiento, SEO, despliegue, integración con Agents, runbook y trazabilidad están en [`docs/`](docs/ARCHITECTURE.md).
