// Central data hook: health, scheme directory, and eligibility matching,
// with a graceful fall back to labelled sample data when the API is down.

import { useCallback, useEffect, useState } from 'react';
import {
  fetchHealth,
  fetchSearch,
  matchEligibility,
} from '../lib/api';
import {
  DEMO_ELIGIBILITY,
  DEMO_SCHEMES,
} from '../lib/demo';
import type {
  CitizenProfile,
  EligibilityMap,
  SchemeInfo,
} from '../lib/types';

export interface ProfileForm {
  age: string;
  state: string;
  gender: string;
  caste: string;
  income: string;
  landholding: string;
}

const DEFAULT_PROFILE: ProfileForm = {
  age: '30',
  state: 'Madhya Pradesh',
  gender: 'Female',
  caste: 'General',
  income: '180000',
  landholding: '2.5',
};

function toCitizenProfile(p: ProfileForm): CitizenProfile {
  return {
    age: p.age ? parseInt(p.age, 10) : null,
    state: p.state || null,
    gender: p.gender || null,
    caste: p.caste || null,
    annual_income: p.income ? parseFloat(p.income) : null,
    landholding_acres: p.landholding ? parseFloat(p.landholding) : null,
  };
}

export function useSahayak() {
  const [healthLoading, setHealthLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  const [offline, setOffline] = useState(false);
  const [schemes, setSchemes] = useState<SchemeInfo[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityMap>({});

  const [profile, setProfile] = useState<ProfileForm>(DEFAULT_PROFILE);
  const [tick, setTick] = useState(0);

  const setProfileField = useCallback(
    (field: keyof ProfileForm, value: string) =>
      setProfile((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  // Health + scheme directory (re-run on refresh)
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

    fetchSearch({ limit: 1 })
      .then((data) => {
        if (cancelled) return;
        setSchemes(data.schemes);
        setOffline(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Backend unreachable — show labelled sample data.
        setSchemes(DEMO_SCHEMES);
        setEligibility(DEMO_ELIGIBILITY);
        setOffline(true);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Eligibility matching whenever the profile changes (live backend only).
  useEffect(() => {
    if (offline) return;
    let cancelled = false;
    matchEligibility(toCitizenProfile(profile))
      .then((map) => !cancelled && setEligibility(map))
      .catch(() => {
        /* leave previous results in place */
      });
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
    refresh,
  };
}
