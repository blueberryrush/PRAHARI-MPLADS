export function RiskBadge({ level, showLabel = true, size = 'default' }) {
  const config = {
    low: { color: '#00B894', bg: 'rgba(0, 184, 148, 0.1)', label: 'Low Risk' },
    medium: { color: '#E17055', bg: 'rgba(253, 203, 110, 0.2)', label: 'Medium Risk' },
    high: { color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)', label: 'High Risk' },
    critical: { color: '#D63031', bg: 'rgba(214, 48, 49, 0.15)', label: 'Critical' },
  };
  const c = config[level] || config.low;
  const isSmall = size === 'small';

  return (
    <span
      className={`badge ${level === 'critical' ? 'badge-critical' : ''}`}
      style={{
        background: c.bg,
        color: c.color,
        fontSize: isSmall ? '10px' : '12px',
        padding: isSmall ? '2px 8px' : '4px 10px',
      }}
    >
      <span className="risk-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }}></span>
      {showLabel && c.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = {
    completed: { className: 'badge-success', label: '✅ Completed' },
    in_progress: { className: 'badge-info', label: '🔄 In Progress' },
    delayed: { className: 'badge-danger', label: '⚠️ Delayed' },
    not_started: { className: 'badge-neutral', label: '⏳ Not Started' },
  };
  const c = config[status] || config.not_started;
  return <span className={`badge ${c.className}`}>{c.label}</span>;
}

export function AlertTypeBadge({ type }) {
  const config = {
    critical: { className: 'badge-critical', label: '🔴 Critical' },
    warning: { className: 'badge-warning', label: '🟡 Warning' },
    info: { className: 'badge-info', label: '🔵 Info' },
  };
  const c = config[type] || config.info;
  return <span className={`badge ${c.className}`}>{c.label}</span>;
}
