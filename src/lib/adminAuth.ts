const ADMIN_SESSION_KEY = 'swiftsmm_admin_auth_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Admin Password directly configured in code
const EXPECTED_PASSWORD = 'skaliop80';

type AuthListener = (isAuth: boolean) => void;
const authListeners = new Set<AuthListener>();

export function isAuthenticated(): boolean {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (!session || !session.token || !session.expiresAt) return false;
    if (Date.now() > session.expiresAt) {
      logoutAdmin();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function loginAdmin(password: string, remember = false): boolean {
  if (password.trim() === EXPECTED_PASSWORD.trim()) {
    const session = {
      token: 'admin-sess-' + Math.random().toString(36).substring(2) + '-' + Date.now(),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
    };
    const serialized = JSON.stringify(session);
    sessionStorage.setItem(ADMIN_SESSION_KEY, serialized);
    if (remember) {
      localStorage.setItem(ADMIN_SESSION_KEY, serialized);
    }
    notifyAuthListeners(true);
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    notifyAuthListeners(false);
  } catch (e) {
    console.error('Error logging out:', e);
  }
}

export function subscribeAuth(callback: AuthListener): () => void {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

function notifyAuthListeners(isAuth: boolean) {
  authListeners.forEach((fn) => {
    try {
      fn(isAuth);
    } catch (e) {
      console.error(e);
    }
  });
}
