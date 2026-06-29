/* =============================================================================
   media.ts — Lógica PURA del MediaViewer y del estándar de medios (design.md
   §2.5, §6.2, §10; Correctness Property 8; Req 6.1/6.2/6.3/6.4)
   -----------------------------------------------------------------------------
   La isla `MediaViewer` (`components/MediaViewer.astro` + custom element con
   hidratación estilo `client:visible`) presenta los medios de un case study como
   un carrusel/visor accesible (teclado, swipe, lazy, `poster`, `preload="none"`).
   Como en el resto del proyecto (`lib/nav.ts`, `lib/motion.ts`, `lib/work.ts`),
   la DECISIÓN vive aquí —separada del DOM— para poder testearla de forma aislada
   con Vitest + fast-check, sin levantar jsdom ni el build de Astro.

   Dos familias de funciones puras:

     1. Navegación del carrusel (`nextIndex`, `prevIndex`, `clampIndex`,
        `keyToIndex`): aritmética de índices con envoltura (wrap-around) y mapeo
        de teclas (← → Home End) a destino. La isla las compone para mover el
        track y gestionar `aria`/foco; sin DOM aquí.

     2. Reserva de espacio / CLS por contrato (`aspectRatioBox`, `reservedBox`,
        `placeholderBox`, `loadedBox`, `mediaLayoutShift`): modelan que un medio
        con `width`/`height` declarados reserva su caja ANTES de cargar, idéntica
        a la que ocupará una vez cargado ⟹ el layout no se desplaza (CLS = 0).

   --- Property 8: CLS por contrato (design.md Correctness Properties) -----------
   "Todo `MediaAsset` tiene `width`/`height` ⟹ el layout reserva espacio (CLS de
   medios = 0)."  El esquema (`content/schema.ts`) ya OBLIGA `width`/`height`
   enteros positivos (Req 6.4); aquí se modela la consecuencia: la caja reservada
   con esas dimensiones (`placeholderBox`) es igual a la caja ocupada tras la
   carga (`loadedBox`), de modo que `mediaLayoutShift(...) === 0` para CUALQUIER
   medio válido y CUALQUIER ancho de contenedor o viewport. El contraste (un
   medio SIN dimensiones colapsa y luego salta → CLS > 0) se cubre como ejemplo
   en los tests, demostrando el VALOR del contrato.

   Validates: Requirements 6.4
   ============================================================================= */

/* -----------------------------------------------------------------------------
   1) Navegación del carrusel (aritmética pura de índices)
   --------------------------------------------------------------------------- */

/**
 * Acota `index` al rango `[0, length)` con envoltura (wrap-around). Determinista
 * y total: devuelve `0` para una colección vacía (`length <= 0`) y nunca lanza.
 *
 * Usa módulo doble para tolerar índices negativos o mayores que `length`
 * (`((i % n) + n) % n`), de modo que la navegación nunca produzca un índice
 * fuera de rango aunque la entrada sea arbitraria.
 */
export function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || length <= 0) return 0;
  const n = Math.trunc(length);
  const i = Math.trunc(index);
  return ((i % n) + n) % n;
}

/** Índice del medio siguiente, con envoltura al primero tras el último. */
export function nextIndex(current: number, length: number): number {
  return clampIndex(current + 1, length);
}

/** Índice del medio anterior, con envoltura al último antes del primero. */
export function prevIndex(current: number, length: number): number {
  return clampIndex(current - 1, length);
}

/** Teclas de navegación soportadas por el visor (orden lógico, design.md §10). */
export type MediaKey = "ArrowRight" | "ArrowLeft" | "Home" | "End";

/**
 * Mapea una tecla a su índice destino dentro del carrusel (operación por teclado,
 * Req 6.x a11y / design.md §10):
 *  - `ArrowRight` → siguiente (wrap),  `ArrowLeft` → anterior (wrap).
 *  - `Home` → primero (`0`),           `End` → último (`length - 1`).
 *
 * Devuelve `null` para cualquier otra tecla (la isla NO intercepta el evento, así
 * Tab/Escape/etc. siguen su curso) y para colecciones vacías. Pura y total.
 */
export function keyToIndex(
  key: string,
  current: number,
  length: number,
): number | null {
  if (length <= 0) return null;
  switch (key) {
    case "ArrowRight":
      return nextIndex(current, length);
    case "ArrowLeft":
      return prevIndex(current, length);
    case "Home":
      return 0;
    case "End":
      return clampIndex(length - 1, length);
    default:
      return null;
  }
}

/* -----------------------------------------------------------------------------
   2) Reserva de espacio / CLS por contrato (Property 8 — Req 6.4)
   --------------------------------------------------------------------------- */

