/**
 * sitemap.xml — endpoint estático del sitemap (Req 8.4, design.md §1.6, §8).
 *
 * Reemplaza el `sitemap.xml` estático de UNA sola URL del sitio heredado (que se
 * desincronizaba del contenido) por un sitemap DERIVADO del routing i18n y de la
 * colección de case studies, de modo que incluye SIEMPRE las URLs por idioma
 * (`/es`, `/en`) y por proyecto (`/es/work/[slug]`, `/en/work/[slug]`) y se
 * mantiene en sincronía con el contenido (Req 8.4).
 *
 * La lógica de qué URLs incluir es pura y testeada (`lib/sitemap.ts`); aquí solo
 * se obtienen los slugs de la colección, se resuelven las rutas a URL absolutas
 * contra `site` y se emite el XML con alternativas `hreflang` (incl. `x-default`)
 * por entrada, tal como recomienda Google para versiones localizadas.
 *
 * Salida estática (Req 1.1): con `output: 'static'`, este endpoint se renderiza a
 * un archivo `sitemap.xml` en el build. Doc verificada (Astro 5.18):
 * https://docs.astro.build/en/guides/endpoints/#static-file-endpoints
 */
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { buildSitemapUrls } from "../lib/sitemap";
import { caseStudySlug } from "../lib/work";
import { absoluteUrl } from "../lib/seo";

/** Escapa los caracteres reservados de XML en una URL para un `<loc>`/`href`. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET({ site }: APIContext): Promise<Response> {
  // Slugs de case study (sin idioma) desde la colección; `buildSitemapUrls`
  // deduplica los archivos por idioma del mismo proyecto a una página lógica.
  const work = await getCollection("work");
  const slugs = work.map((entry) => caseStudySlug(entry.id));

  const urls = buildSitemapUrls(slugs);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map((url) => {
    const loc = xmlEscape(absoluteUrl(url.loc, site));
    const alternates = url.alternates
      .map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${xmlEscape(
            absoluteUrl(alt.href, site),
          )}" />`,
      )
      .join("\n");
    return `  <url>\n    <loc>${loc}</loc>\n${alternates}\n  </url>`;
  })
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
