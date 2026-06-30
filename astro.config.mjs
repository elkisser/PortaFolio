// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// ADR 0001: Astro (islas, salida estática). ADR 0002: deploy en Cloudflare Pages.
// `site` se ajustará al dominio definitivo en la tarea de deploy (Req 13 / ADR 0002).
// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Salida estática (Req 1.1). astro:assets queda disponible de fábrica.
  output: 'static',
  site: 'https://elkisser.github.io',
  integrations: [mdx()],

  // Prefetch: precarga las páginas antes de navegar para eliminar la espera al
  // cambiar de vista (la demora que se siente con View Transitions). Con
  // `prefetchAll` todos los enlaces internos se precargan y `defaultStrategy:
  // 'viewport'` cubre mobile (precarga al entrar el enlace en pantalla, donde no
  // hay hover) y desktop. La barra de progreso (`NavProgress`) da feedback para
  // los casos en que el prefetch aún no terminó.
  // Doc: https://v5.docs.astro.build/en/guides/prefetch/
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  // i18n routing real `/es` `/en` (Req 8.1, design.md §5.1).
  // `prefixDefaultLocale: true` hace que AMBOS idiomas lleven prefijo de URL,
  // produciendo rutas reales e indexables `/es` y `/en` (con
  // `prefixDefaultLocale: false` el idioma por defecto viviría en la raíz `/`,
  // no en `/es`). `redirectToDefaultLocale: false` para gestionar la raíz `/`
  // con nuestra propia página de redirección estática en `src/pages/index.astro`.
  // El copy ES/EN y `localizedPath` viven en `src/lib/i18n.ts`.
  // Doc verificada (Astro 5.18): https://v5.docs.astro.build/en/guides/internationalization/
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
});
