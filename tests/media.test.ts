/* =============================================================================
   media.test.ts — Tests de la lógica del MediaViewer y del estándar de medios
   (design.md §2.5, §10, Correctness Property 8; Req 6.1/6.2/6.3/6.4)
   -----------------------------------------------------------------------------
   Importa la lógica PURA de `src/lib/media.ts` (la misma que compone la isla
   `MediaViewer`), por lo que estas aserciones reflejan el comportamiento real de
   navegación del carrusel y de reserva de espacio (CLS) sin levantar jsdom ni el
   build de Astro.

   Tipos de test:
   - Unit: navegación del carrusel (wrap-around, teclas), casos borde.
   - Property-based (fast-check): Property 8 — CLS por contrato (Req 6.4) +
     invariantes estructurales de la aritmética de índices.
   ============================================================================= */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  clampIndex,
  nextIndex,
  prevIndex,
  keyToIndex,
  aspectRatio,
  reservedBox,
  placeholderBox,
  loadedBox,
  mediaLayoutShift,
  type MediaDims,
  type Box,
} from "../src/lib/media";

/* -----------------------------------------------------------------------------
   Navegación del carrusel — ejemplos (Req 6.x a11y: teclado, design.md §10)
   --------------------------------------------------------------------------- */

describe("media: navegación del carrusel (ejemplos)", () => {
  it("nextIndex avanza y envuelve al primero tras el último", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(1, 3)).toBe(2);
    expect(nextIndex(2, 3)).toBe(0); // wrap
  });

  it("prevIndex retrocede y envuelve al último antes del primero", () => {
    expect(prevIndex(2, 3)).toBe(1);
    expect(prevIndex(1, 3)).toBe(0);
    expect(prevIndex(0, 3)).toBe(2); // wrap
  });

  it("clampIndex acota índices fuera de rango con envoltura", () => {
    expect(clampIndex(5, 3)).toBe(2);
    expect(clampIndex(-1, 3)).toBe(2);
    expect(clampIndex(-4, 3)).toBe(2);
    expect(clampIndex(0, 0)).toBe(0); // colección vacía → 0, sin lanzar
  });

  it("keyToIndex mapea ← → Home End y devuelve null para otras teclas", () => {
    expect(keyToIndex("ArrowRight", 0, 3)).toBe(1);
    expect(keyToIndex("ArrowLeft", 0, 3)).toBe(2); // wrap al último
    expect(keyToIndex("Home", 2, 3)).toBe(0);
    expect(keyToIndex("End", 0, 3)).toBe(2);
    expect(keyToIndex("Tab", 0, 3)).toBeNull();
    expect(keyToIndex("Escape", 0, 3)).toBeNull();
    expect(keyToIndex("ArrowRight", 0, 0)).toBeNull(); // sin medios
  });
});

/* -----------------------------------------------------------------------------
   Reserva de espacio — ejemplos (Req 6.4 anti-CLS)
   --------------------------------------------------------------------------- */

describe("media: reserva de espacio (ejemplos)", () => {
  it("aspectRatio = width / height", () => {
    expect(aspectRatio({ width: 16, height: 9 })).toBeCloseTo(16 / 9);
    expect(aspectRatio({ width: 1, height: 1 })).toBe(1);
  });

  it("reservedBox deriva el alto del ancho del contenedor según la relación de aspecto", () => {
    expect(reservedBox({ width: 1600, height: 900 }, 800)).toEqual({
      width: 800,
      height: 450,
    });
  });

  it("CONTRATO presente ⟹ la caja antes y después de cargar es idéntica (CLS 0)", () => {
    const dims: MediaDims = { width: 1280, height: 720 };
    const before = placeholderBox(dims, 600);
    const after = loadedBox(dims, 600);
    expect(before).toEqual(after);
    expect(mediaLayoutShift(before, after, { width: 600, height: 800 })).toBe(0);
  });

  it("SIN contrato ⟹ el medio colapsa y luego salta (CLS > 0): demuestra el valor del contrato", () => {
    const intrinsic: MediaDims = { width: 1280, height: 720 };
    const before = placeholderBox(null, 600); // sin width/height → alto 0
    const after = loadedBox(intrinsic, 600); // salta al alto real al cargar
    const cls = mediaLayoutShift(before, after, { width: 600, height: 800 });
    expect(cls).toBeGreaterThan(0);
  });
});

