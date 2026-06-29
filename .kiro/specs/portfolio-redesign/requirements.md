# Requirements Document

## Introduction

Transformación completa del portfolio de Sebastián Kisser (`elkisser`), de sitio estático
vanilla a un producto digital editorial premium construido con **Astro 7 (islas, salida
estática)** y desplegado en **Cloudflare Pages**. El objetivo es una experiencia con identidad
propia, performance casi perfecta, accesibilidad AA, i18n indexable y los proyectos convertidos
en case studies reales, con GitHub integrado como evidencia curada.

Estos requerimientos se **derivan del documento de diseño** (`design.md`) y de las decisiones
acordadas con el usuario. El primer entregable es un **slice vertical** (ver Requerimiento 11)
que valida la dirección antes de portar el resto del sitio.

Las decisiones de framework y deploy están justificadas en
[ADR 0001](../../../docs/decisions/0001-framework-choice.md) y
[ADR 0002](../../../docs/decisions/0002-deploy-platform.md).

## Glossary
- **Slice 1:** primer entregable end-to-end (identidad + hero + nav + design system + 1 case study).
- **Isla:** componente con JS hidratado selectivamente (Astro).
- **Case study:** proyecto presentado como caso (problema → decisiones → resultado).
- **Build-time GitHub:** datos de GitHub obtenidos en CI, no en el cliente.

---

## Requirements

### Requirement 1: Fundación Astro y arquitectura de contenido

**User Story:** Como desarrollador que mantiene el portfolio, quiero una base Astro con contenido
tipado, para agregar o editar case studies sin tocar markup ni duplicar traducciones a mano.

#### Acceptance Criteria
1. WHEN se ejecuta `astro build` THEN el sistema SHALL producir salida estática (`output: 'static'`) sin errores.
2. THE proyecto SHALL definir el contenido de case studies como Content Collection tipada con Zod, según el esquema de `design.md` §8.
3. IF un case study no cumple el esquema (p. ej. falta `alt`, `width`/`height`, o `decisions` vacío) THEN el build SHALL fallar con un mensaje de error claro.
4. THE proyecto SHALL conservar los tokens de diseño, familias tipográficas y copy ES/EN existentes, migrados a la nueva arquitectura.
5. THE proyecto SHALL eliminar el código/contenido muerto identificado (marquee, stat-cards, sección Stack independiente, typing del rol, glow del hero, README desactualizado) solo tras confirmar que no rompe funcionalidad preservada.

### Requirement 2: Sistema de identidad visual / design system

**User Story:** Como visitante, quiero que el portfolio tenga una estética reconocible y propia,
para que una sola captura se distinga de un template genérico.

#### Acceptance Criteria
1. THE sistema SHALL implementar tokens de color, escala tipográfica modular (valores de `design.md` §4.5), escala de espaciado 8pt y rejilla de 12 columnas como CSS reutilizable.
2. THE sistema SHALL usar un set de iconografía propio mínimo (no una librería genérica) para los iconos de UI.
3. THE sistema SHALL aplicar los motivos de firma (índices de sección, notas al margen mono, hairlines de 1px, composición asimétrica, acento ámbar único).
4. THE sistema SHALL NOT usar glassmorphism decorativo, gradientes genéricos, blobs, fondos de partículas ni efectos sin justificación de diseño.
5. WHEN se compara una captura del Hero, del índice de Work y de un case study THEN SHALL ser reconociblemente del mismo sistema visual.

### Requirement 3: Hero / opening memorable

**User Story:** Como reclutador, quiero entender de un vistazo quién es Sebas, qué hace, por qué
contratarlo y qué construye, para decidir rápido si avanzo.

#### Acceptance Criteria
1. THE Hero SHALL comunicar identidad (nombre, rol, ubicación, estado de disponibilidad), una declaración con criterio, y prueba inmediata (case studies destacados visibles).
2. THE Hero SHALL NOT depender de un título gigante con un botón y tres tarjetas, ni de glow radial ni de typing effect.
3. THE Hero SHALL ser HTML estático con reveal por máscara como gesto de entrada.
4. IF `prefers-reduced-motion: reduce` está activo THEN el Hero SHALL mostrarse sin animación, con todo el contenido visible.

### Requirement 4: Navegación y experiencia de producto

**User Story:** Como visitante, quiero una navegación clara con un hilo conductor entre pantallas,
para que el sitio se sienta un producto y no una pila de secciones.

