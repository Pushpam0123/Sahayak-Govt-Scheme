// Central data hook: health, scheme directory, persistence, and eligibility matching.
import { useCallback, useEffect, useState } from 'react';
import {
  fetchHealth,
  fetchSchemes,
  matchEligibility,
} from '../lib/api';
import {
  DEMO_ELIGIBILITY,
  DEMO_SCHEMES,
} from '../lib/demo';
import {
  DEFAULT_PROFILE,
  loadDocumentChecklist,
  loadSavedProfile,
  loadSavedSchemeIds,
  saveProfile,
  setDocumentChecked,
  toggleSaveSchemeId,
} from '../lib/storage';
import type {
  CitizenProfile,
  EligibilityMap,
  SchemeInfo,
} from '../lib/types';

export function useSahayak() {
  const [healthLoading, setHealthLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  const [offline, setOffline] = useState(false);
  const [schemes, setSchemes] = useState<SchemeInfo[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityMap>({});

  // Client-persisted state
  const [profile, setProfileState] = useState<CitizenProfile>(() => {
    const p = loadSavedProfile();
    return {
      age: p.age ?? 30,
      state: p.state ?? 'Madhya Pradesh',
      gender: p.gender ?? 'Female',
      caste: p.caste ?? 'General',
      annual_income: p.annual_income ?? 180000,
      landholding_acres: p.landholding_acres ?? 2.5,
    };
  });

  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>(() => loadSavedSchemeIds());
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>(() => loadDocumentChecklist());
  const [tick, setTick] = useState(0);

  const setProfileField = useCallback(
    <K extends keyof CitizenProfile>(field: K, value: CitizenProfile[K]) => {
      setProfileState((prev) => {
        const next = { ...prev, [field]: value };
        saveProfile(next);
        return next;
      });
    },
    []
  );

  const resetProfile = useCallback(() => {
    setProfileState(DEFAULT_PROFILE);
    saveProfile(DEFAULT_PROFILE);
  }, []);

  const handleToggleSave = useCallback((schemeId: string) => {
    const updated = toggleSaveSchemeId(schemeId);
    setSavedSchemeIds(updated);
  }, []);

  const handleToggleDocChecked = useCallback((docKey: string) => {
    setCheckedDocs((prev) => {
      const nextVal = !prev[docKey];
      const updated = setDocumentChecked(docKey, nextVal);
      return updated;
    });
  }, []);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  // Health + scheme directory
  useEffect(() => {
    let cancelled = false;
    setHealthLoading(true);

    fetchHealth()
      .then((h) => {
        if (cancelled) return;
        setApiOnline(true);
        setDbConnected(h.database === 'connected');
      })
      .catch(() => {
        if (cancelled) return;
        setApiOnline(false);
        setDbConnected(false);
      })
      .finally(() => !cancelled && setHealthLoading(false));

    fetchSchemes()
      .then((data) => {
        if (cancelled) return;
        setSchemes(data);
        setOffline(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSchemes(DEMO_SCHEMES);
        setEligibility(DEMO_ELIGIBILITY);
        setOffline(true);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Eligibility matching
  useEffect(() => {
    if (offline) return;
    let cancelled = false;
    matchEligibility(profile)
      .then((map) => !cancelled && setEligibility(map))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile, offline]);

  return {
    healthLoading,
    apiOnline,
    dbConnected,
    offline,
    schemes,
    eligibility,
    profile,
    setProfileField,
    resetProfile,
    savedSchemeIds,
    toggleSaveScheme: handleToggleSave,
    checkedDocs,
    toggleDocChecked: handleToggleDocChecked,
    refresh,
  };
}
