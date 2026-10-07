export default function StatCards({ data, loading }) {
  const total = data?.total ?? 0;
  const events = data?.data ?? [];
  const scheduled = events.filter((e) => e.status === 'scheduled').length;
  const charged = events.filter((e) => e.status === 'charged').length;
  const failed = events.filter((e) => e.status === 'failed').length;

  const cards = [
    { label: 'Total Records', value: loading ? '—' : total, color: 'var(--accent-light)' },
    { label: 'Scheduled', value: loading ? '—' : scheduled, color: '#fbbf24' },
    { label: 'Charged', value: loading ? '—' : charged, color: '#34d399' },
    { label: 'Failed', value: loading ? '—' : failed, color: '#f87171' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
      }}
    >
      {cards.map((card) => (
        <div key={card.label} className="glass-card stat-card">
          <div
            className="stat-value"
            style={{
              background: `linear-gradient(135deg, ${card.color}, color-mix(in srgb, ${card.color} 50%, white))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {loading ? (
              <div className="skeleton" style={{ width: 48, height: 32 }} />
            ) : (
              card.value
            )}
          </div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
