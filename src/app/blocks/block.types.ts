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
