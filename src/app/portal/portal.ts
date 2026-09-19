import { NgComponentOutlet } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Block, BlockType, Brand } from '../blocks/block.types';
import { REGISTRY } from '../blocks/registry';
import seed from '../data/seed.json';

@Component({
  selector: 'app-portal',
  imports: [NgComponentOutlet],
  templateUrl: './portal.html',
  styleUrl: './portal.scss',
})
export class Portal {
  /** v0.5: el dato viene del seed del repo. En la semana 1 vendrá de Supabase. */
  readonly brand = signal<Brand>(seed.brand as Brand);

  readonly blocks = computed(() =>
    [...this.brand().blocks].sort((a, b) => a.position - b.position),
  );

  /** Un bloque sin componente registrado simplemente no se pinta. */
  componentFor(type: BlockType) {
    return REGISTRY[type] ?? null;
  }

  /** ngComponentOutlet espera un objeto de inputs. */
  inputsFor(block: Block) {
    return { payload: block.payload };
  }
}
