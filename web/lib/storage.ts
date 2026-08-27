import type { CitizenProfile } from './types';

export const DEFAULT_PROFILE: CitizenProfile = {
  age: null,
  state: null,
  gender: null,
  caste: null,
  annual_income: null,
  landholding_acres: null,
};

export const STORAGE_KEYS = {
  PROFILE: 'sahayak_profile_v1',
  SAVED_SCHEMES: 'sahayak_saved_schemes_v1',
  CHECKLIST: 'sahayak_checklist_v1',
  CONSENT: 'sahayak_consent_v1',
} as const;

export function loadSavedProfile(): CitizenProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: CitizenProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // Ignore quota errors
  }
}

export function loadSavedSchemeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_SCHEMES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveSchemeId(schemeId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = loadSavedSchemeIds();
    const updated = current.includes(schemeId)
      ? current.filter((id) => id !== schemeId)
      : [...current, schemeId];
    localStorage.setItem(STORAGE_KEYS.SAVED_SCHEMES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function loadDocumentChecklist(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setDocumentChecked(key: string, checked: boolean): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const current = loadDocumentChecklist();
    const updated = { ...current, [key]: checked };
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(updated));
    return updated;
  } catch {
    return {};
  }
}

export function loadConsentGiven(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEYS.CONSENT) === 'true';
  } catch {
    return false;
  }
}

export function saveConsentGiven(given: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (given) {
      localStorage.setItem(STORAGE_KEYS.CONSENT, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.CONSENT);
    }
  } catch {}
}

/**
 * DPDP Act 2023: Explicit erasure of personal citizen data.
 * Clears profile, income, caste, saved schemes, and document checklists.
 * Preserves user interface preferences (theme, language, font scale, contrast).
 */
export function clearCitizenData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.SAVED_SCHEMES);
    localStorage.removeItem(STORAGE_KEYS.CHECKLIST);
    localStorage.removeItem(STORAGE_KEYS.CONSENT);
    localStorage.removeItem('sahayak-profile');
    localStorage.removeItem('sahayak-saved-schemes');
    localStorage.removeItem('sahayak-last-check');
  } catch {
    // Ignore
  }
}
