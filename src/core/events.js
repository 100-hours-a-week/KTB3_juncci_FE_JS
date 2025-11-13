export const AUTH_CHANGE_EVENT = 'auth-changed';

export function dispatchAuthChange(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail }));
}
