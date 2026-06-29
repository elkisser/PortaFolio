/* =============================================================================
   github.test.ts — Tests del scoring y la curaduría de repos (design.md §9, Req 7.3)
   -----------------------------------------------------------------------------
   Importa la lógica PURA de `src/lib/github.ts` (la misma que el script de build
   `fetch-github.mjs` usa para elegir los 4–6 destacados), por lo que estas
   aserciones reflejan la decisión real de selección sin red ni build de Astro.

   Tipos de test:
   - Unit: ejemplos y casos borde de `score`/`select` y de las señales.
   - Property-based (fast-check): design.md Correctness Properties 1–3:
       1. `|select(repos, max)| ≤ max`.
       2. `select` no devuelve forks/archivados ni duplicados, en orden desc.
       3. `score` finito y `≥ 0`; un fork puntúa menos que su equivalente no-fork.
   ============================================================================= */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  score,
  select,
  norm,
  recency,
  abandoned,
  hasDemo,
  isSource,
  isEmpty,
  readmeQuality,
  complexity,
  makeScoringContext,
  isExcluded,
  prettifyRepoName,
  displayNameFor,
  EXCLUDED_REPOS,
  type RawRepo,
  type ScoringContext,
} from "../src/lib/github";

/* -----------------------------------------------------------------------------
   Fixtures: `RawRepo` mínimo con valores por defecto "sanos" (fuente, descrito,
   reciente). Cada test sobrescribe solo lo que le interesa.
   --------------------------------------------------------------------------- */
const NOW = Date.parse("2025-01-01T00:00:00Z");
const RECENT = "2024-12-01T00:00:00Z"; // ~1 mes → reciente
const OLD = "2022-01-01T00:00:00Z"; // ~36 meses → abandonado

function repo(overrides: Partial<RawRepo> = {}): RawRepo {
  return {
    name: overrides.name ?? "repo",
    description: "una descripción real",
    html_url: "https://github.com/elkisser/repo",
    fork: false,
    archived: false,
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: RECENT,
    ...overrides,
  };
}

/** Contexto fijo y reproducible para los tests (no usa el reloj real). */
function ctxFor(repos: RawRepo[]): ScoringContext {
  return makeScoringContext(repos, NOW);
}

/* === Señales (helpers) ===================================================== */
describe("github: señales (helpers puros)", () => {
  it("norm acota a [0,1] y trata bordes (max<=0, value<=0)", () => {
    expect(norm(5, 10)).toBe(0.5);
    expect(norm(20, 10)).toBe(1); // nunca > 1
    expect(norm(5, 0)).toBe(0); // max <= 0 → 0
    expect(norm(-3, 10)).toBe(0); // value <= 0 → 0
  });

  it("recency decae con la antigüedad y se acota a [0,1]", () => {
    expect(recency(RECENT, NOW, 18)).toBeGreaterThan(0.9);
    expect(recency(OLD, NOW, 18)).toBe(0); // fuera de ventana → 0
    expect(recency("2099-01-01T00:00:00Z", NOW, 18)).toBe(1); // futuro → 1
    expect(recency("no-es-fecha", NOW, 18)).toBe(0); // inválida → 0
  });

  it("abandoned: true pasada la ventana o con fecha inválida", () => {
    expect(abandoned(RECENT, NOW, 18)).toBe(false);
    expect(abandoned(OLD, NOW, 18)).toBe(true);
    expect(abandoned("nope", NOW, 18)).toBe(true);
  });

  it("hasDemo / isSource / isEmpty", () => {
    expect(hasDemo(repo({ homepage: "https://demo.app" }))).toBe(true);
    expect(hasDemo(repo({ homepage: "  " }))).toBe(false);
    expect(isSource(repo({ fork: false, archived: false }))).toBe(true);
    expect(isSource(repo({ fork: true }))).toBe(false);
    expect(isSource(repo({ archived: true }))).toBe(false);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty("   ")).toBe(true);
    expect(isEmpty("x")).toBe(false);
  });

  it("readmeQuality 0..1: 0 sin README, sube con longitud/imágenes/secciones", () => {
    expect(readmeQuality(repo())).toBe(0); // sin README
    const rich =
      "# Título\n\n" +
      "Texto largo. ".repeat(120) +
      "\n## Sección\n![img](x.png)\n## Otra\n";
    const q = readmeQuality(repo({ readme: rich }));
    expect(q).toBeGreaterThan(0.5);
    expect(q).toBeLessThanOrEqual(1);
  });

  it("complexity 0..1: crece con multi-lenguaje y tamaño", () => {
    const simple = complexity(repo({ language: "TypeScript", size: 10 }));
    const complex = complexity(
      repo({ languages: { TypeScript: 5000, CSS: 2000, HTML: 1000, Astro: 800 }, size: 50000 }),
    );
    expect(complex).toBeGreaterThan(simple);
    expect(complex).toBeLessThanOrEqual(1);
    expect(complexity(repo({ size: 0 }))).toBeGreaterThanOrEqual(0);
  });
});

