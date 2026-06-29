import { describe, it, expect } from "vitest";
import { selectFeaturedWork, DEFAULT_FEATURED_MAX, type WorkEntryLike } from "../src/lib/hero";
import type { Locale } from "../src/lib/i18n";

/* -----------------------------------------------------------------------------
   Helpers de fixtures: construyen entradas mínimas de la colección `work` con
   solo los campos que consume el Hero (design.md §5.3). El resto del esquema no
   es relevante para la selección, por eso `WorkEntryLike` es un `Pick`.
   --------------------------------------------------------------------------- */
interface MakeArgs {
  title: string;
  lang: Locale;
  featured?: boolean;
  order?: number;
  year?: number;
}

function make({ title, lang, featured = false, order = 99, year = 2024 }: MakeArgs): WorkEntryLike {
  return {
    data: {
      title,
      year,
      category: ["frontend"],
      summary: "x",
      featured,
      order,
      lang,
    },
  };
}

const titles = (entries: WorkEntryLike[]): string[] => entries.map((e) => e.data.title);

describe("hero: selectFeaturedWork (design.md §5.3, Req 3.1/3.3)", () => {
  it("filtra por idioma: solo devuelve entradas del idioma pedido", () => {
    const entries = [
      make({ title: "ES-1", lang: "es", featured: true, order: 1 }),
      make({ title: "EN-1", lang: "en", featured: true, order: 1 }),
      make({ title: "ES-2", lang: "es", featured: true, order: 2 }),
    ];
    expect(titles(selectFeaturedWork(entries, "es"))).toEqual(["ES-1", "ES-2"]);
    expect(titles(selectFeaturedWork(entries, "en"))).toEqual(["EN-1"]);
  });

  it("prioriza los destacados y los ordena por order asc", () => {
    const entries = [
      make({ title: "C", lang: "es", featured: true, order: 3 }),
      make({ title: "A", lang: "es", featured: true, order: 1 }),
      make({ title: "B", lang: "es", featured: true, order: 2 }),
    ];
    expect(titles(selectFeaturedWork(entries, "es"))).toEqual(["A", "B", "C"]);
  });

  it("desempata por year descendente y luego por título", () => {
    const entries = [
      make({ title: "Older", lang: "es", featured: true, order: 1, year: 2020 }),
      make({ title: "Newer", lang: "es", featured: true, order: 1, year: 2023 }),
    ];
    expect(titles(selectFeaturedWork(entries, "es"))).toEqual(["Newer", "Older"]);
  });

  it("nunca devuelve más de `max` entradas", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      make({ title: `P${i}`, lang: "es", featured: true, order: i }),
    );
    expect(selectFeaturedWork(entries, "es", 4)).toHaveLength(4);
    expect(selectFeaturedWork(entries, "es", 4).length).toBeLessThanOrEqual(4);
  });

  it("degradación: rellena con no-destacados cuando hay pocos destacados (Req 3.3)", () => {
    // Caso real actual: solo existe el placeholder (no destacado) hasta la tarea 13.
    const entries = [make({ title: "Placeholder", lang: "es", featured: false, order: 99 })];
    expect(titles(selectFeaturedWork(entries, "es"))).toEqual(["Placeholder"]);
  });

  it("degradación: los destacados van primero, luego el relleno no-destacado", () => {
    const entries = [
      make({ title: "Fill-2", lang: "es", featured: false, order: 5 }),
      make({ title: "Featured", lang: "es", featured: true, order: 1 }),
      make({ title: "Fill-1", lang: "es", featured: false, order: 2 }),
    ];
    expect(titles(selectFeaturedWork(entries, "es", 4))).toEqual([
      "Featured",
      "Fill-1",
      "Fill-2",
    ]);
  });

  it("no rellena si ya hay suficientes destacados", () => {
    const entries = [
      make({ title: "F1", lang: "es", featured: true, order: 1 }),
      make({ title: "F2", lang: "es", featured: true, order: 2 }),
      make({ title: "NotFeatured", lang: "es", featured: false, order: 0 }),
    ];
    expect(titles(selectFeaturedWork(entries, "es", 2))).toEqual(["F1", "F2"]);
  });

  it("colección vacía → arreglo vacío (Hero se renderiza sin mini-índice)", () => {
    expect(selectFeaturedWork([], "es")).toEqual([]);
  });

  it("max <= 0 → arreglo vacío (defensivo)", () => {
    const entries = [make({ title: "A", lang: "es", featured: true })];
    expect(selectFeaturedWork(entries, "es", 0)).toEqual([]);
  });

  it("es puro: no muta el arreglo de entrada", () => {
    const entries = [
      make({ title: "B", lang: "es", featured: true, order: 2 }),
      make({ title: "A", lang: "es", featured: true, order: 1 }),
    ];
    const snapshot = titles(entries);
    selectFeaturedWork(entries, "es");
    expect(titles(entries)).toEqual(snapshot);
  });

  it("DEFAULT_FEATURED_MAX es 4 (3–4 según design.md §5.3)", () => {
    expect(DEFAULT_FEATURED_MAX).toBe(4);
  });
});
