# ADR 0002 — Plataforma de despliegue

- **Estado:** Propuesto (pendiente de aprobación del usuario)
- **Fecha:** 2026-06-29
- **Decisión asociada:** spec `portfolio-redesign` (ver ADR 0001)

## Contexto

Hoy el sitio vive en GitHub Pages (`elkisser.github.io/PortaFolio/`). El usuario aceptó
migrar y pidió elegir la plataforma que técnicamente tenga más sentido considerando
rendimiento, facilidad de despliegue, soporte para Astro, CDN, caché, previews y
mantenimiento, con justificación.

La salida es **estática** (Astro `output: 'static'`, ver ADR 0001) y los datos de GitHub se
generan en build vía GitHub Actions con token. No hay backend propio (contacto vía `wa.me`).

## Alternativas evaluadas

| Criterio | GitHub Pages | Netlify | Vercel | Cloudflare Pages |
|---|---|---|---|---|
| CDN / red edge | Básico (Fastly) | Global | Global | Global (red muy amplia) |
| Caché / control de headers | Limitado | Bueno | Bueno | Muy bueno |
| Preview deploys por PR | No | Sí | Sí | Sí |
| Soporte Astro | Manual (`base`, action) | Nativo / adapter | Nativo / adapter | Nativo / adapter |
| Free tier (sitio estático) | Generoso pero básico | Generoso | Generoso (riesgo de coste si escala) | Muy generoso, ancho de banda sin límite |
| Optimización de assets | No | Sí | Sí | Sí (Images) |
| DX / facilidad | Media | Alta | Alta | Media-alta |
| Mantenimiento | Bajo pero rígido | Bajo | Bajo | Bajo |

## Decisión

**Cloudflare Pages**, con despliegue desde GitHub (Actions) y previews por PR.

Para un sitio **estático** de contenido, Cloudflare Pages ofrece el mejor equilibrio:
red edge global, ancho de banda sin límite en el free tier, caché y control de headers muy
buenos (útil para `Cache-Control`, CSP e inmutabilidad de assets hasheados), HTTPS
automático y previews por PR. Las fuentes coinciden en que es la mejor opción gratuita para
estáticos y que, a diferencia de Vercel, el coste se mantiene plano ante picos de tráfico.
(Content was rephrased for compliance with licensing restrictions.)

Netlify queda como **segunda opción** muy válida (mejor DX y soporte Astro de primera), y se
recomienda como plan B si la configuración de Cloudflare resulta más áspera de lo aceptable.
Vercel se reserva por si el día de mañana se migrara a Next.js o se necesitara SSR.

## Alternativas rechazadas

- **GitHub Pages:** sin preview deploys, control de caché/headers limitado, sin optimización
  de assets y configuración de Astro más manual (`base`). Suficiente para hoy, insuficiente
  para el estándar de producto buscado. Rechazado.
- **Vercel:** excelente DX, pero su ventaja real es Next.js/SSR (que no usamos) y su modelo
  de coste puede dar sorpresas ante tráfico alto. Rechazado para este caso, reservado a futuro.
- **Netlify:** no rechazado — designado plan B explícito.

## Qué cambiaría la decisión

- Migrar a SSR/Next.js → reconsiderar Vercel.
- Necesitar funciones edge complejas con DX simple → Netlify.

## Consecuencias

- CI en GitHub Actions: build de Astro + `fetch-github.mjs` (con `GH_TOKEN` como secret) →
  publicar artefacto en Cloudflare Pages.
- Configurar headers de caché (assets hasheados inmutables) y CSP en Cloudflare.
- Dominio: definir si se usa un dominio propio o el subdominio `*.pages.dev`.

## Fuentes

- Astro docs — Deploy to Cloudflare Pages: https://docs.astro.build/en/guides/deploy/cloudflare/
- Astro docs — Deploy to Netlify: https://docs.astro.build/en/guides/deploy/netlify/
- Comparativa de hosting (free tier estáticos, ancho de banda Cloudflare): https://www.customjs.space/blog/serverless-static-site-hosting
- Comparativa de coste/escala Vercel vs Cloudflare: https://blog.vibecoder.me/vercel-vs-netlify-vs-cloudflare-pages
