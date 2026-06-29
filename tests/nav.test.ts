import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  navEntries,
  pickActiveSection,
  type SectionVisibility,
} from "../src/lib/nav";
import { switchLocalePath, useTranslations, LOCALES, type Locale } from "../src/lib/i18n";

const anyLocale = fc.constantFrom<Locale>(...LOCALES);

describe("nav: navEntries (design.md §5.1)", () => {
  const t = useTranslations("en");

  it("por defecto expone 4 entradas… sin Playground (3): Work, About, Contact", () => {
    const entries = navEntries(t);
    expect(entries.map((e) => e.id)).toEqual(["work", "about", "contact"]);
  });

  it("incluye Playground entre About y Contact cuando se pide", () => {
    const entries = navEntries(t, true);
    expect(entries.map((e) => e.id)).toEqual([
      "work",
      "about",
      "playground",
      "contact",
    ]);
  });

  it("usa las etiquetas localizadas del diccionario", () => {
    const en = navEntries(useTranslations("en"));
    const es = navEntries(useTranslations("es"));
    expect(en.find((e) => e.id === "work")?.label).toBe("Work");
    expect(es.find((e) => e.id === "work")?.label).toBe("Proyectos");
  });

  it("cada entrada apunta a un ancla en página coherente con su id", () => {
    for (const entry of navEntries(t, true)) {
      expect(entry.href).toBe(`#${entry.id}`);
    }
  });
});

describe("nav: pickActiveSection (scrollspy)", () => {
  it("devuelve null cuando no hay secciones (wiring defensivo)", () => {
    expect(pickActiveSection([])).toBeNull();
  });

  it("devuelve null cuando ninguna sección es visible", () => {
    expect(
      pickActiveSection([
        { id: "work", ratio: 0 },
        { id: "about", ratio: 0 },
      ]),
    ).toBeNull();
  });

  it("elige la sección más visible", () => {
    expect(
      pickActiveSection([
        { id: "work", ratio: 0.2 },
        { id: "about", ratio: 0.7 },
        { id: "contact", ratio: 0.1 },
      ]),
    ).toBe("about");
  });

  it("en empate conserva la primera en orden de documento (estabilidad)", () => {
    expect(
      pickActiveSection([
        { id: "work", ratio: 0.5 },
        { id: "about", ratio: 0.5 },
      ]),
    ).toBe("work");
  });

  // Propiedad: el resultado es siempre null o el id de una sección con ratio > 0.
  it("nunca devuelve una sección no visible", () => {
    const section = fc.record({
      id: fc.string({ minLength: 1 }),
      ratio: fc.double({ min: 0, max: 1, noNaN: true }),
    });
    fc.assert(
      fc.property(fc.array(section), (sections: SectionVisibility[]) => {
        const active = pickActiveSection(sections);
        if (active === null) {
          // Si es null, ninguna sección debía ser visible.
          return sections.every((s) => s.ratio <= 0);
        }
        // Si no, existe una sección con ese id y ratio > 0.
        return sections.some((s) => s.id === active && s.ratio > 0);
      }),
    );
  });
});

describe("nav: switchLocalePath — switch de idioma (design.md §5.1, Req 4.1)", () => {
  it("mapea la ruta actual al idioma alterno", () => {
    expect(switchLocalePath("/es/work", "es")).toBe("/en/work");
    expect(switchLocalePath("/en/about", "en")).toBe("/es/about");
    expect(switchLocalePath("/es", "es")).toBe("/en");
  });

  it("siempre lleva el prefijo del idioma alterno como primer segmento", () => {
    fc.assert(
      fc.property(fc.string(), anyLocale, (path, lang) => {
        const result = switchLocalePath(path, lang);
        const other = lang === "en" ? "es" : "en";
        return result === `/${other}` || result.startsWith(`/${other}/`);
      }),
    );
  });
});
