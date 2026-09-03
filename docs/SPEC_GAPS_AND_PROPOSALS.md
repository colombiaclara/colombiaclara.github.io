# Huecos de Spec y propuestas

1. **Elegibilidad de entidades no Article.** Spec no define con precisión si una fuente o métrica puede publicarse sin Article público. v0.1.0 exige alcanzabilidad desde un Article visible. Propuesta: añadir una política de visibilidad por entidad.
2. **Aprobación Article.** El schema exige `approvalId` para `PUBLISHED`, pero no define en Knowledge una referencia verificable a Approval. Propuesta: manifest de publicación que enlace Article revision, content hash y aprobación.
3. **Evidencia LIVE.** Agents v0.1.0 no tipa todos los campos de `deployment-evidence.json`. Propuesta: contrato común versionado en Spec.
4. **CSP de JSON-LD.** Spec exige CSP y JSON-LD, pero no fija el algoritmo para hashes por página. v0.1.0 calcula SHA-256 del texto exacto.
5. **GitHub Pages base path.** Los ejemplos asumen raíz. v0.1.0 deriva el prefijo del pathname de `PUBLIC_BASE_URL`; se propone formalizarlo.
6. **Accesibilidad automatizada.** No se fija navegador/herramienta. La base incluye pruebas estructurales; antes de producción debe fijarse Playwright + axe o equivalente con versiones reproducibles.

Ningún hueco modificó Spec o Knowledge durante esta implementación.
