import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { AssetService } from '../../core/asset.service';
import { IconAsset, IconPackPayload } from '../block.types';

@Component({
  selector: 'app-icon-pack',
  templateUrl: './icon-pack.html',
  styleUrl: './icon-pack.scss',
})
export class IconPack implements OnInit, OnDestroy {
  readonly payload = input.required<IconPackPayload>();

  private readonly assets = inject(AssetService);

  /** key -> blob: para la vista previa. */
  readonly previews = signal<Record<string, string>>({});
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    for (const item of this.payload().items) {
      this.assets
        .loadObjectUrl(item.key)
        .then((url) => this.previews.update((current) => ({ ...current, [item.key]: url })))
        .catch((e: Error) => this.error.set(e.message));
    }
  }

  ngOnDestroy(): void {
    for (const url of Object.values(this.previews())) {
      URL.revokeObjectURL(url);
    }
  }

  download(item: IconAsset): void {
    void this.assets.download(item.key);
  }
}
