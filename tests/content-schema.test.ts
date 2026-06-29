/* =============================================================================
   content-schema.test.ts — Tests del modelo de contenido de case studies (§8)
   -----------------------------------------------------------------------------
   Verifica las reglas de validación de `src/content/schema.ts` (design.md §8,
   Req 1.2, 1.3, 5.3, 6.1). Importa los esquemas Zod directamente (mismo `z` que
   usa Astro en build, vía `astro/zod`), por lo que estas aserciones reflejan
   exactamente lo que `defineCollection` aceptará/rechazará al compilar.

   Tipos de test:
   - Unit: ejemplos concretos y casos borde (alt vacío, width/height, summary 160…).
   - Property-based (fast-check): invariantes universales sobre rangos de entrada
     (a11y: alt siempre no vacío; anti-CLS: width/height enteros positivos
     presentes; ≥ 1 decisión; summary ≤ 160).
   ============================================================================= */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  mediaSchema,
  techDecisionSchema,
  workSchema,
  WORK_CATEGORIES,
  type CaseStudyData,
} from "../src/content/schema";

/** Fábrica de un case study mínimo VÁLIDO (frontmatter de §8). */
function validWork(overrides: Record<string, unknown> = {}) {
  return {
    title: "Chromora",
    year: 2024,
    category: ["frontend"],
    summary: "Generador de paletas con IA.",
    problem: "Elegir paletas accesibles es difícil.",
    role: "Diseño y desarrollo full-stack.",
    decisions: [{ decision: "Usar LCH", rationale: "Mejor uniformidad perceptual." }],
    result: "Demo pública usada por diseñadores.",
    stack: ["Astro", "TypeScript"],
    links: {},
    lang: "es",
    ...overrides,
  };
}

describe("mediaSchema (Req 6.1 a11y / Req 6.4 anti-CLS)", () => {
  const validMedia = {
    type: "image",
    src: "/img/chromora/cover.webp",
    alt: "Pantalla principal de Chromora",
    width: 1280,
    height: 720,
  };

  it("acepta un medio válido", () => {
    expect(mediaSchema.safeParse(validMedia).success).toBe(true);
  });

  it("rechaza alt ausente", () => {
    const { alt: _omit, ...noAlt } = validMedia;
    void _omit;
    expect(mediaSchema.safeParse(noAlt).success).toBe(false);
  });

  it("rechaza alt vacío (a11y)", () => {
    expect(mediaSchema.safeParse({ ...validMedia, alt: "" }).success).toBe(false);
  });

  it("rechaza width/height ausentes (anti-CLS)", () => {
    const { width: _w, height: _h, ...noDims } = validMedia;
    void _w;
    void _h;
    expect(mediaSchema.safeParse(noDims).success).toBe(false);
  });

  it("rechaza dimensiones no positivas o no enteras", () => {
    expect(mediaSchema.safeParse({ ...validMedia, width: 0 }).success).toBe(false);
    expect(mediaSchema.safeParse({ ...validMedia, height: -10 }).success).toBe(false);
    expect(mediaSchema.safeParse({ ...validMedia, width: 12.5 }).success).toBe(false);
  });

  it("rechaza un type fuera del enum", () => {
    expect(mediaSchema.safeParse({ ...validMedia, type: "gif" }).success).toBe(false);
  });

  it("acepta poster opcional", () => {
    expect(
      mediaSchema.safeParse({ ...validMedia, poster: "/img/poster.webp" }).success,
    ).toBe(true);
  });
});

describe("techDecisionSchema (Req 5.3: documentar el porqué)", () => {
  it("acepta decisión + rationale no vacíos", () => {
    expect(
      techDecisionSchema.safeParse({ decision: "X", rationale: "Y" }).success,
    ).toBe(true);
  });

  it("rechaza rationale vacío", () => {
    expect(
      techDecisionSchema.safeParse({ decision: "X", rationale: "" }).success,
    ).toBe(false);
  });

  it("rechaza decision vacía", () => {
    expect(
      techDecisionSchema.safeParse({ decision: "", rationale: "Y" }).success,
    ).toBe(false);
  });
});

