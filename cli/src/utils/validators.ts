// cli/src/utils/validators.ts

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidLicenseKey(key: string): boolean {
  // Formato: LIC-XXXX-XXXX-XXXX-XXXX
  return key.length >= 16 && key.includes('-');
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDaysRemaining(days: number | null): string {
  if (days === null) return 'Perpetua';
  if (days < 0) return 'Expirada';
  if (days === 0) return 'Expira hoy';
  if (days === 1) return '1 día';
  return `${days} días`;
}