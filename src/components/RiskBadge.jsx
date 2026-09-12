import { useLanguage } from '../contexts/LanguageContext';

export function RiskBadge({ level, showLabel = true, size = 'default' }) {
  const { t } = useLanguage();
  const config = {
    low: { color: '#00B894', bg: 'rgba(0, 184, 148, 0.12)', labelKey: 'badge_low_risk' },
    medium: { color: '#E17055', bg: 'rgba(253, 203, 110, 0.22)', labelKey: 'badge_medium_risk' },
    high: { color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.15)', labelKey: 'badge_high_risk' },
    critical: { color: '#D63031', bg: 'rgba(214, 48, 49, 0.18)', labelKey: 'badge_critical' },
  };
  const c = config[level] || config.low;
  const isSmall = size === 'small';

  return (
    <span
      className={`badge ${level === 'critical' ? 'badge-critical' : ''}`}
      style={{
        background: c.bg,
        color: c.color,
        fontSize: '12px',
        fontWeight: 500,
        padding: isSmall ? '3px 9px' : '5px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span className="risk-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }}></span>
      {showLabel && t(c.labelKey)}
    </span>
  );
}

export function StatusBadge({ status }) {
  const { t } = useLanguage();
  const config = {
    completed: { className: 'badge-success', icon: '✅', labelKey: 'badge_completed' },
    in_progress: { className: 'badge-info', icon: '🔄', labelKey: 'badge_in_progress' },
    delayed: { className: 'badge-danger', icon: '⚠️', labelKey: 'badge_delayed' },
    not_started: { className: 'badge-neutral', icon: '⏳', labelKey: 'badge_not_started' },
  };
  const c = config[status] || config.not_started;
  return (
    <span className={`badge ${c.className}`} style={{ fontSize: '12px', fontWeight: 500, padding: '4px 10px' }}>
      {c.icon} {t(c.labelKey)}
    </span>
  );
}

export function AlertTypeBadge({ type }) {
  const { t } = useLanguage();
  const config = {
    critical: { className: 'badge-critical', icon: '🔴', labelKey: 'badge_critical' },
    warning: { className: 'badge-warning', icon: '🟡', labelKey: 'badge_warning' },
    info: { className: 'badge-info', icon: '🔵', labelKey: 'badge_info' },
  };
  const c = config[type] || config.info;
  return (
    <span className={`badge ${c.className}`} style={{ fontSize: '12px', fontWeight: 500, padding: '4px 10px' }}>
      {c.icon} {t(c.labelKey)}
    </span>
  );
}
