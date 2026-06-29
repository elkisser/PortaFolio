/* =============================================================================
   budget-audit.test.ts — Tests de la auditoría de presupuesto (Req 9.2 / 13.3)
   -----------------------------------------------------------------------------
   `scripts/budget-audit.mjs` es la variante bundle-size de la "auditoría de
   presupuesto antes de publicar" del pipeline de CI (Req 13.3). Aquí cubrimos su
   lógica PURA y determinista (`evaluateBudget`, `resolveBudgetBytes`, `formatKB`)
   sin I/O: la comparación total-gzip vs. presupuesto y la resolución del umbral.

   Tipos de test:
   - Unit: ejemplos y casos borde (vacío, exactamente en el límite, override).
   - Property-based (fast-check): la decisión de presupuesto es exactamente
     `totalGzip <= budgetBytes` para cualquier conjunto de archivos.
   ============================================================================= */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  evaluateBudget,
  resolveBudgetBytes,
  formatKB,
} from "../scripts/budget-audit.mjs";

describe("budget-audit: evaluateBudget", () => {
  it("suma raw y gzip de todos los archivos", () => {
    const files = [
      { path: "a.js", raw: 1000, gzip: 400 },
      { path: "b.js", raw: 2000, gzip: 600 },
    ];
    const result = evaluateBudget(files, 2048);
    expect(result.totalRaw).toBe(3000);
    expect(result.totalGzip).toBe(1000);
    expect(result.withinBudget).toBe(true);
  });

  it("una lista vacía es 0 bytes y siempre está dentro del presupuesto", () => {
    const result = evaluateBudget([], 1024);
    expect(result.totalRaw).toBe(0);
    expect(result.totalGzip).toBe(0);
    expect(result.withinBudget).toBe(true);
  });

  it("estar exactamente en el límite cuenta como dentro del presupuesto", () => {
    const result = evaluateBudget([{ path: "a.js", raw: 5000, gzip: 1024 }], 1024);
    expect(result.withinBudget).toBe(true);
  });

  it("superar el presupuesto por un byte falla", () => {
    const result = evaluateBudget([{ path: "a.js", raw: 5000, gzip: 1025 }], 1024);
    expect(result.withinBudget).toBe(false);
  });
});

describe("budget-audit: resolveBudgetBytes", () => {
  it("usa el default (~35 KB) sin override", () => {
    expect(resolveBudgetBytes({})).toBe(35 * 1024);
  });

  it("respeta JS_BUDGET_KB cuando es un número positivo válido", () => {
    expect(resolveBudgetBytes({ JS_BUDGET_KB: "50" })).toBe(50 * 1024);
  });

  it("ignora overrides inválidos (no numéricos o ≤ 0) y cae al default", () => {
    expect(resolveBudgetBytes({ JS_BUDGET_KB: "abc" })).toBe(35 * 1024);
    expect(resolveBudgetBytes({ JS_BUDGET_KB: "0" })).toBe(35 * 1024);
    expect(resolveBudgetBytes({ JS_BUDGET_KB: "-10" })).toBe(35 * 1024);
  });
});

describe("budget-audit: formatKB", () => {
  it("formatea bytes a KB con 1 decimal", () => {
    expect(formatKB(1024)).toBe("1.0 KB");
    expect(formatKB(1536)).toBe("1.5 KB");
    expect(formatKB(0)).toBe("0.0 KB");
  });
});

describe("budget-audit: propiedad de decisión", () => {
  it("withinBudget ⟺ totalGzip ≤ budgetBytes para cualquier entrada", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            path: fc.string(),
            raw: fc.nat(),
            gzip: fc.nat(),
          }),
        ),
        fc.nat(),
        (files, budgetBytes) => {
          const result = evaluateBudget(files, budgetBytes);
          const expectedGzip = files.reduce((s, f) => s + f.gzip, 0);
          expect(result.totalGzip).toBe(expectedGzip);
          expect(result.withinBudget).toBe(expectedGzip <= budgetBytes);
        },
      ),
    );
  });
});
