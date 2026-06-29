<div align="center">

# Portfolio · Sebastián Kisser

**Portfolio editorial premium** — Full Stack Developer & Diseñador (Argentina).

Construido con **Astro** (arquitectura de islas, salida estática) y desplegado en
**Cloudflare Pages**. Identidad propia, performance casi perfecta, accesibilidad AA,
i18n indexable (`/es`, `/en`) y los proyectos como **case studies reales**, con GitHub
integrado como **evidencia curada**.

`Astro 5` · `TypeScript estricto` · `MDX` · `Vitest + fast-check` · `Playwright` · `Cloudflare Pages`

</div>

---

## Qué es

Reemplazo completo del sitio vanilla original por un producto digital con hilo conductor
entre pantallas (no una pila de secciones). El centro son los **case studies** (problema →
decisiones técnicas con su porqué → resultado), sostenidos por un mini design system propio
para que una sola captura sea reconocible y no parezca un template.

El diseño, los requerimientos y el plan de implementación viven en
[`.kiro/specs/portfolio-redesign/`](.kiro/specs/portfolio-redesign/). Las decisiones de
framework y deploy están justificadas como ADRs:
[ADR 0001 — framework](docs/decisions/0001-framework-choice.md) ·
[ADR 0002 — deploy](docs/decisions/0002-deploy-platform.md).

## Características

- **Identidad editorial propia**: tokens (color, escala tipográfica fluida, espaciado 8pt,
  rejilla de 12 col), tipografía self-hosted (Space Grotesk / Inter / JetBrains Mono) e
  **iconografía propia** (incluye marcas de GitHub/WhatsApp y un set de línea coherente).
- **i18n routing real** (`/es`, `/en`) indexable, con `hreflang` + `x-default`.
- **Case studies** como Content Collections tipadas con Zod: `alt` y dimensiones de medios
  obligatorios (CLS 0 por contrato), ≥1 decisión técnica con `rationale`.
- **GitHub como evidencia curada** (build-time, sin métricas de vanidad) + colaboraciones
  privadas curadas a mano.
- **Islas mínimas** (vanilla TS / custom elements), sin runtime de framework de UI:
  `Nav` (scrollspy + menú móvil + switch de idioma), `Motion` (reveals on-scroll),
  `MediaViewer` (carrusel/video accesible), `ContactForm` (validación pura → WhatsApp) y
  el filtro del índice de Work con un efecto de re-entrada tipo carrusel.
- **Accesibilidad AA**: contraste, navegación por teclado, foco visible, `aria-live`, y
  respeto total a `prefers-reduced-motion` (ninguna animación deja contenido inaccesible).
- **Performance**: cero JS por defecto, hidratación `client:idle`/`client:visible`,
  imágenes vía `astro:assets`, fuentes con subset + `font-display: swap`.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Astro 5 (`output: 'static'`, TypeScript estricto) + MDX + `astro:assets` |
| Interactividad | Islas vanilla TS / custom elements (sin runtime de framework de UI) |
| Contenido | Content Collections + Zod (`src/content/`) |
| i18n / SEO | `astro:i18n` (`/es`, `/en`), JSON-LD `Person` + `CreativeWork`, sitemap/robots generados |
| Estilos | CSS con tokens propios (`src/styles/tokens.css`, `fonts.css`) |
| Tests | Vitest + fast-check (unit + property-based) · Playwright (E2E) |
| Calidad | ESLint + `astro check` · auditoría de presupuesto de bundle |
| CI/CD | GitHub Actions → Cloudflare Pages (preview por PR, caché inmutable) |

## Estructura

```
src/
├── components/      # primitives/ · work/ · about/ · icons/ + islas (Nav, Motion, ContactForm, MediaViewer)
├── content/         # config + colección `work` (un .mdx por idioma) + data/ (github.json, collaborations.ts)
├── layouts/         # BaseLayout · CaseStudyLayout
├── lib/             # lógica pura testeable: i18n, seo, work, hero, nav, motion, media, contact, github, sitemap
├── pages/           # /es · /en (index, about, contact, work, work/[slug]) + sitemap.xml.ts + robots.txt.ts
├── scripts/         # fetch-github.mjs (build-time)
└── styles/          # tokens.css · fonts.css
scripts/             # budget-audit.mjs (auditoría de bundle en CI)
.github/workflows/   # ci.yml (lint · type-check · tests · build · budget · deploy)
docs/decisions/      # ADRs (framework, deploy)
```

## Desarrollo

Requiere **Node ≥ 20.3**.

```bash
npm install
npm run dev        # servidor de desarrollo
```

### Scripts

```bash
npm run dev          # servidor de desarrollo
npm run build        # prebuild (fetch-github) + astro build → dist/ (estático)
npm run preview      # previsualizar el build
npm run check        # astro check (type-check)
npm run lint         # eslint
npm run test         # vitest (unit + property-based)
npm run e2e          # playwright (E2E)
npm run audit:budget # auditoría de presupuesto del JS de cliente (gzip)
```

## SEO e i18n

- Rutas reales por idioma (`/es`, `/en`) con `hreflang` + `x-default` por página.
- `sitemap.xml` y `robots.txt` se **generan en build** desde el routing i18n y la colección
  de case studies (`src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`): incluyen las URLs
  por idioma y por proyecto y se mantienen en sincronía con el contenido.
- JSON-LD `Person` (global) y `CreativeWork` localizado por case study.

## GitHub como evidencia

Los datos se obtienen en **build** (`src/scripts/fetch-github.mjs`, con `GH_TOKEN` opcional
como secret de CI) y se escriben en `src/content/data/github.json` — nunca hay fetch en el
cliente. La selección usa un algoritmo de scoring puro y testeado (`src/lib/github.ts`):
repos destacados, tecnologías predominantes y actividad reciente, **sin métricas de vanidad**.
Las colaboraciones privadas (p. ej. Club del Barril) se curan a mano en
`src/content/data/collaborations.ts`.

## Deploy y CI

GitHub Actions (`.github/workflows/ci.yml`) ejecuta, antes de publicar: **lint → type-check →
tests (unit + property-based) → build → auditoría de presupuesto**. Solo un build verde se
publica en **Cloudflare Pages** (subdominio `*.pages.dev`), con **preview deploy por PR** y
**caché inmutable** para los assets hasheados (`public/_headers`).

Secrets requeridos en el repo (GitHub → *Settings → Secrets and variables → Actions*):
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` y, opcional, `GH_TOKEN` (si falta, el fetch
de GitHub degrada con gracia a la API pública y el build no se rompe).

## Estado

- ✅ **Slice 1** (identidad, Hero, Nav, design system, i18n, Motion, Work + case study, contacto, responsive).
- ✅ **Milestone 2** (GitHub como evidencia, About/Contact, sitemap, CI/CD + Cloudflare Pages).
- ⏸️ **Playground**: condicional — no se publica hasta reunir ≥ 3 piezas que pasen el gate de calidad.

## Autor

**Sebastián Kisser** — Argentina · Full Stack Developer & Diseñador
[github.com/elkisser](https://github.com/elkisser)
