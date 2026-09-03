# ADR 0001 — Generador estático sin runtime de navegador

Estado: aceptado, 2026-09-02.

Se usa TypeScript ejecutado en Node 24 durante build, plantillas explícitas y APIs nativas. El navegador recibe HTML, CSS y un módulo pequeño de búsqueda; no recibe framework. Esto conserva la arquitectura normativa, minimiza supply chain, permite HTML por ruta y mantiene el contenido central sin JavaScript.
