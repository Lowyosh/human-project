/**
 * Recolorea un SVG monocromo.
 *
 * Solo sustituye el negro. El `fill="white"` de un <mask> y el `fill="none"`
 * del elemento raíz son estructura, no color: si se tocan, el logo se rompe.
 * De ahí la convención de exportar los logos monocromo en negro.
 */
const BLACK = /fill="(black|#000|#000000)"/gi;

export function recolorSvg(svg: string, color: string): string {
  return svg.replace(BLACK, `fill="${color}"`);
}

/** true si el archivo tiene algún negro que sustituir. */
export function isRecolorable(svg: string): boolean {
  BLACK.lastIndex = 0;
  return BLACK.test(svg);
}
