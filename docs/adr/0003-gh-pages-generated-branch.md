# ADR 0003 — Rama `gh-pages` generada

Estado: aceptado, 2026-09-02.

Se conserva literalmente el flujo normativo `dist → gh-pages → GitHub Pages`. La rama se reescribe solo desde el workflow protegido con `--force-with-lease`, nunca desde un PR ni manualmente. La verificación HTTP posterior es independiente del éxito del push.
