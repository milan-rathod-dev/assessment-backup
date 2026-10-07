import { useState } from 'react';
import { Zap, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { generateRenewals } from '../api/renewalsApi';
import { isValidMonth, formatMonthLabel } from '../utils/formatters';

export default function GeneratePanel({ month, onSuccess, showToast }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fieldError, setFieldError] = useState('');

  const handleGenerate = async () => {
    setResult(null);
    setFieldError('');

    if (!isValidMonth(month)) {
      setFieldError('Please enter a valid month (YYYY-MM) in the month picker above.');
      return;
    }

    setLoading(true);
    try {
      const data = await generateRenewals(month);
      setResult(data);
      showToast({
        type: 'success',
        title: 'Renewals generated!',
        body: `${data.newlyCreated} new · ${data.existingCount} already existed`,
      });
      onSuccess?.();
    } catch (err) {
      const monthDetail = err.details?.find((d) => d.field === 'month');
      if (monthDetail) {
        setFieldError(monthDetail.message);
      } else {
        showToast({ type: 'error', title: 'Generation failed', body: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        id="btn-generate-renewals"
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {loading ? (
          <><span className="spinner" /> Generating…</>
        ) : (
          <><Zap size={16} /> Generate Renewals</>
        )}
      </button>

      {fieldError && (
        <div className="banner banner-error" style={{ fontSize: '0.8rem' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {fieldError}
        </div>
      )}

      {result && (
        <div className="banner banner-success">
          <CheckCircle size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>{formatMonthLabel(result.billingMonth)}</strong>
            {' — '}
            <span style={{ color: '#34d399' }}>{result.newlyCreated} created</span>
            {result.existingCount > 0 && (
              <span style={{ opacity: 0.7 }}> · {result.existingCount} already existed</span>
            )}
          </div>
          <button
            className="toast-close"
            onClick={() => setResult(null)}
            aria-label="Dismiss"
            style={{ marginLeft: 'auto' }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
