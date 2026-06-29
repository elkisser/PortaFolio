/* =============================================================================
   github.ts — Scoring y selección PURA de repositorios (design.md §2.1/§2.2/§9)
   -----------------------------------------------------------------------------
   GitHub se integra como EVIDENCIA CURADA, no como contador (design.md §2.4,
   Req 7.3): de todos los repos públicos se eligen 4–6 destacados mediante un
   algoritmo de scoring. Esa decisión —qué repo vale y en qué orden— es lógica de
   datos que se aísla del fetch (I/O) para poder testearla con Vitest + fast-check
   sin red ni build de Astro (mismo criterio que `lib/work.ts`, `lib/media.ts`).

   Este módulo contiene SOLO funciones PURAS y deterministas:
     - `score(repo, ctx)`  — puntúa un repo (design.md §9.1). Mismo input (repo+ctx)
       → mismo output; no muta `repo` ni hace I/O. El tiempo y la normalización
       entran por `ctx` para que la función sea reproducible.
     - `select(repos, max)` — curaduría (design.md §9.2): filtra fuente+descrita,
       puntúa, ordena desc y corta en `max`, sin duplicados (por `name`).
     - helpers de señal (`norm`, `recency`, `readmeQuality`, …) exportados para
       testearlos de forma aislada.

   El fetch real (perfil, repos, README, lenguajes) vive en el script de build
   `fetch-github.mjs` (tarea aparte): obtiene los `RawRepo`, llama a `select(...)`
   y serializa `GitHubData`. Aquí NO hay `fetch` ni acceso a `process`/`fs`.

   Doc de la API verificada (campos usados):
   - List repositories for a user:
     https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user
   ============================================================================= */

/* -----------------------------------------------------------------------------
   Tipos de datos crudos (forma parcial de la API REST de GitHub)
   -----------------------------------------------------------------------------
   Solo se modelan los campos que consume el scoring. `RawRepo` es estructural: el
   JSON de `GET /users/{user}/repos` lo satisface; los campos derivados opcionales
   (`readme`, `languages`) los agrega el script de build con llamadas extra cuando
   hay token (design.md §2.4) y, si faltan, su señal puntúa 0 (degradación segura).
   --------------------------------------------------------------------------- */

/** Repo crudo de la API de GitHub (subconjunto usado por el scoring). */
export interface RawRepo {
  /** Nombre del repo; clave de unicidad en la selección (design.md §9.2). */
  name: string;
  /** Descripción; `null`/vacía penaliza y excluye de la curaduría. */
  description?: string | null;
  /** URL pública del repo (`html_url`). */
  html_url: string;
  /** Demo/sitio desplegado; su presencia es señal fuerte (producto terminado). */
  homepage?: string | null;
  /** `true` si el repo es un fork de otro (penaliza, no es fuente propia). */
  fork: boolean;
  /** `true` si el repo está archivado (no es fuente activa). */
  archived: boolean;
  /** Estrellas. */
  stargazers_count: number;
  /** Forks recibidos. */
  forks_count: number;
  /** Lenguaje principal declarado por GitHub. */
  language?: string | null;
  /** Topics del repo. */
  topics?: string[];
  /** Último push, ISO 8601; alimenta recencia y abandono. */
  pushed_at: string;
  /** Tamaño del repo en KB (señal de complejidad/volumen). */
  size?: number;
  /** Contenido del README (lo agrega el build con token); calidad editorial. */
  readme?: string;
  /** Bytes por lenguaje (`GET /repos/{o}/{r}/languages`); multi-stack. */
  languages?: Record<string, number>;
}

/**
 * Repo seleccionado para mostrar como evidencia (design.md §7.2 `FeaturedRepo`).
 * Es la proyección pública y estable de un `RawRepo` ya curado: solo lo que la UI
 * necesita, más el `score` para trazabilidad de por qué entró (design.md §2.4).
 */
export interface FeaturedRepo {
  name: string;
  /**
   * Nombre legible para mostrar en la UI (design.md §2.4). Deriva de `name`:
   * un override curado para proyectos conocidos (incl. los que mapean a un case
   * study) y, si no, un prettifier del slug. El enlace sigue usando `url`/`name`.
   */
  displayName: string;
  description: string;
  url: string;
  homepage?: string;
  stars: number;
  forks: number;
  primaryLanguage?: string;
  topics: string[];
  pushedAt: string;
  /** Score con el que fue seleccionado (trazabilidad). */
  score: number;
}

