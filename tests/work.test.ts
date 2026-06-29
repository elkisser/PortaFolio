import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  caseStudySlug,
  selectWorkIndex,
  collectCategories,
  categoryMatches,
  CATEGORY_LABELS,
  ALL_CATEGORY,
  type WorkEntryLike,
} from "../src/lib/work";
import { WORK_CATEGORIES, type WorkCategory } from "../src/content/schema";
import { LOCALES, type Locale } from "../src/lib/i18n";

/* -----------------------------------------------------------------------------
   Fixtures: entradas mínimas de la colección `work` con solo los campos que
   consume el índice (design.md §5.1/§5.4). `WorkEntryLike` es un `Pick`.
   --------------------------------------------------------------------------- */
interface MakeArgs {
  id?: string;
  title: string;
  lang: Locale;
  category?: WorkCategory[];
  featured?: boolean;
  order?: number;
  year?: number;
}

function make({
  id,
  title,
  lang,
  category = ["frontend"],
  featured = false,
  order = 99,
  year = 2024,
}: MakeArgs): WorkEntryLike {
  return {
    id: id ?? `${title.toLowerCase()}-${lang}`,
    data: { title, year, category, summary: "x", featured, order, lang },
  };
}

const titles = (entries: WorkEntryLike[]): string[] => entries.map((e) => e.data.title);

/* === caseStudySlug ========================================================= */
describe("work: caseStudySlug (Req 5.1)", () => {
  it("descarta el sufijo de idioma del id de la colección", () => {
    expect(caseStudySlug("chromora-es")).toBe("chromora");
    expect(caseStudySlug("the-cookie-box-en")).toBe("the-cookie-box");
  });

  it("deja intacto un id sin sufijo de idioma", () => {
    expect(caseStudySlug("chromora")).toBe("chromora");
  });

  it("no confunde un último segmento que no es un idioma con un sufijo", () => {
    expect(caseStudySlug("notes")).toBe("notes");
    expect(caseStudySlug("name-fr")).toBe("name-fr");
  });

  it("solo quita el último segmento de idioma (slug base con guiones)", () => {
    expect(caseStudySlug("the-cookie-box-es")).toBe("the-cookie-box");
    // Base que termina en "-es": solo se quita el sufijo de idioma final.
    expect(caseStudySlug("foo-es-es")).toBe("foo-es");
  });

  it("propiedad: sobre `<base>-<lang>` devuelve `base` y es estable al re-aplicar", () => {
    // `base` realista: segmentos alfanuméricos, sin terminar en un tag de idioma.
    const base = fc
      .array(fc.stringMatching(/^[a-z][a-z0-9]{0,7}$/), { minLength: 1, maxLength: 4 })
      .map((segs) => segs.join("-"))
      .filter((b) => !/-(es|en)$/.test(b) && b !== "es" && b !== "en");
    fc.assert(
      fc.property(base, fc.constantFrom<Locale>(...LOCALES), (b, lang) => {
        const slug = caseStudySlug(`${b}-${lang}`);
        expect(slug).toBe(b);
        // Estable: re-aplicar no cambia el resultado (base no es un tag de idioma).
        expect(caseStudySlug(slug)).toBe(b);
      }),
    );
  });
});

/* === selectWorkIndex ======================================================= */
describe("work: selectWorkIndex (Req 5.1)", () => {
  it("filtra por idioma: solo devuelve entradas del idioma pedido", () => {
    const entries = [
      make({ title: "ES-1", lang: "es" }),
      make({ title: "EN-1", lang: "en" }),
      make({ title: "ES-2", lang: "es" }),
    ];
    expect(titles(selectWorkIndex(entries, "es"))).toEqual(["ES-1", "ES-2"]);
    expect(titles(selectWorkIndex(entries, "en"))).toEqual(["EN-1"]);
  });

  it("ordena por order asc → year desc → título", () => {
    const entries = [
      make({ title: "C", lang: "es", order: 3 }),
      make({ title: "A", lang: "es", order: 1 }),
      make({ title: "B", lang: "es", order: 2 }),
    ];
    expect(titles(selectWorkIndex(entries, "es"))).toEqual(["A", "B", "C"]);
  });

  it("desempata por year descendente y luego por título", () => {
    const entries = [
      make({ title: "Older", lang: "es", order: 1, year: 2020 }),
      make({ title: "Newer", lang: "es", order: 1, year: 2023 }),
      make({ title: "Beta", lang: "es", order: 1, year: 2023 }),
    ];
    expect(titles(selectWorkIndex(entries, "es"))).toEqual(["Beta", "Newer", "Older"]);
  });

  it("colección vacía → arreglo vacío", () => {
    expect(selectWorkIndex([], "es")).toEqual([]);
  });

  it("es puro: no muta el arreglo de entrada", () => {
    const entries = [
      make({ title: "B", lang: "es", order: 2 }),
      make({ title: "A", lang: "es", order: 1 }),
    ];
    const snapshot = titles(entries);
    selectWorkIndex(entries, "es");
    expect(titles(entries)).toEqual(snapshot);
  });

  it("propiedad: el resultado contiene solo el idioma pedido y nunca crece", () => {
    const entryArb = fc.record({
      title: fc.stringMatching(/^[A-Za-z0-9]+$/),
      lang: fc.constantFrom<Locale>(...LOCALES),
      order: fc.integer({ min: 0, max: 99 }),
      year: fc.integer({ min: 2015, max: 2030 }),
    });
    fc.assert(
      fc.property(fc.array(entryArb), fc.constantFrom<Locale>(...LOCALES), (raw, lang) => {
        const entries = raw.map(make);
        const result = selectWorkIndex(entries, lang);
        expect(result.length).toBeLessThanOrEqual(entries.length);
        expect(result.every((e) => e.data.lang === lang)).toBe(true);
      }),
    );
  });
});

