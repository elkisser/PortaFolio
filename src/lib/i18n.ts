/* =============================================================================
   i18n.ts — Internacionalización del portfolio (design.md §5.1, §9.5, Req 8.1/8.2)
   -----------------------------------------------------------------------------
   Reemplaza el swap por JS del sitio heredado (`js/i18n.js`) por rutas reales e
   indexables por idioma (`/es`, `/en`) servidas vía `astro:i18n`. Este módulo
   reúne:

     1. La configuración de idiomas soportados (`LOCALES`, `DEFAULT_LOCALE`).
     2. `localizedPath(path, lang)`: helper PURO de localización de rutas, con las
        propiedades de correctitud de `design.md` §9.5 / Property 4:
          - idempotente: localizedPath(localizedPath(p, l), l) === localizedPath(p, l)
          - siempre devuelve una ruta que comienza con '/'
          - siempre lleva el prefijo de idioma correcto
     3. Los diccionarios de UI ES/EN (copy migrado de `js/i18n.js`) y el helper
        `useTranslations(lang)` para consumirlos desde páginas/islas.

   Diseño: funciones PURAS, sin dependencias de globales de Astro (mismo criterio
   que `lib/seo.ts`), de modo que `localizedPath` sea testeable de forma aislada
   con Vitest + fast-check. El routing real lo configura `astro.config.mjs` y las
   páginas viven en `src/pages/{es,en}/`.

   Doc verificada (Astro 5.18): https://v5.docs.astro.build/en/guides/internationalization/
   ============================================================================= */

/** Idiomas soportados por el portfolio. El orden no es significativo. */
export const LOCALES = ["es", "en"] as const;

/** Tipo de un idioma soportado. */
export type Locale = (typeof LOCALES)[number];

/**
 * Idioma por defecto. ES es la audiencia primaria (Argentina); con
 * `prefixDefaultLocale: true` en `astro.config.mjs`, ambos idiomas obtienen
 * prefijo real (`/es`, `/en`) y la raíz redirige al default.
 */
export const DEFAULT_LOCALE: Locale = "es";

/** Type guard: ¿`value` es un idioma soportado? */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Devuelve el "otro" idioma soportado (es ⇄ en). */
export function alternateLocale(lang: Locale): Locale {
  return lang === "en" ? "es" : "en";
}

/**
 * `localizedPath(path, lang)` — antepone el prefijo de idioma a una ruta interna
 * (design.md §9.5). Si la ruta ya empieza por un prefijo de idioma conocido, lo
 * reemplaza (permite cambiar de idioma y garantiza idempotencia).
 *
 * Propiedades de correctitud (verificadas en `tests/i18n.test.ts`):
 *  - **Idempotente:** `localizedPath(localizedPath(p, l), l) === localizedPath(p, l)`.
 *  - **Prefijo '/':** el resultado siempre comienza con '/'.
 *  - **Prefijo de idioma:** el primer segmento del resultado siempre es `lang`.
 *
 * Ejemplos:
 *  - localizedPath('/work', 'es')      → '/es/work'
 *  - localizedPath('/es/work', 'es')   → '/es/work'   (idempotente)
 *  - localizedPath('/es/work', 'en')   → '/en/work'   (cambio de idioma)
 *  - localizedPath('/', 'es')          → '/es'
 *  - localizedPath('', 'en')           → '/en'
 */
export function localizedPath(path: string, lang: Locale): string {
  // Normaliza: separa en segmentos no vacíos (tolera '//', espacios, vacío).
  const segments = (path ?? "")
    .trim()
    .split("/")
    .filter((segment) => segment.length > 0);

  // Si el primer segmento ya es un idioma conocido, lo descartamos: así
  // re-localizar o cambiar de idioma nunca duplica el prefijo (idempotencia).
  if (segments.length > 0 && isLocale(segments[0])) {
    segments.shift();
  }

  const rest = segments.join("/");
  return rest ? `/${lang}/${rest}` : `/${lang}`;
}

/**
 * `switchLocalePath(currentPath, currentLang)` — calcula la ruta equivalente en
 * el "otro" idioma soportado. Es la lógica pura detrás del switch de idioma de la
 * nav (design.md §5.1, Req 4.1): mapea la ruta actual al idioma alterno.
 *
 * Se computa en build (la ruta de cada página es conocida en salida estática),
 * de modo que el switch degrada con elegancia a un enlace real que funciona sin
 * JS (Req 4.3/4.4). Hereda las propiedades de `localizedPath` (idempotente, con
 * prefijo '/'), de modo que el resultado siempre lleva el prefijo del idioma
 * alterno como primer segmento.
 *
 * Ejemplos:
 *  - switchLocalePath('/es/work', 'es') → '/en/work'
 *  - switchLocalePath('/en/about', 'en') → '/es/about'
 *  - switchLocalePath('/es', 'es')      → '/en'
 */
