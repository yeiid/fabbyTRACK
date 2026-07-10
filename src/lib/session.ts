import type { APIContext } from 'astro';
import type { SessionUser } from '../db/types';

export function getSession(context: APIContext): SessionUser | null {
  const session = context.cookies.get('user_session')?.json();
  if (!session || !session.id || !session.role) return null;
  return session as SessionUser;
}

export function requireSession(context: APIContext): SessionUser {
  const session = getSession(context);
  if (!session) {
    throw new AuthError('No autorizado', 401);
  }
  return session;
}

export function requireRole(context: APIContext, role: 'user' | 'master'): SessionUser {
  const session = requireSession(context);
  if (session.role !== role) {
    throw new AuthError('No tienes permisos para esta acción', 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
