import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Smoke test de la fundación (tarea 1): confirma que Vitest y fast-check
 * están correctamente cableados. NO es una propiedad de correctitud del spec;
 * las propiedades nombradas (localizedPath, validateContact, score/select, etc.)
 * se implementan en sus tareas correspondientes.
 */
describe('tooling: vitest + fast-check', () => {
  it('runs a basic unit assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('runs a basic property check (suma conmutativa)', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a),
    );
  });
});
