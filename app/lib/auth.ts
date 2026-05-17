import type { User } from "@/types/api";

const TOKEN_KEY = "nikkoshi_admin_token";
const USER_KEY = "nikkoshi_admin_user";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, user?: User | null) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuth() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    clearAuth();
    return null;
  }
}
