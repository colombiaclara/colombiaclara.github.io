# SEO y sindicación

Cada página tiene título, descripción, canonical absoluta, Open Graph básico y headings coherentes. Los artículos públicos añaden JSON-LD `Article` derivado exclusivamente de campos canónicos. La CSP incluye el hash exacto del JSON-LD.

`sitemap.xml` solo incluye páginas rastreables; `feed.xml` solo Articles `PUBLISHED`; búsqueda, preview, redirección raíz y 404 usan `noindex` o quedan fuera. El índice de búsqueda se deriva solo del corpus público. No se emite `hreflang` hasta que exista una traducción real.

El español es la fuente inicial. `/en/` no se materializa para evitar una traducción ficticia.
