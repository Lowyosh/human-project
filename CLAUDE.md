# CLAUDE.md

Contexto y reglas del proyecto. Léelo antes de proponer cambios de arquitectura.

## Qué es esto

Webapp **interna del estudio** con la que publicamos, para cada cliente, un portal de
marca privado donde su equipo y sus proveedores entienden la identidad y descargan los
assets correctos en el formato correcto.

Referencias de mercado: Brandpad, Corebook, Standards, Frontify (este último solo como
catálogo de features, no como modelo de producto).

Tres consumidores del portal, con necesidades distintas:

- **Cliente**: entender su marca, sentir que la entrega es seria.
- **Proveedor externo** (imprenta, agencia, freelance): descargar el archivo correcto sin
  cagarla con el espacio de seguridad.
- **Developer del cliente**: quiere tokens y variables, no un PDF.

## Equipo y contexto real

Una sola persona: perfil **diseñador + frontend**, aprendiendo backend sobre la marcha.
El proyecto compite con trabajo facturable. El riesgo principal no es técnico, es que se
quede a medias. De ahí la regla que manda sobre todas las demás:

> **Cada incremento debe ser usable el día que se termina.** Nada de "cuando esté el
> admin, el import y el versionado, lo enseñamos".

## Decisiones de producto (cerradas)

- **Template fijo con theming**, no canvas libre. El portal hereda los colores y
  tipografías de la propia marca del cliente. El orden de bloques puede ser configurable;
  el posicionamiento libre, nunca.
- **El cliente no edita su marca.** Nosotros somos los autores, él es lector. Esta
  decisión ahorra más código que ninguna otra.
- **Herramienta interna** durante los primeros años. Sin signup público, sin billing, sin
  onboarding, sin roles granulares.
- **Pero sin cerrar la puerta al SaaS**: todo cuelga de un `organization_id` desde la
  primera migración y nada del estudio se hardcodea en el template. Eso es todo lo que
  hace falta hoy.
- Sin roles en v1. El CEO y el developer no necesitan permisos distintos, necesitan
  **rutas distintas al mismo contenido**: accesos rápidos tipo "¿eres developer? → tokens
  y descargas".

## Arquitectura

### Modelo de bloques

El portal no son "páginas", es **una plantilla única alimentada por un modelo de datos**:
`organization → brand → block[]`. Cada bloque tiene `type` + `payload` tipado.

```ts
interface Block {
  id: string;
  brandId: string;
  type: BlockType;     // 'hero' | 'logo-variants' | 'palette' | ...
  position: number;    // orden en el portal: es dato
  payload: unknown;    // tipado según `type`
}
```

El frontend tiene un mapa `type → componente` y lo pinta con `ngComponentOutlet`. Un
bloque que no existe para una marca simplemente no se pinta. **Cero condicionales de
negocio en la plantilla.**

```ts
// registry.ts
// Partial: en v0.5 solo existen unos pocos tipos, no todos los del catálogo.
export const REGISTRY: Partial<Record<BlockType, Type<unknown>>> = {
  palette: PaletteBlockComponent,
  'logo-variants': LogoVariantsComponent, // con guion, va entre comillas
  // ...
};

// portal.component.ts
blocks = computed(() =>
  [...this.brand().blocks].sort((a, b) => a.position - b.position)
);
componentFor = (type: BlockType) => REGISTRY[type] ?? null;
```

```html
<!-- portal.component.html -->
@for (block of blocks(); track block.id) {
  @if (componentFor(block.type); as cmp) {
    <ng-container *ngComponentOutlet="cmp; inputs: { payload: block.payload }" />
  }
}
```

`ngComponentOutlet` con `inputs` es la pieza clave: permite renderizar un componente
decidido en runtime sin un `switch` gigante en la plantilla.

Añadir un bloque nuevo = una entrada en el mapa + un componente. El primero cuesta
semanas, el sexto cuesta horas. Esa es toda la apuesta del diseño.

### Assets privados

Los archivos viven en un bucket R2 **sin acceso público**. Los sirve el Worker, que no
lleva claves de la base de datos: recibe el token de sesión del navegador, le pregunta a
Supabase por la marca **con ese token** y deja que responda RLS. Las reglas de acceso
siguen existiendo en un solo sitio.

