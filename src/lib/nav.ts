/* =============================================================================
   nav.ts — Lógica PURA de la isla de navegación (design.md §5.1, §6.2, Req 4.1/4.4)
   -----------------------------------------------------------------------------
   La isla `Nav` (componente `Nav.astro` + comportamiento vanilla con hidratación
   estilo `client:idle`) mantiene su lógica de decisión aquí, separada del DOM,
   para poder testearla de forma aislada con Vitest (sin jsdom) y mantenerla libre
   de globales del navegador.

   Dos responsabilidades puras:
     1. `navEntries(t, lang, includePlayground)` — construye las entradas de
        navegación (design.md §5.1): Work, About, Contact y Playground condicional
        (fase 2; excluido por defecto), cada una con su ruta real localizada.
     2. `pickActiveSection(sections)` — resuelve qué sección está activa para el
        scrollspy a partir de las razones de visibilidad observadas, sin tocar el
        DOM ni el `IntersectionObserver`.

   El switch de idioma NO vive aquí: se computa en build con `switchLocalePath`
   (`lib/i18n.ts`), de modo que degrada a un enlace real sin JS (Req 4.3/4.4).
   ============================================================================= */

import { localizedPath, type UIDictionary, type Locale } from "./i18n";

/** Una entrada de la navegación principal. */
export interface NavEntry {
  /** Id de la sección destino; usado por el scrollspy como `data-target`. */
  id: string;
  /**
   * Destino del enlace: la **ruta real localizada** de la página (p. ej.
   * `/es/work`), no un ancla en página. El sitio migró a páginas reales
   * (`/[lang]/work`, `/about`, `/contact`) que viven en el sitemap (Req 5.1,
   * 8.4); enlazar a ellas es lo que hace que About — con la experiencia — sea
   * alcanzable desde la nav. Degrada sin JS: es un `<a href>` real (Req 4.4).
   */
  href: string;
  /** Etiqueta visible, ya localizada. */
  label: string;
}

/**
 * Construye las entradas de navegación (design.md §5.1).
 *
 * Orden fijo: **Work → About → (Playground) → Contact**. Playground es
 * condicional (fase 2, §5.7): se incluye solo si `includePlayground` es `true`;
 * por defecto se excluye. Se inserta entre About y Contact para que Contact sea
 * siempre el cierre del arco narrativo (design.md §4.6).
 *
 * Cada entrada enlaza a la **ruta real localizada** de su página (`/[lang]/work`,
 * `/about`, `/contact`) vía `localizedPath`, no a un ancla en página: el sitio
 * tiene páginas reales e indexables (Req 5.1, 8.4) y es la única forma de que
 * About (donde vive la experiencia/timeline) sea alcanzable desde la nav.
 *
 * @param t Diccionario de UI del idioma actual (`useTranslations(lang)`).
 * @param lang Idioma actual → prefijo de ruta localizada (`/es`, `/en`).
 * @param includePlayground Incluir la entrada Playground (por defecto `false`).
 */
export function navEntries(
  t: UIDictionary,
  lang: Locale,
  includePlayground = false,
): NavEntry[] {
  const entries: NavEntry[] = [
    { id: "work", href: localizedPath("/work", lang), label: t.nav_work },
    { id: "about", href: localizedPath("/about", lang), label: t.nav_about },
    { id: "contact", href: localizedPath("/contact", lang), label: t.nav_contact },
  ];

  if (includePlayground) {
    // Entre About (índice 1) y Contact (índice 2 → se desplaza al 3).
    entries.splice(2, 0, {
      id: "playground",
      href: localizedPath("/playground", lang),
      label: t.nav_playground,
    });
  }

  return entries;
}

/** Razón de visibilidad de una sección (0–1), como la reporta el observer. */
export interface SectionVisibility {
  id: string;
  /** Proporción visible en el viewport (0 = fuera, 1 = totalmente visible). */
  ratio: number;
}

/**
 * Resuelve la sección activa del scrollspy a partir de las razones de visibilidad
 * observadas (Req 4.1). Devuelve el id de la sección **más visible**; en empate,
 * conserva la primera en orden de documento (estabilidad: evita parpadeo del
 * indicador al desplazar). Devuelve `null` si ninguna sección es visible.
 *
 * Es pura y defensiva: tolera lista vacía (cuando las secciones aún no existen,
 * p. ej. en tareas previas a Hero/Work) devolviendo `null` sin observar nada.
 */
export function pickActiveSection(sections: SectionVisibility[]): string | null {
  let best: SectionVisibility | null = null;

  for (const section of sections) {
    if (section.ratio <= 0) continue;
    // `>` estricto: en empate gana la primera vista (orden de documento).
    if (best === null || section.ratio > best.ratio) {
      best = section;
    }
  }

  return best ? best.id : null;
}
