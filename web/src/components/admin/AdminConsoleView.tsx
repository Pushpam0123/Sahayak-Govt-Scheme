import React, { useEffect, useState } from 'react';
import type { Dict } from '../../lib/i18n';
import { fetchAdminStats, fetchRulesQueue, verifySchemeRules } from '../../lib/api';
import type { AdminStats, RulesQueueItem } from '../../lib/types';
import { Card, Badge, Button } from '../ui';
import { ShieldCheckIcon, CheckCircleIcon } from '../icons';

interface AdminConsoleViewProps {
  t: Dict;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({ t }) => {
  const [adminToken, setAdminToken] = useState<string>(
    localStorage.getItem('sahayak_admin_token') || 'dev-admin-token-change-in-prod'
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [queue, setQueue] = useState<RulesQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

  const loadData = () => {
    if (!adminToken) return;
    setLoading(true);
    setAuthError(null);
    localStorage.setItem('sahayak_admin_token', adminToken);

    Promise.all([fetchAdminStats(adminToken), fetchRulesQueue(adminToken)])
      .then(([statsData, queueData]) => {
        setStats(statsData);
        setQueue(queueData);
      })
      .catch((err) => {
        setAuthError(err.message || 'Unauthorized: check your admin token.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (item: RulesQueueItem) => {
    try {
      await verifySchemeRules(
        item.scheme_id,
        item.rules_json,
        'operator@sahayak.gov.in',
        'Verified in admin console',
        adminToken
      );
      setVerifySuccess(`Verified rules for ${item.scheme_name}!`);
      setTimeout(() => setVerifySuccess(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-content">{t.consoleTab}</h1>
          <p className="text-sm text-muted mt-1">
            Administrative monitoring, corpus health, and human rule verification queue.
          </p>
        </div>

        {/* Token Input */}
        <div className="flex items-center gap-2">
          <input
            type="password"
            placeholder="Admin Token…"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs text-content focus:border-primary focus:outline-none"
          />
          <Button variant="secondary" className="text-xs" onClick={loadData} disabled={loading}>
            {loading ? 'Authenticating…' : 'Authenticate'}
          </Button>
        </div>
      </div>

      {authError && (
        <div className="p-4 rounded-xl bg-danger-soft border border-danger/30 text-xs text-danger">
          {authError} (Make sure your token matches <code>ADMIN_TOKEN</code>).
        </div>
      )}

      {verifySuccess && (
        <div className="p-4 rounded-xl bg-success-soft border border-success/30 text-xs text-success flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4" />
          {verifySuccess}
        </div>
      )}

      {/* Stats Tiles */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-5">
            <p className="text-xs text-muted uppercase font-bold tracking-wider">Active Schemes</p>
            <p className="text-2xl font-extrabold text-content tabular-nums mt-1 text-primary">
              {stats.catalogue.active_schemes}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-muted uppercase font-bold tracking-wider">Verified Docs</p>
            <p className="text-2xl font-extrabold text-content tabular-nums mt-1 text-success">
              {stats.catalogue.verified_documents}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-muted uppercase font-bold tracking-wider">Indexed Chunks</p>
            <p className="text-2xl font-extrabold text-content tabular-nums mt-1">
              {stats.catalogue.total_chunks}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-muted uppercase font-bold tracking-wider">Questions Served</p>
            <p className="text-2xl font-extrabold text-content tabular-nums mt-1">
              {stats.usage.total_questions_served}
            </p>
          </Card>
        </div>
      )}

      {/* Rule Verification Queue */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-warn" />
            <h2 className="text-lg font-bold text-content">Rule Verification Queue ({queue.length})</h2>
          </div>
        </div>

        {queue.length === 0 ? (
          <p className="text-xs text-muted italic bg-surface-2 p-4 rounded-xl text-center">
            All scheme eligibility rules are currently verified by operators! Zero backlog.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-border-subtle bg-surface-2 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-content">{item.scheme_name}</h3>
                    <p className="text-xs text-faint">
                      ID: {item.scheme_id} · Extracted by: {item.extracted_by || 'LLM'}
                    </p>
                  </div>
                  <Badge variant="warn">Pending Review</Badge>
                </div>

                <pre className="p-3 rounded-lg bg-surface border border-border-strong text-xs font-mono overflow-x-auto text-content">
                  {JSON.stringify(item.rules_json, null, 2)}
                </pre>

                <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                  <Button
                    variant="primary"
                    className="text-xs font-semibold"
                    onClick={() => handleVerify(item)}
                  >
                    Approve & Verify Rules
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
