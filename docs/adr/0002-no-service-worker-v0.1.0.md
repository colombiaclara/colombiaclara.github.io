# ADR 0002 — Sin Service Worker en v0.1.0

Estado: aceptado, 2026-09-02.

Se omite cache offline para evitar que una corrección editorial retirada siga sirviéndose. GitHub Pages/CDN puede cachear assets inmutables con hash; HTML y manifests requieren revalidación. Un Service Worker futuro necesita versionado, limpieza, límites y pruebas de corrección obsoleta.