describe("workSchema (design.md §8)", () => {
  it("acepta un case study mínimo válido", () => {
    expect(workSchema.safeParse(validWork()).success).toBe(true);
  });

  it("aplica defaults: challenges=[], media=[], featured=false, order=99", () => {
    const parsed = workSchema.parse(validWork());
    expect(parsed.challenges).toEqual([]);
    expect(parsed.media).toEqual([]);
    expect(parsed.featured).toBe(false);
    expect(parsed.order).toBe(99);
  });

  it("rechaza decisions vacío (≥ 1 decisión, Req 5.3)", () => {
    expect(workSchema.safeParse(validWork({ decisions: [] })).success).toBe(false);
  });

  it("rechaza summary > 160 caracteres", () => {
    expect(workSchema.safeParse(validWork({ summary: "x".repeat(161) })).success).toBe(
      false,
    );
  });

  it("acepta summary de exactamente 160 caracteres", () => {
    expect(workSchema.safeParse(validWork({ summary: "x".repeat(160) })).success).toBe(
      true,
    );
  });

  it("rechaza category vacía y acepta categorías válidas", () => {
    expect(workSchema.safeParse(validWork({ category: [] })).success).toBe(false);
    for (const cat of WORK_CATEGORIES) {
      expect(workSchema.safeParse(validWork({ category: [cat] })).success).toBe(true);
    }
    expect(workSchema.safeParse(validWork({ category: ["nope"] })).success).toBe(false);
  });

  it("rechaza stack vacío", () => {
    expect(workSchema.safeParse(validWork({ stack: [] })).success).toBe(false);
  });

  it("rechaza year fuera de [2015, 2100]", () => {
    expect(workSchema.safeParse(validWork({ year: 2014 })).success).toBe(false);
    expect(workSchema.safeParse(validWork({ year: 2101 })).success).toBe(false);
    expect(workSchema.safeParse(validWork({ year: 2015 })).success).toBe(true);
    expect(workSchema.safeParse(validWork({ year: 2100 })).success).toBe(true);
  });

  it("valida URLs de links.demo/repo solo si están presentes", () => {
    expect(workSchema.safeParse(validWork({ links: {} })).success).toBe(true);
    expect(
      workSchema.safeParse(validWork({ links: { demo: "https://chromora.app" } }))
        .success,
    ).toBe(true);
    expect(
      workSchema.safeParse(validWork({ links: { repo: "not-a-url" } })).success,
    ).toBe(false);
  });

  it("rechaza lang fuera de es/en", () => {
    expect(workSchema.safeParse(validWork({ lang: "fr" })).success).toBe(false);
  });
});

/* -----------------------------------------------------------------------------
   Property-based (fast-check): invariantes universales del modelo de contenido.
   --------------------------------------------------------------------------- */

describe("Propiedades del modelo de contenido (fast-check)", () => {
  it("a11y + anti-CLS: todo medio con alt no vacío y dimensiones enteras positivas valida, y conserva width/height", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("image", "video"),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (type, alt, width, height) => {
          const r = mediaSchema.safeParse({ type, src: "/x.webp", alt, width, height });
          expect(r.success).toBe(true);
          if (r.success) {
            expect(r.data.width).toBe(width);
            expect(r.data.height).toBe(height);
            expect(r.data.alt.length).toBeGreaterThan(0);
          }
        },
      ),
    );
  });

  it("a11y: alt vacío SIEMPRE se rechaza, sea cual sea el resto del medio", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("image", "video"),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (type, width, height) => {
          const r = mediaSchema.safeParse({ type, src: "/x.webp", alt: "", width, height });
          expect(r.success).toBe(false);
        },
      ),
    );
  });

  it("anti-CLS: dimensiones cero/negativas/no enteras SIEMPRE se rechazan", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ max: 0 }), fc.double({ min: 0.1, max: 0.9, noNaN: true })),
        (badDim) => {
          const base = { type: "image", src: "/x.webp", alt: "ok", width: 100, height: 100 };
          expect(mediaSchema.safeParse({ ...base, width: badDim }).success).toBe(false);
          expect(mediaSchema.safeParse({ ...base, height: badDim }).success).toBe(false);
        },
      ),
    );
  });

  it("≥ 1 decisión: arrays no vacíos de decisiones válidas pasan; vacío falla", () => {
    const decisionArb = fc.record({
      decision: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      rationale: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    });
    fc.assert(
      fc.property(fc.array(decisionArb, { minLength: 1, maxLength: 6 }), (decisions) => {
        const parsed = workSchema.safeParse(validWork({ decisions }));
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          expect((parsed.data as CaseStudyData).decisions.length).toBeGreaterThanOrEqual(1);
        }
      }),
    );
    expect(workSchema.safeParse(validWork({ decisions: [] })).success).toBe(false);
  });

  it("summary: ≤ 160 pasa, > 160 falla (frontera)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 320 }), (len) => {
        const summary = "x".repeat(len);
        const ok = workSchema.safeParse(validWork({ summary })).success;
        expect(ok).toBe(len <= 160);
      }),
    );
  });
});