export function switchLocalePath(currentPath: string, currentLang: Locale): string {
  return localizedPath(currentPath, alternateLocale(currentLang));
}

/* -----------------------------------------------------------------------------
   Diccionarios de UI (copy migrado de `js/i18n.js`).
   Se tipan con una clave compartida (`UIKey`) para que ES y EN estén siempre en
   paridad: si falta una traducción, TypeScript falla en compilación.
   --------------------------------------------------------------------------- */

/** Claves de copy de la UI compartidas por todos los idiomas. */
export interface UIDictionary {
  // Navegación (design.md §5.1: Work / About / Contact / Playground condicional).
  nav_work: string;
  nav_about: string;
  nav_contact: string;
  nav_playground: string;

  // Hero (design.md §5.3).
  hero_status: string;
  hero_role: string;
  hero_loc: string;
  hero_declaration: string;
  hero_lead: string;
  hero_cta_work: string;
  hero_cta_cv: string;
  hero_github: string;

  // Work (índice editorial).
  work_title: string;
  work_desc: string;
  filter_all: string;
  link_demo: string;
  link_code: string;

  // Case study (página de detalle `/work/[slug]`, design.md §5.4).
  cs_problem: string;
  cs_role: string;
  cs_decisions: string;
  cs_rationale: string;
  cs_challenges: string;
  cs_result: string;
  cs_stack: string;
  cs_media: string;
  cs_links: string;
  cs_back: string;

  // MediaViewer (carrusel/visor accesible, design.md §6.2, Req 6.x a11y).
  media_region: string;
  media_prev: string;
  media_next: string;
  media_play: string;

  // About.
  about_title: string;
  about_lead: string;
  about_text: string;
  // Enlace del teaser de About en la home → página About completa (design.md §5.1).
  about_more: string;

  // Stack en contexto dentro de About (design.md §5.1/§5.2: Stack deja de ser
  // sección propia y se absorbe en About, "en contexto"). Solo se localizan los
  // títulos de grupo; los nombres de tecnología son neutrales al idioma.
  about_stack_title: string;
  about_stack_lead: string;
  stack_backend: string;
  stack_frontend: string;
  stack_data: string;
  stack_tools: string;

  // Experiencia (timeline depurado, design.md §5.2). Copy migrado del heredado
  // (Req 1.4): se conservan las 3 etapas con su fecha, título y descripción.
  about_exp_title: string;
  exp1_date: string;
  exp1_title: string;
  exp1_desc: string;
  exp2_date: string;
  exp2_title: string;
  exp2_desc: string;
  exp3_date: string;
  exp3_title: string;
  exp3_desc: string;

  // GitHub como evidencia curada (design.md §2.4, Req 7.3/7.4). Sin métricas de
  // vanidad: proyectos destacados + tecnologías predominantes + actividad honesta.
  gh_title: string;
  gh_lead: string;
  gh_featured: string;
  gh_languages: string;
  gh_activity: string;
  gh_last_push: string;
  gh_repo: string;
  gh_profile: string;
  gh_empty: string;
  // Colaboraciones curadas a mano: proyectos en los que participó pero que NO le
  // pertenecen (privados, por invitación). No salen del fetch automático.
  gh_collaborations: string;
  gh_role: string;
  // Etiqueta para colaboraciones en repos privados: en lugar de un enlace muerto
  // (404 al visitante) se muestra esta marca discreta (Req 7.1/7.4).
  gh_private_repo: string;

  // Contact.
  contact_title: string;
  contact_lead: string;
  contact_name: string;
  contact_msg: string;
  contact_send: string;
  contact_err: string;
  // Errores por campo (códigos de `validateContact`) y feedback de estado.
  contact_err_name_required: string;
  contact_err_name_long: string;
  contact_err_msg_required: string;
  contact_err_msg_long: string;
  contact_err_spam: string;
  contact_status_opening: string;
  contact_status_error: string;

  // Footer.
  footer_built: string;
  footer_top: string;

  // Selector de idioma (a11y).
  lang_switch_label: string;

  // Menú móvil (a11y): la etiqueta del botón refleja la acción disponible.
  menu_open: string;
  menu_close: string;
}

