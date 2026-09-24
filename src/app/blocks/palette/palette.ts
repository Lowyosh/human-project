import { Component, input } from '@angular/core';
import { PalettePayload } from '../block.types';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.html',
  styleUrl: './palette.scss',
})
export class Palette {
  /** Lo recibe del REGISTRY vía ngComponentOutlet. No consulta datos por su cuenta. */
  readonly payload = input.required<PalettePayload>();
}