/**
 * Contexto de scoring (design.md §9.1): pesos `w*`, penalizaciones `p*` y los
 * parámetros de normalización (`maxStars`/`maxForks`) y de tiempo (`now`,
 * ventana de recencia). Pasar el contexto explícito hace `score` REPRODUCIBLE:
 * dos llamadas con el mismo `ctx` dan el mismo número (clave para comparar un
 * fork con su equivalente no-fork, design.md Property 3).
 */
export interface ScoringContext {
  /** Peso de estrellas. */
  w1: number;
  /** Peso de forks. */
  w2: number;
  /** Peso de recencia. */
  w3: number;
  /** Peso de tener demo/homepage. */
  w4: number;
  /** Peso de calidad del README. */
  w5: number;
  /** Peso de complejidad técnica. */
  w6: number;
  /** Peso de ser repo fuente (`!fork && !archived`). */
  w7: number;
  /** Penalización por ser fork. */
  p1: number;
  /** Penalización por no tener descripción. */
  p2: number;
  /** Penalización por estar abandonado (> ventana). */
  p3: number;
  /** Estrellas máximas del conjunto para normalizar (>= 0). */
  maxStars: number;
  /** Forks máximos del conjunto para normalizar (>= 0). */
  maxForks: number;
  /** Timestamp de referencia "ahora" en ms (recencia/abandono). */
  now: number;
  /** Ventana en meses: dentro = reciente; fuera = abandonado. */
  recencyWindowMonths: number;
}

/**
 * Pesos y penalizaciones por defecto (design.md §2.1). Prioridades del brief:
 * producto desplegado (`w4`) y estrellas (`w1`) pesan alto; ser fork penaliza
 * fuerte (`p1`) para que nunca supere a una fuente equivalente. Todos los pesos
 * y penalizaciones son `>= 0`; en particular `w7 > 0` y `p1 >= 0`, condición que
 * garantiza que un fork puntúe menos que su equivalente no-fork (§9.1, Property 3).
 */
export const DEFAULT_WEIGHTS = {
  w1: 3, // estrellas
  w2: 1.5, // forks
  w3: 2, // recencia
  w4: 2.5, // demo desplegada
  w5: 1.5, // README
  w6: 1.5, // complejidad
  w7: 1, // es fuente
  p1: 4, // es fork
  p2: 2, // sin descripción
  p3: 2, // abandonado
} as const;

/** Ventana de recencia/abandono por defecto (design.md §2.2: ~12–18 meses). */
export const RECENCY_WINDOW_MONTHS = 18;

/* -----------------------------------------------------------------------------
   Exclusiones de curaduría (feedback de usuario).
   -----------------------------------------------------------------------------
   Hay repos que NUNCA deben aparecer como evidencia destacada, aunque puntúen
   alto: el sistema de gestión privado (no es vitrina pública) y el propio
   portfolio (auto-referencia). Se filtran por nombre en `select` (única fuente
   de verdad de la selección), comparando case-insensitive por robustez.
   --------------------------------------------------------------------------- */
export const EXCLUDED_REPOS: readonly string[] = [
  "Sistema-de-Gestion-AsociacionLitoral",
  "PortaFolio",
];

/** `true` si `name` está en la lista de exclusión (comparación case-insensitive). */
export function isExcluded(
  name: string,
  excluded: readonly string[] = EXCLUDED_REPOS,
): boolean {
  const key = name.trim().toLowerCase();
  return excluded.some((e) => e.trim().toLowerCase() === key);
}

/* -----------------------------------------------------------------------------
   Nombre legible (displayName) — slug git → título humano (feedback de usuario).
   -----------------------------------------------------------------------------
   Los slugs (`the-cookie-box`, `codegenome-x`) se ven pobres en la UI. Se mapea
   cada repo a un nombre presentable: primero un override curado para proyectos
   conocidos (incluyendo los que ya tienen un case study con título canónico, p.
   ej. `chromora` → "Chromora", reusado de `src/content/work`), y si no, un
   prettifier del slug. La función es PURA y testeable.
   --------------------------------------------------------------------------- */

/**
 * Overrides curados slug→título (claves en minúscula). Incluye nombres canónicos
 * tomados de los case studies en `src/content/work` (Chromora) para mantener una
 * sola fuente de verdad del título de cada proyecto.
 */
export const DISPLAY_NAME_OVERRIDES: Readonly<Record<string, string>> = {
  prode: "Prode",
  "codegenome-x": "CodeGenome X",
  "the-cookie-box": "The Cookie Box",
  luminaedit: "LuminaEdit",
  chromora: "Chromora",
};

