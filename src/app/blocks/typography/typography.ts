import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FontFamily, TypographyPayload } from '../block.types';

/**
 * El pangrama es presentación, no dato: vive aquí para poder cambiarlo en las
 * 30 marcas a la vez. Ver CLAUDE.md → Dato vs presentación.
 */
const PANGRAM = 'El veloz murciélago hindú comía feliz cardillo y kiwi.';

@Component({
  selector: 'app-typography',
  templateUrl: './typography.html',
  styleUrl: './typography.scss',
})
export class Typography implements OnInit {
  readonly payload = input.required<TypographyPayload>();

  private readonly document = inject(DOCUMENT);

  readonly pangram = PANGRAM;
  readonly copied = signal<string | null>(null);

  /** Solo las de Google se pueden cargar y previsualizar de verdad. */
  private readonly googleFamilies = computed(() =>
    this.payload().families.filter((f) => f.origin === 'google'),
  );

  ngOnInit(): void {
    this.loadGoogleFonts();
  }

  /** Lo que el developer del cliente se lleva: CSS listo para pegar. */
  cssFor(family: FontFamily): string {
    const lines = [`font-family: '${family.name}', sans-serif;`];
    if (family.letterSpacing) lines.push(`letter-spacing: ${family.letterSpacing};`);
    if (family.lineHeight) lines.push(`line-height: ${family.lineHeight};`);
    return lines.join('\n');
  }

  async copy(family: FontFamily): Promise<void> {
    await navigator.clipboard.writeText(this.cssFor(family));
    this.copied.set(family.name);
    setTimeout(() => this.copied.set(null), 2000);
  }

  /**
   * Inyecta el <link> de Google Fonts con las familias y pesos del payload.
   * Solo para `origin: google`: una fuente comercial no se sirve, se enlaza.
   */
  private loadGoogleFonts(): void {
    const families = this.googleFamilies();
    if (families.length === 0) return;

    const query = families
      .map((family) => {
        const weights = [...new Set(family.weights.map((w) => w.value))].sort((a, b) => a - b);
        const name = family.name.replace(/ /g, '+');
        return `family=${name}:wght@${weights.join(';')}`;
      })
      .join('&');

    const href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    if (this.document.querySelector(`link[href="${href}"]`)) return;

    const link = this.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    this.document.head.appendChild(link);
  }
}