/* === score — ejemplos ====================================================== */
describe("github: score (design.md §9.1)", () => {
  it("siempre devuelve un número finito >= 0 (postcondición)", () => {
    const ctx = ctxFor([]);
    expect(score(repo(), ctx)).toBeGreaterThanOrEqual(0);
    // Repo pésimo (fork, sin descripción, abandonado): clamp a 0, nunca negativo.
    const awful = repo({ fork: true, description: null, pushed_at: OLD });
    expect(score(awful, ctx)).toBe(0);
  });

  it("un fork puntúa menos que su equivalente no-fork", () => {
    const ctx = ctxFor([]);
    const source = repo({ homepage: "https://demo.app", stargazers_count: 10 });
    const forked = { ...source, fork: true };
    expect(score(forked, ctx)).toBeLessThan(score(source, ctx));
  });

  it("sin descripción puntúa menos que descrito (equivalentes por lo demás)", () => {
    const ctx = ctxFor([]);
    const described = repo();
    const blank = { ...described, description: "" };
    expect(score(blank, ctx)).toBeLessThan(score(described, ctx));
  });

  it("tener demo desplegada suma frente a no tenerla", () => {
    const ctx = ctxFor([]);
    const withDemo = repo({ homepage: "https://demo.app" });
    const without = { ...withDemo, homepage: null };
    expect(score(withDemo, ctx)).toBeGreaterThan(score(without, ctx));
  });

  it("es puro: no muta el repo de entrada", () => {
    const r = repo({ stargazers_count: 3 });
    const snapshot = JSON.stringify(r);
    score(r, ctxFor([r]));
    expect(JSON.stringify(r)).toBe(snapshot);
  });
});

/* === select — ejemplos ===================================================== */
describe("github: select (design.md §9.2)", () => {
  it("devuelve a lo sumo `max`, en orden de score descendente", () => {
    const repos = [
      repo({ name: "a", stargazers_count: 1 }),
      repo({ name: "b", stargazers_count: 50, homepage: "https://b.app" }),
      repo({ name: "c", stargazers_count: 10 }),
    ];
    const result = select(repos, 2);
    expect(result.length).toBe(2);
    expect(result[0]!.score).toBeGreaterThanOrEqual(result[1]!.score);
    expect(result[0]!.name).toBe("b"); // el mejor primero
  });

  it("excluye forks, archivados y repos sin descripción (curaduría)", () => {
    const repos = [
      repo({ name: "ok" }),
      repo({ name: "forked", fork: true }),
      repo({ name: "archived", archived: true }),
      repo({ name: "blank", description: "  " }),
    ];
    const names = select(repos, 10).map((r) => r.name);
    expect(names).toEqual(["ok"]);
  });

  it("si cumplen menos que `max`, devuelve solo esos (no rellena)", () => {
    const repos = [repo({ name: "ok" }), repo({ name: "forked", fork: true })];
    expect(select(repos, 6).length).toBe(1);
  });

  it("deduplica por `name`, conservando el de mayor score", () => {
    const repos = [
      repo({ name: "dup", stargazers_count: 1 }),
      repo({ name: "dup", stargazers_count: 99, homepage: "https://dup.app" }),
    ];
    const result = select(repos, 10);
    expect(result.length).toBe(1);
    expect(result[0]!.stars).toBe(99); // ganó la instancia mejor puntuada
  });

  it("colección vacía o max<1 → []", () => {
    expect(select([], 5)).toEqual([]);
    expect(select([repo()], 0)).toEqual([]);
    expect(select([repo()], -3)).toEqual([]);
  });

  it("es puro: no muta el arreglo de entrada", () => {
    const repos = [repo({ name: "a" }), repo({ name: "b" })];
    const snapshot = JSON.stringify(repos);
    select(repos, 2);
    expect(JSON.stringify(repos)).toBe(snapshot);
  });
});

