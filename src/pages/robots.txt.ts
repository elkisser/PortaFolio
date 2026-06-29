/* =============================================================================
   robots.txt.ts — Endpoint de robots.txt (Req 8.4)
   -----------------------------------------------------------------------------
   El `robots.txt` heredado vivía en la raíz del repo (no en `public/`), por lo que
   NO se servía desde la salida de Astro, y apuntaba a un `sitemap.xml` estático y
   desincronizado. Aquí se genera en build y se prerenderiza a `/robots.txt`,
   apuntando al sitemap GENERADO (`/sitemap.xml`) resuelto contra `Astro.site`, de
   modo que ambos quedan en sincronía y servidos correctamente.

   Doc verificada (Astro 5.18): endpoints estáticos
   https://docs.astro.build/en/guides/endpoints/#static-file-endpoints
   ============================================================================= */

import type { APIRoute } from "astro";

/** Host de respaldo si `Astro.site` no está definido (coincide con astro.config). */
const FALLBACK_SITE = "https://elkisser.github.io";

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(FALLBACK_SITE);
  const sitemapUrl = new URL("/sitemap.xml", base).href;

  const body = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
