import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  validateContact,
  buildWhatsAppUrl,
  countUrls,
  NAME_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  MAX_URLS,
  WHATSAPP_NUMBER,
  type ContactInput,
} from "../src/lib/contact";

/* -----------------------------------------------------------------------------
   Predicados de referencia (espejo de las reglas de §9.4), usados por las
   propiedades para verificar el biconditional `ok ⟺ reglas` de forma independiente
   de la implementación de `validateContact`.
   --------------------------------------------------------------------------- */

const isValidName = (raw: string): boolean => {
  const n = raw.trim();
  return n.length > 0 && n.length <= NAME_MAX_LENGTH;
};

const isValidMessage = (raw: string): boolean => {
  const m = raw.trim();
  return m.length > 0 && m.length <= MESSAGE_MAX_LENGTH;
};

const passesAntiSpam = (input: ContactInput): boolean =>
  countUrls(input.name.trim()) + countUrls(input.message.trim()) <= MAX_URLS;

const shouldBeValid = (input: ContactInput): boolean =>
  isValidName(input.name) && isValidMessage(input.message) && passesAntiSpam(input);

/* -----------------------------------------------------------------------------
   Generadores
   --------------------------------------------------------------------------- */

// Texto arbitrario (puede contener espacios, vacío, símbolos, URLs por azar).
const anyText = fc.string({ maxLength: 1200 });

// Nombre/mensaje "limpios": no vacíos tras trim, sin URLs, dentro de longitud.
const cleanName = fc
  .string({ minLength: 1, maxLength: NAME_MAX_LENGTH })
  .filter((s) => s.trim().length > 0 && countUrls(s) === 0);

const cleanMessage = fc
  .string({ minLength: 1, maxLength: MESSAGE_MAX_LENGTH })
  .filter((s) => s.trim().length > 0 && countUrls(s) === 0);

const anyInput: fc.Arbitrary<ContactInput> = fc.record({
  name: anyText,
  message: anyText,
});

/* -----------------------------------------------------------------------------
   countUrls — ejemplos
   --------------------------------------------------------------------------- */

describe("contact: countUrls (anti-spam helper)", () => {
  it("cuenta enlaces http(s) y www", () => {
    expect(countUrls("hola")).toBe(0);
    expect(countUrls("mira https://a.com")).toBe(1);
    expect(countUrls("https://a.com y www.b.com")).toBe(2);
    expect(countUrls("HTTPS://A.COM HTTP://B.IO")).toBe(2);
  });

  it("no marca dominios desnudos / nombres de archivo (conservador)", () => {
    expect(countUrls("editá el archivo.ts y main.js")).toBe(0);
  });
});

/* -----------------------------------------------------------------------------
   validateContact — ejemplos (casos representativos y de borde)
   --------------------------------------------------------------------------- */

