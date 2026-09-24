/**
 * Modelo de bloques. Ver CLAUDE.md → Arquitectura.
 * Regla: se guarda *qué es*, no *cómo se ve*.
 */

/** Tipos de bloque de v0.5. El resto del catálogo está en docs/blocks.md. */
export type BlockType =
  | 'hero'
  | 'logo-variants'
  | 'palette'
  | 'typography'
  | 'icon-pack'
  | 'downloads';

export interface Block {
  id: string;
  brandId: string;
  type: BlockType;
  /** Orden en el portal: es dato, no presentación. */
  position: number;
  /** Tipado según `type`. Hoy se confía en el seed; Mas tarde lo valida Zod. */
  payload: unknown;
}

export interface Brand {
  id: string;
  organizationId: string;
  name: string;
  blocks: Block[];
}

export interface Organization {
  id: string;
  name: string;
}

/** Rol del color dentro de la marca. */
export type ColorRole = 'primario' | 'secundario' | 'acento' | 'neutro-oscuro' | 'neutro-claro';

export interface PaletteColor {
  name: string;
  /** Autoderivables entre sí: HEX, OKLCH y RGB. */
  hex: string;
  oklch?: string;
  rgb?: string;
  /**
   * Manuales y autoritativos: dependen del perfil ICC y de la imprenta,
   * no se calculan desde el HEX. Ver CLAUDE.md → Trampas conocidas.
   */
  cmyk?: string;
  pantone?: string;
  role: ColorRole;
  /** Porcentaje de uso dentro de la identidad. */
  usage?: number;
}

export interface PalettePayload {
  colors: PaletteColor[];
}

/** Los tres tipos de logo. El color no se guarda: lo elige quien descarga. */
export type LogoVariantType = 'isotipo' | 'imagotipo' | 'logotipo';

export interface LogoVariant {
  type: LogoVariantType;
  /** Ruta del archivo en R2, nunca una URL: las URLs cambian, la key no. */
  key: string;
  name?: string;
}

export interface LogoVariantsPayload {
  variants: LogoVariant[];
}


/**
 * De dónde viene la fuente. Es una restricción de licencia, no una preferencia:
 * `licensed` solo permite enseñar el nombre y enlazar al foundry, porque no
 * podemos redistribuir una fuente comercial. Ver CLAUDE.md → Trampas conocidas.
 */
export type FontOrigin = 'google' | 'licensed' | 'custom';

export interface FontWeight {
  /** 400, 600, 800… el número que va en CSS. */
  value: number;
  name: string;
  usage?: string;
}

export interface FontFamily {
  name: string;
  origin: FontOrigin;
  /** Enlace al specimen o al foundry. Obligatorio de facto si es `licensed`. */
  url?: string;
  /** Para qué sirve esta familia: titulares, textos… */
  role?: string;
  /** Explicación en la voz de la marca. */
  note?: string;
  weights: FontWeight[];
  /** En em, que es lo que se pega en el CSS: "-0.04em" son -4%. */
  letterSpacing?: string;
  lineHeight?: string;
}

export interface TypographyPayload {
  intro?: string;
  families: FontFamily[];
}

export interface IconAsset {
  key: string;
  label: string;
  /** Informativos, para que el dev sepa qué se lleva: "ICO", "512×512". */
  format?: string;
  size?: string;
}

export interface IconPackPayload {
  note?: string;
  items: IconAsset[];
}

export interface DownloadKit {
  name: string;
  key: string;
  /** Qué lleva dentro: es lo que evita que la imprenta descargue el ZIP que no es. */
  contents?: string[];
  format?: string;
  /** Peso en texto, tal y como lo ve quien descarga: "2,4 MB". */
  size?: string;
}

export interface DownloadsPayload {
  note?: string;
  kits: DownloadKit[];
}

export interface HeroPayload {
  tagline?: string;
  intro?: string;
  year?: number;
  imageKey?: string;
}