# Renderizado de contenido

| Bloque canónico | Representación |
| --- | --- |
| `HEADING` | `h1`–`h4` según `level` |
| `PARAGRAPH` | Párrafo escapado |
| `QUOTE` | `blockquote` con párrafo |
| `LIST` | `ol` o `ul` según `ordered` |
| `CLAIM_REF` | Tarjeta con tipo, estado, afirmación y evidencia |
| `SOURCE_REF` | Tarjeta con clase, título, fecha y URL validada |
| `OBSERVATION_REF` | Valor, unidad, periodo, revisión, fuente e incertidumbre |
| `ASSET_REF` | Medio solo si sus derechos son afirmativos; nota de retención en otro caso |
| `CALLOUT` | Nota contextual, advertencia o contexto |

Todo texto se escapa. Las URLs externas admiten `https:` y `http:`; los slugs y rutas rechazan traversal, controles, separadores codificados y rutas absolutas no permitidas. Las referencias se resuelven en build; una referencia rota o un bloque desconocido aborta la generación.

Las páginas de fuente, tema, documento, persona, organización, lugar y métrica solo se crean si son alcanzables desde un Article visible. El build público usa exclusivamente Articles `PUBLISHED`; el preview no convierte el contenido en público.
