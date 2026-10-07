import { FileX } from 'lucide-react';

export default function EmptyState({ status, month }) {
  const filtered = status && status !== '';
  return (
    <tr>
      <td colSpan={9}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '56px 24px',
            color: 'var(--text-muted)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileX size={28} style={{ color: 'var(--accent-light)', opacity: 0.6 }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              No renewal events found
            </div>
            <div style={{ fontSize: '0.8rem', maxWidth: 320, lineHeight: 1.6 }}>
              {filtered
                ? `No "${status}" renewals for ${month || 'this month'}. Try changing the status filter.`
                : `No renewal events exist for ${month || 'this month'} yet. Use "Generate Renewals" to create them.`}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
