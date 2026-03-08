export function getUserRole(): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userRole='));

  return cookie ? cookie.split('=')[1] : null;
}

export function isLoggedIn(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('userRole=');
}