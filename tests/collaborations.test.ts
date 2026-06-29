/* =============================================================================
   collaborations.test.ts — Tests de la fuente curada de colaboraciones (Req 7.1/7.4)
   -----------------------------------------------------------------------------
   Verifica el contrato de `src/content/data/collaborations.ts`:
   - `selectPublishedCollaborations` solo deja pasar entradas `published: true`.
   - `Club del Barril` está publicada como colaboración PRIVADA: sin URL pública
     (no se enlaza a un repo privado que daría 404) y con copy localizado ES/EN.
   - `localizedText` resuelve copy localizable al idioma pedido, con fallbacks y
     sin devolver cadenas vacías.
   - Invariante universal (fast-check): el resultado es siempre un subconjunto de
     publicadas, sin reordenar ni mutar la entrada.
   ============================================================================= */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  COLLABORATIONS,
  selectPublishedCollaborations,
  localizedText,
  type Collaboration,
  type LocalizedText,
} from "../src/content/data/collaborations";
import { LOCALES, type Locale } from "../src/lib/i18n";

describe("collaborations: fuente curada", () => {
  it("selectPublishedCollaborations solo devuelve entradas publicadas", () => {
    for (const c of selectPublishedCollaborations()) {
      expect(c.published).toBe(true);
    }
  });

  it("incluye Club del Barril como colaboración PRIVADA publicada", () => {
    const club = COLLABORATIONS.find((c) => c.name === "Club del Barril");
    expect(club).toBeDefined();
    expect(club?.published).toBe(true);
    expect(club?.private).toBe(true);
    // Privada: sin URL pública (evita un enlace muerto a un repo 404).
    expect(club?.url).toBeUndefined();
    // Copy honesto y localizado en ambos idiomas: plataforma completa (no solo
    // backend) — refleja que se construyó la app entera.
    expect(localizedText(club?.description, "es")).toMatch(/fidelización/i);
    expect(localizedText(club?.description, "en")).toMatch(/loyalty/i);
    expect(localizedText(club?.role, "es")).toMatch(/full stack/i);
    expect(localizedText(club?.role, "en")).toMatch(/full stack/i);
  });

  it("Club del Barril aparece entre las publicadas y se renderiza como privada", () => {
    const published = selectPublishedCollaborations();
    const club = published.find((c) => c.name === "Club del Barril");
    expect(club).toBeDefined();
    // Sin URL ⟹ la UI mostrará la etiqueta "Repositorio privado" en vez de enlace.
    expect(club?.url).toBeUndefined();
    expect(club?.private).toBe(true);
  });
});

/* === localizedText — resolución de copy localizable (pura) ================= */
describe("collaborations: localizedText", () => {
  it("undefined/null → undefined", () => {
    expect(localizedText(undefined, "es")).toBeUndefined();
    expect(localizedText(null, "en")).toBeUndefined();
  });

  it("string simple → ese string; vacío/whitespace → undefined", () => {
    expect(localizedText("hola", "es")).toBe("hola");
    expect(localizedText("hola", "en")).toBe("hola"); // mismo copy en todos los idiomas
    expect(localizedText("", "es")).toBeUndefined();
    expect(localizedText("   ", "es")).toBeUndefined();
  });

  it("mapa por idioma → prioriza el idioma pedido", () => {
    const v: LocalizedText = { es: "hola", en: "hi" };
    expect(localizedText(v, "es")).toBe("hola");
    expect(localizedText(v, "en")).toBe("hi");
  });

  it("mapa incompleto → cae al idioma por defecto y luego a cualquiera disponible", () => {
    // Falta `en` → cae a `es` (DEFAULT_LOCALE).
    expect(localizedText({ es: "hola" }, "en")).toBe("hola");
    // Falta `es` (default) pero hay `en` → usa el disponible no vacío.
    expect(localizedText({ en: "hi" }, "es")).toBe("hi");
    // Solo entradas vacías → undefined.
    expect(localizedText({ es: "  ", en: "" }, "es")).toBeUndefined();
  });

  it("siempre devuelve un string definido para cada locale soportado cuando hay copy", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Locale>(...LOCALES),
        fc.string({ minLength: 1 }).filter((s) => s.trim() !== ""),
        (lang, text) => {
          // string compartido: resuelve igual en cualquier idioma.
          expect(localizedText(text, lang)).toBe(text);
        },
      ),
    );
  });
});

describe("collaborations: propiedades (fast-check)", () => {
  const localizedArb: fc.Arbitrary<LocalizedText> = fc.oneof(
    fc.string(),
    fc.record({ es: fc.string(), en: fc.string() }, { requiredKeys: [] }),
  );

  const collabArb: fc.Arbitrary<Collaboration> = fc.record({
    name: fc.string({ minLength: 1 }),
    description: fc.option(localizedArb, { nil: undefined }),
    role: fc.option(localizedArb, { nil: undefined }),
    stack: fc.option(fc.array(fc.string()), { nil: undefined }),
    url: fc.option(fc.webUrl(), { nil: undefined }),
    private: fc.option(fc.boolean(), { nil: undefined }),
    published: fc.boolean(),
  });

  it("el resultado solo contiene publicadas y es subconjunto del input (orden preservado)", () => {
    fc.assert(
      fc.property(fc.array(collabArb), (list) => {
        const result = selectPublishedCollaborations(list);
        // Todas publicadas.
        expect(result.every((c) => c.published === true)).toBe(true);
        // Nunca más que el input.
        expect(result.length).toBeLessThanOrEqual(list.length);
        // Coincide exactamente con el filtro de publicadas, en orden.
        expect(result).toEqual(list.filter((c) => c.published === true));
      }),
    );
  });

  it("una lista sin publicadas siempre devuelve vacío", () => {
    fc.assert(
      fc.property(
        fc.array(collabArb.map((c) => ({ ...c, published: false }))),
        (list) => {
          expect(selectPublishedCollaborations(list)).toEqual([]);
        },
      ),
    );
  });
});
