import { RotateCcw } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { SkeletonTable } from './SkeletonTable';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import { formatCents, truncateId, formatDateTime } from '../utils/formatters';

const COLUMNS = [
  'Subscription ID',
  'Customer',
  'Plan',
  'Billing Month',
  'Status',
  'Amount',
  'GST (18%)',
  'Created',
  'Actions',
];

function RenewalRow({ event, onRetry, onSimulateWebhook, retryingId }) {
  const sub = event.subscriptionId;
  const isRetrying = retryingId === event._id;

  return (
    <tr>
      <td>
        <span className="mono text-accent" title={String(sub?._id ?? event.subscriptionId)}>
          {truncateId(sub?._id ?? event.subscriptionId)}
        </span>
      </td>
      <td>
        <span style={{ color: 'var(--text-secondary)' }}>
          {sub?.customerId ?? '—'}
        </span>
      </td>
      <td>
        <span
          style={{
            background: 'rgba(99,102,241,0.1)',
            color: 'var(--accent-light)',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'capitalize',
          }}
        >
          {sub?.plan ?? '—'}
        </span>
      </td>
      <td>
        <span className="mono" style={{ fontSize: '0.82rem' }}>
          {event.billingMonth}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <StatusBadge status={event.status} />
          {event.failureReason && (
            <span
              style={{
                fontSize: '0.68rem',
                color: '#f87171',
                maxWidth: 160,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={event.failureReason}
            >
              ⚠ {event.failureReason}
            </span>
          )}
          {event.chargedAt && (
            <span style={{ fontSize: '0.68rem', color: '#34d399' }}>
              ✓ {formatDateTime(event.chargedAt)}
            </span>
          )}
        </div>
      </td>
      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
        {formatCents(event.amountCents)}
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>
        {formatCents(event.gstCents)}
      </td>
      <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
        {formatDateTime(event.createdAt)}
      </td>
      <td>
        {event.status === 'failed' ? (
          <button
            id={`btn-retry-${event._id}`}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: 6,
              color: '#fca5a5',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.12)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            disabled={isRetrying}
            onClick={() => onRetry?.(event._id)}
            title="Retry failed charge (resets status to scheduled)"
          >
            <RotateCcw
              size={12}
              style={{
                animation: isRetrying ? 'spin 0.7s linear infinite' : 'none',
              }}
            />
            {isRetrying ? 'Retrying…' : 'Retry'}
          </button>
        ) : event.status === 'scheduled' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              id={`btn-sim-charge-${event._id}`}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.7rem',
                padding: '2px 7px',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: 4,
                border: '1px solid rgba(16, 185, 129, 0.25)',
                cursor: 'pointer',
              }}
              disabled={isRetrying}
              onClick={() => onSimulateWebhook?.(event._id, 'charged')}
              title="Simulate provider webhook: charged"
            >
              ⚡ Charge
            </button>
            <button
              id={`btn-sim-fail-${event._id}`}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.7rem',
                padding: '2px 7px',
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: 4,
                border: '1px solid rgba(239, 68, 68, 0.25)',
                cursor: 'pointer',
              }}
              disabled={isRetrying}
              onClick={() => onSimulateWebhook?.(event._id, 'failed', 'Card declined by issuing bank')}
              title="Simulate provider webhook: failed"
            >
              ✕ Fail
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
    </tr>
  );
}

export default function RenewalTable({
  events,
  loading,
  error,
  status,
  month,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onRetry,
  onSimulateWebhook,
  retryingId,
}) {
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
        <table>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={6} cols={COLUMNS.length} />
            ) : error ? (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <div
                    style={{
                      padding: '32px 24px',
                      textAlign: 'center',
                      color: 'var(--danger)',
                      fontSize: '0.875rem',
                    }}
                  >
                    ⚠ {error.message}
                  </div>
                </td>
              </tr>
            ) : events?.length === 0 ? (
              <EmptyState status={status} month={month} />
            ) : (
              events?.map((event) => (
                <RenewalRow
                  key={event._id}
                  event={event}
                  onRetry={onRetry}
                  onSimulateWebhook={onSimulateWebhook}
                  retryingId={retryingId}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