Convención de keys: `brands/<brand_id>/<lo-que-sea>`. El `brand_id` va en la propia ruta,
y por eso se puede comprobar el permiso sin consultar nada más.

En el payload se guarda la **key**, nunca una URL: las URLs cambian de dominio o caducan,
la key no. El frontend las pide con `AssetService`, que añade el token y cachea por key.

Consecuencia práctica: un asset no se puede poner en un `<img src>` sin más, porque hace
falta la cabecera de autorización. Se descarga como blob y se pinta desde ahí.

### Dato vs presentación

**Regla:** se guarda *qué es*, no *cómo se ve*.

| A la base de datos | Nunca a la base de datos |
|---|---|
| `#FF5733`, nombre "Brand Primary", 60% de uso | Que la paleta se pinte en tarjetas de 240px |
| SVG del isotipo, variante, fondo claro/oscuro | Que las variantes vayan en grid de 3 columnas |
| `letter-spacing: -0.02em`, peso 700 | La pangram del specimen, el tamaño del preview |
| Que un bloque exista o no para esta marca | Cómo se ve ese bloque cuando existe |

Antipatrón a evitar: campos tipo `columns: 3`, `cardSize: 'large'`, `sectionBg: '#111'`,
`showTitle: true`. Cada uno parece inofensivo y es la puerta de entrada al canvas libre
que decidimos no construir.

Si rediseñamos el template, debe cambiar para los 30 clientes a la vez con CSS, sin
tocar la base de datos ni migrar nada.

**Excepción legítima:** el theming de marca. El portal usa el `#FF5733` del cliente como
variable de UI, pero eso es dato reutilizado, no presentación guardada.

### Stack

- **Frontend: Angular** (standalone components, signals, Sass). Decisión tomada por
  mí el 17/09/2026: es el framework que ya domino, y estoy aprendiendo backend a la vez —
  añadir un framework nuevo al lado sería el mismo error que meter un lenguaje nuevo.
  Sass en vez de Tailwind (18/09/2026): el portal es contenido y layout, y el theming va
  con variables CSS. Tailwind se añade más adelante si hace falta de verdad.
  Librería de componentes: pendiente, probablemente DaisyUI cuando llegue el panel de
  admin. El portal en sí es contenido y layout, apenas necesita componentes de librería.
- **Hosting: Cloudflare** (archivos estáticos, con un Worker solo donde haga falta). Razón:
  mismo proveedor que R2, una sola factura, y free tier suficiente. Vercel Hobby queda
  descartado porque prohíbe uso comercial y una herramienta interna del estudio lo es;
  Pro (~20$/mes) se come el objetivo de coste.
- **El portal es una SPA, sin prerender ni SSR.** Decisión del 18/09/2026, sustituye al
  prerender que había aquí antes. `ng build` deja una carpeta de archivos que Cloudflare
  sirve tal cual; el navegador pide los datos a Supabase después del login.
  Por qué:
  - **Privacidad.** Prerenderizar deja el HTML del portal con la marca dentro, y un
    archivo no sabe quién lo pide: cualquiera con la URL lo vería sin login. Con SPA el
    HTML va vacío y los datos solo salen si Supabase reconoce al usuario, que es lo que
    hace RLS. Los portales son privados: esto manda sobre el resto.
  - **Nada que regenerar.** Un cambio en la base de datos se ve al recargar. Sin
    prerender no hay build que relanzar al publicar.
  - **SEO irrelevante.** No queremos que Google entre en un portal de cliente.
  - Lo que se pierde: Más tiempo de carga inicial.
  - Es reversible: `ng add @angular/ssr` lo añade después. La condición para que siga
    siendo fácil es que los bloques reciban su `payload` por `input` y no consulten nada
    por su cuenta, que es como ya están diseñados.
- **El Worker aparece solo cuando hay un secreto de por medio.** Empieza en la semana 2:
  firmar las URLs de R2 exige una clave que no puede vivir en el JavaScript del navegador.
  Ojo en la semana 4: un Worker tiene poco tiempo de CPU por petición, así que no sirve
  para generar ZIPs pesados. En v0.5 los ZIPs se suben hechos a mano.
