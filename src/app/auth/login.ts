import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../core/supabase.client';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly router = inject(Router);

  /** Los enlazas en la plantilla con [value] y (input), o con ngModel. */
  readonly email = signal('');
  readonly password = signal('');

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: this.email(),
      password: this.password(),
    });

    this.loading.set(false);

    if (error) {
      // Supabase devuelve el mensaje en inglés; de momento vale.
      this.error.set(error.message);
      return;
    }

    // Con sesión creada, el guard ya deja pasar al portal.
    void this.router.navigate(['/']);
  }

  /** Atajo para leer los inputs de la plantilla sin castear a mano. */
  onInput(target: EventTarget | null, field: 'email' | 'password'): void {
    const value = (target as HTMLInputElement).value;
    this[field].set(value);
  }
}
