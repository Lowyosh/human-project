import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { supabase } from './supabase.client';

/**
 * Sin sesión, al login. Se ejecuta antes de entrar en la ruta.
 *
 * Ojo: esto solo cuida la navegación, no los datos. Quien protege los datos es
 * RLS en la base de datos. Un guard se puede saltar desde el navegador;
 * una política de Postgres, no.
 */
export const authGuard: CanActivateFn = async () => {
  // inject() tiene que llamarse antes del primer await.
  const router = inject(Router);

  const { data } = await supabase.auth.getSession();

  return data.session ? true : router.createUrlTree(['/login']);
};