/* === Exclusiones de curaduría (feedback de usuario) ======================== */
describe("github: exclusión de repos (feedback de usuario)", () => {
  it("isExcluded reconoce los repos vetados, case-insensitive", () => {
    expect(EXCLUDED_REPOS).toContain("Sistema-de-Gestion-AsociacionLitoral");
    expect(EXCLUDED_REPOS).toContain("PortaFolio");
    expect(isExcluded("Sistema-de-Gestion-AsociacionLitoral")).toBe(true);
    expect(isExcluded("sistema-de-gestion-asociacionlitoral")).toBe(true);
    expect(isExcluded("PortaFolio")).toBe(true);
    expect(isExcluded("portafolio")).toBe(true);
    expect(isExcluded("  PortaFolio  ")).toBe(true); // tolera espacios
    expect(isExcluded("the-cookie-box")).toBe(false);
  });

  it("select NUNCA devuelve un repo de la lista de exclusión", () => {
    // Repos vetados con señales fuertes (estrellas + demo): aun así deben caer.
    const repos = [
      repo({ name: "Sistema-de-Gestion-AsociacionLitoral", stargazers_count: 99, homepage: "https://x.app" }),
      repo({ name: "PortaFolio", stargazers_count: 80, homepage: "https://y.app" }),
      repo({ name: "portafolio", stargazers_count: 70 }), // variante de caja
      repo({ name: "prode", stargazers_count: 5, homepage: "https://prode.app" }),
      repo({ name: "the-cookie-box", stargazers_count: 4 }),
    ];
    const names = select(repos, 10).map((r) => r.name);
    expect(names).not.toContain("Sistema-de-Gestion-AsociacionLitoral");
    expect(names).not.toContain("PortaFolio");
    expect(names).not.toContain("portafolio");
    expect(names).toContain("prode");
    expect(names).toContain("the-cookie-box");
  });
});

/* === Nombre legible (displayName / prettifier) ============================= */
describe("github: displayName (slug → título humano)", () => {
  it("prettifyRepoName: separadores → espacios + title-case", () => {
    expect(prettifyRepoName("the-cookie-box")).toBe("The Cookie Box");
    expect(prettifyRepoName("hello_world")).toBe("Hello World");
    expect(prettifyRepoName("prode")).toBe("Prode");
  });

  it("prettifyRepoName: preserva nombres mixed-case sin separadores", () => {
    expect(prettifyRepoName("LuminaEdit")).toBe("LuminaEdit");
    expect(prettifyRepoName("CodeGenome")).toBe("CodeGenome");
  });

  it("prettifyRepoName: respeta acrónimos conocidos", () => {
    expect(prettifyRepoName("my-api-client")).toBe("My API Client");
    expect(prettifyRepoName("codegenome-x")).toBe("Codegenome X");
  });

  it("prettifyRepoName: nunca cae con entradas raras", () => {
    expect(prettifyRepoName("")).toBe("");
    expect(prettifyRepoName("---")).toBe(""); // solo separadores → vacío
    expect(prettifyRepoName("  spaced  name  ")).toBe("Spaced Name");
  });

  it("displayNameFor: usa overrides curados (case-insensitive)", () => {
    expect(displayNameFor("codegenome-x")).toBe("CodeGenome X");
    expect(displayNameFor("the-cookie-box")).toBe("The Cookie Box");
    expect(displayNameFor("prode")).toBe("Prode");
    expect(displayNameFor("LuminaEdit")).toBe("LuminaEdit");
    // Reusa el título canónico del case study (src/content/work/chromora).
    expect(displayNameFor("chromora")).toBe("Chromora");
    expect(displayNameFor("CHROMORA")).toBe("Chromora");
  });

  it("displayNameFor: cae al prettifier para repos no mapeados", () => {
    expect(displayNameFor("some-new-project")).toBe("Some New Project");
  });

  it("displayNameFor: siempre devuelve algo no vacío para un nombre no vacío", () => {
    expect(displayNameFor("---")).toBe("---"); // prettifier vacío → nombre recortado
    expect(displayNameFor("x")).toBe("X");
  });

  it("select proyecta displayName en cada destacado", () => {
    const result = select([repo({ name: "the-cookie-box" }), repo({ name: "prode" })], 10);
    const byName = new Map(result.map((r) => [r.name, r.displayName]));
    expect(byName.get("the-cookie-box")).toBe("The Cookie Box");
    expect(byName.get("prode")).toBe("Prode");
  });
});

/* -----------------------------------------------------------------------------
   Property-based — design.md Correctness Properties 1–3 (Validates: Req 7.3)
   --------------------------------------------------------------------------- */

