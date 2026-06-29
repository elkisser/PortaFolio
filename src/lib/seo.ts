/* =============================================================================
   seo.ts — Helpers tipados de SEO (design.md §6.3 `lib/seo.ts`, §11, Req 8.3)
   -----------------------------------------------------------------------------
   Construye title/description, URLs canónicas/absolutas, etiquetas Open Graph /
   Twitter y el JSON-LD de `Person`. Consumido por `BaseLayout.astro`.

   Diseño: funciones PURAS, sin dependencias de globales de Astro. El layout pasa
   `Astro.site` y `Astro.url.pathname` explícitamente; así los helpers son
   testeables de forma aislada y reutilizables por páginas/idioma (Req 8.3).

   Preservación (design.md §15 "Preservar"): los datos de `Person`, el título,
   la descripción y el `theme-color` se migran tal cual desde el `index.html`
   heredado, no se reinventan.
   ============================================================================= */

/** Nombre del sitio (usado como sufijo de título y `og:site_name`). */
export const SITE_NAME = "Sebastián Kisser";

/** Título por defecto (home), preservado del `index.html` heredado. */
export const DEFAULT_TITLE = "Sebastián Kisser — Full Stack Developer & Diseñador";

/** Descripción por defecto, preservada del `index.html` heredado. */
export const DEFAULT_DESCRIPTION =
  "Sebastián Kisser, desarrollador Full Stack y diseñador de Argentina. " +
  "Construyo productos web rápidos, accesibles y con diseño cuidado: apps con " +
  "IA, e-commerce, dashboards y experiencias interactivas.";

/** Color de tema, preservado del `index.html` heredado (= --ink-900). */
export const THEME_COLOR = "#0a0a0b";

/** Ruta relativa de la imagen social por defecto (resuelta contra `site`). */
export const DEFAULT_OG_IMAGE_PATH = "/img/foto-perfil.png";

/** Tipos de Open Graph que el portfolio usa. */
export type OgType = "website" | "article" | "profile";

/** Tipos de Twitter card que el portfolio usa. */
export type TwitterCard = "summary" | "summary_large_image";

/**
 * Perfil de `Person` para el JSON-LD. Los campos identitarios son estáticos;
 * `url`/`image` se resuelven contra el `site` en tiempo de render.
 */
export interface PersonProfile {
  name: string;
  jobTitle: string;
  nationality: string;
  sameAs: string[];
  knowsAbout: string[];
  /** Ruta relativa de la imagen de perfil (se resuelve contra `site`). */
  imagePath: string;
}

/** Datos de `Person` preservados del JSON-LD del `index.html` heredado. */
export const PERSON: PersonProfile = {
  name: "Sebastián Kisser",
  jobTitle: "Full Stack Developer",
  nationality: "Argentina",
  sameAs: ["https://github.com/elkisser"],
  knowsAbout: [
    "Symfony",
    "PHP",
    "React",
    "Next.js",
    "Astro",
    "TypeScript",
    "UX/UI Design",
  ],
  imagePath: DEFAULT_OG_IMAGE_PATH,
};

/**
 * Mapeo idioma → locale de Open Graph (preservado del heredado: es_AR / en_US).
 * Cae al propio código de idioma si no hay mapeo conocido.
 */
export const OG_LOCALE_MAP: Readonly<Record<string, string>> = {
  es: "es_AR",
  en: "en_US",
};

/** Devuelve el `og:locale` para un idioma (p. ej. "es" → "es_AR"). */
export function ogLocale(lang: string): string {
  return OG_LOCALE_MAP[lang] ?? lang;
}

/**
 * Construye el `<title>`: `"<página> — <sitio>"`. Si no hay título de página
 * (o es el propio nombre del sitio) devuelve el título por defecto / el nombre,
 * evitando duplicar el sufijo.
 */
export function buildTitle(pageTitle?: string, siteName: string = SITE_NAME): string {
  const trimmed = pageTitle?.trim();
  if (!trimmed) return DEFAULT_TITLE;
  if (trimmed === siteName || trimmed === DEFAULT_TITLE) return trimmed;
  return `${trimmed} — ${siteName}`;
}

/** Normaliza una ruta para que siempre comience con `/`. */
function ensureLeadingSlash(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Resuelve una ruta absoluta contra el `site` configurado en `astro.config`.
 * Si `site` no está definido (p. ej. en ciertos contextos de dev) devuelve la
 * ruta normalizada con `/` inicial, sin romperse.
 */
export function absoluteUrl(path: string, site: string | URL | undefined): string {
  const normalized = ensureLeadingSlash(path);
  if (!site) return normalized;
  return new URL(normalized, site).href;
}

/**
 * URL canónica de la página actual: `site` + `pathname`. Sin `site`, devuelve el
 * `pathname` normalizado. Pensada para `<link rel="canonical">` (Req 8.3).
 */
export function canonicalURL(pathname: string, site: string | URL | undefined): string {
  return absoluteUrl(pathname, site);
}

/** Metadatos resueltos que alimentan las etiquetas del `<head>`. */
export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  /** URL absoluta de la imagen social. */
  image: string;
  ogType: OgType;
  siteName: string;
  /** `og:locale` (p. ej. "es_AR"). */
  locale: string;
  /** `og:locale:alternate` (p. ej. ["en_US"]). */
  localeAlternate: string[];
  twitterCard: TwitterCard;
}

/** Etiqueta `<meta property=... content=...>` (Open Graph). */
export interface OgTag {
  property: string;
  content: string;
}

/** Etiqueta `<meta name=... content=...>` (Twitter). */
export interface NamedTag {
  name: string;
  content: string;
}

/** Construye las etiquetas Open Graph a partir de los metadatos resueltos. */
export function openGraphTags(seo: ResolvedSeo): OgTag[] {
  const tags: OgTag[] = [
    { property: "og:type", content: seo.ogType },
    { property: "og:site_name", content: seo.siteName },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:url", content: seo.canonical },
    { property: "og:image", content: seo.image },
    { property: "og:locale", content: seo.locale },
  ];
  for (const alt of seo.localeAlternate) {
    tags.push({ property: "og:locale:alternate", content: alt });
  }
  return tags;
}

/** Construye las etiquetas de Twitter a partir de los metadatos resueltos. */
export function twitterTags(seo: ResolvedSeo): NamedTag[] {
  return [
    { name: "twitter:card", content: seo.twitterCard },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
    { name: "twitter:image", content: seo.image },
  ];
}

/** Forma serializable del JSON-LD `Person` (schema.org). */
export interface PersonJsonLd {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  jobTitle: string;
  nationality: string;
  url: string;
  image: string;
  sameAs: string[];
  knowsAbout: string[];
}

/**
 * Construye el objeto JSON-LD `Person` (Req 8.3). `url`/`image` se resuelven
 * contra `site`. Devuelve el objeto tipado; usar `personJsonLdString` para el
 * `<script type="application/ld+json">`.
 */
export function buildPersonJsonLd(
  site: string | URL | undefined,
  person: PersonProfile = PERSON,
): PersonJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.jobTitle,
    nationality: person.nationality,
    url: canonicalURL("/", site),
    image: absoluteUrl(person.imagePath, site),
    sameAs: person.sameAs,
    knowsAbout: person.knowsAbout,
  };
}

/** Serializa el JSON-LD `Person` para inyectarlo en un `<script>`. */
export function personJsonLdString(
  site: string | URL | undefined,
  person: PersonProfile = PERSON,
): string {
  return JSON.stringify(buildPersonJsonLd(site, person));
}
