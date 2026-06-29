# Fuentes self-hosted

Las `@font-face` viven en `src/styles/fonts.css` y apuntan a los `.woff2` de esta
carpeta. Por restricciones de red del entorno de desarrollo, los binarios **no**
se incluyeron: para no emitir warnings de build ni peticiones 404 en runtime,
las `@font-face` self-hosted quedan en un **bloque comentado** dentro de
`src/styles/fonts.css`. Mientras tanto renderizan las familias `* Fallback`
ajustadas métricamente (sin intercambio de fuente → sin CLS).

## Activación (3 pasos)

1. Colocar aquí los `.woff2` con los nombres exactos de la tabla de abajo.
2. **Descomentar** el bloque `@font-face SELF-HOSTED` en `src/styles/fonts.css`.
3. (Opcional) Regenerar los overrides de `* Fallback` con `fontaine`/`capsize`
   para el subset final exacto.

Los stacks `--font-*` en `tokens.css` ya priorizan la familia web sobre su
`* Fallback`, así que al activarse no hay más cambios que hacer.

## Archivos requeridos (subset `latin`, formato `woff2`)

| Familia        | Peso | Archivo                              |
| -------------- | ---- | ------------------------------------ |
| Space Grotesk  | 500  | `space-grotesk-latin-500.woff2`      |
| Space Grotesk  | 700  | `space-grotesk-latin-700.woff2`      |
| Inter          | 400  | `inter-latin-400.woff2`              |
| Inter          | 500  | `inter-latin-500.woff2`              |
| Inter          | 600  | `inter-latin-600.woff2`              |
| JetBrains Mono | 400  | `jetbrains-mono-latin-400.woff2`     |
| JetBrains Mono | 500  | `jetbrains-mono-latin-500.woff2`     |

## Cómo obtenerlos

Opción recomendada — paquetes Fontsource (ya traen subset `latin` + `woff2`):

```bash
npm i -D @fontsource/space-grotesk @fontsource/inter @fontsource/jetbrains-mono
```

Los `.woff2` quedan en `node_modules/@fontsource/<familia>/files/`. Copiar el
subset `latin-<peso>-normal.woff2` a esta carpeta renombrando al nombre de la
tabla. Ejemplo:

```
@fontsource/inter/files/inter-latin-400-normal.woff2  ->  public/fonts/inter-latin-400.woff2
```

Alternativa: descargar desde Google Fonts y subsetear con `glyphhanger`/`subset-font`.

## Ajuste métrico (anti-CLS, Req 9.4)

`fonts.css` ya define una familia `* Fallback` por cada fuente con
`size-adjust` + `ascent/descent/line-gap-override` calculados a partir de las
métricas de `@capsizecss/metrics` (fórmula de fontaine, documentada en el
encabezado de `fonts.css`). Tras añadir los binarios, conviene regenerar esos
overrides con `fontaine`/`capsize` para el subset final exacto.

## Verificación

1. Colocar los `.woff2`.
2. Importar `src/styles/fonts.css` globalmente (lo hará el `BaseLayout`, tarea 4).
3. `npm run build` y comprobar en DevTools que las fuentes cargan desde
   `/fonts/*.woff2` y que no hay layout shift al intercambiar fallback → web font.
