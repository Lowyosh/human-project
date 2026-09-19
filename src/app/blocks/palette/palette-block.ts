import { Component, input } from '@angular/core';
import { PalettePayload } from '../block.types';

@Component({
  selector: 'app-palette-block',
  templateUrl: './palette-block.html',
  styleUrl: './palette-block.scss',
})
export class PaletteBlock {
  /** Lo recibe del REGISTRY vía ngComponentOutlet. No consulta datos por su cuenta. */
  readonly payload = input.required<PalettePayload>();
}
