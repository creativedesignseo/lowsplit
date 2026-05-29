// netlify/functions/_lib/auth.js
import { createClient } from '@supabase/supabase-js';

/**
 * Verifica el JWT del header Authorization y devuelve el user de Supabase.
 * Lanza un error si no hay token o el token es inválido.
 *
 * Uso en functions:
 *   const user = await requireAuth(event);
 *   // user.id es el UUID autenticado, usar SIEMPRE en lugar de event.body.userId
 */
export async function requireAuth(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    const err = new Error('Missing or invalid Authorization header');
    err.statusCode = 401;
    throw err;
  }
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }
  return data.user;
}

export function corsHeaders(origin) {
  // Whitelist de orígenes permitidos.
  // Producción principal: https://lowsplit.com (y www variant).
  // Fallback: subdominio Netlify (durante transición o si cae el DNS del dominio propio).
  // Dev: localhost en los puertos típicos (Vite 5173, Netlify Dev 8888).
  const allowed = [
    'https://lowsplit.com',
    'https://www.lowsplit.com',
    'https://lowsplit-app.netlify.app',
    'http://localhost:5173',
    'http://localhost:8888'
  ];
  // Permitir también deploy previews de Netlify (deploy-preview-N--lowsplit-app.netlify.app)
  const isNetlifyPreview = typeof origin === 'string'
    && /^https:\/\/(deploy-preview-\d+|branch-[^.]+)--lowsplit-app\.netlify\.app$/.test(origin);

  const allowOrigin = (allowed.includes(origin) || isNetlifyPreview) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}
