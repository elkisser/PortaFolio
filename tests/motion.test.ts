import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  planReveal,
  finalVisible,
  type RevealEnv,
} from "../src/lib/motion";

/* -----------------------------------------------------------------------------
   Generadores
   --------------------------------------------------------------------------- */

// Targets: identificadores únicos (modelan elementos del DOM, que son únicos).
// Usamos un set de strings únicos para razonar sobre cobertura sin duplicados.
const targets = fc.uniqueArray(fc.string(), { maxLength: 30 });

// Entorno arbitrario: las tres capacidades, cada una on/off.
const env: fc.Arbitrary<RevealEnv> = fc.record({
  reducedMotion: fc.boolean(),
  hasIntersectionObserver: fc.boolean(),
  hasViewTimeline: fc.boolean(),
});

const sorted = (xs: readonly string[]): string[] => [...xs].sort();

/* -----------------------------------------------------------------------------
   Ejemplos (las tres estrategias) — design.md §9.3 / §10
   --------------------------------------------------------------------------- */

describe("motion: planReveal — estrategias (ejemplos)", () => {
  const ts = ["a", "b", "c"];

  it("reduced-motion ⟹ immediate: todo visible, nada observado", () => {
    const plan = planReveal(ts, {
      reducedMotion: true,
      hasIntersectionObserver: true,
      hasViewTimeline: true,
    });
    expect(plan.strategy).toBe("immediate");
    expect(plan.visible).toEqual(ts);
    expect(plan.toObserve).toEqual([]);
  });

  it("sin IntersectionObserver ⟹ immediate: todo visible, nada observado", () => {
    const plan = planReveal(ts, {
      reducedMotion: false,
      hasIntersectionObserver: false,
      hasViewTimeline: false,
    });
    expect(plan.strategy).toBe("immediate");
    expect(plan.visible).toEqual(ts);
    expect(plan.toObserve).toEqual([]);
  });

  it("con view() y movimiento permitido ⟹ css-scroll: CSS revela, JS no observa", () => {
    const plan = planReveal(ts, {
      reducedMotion: false,
      hasIntersectionObserver: true,
      hasViewTimeline: true,
    });
    expect(plan.strategy).toBe("css-scroll");
    expect(plan.visible).toEqual(ts);
    expect(plan.toObserve).toEqual([]);
  });

  it("sin view() pero con IO ⟹ observe: la isla orquesta con IntersectionObserver", () => {
    const plan = planReveal(ts, {
      reducedMotion: false,
      hasIntersectionObserver: true,
      hasViewTimeline: false,
    });
    expect(plan.strategy).toBe("observe");
    expect(plan.visible).toEqual([]);
    expect(plan.toObserve).toEqual(ts);
  });

  it("colección vacía ⟹ plan vacío en cualquier entorno", () => {
    const plan = planReveal([], {
      reducedMotion: false,
      hasIntersectionObserver: true,
      hasViewTimeline: false,
    });
    expect(plan.visible).toEqual([]);
    expect(plan.toObserve).toEqual([]);
    expect(finalVisible(plan)).toEqual([]);
  });
});

/* -----------------------------------------------------------------------------
   Property 6 — Reveal seguro (design.md Correctness Properties)
   Validates: Requirements 10.3
   --------------------------------------------------------------------------- */

describe("motion: Property 6 — reveal seguro (Req 10.3)", () => {
  // Validates: Requirements 10.3
  it("reducedMotion ∨ ¬hasIO ⟹ visible == todos los targets ∧ toObserve == [] (cero observación)", () => {
    fc.assert(
      fc.property(targets, env, (ts, e) => {
        const plan = planReveal(ts, e);
        if (e.reducedMotion || !e.hasIntersectionObserver) {
          // Todos los targets quedan visibles…
          expect(sorted(plan.visible)).toEqual(sorted(ts));
          // …y NADA se observa (observeCount === 0).
          expect(plan.toObserve).toEqual([]);
          expect(plan.strategy).toBe("immediate");
        }
      }),
    );
  });
});

/* -----------------------------------------------------------------------------
   Property 7 — Sin pérdida de contenido (design.md Correctness Properties)
   Validates: Requirements 10.4
   --------------------------------------------------------------------------- */

describe("motion: Property 7 — sin pérdida de contenido (Req 10.4)", () => {
  // Validates: Requirements 10.4
  it("ningún entorno deja un target permanentemente invisible: finalVisible == todos", () => {
    fc.assert(
      fc.property(targets, env, (ts, e) => {
        const plan = planReveal(ts, e);
        // Tras completar el ciclo de reveal, TODOS los targets quedan visibles.
        expect(sorted(finalVisible(plan))).toEqual(sorted(ts));
      }),
    );
  });

  // Validates: Requirements 10.4 — `visible` y `toObserve` particionan los targets.
  it("visible ∪ toObserve cubre todos los targets, sin duplicados ni elementos espurios", () => {
    fc.assert(
      fc.property(targets, env, (ts, e) => {
        const plan = planReveal(ts, e);
        const union = sorted([...plan.visible, ...plan.toObserve]);
        // Cobertura exacta (partición): misma cardinalidad y mismos elementos.
        expect(union).toEqual(sorted(ts));
        // Disjuntos: ningún target aparece en ambos conjuntos.
        const intersection = plan.visible.filter((t) => plan.toObserve.includes(t));
        expect(intersection).toEqual([]);
      }),
    );
  });
});

/* -----------------------------------------------------------------------------
   Propiedades estructurales adicionales (pureza / determinismo)
   --------------------------------------------------------------------------- */

describe("motion: planReveal — invariantes estructurales", () => {
  it("la rama observe solo ocurre con hasIO ∧ ¬reducedMotion ∧ ¬hasViewTimeline", () => {
    fc.assert(
      fc.property(targets, env, (ts, e) => {
        const plan = planReveal(ts, e);
        if (plan.strategy === "observe") {
          expect(e.reducedMotion).toBe(false);
          expect(e.hasIntersectionObserver).toBe(true);
          expect(e.hasViewTimeline).toBe(false);
        }
      }),
    );
  });

  it("es determinista y no muta la entrada", () => {
    fc.assert(
      fc.property(targets, env, (ts, e) => {
        const snapshot = [...ts];
        const a = planReveal(ts, e);
        const b = planReveal(ts, e);
        expect(a).toEqual(b);
        // La entrada no se mutó.
        expect(ts).toEqual(snapshot);
      }),
    );
  });
});
