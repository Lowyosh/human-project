import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase, uno para toda la app.
 *
 * La clave publishable está pensada para vivir en el navegador: no da acceso a
 * nada por sí sola, es RLS quien decide qué devuelve cada consulta. Por eso
 * puede estar en un repo público.
 *
 * La que NUNCA puede salir de un servidor es la secreta (sb_secret_...),
 * porque salta RLS entera.
 */
export const SUPABASE_URL = 'https://xhqdjmnuvloyqnrcorao.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_CRILkvvjnY4dDXyCskQQYg_NyIC_nUi';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
