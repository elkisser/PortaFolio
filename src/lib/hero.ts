/* =============================================================================
   hero.ts — Lógica PURA del Hero (design.md §5.3, Req 3.1/3.3)
   -----------------------------------------------------------------------------
   El Hero (`components/Hero.astro`) es HTML estático, pero la selección de los
   case studies destacados que se muestran como **prueba inmediata** (mini-índice
   above the fold) es lógica de datos que conviene aislar del markup para poder
   testearla con Vitest sin levantar el build de Astro.

   `selectFeaturedWork(entries, lang, max)`:
     1. Filtra por idioma (`data.lang`) — cada case study existe como un MDX por
        idioma (`<slug>.<lang>.mdx`); la fuente de verdad del idioma es el
        frontmatter `lang` (no el id, que el glob loader "slugifica").
     2. Prioriza los marcados `featured`, ordenados por `order` asc → `year` desc
        → `title` (estable y determinista).
     3. **Degradación elegante** (Req 3.3, wiring defensivo): si hay menos de
        `max` destacados (p. ej. hoy solo existe el placeholder no-destacado hasta
        la tarea 13), rellena los huecos con los no-destacados más recientes para
        que el mini-índice nunca quede vacío mientras el contenido real llega.
     4. Devuelve como máximo `max` entradas (y `[]` si la colección está vacía).

   Función pura y determinista: mismo input → mismo output, sin tocar el DOM ni
   globales. El orden de entrada no afecta al resultado (se reordena por `cmp`).
   ============================================================================= */

import type { Locale } from "./i18n";
import type { CaseStudyData } from "../content/schema";

/**
 * Forma mínima de una entrada de la colección `work` que necesita el Hero.
 * `CollectionEntry<'work'>` la satisface estructuralmente (su `data` es el
 * `CaseStudyData` inferido del esquema Zod), de modo que se puede pasar el
 * resultado de `getCollection('work')` directamente.
 */
export interface WorkEntryLike {
  data: Pick<
    CaseStudyData,
    "title" | "year" | "category" | "summary" | "featured" | "order" | "lang"
  >;
}

/** Cantidad de case studies destacados a mostrar como prueba (design.md §5.3: 3–4). */
export const DEFAULT_FEATURED_MAX = 4;

/**
 * Comparador determinista: `order` ascendente (curaduría manual), luego `year`
 * descendente (lo más nuevo primero) y, a igualdad, `title` alfabético (estable).
 */
function compareWork(a: WorkEntryLike, b: WorkEntryLike): number {
  return (
    a.data.order - b.data.order ||
    b.data.year - a.data.year ||
    a.data.title.localeCompare(b.data.title)
  );
}

/**
 * Selecciona los case studies destacados del idioma `lang` para el mini-índice
 * del Hero (design.md §5.3). Ver cabecera del módulo para el contrato completo.
 *
 * @param entries Entradas de la colección `work` (p. ej. `getCollection('work')`).
 * @param lang    Idioma activo de la página.
 * @param max     Máximo de entradas a devolver (por defecto 4).
 * @returns Hasta `max` entradas del idioma pedido; `[]` si no hay ninguna.
 */
export function selectFeaturedWork<T extends WorkEntryLike>(
  entries: readonly T[],
  lang: Locale,
  max: number = DEFAULT_FEATURED_MAX,
): T[] {
  if (max <= 0) return [];

  const byLang = entries.filter((entry) => entry.data.lang === lang);

  const featured = byLang.filter((entry) => entry.data.featured).sort(compareWork);
  if (featured.length >= max) {
    return featured.slice(0, max);
  }

  // Relleno defensivo: completa con no-destacados más recientes hasta `max`.
  const rest = byLang.filter((entry) => !entry.data.featured).sort(compareWork);
  return [...featured, ...rest].slice(0, max);
}
