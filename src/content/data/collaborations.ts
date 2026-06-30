/* =============================================================================
   collaborations.ts — Colaboraciones CURADAS A MANO (design.md §2.4, Req 7.1/7.4)
   -----------------------------------------------------------------------------
   El fetch automático de build (`src/scripts/fetch-github.mjs`) solo lista repos
   públicos `type=owner` de `elkisser`. Por diseño NO trae repos privados ni
   colaboraciones en repos de terceros: hacerlo exigiría un PAT con scope `repo`
   (lectura de privados) y arriesgaría filtrar información privada al HTML público
   (Req 7.1: solo datos públicos en build; sin token sensible).

   Para reflejar honestamente el trabajo hecho POR INVITACIÓN (apps privadas,
   repos donde participó como colaborador y no como dueño), se usa esta fuente de
   datos pequeña, tipada y curada a mano. No es scoring ni vitrina de "sus" repos:
   es participación declarada explícitamente, sin métricas (anti-vanidad, Req 7.4).
   Encaja con design.md §2.4 ("Contribuciones interesantes / contribuciones a
   terceros"): muestra el CONTEXTO de participación, no estrellas ni contadores.

   i18n: el copy descriptivo (`description`, `role`) es `LocalizedText` — un string
   simple o un mapa por idioma. La UI lo resuelve con `localizedText(value, lang)`
   contra el idioma de la página (con fallback al idioma por defecto), de modo que
   las colaboraciones leen en ES/EN igual que el resto del sitio. Las etiquetas
   ("Colaboraciones", "Rol", "Repositorio privado") viven en el diccionario de UI.

   Privacidad: una entrada `private: true` puede no tener URL pública; en ese caso
   la UI no renderiza un enlace muerto (un repo privado daría 404 al visitante).
   En su lugar muestra una etiqueta discreta "Repositorio privado" (Req 7.1/7.4).

   Publicación: `published` controla si una entrada se muestra. Las entradas
   pendientes de datos reales pueden vivir aquí con `published: false` (no se
   renderizan) hasta completarlas — así nunca se publica un placeholder vacío.
   ============================================================================= */

import { type Locale, DEFAULT_LOCALE, isLocale } from "../../lib/i18n";

/**
 * Texto localizable: o bien un único string (mismo copy en todos los idiomas),
 * o bien un mapa parcial por idioma (`{ es, en }`). Mantener ambos permite copy
 * corto compartido sin obligar a duplicar, y copy específico por idioma cuando
 * importa.
 */
export type LocalizedText = string | Partial<Record<Locale, string>>;

/** Enlace externo etiquetado de una colaboración (p. ej. demo, descargas de app). */
export interface CollaborationLink {
  /** Etiqueta visible (marca/acción): "Google Play", "App Store", "Demo"… */
  label: string;
  /** URL pública del enlace. */
  href: string;
}

/**
 * Colaboración curada a mano: un proyecto en el que Sebas participó pero que NO
 * le pertenece (privado, por invitación, o repo de un tercero). Forma estable y
 * type-safe; todos los campos descriptivos son opcionales para degradar bien.
 */
export interface Collaboration {
  /** Nombre del proyecto a mostrar. */
  name: string;
  /** Descripción breve de qué es y de la participación. Localizable. Opcional. */
  description?: LocalizedText;
  /** Rol/participación (p. ej. "Frontend", "Co-creador"). Localizable. Opcional. */
  role?: LocalizedText;
  /** Tecnologías relevantes. Opcional. */
  stack?: string[];
  /** Enlace externo (sitio/demo) si es público. Ausente ⟹ no se renderiza enlace. */
  url?: string;
  /**
   * Enlaces externos etiquetados adicionales (p. ej. descargas de la app en
   * Google Play / App Store). Se renderizan como una fila de enlaces aparte del
   * `url` principal. Opcional.
   */
  links?: CollaborationLink[];
  /** `true` si el proyecto/repo es privado (no expone URL pública por defecto). */
  private?: boolean;
  /**
   * Compuerta de publicación: solo las `true` se renderizan (ver
   * `selectPublishedCollaborations`). Permite dejar entradas pendientes de datos
   * reales sin que aparezcan en el sitio.
   */
  published: boolean;
}