/* -----------------------------------------------------------------------------
   Property 8 — CLS por contrato (design.md Correctness Properties)
   Validates: Requirements 6.4
   -----------------------------------------------------------------------------
   "Todo MediaAsset tiene width/height ⟹ el layout reserva espacio (CLS de
   medios = 0)."  Para CUALQUIER medio con dimensiones válidas, CUALQUIER ancho de
   contenedor y CUALQUIER viewport, la caja reservada antes de cargar (derivada del
   contrato width/height) es la misma que se ocupa tras cargar ⟹ layout shift = 0.
   --------------------------------------------------------------------------- */

// Dimensiones válidas según el esquema §8: enteros positivos.
const validDims: fc.Arbitrary<MediaDims> = fc.record({
  width: fc.integer({ min: 1, max: 10000 }),
  height: fc.integer({ min: 1, max: 10000 }),
});

// Ancho de contenedor positivo (px CSS).
const containerWidth = fc.integer({ min: 1, max: 4000 });

// Viewport positivo (mobile/desktop).
const viewport: fc.Arbitrary<Box> = fc.record({
  width: fc.integer({ min: 1, max: 4000 }),
  height: fc.integer({ min: 1, max: 4000 }),
});

describe("media: Property 8 — CLS por contrato (Req 6.4)", () => {
  // Validates: Requirements 6.4
  it("medio con width/height ⟹ caja reservada == caja cargada ⟹ CLS = 0, para todo contenedor y viewport", () => {
    fc.assert(
      fc.property(validDims, containerWidth, viewport, (dims, cw, vp) => {
        const before = placeholderBox(dims, cw); // espacio reservado por el contrato
        const after = loadedBox(dims, cw); // espacio ocupado al cargar el recurso
        // La caja no cambia entre estados…
        expect(after).toEqual(before);
        // …luego el desplazamiento de layout del medio es exactamente 0 (CLS 0).
        expect(mediaLayoutShift(before, after, vp)).toBe(0);
      }),
    );
  });

  // Validates: Requirements 6.4 — el contrato es lo que lleva el CLS a 0: sin él,
  // (dimensiones desconocidas) el medio colapsa y salta al cargar → CLS > 0.
  it("contraste: SIN contrato (dims desconocidas) el medio produce CLS > 0", () => {
    fc.assert(
      fc.property(validDims, containerWidth, viewport, (dims, cw, vp) => {
        const before = placeholderBox(null, cw); // colapsa a alto 0
        const after = loadedBox(dims, cw);
        const cls = mediaLayoutShift(before, after, vp);
        // Solo es 0 si el medio cargado también tiene alto 0 (imposible: h ≥ 1,
        // cw ≥ 1 ⟹ alto > 0), de modo que SIEMPRE hay shift sin contrato.
        expect(cls).toBeGreaterThan(0);
      }),
    );
  });
});

/* -----------------------------------------------------------------------------
   Invariantes estructurales de la navegación (pureza / cota de rango)
   --------------------------------------------------------------------------- */

describe("media: navegación — invariantes estructurales", () => {
  const positiveLen = fc.integer({ min: 1, max: 50 });
  const anyIndex = fc.integer({ min: -100, max: 100 });

  it("clampIndex SIEMPRE devuelve un índice en [0, length) para length ≥ 1", () => {
    fc.assert(
      fc.property(anyIndex, positiveLen, (i, n) => {
        const r = clampIndex(i, n);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(n);
        expect(Number.isInteger(r)).toBe(true);
      }),
    );
  });

  it("next/prev nunca salen de rango y son inversos entre sí", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 49 }), positiveLen, (i0, n) => {
        const i = clampIndex(i0, n);
        const fwd = nextIndex(i, n);
        expect(fwd).toBeGreaterThanOrEqual(0);
        expect(fwd).toBeLessThan(n);
        // prev(next(i)) === i (inversa exacta con envoltura).
        expect(prevIndex(fwd, n)).toBe(i);
      }),
    );
  });

  it("keyToIndex devuelve un índice válido o null, nunca fuera de rango", () => {
    const keys = fc.constantFrom("ArrowRight", "ArrowLeft", "Home", "End", "x", "Enter");
    fc.assert(
      fc.property(keys, anyIndex, positiveLen, (key, i, n) => {
        const r = keyToIndex(key, i, n);
        if (r === null) return;
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(n);
      }),
    );
  });
});