/** Acrónimos conocidos que el prettifier debe respetar en mayúsculas. */
const KNOWN_ACRONYMS: Readonly<Record<string, string>> = {
  api: "API",
  ui: "UI",
  ux: "UX",
  ai: "AI",
  css: "CSS",
  html: "HTML",
  cli: "CLI",
  sdk: "SDK",
  x: "X",
};

/**
 * Embellece un slug a un título legible (fallback cuando no hay override):
 *  - Reemplaza `-`/`_` por espacios y title-casea cada palabra.
 *  - Respeta acrónimos conocidos (API, UI, X, …).
 *  - Preserva identificadores ya mixed-case sin separadores (p. ej. `LuminaEdit`)
 *    y tokens camelCase dentro de un slug.
 */
export function prettifyRepoName(name: string): string {
  const raw = name.trim();
  if (raw === "") return raw;

  const hasSeparators = /[-_\s]/.test(raw);
  const isMixedCase = /[a-z]/.test(raw) && /[A-Z]/.test(raw);

  // Nombre intencional mixed-case sin separadores: se preserva tal cual.
  if (!hasSeparators && isMixedCase) return raw;

  return raw
    .split(/[-_\s]+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      const lower = word.toLowerCase();
      const acronym = KNOWN_ACRONYMS[lower];
      if (acronym) return acronym;
      // Token ya mixed-case (camelCase): se preserva sin tocar.
      if (/[a-z]/.test(word) && /[A-Z]/.test(word)) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Nombre legible de un repo: override curado si existe (case-insensitive), si no
 * el prettifier del slug. Pura y determinista. Garantiza salida no vacía para
 * cualquier nombre no vacío (cae al nombre recortado si el prettifier no deja
 * nada, p. ej. un slug solo-separadores).
 */
export function displayNameFor(name: string): string {
  const trimmed = name.trim();
  const override = DISPLAY_NAME_OVERRIDES[trimmed.toLowerCase()];
  if (override) return override;
  const pretty = prettifyRepoName(name);
  return pretty !== "" ? pretty : trimmed;
}

/** Milisegundos por mes (promedio gregoriano, 30.44 días) para edades estables. */
const MS_PER_MONTH = 30.44 * 24 * 60 * 60 * 1000;

/* -----------------------------------------------------------------------------
   Helpers de señal — todos puros, finitos y acotados a 0..1 donde corresponde.
   --------------------------------------------------------------------------- */

/** Acota un número al rango [0, 1]; mapea no-finitos a 0 (seguridad numérica). */
function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/** `true` si la cadena es nula o solo espacios (descripción/homepage vacías). */
export function isEmpty(s: string | null | undefined): boolean {
  return s == null || s.trim() === "";
}

/**
 * Normaliza un valor a 0..1 contra un máximo. Si `max <= 0` o `value <= 0`
 * devuelve 0; nunca supera 1. Robusta ante valores negativos o no-finitos.
 */
export function norm(value: number, max: number): number {
  if (!(max > 0) || !(value > 0)) return 0;
  return Math.min(1, value / max);
}

/**
 * Recencia 0..1 que decae linealmente con la antigüedad del último push: 1 si es
 * de hoy (o futuro por desfase de reloj), 0 al borde de la ventana y más allá.
 * Fecha inválida → 0 (sin señal de actividad).
 */
export function recency(pushedAt: string, now: number, windowMonths: number): number {
  const t = Date.parse(pushedAt);
  if (!Number.isFinite(t) || !(windowMonths > 0)) return 0;
  const ageMs = now - t;
  if (ageMs <= 0) return 1; // push reciente o reloj adelantado
  const ageMonths = ageMs / MS_PER_MONTH;
  return clamp01(1 - ageMonths / windowMonths);
}

/**
 * `true` si el repo lleva más de `windowMonths` sin push (abandonado, design.md
 * §2.1 `abandonado(>18 meses)`). Fecha inválida → `true` (sin prueba de vida).
 */
export function abandoned(pushedAt: string, now: number, windowMonths: number): boolean {
  const t = Date.parse(pushedAt);
  if (!Number.isFinite(t)) return true;
  const ageMonths = (now - t) / MS_PER_MONTH;
  return ageMonths > windowMonths;
}

/** Producto terminado y desplegado: tiene `homepage` no vacía (design.md §2.2). */
export function hasDemo(repo: RawRepo): boolean {
  return !isEmpty(repo.homepage);
}

/** Repo fuente propio: ni fork ni archivado (design.md §2.1 `esFuente`). */
export function isSource(repo: RawRepo): boolean {
  return !repo.fork && !repo.archived;
}

/**
 * Calidad editorial del README 0..1 (design.md §2.1: longitud + imágenes +
 * secciones). Si el build no adjuntó el README, la señal es 0 (no se inventa).
 * Combina: longitud (50%), presencia de imágenes (25%) y nº de secciones (25%).
 */
export function readmeQuality(repo: RawRepo): number {
  const readme = repo.readme;
  if (!readme || readme.trim() === "") return 0;
  const lengthScore = clamp01(readme.length / 1500); // ~1500 chars ≈ README completo
  const hasImages = /!\[[^\]]*\]\([^)]*\)|<img\b/i.test(readme) ? 1 : 0;
  const headings = (readme.match(/^#{1,6}\s/gm) ?? []).length;
  const sectionScore = clamp01(headings / 5); // ~5 secciones ≈ historia completa
  return clamp01(0.5 * lengthScore + 0.25 * hasImages + 0.25 * sectionScore);
}

/**
 * Complejidad técnica 0..1 (design.md §2.1: multi-lenguaje / tamaño). Combina el
 * nº de lenguajes (60%) y el volumen del repo en KB en escala log (40%) para que
 * proyectos enormes no saturen la señal. Sin datos de lenguajes, usa el lenguaje
 * principal como mínimo de 1.
 */
export function complexity(repo: RawRepo): number {
  const langCount = repo.languages
    ? Object.keys(repo.languages).length
    : repo.language
      ? 1
      : 0;
  const langScore = clamp01(langCount / 4); // 4+ lenguajes ≈ multi-stack pleno
  const sizeKb = typeof repo.size === "number" && repo.size > 0 ? repo.size : 0;
  const sizeScore = clamp01(Math.log10(sizeKb + 1) / 4); // ~10^4 KB (10 MB) ≈ tope
  return clamp01(0.6 * langScore + 0.4 * sizeScore);
}

/* -----------------------------------------------------------------------------
   Contexto de scoring — derivado del conjunto de repos para normalizar bien.
   --------------------------------------------------------------------------- */

/**
 * Construye un `ScoringContext` a partir del conjunto de repos: `maxStars` y
 * `maxForks` son los máximos observados (normalización relativa al portfolio),
 * con los pesos por defecto y `now`/ventana dados. No muta `repos`.
 *
 * @param repos     Conjunto sobre el que se normaliza (puede estar vacío).
 * @param now       Timestamp de referencia en ms (por defecto, el reloj actual).
 * @param overrides Sobrescrituras parciales de pesos/penalizaciones/ventana.
 */
export function makeScoringContext(
  repos: readonly RawRepo[],
  now: number = Date.now(),
  overrides: Partial<ScoringContext> = {},
): ScoringContext {
  let maxStars = 0;
  let maxForks = 0;
  for (const repo of repos) {
    if (repo.stargazers_count > maxStars) maxStars = repo.stargazers_count;
    if (repo.forks_count > maxForks) maxForks = repo.forks_count;
  }
  return {
    ...DEFAULT_WEIGHTS,
    recencyWindowMonths: RECENCY_WINDOW_MONTHS,
    maxStars,
    maxForks,
    now,
    ...overrides,
  };
}

/**
 * Contexto por defecto para puntuar un repo aislado. Útil para `score(repo)` sin
 * un conjunto de referencia. Nota: usa `Date.now()`, así que para resultados
 * reproducibles (p. ej. comparar dos repos) conviene pasar un `ctx` fijo.
 */
export function defaultScoringContext(overrides: Partial<ScoringContext> = {}): ScoringContext {
  return makeScoringContext([], Date.now(), { maxStars: 50, maxForks: 20, ...overrides });
}

/* -----------------------------------------------------------------------------
   score(repo, ctx) — design.md §9.1
   --------------------------------------------------------------------------- */

/**
 * Puntúa un repositorio (design.md §9.1). Función PURA: no muta `repo` ni hace
 * I/O; el tiempo y la normalización entran por `ctx`.
 *
 * Postcondiciones (design.md §9.1):
 *  - Devuelve un número finito `>= 0` (se aplica `max(0, s)` al final).
 *  - `repo.fork === true` ⟹ score reducido por la penalización `p1` y, además,
 *    pierde el aporte `w7` de "es fuente"; por eso un fork puntúa estrictamente
 *    menos que su equivalente no-fork (con `w7 > 0`, `p1 >= 0`).
 *  - Repos sin descripción o abandonados nunca superan a un equivalente con
 *    descripción / activo (penalizaciones `p2`/`p3` `>= 0`).
 *
 * @param repo Repo crudo a puntuar (no se modifica).
 * @param ctx  Contexto de scoring; por defecto uno aislado (no reproducible).
 */
export function score(repo: RawRepo, ctx: ScoringContext = defaultScoringContext()): number {
  let s = 0;
  s += ctx.w1 * norm(repo.stargazers_count, ctx.maxStars);
  s += ctx.w2 * norm(repo.forks_count, ctx.maxForks);
  s += ctx.w3 * recency(repo.pushed_at, ctx.now, ctx.recencyWindowMonths);
  s += ctx.w4 * (hasDemo(repo) ? 1 : 0);
  s += ctx.w5 * readmeQuality(repo);
  s += ctx.w6 * complexity(repo);
  s += ctx.w7 * (isSource(repo) ? 1 : 0);

  if (repo.fork) s -= ctx.p1;
  if (isEmpty(repo.description)) s -= ctx.p2;
  if (abandoned(repo.pushed_at, ctx.now, ctx.recencyWindowMonths)) s -= ctx.p3;

  // Postcondición: nunca negativo. `s` es suma finita de términos finitos.
  return Math.max(0, s);
}

/* -----------------------------------------------------------------------------
   select(repos, max) — design.md §9.2
   --------------------------------------------------------------------------- */

/** Proyecta un `RawRepo` ya curado a su forma pública `FeaturedRepo`. */
export function toFeaturedRepo(repo: RawRepo, repoScore: number): FeaturedRepo {
  const featured: FeaturedRepo = {
    name: repo.name,
    displayName: displayNameFor(repo.name),
    description: (repo.description ?? "").trim(),
    url: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    topics: repo.topics ?? [],
    pushedAt: repo.pushed_at,
    score: repoScore,
  };
  if (!isEmpty(repo.homepage)) featured.homepage = repo.homepage as string;
  if (!isEmpty(repo.language)) featured.primaryLanguage = repo.language as string;
  return featured;
}

/**
 * Curaduría de repos destacados (design.md §9.2, Req 7.3). Función PURA: no muta
 * `repos`.
 *
 * Pasos: filtra a fuentes con descripción (`isSource && !isEmpty(description)`),
 * deduplica por `name` (conserva la instancia de mayor score), puntúa con un
 * contexto derivado del conjunto, ordena por score descendente (desempate estable
 * por `name`) y toma a lo sumo `max`.
 *
 * Postcondiciones (design.md §9.2):
 *  - Devuelve a lo sumo `max` repos, ordenados por score descendente.
 *  - Todos cumplen el filtro de curaduría (ni forks, ni archivados, con descripción).
 *  - Si menos de `max` cumplen, devuelve solo esos (nunca rellena con basura).
 *  - Sin duplicados por `name`.
 *
 * @param repos Repos crudos (puede estar vacío).
 * @param max   Tamaño máximo de la selección (`>= 1`); `<= 0` ⟹ `[]`.
 * @param ctx   Contexto opcional; por defecto se deriva de `repos` (recomendado).
 */
export function select(
  repos: readonly RawRepo[],
  max: number,
  ctx: ScoringContext = makeScoringContext(repos),
): FeaturedRepo[] {
  // Precondición defensiva: un máximo no positivo selecciona nada.
  if (!(max >= 1)) return [];

  // 1. Curaduría: solo fuentes propias con descripción, excluyendo la lista
  //    vetada por el usuario (design.md §9.2 + feedback).
  const candidates = repos.filter(
    (r) => isSource(r) && !isEmpty(r.description) && !isExcluded(r.name),
  );

  // 2. Dedup por `name`, conservando la instancia de mayor score (sin duplicados).
  const bestByName = new Map<string, { repo: RawRepo; s: number }>();
  for (const repo of candidates) {
    const s = score(repo, ctx);
    const current = bestByName.get(repo.name);
    if (!current || s > current.s) bestByName.set(repo.name, { repo, s });
  }

  // 3. Orden por score desc; desempate estable por `name` (determinismo).
  const sorted = [...bestByName.values()].sort(
    (a, b) => b.s - a.s || a.repo.name.localeCompare(b.repo.name),
  );

  // 4. Cortar en `max` y proyectar a la forma pública.
  return sorted.slice(0, max).map(({ repo, s }) => toFeaturedRepo(repo, s));
}
