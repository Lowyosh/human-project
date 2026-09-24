import { Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { BrandStore } from '../../core/brand.store';
import { AssetService } from '../../core/asset.service';
import { HeroPayload } from '../block.types';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit, OnDestroy {
  readonly payload = input.required<HeroPayload>();

  private readonly assets = inject(AssetService);
  private readonly store = inject(BrandStore);

  /** El nombre sale de la marca, no del payload. */
  readonly brandName = computed(() => this.store.brand()?.name ?? '');

  readonly imageUrl = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const key = this.payload().imageKey;
    if (!key) return;

    this.assets
      .loadObjectUrl(key)
      .then((url) => this.imageUrl.set(url))
      .catch((e: Error) => this.error.set(e.message));
  }

  ngOnDestroy(): void {
    // Un blob: ocupa memoria hasta que se libera a mano.
    const url = this.imageUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
