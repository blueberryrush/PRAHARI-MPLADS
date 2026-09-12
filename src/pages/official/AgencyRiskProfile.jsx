import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { agencies } from '../../data/mockData';
import { profileAgency } from '../../data/aiEngine';
import { RiskBadge } from '../../components/RiskBadge';
import { RadarChart } from '../../components/Charts';
import AnimatedCounter from '../../components/AnimatedCounter';
import { Building2, AlertTriangle, TrendingDown, TrendingUp, Shield, Flag, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function AgencyRiskProfile() {
  const { t, lang } = useLanguage();
  const hi = lang === 'hi';
  const [selectedAgency, setSelectedAgency] = useState(agencies[0].id);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'critical' | 'high' | 'low'
  const profile = useMemo(() => profileAgency(selectedAgency), [selectedAgency]);

  const sortedAgencies = useMemo(() => {
    let list = [...agencies].sort((a, b) => b.riskScore - a.riskScore);
    if (filterType === 'critical') return list.filter(a => a.status === 'critical');
    if (filterType === 'high') return list.filter(a => a.status === 'high' || a.status === 'critical');
    if (filterType === 'low') return list.filter(a => a.status === 'low' || a.status === 'medium');
    return list;
  }, [filterType]);

  const critical = agencies.filter(a => a.status === 'critical').length;
  const high = agencies.filter(a => a.status === 'high').length;
  const medium = agencies.filter(a => a.status === 'medium').length;
  const low = agencies.filter(a => a.status === 'low').length;

  return (
    <div className="page-content agency-risk-page">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        
        {/* Workspace Head */}
        <motion.div className="workspace-head" variants={fadeUp}>
          <div>
            <div className="eyebrow" style={{ color: '#059669' }}>
              {hi ? 'एजेंसी निष्पादन निगरानी' : 'IMPLEMENTING AGENCY INTELLIGENCE'}
            </div>
            <h2>{t('agency_title')}</h2>
            <p>{t('agency_subtitle')}</p>
          </div>

          <div className="demo-notice" style={{ margin: 0 }}>
            <span className="pulse-dot" style={{ background: '#059669' }} />
            <span>{hi ? '१२ पंजीकृत एजेंसियां निगरानी में' : '12 Tracked Executing Agencies'}</span>
          </div>
        </motion.div>

        {/* Risk Distribution KPI Grid */}
        <motion.div className="kpi-grid" variants={fadeUp} style={{ marginBottom: 20 }}>
          <div className="kpi-panel">
            <div className="kpi-accent sage" />
            <span className="kpi-label">{t('agency_low_risk')}</span>
            <strong style={{ color: '#059669' }}><AnimatedCounter end={low} /></strong>
            <small>Compliant execution</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent amber" />
            <span className="kpi-label">{t('agency_medium_risk')}</span>
            <strong style={{ color: '#D97706' }}><AnimatedCounter end={medium} /></strong>
            <small>Routine audits flagged</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent critical" />
            <span className="kpi-label">{t('agency_high_risk')}</span>
            <strong style={{ color: '#C85A32' }}><AnimatedCounter end={high} /></strong>
            <small>Requires field verification</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent critical" />
            <span className="kpi-label">{t('agency_critical')}</span>
            <strong style={{ color: '#C85A32' }}><AnimatedCounter end={critical} /></strong>
            <small>Recommended for sanction hold</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent teal" />
            <span className="kpi-label">{hi ? 'कुल ठेके' : 'Total Works Scanned'}</span>
            <strong>{agencies.reduce((s, a) => s + a.totalProjects, 0)}</strong>
            <small>Across all constituencies</small>
          </div>
        </motion.div>

        {/* Main 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.2fr)', gap: 20, marginBottom: 24 }}>
          
          {/* Left Column: Leaderboard Panel */}
          <motion.div variants={fadeUp} className="panel" style={{ padding: 24 }}>
            <div className="panel-head" style={{ marginBottom: 16 }}>
              <div>
                <span className="eyebrow">{hi ? 'जोखिम रैंकिंग' : 'RISK RANKING'}</span>
                <h3>{t('agency_leaderboard')}</h3>
              </div>

              {/* Quick filter chips */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'all', label: hi ? 'सभी' : 'All' },
                  { key: 'critical', label: hi ? 'गंभीर' : 'Critical' },
                  { key: 'low', label: hi ? 'विश्वसनीय' : 'Stable' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterType(tab.key)}
                    style={{
                      background: filterType === tab.key ? '#1E3A2B' : 'transparent',
                      color: filterType === tab.key ? '#34D399' : 'var(--muted)',
                      border: filterType === tab.key ? '1px solid #2D5A3E' : '1px solid var(--line)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 520, overflowY: 'auto' }}>
              {sortedAgencies.map((agency, i) => {
                const isSelected = selectedAgency === agency.id;
                const isCrit = agency.riskScore >= 70;
                const isHigh = agency.riskScore >= 50 && agency.riskScore < 70;
                const riskColor = isCrit ? '#C85A32' : isHigh ? '#D97706' : '#059669';

                return (
                  <div
                    key={agency.id}
                    onClick={() => setSelectedAgency(agency.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(5, 150, 105, 0.08)' : 'var(--surface)',
                      border: isSelected ? '1px solid #059669' : '1px solid var(--line)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      background: isCrit ? 'rgba(200, 90, 50, 0.15)' : 'rgba(5, 150, 105, 0.12)',
                      color: riskColor,
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {i + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {agency.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        <code>{agency.id}</code> · {agency.type} · {agency.totalProjects} {hi ? 'परियोजनाएं' : 'works'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <b style={{ fontSize: 16, color: riskColor, display: 'block', letterSpacing: '-0.03em' }}>
                        {agency.riskScore}
                      </b>
                      <span style={{ fontSize: 9, fontWeight: 700, color: riskColor, textTransform: 'uppercase' }}>
                        {agency.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column: Detailed Scorecard Panel */}
          <motion.div variants={fadeUp} className="panel" style={{ padding: 24 }}>
            {profile ? (
              <div>
                <div className="panel-head" style={{ marginBottom: 16 }}>
                  <div>
                    <span className="eyebrow">{hi ? 'दस्तावेज़ और विश्लेषण' : 'DETAILED AUDIT SCORECARD'}</span>
                    <h3>{profile.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                      ID: <code>{profile.id}</code> · Category: <b>{profile.type}</b> · Active Works: <b>{profile.totalProjects}</b>
                    </p>
                  </div>
                  <RiskBadge level={profile.status} />
                </div>

                {/* Score Gauge Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: 16,
                  borderRadius: 12,
                  background: profile.riskScore > 70 ? 'rgba(200, 90, 50, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                  border: `1px solid ${profile.riskScore > 70 ? 'rgba(200, 90, 50, 0.25)' : 'rgba(5, 150, 105, 0.25)'}`,
                  marginBottom: 18
                }}>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{
                      fontSize: 34,
                      fontWeight: 900,
                      letterSpacing: '-0.04em',
                      color: profile.riskScore > 70 ? '#C85A32' : profile.riskScore > 40 ? '#D97706' : '#059669',
                      lineHeight: 1
                    }}>
                      {profile.riskScore}
                    </div>
                    <small style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>/ 100 Index</small>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                      <span>{t('agency_risk_score')}</span>
                      <span style={{ color: profile.riskScore > 70 ? '#C85A32' : '#059669' }}>
                        {profile.riskScore > 70 ? 'High Risk Assessment' : 'Acceptable Track Record'}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--line)', borderRadius: 6, overflow: 'hidden' }}>
                      <div 
                        style={{
                          width: `${profile.riskScore}%`,
                          height: '100%',
                          borderRadius: 6,
                          background: profile.riskScore > 70 ? '#C85A32' : profile.riskScore > 40 ? '#D97706' : '#059669'
                        }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('agency_on_time')}</span>
                    <b style={{ fontSize: 16, color: profile.onTimeRate >= 70 ? '#059669' : '#C85A32' }}>{profile.onTimeRate}%</b>
                  </div>

                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('agency_within_budget')}</span>
                    <b style={{ fontSize: 16, color: profile.withinBudgetRate >= 70 ? '#059669' : '#C85A32' }}>{profile.withinBudgetRate}%</b>
                  </div>

                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('agency_quality')}</span>
                    <b style={{ fontSize: 16, color: profile.qualityScore >= 70 ? '#059669' : '#D97706' }}>{profile.qualityScore}%</b>
                  </div>

                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t('agency_red_flags')}</span>
                    <b style={{ fontSize: 16, color: profile.redFlags > 0 ? '#C85A32' : '#059669' }}>{profile.redFlags}</b>
                  </div>
                </div>

                {/* AI Directive Box */}
                <div style={{
                  padding: 14,
                  borderRadius: 10,
                  background: profile.shouldRedFlag ? 'rgba(200, 90, 50, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                  border: `1px solid ${profile.shouldRedFlag ? 'rgba(200, 90, 50, 0.25)' : 'rgba(5, 150, 105, 0.25)'}`,
                  marginBottom: 18
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: profile.shouldRedFlag ? '#C85A32' : '#059669', marginBottom: 6 }}>
                    <ShieldAlert size={14} />
                    <span>{t('agency_recommend').toUpperCase()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--ink)' }}>
                    {profile.recommendation}
                  </p>
                </div>

                {/* Audit History Timeline */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    {t('agency_history')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {profile.history.map((h, idx) => {
                      const isAlert = h.includes('red flag') || h.includes('fraud') || h.includes('investigation') || h.includes('Blacklisted');
                      const isGood = h.includes('Excellent') || h.includes('Award') || h.includes('Model');
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--ink)' }}>
                          <span style={{ color: isAlert ? '#C85A32' : isGood ? '#059669' : 'var(--muted)', marginTop: 2 }}>•</span>
                          <span>{h}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {profile.shouldRedFlag ? (
                    <button 
                      type="button" 
                      className="primary-action" 
                      style={{ flex: 1, background: '#C85A32', borderColor: '#C85A32' }}
                    >
                      <Flag size={14} />
                      <span>{t('agency_flag')}</span>
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="primary-action" 
                      style={{ flex: 1, background: '#059669', borderColor: '#059669' }}
                    >
                      <CheckCircle2 size={14} />
                      <span>{t('agency_clear')}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>

        {/* Radar Comparison Card */}
        <motion.div variants={fadeUp} className="p-6 rounded-xl border border-stone-800 bg-stone-900/90 dark:bg-stone-900/90" style={{ marginBottom: 24 }}>
          <div className="panel-head" style={{ marginBottom: 16 }}>
            <div>
              <span className="eyebrow text-xs font-medium" style={{ color: '#059669' }}>
                {hi ? 'तुलनात्मक प्रदर्शन' : 'CROSS-AGENCY COMPARATIVE ANALYSIS'}
              </span>
              <h3 className="text-sm font-bold text-stone-100">{t('agency_compare')}</h3>
            </div>
          </div>
          <RadarChart
            title={t('agency_compare')}
            labels={[t('agency_on_time'), t('agency_within_budget'), t('agency_quality'), hi ? 'विश्वसनीयता' : 'Reliability', hi ? 'अनुपालन' : 'Compliance']}
            datasets={[
              { 
                label: `${agencies[0]?.name?.substring(0, 24) || 'Agency A'} (Benchmark)`, 
                data: [agencies[0]?.onTimeRate || 70, agencies[0]?.withinBudgetRate || 65, agencies[0]?.qualityScore || 70, 100 - (agencies[0]?.riskScore || 40), Math.max(0, 100 - (agencies[0]?.redFlags || 0) * 10)],
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.2)',
                pointBackgroundColor: '#059669',
              },
              { 
                label: `${agencies[11]?.name?.substring(0, 24) || 'Agency B'} (Audited Outlier)`, 
                data: [agencies[11]?.onTimeRate || 40, agencies[11]?.withinBudgetRate || 35, agencies[11]?.qualityScore || 42, 100 - (agencies[11]?.riskScore || 85), Math.max(0, 100 - (agencies[11]?.redFlags || 0) * 10)],
                borderColor: '#C85A32',
                backgroundColor: 'rgba(200, 90, 50, 0.2)',
                pointBackgroundColor: '#C85A32',
              },
            ]}
          />
        </motion.div>

      </motion.div>
    </div>
  );
}