- **TypeScript de punta a punta.** Angular + Supabase (Postgres, Auth, RLS) + Cloudflare R2.
- **Sin backend propio en v0.5.** Angular habla directamente con Supabase y RLS hace de
  capa de autorización. Cuando haga falta lógica de servidor (ZIPs, procesado de assets),
  entra un backend aparte: Hono o Nest para conservar los tipos compartidos, o el
  pipeline en Python si para entonces sigue apeteciendo.
- Validación con **Zod en el borde**, schemas compartidos entre el cliente y cualquier
  backend futuro. El `payload` va como JSONB: gana velocidad (añadir un tipo de bloque no
  es migración) a cambio de perder validación en DB; Zod lo compensa.
- **R2 para assets**: S3-compatible (el SDK de AWS y las pre-signed URLs funcionan igual),
  cero egress, free tier recurrente de 10GB. Ojo: pre-signed URLs de más de 7 días no
  están soportadas.
- **Supabase** resuelve el login: creamos el usuario, le damos credenciales, y RLS define
  "este usuario solo ve la marca X".
- Coste objetivo: 0-5€/mes al arrancar, ~25-45€/mes con 20-30 clientes.

**Sobre Python:** no entra en v1. Dos lenguajes para una persona sola significa perder los
tipos compartidos, que es justo la red de seguridad que más falta hace aprendiendo
backend. Sitio correcto para Python más adelante: el **pipeline de procesado de assets**
(SVG → PNG/favicon/ZIP) como servicio aparte, acotado, que no bloquea el portal si falla.

## Plan

### v0.5 — el mes que viene, 5 bloques, sin panel de admin

Datos por **JSON seed en el repo**, assets subidos a mano desde el dashboard de
Cloudflare. Feo a propósito: soy el único que escribe, y el panel es donde más horas se
van sin que ningún cliente las vea. El panel llega cuando editar JSON duela de verdad — y
entonces sabré qué campos necesita, que hoy no lo sé.

| Semana | |
|---|---|
| 1 | Proyecto Angular + Sass desplegado en Cloudflare como archivos estáticos. Supabase: schema (`organization`, `brand`, `block`) + auth con usuario a mano. Portal renderizando desde JSON seed vía `ngComponentOutlet` |
| 2 | R2 + servir assets. `hero` y `logo-variants` completos, diseño incluido |
| 3 | `palette` y `typography`, con copy-to-clipboard |
| 4 | `downloads` (ZIP) + `icon-pack`. Deploy real. Nuestra propia marca publicada |

Cliente cero = **nuestro propio estudio**. Es gratis, no molesta a nadie y obliga a
comerse la propia comida.

Primer commit: walking skeleton. Una página que renderiza un `PaletteBlockComponent`
desde un JSON hardcodeado, desplegada. Un día. No abrir el repo con el schema.

**Estado a 25/09/2026: los seis bloques están hechos y la marca del estudio, publicada.**
Cambios respecto al plan, por si alguien lee solo la tabla:

- El JSON seed duró un día. Los datos salen de Supabase desde la semana 1, y el seed se
  borró: mantener dos fuentes no aportaba nada.
- Los assets no son públicos. R2 privado + Worker, como explica *Assets privados*.
- `logo-variants` no guarda colores: los SVG se suben monocromo y el portal los recolorea.
- `downloads` es un bloque, no un footer fijo: las keys de los ZIP son dato de cada marca
  y hay marcas que no tendrán kits. Que se vea como una franja al final es solo CSS.
- El theming de marca quedó aparcado a propósito, hasta decidir el diseño de los bloques.

Sin hacer todavía: validación con Zod de los payloads (hoy se confía en lo que hay en la
base de datos) y el diseño de los bloques, que están con estilos mínimos.

### Después

Resto de bloques de v1 (ver `docs/blocks.md`), luego panel de admin, luego v2.

## NOT list

Escrita con el porqué, no solo el qué. Se revisa, no se ignora.

**Nunca:**

