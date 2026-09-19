import { Type } from '@angular/core';
import { BlockType } from './block.types';
import { PaletteBlock } from './palette/palette-block';

/**
 * Mapa `type → componente`. Añadir un bloque nuevo = una entrada aquí + un componente.
 * Partial: en v0.5 solo existen unos pocos tipos, no todos los del catálogo.
 */
export const REGISTRY: Partial<Record<BlockType, Type<unknown>>> = {
  palette: PaletteBlock,
};
