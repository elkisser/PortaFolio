/* =============================================================================
   contact.ts — Lógica PURA del formulario de contacto (design.md §9.4, §11
   "Error Handling" y §12 seguridad; Correctness Property 5; Req 12.1/12.2/12.3/12.4)
   -----------------------------------------------------------------------------
   La isla `ContactForm` (`components/ContactForm.astro` + custom element con
   hidratación estilo `client:visible`) mantiene TODA su lógica de decisión aquí,
   separada del DOM, para poder testearla de forma aislada con Vitest + fast-check
   (sin jsdom) y mantenerla libre de globales del navegador. Mismo criterio que
   `lib/nav.ts`, `lib/motion.ts`, `lib/i18n.ts`.

   Dos funciones puras:
     1. `validateContact(input)` — valida el formulario (design.md §9.4):
        acepta SOLO cuando `name` y `message` no están vacíos (tras `trim`),
        respetan las longitudes máximas y pasan el chequeo anti-spam básico
        (sin URLs múltiples). No produce efectos (no abre WhatsApp, no muta DOM).
     2. `buildWhatsAppUrl(input, number)` — construye la URL `wa.me` con el texto
        codificado vía `encodeURIComponent` (design.md §12, Req 12.3). También
        pura: dado el mismo input devuelve la misma URL.

   La isla compone ambas: valida → si `ok`, construye la URL y abre WhatsApp con
   feedback; si no, muestra los errores accesibles (aria-describedby + aria-live)
   y NO abre nada (Req 12.2).

   Invariante de correctitud (probado en `tests/contact.test.ts`):
     - Property 5 (Req 12.1): `validateContact` es pura y
       `ok ⟺ (name y message no vacíos ∧ longitudes válidas ∧ pasa anti-spam)`.
   ============================================================================= */

/**
 * Número de WhatsApp de destino (sin `+`, formato `wa.me`). Confirmado en el
 * sitio heredado (`js/main.js` → `WHATSAPP` y los enlaces de `index.html`). Se
 * expone como constante configurable: si cambia, se edita aquí en un solo lugar.
 */
export const WHATSAPP_NUMBER = "543435086453";

/** Longitud máxima del nombre (design.md §9.4: `name.length <= 80`). */
export const NAME_MAX_LENGTH = 80;

/** Longitud máxima del mensaje (design.md §9.4: `message.length <= 1000`). */
export const MESSAGE_MAX_LENGTH = 1000;

/**
 * Máximo de URLs permitidas en la sumatoria de los campos (chequeo anti-spam
 * básico, design.md §9.4: "sin URLs múltiples"). 0 o 1 enlace es legítimo (p. ej.
 * compartir un portfolio); 2 o más se trata como spam.
 */
export const MAX_URLS = 1;

/** Entrada del formulario. Los campos pueden venir vacíos (precondición §9.4). */
export interface ContactInput {
  name: string;
  message: string;
}

/** Campos del formulario que pueden portar un error (clave de `aria-describedby`). */
export type ContactField = "name" | "message";

/**
 * Código de error por campo. Es agnóstico al idioma: la isla lo mapea a un
 * mensaje localizado vía `useTranslations` (paridad ES/EN), de modo que la
 * lógica pura no depende del copy.
 */
export type ContactErrorCode = "required" | "too_long" | "spam";

/**
 * Resultado de la validación. `ok === true` ⟺ no hay errores. `errors` lleva,
 * como mucho, un código por campo, para enlazarlo con `aria-describedby` y
 * anunciarlo con `aria-live` (Req 12.2, 10.5).
 */
export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<ContactField, ContactErrorCode>>;
}

/**
 * Patrón de URL para el chequeo anti-spam: enlaces explícitos `http(s)://…` o
 * `www.…`. Deliberadamente conservador (no marca dominios "desnudos" como
 * `archivo.ts`) para no penalizar texto legítimo; el objetivo es detectar
 * inyección de enlaces múltiples, no clasificar prosa.
 */
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+/gi;

/**
 * Cuenta las URLs explícitas en un texto. Pura: no muta el `RegExp` (usa
 * `String.prototype.match` con flag global, que no depende de `lastIndex`).
 */
export function countUrls(text: string): number {
  const matches = text.match(URL_PATTERN);
  return matches ? matches.length : 0;
}

/**
 * `validateContact(input)` — valida el formulario de contacto (design.md §9.4).
 *
 * Función **PURA**: no produce efectos (no abre WhatsApp, no muta el DOM ni la
 * entrada) y es determinista (mismo input → mismo output).
 *
 * Reglas (todas sobre los valores **tras `trim`**):
 *  - `name` no vacío y `name.length <= NAME_MAX_LENGTH`.
 *  - `message` no vacío y `message.length <= MESSAGE_MAX_LENGTH`.
 *  - Anti-spam básico: la suma de URLs en ambos campos `<= MAX_URLS`.
 *
 * `ok === true` ⟺ se cumplen TODAS las reglas (Correctness Property 5 / Req 12.1).
 * En error, `errors` lleva un código por campo afectado para enlazarlo con
 * `aria-describedby` y anunciarlo con `aria-live` (Req 12.2).
 */
export function validateContact(input: ContactInput): ValidationResult {
  const name = (input?.name ?? "").trim();
  const message = (input?.message ?? "").trim();

  const errors: Partial<Record<ContactField, ContactErrorCode>> = {};

  // --- Nombre: requerido + longitud máxima ---------------------------------
  if (name.length === 0) {
    errors.name = "required";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = "too_long";
  }

  // --- Mensaje: requerido + longitud máxima --------------------------------
  if (message.length === 0) {
    errors.message = "required";
  } else if (message.length > MESSAGE_MAX_LENGTH) {
    errors.message = "too_long";
  }

  // --- Anti-spam: sin URLs múltiples (suma de ambos campos) -----------------
  // Se evalúa sobre la sumatoria para que "1 en nombre + 1 en mensaje" cuente
  // como múltiple. El código se asigna al/los campo(s) que portan los enlaces,
  // sin pisar un error previo (requerido / longitud tienen prioridad de copy).
  const nameUrls = countUrls(name);
  const messageUrls = countUrls(message);
  if (nameUrls + messageUrls > MAX_URLS) {
    if (messageUrls > 0 && errors.message === undefined) {
      errors.message = "spam";
    }
    if (nameUrls > 0 && errors.name === undefined) {
      errors.name = "spam";
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * `buildWhatsAppUrl(input, number)` — construye la URL `wa.me` con el mensaje
 * pre-formateado y **codificado** con `encodeURIComponent` (design.md §12, Req
 * 12.3). Pura: dado el mismo input devuelve la misma URL; no abre WhatsApp (eso
 * es efecto de la isla vía `window.open`).
 *
 * El texto replica el del sitio heredado ("Hola Sebastián, soy <nombre>…") para
 * conservar la voz. Se asume que `input` ya pasó `validateContact`.
 */
export function buildWhatsAppUrl(
  input: ContactInput,
  number: string = WHATSAPP_NUMBER,
): string {
  const name = input.name.trim();
  const message = input.message.trim();
  const text = `Hola Sebastián, soy ${name}.\n\n${message}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
