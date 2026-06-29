/* =============================================================================
   fetch-github.test.ts — Tests del fetch de GitHub en build (Req 7.1/7.2/7.5/12.5)
   -----------------------------------------------------------------------------
   El script `src/scripts/fetch-github.mjs` corre en build/CI y trata la respuesta
   de GitHub como DATO NO CONFIABLE (Req 12.5). Estos tests cubren la lógica PURA
   (saneo de forma en el borde, agregación, construcción y validación del dataset)
   sin tocar la red: la capa de I/O (`fetch`, escritura, cache) se ejercita aparte.

   Tipos de test:
   - Unit: ejemplos y casos borde de los guards y transformaciones.
   - Property-based (fast-check): robustez ante entrada arbitraria/maliciosa
     (Req 12.5 + 7.5): `buildGitHubData` nunca lanza y SIEMPRE produce un
     `GitHubData` válido, sin importar cuán basura sea la respuesta cruda.
   ============================================================================= */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  sanitizeRepo,
  sanitizeProfile,
  aggregateLanguages,
  buildGitHubData,
  isValidGitHubData,
  makeEmptyData,
  languageColor,
  MAX_FEATURED,
} from "../src/scripts/fetch-github.mjs";

const NOW = Date.parse("2025-01-01T00:00:00Z");
const RECENT = "2024-12-01T00:00:00Z";

/** Item crudo "sano" como lo devolvería la API REST de GitHub. */
function apiRepo(overrides: Record<string, unknown> = {}) {
  return {
    name: "repo",
    description: "una descripción real",
    html_url: "https://github.com/elkisser/repo",
    homepage: null,
    fork: false,
    archived: false,
    stargazers_count: 3,
    forks_count: 1,
    language: "TypeScript",
    topics: ["astro", "web"],
    pushed_at: RECENT,
    size: 1200,
    ...overrides,
  };
}

/* === sanitizeRepo — validación de forma en el borde (Req 12.5) ============= */
describe("fetch-github: sanitizeRepo (dato no confiable)", () => {
  it("acepta un repo bien formado y conserva solo campos conocidos", () => {
    const r = sanitizeRepo(apiRepo());
    expect(r).not.toBeNull();
    expect(r!.name).toBe("repo");
    expect(r!.fork).toBe(false);
    expect(r!.stargazers_count).toBe(3);
    expect(r!.topics).toEqual(["astro", "web"]);
  });

  it("rechaza entradas sin la forma mínima (name/url/pushed_at)", () => {
    expect(sanitizeRepo(null)).toBeNull();
    expect(sanitizeRepo("no-soy-objeto")).toBeNull();
    expect(sanitizeRepo([])).toBeNull();
    expect(sanitizeRepo(apiRepo({ name: "" }))).toBeNull();
    expect(sanitizeRepo(apiRepo({ name: 42 }))).toBeNull();
    expect(sanitizeRepo(apiRepo({ html_url: null }))).toBeNull();
    expect(sanitizeRepo(apiRepo({ pushed_at: "no-es-fecha" }))).toBeNull();
  });

  it("coerce booleanos y números malformados a valores seguros", () => {
    const r = sanitizeRepo(
      apiRepo({ fork: "yes", archived: 1, stargazers_count: "x", forks_count: NaN }),
    );
    expect(r).not.toBeNull();
    expect(r!.fork).toBe(false); // solo `true` literal cuenta como fork
    expect(r!.archived).toBe(false);
    expect(r!.stargazers_count).toBe(0);
    expect(r!.forks_count).toBe(0);
  });

  it("descarta campos opcionales vacíos y filtra topics no-string", () => {
    const r = sanitizeRepo(
      apiRepo({ description: "   ", homepage: "", language: null, topics: ["ok", 3, null, ""] }),
    );
    expect(r!.description).toBeUndefined();
    expect(r!.homepage).toBeUndefined();
    expect(r!.language).toBeUndefined();
    expect(r!.topics).toEqual(["ok"]);
  });

  it("acepta `languages` solo con pares válidos (nombre:bytes>0)", () => {
    const r = sanitizeRepo(
      apiRepo({ languages: { TypeScript: 5000, CSS: 0, "": 100, HTML: "x", Astro: 800 } }),
    );
    expect(r!.languages).toEqual({ TypeScript: 5000, Astro: 800 });
  });
});

