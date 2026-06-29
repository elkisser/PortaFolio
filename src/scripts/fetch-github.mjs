/* =============================================================================
   fetch-github.mjs — Fetch de GitHub en BUILD (design.md §2.4 / §6.3 / §9, Req 7)
   -----------------------------------------------------------------------------
   GitHub se integra como EVIDENCIA CURADA, no como contador (Req 7.3). Este
   script corre en build/CI (NUNCA en el cliente, Req 7.1):

     1. Pide perfil + repos públicos de `elkisser` a la API REST de GitHub.
     2. Trata la respuesta como DATO NO CONFIABLE (Req 12.5): valida la FORMA en
        el borde, descartando entradas malformadas antes de usarlas.
     3. Reusa la lógica PURA de `src/lib/github.ts` (`select` + `makeScoringContext`,
        tarea 17) para curar 4–6 destacados por scoring.
     4. Serializa un `GitHubData` (design.md §7.1) a `src/content/data/github.json`,
        que las páginas importan en build (sin fetch en cliente).

   Seguridad (Req 7.2): el token SOLO viene de `process.env.GH_TOKEN` (secret de
   CI). Nunca se hardcodea, ni se commitea, ni se envía al cliente. Si no hay
   token, se cae a la API pública no autenticada (rate-limit más bajo) y se
   degrada con gracia.

   Resiliencia (Req 7.5): el script NUNCA rompe el build. Ante fallo de red,
   status ≠ 200, o datos malformados, usa el último `github.json` cacheado válido
   y, si no existe, escribe un `GitHubData` vacío pero válido. Siempre sale 0.

   Doc verificada (API REST de GitHub):
   - List repos for a user: https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user
   - Get a user:            https://docs.github.com/en/rest/users/users#get-a-user
   - Auth (Bearer):         https://docs.github.com/en/rest/authentication
   ============================================================================= */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

import { select, makeScoringContext } from "../lib/github.ts";

/* -----------------------------------------------------------------------------
   Constantes de configuración (design.md §2 / §9).
   --------------------------------------------------------------------------- */

/** Usuario de GitHub del portfolio (design.md §2). */
export const USER = "elkisser";

/** Tope de repos destacados por scoring (design.md §2.4: 4–6 destacados). */
export const MAX_FEATURED = 6;

/** Base de la API REST de GitHub. */
const API = "https://api.github.com";

/** Ruta del dataset generado (design.md §6.3). Resuelta vs. la raíz del repo. */
const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(HERE, "../content/data/github.json");

/**
 * Colores de marca por lenguaje (subconjunto de GitHub Linguist) para la barra
 * de tecnologías. Fallback neutro para lenguajes no mapeados.
 */
const LANGUAGE_COLORS = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Astro: "#ff5d01",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Python: "#3572A5",
  PHP: "#4F5D95",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  Dart: "#00B4AB",
  Kotlin: "#A97BFF",
  SCSS: "#c6538c",
  MDX: "#fcb32c",
};

const DEFAULT_LANGUAGE_COLOR = "#8b8b8b";

/** Color de marca de un lenguaje, con fallback neutro. */
export function languageColor(name) {
  return LANGUAGE_COLORS[name] ?? DEFAULT_LANGUAGE_COLOR;
}

/* -----------------------------------------------------------------------------
   Guards de forma — la respuesta de GitHub es DATO NO CONFIABLE (Req 12.5).
   --------------------------------------------------------------------------- */

/** `true` si `v` es un string no vacío (tras recortar). */
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim() !== "";
}

/** `true` si `v` es un número finito. */
function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/** `true` si `v` es un objeto plano (no nulo, no arreglo). */
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Saneo de un repo crudo de la API a un `RawRepo` válido (design.md §9 tipos).
 * Devuelve `null` si la entrada no tiene la forma mínima esperada — así la
 * selección continúa solo con los repos válidos (Req 7.5).
 *
 * @param {unknown} value Entrada no confiable (item del array de la API).
 * @returns {import("../lib/github.ts").RawRepo | null}
 */
export function sanitizeRepo(value) {
  if (!isObject(value)) return null;

  const name = value.name;
  const htmlUrl = value.html_url;
  const pushedAt = value.pushed_at;

  // Campos obligatorios mínimos para puntuar y enlazar.
  if (!isNonEmptyString(name)) return null;
  if (!isNonEmptyString(htmlUrl)) return null;
  if (!isNonEmptyString(pushedAt) || Number.isNaN(Date.parse(pushedAt))) return null;

  /** @type {import("../lib/github.ts").RawRepo} */
  const repo = {
    name,
    html_url: htmlUrl,
    pushed_at: pushedAt,
    fork: value.fork === true,
    archived: value.archived === true,
    stargazers_count: isFiniteNumber(value.stargazers_count) ? value.stargazers_count : 0,
    forks_count: isFiniteNumber(value.forks_count) ? value.forks_count : 0,
  };

  if (isNonEmptyString(value.description)) repo.description = value.description;
  if (isNonEmptyString(value.homepage)) repo.homepage = value.homepage;
  if (isNonEmptyString(value.language)) repo.language = value.language;
  if (isFiniteNumber(value.size) && value.size >= 0) repo.size = value.size;
  if (Array.isArray(value.topics)) {
    repo.topics = value.topics.filter((t) => isNonEmptyString(t));
  }
  if (isObject(value.languages)) {
    /** @type {Record<string, number>} */
    const langs = {};
    for (const [k, n] of Object.entries(value.languages)) {
      if (isNonEmptyString(k) && isFiniteNumber(n) && n > 0) langs[k] = n;
    }
    if (Object.keys(langs).length > 0) repo.languages = langs;
  }

  return repo;
}

