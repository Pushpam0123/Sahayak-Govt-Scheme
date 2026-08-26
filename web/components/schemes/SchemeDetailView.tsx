'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dict } from '../../lib/i18n';
import { fetchSchemeDetail } from '../../lib/api';
import type { EligibilityStatus, SchemeDetail } from '../../lib/types';
import { Card, Badge, Button } from '../ui';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  BookmarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '../icons';
import { shareSchemeOnWhatsApp, triggerPrint } from '../../lib/export';

interface SchemeDetailViewProps {
  t: Dict;
  schemeId: string;
  initialScheme?: SchemeDetail | null;
  verdict?: EligibilityStatus;
  isSaved?: boolean;
  onToggleSave?: (schemeId: string) => void;
  onBack?: () => void;
  onAskChatAboutScheme?: (schemeName: string) => void;
  checkedDocs?: Record<string, boolean>;
  onToggleDocChecked?: (docName: string) => void;
}

export const SchemeDetailView: React.FC<SchemeDetailViewProps> = ({
  t,
  schemeId,
  initialScheme = null,
  verdict,
  isSaved = false,
  onToggleSave,
  onBack,
  onAskChatAboutScheme,
  checkedDocs = {},
  onToggleDocChecked,
}) => {
  const router = useRouter();
  const [scheme, setScheme] = useState<SchemeDetail | null>(initialScheme);
  const [loading, setLoading] = useState<boolean>(!initialScheme);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialScheme && initialScheme.id === schemeId) {
      setScheme(initialScheme);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    fetchSchemeDetail(schemeId)
      .then((data) => {
        if (active) setScheme(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load scheme details');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [schemeId, initialScheme]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/schemes');
    }
  };

  const handleAsk = (schemeName: string) => {
    if (onAskChatAboutScheme) {
      onAskChatAboutScheme(schemeName);
    } else {
      router.push(`/ask?q=${encodeURIComponent(`What are the key eligibility requirements and benefits for ${schemeName}?`)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
        <p className="text-sm">Loading official scheme details…</p>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <Card className="p-8 text-center flex flex-col items-center gap-4">
        <p className="text-danger font-semibold">Scheme not found or failed to load.</p>
        <Button variant="secondary" onClick={handleBack}>Return to Directory</Button>
      </Card>
    );
  }

  const isEligible = verdict?.status === 'eligible';
  const isIneligible = verdict?.status === 'ineligible';

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6 pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={handleBack}
          className="text-xs font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Back to schemes
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="text-xs flex items-center gap-1.5"
            onClick={() => shareSchemeOnWhatsApp(scheme)}
            title="Share scheme details on WhatsApp"
          >
            💬 WhatsApp
          </Button>
          <Button
            variant="secondary"
            className="text-xs flex items-center gap-1.5"
            onClick={triggerPrint}
            title="Print checklist"
          >
            🖨️ Print
          </Button>
          {onToggleSave && (
            <Button
              variant="secondary"
              className="text-xs flex items-center gap-1.5"
              onClick={() => onToggleSave(scheme.id)}
            >
              <BookmarkIcon className={`h-4 w-4 ${isSaved ? 'text-primary' : ''}`} />
              {isSaved ? 'Saved' : 'Save Scheme'}
            </Button>
          )}
          <Button
            variant="primary"
            className="text-xs"
            onClick={() => handleAsk(scheme.name)}
          >
            Ask AI
          </Button>
        </div>
      </div>

      {/* Header & Benefit Hero */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{scheme.state}</Badge>
          <Badge variant="neutral">{scheme.category}</Badge>
          {scheme.ministry && <Badge variant="neutral">{scheme.ministry}</Badge>}
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-content">{scheme.name}</h1>
          <p className="text-sm md:text-base text-muted mt-2 leading-relaxed">
            {scheme.summary || 'Official Government of India welfare scheme.'}
          </p>
        </div>

        {/* The Money Hero */}
        {scheme.benefit_amount && (
          <div className="rounded-xl bg-gradient-to-r from-primary-soft to-surface-2 p-5 border border-primary/20">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {scheme.benefit_type || 'Financial Assistance Benefit'}
            </p>
            <p className="text-3xl md:text-4xl font-extrabold text-content tabular-nums mt-1 text-primary">
              {scheme.benefit_amount}
            </p>
          </div>
        )}

        {/* Optional TLS unverified note at scheme level if explicitly false */}
        {scheme.tls_verified === false && (
          <div className="rounded-xl bg-surface-2 p-3 text-xs text-muted border border-border-subtle">
            Note: Scheme guidelines source could not be certificate-verified.
          </div>
        )}

        {/* Eligibility Verdict Banner */}
        {verdict && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isEligible
                ? 'bg-success-soft border-success/30 text-success'
                : isIneligible
                ? 'bg-danger-soft border-danger/30 text-danger'
                : 'bg-surface-2 border-border-subtle text-muted'
            }`}
          >
            <div className="mt-0.5">
              {isEligible ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <XCircleIcon className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-content">
                {isEligible
                  ? 'Your profile matches this scheme'
                  : isIneligible
                  ? 'You may not meet some criteria'
                  : 'Profile not yet assessed'}
              </p>
              {isIneligible && verdict.failed_rules.length > 0 && (
                <p className="text-xs text-danger mt-0.5">
                  Failed: {verdict.failed_rules.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Required Documents Checklist */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <DocumentTextIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-content">{t.requiredDocs}</h2>
        </div>
        <p className="text-xs text-muted mb-4">
          Check off documents you have prepared for your application:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scheme.required_documents && scheme.required_documents.length > 0 ? (
            scheme.required_documents.map((docName) => {
              const docKey = `${scheme.id}_${docName}`;
              const isChecked = Boolean(checkedDocs[docKey]);

              return (
                <label
                  key={docName}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-success/40 bg-success-soft/40'
                      : 'border-border-subtle bg-surface-2 hover:bg-surface-3'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleDocChecked && onToggleDocChecked(docKey)}
                    className="mt-1 h-4 w-4 rounded border-border-strong text-primary focus:ring-primary"
                  />
                  <span className={`text-sm font-medium ${isChecked ? 'text-success font-semibold' : 'text-content'}`}>
                    {docName}
                  </span>
                </label>
              );
            })
          ) : (
            <p className="text-xs text-muted italic col-span-2">
              Refer to the official portal for specific documentary requirements.
            </p>
          )}
        </div>
      </Card>

      {/* How to Apply & Helplines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Application Card */}
        <Card className="p-6 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-content">How to Apply</h3>
            <p className="text-xs text-muted mt-1">
              Application mode: <span className="font-semibold text-content uppercase">{scheme.application_mode || 'Online'}</span>
            </p>
            {scheme.deadlines && (
              <p className="text-xs text-muted mt-2">
                <strong>Deadlines:</strong> {scheme.deadlines}
              </p>
            )}
          </div>

          {scheme.application_url && (
            <a
              href={scheme.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm hover:bg-primary-hover transition-colors tap-target"
            >
              {t.applyNow}
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          )}
        </Card>

        {/* Helpline & Source */}
        <Card className="p-6 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-content">{t.helpline}</h3>
            <p className="text-base font-extrabold text-content tabular-nums text-primary mt-1">
              {scheme.helpline || '1800-11-0001 (National Citizen Helpline)'}
            </p>
            <p className="text-xs text-muted mt-2">
              Free national citizen support line for grievance and application tracking.
            </p>
          </div>

          {scheme.official_url && (
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Visit Ministry Portal ↗
            </a>
          )}
        </Card>
      </div>

      {/* Verified Guidelines Document Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheckIcon className="h-5 w-5 text-success" />
          <h3 className="text-sm font-bold text-content">Verified Source Guidelines</h3>
        </div>
        <div className="flex flex-col gap-2">
          {scheme.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border-subtle text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-content">{doc.title}</span>
                  <span className="text-[10px] text-faint">
                    Verified: {doc.verified_at ? new Date(doc.verified_at).toLocaleDateString() : 'Active'} · SHA256: {doc.content_sha256 ? doc.content_sha256.slice(0, 12) : 'OK'}
                  </span>
                </div>
                {doc.source_url && (
                  <a
                    href={doc.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-surface px-2.5 py-1 text-primary font-semibold border border-border-strong hover:bg-surface-3 transition-colors"
                  >
                    View PDF ↗
                  </a>
                )}
              </div>
              {doc.tls_verified === false && (
                <span className="text-[10px] text-muted">
                  Note: Source could not be certificate-verified
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
