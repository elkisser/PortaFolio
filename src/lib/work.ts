/* =============================================================================
   work.ts — Lógica PURA del índice de Work (design.md §5.1/§5.4, Req 5.1/5.4)
   -----------------------------------------------------------------------------
   El índice editorial de case studies (`components/work/WorkIndex.astro`) lee la
   colección `work`, pero la DECISIÓN de qué entradas mostrar, en qué orden, qué
   categorías ofrecer en el filtro y cómo derivar el slug de la URL es lógica de
   datos que conviene aislar del markup para testearla con Vitest sin levantar el
   build de Astro (mismo criterio que `lib/hero.ts`, `lib/nav.ts`, `lib/i18n.ts`).

   Responsabilidades puras:
     1. `caseStudySlug(id)` — deriva el slug de URL (`/work/[slug]`) a partir del
        id del glob loader, que incluye el sufijo de idioma (`chromora.es` →
        `chromora`). Determinista e idempotente.
     2. `selectWorkIndex(entries, lang)` — filtra por idioma y ordena de forma
        determinista (curaduría `order` asc → `year` desc → `title`).
     3. `collectCategories(entries)` — categorías presentes en el conjunto, en el
        orden canónico de `WORK_CATEGORIES`, con su conteo (alimenta el filtro
        del índice — Req 5.4).
     4. `categoryMatches(categories, active)` — predicado del filtro: `'all'`
        acepta todo; en otro caso, la entrada pasa si declara esa categoría.

   Todas son funciones puras y deterministas: mismo input → mismo output, sin
   tocar el DOM ni globales, y sin mutar sus argumentos.
   ============================================================================= */

import { LOCALES, type Locale } from "./i18n";
import { WORK_CATEGORIES, type CaseStudyData, type WorkCategory } from "../content/schema";

/** Valor especial del filtro que muestra todas las categorías (Req 5.4). */
export const ALL_CATEGORY = "all" as const;

/** Categoría activa del filtro: una categoría concreta o "todas". */
export type CategoryFilter = WorkCategory | typeof ALL_CATEGORY;

/**
 * Forma mínima de una entrada de la colección `work` que necesita el índice.
 * `CollectionEntry<'work'>` la satisface estructuralmente (su `id` lo aporta el
 * glob loader y su `data` es el `CaseStudyData` inferido del esquema Zod), de
 * modo que se puede pasar el resultado de `getCollection('work')` directamente.
 */
export interface WorkEntryLike {
  /** Id del glob loader, p. ej. `"chromora.es"` (incluye sufijo de idioma). */
  id: string;
  data: Pick<
    CaseStudyData,
    "title" | "year" | "summary" | "featured" | "order" | "lang"
  > & {
    // `category` se declara como arreglo de solo lectura (no la tupla `nonempty`
    // del esquema) porque las funciones solo lo recorren / consultan; así tanto
    // `CollectionEntry<'work'>` (tupla) como fixtures de test (arreglo plano)
    // satisfacen la forma sin fricción de tipos.
    category: readonly WorkCategory[];
  };
}

/**
 * Etiquetas de display de cada categoría para el filtro (design.md §5.4: estética
 * integrada, no "pills genéricas"). Son términos técnicos legibles por igual en
 * ES y EN, por lo que NO se duplican en los diccionarios i18n; la opción "todas"
 * sí sale del diccionario (`t.filter_all`), ya localizada.
 */
export const CATEGORY_LABELS: Readonly<Record<WorkCategory, string>> = {
  fullstack: "Full-stack",
  frontend: "Frontend",
  ai: "AI",
  ecommerce: "E-commerce",
  tooling: "Tooling",
};

