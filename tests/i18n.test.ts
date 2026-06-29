import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  LOCALES,
  DEFAULT_LOCALE,
  isLocale,
  alternateLocale,
  localizedPath,
  useTranslations,
  UI,
  type Locale,
} from "../src/lib/i18n";

// Generadores compartidos.
const anyLocale = fc.constantFrom<Locale>(...LOCALES);

describe("i18n: configuración de idiomas", () => {
  it("soporta exactamente es y en, con es por defecto", () => {
    expect([...LOCALES]).toEqual(["es", "en"]);
    expect(DEFAULT_LOCALE).toBe("es");
  });

  it("isLocale reconoce los idiomas soportados y rechaza el resto", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("alternateLocale devuelve el otro idioma", () => {
    expect(alternateLocale("es")).toBe("en");
    expect(alternateLocale("en")).toBe("es");
  });
});

describe("i18n: localizedPath — ejemplos (design.md §9.5)", () => {
  it("antepone el prefijo de idioma a una ruta interna", () => {
    expect(localizedPath("/work", "es")).toBe("/es/work");
    expect(localizedPath("/work", "en")).toBe("/en/work");
  });

  it("es idempotente sobre una ruta ya localizada", () => {
    expect(localizedPath("/es/work", "es")).toBe("/es/work");
    expect(localizedPath("/en/work/chromora", "en")).toBe("/en/work/chromora");
  });

  it("reemplaza el prefijo al cambiar de idioma", () => {
    expect(localizedPath("/es/work", "en")).toBe("/en/work");
    expect(localizedPath("/en/about", "es")).toBe("/es/about");
  });

  it("maneja la raíz y rutas vacías", () => {
    expect(localizedPath("/", "es")).toBe("/es");
    expect(localizedPath("", "en")).toBe("/en");
    expect(localizedPath("/es", "es")).toBe("/es");
    expect(localizedPath("/es", "en")).toBe("/en");
  });

  it("normaliza barras y espacios sobrantes", () => {
    expect(localizedPath("///work//", "es")).toBe("/es/work");
    expect(localizedPath("  /work  ", "en")).toBe("/en/work");
    expect(localizedPath("work", "es")).toBe("/es/work");
  });

  it("solo descarta un prefijo de idioma cuando es el primer segmento", () => {
    // 'en' en medio NO es un prefijo de locale → se conserva.
    expect(localizedPath("/work/en", "es")).toBe("/es/work/en");
  });
});

describe("i18n: localizedPath — propiedades de correctitud (Property 4)", () => {
  // Validates: Requirements 8.2
  it("es idempotente: f(f(p, l), l) === f(p, l)", () => {
    fc.assert(
      fc.property(fc.string(), anyLocale, (path, lang) => {
        const once = localizedPath(path, lang);
        const twice = localizedPath(once, lang);
        return twice === once;
      }),
    );
  });

  // Validates: Requirements 8.2
  it("siempre devuelve una ruta que comienza con '/'", () => {
    fc.assert(
      fc.property(fc.string(), anyLocale, (path, lang) => {
        return localizedPath(path, lang).startsWith("/");
      }),
    );
  });

  // Validates: Requirements 8.1, 8.2 — el prefijo de idioma siempre está presente.
  it("siempre lleva el prefijo de idioma como primer segmento", () => {
    fc.assert(
      fc.property(fc.string(), anyLocale, (path, lang) => {
        const result = localizedPath(path, lang);
        return result === `/${lang}` || result.startsWith(`/${lang}/`);
      }),
    );
  });
});

describe("i18n: diccionarios de UI", () => {
  it("ES y EN están en paridad de claves (sin traducciones faltantes)", () => {
    const esKeys = Object.keys(UI.es).sort();
    const enKeys = Object.keys(UI.en).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it("no deja ningún valor vacío en ningún idioma", () => {
    for (const lang of LOCALES) {
      for (const [key, value] of Object.entries(UI[lang])) {
        expect(value.trim().length, `${lang}.${key} vacío`).toBeGreaterThan(0);
      }
    }
  });

  it("useTranslations devuelve el diccionario correcto y cae al default", () => {
    expect(useTranslations("es")).toBe(UI.es);
    expect(useTranslations("en")).toBe(UI.en);
    expect(useTranslations("fr")).toBe(UI[DEFAULT_LOCALE]);
  });
});
