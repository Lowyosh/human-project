import { Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AssetService } from '../../core/asset.service';
import { BrandStore } from '../../core/brand.store';
import { HeroPayload, LogoVariantsPayload } from '../block.types';
import { recolorSvg } from '../logo-variants/svg-recolor';

/** Orden de preferencia para el logo del hero: el más completo que exista. */
const LOGO_PRIORITY = ['logotipo', 'imagotipo', 'isotipo'] as const;

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit, OnDestroy {
  readonly payload = input.required<HeroPayload>();

  private readonly assets = inject(AssetService);
  private readonly store = inject(BrandStore);
  private readonly sanitizer = inject(DomSanitizer);

  /** El nombre sale de la marca, no del payload. */
  readonly brandName = computed(() => this.store.brand()?.name ?? '');

  readonly imageUrl = signal<string | null>(null);
  readonly logo = signal<SafeHtml | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadImage();
    this.loadLogo();
  }

  ngOnDestroy(): void {
    // Un blob: ocupa memoria hasta que se libera a mano.
    const url = this.imageUrl();
    if (url) URL.revokeObjectURL(url);
  }

  private loadImage(): void {
    const key = this.payload().imageKey;
    if (!key) return;

    this.assets
      .loadObjectUrl(key)
      .then((url) => this.imageUrl.set(url))
      .catch((e: Error) => this.error.set(e.message));
  }

  /**
   * El logo no es dato del hero: se reutiliza el del bloque `logo-variants`
   * de la misma marca, recoloreado en blanco para ir sobre la imagen.
   */
  private loadLogo(): void {
    const block = this.store.brand()?.blocks.find((b) => b.type === 'logo-variants');
    const variants = (block?.payload as LogoVariantsPayload | undefined)?.variants ?? [];

    const chosen = LOGO_PRIORITY.map((type) => variants.find((v) => v.type === type)).find(
      (variant) => variant !== undefined,
    );

    if (!chosen) return;

    this.assets
      .loadText(chosen.key)
      .then((svg) => this.logo.set(this.sanitizer.bypassSecurityTrustHtml(recolorSvg(svg, '#FFFFFF'))))
      .catch((e: Error) => this.error.set(e.message));
  }
}
