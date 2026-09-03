# Despliegue

`validate.yml` usa permisos `contents: read`, no usa secretos y hace checkouts exactos de Spec y Knowledge antes de `npm run check`. `deploy.yml` es manual, usa environment `production`, reconstruye desde cero y publica únicamente `dist/` en la rama generada `gh-pages` con `--force-with-lease`.

Tras la publicación, el workflow descarga `build-info.json` y `build-manifest.json`, compara Web commit y root digest, y solo entonces crea `deployment-evidence.json`. La rama `gh-pages` no admite edición manual.

Rollback: volver a ejecutar el workflow desde un commit Web anterior compatible y el Knowledge commit aprobado correspondiente. Nunca edite `gh-pages`; reconstruya la proyección. Para una corrección urgente, publique una nueva revisión canónica y conserve la anterior en Knowledge.

Antes del primer uso: proteger `main`, `gh-pages` y el environment; confirmar que los repositorios hermanos son accesibles; cambiar `PUBLIC_BASE_URL` por la URL aprobada; revisar CODEOWNERS reales y habilitar Pages desde `gh-pages`.
