# Seguridad

## Amenazas

- XSS desde títulos, bloques, aliases, URLs y JSON-LD canónicos.
- Traversal o colisión de slugs y rutas.
- Fuga de material `REVIEW`, notas internas o medios sin derechos mediante HTML, índices, mapas o manifests.
- Manipulación del manifiesto derivado de Knowledge.
- Supply chain o workflow privilegiado controlado por un PR.

## Controles

Escape por defecto, JSON seguro para contexto `<script>`, allowlist de protocolos, validación de rutas, resolución exhaustiva de bloques, verificación SHA-256 de cada derivado y asset, salida sin source maps, CSP meta, cero scripts de terceros y analítica NoOp. El deploy reconstruye desde checkouts exactos y prohíbe preview.

GitHub Pages limita los headers. Para un CDN futuro se recomiendan `Content-Security-Policy` por header con `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva y HSTS tras confirmar HTTPS en todo el dominio.

No se almacenan secretos. Las credenciales de GitHub pertenecen al environment protegido y nunca forman parte de la URL remota ni del bundle.
