# Estilo Google para el simulador

Guía de estilo para que el simulador se vea como una app de Google: **Material Design 3** con la tipografía **Google Sans**.

## Tipografía

- Texto: `Google Sans` (Google Fonts). Respaldo: `Google Sans Flex` y `Roboto`.
- Cifras (nómina, saldos, porcentajes): `Google Sans Code`, con `font-variant-numeric: tabular-nums` para que las columnas cuadren.
- Se cargan con el `@import` de `tokens.css`. No uses otras fuentes.

## Cómo aplicarlo

1. Copia `tokens.css` entero dentro del `<style>` del HTML.
2. Usa solo las variables `--md-*` para los colores. No escribas colores sueltos.
3. Componentes:
   - Tarjetas `.card` con radio de 16 px sobre `--md-surface`.
   - Botón principal `.btn--filled` en forma de píldora; secundarios `.btn--tonal` o `.btn--outlined`.
   - Selección de niveles, ciudades u ofertas con `.chip` y `aria-pressed`.
   - Feedback con `.feedback--ok`, `.feedback--aviso` y `.feedback--error`, siempre con texto, nunca solo con color.
4. Diseño limpio: mucho espacio en blanco, una columna en el móvil, sin sombras fuertes ni degradados, sin emojis.
5. Modo oscuro automático con `prefers-color-scheme`. Ya está en los tokens.

## Referencias oficiales

- Material Design 3: https://m3.material.io
- Componentes web de Material: https://github.com/material-components/material-web
- Google Sans en Google Fonts: https://fonts.google.com/specimen/Google+Sans