const ES: UIDictionary = {
  nav_work: "Proyectos",
  nav_about: "Sobre mí",
  nav_contact: "Contacto",
  nav_playground: "Playground",

  hero_status: "Disponible para proyectos",
  hero_role: "Full Stack Developer",
  hero_loc: "Argentina",
  hero_declaration:
    "Construyo productos web donde el diseño y la ingeniería toman la misma decisión.",
  hero_lead:
    "Soy Sebastián, desarrollador Full Stack y diseñador. Construyo software web rápido, accesible y bien diseñado — del backend en Symfony a interfaces en React.",
  hero_cta_work: "Ver proyectos",
  hero_cta_cv: "Descargar CV",
  hero_github: "GitHub",

  work_title: "Proyectos seleccionados",
  work_desc:
    "Una selección de productos que diseñé y construí. Cada uno con demo y código.",
  filter_all: "Todos",
  link_demo: "Demo",
  link_code: "Código",

  cs_problem: "Contexto y problema",
  cs_role: "Mi rol",
  cs_decisions: "Decisiones técnicas",
  cs_rationale: "Por qué",
  cs_challenges: "Desafíos",
  cs_result: "Resultado e impacto",
  cs_stack: "Stack",
  cs_media: "Medios",
  cs_links: "Enlaces",
  cs_back: "Volver a proyectos",

  media_region: "Medios del proyecto",
  media_prev: "Medio anterior",
  media_next: "Medio siguiente",
  media_play: "Reproducir video",

  about_title: "Sobre mí",
  about_lead:
    "Desarrollador Full Stack y diseñador, de Argentina. Me muevo cómodo entre el backend en Symfony y PHP y el frontend en React, Next.js y Astro.",
  about_text:
    "Vengo del diseño gráfico, así que cuido la estética tanto como la arquitectura del código. Me interesa construir productos completos: que funcionen rápido, sean accesibles y se sientan bien al usarlos. Hoy trabajo en el sector público desarrollando aplicaciones web internas, y en paralelo construyo proyectos propios y para clientes.",
  about_more: "Conocé más sobre mí",

  about_stack_title: "Stack en contexto",
  about_stack_lead:
    "Las tecnologías con las que trabajo a diario, agrupadas por área. No es una lista de logos: es lo que uso para construir y mantener producto.",
  stack_backend: "Backend",
  stack_frontend: "Frontend",
  stack_data: "Datos & Infra",
  stack_tools: "Herramientas & Diseño",

  about_exp_title: "Experiencia",
  exp1_date: "2024 — Actualidad",
  exp1_title: "Ministerio de Infraestructura, Servicios Públicos y Hábitat",
  exp1_desc:
    "Desarrollo de aplicaciones web con Symfony, Twig y bases de datos relacionales. Backend y frontend, formularios complejos, gestión de entidades y lógica de negocio. Interfaces dinámicas, accesibles y responsivas.",
  exp2_date: "2021 — Actualidad",
  exp2_title: "Full Stack Developer — Freelance",
  exp2_desc:
    "Proyectos personales y para clientes: apps web, APIs, dashboards y e-commerce.",
  exp3_date: "2016 — Actualidad",
  exp3_title: "Diseñador Gráfico & Editor",
  exp3_desc:
    "Identidad visual, motion graphics y edición audiovisual para redes sociales.",

  gh_title: "En GitHub",
  gh_lead:
    "Una selección curada de mi trabajo abierto: proyectos destacados, las tecnologías que más uso y actividad reciente. Nada de contadores vacíos.",
  gh_featured: "Repositorios destacados",
  gh_languages: "Tecnologías predominantes",
  gh_activity: "Actividad reciente",
  gh_last_push: "Último cambio",
  gh_repo: "Repositorio",
  gh_profile: "Ver perfil completo en GitHub",
  gh_empty: "Los datos de GitHub no están disponibles por ahora.",
  gh_collaborations: "Colaboraciones",
  gh_role: "Rol",
  gh_private_repo: "Repositorio privado",

  contact_title: "Trabajemos juntos",
  contact_lead:
    "¿Tenés un proyecto o una posición abierta? Escribime y te respondo por WhatsApp.",
  contact_name: "Tu nombre",
  contact_msg: "Tu mensaje",
  contact_send: "Enviar por WhatsApp",
  contact_err: "Completá tu nombre y mensaje.",
  contact_err_name_required: "Ingresá tu nombre.",
  contact_err_name_long: "El nombre es demasiado largo (máx. 80 caracteres).",
  contact_err_msg_required: "Escribí tu mensaje.",
  contact_err_msg_long: "El mensaje es demasiado largo (máx. 1000 caracteres).",
  contact_err_spam: "Quitá los enlaces extra para poder enviarlo.",
  contact_status_opening: "Abriendo WhatsApp…",
  contact_status_error: "Revisá los campos marcados.",

  footer_built: "Diseñado y desarrollado en Argentina",
  footer_top: "Volver arriba ↑",

  lang_switch_label: "Cambiar idioma",

  menu_open: "Abrir menú",
  menu_close: "Cerrar menú",
};

