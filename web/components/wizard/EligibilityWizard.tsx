'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dict } from '../../lib/i18n';
import { INDIAN_STATES } from '../../lib/i18n';
import type { CitizenProfile, EligibilityMap, SchemeInfo } from '../../lib/types';
import { Card, Badge, Button } from '../ui';
import { SparklesIcon, ArrowRightIcon, CheckCircleIcon, XCircleIcon, SpeakerIcon, StopIcon, ShieldCheckIcon } from '../icons';
import { useLang } from '../../lib/theme';
import { useSpeechSynthesis } from '../../hooks/useSpeech';
import { loadConsentGiven, saveConsentGiven } from '../../lib/storage';

interface EligibilityWizardProps {
  t: Dict;
  profile: CitizenProfile;
  setField: <K extends keyof CitizenProfile>(field: K, value: CitizenProfile[K]) => void;
  eligibility: EligibilityMap;
  schemes: SchemeInfo[];
  onSelectScheme?: (schemeId: string) => void;
  savedSchemeIds?: string[];
  onToggleSave?: (schemeId: string) => void;
  onResetProfile?: () => void;
  initialStep?: number;
  onViewResults?: () => void;
  onEditAnswers?: () => void;
}

export const EligibilityWizard: React.FC<EligibilityWizardProps> = ({
  t,
  profile,
  setField,
  eligibility,
  schemes,
  onSelectScheme,
  savedSchemeIds = [],
  onToggleSave,
  onResetProfile,
  initialStep = 1,
  onViewResults,
  onEditAnswers,
}) => {
  const router = useRouter();
  const { lang } = useLang();
  const speechSynth = useSpeechSynthesis({ lang });
  const [step, setStep] = useState<number>(() => {
    if (initialStep !== undefined && initialStep > 1) {
      return initialStep;
    }
    return loadConsentGiven() ? (initialStep ?? 1) : 0;
  });
  const totalSteps = 6;

  const handleSelectScheme = (schemeId: string) => {
    if (onSelectScheme) {
      onSelectScheme(schemeId);
    } else {
      router.push(`/schemes/${schemeId}`);
    }
  };

  const handleViewResults = () => {
    if (onViewResults) {
      onViewResults();
    } else {
      router.push('/results');
    }
  };

  const handleEditAnswers = () => {
    if (onEditAnswers) {
      onEditAnswers();
    } else {
      setStep(1);
      router.push('/check');
    }
  };

  // Compute matched schemes
  const eligibleSchemes = schemes.filter(
    (s) => eligibility[s.id]?.status === 'eligible'
  );
  const reviewSchemes = schemes.filter(
    (s) => eligibility[s.id]?.status === 'ineligible'
  );

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6 pb-12">
      {/* Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            {step === 0 ? 'Consent Step — DPDP Act 2023' : `Question ${Math.min(step, totalSteps)} of ${totalSteps}`}
          </span>
          {step > 0 && (
            <button
              onClick={onResetProfile}
              className="text-sm text-faint hover:text-danger transition-colors underline cursor-pointer"
            >
              Reset Profile
            </button>
          )}
        </div>
        <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps Content */}
      <Card className="p-6 md:p-8 shadow-sm">
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-soft p-3 text-primary">
                <ShieldCheckIcon className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-display-card text-content">Data Collection & Privacy Consent</h2>
                <p className="text-sm text-muted mt-0.5">Digital Personal Data Protection (DPDP) Act, 2023</p>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-2 p-6 border border-border-subtle flex flex-col gap-4 text-base text-content">
              <p className="leading-relaxed">
                Before entering your information to check eligibility, please review our data handling practices:
              </p>
              <ul className="list-disc pl-5 space-y-2.5 text-base text-muted">
                <li>
                  <strong className="text-content">What is collected:</strong> Your age, state of residence, gender, caste category, annual household income, and agricultural landholding.
                </li>
                <li>
                  <strong className="text-content">Purpose:</strong> Strictly to evaluate eligibility criteria against official central and state government scheme guidelines.
                </li>
                <li>
                  <strong className="text-content">Storage & Transmission:</strong> Your answers are saved locally on this device in your browser (<code className="text-sm bg-surface-3 px-1.5 py-0.5 rounded font-bold">localStorage</code>). When you calculate matches, your profile values (including annual income and caste) are transmitted in an encrypted HTTPS request to our eligibility rule engine (<code className="text-sm bg-surface-3 px-1.5 py-0.5 rounded font-bold">POST /api/v1/eligibility/match-all</code>) statelessly. They are never stored in any remote server database or user account.
                </li>
                <li>
                  <strong className="text-content">Right to Erasure:</strong> You can permanently erase your stored profile, saved schemes, and document checklists at any time from the Saved page or Privacy Notice.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-subtle">
              <Button
                variant="secondary"
                className="min-h-[48px] px-5 text-base font-semibold"
                onClick={() => router.push('/schemes')}
              >
                Cancel / Browse Schemes Directly
              </Button>
              <Button
                variant="primary"
                className="min-h-[48px] px-6 text-base font-bold flex items-center gap-2"
                onClick={() => {
                  saveConsentGiven(true);
                  setStep(1);
                }}
              >
                I Consent & Continue
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Question 1</p>
              <h2 className="text-2xl font-extrabold text-content mt-1">What is your age?</h2>
              <p className="text-sm text-muted mt-1">Age determines eligibility for youth, pension, and maternity schemes.</p>
            </div>

            <div className="max-w-xs">
              <input
                type="number"
                min="0"
                max="120"
                placeholder="e.g. 35"
                value={profile.age ?? ''}
                onChange={(e) => setField('age', e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-xl border-2 border-border-strong bg-surface p-4 text-2xl font-bold tabular-nums text-content focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <span className="text-xs text-faint">You can skip or change anytime</span>
              <Button variant="primary" className="px-6 tap-target font-semibold" onClick={() => setStep(2)}>
                Next <ArrowRightIcon className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Question 2</p>
              <h2 className="text-2xl font-extrabold text-content mt-1">Which state do you reside in?</h2>
              <p className="text-sm text-muted mt-1">Central schemes apply nationwide; state schemes require residency.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INDIAN_STATES.map((st) => {
                const isSelected = profile.state === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setField('state', st)}
                    className={`p-3.5 rounded-xl border text-sm font-semibold text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
                        : 'border-border-subtle bg-surface-2 text-content hover:bg-surface-3'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" className="px-6 tap-target font-semibold" onClick={() => setStep(3)}>
                Next <ArrowRightIcon className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Question 3</p>
              <h2 className="text-2xl font-extrabold text-content mt-1">What is your gender?</h2>
              <p className="text-sm text-muted mt-1">Certain schemes like Ladli Behna, PMMVY, and Stand-Up India have dedicated women allocations.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t.female, val: 'Female' },
                { label: t.male, val: 'Male' },
                { label: t.other, val: 'Other' },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setField('gender', val)}
                  className={`p-4 rounded-xl border text-base font-bold text-center transition-all ${
                    profile.gender === val
                      ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
                      : 'border-border-subtle bg-surface-2 text-content hover:bg-surface-3'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" className="px-6 tap-target font-semibold" onClick={() => setStep(4)}>
                Next <ArrowRightIcon className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Question 4</p>
              <h2 className="text-2xl font-extrabold text-content mt-1">What is your caste category?</h2>
              <p className="text-sm text-muted mt-1">Stored privately on your device. Used only for affirmative scheme benefits.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t.general, val: 'General' },
                { label: t.obc, val: 'OBC' },
                { label: t.sc, val: 'SC' },
                { label: t.st, val: 'ST' },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setField('caste', val)}
                  className={`p-4 rounded-xl border text-sm font-bold text-left transition-all ${
                    profile.caste === val
                      ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
                      : 'border-border-subtle bg-surface-2 text-content hover:bg-surface-3'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
              <Button variant="primary" className="px-6 tap-target font-semibold" onClick={() => setStep(5)}>
                Next <ArrowRightIcon className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Question 5</p>
              <h2 className="text-2xl font-extrabold text-content mt-1">What is your annual household income?</h2>
              <p className="text-sm text-muted mt-1">Total family income in rupees per year.</p>
            </div>

            <div className="max-w-md">
              <div className="relative">
                <span className="absolute left-4 top-4 text-xl font-bold text-muted">₹</span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="e.g. 1,80,000"
                  value={profile.annual_income ?? ''}
                  onChange={(e) =>
                    setField('annual_income', e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full rounded-xl border-2 border-border-strong bg-surface p-4 pl-9 text-2xl font-bold tabular-nums text-content focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setStep(4)}>Back</Button>
              <Button variant="primary" className="px-6 tap-target font-semibold" onClick={() => setStep(6)}>
                Next <ArrowRightIcon className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Question 6</p>
              <h2 className="text-2xl font-extrabold text-content mt-1">How much agricultural land do you own?</h2>
              <p className="text-sm text-muted mt-1">Enter land in acres (0 if non-farmer).</p>
            </div>

            <div className="max-w-xs">
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 2.5"
                value={profile.landholding_acres ?? ''}
                onChange={(e) =>
                  setField('landholding_acres', e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded-xl border-2 border-border-strong bg-surface p-4 text-2xl font-bold tabular-nums text-content focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setStep(5)}>Back</Button>
              <Button
                variant="primary"
                className="px-6 tap-target font-semibold shadow-md flex items-center gap-2"
                onClick={handleViewResults}
              >
                <SparklesIcon className="h-4 w-4" />
                View Matched Schemes
              </Button>
            </div>
          </div>
        )}

        {/* Step 7: Results View */}
        {step >= 7 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-content">Your Eligibility Results</h2>
                <p className="text-sm text-muted">
                  Based on your age ({profile.age || '—'}), state ({profile.state || 'Any'}), gender ({profile.gender || 'Any'}).
                </p>
              </div>
              <div className="flex items-center gap-2">
                {speechSynth.isSupported && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (speechSynth.isSpeaking) {
                        speechSynth.stop();
                      } else {
                        const eligNames = eligibleSchemes.map((s) => s.name).join(', ');
                        const summary =
                          eligibleSchemes.length > 0
                            ? `You may qualify for ${eligibleSchemes.length} schemes: ${eligNames}.`
                            : 'No direct scheme matches found for your current profile.';
                        speechSynth.speak(summary);
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    aria-label={speechSynth.isSpeaking ? 'Stop reading results' : 'Listen to results summary'}
                  >
                    {speechSynth.isSpeaking ? (
                      <>
                        <StopIcon className="h-3.5 w-3.5 text-danger animate-pulse" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <SpeakerIcon className="h-3.5 w-3.5" />
                        <span>Listen to Summary</span>
                      </>
                    )}
                  </Button>
                )}
                <Button variant="secondary" onClick={handleEditAnswers}>
                  Edit Answers
                </Button>
              </div>
            </div>

            {/* Eligible Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-soft text-success">
                  <CheckCircleIcon className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold text-content">
                  Schemes You May Qualify For ({eligibleSchemes.length})
                </h3>
              </div>

              {eligibleSchemes.length === 0 ? (
                <p className="text-xs text-muted italic bg-surface-2 p-3 rounded-lg">
                  No direct matches found. Try relaxing income or land filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {eligibleSchemes.map((scheme) => (
                    <Card
                      key={scheme.id}
                      className="p-5 border-l-4 border-l-success hover:border-border-strong cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      onClick={() => handleSelectScheme(scheme.id)}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase text-success">Verified Match</span>
                          <Badge variant="neutral">{scheme.category}</Badge>
                        </div>
                        <h4 className="text-base font-bold text-content">{scheme.name}</h4>
                        {scheme.benefit_amount && (
                          <p className="text-sm font-extrabold text-primary tabular-nums">
                            {scheme.benefit_amount}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleSave) {
                              onToggleSave(scheme.id);
                            }
                          }}
                        >
                          {savedSchemeIds.includes(scheme.id) ? 'Saved' : 'Save'}
                        </Button>
                        <Button variant="primary" className="text-xs font-semibold">
                          View Details <ArrowRightIcon className="h-3 w-3 ml-1 inline" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Ineligible Section */}
            {reviewSchemes.length > 0 && (
              <div className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger-soft text-danger">
                    <XCircleIcon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold text-content">
                    Not a Match ({reviewSchemes.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {reviewSchemes.map((scheme) => {
                    const failed = eligibility[scheme.id]?.failed_rules || [];
                    return (
                      <div
                        key={scheme.id}
                        className="p-3.5 rounded-xl border border-border-subtle bg-surface-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-content">{scheme.name}</p>
                          {failed.length > 0 && (
                            <p className="text-danger mt-0.5">Failed: {failed.join(', ')}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          className="text-xs shrink-0"
                          onClick={() => handleSelectScheme(scheme.id)}
                        >
                          View rules
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