/**
 * Deriva el slug de URL de un case study a partir del id de la colección.
 *
 * Cada case study existe como un MDX por idioma (`<slug>.<lang>.mdx`). El loader
 * genera un id único y limpio `<slug>-<lang>` (ver `content.config.ts` →
 * `generateId`, p. ej. `chromora-es`). La URL de detalle es `/work/[slug]` sin
 * idioma en el slug (el idioma vive en el prefijo de ruta `/es` `/en`), así que
 * descartamos un sufijo `-es`/`-en` final si está presente. Como el slug base
 * puede contener guiones (`the-cookie-box-es`), solo se quita el ÚLTIMO segmento
 * cuando coincide con un idioma soportado.
 *
 * Quita exactamente UN sufijo de idioma final (`-es`/`-en`): el que añade el
 * loader. Sobre un id de la forma `<base>-<lang>` con `base` que no termina en un
 * tag de idioma (el caso real: el slug base es el nombre del proyecto), el
 * resultado es estable al re-aplicarlo. Como el slug base puede contener guiones
 * (`the-cookie-box-es`), solo se quita el ÚLTIMO segmento cuando es un idioma.
 *
 * Ejemplos:
 *  - caseStudySlug("chromora-es")        → "chromora"
 *  - caseStudySlug("the-cookie-box-en")  → "the-cookie-box"
 *  - caseStudySlug("chromora")           → "chromora"   (sin sufijo → intacto)
 *  - caseStudySlug("notes")              → "notes"      ("notes" no es idioma → intacto)
 */
export function caseStudySlug(id: string): string {
  const dash = id.lastIndexOf("-");
  if (dash === -1) return id;

  const suffix = id.slice(dash + 1);
  return (LOCALES as readonly string[]).includes(suffix) ? id.slice(0, dash) : id;
}

/**
 * Comparador determinista del índice: `order` ascendente (curaduría manual),
 * luego `year` descendente (lo más nuevo primero) y, a igualdad, `title`
 * alfabético (estable). Coherente con `lib/hero.ts` para que el orden del
 * mini-índice del Hero y el del índice completo sean consistentes.
 */
function compareWork(a: WorkEntryLike, b: WorkEntryLike): number {
  return (
    a.data.order - b.data.order ||
    b.data.year - a.data.year ||
    a.data.title.localeCompare(b.data.title)
  );
}

/**
 * Selecciona y ordena las entradas del índice de Work para un idioma (Req 5.1).
 *
 * Filtra por `data.lang` (cada case study es un MDX por idioma) y ordena de forma
 * determinista (ver `compareWork`). No muta el arreglo de entrada.
 *
 * @param entries Entradas de la colección `work` (p. ej. `getCollection('work')`).
 * @param lang    Idioma activo de la página.
 * @returns Entradas del idioma pedido, ordenadas; `[]` si no hay ninguna.
 */
export function selectWorkIndex<T extends WorkEntryLike>(
  entries: readonly T[],
  lang: Locale,
): T[] {
  return entries.filter((entry) => entry.data.lang === lang).sort(compareWork);
}

/** Una categoría presente en el índice junto a su número de entradas. */
export interface CategoryCount {
  category: WorkCategory;
  count: number;
}

/**
 * Reúne las categorías presentes en `entries` con su conteo, en el orden canónico
 * de `WORK_CATEGORIES` (estable y determinista). Alimenta el filtro del índice
 * (Req 5.4): solo se ofrecen categorías que realmente tienen proyectos, evitando
 * filtros que llevan a un índice vacío.
 *
 * Una entrada puede declarar varias categorías: cuenta en todas las que declara.
 * No incluye la opción "todas" (`ALL_CATEGORY`); esa la añade la UI al inicio.
 */
export function collectCategories(entries: readonly WorkEntryLike[]): CategoryCount[] {
  const counts = new Map<WorkCategory, number>();

  for (const entry of entries) {
    for (const category of entry.data.category) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  // Orden canónico de WORK_CATEGORIES → estable y predecible en la UI.
  return WORK_CATEGORIES.filter((category) => counts.has(category)).map((category) => ({
    category,
    count: counts.get(category) ?? 0,
  }));
}

/**
 * Predicado del filtro de categoría (Req 5.4). `ALL_CATEGORY` acepta cualquier
 * entrada; una categoría concreta acepta la entrada si la declara entre las suyas.
 * Es la misma decisión que aplica la isla de filtro en el cliente, aislada y
 * testeable.
 */
export function categoryMatches(
  categories: readonly WorkCategory[],
  active: CategoryFilter,
): boolean {
  return active === ALL_CATEGORY || categories.includes(active);
}
