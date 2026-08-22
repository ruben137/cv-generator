# Job Match Analysis — arquitectura del MVP

Este módulo contiene el dominio puro del analizador. No depende de React, Next.js, almacenamiento ni APIs externas, por lo que puede ejecutarse completamente en el navegador y probarse de forma aislada.

## Decisiones del modelo

- Un concepto tiene un identificador estable y etiquetas localizadas.
- Los alias representan el mismo concepto; las herramientas y metodologías relacionadas se modelan como relaciones con menor confianza.
- Las coincidencias conservan los términos originales, su fuente, el tipo de coincidencia y una explicación traducible.
- Los términos desconocidos no se descartan: aparecen como términos sin clasificar para revisión manual.
- Una habilidad ausente genera una sugerencia de revisión, nunca una instrucción para inventarla.

## Puntuación explicable

La coincidencia general se calcula con cuatro componentes visibles:

| Componente | Peso inicial |
| --- | ---: |
| Habilidades y requisitos | 45 % |
| Palabras clave relevantes | 25 % |
| Título profesional | 15 % |
| Evidencia en la experiencia | 15 % |

Cada cobertura se limita al rango 0–1. Los pesos se normalizan, por lo que pueden ajustarse posteriormente sin romper la escala. El resultado se redondea a un porcentaje de coincidencia y siempre debe mostrarse acompañado por su desglose y el aviso de que no representa un ATS real.

## Pipeline lingüístico

El bloque 2 incorpora normalización Unicode, variantes ortográficas controladas, tokenización y búsqueda por ventanas completas de tokens. Esta última evita falsos positivos como encontrar `java` dentro de `javascript`.

La extracción produce dos grupos iniciales:

- requisitos asociados a señales explícitas como “se requiere”, “deseable”, “must” o “nice to have”;
- palabras y expresiones de hasta tres términos que se repiten en la descripción.

Las reglas están disponibles en español e inglés. Las equivalencias semánticas todavía no forman parte de esta capa: `Node.js` y `NodeJS` sí se normalizan por ser variantes ortográficas, pero `Git` y “control de versiones” deberán relacionarse mediante el diccionario profesional.

## Límites actuales

El bloque 3 incorpora un diccionario inicial para las ocho familias profesionales que ya existen en CV Simple, además de competencias transversales y herramientas compartidas. Cada área vive en su propio archivo y el registro valida identificadores, etiquetas, confianza y relaciones.

El diccionario es deliberadamente pequeño: busca cubrir conceptos frecuentes con buena precisión antes de ampliar el catálogo. La extracción basada en reglas conserva términos desconocidos para que el motor pueda mostrarlos al usuario. La interfaz todavía no forma parte de este módulo.

## Fuentes externas y actualización

`npm run dictionary:sync` consulta ESCO únicamente durante el desarrollo y genera `data/job-match/esco-candidates.json`. La aplicación publicada no consulta ESCO ni otra API durante el análisis. Los candidatos deben revisarse antes de incorporarlos a `concepts/esco-curated.ts`, donde conservan el URI y la versión de origen.

`npm run dictionary:validate` comprueba la estructura, los identificadores de fuente y una muestra bilingüe de conceptos. Consulta `DATA_SOURCES.md` para conocer la atribución y el criterio de adaptación.

## Motor de comparación

El bloque 4 conecta extracción y taxonomía. Busca conceptos en la vacante y en cada sección del CV, prioriza coincidencias del mismo concepto y usa relaciones solamente como evidencia parcial. La similitud aproximada admite una única edición en palabras de cinco o más caracteres y nunca se utiliza como equivalencia semántica.

La puntuación se obtiene a partir de cobertura de habilidades, palabras clave, título y evidencia en experiencia. Cuando la entrada no permite evaluar un componente —por ejemplo, no contiene ninguna habilidad reconocida— este se marca como no disponible y su peso se redistribuye entre los componentes evaluables; no se interpreta como una coincidencia de cero. El informe conserva el desglose, requisitos ausentes, términos sin clasificar y recomendaciones. El adaptador de `CvData` omite fechas al construir evidencia profesional para evitar que un año se interprete como un logro cuantificado.

## Experiencia, privacidad y publicación

Los bloques 5–7 exponen el motor mediante una página bilingüe accesible desde el generador. El CV actual se proyecta a `ResumeMatchInput`, sin fotografía, y se entrega mediante una transferencia local de un solo uso. La vacante, el CV y el resultado permanecen en memoria del navegador; no existe una ruta de API para el análisis.

La página explica el método, muestra cada componente evaluable, conserva términos no clasificados y evita presentar el porcentaje como una predicción de ATS. Los metadatos, alternates, sitemap y datos estructurados se generan en el componente de servidor, mientras que el formulario y el cálculo permanecen en el cliente.
