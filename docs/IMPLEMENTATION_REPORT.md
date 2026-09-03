# Informe de implementación v0.1.0

Estado previo al empaquetado: implementación completa con una limitación de infraestructura de browser QA documentada.

## Resultado

- Generador estático TypeScript/Node 24 sin framework ni dependencias de ejecución del navegador.
- Build público real: 6 rutas lógicas, 7 HTML físicos incluida la redirección raíz, 0 Articles publicados y 0 medios copiados.
- El Article piloto `REVIEW` y el asset `RIGHTS_REVIEW_REQUIRED` no aparecen en HTML, búsqueda, sitemap, feed, rutas ni manifests públicos.
- `build-info.json`, `build-manifest.json`, assets con hash y evidencia de deploy preparada.

## Validaciones

| Capa | Resultado |
| --- | --- |
| Spec v0.2.0 | 31 schemas; ejemplos de 30 entidades; 10 probes negativos; 104 Markdown; 165 archivos |
| Knowledge v0.1.0 | 29 entidades; 8 mutaciones negativas; 7 derivados; digest `3896f796…9588` |
| Formato/lint/TypeScript | Aprobados; `tsc --noEmit` real con TypeScript 5.9.2 |
| Pruebas Web | 25/25 aprobadas; 0 fallidas; 0 omitidas dentro del runner |
| Cobertura | 99,72 % líneas; 85,67 % ramas; 97,50 % funciones |
| Links/SEO/seguridad estructural | 7 HTML comprobados; aprobados |
| Rendimiento | 4.106 bytes iniciales gzip; mayor asset comprobado 2.278 bytes |
| Determinismo | Dos builds iguales; digest final se actualiza al cerrar release |
| Dependencias | `npm audit`: 0 vulnerabilidades; TypeScript 5.9.2, Apache-2.0 |

## Limitación de QA

La prueba de navegador supervisada no se ejecutó: el entorno aislado de preview no puede montar el checkout externo de Knowledge y excluye `dist/` por diseño. Se hicieron dos intentos permitidos y ambos fallaron antes de abrir el navegador; no hubo violaciones observadas ni un resultado de navegador que pueda declararse aprobado. Las pruebas E2E de v0.1.0 son estructurales sobre HTML real y cubren rutas, navegación enlazable, contenido sin JavaScript, base path, evidencia, Cifras, búsqueda y 404. Antes del primer despliegue debe añadirse/fijarse un runner reproducible Playwright + axe o ejecutar la auditoría en CI con los checkouts hermanos disponibles.

## Pendiente antes del primer despliegue

Proteger ramas y environment, configurar la URL real, verificar acceso entre repositorios, ejecutar browser/axe, revisar accesibilidad manual, confirmar CODEOWNERS y autorizar al menos un Article y sus medios por el flujo editorial.