/**
 * Resuelve un `LocalizedText` al string del idioma pedido. PURA y determinista:
 *  - `undefined`/`null` → `undefined`.
 *  - string → ese string (o `undefined` si queda vacío al recortar).
 *  - mapa → prioriza `lang`, luego `DEFAULT_LOCALE`, luego cualquier idioma con
 *    texto no vacío; `undefined` si no hay ninguno utilizable.
 *
 * Garantiza no devolver nunca cadenas vacías/whitespace (degradación limpia: la
 * UI omite el campo en lugar de renderizar un hueco).
 */
export function localizedText(
  value: LocalizedText | undefined | null,
  lang: Locale,
): string | undefined {
  if (value == null) return undefined;

  if (typeof value === "string") {
    return value.trim() === "" ? undefined : value;
  }

  const ordered: (string | undefined)[] = [
    value[lang],
    value[DEFAULT_LOCALE],
    ...(Object.keys(value) as string[])
      .filter((k): k is Locale => isLocale(k))
      .map((k) => value[k]),
  ];

  for (const candidate of ordered) {
    if (typeof candidate === "string" && candidate.trim() !== "") return candidate;
  }
  return undefined;
}

/**
 * Fuente curada de colaboraciones. Orden = orden de aparición en la UI.
 *
 * NOTA: las entradas con `published: false` NUNCA se renderizan (se filtran en
 * `selectPublishedCollaborations`). Sirven como recordatorio tipado de trabajo
 * pendiente de datos, sin publicar placeholders.
 */
export const COLLABORATIONS: readonly Collaboration[] = [
  {
    // Club del Barril — programa de fidelización PÚBLICO y en producción de
    // Cerveza Santa Fe. Sebas participó en la construcción de la aplicación
    // COMPLETA: API (NestJS), panel de administración (backoffice) y app de
    // socios (publicada en Android e iOS). El backoffice tiene una landing
    // pública de marketing (club-barril-backoffice-dev.netlify.app) con las
    // descargas; los REPOS siguen siendo privados/comerciales, pero el producto
    // es público, así que se enlaza la landing + las tiendas (no hay enlace
    // muerto y por eso no se muestra la etiqueta "Repositorio privado").
    // Stack real verificado en los `package.json` del proyecto.
    name: "Club del Barril",
    description: {
      es: "Programa de fidelización de Cerveza Santa Fe. Participé en la construcción de la aplicación completa: la API backend (NestJS), el panel de administración y la app de socios (publicada en Android e iOS). Sistema de puntos, canjes por QR, promociones, distribuidores y campañas de marketing por email/push.",
      en: "Loyalty program for Cerveza Santa Fe. I took part in building the whole application: the NestJS backend API, the admin dashboard and the members app (published on Android and iOS). Points system, QR-based redemptions, promotions, distributors and email/push marketing campaigns.",
    },
    role: {
      es: "Full Stack — backend, panel de administración y app de socios",
      en: "Full Stack — backend, admin dashboard and members app",
    },
    stack: [
      "NestJS",
      "TypeScript",
      "TypeORM",
      "MySQL",
      "Redis",
      "React",
      "Tailwind CSS",
      "Firebase",
    ],
    url: "https://club-barril-backoffice-dev.netlify.app/",
    links: [
      {
        label: "Google Play",
        href: "https://play.google.com/store/apps/details?id=com.solucionesypunto.clubdelbarril",
      },
      {
        label: "App Store",
        href: "https://apps.apple.com/us/app/club-del-barril/id1553925808",
      },
    ],
    private: true,
    published: true,
  },
];

/**
 * Devuelve solo las colaboraciones publicadas (`published === true`), en orden.
 * Función PURA y determinista: no muta la entrada. Es la única fuente de verdad
 * de qué se renderiza, de modo que un placeholder (`published: false`) nunca
 * llega al HTML y el bloque degrada a vacío si no hay ninguna publicada.
 */
export function selectPublishedCollaborations(
  list: readonly Collaboration[] = COLLABORATIONS,
): Collaboration[] {
  return list.filter((c) => c.published === true);
}
