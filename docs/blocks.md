# Catálogo de bloques

Inventario de lo que entregamos, convertido en tipos de bloque del portal.

**Cómo leer la tabla:**

- **Block type ID** — el `type` que va en la base de datos y en el `REGISTRY` del frontend.
- **Datos** — campos del `payload`. Solo *qué es*, nunca *cómo se ve* (ver CLAUDE.md).
- **Obl.** — obligatorio *dentro de su versión*. Un bloque v2 marcado obligatorio no hace
  que un portal v1 esté incompleto.
- **Ver.** — v0.5 es el alcance del primer mes. v1 completa el resto. v2 es después.

## v0.5 — primer mes

| Bloque | Block type ID | Datos | Assets | Obl. | Consumidor |
|---|---|---|---|---|---|
| Hero + intro | `hero` | Nombre marca, tagline, texto intro, año | Imagen/vídeo hero | Sí | Todos |
| Logo — versiones | `logo-variants` | Tipo (iso/imago/logo), fondo (claro/oscuro), color (mono/positivo/negativo), nombre | SVG + PNG@2x + PDF por variante | Sí | Todos |
| Colores | `palette` | Nombre, HEX, OKLCH, RGB, CMYK, Pantone, % de uso, rol (primario/secundario/neutro) | — | Sí | Todos |
| Tipografía | `typography` | Familia, origen (`google`/`licensed`/`custom`), link foundry, pesos, usos, tamaños, tracking, leading | Archivos solo si `google` o `custom` | Sí | Todos |
| Favicon + avatar social | `icon-pack` | Tamaños incluidos | ICO, PNG 512/192/32, SVG | Sí | Cliente y dev |
| Descargas | `downloads` | Kits agrupados (kit redes, kit imprenta, todo) | ZIP generado | Sí | Todos |

## v1 — resto de bloques

| Bloque | Block type ID | Datos | Assets | Obl. | Consumidor |
|---|---|---|---|---|---|
| Espacio de seguridad | `clearspace` | Ratio (ej. 1.5× altura del símbolo), unidad de referencia | Diagrama SVG | Sí | Imprenta |
| Tamaños mínimos | `min-size` | mm (impresión), px (digital), por variante | — | Sí | Imprenta y dev |
| Export de theme | `theme-export` | *(derivado: no tiene datos propios)* | CSS / SASS / Tailwind / JSON | No | Dev |
| Overview / fotos de estilo | `moodboard` | — | 4-8 imágenes, no descargables | No | Cliente |

## v2

| Bloque | Block type ID | Datos | Assets | Obl. | Consumidor |
|---|---|---|---|---|---|
| Misuse grid | `misuse` | Texto del "no" por ejemplo (predefinidos y siempre los mismos) | 4 ejemplos | Sí | Cliente |
| Aplicaciones | `applications` | Categoría (papelería, packaging, señalética), pie | 4 mockups WebP | Sí | Cliente |
| Design tokens | `design-tokens` | Espaciado, radios, sombras, opacidades, breakpoints | — | No | Dev |
| Estilo de imagen / ilustración | `imagery` | Descripción del estilo, do/don't | 4 imágenes WebP, descargables | No | Cliente |
| Tono de voz | `tone-of-voice` | Atributos, do/don't, ejemplos | — | No | Cliente |
| Plantilla social media | `social-template` | Formato, plataforma, medidas | PSD/AI + PNG preview | No | Cliente |
| Firma de email | `email-signature` | HTML, instrucciones | Snippet HTML | No | Cliente |
| Recursos en cuenta del cliente | `client-owned` | Nombre, herramienta, URL, nota, última verificación | Screenshot preview | No | Cliente |
| Accesibilidad de color | `contrast` | *(derivado de `palette`)* | — | No | Dev |
| Animaciones | `motion` | Descripción, duración, easing | MP4 + WebM alpha + poster | No | Cliente / MKT |

## Notas por bloque

**`logo-variants`** — Fusiona lo que en la tabla original eran `logo-variants` y
`logo-color`. Es el mismo archivo indexado por tres ejes (tipo × fondo × color); separarlo
duplicaría el upload y la UI justo en el bloque más pesado de v0.5. *Pendiente: ¿qué
formatos son obligatorios? ¿EPS para imprenta?*

**`palette`** — HEX, OKLCH y RGB se autoderivan. **CMYK y Pantone son campos manuales** y
autoritativos (ver trampas en CLAUDE.md). La UI debe distinguir unos de otros.

**`typography`** — El enum `origen` es obligatorio y decide si servimos el archivo o solo
enlazamos al foundry. Es una restricción de licencia, no una preferencia.

**`clearspace`** — Decidir ya si el diagrama es un **SVG prediseñado a mano** (trivial) o
lo genera el template (caro). Si es lo segundo, es el bloque más caro de v1.

**`icon-pack`** — En v0.5 se generan a mano. La generación automática desde el isotipo es
v2 y va al pipeline de Python.

**`theme-export` y `contrast`** — Son **bloques derivados**: no tienen datos propios, se
calculan desde `palette` y `typography`. Decidir si los bloques derivados existen como
concepto en el modelo o se resuelven solo en el frontend. `theme-export` es barato y es el
mejor gancho con el developer del cliente.

**`design-tokens`** — Solo para marcas con producto digital diseñado. **No es obligatorio
nunca**; si no hay, la sección no existe. Que no aparezca vacía jamás. *Pendiente: cómo
mostrarlo en el template.*

**`social-template` vs `client-owned`** — Separados por **ownership**, no por formato. Los
PSD/AI los producimos y alojamos nosotros (descarga). La presentación en el Google Slides
del cliente vive en su Drive (CTA: "hacer una copia"). Distinto ciclo de vida, distinto
campo (`key` vs `url`).

**`moodboard` vs `imagery`** — Posible duplicado. La distinción actual es que `moodboard`
solo muestra el estilo y `imagery` es descargable. Decidir si merecen ser dos bloques.

**`applications`** — Es el bloque que más vende el portal internamente (el cliente se lo
enseña a su jefe). Está en v2 solo por coste de assets, no por valor.

**`motion`** — Vídeo con canal alpha: WebM/VP9 no funciona en Safari, hace falta también
HEVC alpha. Coste real desproporcionado para el valor. Ver NOT list.