/**
 * Saneo del perfil del usuario. Campos ausentes/malformados → 0 (degradación
 * segura, Req 7.5). No confía en la forma de la respuesta (Req 12.5).
 *
 * @param {unknown} value
 * @returns {{ followers: number; public_repos: number }}
 */
export function sanitizeProfile(value) {
  if (!isObject(value)) return { followers: 0, public_repos: 0 };
  return {
    followers: isFiniteNumber(value.followers) && value.followers >= 0 ? value.followers : 0,
    public_repos:
      isFiniteNumber(value.public_repos) && value.public_repos >= 0 ? value.public_repos : 0,
  };
}

/* -----------------------------------------------------------------------------
   Agregación de lenguajes (design.md §2.4: top ~6, con %).
   --------------------------------------------------------------------------- */

/**
 * Agrega los lenguajes predominantes de un conjunto de repos a `{name, pct, color}`.
 * Usa bytes por lenguaje (`languages`) cuando están disponibles; si no, cuenta el
 * lenguaje principal de cada repo. Devuelve a lo sumo los 6 con mayor peso.
 *
 * @param {readonly import("../lib/github.ts").RawRepo[]} repos
 * @returns {Array<{ name: string; pct: number; color: string }>}
 */
export function aggregateLanguages(repos) {
  /** @type {Map<string, number>} */
  const weights = new Map();

  for (const repo of repos) {
    if (repo.languages && Object.keys(repo.languages).length > 0) {
      for (const [name, bytes] of Object.entries(repo.languages)) {
        weights.set(name, (weights.get(name) ?? 0) + bytes);
      }
    } else if (isNonEmptyString(repo.language)) {
      weights.set(repo.language, (weights.get(repo.language) ?? 0) + 1);
    }
  }

  const total = [...weights.values()].reduce((sum, w) => sum + w, 0);
  if (total <= 0) return [];

  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([name, w]) => ({
      name,
      pct: Math.round((w / total) * 1000) / 10, // 1 decimal
      color: languageColor(name),
    }));
}

/* -----------------------------------------------------------------------------
   buildGitHubData — transformación PURA de (perfil, repos) → GitHubData.
   Aislada de la red para poder testearla sin I/O.
   --------------------------------------------------------------------------- */

/** Dataset vacío pero VÁLIDO (fallback final, Req 7.5). */
export function makeEmptyData(now = Date.now()) {
  return {
    generatedAt: new Date(now).toISOString(),
    stats: { repos: 0, stars: 0, followers: 0 },
    languages: [],
    featured: [],
  };
}

/**
 * Construye el `GitHubData` (design.md §7.1) a partir de respuestas crudas y no
 * confiables. Sanea cada repo (descarta malformados), agrega stats y lenguajes,
 * y cura 4–6 destacados reusando `select` de `src/lib/github.ts`.
 *
 * @param {unknown} rawProfile  Respuesta cruda del endpoint de usuario.
 * @param {unknown} rawRepos    Respuesta cruda del listado de repos.
 * @param {{ now?: number; max?: number }} [opts]
 */
export function buildGitHubData(rawProfile, rawRepos, opts = {}) {
  const now = opts.now ?? Date.now();
  const max = opts.max ?? MAX_FEATURED;

  const profile = sanitizeProfile(rawProfile);

  // Validación de forma en el borde: solo entran los repos bien formados.
  const repoList = Array.isArray(rawRepos) ? rawRepos : [];
  const validRepos = repoList
    .map((r) => sanitizeRepo(r))
    .filter((r) => r !== null);

  const totalStars = validRepos.reduce((sum, r) => sum + r.stargazers_count, 0);

  // Curaduría con la lógica pura (contexto reproducible: `now` fijo).
  const ctx = makeScoringContext(validRepos, now);
  const featured = select(validRepos, max, ctx);

  return {
    generatedAt: new Date(now).toISOString(),
    stats: {
      repos: profile.public_repos > 0 ? profile.public_repos : validRepos.length,
      stars: totalStars,
      followers: profile.followers,
    },
    languages: aggregateLanguages(validRepos),
    featured,
  };
}