/** Dimensiones intrínsecas declaradas de un medio (las del esquema §8). */
export interface MediaDims {
  /** Ancho declarado (entero positivo en el esquema). */
  width: number;
  /** Alto declarado (entero positivo en el esquema). */
  height: number;
}

/** Una caja de layout en píxeles CSS (ancho × alto ocupados en la página). */
export interface Box {
  width: number;
  height: number;
}

/**
 * Relación de aspecto (`width / height`) del medio, lista para `aspect-ratio` en
 * CSS. Determinista; exige `height > 0` (garantizado por el esquema). El visor la
 * usa para reservar la caja con `aspect-ratio: <ratio>` y que el alto se derive
 * del ancho del contenedor sin conocer el recurso.
 */
export function aspectRatio(dims: MediaDims): number {
  return dims.width / dims.height;
}

/**
 * Caja reservada por el CONTRATO (atributos `width`/`height` → `aspect-ratio`)
 * para un ancho de contenedor dado. El alto se deriva del ancho manteniendo la
 * relación de aspecto declarada: `height = containerWidth · (h / w)`.
 *
 * Es la caja que el navegador commitea ANTES de descargar el recurso (porque las
 * dimensiones vienen de los atributos, no del archivo), y es exactamente la que
 * el medio ocupará una vez cargado: de ahí el CLS 0 (Req 6.4).
 */
export function reservedBox(dims: MediaDims, containerWidth: number): Box {
  return {
    width: containerWidth,
    height: (containerWidth * dims.height) / dims.width,
  };
}

/**
 * Caja reservada ANTES de cargar el medio:
 *  - CON contrato (`dims` presentes): reserva la caja con relación de aspecto
 *    (`reservedBox`) → el layout queda fijo desde el primer paint.
 *  - SIN contrato (`dims === null`): el elemento colapsa a alto 0 (no hay nada
 *    que reserve espacio), modelando el anti-patrón que el esquema PROHÍBE.
 *
 * Modela ambos caminos para que los tests demuestren que el contrato (y solo el
 * contrato) lleva el CLS a 0.
 */
export function placeholderBox(
  dims: MediaDims | null,
  containerWidth: number,
): Box {
  if (dims === null) return { width: containerWidth, height: 0 };
  return reservedBox(dims, containerWidth);
}

/**
 * Caja ocupada DESPUÉS de cargar el medio: el recurso se muestra con su relación
 * de aspecto intrínseca dentro del ancho del contenedor. Igual a `reservedBox`
 * para las mismas dimensiones (es el invariante que produce CLS 0).
 */
export function loadedBox(intrinsic: MediaDims, containerWidth: number): Box {
  return reservedBox(intrinsic, containerWidth);
}

/** ¿Dos cajas ocupan exactamente el mismo espacio? (tolerante a EPS de coma flotante). */
function boxesEqual(a: Box, b: Box): boolean {
  const EPS = 1e-9;
  return Math.abs(a.width - b.width) < EPS && Math.abs(a.height - b.height) < EPS;
}

/**
 * Puntuación de *layout shift* de un único medio entre su caja ANTES de cargar
 * (`before`) y DESPUÉS de cargar (`after`), dentro de un `viewport`. Modela la
 * definition de CLS (https://web.dev/articles/cls):
 *
 *   layoutShift = impactFraction · distanceFraction
 *
 * donde la distancia es el desplazamiento vertical del contenido (la diferencia
 * de alto de la caja, que empuja lo que está debajo) y el impacto, la fracción de
 * viewport afectada. Si `before` y `after` ocupan la MISMA caja (caso del
 * contrato `width`/`height`), no hay desplazamiento y la función devuelve `0`.
 *
 * Total y defensiva: con un viewport degenerado (área 0) devuelve `0`.
 */
export function mediaLayoutShift(before: Box, after: Box, viewport: Box): number {
  if (boxesEqual(before, after)) return 0;
  if (viewport.width <= 0 || viewport.height <= 0) return 0;

  // El medio cambia de alto: el contenido debajo se desplaza esa diferencia.
  const shiftDistance = Math.abs(after.height - before.height);
  if (shiftDistance === 0) return 0;

  // Fracción de distancia: desplazamiento / mayor dimensión del viewport.
  const distanceFraction = shiftDistance / Math.max(viewport.width, viewport.height);

  // Fracción de impacto: porción del viewport cubierta por la región inestable
  // (la unión de la caja antes y después), acotada a 1.
  const unstableHeight = Math.max(before.height, after.height) + shiftDistance;
  const impactFraction = Math.min(unstableHeight, viewport.height) / viewport.height;

  return impactFraction * distanceFraction;
}