- No es un DAM genérico, ni gestor de proyectos, ni herramienta de diseño.
- No es un design system de producto (eso es zeroheight).
- El cliente no edita su propia marca.

**Ahora no:**

- **Panel de admin** — v0.5 va con JSON seed. Hasta editar 3 marcas a mano no sé qué
  campos necesita el formulario.
- **Import de Figma** — es una optimización de nuestro flujo interno, el cliente no la ve
  nunca. Regla: automatizar solo lo hecho a mano 3 veces. Las primeras marcas enseñan cuál
  es la convención de nombres correcta; automatizar antes es automatizar la equivocada.
- **Generación automática de formatos** (SVG → PNG/favicon) — mismo razonamiento: primero
  exportar a mano y ver qué formatos pide la gente de verdad.
- **Versionado** — hasta no actualizar una identidad ya entregada no sabemos qué histórico
  hace falta.
- **Analytics de descargas, dominios custom, multi-idioma, comentarios y aprobaciones.**
- **Vídeo con canal alpha** (`motion`) — único item con coste técnico desproporcionado:
  formatos duales, peso, WebM/VP9 no va en Safari (hace falta HEVC alpha). Si un cliente
  lo necesita antes, Lottie o GIF sacan del apuro.

**No lo construimos nosotros:** auth (Supabase), CDN, emails, búsqueda full-text, backups,
conversión de vídeo. No hay app móvil, solo web responsive.

**Muerto por ser herramienta interna:** signup, billing, planes y límites, onboarding
autoguiado, panel de organizaciones, soporte, landing comercial.

**Sin decidir:**

- ¿Un cliente puede tener varias marcas?
- ¿Qué pasa al terminar la relación con el cliente: se corta el acceso o se le entrega el
  portal? (Corebook permite transferir ownership; es un modelo interesante.)
- ¿ZIP pregenerado al publicar u on-demand?
- ¿`moodboard` e `imagery` son el mismo bloque?

## Trampas conocidas

Cosas que ya nos han mordido en la fase de diseño y que no hay que redescubrir:

- **Los logos se suben monocromo en negro, y el color lo elige quien descarga.** El portal
  recolorea el SVG en el navegador, así que el color no es un dato del logo y no se guarda:
  una variante = tipo (iso/imago/logo) + `key` del archivo. La sustitución afecta **solo al
  negro** (`black`, `#000`, `#000000`): el `fill="white"` que llevan dentro los `<mask>` y
  el `fill="none"` del elemento raíz son estructura, no color, y tocarlos rompe el logo.
  Misma lógica servirá para exportar PNG con `canvas`, también en el navegador, sin pipeline.
- **CMYK y Pantone no son derivables.** HEX↔OKLCH↔RGB es matemática pura, adelante. HEX→CMYK
  depende del perfil ICC, del papel y de la imprenta; HEX→Pantone además tiene tema de
  licencia. Ambos son **campos manuales autoritativos** que rellena el diseñador. El modelo
  debe distinguir valores autoderivados de valores introducidos a mano.
- **No podemos redistribuir fuentes comerciales.** La licencia la compra el cliente y suele
  prohibir servirla a terceros. Por eso `typography` lleva un enum `origen` obligatorio:
  `google` (embebible y descargable), `licensed` (solo nombre + link al foundry + nota de
  licencia), `custom` (hecha por nosotros, esa sí se sirve).
- **Recursos en la cuenta del cliente** (ej. plantilla de presentación en su Google Slides):
  no los alojamos ni los controlamos. El CTA es "hacer una copia", no "descargar". Guardar
  copia de respaldo en nuestro bucket y un campo de "última verificación", porque el link
  se rompe y no nos enteramos.
- **Las URLs de imagen de la API de Figma expiran** (30 días máx). Hay que copiarlas al
  bucket, nunca enlazarlas. Relevante cuando llegue el import.

## Estilo de trabajo

- No construir el panel de administración perfecto durante dos meses sin tener nada que
  enseñar a un cliente. Es el error clásico y el que más veces mata proyectos así.
- Abrir el repo o cambiar de herramienta **no es progreso**. Progreso es un bloque en
  pantalla.
- Ante la duda de scope: recortar. Siempre.
