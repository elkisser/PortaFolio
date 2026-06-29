/* =============================================================================
   sitemap.ts — Lógica PURA del sitemap (design.md §1.6, §8; Req 8.4)
   -----------------------------------------------------------------------------
   El sitio heredado tenía un `sitemap.xml` estático de UNA sola URL que se
   desincronizaba del contenido real (design.md §1.6). Aquí se deriva el sitemap
   de dos fuentes de verdad: el routing i18n (`/es`, `/en`) y los slugs de la
   colección de case studies. Así el sitemap incluye SIEMPRE las URLs por idioma
   y por proyecto (Req 8.4) y se mantiene en sincronía con el contenido.

   Diseño: funciones PURAS, sin globales de Astro (mismo criterio que `lib/seo.ts`
   y `lib/i18n.ts`), para testearlas de forma aislada con Vitest + fast-check. El
   endpoint estático `src/pages/sitemap.xml.ts` las consume, resuelve cada ruta a
   URL absoluta contra `Astro.site` y emite el XML.

   Doc verificada (sitemaps + hreflang):
   https://developers.google.com/search/docs/specialty/international/localized-versions
   ============================================================================= */

import { LOCALES, DEFAULT_LOCALE, localizedPath, type Locale } from "./i18n";

/**
 * Páginas LÓGICAS del sitio, sin prefijo de idioma (design.md §5.1). Son las
 * rutas que existen en cada idioma:
 *   - `/`        → home
 *   - `/work`    → índice de case studies
 *   - `/about`   → about (absorbe stack + GitHub + timeline; design.md §5.1)
 *   - `/contact` → contacto (CTA final elevado, página propia; design.md §5.1)
 *   - `/work/<slug>` → una por case study
 *
 * Contact se elevó a página propia (`/[lang]/contact`, tarea 11.2): como es una
 * ruta real e indexable, DEBE figurar en el sitemap para mantenerlo en sincronía
 * con las rutas reales (Req 8.4, design.md §1.6 — evitar el sitemap desincronizado
 * del sitio heredado).
 *
 * Los `slugs` llegan de la colección `work`, que tiene un archivo por idioma del
 * mismo proyecto; se DEDUPLICAN para emitir una sola página lógica por proyecto
 * (el idioma se añade luego como prefijo de ruta). Preserva el orden de primera
 * aparición (determinista).
 *
 * @param slugs Slugs de case study (sin idioma), posiblemente repetidos.
 * @returns Rutas lógicas sin prefijo de idioma, en orden estable.
 */
export function logicalPages(slugs: readonly string[]): string[] {
  const uniqueSlugs: string[] = [];
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (!seen.has(slug)) {
      seen.add(slug);
      uniqueSlugs.push(slug);
    }
  }

  return ["/", "/work", "/about", "/contact", ...uniqueSlugs.map((slug) => `/work/${slug}`)];
}

/** Una alternativa de idioma de una URL del sitemap (`<xhtml:link>`). */
export interface SitemapAlternate {
  /** Código de idioma BCP 47 corto o `"x-default"`. */
  hreflang: Locale | "x-default";
  /** Ruta localizada (relativa a la raíz; comienza con `/`). */
  href: string;
}

/** Una entrada del sitemap: una URL + sus alternativas por idioma. */
export interface SitemapUrl {
  /** Ruta localizada de la página (relativa a la raíz; comienza con `/`). */
  loc: string;
  /** Alternativas hreflang: todos los idiomas soportados + `x-default`. */
  alternates: SitemapAlternate[];
}

/**
 * Construye las entradas del sitemap (Req 8.4): por cada página lógica y cada
 * idioma soportado emite una URL localizada (`/es`, `/en`, `/es/work`, …), y a
 * cada una le adjunta las alternativas hreflang de TODOS los idiomas más
 * `x-default` (apuntando al idioma por defecto), tal como recomienda Google para
 * versiones localizadas.
 *
 * Las rutas se calculan con `localizedPath` (idempotente, siempre con `/`
 * inicial y prefijo de idioma — design.md §9.5), de modo que toda `loc` es una
 * ruta absoluta-de-raíz con prefijo de idioma válido. El endpoint las resuelve a
 * URL absolutas contra `Astro.site`.
 *
 * @param slugs Slugs de case study (sin idioma) de la colección `work`.
 * @returns Entradas del sitemap, una por (página lógica × idioma).
 */
export function buildSitemapUrls(slugs: readonly string[]): SitemapUrl[] {
  const pages = logicalPages(slugs);

  const alternatesFor = (page: string): SitemapAlternate[] => [
    ...LOCALES.map((locale) => ({
      hreflang: locale,
      href: localizedPath(page, locale),
    })),
    { hreflang: "x-default" as const, href: localizedPath(page, DEFAULT_LOCALE) },
  ];

  const urls: SitemapUrl[] = [];
  for (const page of pages) {
    for (const locale of LOCALES) {
      urls.push({
        loc: localizedPath(page, locale),
        alternates: alternatesFor(page),
      });
    }
  }

  return urls;
}
