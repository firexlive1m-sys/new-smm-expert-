/**
 * Session-based Referral Tracker
 * Attribution strictly follows active click / session touch.
 * If user visits normally without ?ref=, active referral is empty (0 commission).
 */

const SESSION_REF_KEY = 'sky_active_referral_code';

export function captureReferralFromLocation(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // Check URL Search Params (?ref=XYZ)
    const urlParams = new URLSearchParams(window.location.search);
    let ref = urlParams.get('ref');

    // Also check Hash Params (#...ref=XYZ) if applicable
    if (!ref && window.location.hash.includes('ref=')) {
      const hashQuery = window.location.hash.split('?')[1];
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        ref = hashParams.get('ref');
      }
    }

    if (ref && ref.trim()) {
      const cleanRef = ref.trim().toUpperCase();
      sessionStorage.setItem(SESSION_REF_KEY, cleanRef);
      return cleanRef;
    }
  } catch (e) {
    console.warn('Error reading referral param:', e);
  }

  return null;
}

export function getActiveReferralCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(SESSION_REF_KEY)?.trim().toUpperCase() || '';
  } catch {
    return '';
  }
}

export function clearActiveReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_REF_KEY);
  } catch {}
}
