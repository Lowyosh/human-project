/**
 * Worker de assets.
 *
 * Única responsabilidad: servir archivos privados del bucket R2 a quien tenga
 * derecho a verlos. Todo lo demás del portal son archivos estáticos.
 *
 * Cómo autoriza, sin repetir reglas de acceso:
 *   1. El navegador manda el token de sesión de Supabase.
 *   2. El Worker le pregunta a Supabase por la marca CON ESE TOKEN.
 *   3. Si RLS no le deja ver la marca, la respuesta viene vacía y aquí se
 *      corta. La autorización sigue viviendo solo en la base de datos.
 *
 * Convención de nombres en el bucket:  brands/<brand_id>/<lo-que-sea>
 * El brand_id va en la propia key, y por eso se puede comprobar el permiso
 * sin consultar nada más.
 */

interface Env {
  ASSETS_BUCKET: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
}

const ASSET_PREFIX = '/api/asset/';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith(ASSET_PREFIX)) {
      return new Response('Not found', { status: 404 });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // /api/asset/brands/<brand_id>/logo/iso.svg  ->  brands/<brand_id>/logo/iso.svg
    const key = decodeURIComponent(url.pathname.slice(ASSET_PREFIX.length));
    const brandId = key.split('/')[1];

    if (!key.startsWith('brands/') || !brandId) {
      return new Response('Bad request', { status: 400 });
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!(await canReadBrand(env, token, brandId))) {
      return new Response('Forbidden', { status: 403 });
    }

    const object = await env.ASSETS_BUCKET.get(key);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    // Privado: que ningún intermediario lo guarde para otro usuario.
    headers.set('Cache-Control', 'private, max-age=3600');

    return new Response(object.body, { headers });
  },
} satisfies ExportedHandler<Env>;

/** Pregunta a Supabase con el token del usuario. Responde RLS, no el Worker. */
async function canReadBrand(env: Env, token: string, brandId: string): Promise<boolean> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/brand?id=eq.${encodeURIComponent(brandId)}&select=id`,
    {
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) return false;

  const rows = (await response.json()) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}
