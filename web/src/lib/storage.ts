import type { CitizenProfile } from './types';

export const DEFAULT_PROFILE: CitizenProfile = {
  age: null,
  state: null,
  gender: null,
  caste: null,
  annual_income: null,
  landholding_acres: null,
};

const STORAGE_KEYS = {
  PROFILE: 'sahayak_profile_v1',
  SAVED_SCHEMES: 'sahayak_saved_schemes_v1',
  CHECKLIST: 'sahayak_checklist_v1',
};

export function loadSavedProfile(): CitizenProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: CitizenProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // Ignore quota errors
  }
}

export function loadSavedSchemeIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_SCHEMES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveSchemeId(schemeId: string): string[] {
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
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setDocumentChecked(key: string, checked: boolean): Record<string, boolean> {
  try {
    const current = loadDocumentChecklist();
    const updated = { ...current, [key]: checked };
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(updated));
    return updated;
  } catch {
    return {};
  }
}
