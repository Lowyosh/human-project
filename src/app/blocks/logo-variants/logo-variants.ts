import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AssetService } from '../../core/asset.service';
import { BrandStore } from '../../core/brand.store';
import { LogoVariant, LogoVariantsPayload, PalettePayload } from '../block.types';
import { recolorSvg } from './svg-recolor';

interface ColorOption {
  name: string;
  hex: string;
}

@Component({
  selector: 'app-logo-variants',
  templateUrl: './logo-variants.html',
  styleUrl: './logo-variants.scss',
})
export class LogoVariants implements OnInit {
  readonly payload = input.required<LogoVariantsPayload>();

  private readonly assets = inject(AssetService);
  private readonly store = inject(BrandStore);
  private readonly sanitizer = inject(DomSanitizer);

  /** key -> contenido del SVG tal cual viene del bucket. */
  private readonly sources = signal<Record<string, string>>({});

  readonly selected = signal('#000000');
  readonly error = signal<string | null>(null);

  /**
   * Los colores del selector salen del bloque `palette` de la misma marca,
   * más negro y blanco, que siempre hacen falta. El color no es un dato del
   * logo: es una elección de quien descarga.
   */
  readonly colors = computed<ColorOption[]>(() => {
    const paletteBlock = this.store.brand()?.blocks.find((b) => b.type === 'palette');
    const palette = paletteBlock?.payload as PalettePayload | undefined;

    return [
      { name: 'Negro', hex: '#000000' },
      { name: 'Blanco', hex: '#FFFFFF' },
      ...(palette?.colors.map((c) => ({ name: c.name, hex: c.hex })) ?? []),
    ];
  });

  readonly variants = computed(() =>
    this.payload().variants.map((variant) => ({
      ...variant,
      svg: this.svgFor(variant.key),
    })),
  );

  /** Fondo oscuro cuando el logo es claro, si no no se vería. */
  readonly darkPreview = computed(() => isLight(this.selected()));

  ngOnInit(): void {
    for (const variant of this.payload().variants) {
      this.assets
        .loadText(variant.key)
        .then((svg) => this.sources.update((current) => ({ ...current, [variant.key]: svg })))
        .catch((e: Error) => this.error.set(e.message));
    }
  }

  download(variant: LogoVariant): void {
    const raw = this.sources()[variant.key];
    if (!raw) return;

    const blob = new Blob([recolorSvg(raw, this.selected())], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${variant.type}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  }

  private svgFor(key: string): SafeHtml | null {
    const raw = this.sources()[key];
    if (!raw) return null;

    // El SVG viene de nuestro propio bucket, no de una fuente externa.
    return this.sanitizer.bypassSecurityTrustHtml(recolorSvg(raw, this.selected()));
  }
}

/** Luminancia aproximada, suficiente para decidir el fondo del preview. */
function isLight(hex: string): boolean {
  const value = hex.replace('#', '');
  if (value.length !== 6) return false;

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}
