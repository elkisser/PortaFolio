/* =============================================================================
   motion.ts — Lógica PURA del sistema de animaciones / reveals (design.md §9.3,
   §10, Correctness Properties 6 y 7; Req 10.2/10.3/10.4)
   -----------------------------------------------------------------------------
   La isla `Motion` (`components/Motion.astro` + custom element con hidratación
   estilo `client:idle`) orquesta los *reveals* de las secciones al entrar en
   viewport. La FILOSOFÍA del diseño es **CSS-first, JS solo como orquestador /
   fallback** (design.md §10):

     - Si el navegador soporta *scroll-driven animations* (`animation-timeline:
       view()`), el reveal se hace **100% en CSS** y la isla no observa nada.
       Doc/soporte: https://developer.mozilla.org/docs/Web/CSS/animation-timeline/view
       y https://caniuse.com/mdn-css_properties_animation-timeline (~83% global,
       de ahí el fallback).
     - Si no hay soporte CSS pero sí `IntersectionObserver`, la isla orquesta el
       reveal con IO (estado inicial oculto → visible al intersecar, una sola vez).
     - Bajo `prefers-reduced-motion: reduce` **o** sin `IntersectionObserver`,
       TODOS los targets quedan visibles de inmediato y **no se observa nada**
       (contrato global de §10; pseudocódigo de §9.3).

   Toda la DECISIÓN vive aquí, separada del DOM, para poder testearla de forma
   aislada con Vitest + fast-check (sin jsdom) y mantenerla libre de globales del
   navegador. La isla solo lee el entorno (`detectEnv`) y aplica el plan al DOM.

   Invariantes de correctitud (probados en `tests/motion.test.ts`):
     - Property 6 (Req 10.3): `reducedMotion || !hasIntersectionObserver` ⟹
       `plan.visible == todos los targets` y `plan.toObserve == []` (cobertura
       total visible, cero observación).
     - Property 7 (Req 10.4): ningún camino deja un target permanentemente
       invisible: `finalVisible(plan)` (estado tras completar el ciclo de reveal)
       == todos los targets, para CUALQUIER entorno.
     - Cobertura/partición: `visible ∪ toObserve` == todos los targets (sin
       pérdida ni duplicación).
   ============================================================================= */

/** Capacidades del entorno que determinan la estrategia de reveal. */
export interface RevealEnv {
  /** `prefers-reduced-motion: reduce` está activo. */
  reducedMotion: boolean;
  /** El navegador expone `IntersectionObserver`. */
  hasIntersectionObserver: boolean;
  /**
   * El navegador soporta *scroll-driven animations* (`animation-timeline:
   * view()`). Cuando es `true` (y hay movimiento permitido), el reveal lo hace
   * el CSS y la isla no necesita observar.
   */
  hasViewTimeline: boolean;
}

/**
 * Estrategia resuelta para el reveal:
 *  - `immediate`  → mostrar todo de inmediato, sin animación ni observación
 *                   (reduced-motion o sin IntersectionObserver).
 *  - `css-scroll` → el reveal lo hace el CSS (`animation-timeline: view()`);
 *                   la isla no observa nada.
 *  - `observe`    → la isla orquesta el reveal con `IntersectionObserver`.
 */
export type RevealStrategy = "immediate" | "css-scroll" | "observe";

/**
 * Plan de reveal para un conjunto de `targets`. Es una **partición**:
 * `visible` y `toObserve` son disjuntos y su unión cubre todos los `targets`.
 *
 *  - `visible`   → targets que NO requieren observación por JS (ya quedan
 *                  visibles: mostrados de inmediato o revelados por CSS).
 *  - `toObserve` → targets que la isla observará con `IntersectionObserver`
 *                  (estado inicial oculto, revelados al entrar en viewport).
 */
export interface RevealPlan<T> {
  strategy: RevealStrategy;
  visible: T[];
  toObserve: T[];
}

/**
 * Decide el plan de reveal para `targets` dado el entorno `env`. Función PURA:
 * mismo input → mismo output, sin efectos ni acceso a globales.
 *
 * El orden de las guardas reproduce el pseudocódigo de `design.md` §9.3 y el
 * contrato global de §10: la SEGURIDAD (reduced-motion / sin IO) tiene prioridad
 * sobre cualquier mejora (CSS scroll-driven). En la práctica, todo navegador que
 * soporta `animation-timeline: view()` soporta `IntersectionObserver`, de modo
 * que la rama `css-scroll` implica `hasIntersectionObserver === true`.
 */
export function planReveal<T>(
  targets: readonly T[],
  env: RevealEnv,
): RevealPlan<T> {
  // 1) Seguridad primero (Property 6 / Req 10.3): sin movimiento o sin IO,
  //    todo visible de inmediato y NADA observado.
  if (env.reducedMotion || !env.hasIntersectionObserver) {
    return { strategy: "immediate", visible: [...targets], toObserve: [] };
  }

  // 2) Mejora CSS-first: el reveal lo hace el CSS; la isla no observa nada.
  if (env.hasViewTimeline) {
    return { strategy: "css-scroll", visible: [...targets], toObserve: [] };
  }

  // 3) Fallback JS: orquestar el reveal con IntersectionObserver.
  return { strategy: "observe", visible: [], toObserve: [...targets] };
}

/**
 * Estado de visibilidad **final** una vez completado el ciclo de reveal: los
 * targets `visible` ya lo están y todos los `toObserve` terminan revelados al
 * entrar en viewport (cada uno a lo sumo una vez). Modela la garantía de que
 * **ningún target queda permanentemente invisible** (Property 7 / Req 10.4),
 * para cualquier entorno.
 */
export function finalVisible<T>(plan: RevealPlan<T>): T[] {
  return [...plan.visible, ...plan.toObserve];
}

/**
 * Lee las capacidades del entorno del navegador. Defensiva: usa `typeof` para
 * poder importarse en Node (tests) sin lanzar; en ese caso devuelve valores
 * conservadores (sin movimiento reducido, sin IO, sin view timeline) que
 * resuelven a la estrategia segura `immediate`.
 *
 * No es pura (lee globales), por eso la decisión vive en `planReveal`. La isla
 * compone ambas: `planReveal(targets, detectEnv())`.
 */
export function detectEnv(): RevealEnv {
  const reducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hasIntersectionObserver =
    typeof window !== "undefined" && "IntersectionObserver" in window;

  const hasViewTimeline =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timeline: view()");

  return { reducedMotion, hasIntersectionObserver, hasViewTimeline };
}
