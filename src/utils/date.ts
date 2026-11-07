/**
 * Crash-proof Date utilities for converting and formatting timestamps
 * from localStorage, Firestore, or Date objects.
 */

export function toSafeDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date() : val;
  }
  if (typeof val === 'object' && val !== null) {
    // Firestore Timestamp or similar
    if ('toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      try {
        return (val as { toDate: () => Date }).toDate();
      } catch {
        return new Date();
      }
    }
    if ('seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
      return new Date((val as { seconds: number }).seconds * 1000);
    }
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function formatTimeSafe(
  val: unknown,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
  fallback = 'JUST NOW'
): string {
  try {
    if (!val) return fallback;
    const date = toSafeDate(val);
    return date.toLocaleTimeString('en-US', options);
  } catch {
    return fallback;
  }
}

export function formatDateSafe(
  val: unknown,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
  fallback = 'TODAY'
): string {
  try {
    if (!val) return fallback;
    const date = toSafeDate(val);
    return date.toLocaleDateString('en-US', options);
  } catch {
    return fallback;
  }
}
