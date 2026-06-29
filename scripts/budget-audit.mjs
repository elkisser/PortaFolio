/* =============================================================================
   budget-audit.mjs — Auditoría de presupuesto de bundle (Req 9.2 / 13.3)
   -----------------------------------------------------------------------------
   El pipeline de CI (design.md §5.9 / §11) debe ejecutar una "auditoría de
   presupuesto (CWV/bundle) antes de publicar" (Req 13.3). Este script aporta la
   variante de **bundle-size**: tras `astro build`, mide el JavaScript de cliente
   emitido a `dist/` y falla si supera el presupuesto.

   Presupuesto (Req 9.2): el JS inicial transferido de la home debe ser ≤ ~30 KB.
   Como proxy estable y determinista en CI, medimos el **tamaño gzip total** de
   los chunks JS de cliente (todos los `.js` bajo `dist/`), que para una
   arquitectura de islas (cero runtime de framework) se mantiene muy por debajo
   del objetivo. El umbral es configurable con `JS_BUDGET_KB` para no romper el
   build ante crecimiento legítimo, manteniendo a la vez una red de seguridad
   contra regresiones.

   Salida: tabla por archivo (raw + gzip) y total; exit code 1 si se excede.
   No depende de red ni de un navegador → rápido y reproducible en Actions.
   ============================================================================= */

import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(HERE, "../dist");

/** Presupuesto por defecto del JS de cliente (gzip), en KB. Req 9.2: home ≤ ~30 KB. */
const DEFAULT_BUDGET_KB = 35;

/* -----------------------------------------------------------------------------
   Lógica PURA (testeable sin I/O): evaluar tamaños contra el presupuesto.
   --------------------------------------------------------------------------- */

/**
 * @typedef {Object} FileSize
 * @property {string} path  Ruta relativa del archivo.
 * @property {number} raw   Bytes sin comprimir.
 * @property {number} gzip  Bytes tras gzip.
 */

/**
 * @typedef {Object} BudgetResult
 * @property {number} totalRaw    Suma de bytes sin comprimir.
 * @property {number} totalGzip   Suma de bytes gzip (la métrica que se compara).
 * @property {number} budgetBytes Presupuesto efectivo en bytes.
 * @property {boolean} withinBudget `true` si `totalGzip <= budgetBytes`.
 */

/**
 * Evalúa una lista de tamaños de archivo contra un presupuesto gzip.
 * Función pura: sin efectos, determinista para los mismos argumentos.
 *
 * @param {readonly FileSize[]} files
 * @param {number} budgetBytes Presupuesto en bytes (debe ser ≥ 0).
 * @returns {BudgetResult}
 */
export function evaluateBudget(files, budgetBytes) {
  const totalRaw = files.reduce((sum, f) => sum + f.raw, 0);
  const totalGzip = files.reduce((sum, f) => sum + f.gzip, 0);
  return {
    totalRaw,
    totalGzip,
    budgetBytes,
    withinBudget: totalGzip <= budgetBytes,
  };
}

/** Formatea bytes a una cadena legible en KB con 1 decimal. */
export function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* -----------------------------------------------------------------------------
   Capa de I/O — recolección de archivos y reporte.
   --------------------------------------------------------------------------- */

/**
 * Recolecta recursivamente todos los `.js` bajo `dir`, midiendo raw y gzip.
 *
 * @param {string} dir
 * @returns {Promise<FileSize[]>}
 */
async function collectJsFiles(dir) {
  /** @type {FileSize[]} */
  const out = [];

  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        const buf = await readFile(full);
        out.push({
          path: relative(DIST_DIR, full).replace(/\\/g, "/"),
          raw: buf.byteLength,
          gzip: gzipSync(buf).byteLength,
        });
      }
    }
  }

  await walk(dir);
  return out.sort((a, b) => b.gzip - a.gzip);
}

/** Resuelve el presupuesto efectivo en bytes desde `JS_BUDGET_KB` o el default. */
export function resolveBudgetBytes(env = process.env) {
  const raw = env.JS_BUDGET_KB;
  const kb = raw !== undefined && Number.isFinite(Number(raw)) && Number(raw) > 0
    ? Number(raw)
    : DEFAULT_BUDGET_KB;
  return Math.round(kb * 1024);
}

/** Orquestación: mide `dist/`, imprime el reporte y devuelve el exit code. */
export async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error(`[budget] No existe ${DIST_DIR}. Ejecutá \`npm run build\` antes de la auditoría.`);
    return 1;
  }

  const distStat = await stat(DIST_DIR);
  if (!distStat.isDirectory()) {
    console.error(`[budget] ${DIST_DIR} no es un directorio.`);
    return 1;
  }

  const files = await collectJsFiles(DIST_DIR);
  const budgetBytes = resolveBudgetBytes();
  const result = evaluateBudget(files, budgetBytes);

  console.log("\n[budget] Auditoría de bundle — JS de cliente (Req 9.2 / 13.3)");
  console.log("─".repeat(72));
  if (files.length === 0) {
    console.log("  (sin archivos .js de cliente — 0 KB)");
  } else {
    for (const f of files) {
      console.log(`  ${formatKB(f.gzip).padStart(10)} gzip  (${formatKB(f.raw).padStart(10)} raw)  ${f.path}`);
    }
  }
  console.log("─".repeat(72));
  console.log(
    `  Total: ${formatKB(result.totalGzip)} gzip  (${formatKB(result.totalRaw)} raw)  ` +
      `· Presupuesto: ${formatKB(result.budgetBytes)} gzip`,
  );

  if (!result.withinBudget) {
    console.error(
      `\n[budget] ❌ FALLA: el JS de cliente (${formatKB(result.totalGzip)} gzip) supera el ` +
        `presupuesto de ${formatKB(result.budgetBytes)}. Reducí JS o ajustá JS_BUDGET_KB con criterio.`,
    );
    return 1;
  }

  console.log(`\n[budget] ✅ OK: dentro del presupuesto de ${formatKB(result.budgetBytes)} gzip.`);
  return 0;
}

/* Ejecuta solo cuando se invoca como script (no al importarlo en tests). */
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`[budget] Error inesperado: ${String(err)}`);
      process.exit(1);
    });
}
