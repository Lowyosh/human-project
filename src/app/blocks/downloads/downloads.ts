import { Component, inject, input, signal } from '@angular/core';
import { AssetService } from '../../core/asset.service';
import { DownloadKit, DownloadsPayload } from '../block.types';

@Component({
  selector: 'app-downloads',
  templateUrl: './downloads.html',
  styleUrl: './downloads.scss',
})
export class Downloads {
  readonly payload = input.required<DownloadsPayload>();

  private readonly assets = inject(AssetService);

  /** Key del kit que se está descargando: los ZIP pesan y tardan. */
  readonly pending = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  async download(kit: DownloadKit): Promise<void> {
    this.pending.set(kit.key);
    this.error.set(null);

    try {
      await this.assets.download(kit.key);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.pending.set(null);
    }
  }
}
