import { useState, useCallback } from 'react';
import {
  CalendarDays,
  RefreshCw,
  Activity,
  ChevronRight,
} from 'lucide-react';

import { useRenewals } from './hooks/useRenewals';
import { useToast } from './hooks/useToast';
import { retryRenewal, simulateWebhook } from './api/renewalsApi';
import { getCurrentMonth, isValidMonth, formatMonthLabel } from './utils/formatters';

import ToastContainer from './components/ToastContainer';
import GeneratePanel from './components/GeneratePanel';
import FilterBar from './components/FilterBar';
import RenewalTable from './components/RenewalTable';
import StatCards from './components/StatCards';

const CURRENT_MONTH = getCurrentMonth();

export default function App() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [monthError, setMonthError] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  const { toasts, showToast, removeToast } = useToast();

  const safeMonth = isValidMonth(month) ? month : undefined;
  const { data, loading, error, refetch } = useRenewals({
    month: safeMonth,
    page,
    limit,
    status: status || undefined,
  });

  const handleMonthChange = (e) => {
    const val = e.target.value;
    setMonth(val);
    setPage(1);
    if (val && !isValidMonth(val)) {
      setMonthError('Format must be YYYY-MM (e.g. 2024-03)');
    } else {
      setMonthError('');
    }
  };

  const handleStatusChange = useCallback((s) => {
    setStatus(s);
    setPage(1);
  }, []);

  const handleLimitChange = useCallback((l) => {
    setLimit(l);
    setPage(1);
  }, []);

  const handleGenerateSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRetry = useCallback(async (id) => {
    setRetryingId(id);
    try {
      await retryRenewal(id);
      showToast({
        type: 'success',
        title: 'Charge Retried',
        body: 'Status reset to scheduled. The renewal event is now queued for billing.',
      });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Retry Failed',
        body: err.message,
      });
    } finally {
      setRetryingId(null);
    }
  }, [refetch, showToast]);

  const handleSimulateWebhook = useCallback(async (id, outcome, failureReason) => {
    setRetryingId(id);
    try {
      await simulateWebhook(id, outcome, failureReason);
      showToast({
        type: outcome === 'charged' ? 'success' : 'warning',
        title: `Webhook: ${outcome.toUpperCase()}`,
        body: outcome === 'charged'
          ? 'Payment succeeded! Renewal marked as charged.'
          : `Payment failed: ${failureReason ?? 'Declined'}`,
      });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Simulation Failed',
        body: err.message,
      });
    } finally {
      setRetryingId(null);
    }
  }, [refetch, showToast]);

  return (
    <>
      <header className="app-header">
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px var(--accent-glow)',
              }}
            >
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                MonthStick
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Renewal Console
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 16,
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}
          >
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {isValidMonth(month) ? formatMonthLabel(month) : 'Dashboard'}
            </span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              id="btn-refresh"
              className="btn btn-ghost btn-icon"
              onClick={refetch}
              disabled={loading}
              title="Refresh data"
              aria-label="Refresh"
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 0.65s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
          padding: '28px 24px 48px',
          display: 'flex',
          gap: 24,
        }}
      >
        <aside
          style={{
            width: 260,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div className="glass-card" style={{ padding: '20px 18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <CalendarDays size={15} style={{ color: 'var(--accent-light)' }} />
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Billing Month
              </span>
            </div>

            <div className="input-group">
              <input
                id="input-month"
                type="month"
                className={`input${monthError ? ' error' : ''}`}
                value={month}
                onChange={handleMonthChange}
                aria-label="Select billing month"
                aria-describedby={monthError ? 'month-error' : undefined}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem' }}
              />
              {monthError && (
                <span id="month-error" className="input-error">
                  {monthError}
                </span>
              )}
            </div>

            {isValidMonth(month) && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                }}
              >
                {formatMonthLabel(month)}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '20px 18px' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              Actions
            </div>
            <GeneratePanel
              month={month}
              onSuccess={handleGenerateSuccess}
              showToast={showToast}
            />
          </div>

          <div
            className="glass-card"
            style={{
              padding: '16px 18px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              lineHeight: 1.7,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Business Rules
            </div>
            <ul style={{ paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>All dates in UTC</li>
              <li>GST = 18% (Banker's rounding)</li>
              <li>Max 200 records/page</li>
              <li><span style={{ color: '#34d399' }}>charged</span> status is final</li>
            </ul>
          </div>
        </aside>

        <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              Renewal Events
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isValidMonth(month)
                ? `Showing renewal data for ${formatMonthLabel(month)}`
                : 'Select a valid billing month to view events'}
            </p>
          </div>

          <StatCards data={data} loading={loading} />

          <div className="divider" />

          <FilterBar
            status={status}
            limit={limit}
            onStatusChange={handleStatusChange}
            onLimitChange={handleLimitChange}
          />

          <RenewalTable
            events={data?.data}
            loading={loading}
            error={error}
            status={status}
            month={month}
            page={page}
            totalPages={data?.totalPages ?? 0}
            total={data?.total ?? 0}
            limit={limit}
            onPageChange={setPage}
            onRetry={handleRetry}
            onSimulateWebhook={handleSimulateWebhook}
            retryingId={retryingId}
          />
        </section>
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
