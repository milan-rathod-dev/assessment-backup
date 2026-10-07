import { Filter, LayoutList } from 'lucide-react';

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'charged', label: 'Charged' },
  { value: 'failed', label: 'Failed' },
];

const LIMITS = [10, 25, 50, 100];

export default function FilterBar({ status, limit, onStatusChange, onLimitChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <select
          id="filter-status"
          className="select"
          style={{ width: 160 }}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <LayoutList size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Per page
        </span>
        <select
          id="filter-limit"
          className="select"
          style={{ width: 80 }}
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          aria-label="Items per page"
        >
          {LIMITS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
