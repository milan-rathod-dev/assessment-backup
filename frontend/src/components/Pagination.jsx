import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getPageNumbers } from '../utils/formatters';

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 0) return null;

  const pages = getPageNumbers(page, totalPages);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}
    >
      <span>
        Showing <strong style={{ color: 'var(--text-secondary)' }}>{start}–{end}</strong>{' '}
        of <strong style={{ color: 'var(--text-secondary)' }}>{total}</strong> records
      </span>

      <div className="pagination">
        <button
          id="page-first"
          className="btn btn-ghost btn-icon page-btn"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="First page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          id="page-prev"
          className="btn btn-ghost btn-icon page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              id={`page-${p}`}
              className={`btn btn-ghost btn-icon page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          id="page-next"
          className="btn btn-ghost btn-icon page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
        <button
          id="page-last"
          className="btn btn-ghost btn-icon page-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          title="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