const EN: UIDictionary = {
  nav_work: "Work",
  nav_about: "About",
  nav_contact: "Contact",
  nav_playground: "Playground",

  hero_status: "Available for work",
  hero_role: "Full Stack Developer",
  hero_loc: "Argentina",
  hero_declaration:
    "I build web products where design and engineering make the same decision.",
  hero_lead:
    "I'm Sebastián, a Full Stack developer and designer. I build fast, accessible and well-designed web software — from Symfony backends to React interfaces.",
  hero_cta_work: "View work",
  hero_cta_cv: "Download CV",
  hero_github: "GitHub",

  work_title: "Selected work",
  work_desc:
    "A selection of products I designed and built. Each with a live demo and source.",
  filter_all: "All",
  link_demo: "Demo",
  link_code: "Source",

  cs_problem: "Context & problem",
  cs_role: "My role",
  cs_decisions: "Technical decisions",
  cs_rationale: "Why",
  cs_challenges: "Challenges",
  cs_result: "Result & impact",
  cs_stack: "Stack",
  cs_media: "Media",
  cs_links: "Links",
  cs_back: "Back to work",

  media_region: "Project media",
  media_prev: "Previous media",
  media_next: "Next media",
  media_play: "Play video",

  about_title: "About me",
  about_lead:
    "Full Stack developer and designer, from Argentina. I move comfortably between Symfony/PHP on the backend and React, Next.js and Astro on the frontend.",
  about_text:
    "I come from graphic design, so I care about aesthetics as much as code architecture. I like building complete products: fast, accessible and pleasant to use. Today I work in the public sector building internal web apps, while building my own and client projects in parallel.",
  about_more: "More about me",

  about_stack_title: "Stack in context",
  about_stack_lead:
    "The technologies I work with daily, grouped by area. Not a wall of logos: it's what I use to build and maintain product.",
  stack_backend: "Backend",
  stack_frontend: "Frontend",
  stack_data: "Data & Infra",
  stack_tools: "Tools & Design",

  about_exp_title: "Experience",
  exp1_date: "2024 — Present",
  exp1_title: "Ministry of Infrastructure, Public Services and Habitat",
  exp1_desc:
    "Web application development with Symfony, Twig and relational databases. Backend and frontend, complex forms, entity management and business logic. Dynamic, accessible and responsive interfaces.",
  exp2_date: "2021 — Present",
  exp2_title: "Full Stack Developer — Freelance",
  exp2_desc:
    "Personal and client projects: web apps, APIs, dashboards and e-commerce.",
  exp3_date: "2016 — Present",
  exp3_title: "Graphic Designer & Editor",
  exp3_desc:
    "Visual identity, motion graphics and video editing for social media.",

  gh_title: "On GitHub",
  gh_lead:
    "A curated selection of my open work: featured projects, the technologies I use most and recent activity. No empty counters.",
  gh_featured: "Featured repositories",
  gh_languages: "Predominant technologies",
  gh_activity: "Recent activity",
  gh_last_push: "Last update",
  gh_repo: "Repository",
  gh_profile: "View full profile on GitHub",
  gh_empty: "GitHub data isn't available right now.",
  gh_collaborations: "Collaborations",
  gh_role: "Role",
  gh_private_repo: "Private repository",

  contact_title: "Let's work together",
  contact_lead:
    "Got a project or an open role? Drop me a line and I'll reply on WhatsApp.",
  contact_name: "Your name",
  contact_msg: "Your message",
  contact_send: "Send via WhatsApp",
  contact_err: "Please fill in your name and message.",
  contact_err_name_required: "Please enter your name.",
  contact_err_name_long: "Your name is too long (80 characters max).",
  contact_err_msg_required: "Please write your message.",
  contact_err_msg_long: "Your message is too long (1000 characters max).",
  contact_err_spam: "Please remove the extra links to send it.",
  contact_status_opening: "Opening WhatsApp…",
  contact_status_error: "Please check the highlighted fields.",

  footer_built: "Designed and developed in Argentina",
  footer_top: "Back to top ↑",

  lang_switch_label: "Switch language",

  menu_open: "Open menu",
  menu_close: "Close menu",
};

/** Diccionarios de UI por idioma. */
export const UI: Readonly<Record<Locale, UIDictionary>> = { es: ES, en: EN };

/**
 * Devuelve el diccionario de UI del idioma indicado. Cae al `DEFAULT_LOCALE`
 * si el idioma no está soportado (defensivo en bordes no tipados).
 */
export function useTranslations(lang: string): UIDictionary {
  return isLocale(lang) ? UI[lang] : UI[DEFAULT_LOCALE];
}
