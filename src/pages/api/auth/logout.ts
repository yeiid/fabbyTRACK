import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete('user_session', { path: '/' });
  return new Response(JSON.stringify({ message: 'Sesión cerrada correctamente' }), { status: 200 });
};
