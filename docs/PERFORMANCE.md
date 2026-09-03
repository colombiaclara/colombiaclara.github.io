# Rendimiento

Presupuestos comprimidos: HTML 50 KB, CSS 50 KB, JS crítico 50 KB, fuentes 100 KB, medio above-the-fold 250 KB y transferencia inicial 500 KB. `scripts/check-output.mjs performance` aplica gzip nivel 9 a HTML/CSS/JS y suma portada, CSS y búsqueda.

El build público real de v0.1.0, sin artículos publicados, midió 4.063 bytes de transferencia inicial comprimida en la primera medición y 2.278 bytes como mayor asset comprobado. La medición final se registra en `docs/IMPLEMENTATION_REPORT.md` tras el release. No se envían fuentes, imágenes ni scripts de terceros. Los nombres de CSS, JS e índice contienen un hash de contenido.