describe("contact: validateContact (ejemplos)", () => {
  it("acepta un nombre y mensaje válidos", () => {
    const r = validateContact({ name: "Sebastián", message: "Hola, ¿trabajamos?" });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual({});
  });

  it("acepta un único enlace (legítimo: compartir portfolio)", () => {
    const r = validateContact({
      name: "Ana",
      message: "Mi proyecto: https://ana.dev ¿lo vemos?",
    });
    expect(r.ok).toBe(true);
  });

  it("rechaza nombre vacío (required)", () => {
    const r = validateContact({ name: "   ", message: "Hola" });
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBe("required");
  });

  it("rechaza mensaje vacío (required)", () => {
    const r = validateContact({ name: "Ana", message: "" });
    expect(r.ok).toBe(false);
    expect(r.errors.message).toBe("required");
  });

  it("rechaza nombre demasiado largo (too_long)", () => {
    const r = validateContact({ name: "a".repeat(NAME_MAX_LENGTH + 1), message: "Hola" });
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBe("too_long");
  });

  it("rechaza mensaje demasiado largo (too_long)", () => {
    const r = validateContact({
      name: "Ana",
      message: "a".repeat(MESSAGE_MAX_LENGTH + 1),
    });
    expect(r.ok).toBe(false);
    expect(r.errors.message).toBe("too_long");
  });

  it("acepta longitudes exactamente en el máximo (borde inclusivo)", () => {
    const r = validateContact({
      name: "a".repeat(NAME_MAX_LENGTH),
      message: "a".repeat(MESSAGE_MAX_LENGTH),
    });
    expect(r.ok).toBe(true);
  });

  it("rechaza múltiples URLs en el mensaje (spam)", () => {
    const r = validateContact({
      name: "Ana",
      message: "https://a.com https://b.com https://c.com",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.message).toBe("spam");
  });

  it("rechaza una URL en cada campo (suma = spam)", () => {
    const r = validateContact({
      name: "Ana https://a.com",
      message: "escribime www.b.com",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBe("spam");
    expect(r.errors.message).toBe("spam");
  });
});

/* -----------------------------------------------------------------------------
   Property 5 — Validación pura (design.md Correctness Properties)
   Validates: Requirements 12.1
   --------------------------------------------------------------------------- */

describe("contact: Property 5 — validación pura (Req 12.1)", () => {
  // Validates: Requirements 12.1
  it("ok ⟺ (name y message no vacíos ∧ longitudes válidas ∧ pasa anti-spam)", () => {
    fc.assert(
      fc.property(anyInput, (input) => {
        const result = validateContact(input);
        expect(result.ok).toBe(shouldBeValid(input));
      }),
    );
  });

  // Validates: Requirements 12.1 — `ok` y `errors` son coherentes entre sí.
  it("errors está vacío ⟺ ok (sin errores espurios ni faltantes)", () => {
    fc.assert(
      fc.property(anyInput, (input) => {
        const { ok, errors } = validateContact(input);
        expect(Object.keys(errors).length === 0).toBe(ok);
      }),
    );
  });

  // Validates: Requirements 12.1 — pureza: no muta la entrada y es determinista.
  it("es pura: determinista y no muta la entrada", () => {
    fc.assert(
      fc.property(anyInput, (input) => {
        const snapshot = { name: input.name, message: input.message };
        const a = validateContact(input);
        const b = validateContact(input);
        expect(a).toEqual(b);
        // La entrada no se mutó.
        expect(input).toEqual(snapshot);
      }),
    );
  });

  // Validates: Requirements 12.1 — los códigos de error pertenecen al dominio.
  it("solo emite campos y códigos válidos", () => {
    const fields = new Set(["name", "message"]);
    const codes = new Set(["required", "too_long", "spam"]);
    fc.assert(
      fc.property(anyInput, (input) => {
        const { errors } = validateContact(input);
        for (const [field, code] of Object.entries(errors)) {
          expect(fields.has(field)).toBe(true);
          expect(codes.has(code as string)).toBe(true);
        }
      }),
    );
  });

  // Validates: Requirements 12.1 — entradas limpias siempre se aceptan.
  it("acepta SIEMPRE entradas limpias (no vacías, sin URLs, dentro de longitud)", () => {
    fc.assert(
      fc.property(cleanName, cleanMessage, (name, message) => {
        expect(validateContact({ name, message }).ok).toBe(true);
      }),
    );
  });
});

/* -----------------------------------------------------------------------------
   buildWhatsAppUrl — codificación segura (Req 12.3)
   --------------------------------------------------------------------------- */

describe("contact: buildWhatsAppUrl (Req 12.3)", () => {
  it("usa el número configurado y codifica el texto con encodeURIComponent", () => {
    const url = buildWhatsAppUrl({ name: "Ana", message: "Hola & chau" });
    expect(url.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`)).toBe(true);
    // El texto va codificado: ni espacios ni `&` crudos en el query.
    const query = url.split("?text=")[1];
    expect(query).toBe(encodeURIComponent("Hola Sebastián, soy Ana.\n\nHola & chau"));
    expect(query).not.toContain(" ");
  });

  it("acepta un número de destino personalizado", () => {
    const url = buildWhatsAppUrl({ name: "A", message: "B" }, "123456");
    expect(url.startsWith("https://wa.me/123456?text=")).toBe(true);
  });

  // Validates: Requirements 12.3 — el query siempre es texto codificado seguro.
  it("nunca deja espacios sin codificar en el query (property)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 80 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (name, message) => {
          const url = buildWhatsAppUrl({ name, message });
          const query = url.split("?text=")[1] ?? "";
          // encodeURIComponent nunca produce espacios ni saltos de línea crudos.
          expect(/\s/.test(query)).toBe(false);
        },
      ),
    );
  });
});
