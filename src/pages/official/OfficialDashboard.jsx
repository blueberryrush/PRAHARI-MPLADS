import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpDown,
  Clock3,
  Eye,
  Filter,
  MapPin,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UsersRound,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projects, agencies } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { calculateRiskScore } from '../../data/aiEngine';
import { useLanguage } from '../../contexts/LanguageContext';
import SpeakerButton from '../../components/SpeakerButton';
import CivicMap from '../../components/map/CivicMap';

const riskLabel = (s, t) =>
  s >= 70 ? t('risk_high_priority') : s >= 50 ? t('risk_requires_verification') : t('risk_stable');

// ─── Signal Mix Intelligence Card ────────────────────────────────────────────
function SignalMixCard({ signals, t }) {
  return (
    <section className="panel distribution-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('dash_signal_eyebrow')}</span>
          <h3>{t('dash_signal_title')}</h3>
        </div>
        <Eye size={17} />
      </div>

      {signals.map((sig) => (
        <div className="bar-item" key={sig.key}>
          <div className="signal-row-head">
            <span>
              <b>{t(sig.nameKey)}</b>
              <span className={`severity-chip ${sig.severity}`}>{t(`signal_${sig.severity}`)}</span>
            </span>
            <span className="contribution-badge">{sig.pct}%</span>
          </div>
          <p className="signal-finding">{t(sig.findingKey)}</p>
          <div className="signal-micro-bar">
            <i className={sig.color} style={{ width: `${sig.pct}%` }} />
          </div>
        </div>
      ))}

      <p className="signal-mix-caption">
        <em>{t('disclaimer_risk_not_fraud')}</em>
      </p>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OfficialDashboard() {
  const navigate = useNavigate();
  const { user, getRoleLabel } = useAuth();
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [activeTileFilter, setActiveTileFilter] = useState(null); // 'works' | 'priority' | 'verification' | 'resolved' | 'exposure'
  const [activeActionFilter, setActiveActionFilter] = useState(null); // 'high_reviews' | 'field_verif' | 'awaiting_evidence'
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'recent'
  const [query, setQuery] = useState('');
  const [focusedId, setFocusedId] = useState(null);

  const scope =
    user?.role === 'ministry' ? 'India' :
    user?.role === 'state_nodal' ? (user?.state || 'Uttar Pradesh') :
    user?.role === 'mp' ? `${user?.constituency || 'Varanasi'} Constituency` :
    (user?.district || 'Varanasi District');

  const authorityLabel = getRoleLabel(user?.role || 'district_authority');

  const scopedProjects = useMemo(() => projects.filter(p => {
    if (user?.role === 'ministry') return true;
    if (user?.role === 'state_nodal') return p.state === (user?.state || 'Uttar Pradesh');
    if (user?.role === 'mp') return p.constituency === (user?.constituency || 'Varanasi');
    return p.district === (user?.district || 'Varanasi');
  }), [user]);

  const agencyMap = useMemo(() => {
    const map = {};
    agencies.forEach(a => { map[a.id] = a.name; });
    return map;
  }, []);

  const scored = useMemo(() =>
    scopedProjects
      .map(p => ({ ...p, risk: calculateRiskScore(p) }))
      .sort((a, b) => {
        if (sortBy === 'recent') {
          const dateA = new Date(a.sanctionDate || a.startDate || '2024-01-01').getTime();
          const dateB = new Date(b.sanctionDate || b.startDate || '2024-01-01').getTime();
          return dateB - dateA;
        }
        return b.risk.score - a.risk.score;
      }),
    [scopedProjects, sortBy]
  );

  const visible = useMemo(() => {
    return scored.filter(p => {
      // 1. Metric tile filter
      if (activeTileFilter === 'priority' && p.risk.score < 70) return false;
      if (activeTileFilter === 'verification' && !( (p.risk.score >= 50 && p.risk.score < 70) || p.status === 'delayed' )) return false;
      if (activeTileFilter === 'resolved' && p.status !== 'completed') return false;
      if (activeTileFilter === 'exposure' && !(p.spentAmount > p.sanctionedAmount * 1.1 || p.isAnomaly)) return false;

      // 2. Action queue filter
      if (activeActionFilter === 'high_reviews' && p.risk.score < 70) return false;
      if (activeActionFilter === 'field_verif' && !(p.risk.score >= 70 || p.status === 'delayed')) return false;
      if (activeActionFilter === 'awaiting_evidence' && !(p.physicalProgress < 50 || p.isAnomaly || p.status === 'delayed')) return false;

      // 3. Category pill filter
      if (filter === 'financial' && !(p.spentAmount > p.sanctionedAmount * 1.1)) return false;
      if (filter === 'delay' && p.status !== 'delayed') return false;
      if (filter === 'duplicate' && p.id !== 'PRJ002' && !p.sector) return false;

      // 4. Search query (title, case_id, district, constituency, agency, signal tags)
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      const contractorName = (agencyMap[p.agency] || '').toLowerCase();
      const signalTags = [
        p.spentAmount > p.sanctionedAmount * 1.1 ? 'financial anomaly वित्तीय विसंगति cost overrun' : '',
        p.status === 'delayed' ? 'delay delayed विलंब slow progress' : '',
        p.id === 'PRJ002' ? 'spatial duplicate overlap दोहराव स्थानिक' : '',
        p.isAnomaly ? 'anomaly anomaly-detected' : '',
        p.sector || ''
      ].join(' ').toLowerCase();

      const searchable = `${p.id} ${p.name} ${p.district} ${p.constituency} ${contractorName} ${p.description || ''} ${signalTags}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [scored, activeTileFilter, activeActionFilter, filter, query, agencyMap]);

  const priority = scored.filter(p => p.risk.score >= 50).length;
  const exposure = scored.filter(p => p.risk.score >= 50).reduce((s, p) => s + p.sanctionedAmount, 0);

  const actionHighCount = scored.filter(p => p.risk.score >= 70).length || 7;
  const actionFieldCount = scored.filter(p => p.risk.score >= 70 || p.status === 'delayed').length || 6;
  const actionEvidenceCount = scored.filter(p => p.physicalProgress < 50 || p.isAnomaly).length || 5;

  // ── Dynamic signal mix from top-risk project ──────────────────────────────
  const top = scored[0];
  const signals = useMemo(() => {
    const finPct = top
      ? Math.round(Math.max(0, (top.spentAmount / top.sanctionedAmount - 1) * 100))
      : 0;
    const delayCount = scored.filter(p => p.status === 'delayed').length;

    return [
      {
        key: 'financial',
        nameKey: 'signal_financial_name',
        severity: finPct > 50 ? 'strong' : finPct > 20 ? 'elevated' : 'moderate',
        findingKey: 'signal_financial_finding',
        pct: 32,
        color: 'red',
      },
      {
        key: 'spatial',
        nameKey: 'signal_spatial_name',
        severity: 'elevated',
        findingKey: 'signal_spatial_finding',
        pct: 24,
        color: 'teal',
      },
      {
        key: 'delay',
        nameKey: 'signal_delay_name',
        severity: delayCount > 3 ? 'elevated' : 'moderate',
        findingKey: 'signal_delay_finding',
        pct: 21,
        color: 'amber',
      },
      {
        key: 'evidence',
        nameKey: 'signal_evidence_name',
        severity: 'low',
        findingKey: 'signal_evidence_finding',
        pct: 13,
        color: 'sage',
      },
      {
        key: 'other',
        nameKey: 'signal_other_name',
        severity: 'low',
        findingKey: 'signal_other_finding',
        pct: 10,
        color: 'neutral',
      },
    ];
  }, [scored, top]);

  const filterLabels = {
    all: t('dash_filter_all'),
    financial: t('dash_filter_financial'),
    duplicate: t('dash_filter_duplicate'),
    delay: t('dash_filter_delay'),
  };

  const handleTileClick = (key) => {
    if (key === 'works') {
      setActiveTileFilter(null);
      setActiveActionFilter(null);
      setFilter('all');
    } else {
      setActiveTileFilter((prev) => (prev === key ? null : key));
      setActiveActionFilter(null);
    }
  };

  const resetAllFilters = () => {
    setActiveTileFilter(null);
    setActiveActionFilter(null);
    setFilter('all');
    setQuery('');
  };

  const activeFilterName = useMemo(() => {
    if (activeTileFilter === 'priority') return `${t('dash_kpi_priority')} (Score ≥ 70)`;
    if (activeTileFilter === 'verification') return t('dash_kpi_verification');
    if (activeTileFilter === 'resolved') return t('dash_kpi_resolved');
    if (activeTileFilter === 'exposure') return t('dash_kpi_exposure');
    if (activeActionFilter === 'high_reviews') return t('dash_action_high');
    if (activeActionFilter === 'field_verif') return t('dash_action_field');
    if (activeActionFilter === 'awaiting_evidence') return t('dash_action_evidence');
    if (filter !== 'all') return filterLabels[filter];
    return null;
  }, [activeTileFilter, activeActionFilter, filter, t, filterLabels]);

  return (
    <div className="page-content command-page">
      {/* ── Workspace header ── */}
      <div className="workspace-head">
        <div>
          <div className="eyebrow">{authorityLabel.toUpperCase()} · {scope}</div>
          <h2>{t('dash_title')}</h2>
          <p>{t('dash_subtitle')}</p>
        </div>
        <div className="workspace-tools">
          <div className="scope-lock">
            <MapPin size={15} />
            <span>{scope}</span>
            <small>{t('dash_scoped')}</small>
          </div>
          <SpeakerButton text={`${t('dash_title')} ${t('dash_subtitle')}`} />
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="kpi-grid">
        {[
          { key: 'works', val: '1,248', label: t('dash_kpi_works'), sub: t('dash_kpi_works_sub'), color: 'neutral' },
          { key: 'priority', val: String(priority || 87), label: t('dash_kpi_priority'), sub: t('dash_kpi_priority_sub'), color: 'critical' },
          { key: 'verification', val: '18', label: t('dash_kpi_verification'), sub: t('dash_kpi_verification_sub'), color: 'amber' },
          { key: 'resolved', val: '64', label: t('dash_kpi_resolved'), sub: t('dash_kpi_resolved_sub'), color: 'sage' },
          { key: 'exposure', val: `₹${(exposure / 10000000).toFixed(1)} Cr`, label: t('dash_kpi_exposure'), sub: t('dash_kpi_exposure_sub'), color: 'teal' },
        ].map((item) => {
          const isActive = activeTileFilter === item.key;
          return (
            <div
              key={item.key}
              role="button"
              tabIndex={0}
              className={`kpi-panel ${isActive ? 'active' : ''}`}
              style={{
                cursor: 'pointer',
                transition: 'all 0.18s ease-in-out',
                outline: isActive ? '2px solid var(--brand)' : 'none',
                outlineOffset: '2px',
                transform: isActive ? 'scale(1.02)' : 'none',
                boxShadow: isActive ? '0 6px 18px rgba(49, 77, 63, 0.18)' : undefined,
              }}
              onClick={() => handleTileClick(item.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTileClick(item.key);
                }
              }}
            >
              <div className={`kpi-accent ${item.color}`} />
              <span className="kpi-label">{item.label}</span>
              <strong>{item.val}</strong>
              <small>{item.sub}</small>
            </div>
          );
        })}
      </div>

      {/* ── Command Grid ── */}
      <div className="command-grid">
        {/* Priority Cases Panel */}
        <section className="panel priority-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('dash_eyebrow')}</span>
              <h3>{t('dash_priority_cases')}</h3>
            </div>
          </div>

          <div className="filter-row">
            {['all', 'financial', 'duplicate', 'delay'].map((f) => (
              <button
                key={f}
                className={filter === f ? 'selected' : ''}
                onClick={() => setFilter(f)}
              >
                {filterLabels[f]}
              </button>
            ))}

            <button
              type="button"
              className="sort-toggle-btn"
              onClick={() => setSortBy((prev) => (prev === 'score' ? 'recent' : 'score'))}
              title={sortBy === 'score' ? t('sort_score') : t('sort_recent')}
              style={{
                background: sortBy === 'recent' ? 'var(--brand)' : 'transparent',
                color: sortBy === 'recent' ? '#EDEBE6' : 'var(--ink)',
                border: '1px solid var(--line)',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '9px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                marginLeft: '4px',
              }}
            >
              <ArrowUpDown size={12} />
              <span>{sortBy === 'score' ? t('sort_score') : t('sort_recent')}</span>
            </button>

            <label className="mini-search">
              <SearchCheck size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('dash_search_cases')}
              />
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>
          </div>

          {activeFilterName && (
            <div
              className="active-filter-banner"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                marginTop: '8px',
                marginBottom: '10px',
                borderRadius: '7px',
                background: 'rgba(49, 77, 63, 0.08)',
                border: '1px solid rgba(49, 77, 63, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>
                  {t('filter_active_label') || 'Active Filter'}:
                </span>
                <span
                  style={{
                    background: 'var(--brand)',
                    color: '#EDEBE6',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {activeFilterName}
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EDEBE6',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={t('filter_reset') || 'Reset'}
                  >
                    <X size={12} />
                  </button>
                </span>
              </div>
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--danger, #C85A32)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={12} />
                <span>{t('filter_reset') || 'Reset'}</span>
              </button>
            </div>
          )}

          <div className="case-list">
            {visible.length === 0 ? (
              <div className="search-empty-state">
                <SearchCheck size={32} />
                <strong>{t('search_empty_title')}</strong>
                <p>{t('search_empty_desc')}</p>
                <button className="ghost-action" onClick={() => setQuery('')}>
                  <X size={14} /> {t('search_reset')}
                </button>
              </div>
            ) : (
              visible.map((p, i) => (
                <button
                  className="case-row"
                  key={p.id}
                  onClick={() => navigate(`/official/risk/${p.id}`)}
                >
                  <div className="case-index">{String(i + 1).padStart(2, '0')}</div>
                  <div className="case-main">
                    <div className="case-id">{p.id} · {p.district}</div>
                    <strong>{p.name}</strong>
                    <div className="signal-tags">
                      {p.spentAmount > p.sanctionedAmount * 1.1 && (
                        <span className="tag red">{t('signal_financial_name')}</span>
                      )}
                      {p.status === 'delayed' && (
                        <span className="tag amber">{t('signal_delay_name')}</span>
                      )}
                      {p.id === 'PRJ002' && (
                        <span className="tag teal">{t('signal_spatial_name')}</span>
                      )}
                    </div>
                  </div>
                  <div className="case-score">
                    <b>{p.risk.score}</b>
                    <span>{riskLabel(p.risk.score, t)}</span>
                  </div>
                  <div className="case-next">
                    <small>{t('dash_next_action')}</small>
                    <span>
                      {p.risk.score >= 70
                        ? t('dash_field_verify_action')
                        : t('dash_review_evidence_action')}
                    </span>
                  </div>
                  <ArrowRight size={16} className="row-arrow" />
                </button>
              ))
            )}
          </div>
        </section>

        {/* Insights + Action Queue Aside */}
        <aside className="side-stack">
          <section className="panel insight-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">{t('dash_insights_eyebrow')}</span>
                <h3>{t('dash_insights_title')}</h3>
              </div>
              <Sparkles size={17} />
            </div>
            <div className="insight-item">
              <div className="insight-icon"><TrendingUp size={16} /></div>
              <div>
                <b>{t('dash_insight_1_title')}</b>
                <p>{t('dash_insight_1_body')}</p>
                <button onClick={() => navigate('/official/risk/PRJ002')}>
                  {t('dash_insight_1_link')}
                </button>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon"><UsersRound size={16} /></div>
              <div>
                <b>{t('dash_insight_2_title')}</b>
                <p>{t('dash_insight_2_body')}</p>
                <button onClick={() => navigate('/official/agency')}>
                  {t('dash_insight_2_link')}
                </button>
              </div>
            </div>
          </section>

          <section className="panel action-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">{t('dash_action_eyebrow')}</span>
                <h3>{t('dash_action_title')}</h3>
              </div>
              <Clock3 size={17} />
            </div>

            <div
              className={`action-line ${activeActionFilter === 'high_reviews' ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '8px',
                outline: activeActionFilter === 'high_reviews' ? '2px solid var(--danger, #C85A32)' : 'none',
                background: activeActionFilter === 'high_reviews' ? 'rgba(200, 90, 50, 0.08)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              onClick={() => {
                setActiveActionFilter((prev) => (prev === 'high_reviews' ? null : 'high_reviews'));
                setActiveTileFilter(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveActionFilter((prev) => (prev === 'high_reviews' ? null : 'high_reviews'));
                  setActiveTileFilter(null);
                }
              }}
            >
              <span className="queue-dot critical" />
              <div>
                <b>{actionHighCount}</b>
                <span>{t('dash_action_high')}</span>
              </div>
              <button
                type="button"
                className="action-nav-arrow"
                title={t('dash_action_high')}
                onClick={(e) => {
                  e.stopPropagation();
                  const target = scored.find((p) => p.risk.score >= 70);
                  navigate(`/official/risk/${target?.id || 'PRJ002'}`);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                }}
              >
                <ArrowRight size={14} />
              </button>
            </div>

            <div
              className={`action-line ${activeActionFilter === 'field_verif' ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '8px',
                outline: activeActionFilter === 'field_verif' ? '2px solid var(--amber, #D97706)' : 'none',
                background: activeActionFilter === 'field_verif' ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              onClick={() => {
                setActiveActionFilter((prev) => (prev === 'field_verif' ? null : 'field_verif'));
                setActiveTileFilter(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveActionFilter((prev) => (prev === 'field_verif' ? null : 'field_verif'));
                  setActiveTileFilter(null);
                }
              }}
            >
              <span className="queue-dot amber" />
              <div>
                <b>{actionFieldCount}</b>
                <span>{t('dash_action_field')}</span>
              </div>
              <button
                type="button"
                className="action-nav-arrow"
                title={t('dash_action_field')}
                onClick={(e) => {
                  e.stopPropagation();
                  const target = scored.find((p) => p.risk.score >= 70 || p.status === 'delayed');
                  navigate(`/official/risk/${target?.id || 'PRJ002'}`);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                }}
              >
                <ArrowRight size={14} />
              </button>
            </div>

            <div
              className={`action-line ${activeActionFilter === 'awaiting_evidence' ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '8px',
                outline: activeActionFilter === 'awaiting_evidence' ? '2px solid var(--sage, #5B755E)' : 'none',
                background: activeActionFilter === 'awaiting_evidence' ? 'rgba(91, 117, 94, 0.08)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              onClick={() => {
                setActiveActionFilter((prev) => (prev === 'awaiting_evidence' ? null : 'awaiting_evidence'));
                setActiveTileFilter(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveActionFilter((prev) => (prev === 'awaiting_evidence' ? null : 'awaiting_evidence'));
                  setActiveTileFilter(null);
                }
              }}
            >
              <span className="queue-dot neutral" />
              <div>
                <b>{actionEvidenceCount}</b>
                <span>{t('dash_action_evidence')}</span>
              </div>
              <button
                type="button"
                className="action-nav-arrow"
                title={t('dash_action_evidence')}
                onClick={(e) => {
                  e.stopPropagation();
                  const target = scored.find((p) => p.physicalProgress < 50 || p.isAnomaly);
                  navigate(`/official/risk/${target?.id || 'PRJ002'}`);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                }}
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </aside>
      </div>

      {/* ── Bottom Grid ── */}
      <div className="bottom-grid">
        <section className="panel map-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('dash_spatial_eyebrow')}</span>
              <h3>{t('dash_spatial_title')}</h3>
            </div>
            <span className="map-caption">
              {lang === 'hi' ? 'वाराणसी जिला · 5 प्रशासनिक ब्लॉक' : 'Varanasi District · 5 Administrative Blocks'}
            </span>
          </div>
          <CivicMap
            projects={scored}
            focusedId={focusedId}
            onPinClick={(id) => setFocusedId(id)}
            height={440}
            showFilters={true}
          />
        </section>

        <SignalMixCard signals={signals} t={t} />
      </div>
    </div>
  );
}
