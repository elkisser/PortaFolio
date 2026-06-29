/* =============================================================================
   schema.ts — Esquema Zod del modelo de contenido de case studies (design.md §8)
   -----------------------------------------------------------------------------
   Fuente única de verdad del modelo de datos de los case studies (Req 1.2, 1.3,
   5.3, 6.1). Se define aquí —y NO inline en `content.config.ts`— para que las
   reglas de validación de §8 sean testeables de forma aislada con Vitest +
   fast-check (`tests/content-schema.test.ts`), sin levantar el build de Astro.

   `z` se importa de `astro/zod`: es EXACTAMENTE el mismo Zod que re-exporta el
   módulo virtual `astro:content` durante el build (verificado contra el paquete
   instalado, Astro 5.18). Por eso el `workSchema` que validan los tests es el
   mismo que aplica `defineCollection` al compilar — sin duplicar definiciones.

   Reglas de validación (design.md §8):
     - `alt` no vacío en todo medio; `width`/`height` siempre presentes (anti-CLS).
     - `decisions` con al menos una entrada → cada case study explica un "por qué".
     - `summary` ≤ 160 chars (encaja en índice y meta description).
     - `links.demo` / `links.repo` deben ser URLs válidas si existen.

   Doc verificada (Astro 5.18):
   - Content Collections (Content Layer):  https://v5.docs.astro.build/en/guides/content-collections/
   - Datatypes con Zod:                    https://v5.docs.astro.build/en/guides/content-collections/#defining-datatypes-with-zod
   ============================================================================= */

import { z } from "astro/zod";
import type { Locale } from "../lib/i18n";

/**
 * Categorías de proyecto para el filtro del índice de Work (design.md §7.2
 * `WorkCategory`). Exportado para que la UI de filtros (tarea 10) reuse la misma
 * lista en lugar de duplicar literales.
 */
export const WORK_CATEGORIES = [
  "fullstack",
  "frontend",
  "ai",
  "ecommerce",
  "tooling",
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

/**
 * Medio asociado a un case study (design.md §7.2 `MediaAsset`, §8 `mediaSchema`).
 * `alt` obligatorio no vacío (a11y, Req 6.1) y `width`/`height` siempre presentes
 * como enteros positivos para reservar espacio y garantizar CLS 0 (Req 6.4).
 */
export const mediaSchema = z.object({
  type: z.enum(["video", "image"]),
  src: z.string().min(1),
  poster: z.string().optional(),
  alt: z.string().min(1), // a11y: alt obligatorio (Req 6.1)
  width: z.number().int().positive(),
  height: z.number().int().positive(), // reserva de espacio → CLS 0 (Req 6.4)
});

export type MediaAsset = z.infer<typeof mediaSchema>;

/**
 * Decisión técnica con su porqué (design.md §7.2 `TechDecision`, §8 `techDecision`).
 * Ambos campos no vacíos: el esquema OBLIGA a documentar el "por qué" (Req 5.3).
 */
export const techDecisionSchema = z.object({
  decision: z.string().min(1),
  rationale: z.string().min(1), // obliga a documentar el "por qué" (Req 5.3)
});

export type TechDecision = z.infer<typeof techDecisionSchema>;

/**
 * Idioma del case study. Modelado i18n: cada case study existe como UN archivo
 * MDX por idioma (`<slug>.<lang>.mdx`), y este campo `lang` es la fuente de
 * verdad canónica del idioma de la entrada (design.md §7.2 `CaseStudy.lang`).
 * Se mantiene en sincronía con el routing i18n ya construido (`src/lib/i18n.ts`,
 * `Locale = 'es' | 'en'`); el guard de tipo `_LangInSync` (abajo) rompe la
 * compilación si ambas listas divergen.
 */
export const langSchema = z.enum(["es", "en"]);

/**
 * Esquema completo de la colección `work` (design.md §8). Frontmatter de cada
 * MDX de case study. El cuerpo MDX (la "historia") lo renderiza Astro aparte.
 */
export const workSchema = z.object({
  title: z.string().min(1),
  year: z.number().int().gte(2015).lte(2100),
  category: z.array(z.enum(WORK_CATEGORIES)).nonempty(),
  summary: z.string().max(160), // ≤ 160 chars: índice + meta description
  problem: z.string().min(1),
  role: z.string().min(1),
  decisions: z.array(techDecisionSchema).min(1), // ≥ 1 decisión (Req 5.3)
  challenges: z.array(z.string()).default([]),
  result: z.string().min(1),
  stack: z.array(z.string()).nonempty(),
  media: z.array(mediaSchema).default([]),
  links: z.object({
    demo: z.string().url().optional(),
    repo: z.string().url().optional(),
  }),
  featured: z.boolean().default(false),
  order: z.number().int().default(99),
  lang: langSchema,
});

export type CaseStudyData = z.infer<typeof workSchema>;

/* -----------------------------------------------------------------------------
   Guard de compilación: `langSchema` debe cubrir EXACTAMENTE el tipo `Locale`
   del routing i18n. Si alguien agrega un idioma en `i18n.ts` sin actualizarlo
   aquí (o viceversa), `_LangInSync` deja de ser `true` y `astro check` falla.
   (Los alias de tipo no usados no disparan `noUnusedLocals`.)
   --------------------------------------------------------------------------- */
type _Assert<T extends true> = T;
export type _LangInSync = _Assert<
  [Locale] extends [z.infer<typeof langSchema>]
    ? [z.infer<typeof langSchema>] extends [Locale]
      ? true
      : false
    : false
>;
