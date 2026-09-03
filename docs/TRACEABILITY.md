# Trazabilidad

| Requisito | Autoridad | Implementación | Prueba |
| --- | --- | --- | --- |
| Solo `PUBLISHED` | Article schema y política editorial | `isPublishableArticle` | integration: exclusión REVIEW |
| Derechos afirmativos | media-asset schema/licensing | `isMediaPublishable` | security: pending rights |
| Schemas externos | contracts/knowledge | checkouts y `validate:knowledge` | contract: no schemas copiados |
| Bloques exhaustivos | article-content schema | `renderBlock` discriminado | contract: nueve tipos |
| HTML real | static-first/web | `writePage` por directorio | E2E estructural |
| Sin JS funcional | web/javascript | HTML con links/evidencia | E2E estructural |
| XSS/CSP | security/web-security | escape, JSON seguro, CSP | security: payload malicioso |
| Cifras trazables | domain/quantitative-data | tabla y revisión actual | accessibility/E2E |
| SEO cerrado | web/seo | sitemap/feed/index filtrados | integration y SEO check |
| 500 KB | ADR 0010 | budget checker | performance check |
| Determinismo | build/normalization | canonical JSON y manifests | determinism check |
| LIVE con evidencia | Agents publication contract | deployment evidence | workflow + docs contract |