/* === sanitizeProfile ======================================================= */
describe("fetch-github: sanitizeProfile", () => {
  it("extrae followers/public_repos válidos", () => {
    expect(sanitizeProfile({ followers: 10, public_repos: 25 })).toEqual({
      followers: 10,
      public_repos: 25,
    });
  });

  it("degrada a 0 ante perfil malformado o ausente", () => {
    expect(sanitizeProfile(null)).toEqual({ followers: 0, public_repos: 0 });
    expect(sanitizeProfile({ followers: -3, public_repos: "x" })).toEqual({
      followers: 0,
      public_repos: 0,
    });
  });
});

/* === aggregateLanguages ==================================================== */
describe("fetch-github: aggregateLanguages (design.md §2.4)", () => {
  it("cuenta el lenguaje principal cuando no hay bytes y normaliza a %", () => {
    const repos = [
      sanitizeRepo(apiRepo({ name: "a", language: "TypeScript" }))!,
      sanitizeRepo(apiRepo({ name: "b", language: "TypeScript" }))!,
      sanitizeRepo(apiRepo({ name: "c", language: "Astro" }))!,
    ];
    const langs = aggregateLanguages(repos);
    expect(langs[0]!.name).toBe("TypeScript");
    expect(langs[0]!.pct).toBeCloseTo(66.7, 1);
    expect(langs[1]!.name).toBe("Astro");
    expect(langs[0]!.color).toBe(languageColor("TypeScript"));
  });

  it("usa bytes por lenguaje cuando están disponibles y corta en top 6", () => {
    const repos = [
      sanitizeRepo(
        apiRepo({
          name: "x",
          languages: { A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 },
          language: null,
        }),
      )!,
    ];
    const langs = aggregateLanguages(repos);
    expect(langs.length).toBe(6); // top 6
    expect(langs[0]!.name).toBe("A"); // mayor peso primero
  });

  it("conjunto sin señal de lenguaje → []", () => {
    const repos = [sanitizeRepo(apiRepo({ language: null }))!];
    expect(aggregateLanguages(repos)).toEqual([]);
  });
});

/* === buildGitHubData ======================================================= */
describe("fetch-github: buildGitHubData (Req 7.3/7.5/12.5)", () => {
  it("descarta repos malformados y cura solo los válidos", () => {
    const raw = [
      apiRepo({ name: "ok", homepage: "https://ok.app", stargazers_count: 10 }),
      apiRepo({ name: "fork", fork: true }),
      apiRepo({ name: "blank", description: "  " }),
      { garbage: true }, // malformado → descartado
      null,
      "string-suelto",
    ];
    const data = buildGitHubData({ followers: 5, public_repos: 12 }, raw, { now: NOW });

    expect(isValidGitHubData(data)).toBe(true);
    expect(data.stats.followers).toBe(5);
    expect(data.stats.repos).toBe(12);
    // Solo "ok" pasa el filtro de curaduría (fuente + con descripción).
    expect(data.featured.map((r) => r.name)).toEqual(["ok"]);
  });

  it("respeta el tope de destacados (≤ MAX_FEATURED)", () => {
    const raw = Array.from({ length: 10 }, (_, i) =>
      apiRepo({ name: `r${i}`, stargazers_count: i, homepage: `https://r${i}.app` }),
    );
    const data = buildGitHubData({ followers: 0, public_repos: 10 }, raw, { now: NOW });
    expect(data.featured.length).toBeLessThanOrEqual(MAX_FEATURED);
  });

  it("usa el conteo de repos válidos si el perfil no trae public_repos", () => {
    const raw = [apiRepo({ name: "a" }), apiRepo({ name: "b" })];
    const data = buildGitHubData({}, raw, { now: NOW });
    expect(data.stats.repos).toBe(2);
  });

  it("entrada totalmente vacía → dataset válido y vacío", () => {
    const data = buildGitHubData(null, null, { now: NOW });
    expect(isValidGitHubData(data)).toBe(true);
    expect(data.featured).toEqual([]);
    expect(data.languages).toEqual([]);
  });
});

