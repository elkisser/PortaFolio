/* =============================================================================
   content.config.ts — Content Collections del portfolio (Req 1.2, 1.3, 5.3, 6.1)
   -----------------------------------------------------------------------------
   Astro 5 introdujo la **Content Layer API**. El archivo de configuración de
   colecciones vive ahora en `src/content.config.ts` (NO en `src/content/config.ts`,
   que queda como ubicación legacy) y las colecciones locales se cargan con el
   **glob loader** de `astro/loaders` (`loader: glob({ pattern, base })`), en lugar
   del antiguo `type: 'content'`.

   Verificado contra el paquete instalado (Astro 5.18.2):
   - `astro/loaders` exporta `glob` y `file`.
   - `glob({ pattern, base })`: `pattern` (glob relativo a `base`), `base` (dir
     relativo a la raíz del proyecto).  → node_modules/astro/dist/content/loaders/glob.d.ts
   - Resolución del config: `src/content.config.ts` se busca ANTES que el legacy
     `src/content/config.ts`.  → node_modules/astro/dist/content/utils.js (searchConfig)

   Doc oficial:
   - Content Layer / Content Collections: https://v5.docs.astro.build/en/guides/content-collections/
   - glob() loader:                       https://v5.docs.astro.build/en/guides/content-collections/#the-glob-loader
   - Anuncio Content Layer (Astro 5.0):   https://astro.build/blog/astro-5/

   Modelo i18n (decisión): cada case study existe como UN archivo MDX por idioma,
   nombrado `<slug>.<lang>.mdx` (p. ej. `chromora.es.mdx`, `chromora.en.mdx`),
   plano bajo `src/content/work/`. El frontmatter `lang` (obligatorio, ver
   `schema.ts`) es la fuente de verdad del idioma y se mantiene en sincronía con
   `src/lib/i18n.ts` (`Locale`). La página de detalle (`/work/[slug]`, tarea 11)
   filtra por `data.lang` según la ruta `/es` `/en` activa. Se eligió esta forma
   —en vez de colecciones separadas por idioma— para mantener ambos idiomas de un
   proyecto adyacentes (más fácil de mantener en paridad) y un único esquema.

   El esquema Zod completo de §8 vive en `./content/schema.ts` (fuente única,
   testeable de forma aislada con Vitest + fast-check).
   ============================================================================= */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { workSchema } from "./content/schema";

const work = defineCollection({
  // Content Layer (Astro 5): glob loader sobre los MDX de case studies.
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/work" }),
  schema: workSchema,
});

export const collections = { work };
