# Fuentes self-hosted

Las `@font-face` viven en `src/styles/fonts.css` y apuntan a los `.woff2` de esta
carpeta. Por restricciones de red del entorno de desarrollo, los binarios **no**
se incluyeron en este commit: hay que colocarlos aquí con los nombres exactos de
abajo y el sistema queda funcionando sin tocar nada más.

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
