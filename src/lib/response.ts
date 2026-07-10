export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function error(message: string, status = 400): Response {
  return json({ message }, status);
}

export function unauthorized(): Response {
  return error('No autorizado', 401);
}

export function forbidden(): Response {
  return error('No tienes permisos para esta acción', 403);
}

export function notFound(resource = 'Recurso'): Response {
  return error(`${resource} no encontrado`, 404);
}
