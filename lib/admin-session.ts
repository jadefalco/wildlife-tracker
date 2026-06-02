const SESSION_KEY = 'kwt_admin_session';
const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
}

export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed.authenticated || Date.now() > parsed.expiresAt) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function createSession(): void {
  if (typeof window === 'undefined') return;
  const session: AdminSession = {
    authenticated: true,
    expiresAt: Date.now() + INACTIVITY_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function touchSession(): void {
  if (typeof window === 'undefined') return;
  const session = getSession();
  if (session) {
    session.expiresAt = Date.now() + INACTIVITY_MS;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}
