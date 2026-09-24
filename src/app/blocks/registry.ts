import { Type } from '@angular/core';
import { BlockType } from './block.types';
import { Hero } from './hero/hero';
import { IconPack } from './icon-pack/icon-pack';
import { LogoVariants } from './logo-variants/logo-variants';
import { Palette } from './palette/palette';
import { Typography } from './typography/typography';

/**
 * Mapa `type → componente`. Añadir un bloque nuevo = una entrada aquí + un componente.
 * Partial: en v0.5 solo existen unos pocos tipos, no todos los del catálogo.
 */
export const REGISTRY: Partial<Record<BlockType, Type<unknown>>> = {
  hero: Hero,
  palette: Palette,
  'logo-variants': LogoVariants,
  typography: Typography,
  'icon-pack': IconPack,
};
