import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

/**
 * Pide archivos privados al Worker.
 *
 * Los assets del bucket no son accesibles por URL: hay que pedirlos con el
 * token de sesión, y el Worker comprueba contra RLS que esa marca es tuya.
 * Por eso no se pueden poner en un <img src="..."> sin más.
 *
 * Cachea por key: el mismo logo se pide una vez aunque se pinte en varios
 * sitios. La caché se llena con promesas, no con resultados, para que dos
 * peticiones simultáneas de la misma key no disparen dos fetch.
 */
@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly textCache = new Map<string, Promise<string>>();

  /** Para SVG: devuelve el archivo como texto, que luego se puede recolorear. */
  loadText(key: string): Promise<string> {
    const cached = this.textCache.get(key);
    if (cached) return cached;

    const request = this.fetchAsset(key).then((response) => response.text());
    this.textCache.set(key, request);
    return request;
  }

  /** Para imágenes y descargas: una URL temporal del navegador (blob:). */
  async loadObjectUrl(key: string): Promise<string> {
    const response = await this.fetchAsset(key);
    return URL.createObjectURL(await response.blob());
  }

  /** Descarga un archivo tal cual está en el bucket. */
  async download(key: string, filename?: string): Promise<void> {
    const url = await this.loadObjectUrl(key);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename ?? key.split('/').pop() ?? 'descarga';
    link.click();

    URL.revokeObjectURL(url);
  }

  private async fetchAsset(key: string): Promise<Response> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) throw new Error('Sin sesión.');

    const response = await fetch(`/api/asset/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`No se pudo cargar ${key} (${response.status}).`);
    }

    return response;
  }
}
