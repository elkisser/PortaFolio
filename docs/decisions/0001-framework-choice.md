# ADR 0001 — Elección de framework

- **Estado:** Propuesto (pendiente de aprobación del usuario)
- **Fecha:** 2026-06-29
- **Decisión asociada:** spec `portfolio-redesign`

## Contexto

El portfolio actual es un sitio estático vanilla (1 `index.html` + 1 CSS de ~1.6k líneas
+ 4 scripts IIFE) sin build. El rediseño exige: calidad de producto premium, case studies
como contenido tipado, i18n indexable (`/es` `/en`), SEO fuerte, datos de GitHub en build,
optimización de imágenes, transiciones entre páginas, animaciones con intención y
Core Web Vitals casi perfectos, mantenido por **un solo desarrollador**.

El usuario pidió explícitamente que el framework **no sea una conclusión anticipada**, sino
el resultado de una comparación fundamentada.

## Criterios y pesos

| Criterio | Peso | Por qué importa aquí |
|---|---|---|
| Performance / techo de CWV | 25% | Prioridad absoluta del brief; sitio de contenido |
| JS enviado por defecto | 15% | "Sentirse extremadamente rápido"; menos JS = menos INP/LCP |
| Modelado de contenido (collections/MDX) | 15% | Case studies como datos, no HTML hardcodeado |
| i18n routing + SEO | 10% | EN debe ser indexable; hoy no lo es |
| Optimización de imágenes nativa | 10% | Medios de case study, AVIF/WebP responsive |
| Transiciones de página + ergonomía de animación | 10% | "Sentirse como un producto", hilo conductor |
| Simplicidad de build/deploy | 5% | Solo dev, bajo mantenimiento |
| Ecosistema | 5% | Soporte a futuro |
| Mantenimiento a largo plazo (solo dev) | 5% | Coste continuo |

## Alternativas evaluadas

Puntuación 1–5 (5 = mejor para *este* caso), ponderada por los pesos de arriba.

| Criterio (peso) | Astro 7 (islas) | Next.js (App Router/RSC) | SvelteKit | Vanilla + Vite |
|---|---|---|---|---|
| Performance / CWV (25%) | 5 | 3 | 4 | 4 |
| JS por defecto (15%) | 5 | 2 | 4 | 5 |
| Contenido (collections/MDX) (15%) | 5 | 4 | 3 | 2 |
| i18n + SEO (10%) | 5 | 4 | 4 | 2 |
| Imágenes nativas (10%) | 5 | 4 | 3 | 2 |
| Transiciones/animación (10%) | 4 | 4 | 4 | 3 |
| Build/deploy simple (5%) | 5 | 3 | 4 | 4 |
| Ecosistema (5%) | 4 | 5 | 3 | 3 |
| Mantenimiento solo dev (5%) | 5 | 3 | 4 | 3 |
| **Total ponderado** | **≈4.85** | **≈3.40** | **≈3.75** | **≈3.25** |

## Decisión

**Astro (v7, Vite 8) con arquitectura de islas + Content Layer/Collections + MDX, en modo
estático (`output: 'static'`).**

Astro envía **cero JavaScript por defecto** y permite hidratación selectiva por componente
(islas), lo que da el techo de Core Web Vitals más alto para un sitio de contenido como
este, sin renunciar a interactividad puntual (carrusel, formulario, nav). Aporta de fábrica
lo que necesitamos: content collections tipadas con Zod, `astro:i18n` con routing real por
idioma, `astro:assets` para AVIF/WebP responsive, y View Transitions nativas para el hilo
conductor entre pantallas. Para un solo dev, concentra build, contenido, i18n e imágenes en
una sola herramienta de bajo mantenimiento.

Las fuentes consultadas coinciden en que Astro es la opción de referencia para sitios
"content-heavy" (blogs, docs, **portfolios**) donde el tiempo de carga y el SEO mandan, y que
Next.js envía del orden de 2–5× más JS de cliente por defecto. (Content was rephrased for
compliance with licensing restrictions.)

## Alternativas rechazadas

- **Next.js (App Router / RSC):** potentísimo, mejor ecosistema, pero está optimizado para
  apps dinámicas y SSR; envía bastante más JS de cliente por defecto y añade complejidad
  (RSC, runtime de React) que no aporta a un portfolio mayormente estático. Penaliza el techo
  de CWV y el mantenimiento para un solo dev. Rechazado por sobre-ingeniería para el caso.
- **SvelteKit:** excelente DX y poco JS, buena opción; pierde frente a Astro en modelado de
  contenido editorial de fábrica e i18n/imágenes integradas, y tiene ecosistema más chico.
  Es el segundo lugar honesto.
- **Vanilla + Vite:** máximo control y mínimo runtime, pero tendríamos que construir a mano
  content collections, i18n routing, optimización de imágenes y transiciones — reinventar lo
  que Astro ya da probado. Mayor coste de mantenimiento para un solo dev. Rechazado.

## Qué cambiaría la decisión

- Si el portfolio incorporara **mucha lógica dinámica/servidor** (auth, dashboards en vivo,
  contenido por usuario) → reconsiderar Next.js.
- Si se decidiera construir el Playground como **app altamente interactiva** con estado
  complejo compartido → evaluar SvelteKit/islas Svelte dentro de Astro (Astro permite
  componentes Svelte/React/Vue en islas, así que esto no obliga a cambiar de framework).

## Consecuencias

- Stack: Astro + MDX + `sharp` + `zod` (incluido) + TypeScript. Islas en TS vanilla / web
  components para mantener bundle mínimo; framework de UI solo si una isla lo justifica.
- Deploy debe ajustarse a salida estática (ver ADR 0002).
- Hay que migrar el contenido hardcodeado a colecciones y el i18n por JS a routing real.

## Fuentes

- Astro docs — Islands architecture / zero-JS by default: https://docs.astro.build/en/concepts/islands/
- Astro docs — Content collections: https://docs.astro.build/en/guides/content-collections/
- Astro docs — i18n routing: https://docs.astro.build/en/guides/internationalization/
- Astro docs — Images (`astro:assets`): https://docs.astro.build/en/guides/images/
- Astro docs — View Transitions: https://docs.astro.build/en/guides/view-transitions/
- Comparativa Astro vs Next.js (JS de cliente por defecto): https://blog.logrocket.com/astro-vs-next-js-ssg-vs-react