#### Acceptance Criteria
1. THE navegación SHALL tener 4 entradas principales (Work, About, Contact, y Playground condicional) con scrollspy y menú móvil.
2. WHEN el usuario navega entre páginas y el navegador soporta View Transitions THEN el sistema SHALL animar la transición con continuidad (elemento compartido thumbnail→hero).
3. IF View Transitions no está soportado THEN la navegación SHALL degradar a un corte simple sin romperse.
4. THE navegación SHALL ser operable completamente por teclado con foco visible.

### Requirement 5: Case studies como contenido profundo

**User Story:** Como visitante técnico, quiero ver cada proyecto como un caso real con decisiones
y resultados, para evaluar la capacidad de Sebas más allá de una captura.

#### Acceptance Criteria
1. THE sistema SHALL exponer un índice editorial en `/work` y una página de detalle por proyecto en `/work/[slug]` con URL propia.
2. THE página de detalle SHALL presentar problema/contexto, rol, decisiones técnicas con su porqué, desafíos, resultado/impacto, stack, medios y enlaces (demo/repo).
3. WHERE un case study declara decisiones técnicas THE esquema SHALL exigir al menos una decisión con su `rationale`.
4. THE índice SHALL permitir filtrar por categoría con una estética integrada (no pills genéricas).

### Requirement 6: Estándar de medios

**User Story:** Como visitante, quiero medios nítidos y bien compuestos en cada proyecto, para que
cada caso se sienta profesional.

#### Acceptance Criteria
1. WHERE un medio se incluye en un case study THE medio SHALL tener `alt` no vacío y `width`/`height` explícitos.
2. IF un video actual no cumple el estándar visual (§2.5) THEN SHALL reemplazarse por capturas/mockups compuestos.
3. WHEN se reusa un video THEN SHALL servirse en formatos modernos con `poster`, `preload="none"` y carga al entrar en viewport.
4. THE presentación de medios SHALL reservar espacio para evitar layout shift (CLS de medios = 0).

### Requirement 7: GitHub como evidencia curada (build-time)

**User Story:** Como visitante, quiero ver evidencia real y curada del trabajo de Sebas en GitHub,
sin métricas de vanidad, para confiar en su actividad y tecnologías.

#### Acceptance Criteria
1. THE sistema SHALL obtener datos de GitHub en build (CI) y NO mediante fetch en el cliente.
2. THE CI SHALL usar un token (`GH_TOKEN`) como secret, nunca expuesto en el cliente ni en el repositorio.
3. THE sistema SHALL seleccionar 4–6 repositorios destacados mediante el algoritmo de scoring de `design.md` §9, mostrando proyectos destacados, tecnologías predominantes, actividad relevante, repos importantes, contribuciones y open source.
4. THE sistema SHALL NOT mostrar métricas de vanidad (contador total de commits descontextualizado, racha de días, followers como métrica de éxito).
5. IF la API de GitHub falla o devuelve datos malformados en build THEN el sistema SHALL usar el último cache válido o un dataset vacío válido, sin romper el build, y validar la forma antes de usarla.

### Requirement 8: Internacionalización y SEO

**User Story:** Como buscador/visitante en otro idioma, quiero versiones indexables en ES y EN,
para encontrar y leer el contenido en mi idioma.

#### Acceptance Criteria
1. THE sistema SHALL servir rutas reales por idioma (`/es`, `/en`) con `lang` correcto por página.
2. THE función de localización de rutas SHALL ser idempotente y devolver siempre rutas que comienzan con `/`.
3. THE sistema SHALL generar metadatos (title, description, Open Graph) y JSON-LD localizados por página/idioma, incluyendo `CreativeWork` por case study.
4. THE sitemap SHALL incluir las URLs por idioma y por proyecto.

### Requirement 9: Performance (Core Web Vitals)

**User Story:** Como visitante, quiero que el sitio se sienta extremadamente rápido, para una
experiencia fluida sin esperas.

#### Acceptance Criteria
1. THE home SHALL alcanzar LCP ≤ 2.0s, INP ≤ 200ms y CLS ≤ 0.05 en perfil mobile/4G.
2. THE JS inicial transferido de la home SHALL ser ≤ ~30 KB.
3. THE islas SHALL hidratarse con la directiva mínima viable (`client:idle`/`client:visible`) según `design.md` §6.2.
4. THE fuentes SHALL ser self-hosted con subset, `font-display: swap` y ajuste métrico para evitar CLS de fuente.
5. THE imágenes SHALL servirse vía `astro:assets` en AVIF/WebP responsive con `loading="lazy"` y dimensiones explícitas.

