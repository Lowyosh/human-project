import { Injectable, signal } from '@angular/core';
import { Brand } from '../blocks/block.types';
import { supabase } from './supabase.client';

/**
 * Carga la marca del usuario con sesión iniciada.
 *
 * No hace falta filtrar por usuario en la consulta: RLS ya devuelve solo las
 * marcas con una fila en brand_access para él. Si no tiene ninguna, no llega
 * nada. Esa es toda la autorización.
 */
@Injectable({ providedIn: 'root' })
export class BrandStore {
  readonly brand = signal<Brand | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Al cerrar sesión: que no quede nada de la marca anterior en memoria. */
  reset(): void {
    this.brand.set(null);
    this.error.set(null);
    this.loading.set(false);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    // En SQL esto sería un join. Aquí, "block ( ... )" trae los bloques
    // relacionados dentro de cada marca.
    const { data, error } = await supabase
      .from('brand')
      .select('id, name, slug, organization_id, block ( id, brand_id, type, position, payload )')
      .limit(1)
      .maybeSingle();

    this.loading.set(false);

    if (error) {
      this.error.set(error.message);
      return;
    }

    if (!data) {
      this.error.set('Este usuario no tiene ninguna marca asignada.');
      return;
    }

    this.brand.set({
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      blocks: (data.block ?? []).map((b) => ({
        id: b.id,
        brandId: b.brand_id,
        type: b.type,
        position: b.position,
        payload: b.payload,
      })),
    });
  }
}
