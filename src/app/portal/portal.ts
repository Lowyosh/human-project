import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Block, BlockType } from '../blocks/block.types';
import { REGISTRY } from '../blocks/registry';
import { BrandStore } from '../core/brand.store';
import { supabase } from '../core/supabase.client';

@Component({
  selector: 'app-portal',
  imports: [NgComponentOutlet],
  templateUrl: './portal.html',
  styleUrl: './portal.scss',
})
export class Portal implements OnInit {
  private readonly store = inject(BrandStore);
  private readonly router = inject(Router);

  readonly brand = this.store.brand;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  readonly blocks = computed(() => {
    const brand = this.brand();
    if (!brand) return [];
    return [...brand.blocks].sort((a, b) => a.position - b.position);
  });

  ngOnInit(): void {
    void this.store.load();
  }

  /** Un bloque sin componente registrado simplemente no se pinta. */
  componentFor(type: BlockType) {
    return REGISTRY[type] ?? null;
  }

  /** ngComponentOutlet espera un objeto de inputs. */
  inputsFor(block: Block) {
    return { payload: block.payload };
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    // Borra también la marca cargada: el siguiente usuario no debe verla.
    this.store.reset();
    void this.router.navigate(['/login']);
  }
}