/* === isValidGitHubData / makeEmptyData ===================================== */
describe("fetch-github: validación del dataset (Req 7.5)", () => {
  it("makeEmptyData produce un dataset vacío VÁLIDO", () => {
    expect(isValidGitHubData(makeEmptyData(NOW))).toBe(true);
  });

  it("rechaza datasets con forma incorrecta", () => {
    expect(isValidGitHubData(null)).toBe(false);
    expect(isValidGitHubData({})).toBe(false);
    expect(isValidGitHubData({ generatedAt: "x", stats: {}, languages: [], featured: [] })).toBe(false);
    expect(
      isValidGitHubData({
        generatedAt: "x",
        stats: { repos: 1, stars: 1, followers: 1 },
        languages: [{ name: "TS", pct: "x", color: "#fff" }],
        featured: [],
      }),
    ).toBe(false);
  });

  it("languageColor: color conocido y fallback neutro", () => {
    expect(languageColor("TypeScript")).toBe("#3178c6");
    expect(languageColor("LenguajeInventado")).toBe("#8b8b8b");
  });
});

/* -----------------------------------------------------------------------------
   Property-based — robustez ante DATO NO CONFIABLE (Validates: Requirements 12.5)
   -----------------------------------------------------------------------------
   La API de GitHub se trata como no confiable (Req 12.5) y el build no debe
   romperse (Req 7.5): para CUALQUIER respuesta cruda (objetos basura, tipos
   equivocados, arrays mezclados), `buildGitHubData` no lanza y produce un
   `GitHubData` con forma válida y a lo sumo `MAX_FEATURED` destacados.
   --------------------------------------------------------------------------- */

// Generador de "valores arbitrarios" que imitan respuestas hostiles/corruptas.
const junkArb: fc.Arbitrary<unknown> = fc.anything();

// Generador de items tipo-repo con campos a veces correctos, a veces basura.
const noisyRepoArb: fc.Arbitrary<unknown> = fc.record({
  name: fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
  html_url: fc.oneof(fc.webUrl(), fc.constant(null), fc.integer()),
  description: fc.oneof(fc.string(), fc.constant(null)),
  homepage: fc.oneof(fc.webUrl(), fc.constant(null), fc.string()),
  fork: fc.oneof(fc.boolean(), fc.string()),
  archived: fc.oneof(fc.boolean(), fc.integer()),
  stargazers_count: fc.oneof(fc.integer({ min: 0, max: 9999 }), fc.string()),
  forks_count: fc.oneof(fc.integer({ min: 0, max: 9999 }), fc.constant(NaN)),
  language: fc.oneof(fc.constantFrom("TypeScript", "Astro"), fc.constant(null)),
  pushed_at: fc.oneof(
    fc
      .date({ min: new Date("2018-01-01Z"), max: new Date("2025-01-01Z"), noInvalidDate: true })
      .map((d) => d.toISOString()),
    fc.constant("no-es-fecha"),
    fc.integer(),
  ),
  size: fc.oneof(fc.integer({ min: 0, max: 200000 }), fc.string()),
});

describe("fetch-github: robustez ante entrada no confiable (Req 12.5)", () => {
  // Validates: Requirements 12.5
  it("buildGitHubData nunca lanza y siempre produce un GitHubData válido", () => {
    fc.assert(
      fc.property(
        junkArb,
        fc.oneof(fc.array(noisyRepoArb, { maxLength: 30 }), junkArb),
        (profile, repos) => {
          const data = buildGitHubData(profile, repos, { now: NOW });
          expect(isValidGitHubData(data)).toBe(true);
          expect(data.featured.length).toBeLessThanOrEqual(MAX_FEATURED);
        },
      ),
    );
  });
});