### Requirement 10: Accesibilidad (WCAG 2.1 AA) y animación

**User Story:** Como usuario con tecnología asistiva o sensibilidad al movimiento, quiero un sitio
accesible y respetuoso, para usarlo sin barreras.

#### Acceptance Criteria
1. THE contenido SHALL cumplir contraste AA (≥ 4.5:1 texto normal, ≥ 3:1 texto grande), verificado con herramienta.
2. WHEN `prefers-reduced-motion: reduce` está activo THEN ninguna animación no esencial SHALL ejecutarse y todo el contenido SHALL permanecer visible y accesible.
3. THE reveal por scroll SHALL dejar todos los elementos visibles cuando no haya `IntersectionObserver` o bajo reduced-motion, sin observar nada.
4. THE sistema SHALL NOT dejar ningún elemento permanentemente invisible o inaccesible por teclado por causa de una animación.
5. THE formulario de contacto SHALL enlazar errores con `aria-describedby` y anunciar feedback con `aria-live`.
6. THE cursor custom SHALL ser opcional, desactivarse en touch/coarse y bajo reduced-motion, y nunca ocultar el foco.

### Requirement 11: Slice vertical 1 (primer entregable)

**User Story:** Como dueño del portfolio, quiero validar primero una experiencia completa de punta
a punta, para confirmar el estándar antes de migrar todo el sitio.

#### Acceptance Criteria
1. THE slice 1 SHALL incluir: dirección artística aplicada, Hero definitivo, navegación, design system, tipografía, identidad visual, responsive por breakpoint, sistema de animaciones, i18n `/es` `/en` y UN case study completo end-to-end.
2. THE slice 1 SHALL alcanzar Lighthouse ≥ 95 en Performance, Accessibility, Best Practices y SEO (mobile).
3. THE slice 1 SHALL verse diseñado en los breakpoints 320, 768, 1024, 1440 y ultra-wide.
4. THE flujo Home→Work→Case study SHALL funcionar end-to-end y estar cubierto por un test E2E en verde.
5. IF el slice 1 no alcanza el quality bar THEN SHALL iterarse antes de portar el resto del portfolio.

### Requirement 12: Contacto y seguridad

**User Story:** Como visitante interesado, quiero contactar a Sebas de forma simple y segura, para
iniciar una conversación.

#### Acceptance Criteria
1. THE validación del formulario SHALL ser pura y aceptar solo cuando nombre y mensaje no están vacíos, respetan longitudes máximas y pasan el chequeo anti-spam básico.
2. WHEN la validación falla THEN el sistema SHALL mostrar el error accesible y NO abrir WhatsApp.
3. WHEN la validación pasa THEN el sistema SHALL construir el texto con `encodeURIComponent` y abrir `wa.me` con feedback de estado.
4. THE enlaces externos SHALL usar `rel="noopener noreferrer"`.
5. THE respuesta de la API de GitHub SHALL tratarse como dato no confiable y validarse en el borde.

### Requirement 13: Deploy e integración continua

**User Story:** Como mantenedor, quiero despliegues automáticos con previews, para publicar con
confianza y bajo mantenimiento.

#### Acceptance Criteria
1. THE proyecto SHALL desplegarse en Cloudflare Pages desde GitHub Actions.
2. WHEN se abre un Pull Request THEN el sistema SHALL generar un preview deploy.
3. THE pipeline SHALL ejecutar: lint, type check, tests (unit + property-based), build y auditoría de presupuesto (CWV/bundle) antes de publicar.
4. THE assets hasheados SHALL servirse con headers de caché inmutable.

### Requirement 14: Playground (condicional, fase 2)

**User Story:** Como visitante curioso, quiero ver exploraciones técnicas de calidad, para apreciar
la curiosidad e innovación de Sebas, sin ver una lista de experimentos sin contexto.

#### Acceptance Criteria
1. WHERE existan al menos 3 piezas que cumplan el gate de calidad de `design.md` §5.7 THE Playground SHALL publicarse.
2. IF no se alcanzan 3 piezas con el nivel requerido THEN el Playground SHALL NO publicarse.
3. WHERE el Playground se publica THE cada pieza SHALL incluir contexto (qué explora, por qué, qué se aprendió) y respetar performance y reduced-motion como el resto del sitio.