/* -----------------------------------------------------------------------------
   Validación del dataset final / del cache (Req 7.5: forma antes de usar).
   --------------------------------------------------------------------------- */

/** `true` si `value` tiene la forma completa de `GitHubData`. */
export function isValidGitHubData(value) {
  if (!isObject(value)) return false;
  if (!isNonEmptyString(value.generatedAt)) return false;

  const stats = value.stats;
  if (!isObject(stats)) return false;
  if (!isFiniteNumber(stats.repos) || !isFiniteNumber(stats.stars) || !isFiniteNumber(stats.followers)) {
    return false;
  }

  if (!Array.isArray(value.languages)) return false;
  for (const lang of value.languages) {
    if (!isObject(lang) || !isNonEmptyString(lang.name) || !isFiniteNumber(lang.pct) || !isNonEmptyString(lang.color)) {
      return false;
    }
  }

  if (!Array.isArray(value.featured)) return false;
  for (const repo of value.featured) {
    if (
      !isObject(repo) ||
      !isNonEmptyString(repo.name) ||
      !isNonEmptyString(repo.displayName) ||
      !isNonEmptyString(repo.url) ||
      !isFiniteNumber(repo.score)
    ) {
      return false;
    }
  }

  return true;
}

/* -----------------------------------------------------------------------------
   Capa de I/O — red, cache y escritura. Todo envuelto para NO romper el build.
   --------------------------------------------------------------------------- */

/**
 * GET JSON de la API de GitHub. Lanza si la respuesta no es 200 (el caller
 * captura). El token (si existe) viaja como `Authorization: Bearer` y JAMÁS se
 * registra ni se persiste (Req 7.2).
 *
 * @param {string} url
 * @param {string | undefined} token
 */
async function fetchJson(url, token) {
  /** @type {Record<string, string>} */
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${USER}-portfolio-build`,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

/**
 * Lista todos los repos públicos del usuario (paginado). Cap defensivo de
 * páginas para acotar el nº de requests.
 *
 * @param {string | undefined} token
 * @returns {Promise<unknown[]>}
 */
async function fetchAllRepos(token) {
  /** @type {unknown[]} */
  const all = [];
  const perPage = 100;
  const maxPages = 10;

  for (let page = 1; page <= maxPages; page++) {
    const url = `${API}/users/${USER}/repos?per_page=${perPage}&page=${page}&sort=pushed&type=owner`;
    const batch = await fetchJson(url, token);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
  }

  return all;
}

/** Lee el último `github.json` cacheado si existe y es válido; si no, `null`. */
async function readValidCache() {
  if (!existsSync(OUTPUT_PATH)) return null;
  try {
    const text = await readFile(OUTPUT_PATH, "utf8");
    const parsed = JSON.parse(text);
    return isValidGitHubData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Escribe el dataset (creando el directorio si hace falta). */
async function writeData(data) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Orquestación de build. Nunca lanza: ante cualquier fallo cae al cache válido o
 * a un dataset vacío válido, y SIEMPRE deja un `github.json` correcto en disco.
 */
export async function main() {
  const token = process.env.GH_TOKEN;
  const now = Date.now();

  if (token) {
    console.log("[fetch-github] Token presente: usando API autenticada (rate-limit alto).");
  } else {
    console.log("[fetch-github] Sin GH_TOKEN: API pública no autenticada (rate-limit bajo).");
  }

  try {
    const [rawProfile, rawRepos] = await Promise.all([
      fetchJson(`${API}/users/${USER}`, token),
      fetchAllRepos(token),
    ]);

    const data = buildGitHubData(rawProfile, rawRepos, { now, max: MAX_FEATURED });

    // Cinturón y tirantes: validar lo que generamos antes de persistir.
    if (!isValidGitHubData(data)) {
      throw new Error("Dataset generado con forma inválida (no debería ocurrir).");
    }

    await writeData(data);
    console.log(
      `[fetch-github] OK: ${data.featured.length} destacados, ` +
        `${data.languages.length} lenguajes, ${data.stats.repos} repos. → ${OUTPUT_PATH}`,
    );
    return data;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[fetch-github] Fetch falló o datos malformados: ${reason}`);

    const cached = await readValidCache();
    if (cached) {
      console.warn("[fetch-github] Usando último github.json cacheado válido (sin datos en vivo).");
      return cached;
    }

    const empty = makeEmptyData(now);
    await writeData(empty);
    console.warn("[fetch-github] Sin cache: escrito dataset vacío válido. El build continúa.");
    return empty;
  }
}

/* -----------------------------------------------------------------------------
   Ejecuta `main()` solo cuando se invoca como script (no al importarlo en tests).
   --------------------------------------------------------------------------- */
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  // El catch interno garantiza salida 0; este es un seguro extra (Req 7.5).
  main().catch((err) => {
    console.warn(`[fetch-github] Error inesperado, build continúa: ${String(err)}`);
  });
}