// Generador de `RawRepo` que cubre el espacio de entrada con sentido: forks,
// archivados, descripciones vacías/nulas, fechas dentro y fuera de ventana.
const repoArb: fc.Arbitrary<RawRepo> = fc.record({
  name: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
  description: fc.oneof(
    fc.constant<string | null>(null),
    fc.constant(""),
    fc.constant("   "),
    fc.stringMatching(/^[A-Za-z0-9 ]{1,40}$/),
  ),
  html_url: fc.webUrl(),
  homepage: fc.oneof(fc.constant<string | null>(null), fc.webUrl()),
  fork: fc.boolean(),
  archived: fc.boolean(),
  stargazers_count: fc.integer({ min: 0, max: 5000 }),
  forks_count: fc.integer({ min: 0, max: 2000 }),
  language: fc.oneof(fc.constant<string | null>(null), fc.constantFrom("TypeScript", "Astro", "PHP")),
  topics: fc.array(fc.stringMatching(/^[a-z]{1,8}$/), { maxLength: 5 }),
  pushed_at: fc
    .date({
      min: new Date("2018-01-01T00:00:00Z"),
      max: new Date("2025-01-01T00:00:00Z"),
      noInvalidDate: true,
    })
    .map((d) => d.toISOString()),
  size: fc.integer({ min: 0, max: 200000 }),
});

const maxArb = fc.integer({ min: 1, max: 12 });

describe("github: Property 1 — cota de curaduría (Req 7.3)", () => {
  // Validates: Requirements 7.3
  it("|select(repos, max)| ≤ max, para todo repos y todo max ≥ 1", () => {
    fc.assert(
      fc.property(fc.array(repoArb, { maxLength: 40 }), maxArb, (repos, max) => {
        expect(select(repos, max).length).toBeLessThanOrEqual(max);
      }),
    );
  });
});

describe("github: Property 2 — pureza de la selección (Req 7.3)", () => {
  // Validates: Requirements 7.3
  it("nunca devuelve forks/archivados/sin-descripción ni duplicados, y respeta el orden desc", () => {
    fc.assert(
      fc.property(fc.array(repoArb, { maxLength: 40 }), maxArb, (repos, max) => {
        const result = select(repos, max);

        // Sin duplicados por `name`.
        const names = result.map((r) => r.name);
        expect(new Set(names).size).toBe(names.length);

        // Todos pasan el filtro de curaduría. Como puede haber varios repos con el
        // mismo `name` en la entrada (y `select` deduplica conservando el de mayor
        // score entre los válidos), se verifica que EXISTE al menos una instancia
        // con ese `name` que cumple el filtro fuente+descrita+no-vetada.
        for (const r of result) {
          const candidates = repos.filter((src) => src.name === r.name);
          const passesCuratorship = candidates.some(
            (src) => isSource(src) && !isEmpty(src.description),
          );
          expect(passesCuratorship).toBe(true); // ni fork ni archivado, con descripción
          expect(isExcluded(r.name)).toBe(false); // nunca un repo vetado
          // displayName: presente, no vacío y coherente con la función pura.
          expect(r.displayName.length).toBeGreaterThan(0);
          expect(r.displayName).toBe(displayNameFor(r.name));
        }

        // Orden por score descendente.
        for (let i = 1; i < result.length; i++) {
          expect(result[i - 1]!.score).toBeGreaterThanOrEqual(result[i]!.score);
        }
      }),
    );
  });
});

describe("github: Property 3 — score bien formado (Req 7.3)", () => {
  // Validates: Requirements 7.3
  it("score(r) es finito y ≥ 0 para todo repo", () => {
    fc.assert(
      fc.property(repoArb, (r) => {
        const ctx = makeScoringContext([r], NOW);
        const s = score(r, ctx);
        expect(Number.isFinite(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  // Validates: Requirements 7.3
  it("un fork puntúa menos que su equivalente no-fork (mismo ctx)", () => {
    fc.assert(
      fc.property(repoArb, (base) => {
        // Equivalentes salvo `fork`; `archived=false` para aislar el efecto del fork.
        const source: RawRepo = { ...base, fork: false, archived: false };
        const forked: RawRepo = { ...base, fork: true, archived: false };
        const ctx = makeScoringContext([source, forked], NOW);
        const sourceScore = score(source, ctx);
        const forkedScore = score(forked, ctx);

        // El fork pierde el aporte `w7` de "es fuente" y además paga `p1`, así que
        // su puntuación PRE-clamp es siempre `w7 + p1` menor que la del no-fork
        // (design.md §9.1). El orden estricto es observable mientras el no-fork no
        // toque el piso del clamp `max(0, s)`:
        if (sourceScore > 0) {
          // Caso significativo: la fuente puntúa por encima del piso → orden estricto.
          expect(forkedScore).toBeLessThan(sourceScore);
        } else {
          // Caso degenerado (fuente basura: sin descripción, abandonada, sin señales):
          // ambas variantes se acotan a 0 vía `max(0, s)` (postcondición `>= 0`,
          // design.md §9.1). El orden estricto no puede sostenerse en 0 ≥ 0, pero
          // el fork nunca supera a su fuente: `forked <= source` (= 0).
          expect(forkedScore).toBeLessThanOrEqual(sourceScore);
          expect(forkedScore).toBe(0);
        }
      }),
    );
  });
});