/* === collectCategories ===================================================== */
describe("work: collectCategories (Req 5.4)", () => {
  it("reúne categorías presentes con su conteo, en orden canónico", () => {
    const entries = [
      make({ title: "A", lang: "es", category: ["ai", "frontend"] }),
      make({ title: "B", lang: "es", category: ["frontend"] }),
      make({ title: "C", lang: "es", category: ["fullstack"] }),
    ];
    expect(collectCategories(entries)).toEqual([
      { category: "fullstack", count: 1 },
      { category: "frontend", count: 2 },
      { category: "ai", count: 1 },
    ]);
  });

  it("no incluye categorías sin proyectos (evita filtros vacíos)", () => {
    const entries = [make({ title: "A", lang: "es", category: ["frontend"] })];
    const result = collectCategories(entries);
    expect(result).toEqual([{ category: "frontend", count: 1 }]);
  });

  it("colección vacía → sin categorías", () => {
    expect(collectCategories([])).toEqual([]);
  });

  it("propiedad: respeta el orden canónico y no inventa categorías", () => {
    const entryArb = fc.record({
      title: fc.constant("x"),
      lang: fc.constant<Locale>("es"),
      category: fc.uniqueArray(fc.constantFrom<WorkCategory>(...WORK_CATEGORIES), {
        minLength: 1,
      }) as fc.Arbitrary<WorkCategory[]>,
    });
    fc.assert(
      fc.property(fc.array(entryArb, { minLength: 1 }), (raw) => {
        const result = collectCategories(raw.map(make));
        const order = result.map((r) => WORK_CATEGORIES.indexOf(r.category));
        // Orden canónico estrictamente creciente y todas reales.
        for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
        expect(result.every((r) => WORK_CATEGORIES.includes(r.category))).toBe(true);
        expect(result.every((r) => r.count >= 1)).toBe(true);
      }),
    );
  });
});

/* === categoryMatches ======================================================= */
describe("work: categoryMatches (Req 5.4)", () => {
  it("ALL_CATEGORY acepta cualquier entrada", () => {
    expect(categoryMatches(["frontend"], ALL_CATEGORY)).toBe(true);
    expect(categoryMatches([], ALL_CATEGORY)).toBe(true);
  });

  it("una categoría concreta acepta solo si la entrada la declara", () => {
    expect(categoryMatches(["ai", "frontend"], "ai")).toBe(true);
    expect(categoryMatches(["frontend"], "ai")).toBe(false);
  });

  it("propiedad: 'all' siempre verdadero; categoría ⇔ pertenencia", () => {
    const cats = fc.uniqueArray(fc.constantFrom<WorkCategory>(...WORK_CATEGORIES));
    fc.assert(
      fc.property(cats, fc.constantFrom<WorkCategory>(...WORK_CATEGORIES), (categories, active) => {
        expect(categoryMatches(categories, ALL_CATEGORY)).toBe(true);
        expect(categoryMatches(categories, active)).toBe(categories.includes(active));
      }),
    );
  });
});

/* === CATEGORY_LABELS ======================================================= */
describe("work: CATEGORY_LABELS", () => {
  it("define una etiqueta no vacía para cada categoría del esquema", () => {
    for (const category of WORK_CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
  });
});
