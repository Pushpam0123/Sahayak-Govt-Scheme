'use client';

// Central data hook: health, scheme directory, persistence, and eligibility matching via TanStack Query.
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  clearCitizenData,
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
  const queryClient = useQueryClient();

  // Client-persisted state
  const [profile, setProfileState] = useState<CitizenProfile>(DEFAULT_PROFILE);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  // Sync client-side stored values on mount (avoiding hydration mismatch)
  useEffect(() => {
    const p = loadSavedProfile();
    setProfileState({
      age: p.age ?? null,
      state: p.state ?? null,
      gender: p.gender ?? null,
      caste: p.caste ?? null,
      annual_income: p.annual_income ?? null,
      landholding_acres: p.landholding_acres ?? null,
    });
    setSavedSchemeIds(loadSavedSchemeIds());
    setCheckedDocs(loadDocumentChecklist());
  }, []);

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

  const clearCitizenProfile = useCallback(() => {
    clearCitizenData();
    setProfileState(DEFAULT_PROFILE);
    setSavedSchemeIds([]);
    setCheckedDocs({});
    queryClient.removeQueries({ queryKey: ['eligibility'] });
  }, [queryClient]);

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

  // TanStack Query: Health
  const {
    data: healthData,
    isLoading: healthLoading,
    isSuccess: isHealthSuccess,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: 1,
    refetchInterval: 30000,
  });

  const apiOnline = isHealthSuccess;
  const dbConnected = healthData?.database === 'connected';

  // TanStack Query: Schemes
  const {
    data: remoteSchemes,
    isError: isSchemesError,
    refetch: refetchSchemes,
  } = useQuery({
    queryKey: ['schemes'],
    queryFn: () => fetchSchemes(),
    retry: 1,
  });

  const offline = isSchemesError;
  const schemes: SchemeInfo[] = remoteSchemes ?? (isSchemesError ? DEMO_SCHEMES : []);

  // TanStack Query: Eligibility Matching
  const hasProfileData =
    profile.age !== null ||
    profile.state !== null ||
    profile.gender !== null ||
    profile.annual_income !== null;

  const { data: eligibilityData } = useQuery({
    queryKey: ['eligibility', profile],
    queryFn: () => matchEligibility(profile),
    enabled: !offline && Boolean(remoteSchemes) && hasProfileData,
    retry: 1,
  });

  const eligibility: EligibilityMap =
    eligibilityData ?? (offline ? DEMO_ELIGIBILITY : {});

  const refresh = useCallback(() => {
    refetchHealth();
    refetchSchemes();
    queryClient.invalidateQueries({ queryKey: ['eligibility'] });
  }, [refetchHealth, refetchSchemes, queryClient]);

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
    clearCitizenProfile,
    savedSchemeIds,
    toggleSaveScheme: handleToggleSave,
    checkedDocs,
    toggleDocChecked: handleToggleDocChecked,
    refresh,
  };
}
