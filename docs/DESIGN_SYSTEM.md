# Sistema de diseño

La tesis visual es “expediente público contemporáneo”: tipografía editorial grande, superficies blancas sobre papel gris claro, azul profundo para confianza, amarillo para advertencia y rojo limitado a señales. La firma es tipográfica y provisional.

Los tokens viven en `src/styles/main.css`: fondo, superficie, texto, texto secundario, bordes, foco, evidencia, advertencia, escala espacial, ancho de lectura y ancho total. El cuerpo usa la pila de sistema; el texto largo usa Georgia como serif disponible localmente. No hay fuentes remotas ni imágenes decorativas.

El layout responde desde 320 CSS px: navegación flexible, grillas de tres columnas que pasan a una, tablas con scroll horizontal y títulos fluidos. Hay foco visible, modo de contraste aumentado, movimiento reducido e impresión sin navegación. El texto de cuerpo parte de 16 px; los metadatos no bajan de 12,5 px.
