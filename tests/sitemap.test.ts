import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { logicalPages, buildSitemapUrls } from "../src/lib/sitemap";
import { LOCALES } from "../src/lib/i18n";

/**
 * Tests del generador de sitemap (Req 8.4): el sitemap incluye las URLs por
 * idioma y por proyecto, derivadas del routing i18n y de la colección de case
 * studies, de modo que se mantiene en sincronía (design.md §1.6).
 */

describe("sitemap: logicalPages", () => {
  it("incluye home, work, about y contact, más una página por slug", () => {
    expect(logicalPages(["chromora"])).toEqual([
      "/",
      "/work",
      "/about",
      "/contact",
      "/work/chromora",
    ]);
  });

  it("deduplica slugs repetidos (un proyecto, no un archivo por idioma)", () => {
    // El mismo slug llega una vez por idioma desde la colección → debe colapsar.
    expect(logicalPages(["chromora", "chromora", "prode"])).toEqual([
      "/",
      "/work",
      "/about",
      "/contact",
      "/work/chromora",
      "/work/prode",
    ]);
  });
});

describe("sitemap: buildSitemapUrls (Req 8.4)", () => {
  // Validates: Requirements 8.4
  it("incluye las URLs por idioma de home, work, about y contact", () => {
    const locs = buildSitemapUrls([]).map((u) => u.loc);
    expect(locs).toEqual(
      expect.arrayContaining([
        "/es",
        "/en",
        "/es/work",
        "/en/work",
        "/es/about",
        "/en/about",
        "/es/contact",
        "/en/contact",
      ]),
    );
  });

  // Validates: Requirements 8.4
  it("incluye una URL por proyecto y por idioma (case study slugs)", () => {
    const locs = buildSitemapUrls(["chromora"]).map((u) => u.loc);
    expect(locs).toContain("/es/work/chromora");
    expect(locs).toContain("/en/work/chromora");
  });

  it("cada entrada lleva alternates de todos los idiomas + x-default", () => {
    for (const url of buildSitemapUrls(["chromora"])) {
      const hreflangs = url.alternates.map((a) => a.hreflang);
      expect(hreflangs).toEqual(["es", "en", "x-default"]);
    }
  });

  // Propiedad: toda `loc` empieza con '/' y lleva el prefijo de un idioma soportado.
  it("toda loc es absoluta-de-ruta y lleva prefijo de idioma", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (slugs) => {
        for (const url of buildSitemapUrls(slugs)) {
          if (!url.loc.startsWith("/")) return false;
          const ok = LOCALES.some(
            (l) => url.loc === `/${l}` || url.loc.startsWith(`/${l}/`),
          );
          if (!ok) return false;
        }
        return true;
      }),
    );
  });
});
