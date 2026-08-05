const TOKEN_KEY = "exovision_access_token";
export const AUTH_INVALIDATED_EVENT = "exovision:auth-invalidated";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT));
}
