import { Clock, CheckCircle, XCircle } from 'lucide-react';

const CONFIG = {
  scheduled: { label: 'Scheduled', Icon: Clock,         cls: 'badge-scheduled' },
  charged:   { label: 'Charged',   Icon: CheckCircle,   cls: 'badge-charged'   },
  failed:    { label: 'Failed',    Icon: XCircle,        cls: 'badge-failed'    },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { label: status, Icon: Clock, cls: '' };
  const { label, Icon, cls } = cfg;
  return (
    <span className={`badge ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}
