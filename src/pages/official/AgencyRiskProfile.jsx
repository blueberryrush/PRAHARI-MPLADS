import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { agencies } from '../../data/mockData';
import { profileAgency } from '../../data/aiEngine';
import { RiskBadge } from '../../components/RiskBadge';
import { RadarChart, LineChart } from '../../components/Charts';
import AnimatedCounter from '../../components/AnimatedCounter';
import { Building2, AlertTriangle, TrendingDown, TrendingUp, Shield, Flag } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function AgencyRiskProfile() {
  const { t, lang } = useLanguage();
  const [selectedAgency, setSelectedAgency] = useState(agencies[0].id);
  const profile = useMemo(() => profileAgency(selectedAgency), [selectedAgency]);

  const sortedAgencies = [...agencies].sort((a, b) => b.riskScore - a.riskScore);
  const critical = agencies.filter(a => a.status === 'critical').length;
  const high = agencies.filter(a => a.status === 'high').length;
  const medium = agencies.filter(a => a.status === 'medium').length;
  const low = agencies.filter(a => a.status === 'low').length;

  return (
    <div className="page-content">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div className="page-header" variants={fadeUp}>
          <h1>{t('agency_title')}</h1>
          <p>{t('agency_subtitle')}</p>
        </motion.div>

        {/* Risk Distribution KPIs */}
        <motion.div className="grid-4" variants={fadeUp} style={{ marginBottom: 24 }}>
          {[
            { icon: <Shield size={24} />, bg: 'rgba(0,184,148,0.1)', color: '#00B894', value: low, label: t('agency_low_risk') },
            { icon: <AlertTriangle size={24} />, bg: 'rgba(253,203,110,0.2)', color: '#E17055', value: medium, label: t('agency_medium_risk') },
            { icon: <TrendingDown size={24} />, bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B', value: high, label: t('agency_high_risk') },
            { icon: <Flag size={24} />, bg: 'rgba(214,48,49,0.1)', color: '#D63031', value: critical, label: t('agency_critical') },
          ].map((card, i) => (
            <motion.div key={i} className="card-stat" variants={fadeUp}>
              <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
              <div className="stat-value"><AnimatedCounter end={card.value} /></div>
              <div className="stat-label">{card.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid-2" style={{ gap: 24 }}>
          {/* Leaderboard */}
          <motion.div variants={fadeUp}>
            <div className="chart-card" style={{ maxHeight: 600, overflow: 'auto' }}>
              <div className="chart-header"><h3 className="chart-title">{t('agency_leaderboard')}</h3></div>
              {sortedAgencies.map((agency, i) => (
                <div
                  key={agency.id}
                  onClick={() => setSelectedAgency(agency.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 4,
                    background: selectedAgency === agency.id ? 'var(--primary-bg)' : 'transparent',
                    border: selectedAgency === agency.id ? '1px solid rgba(0,102,255,0.15)' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: agency.status === 'critical' ? 'var(--gradient-danger)' : agency.status === 'high' ? 'rgba(255,107,107,0.15)' : agency.status === 'medium' ? 'rgba(253,203,110,0.2)' : 'rgba(0,184,148,0.15)',
                    color: agency.status === 'critical' ? 'white' : agency.status === 'high' ? '#FF6B6B' : agency.status === 'medium' ? '#E17055' : '#00B894',
                    fontSize: '0.8rem', fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{agency.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{agency.type} • {agency.totalProjects} {lang === 'hi' ? 'परियोजनाएं' : 'projects'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: agency.riskScore > 70 ? '#D63031' : agency.riskScore > 40 ? '#E17055' : '#00B894' }}>
                      {agency.riskScore}
                    </div>
                    <RiskBadge level={agency.status} size="small" showLabel={false} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Agency Scorecard */}
          <motion.div variants={fadeUp}>
            {profile && (
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">{t('agency_scorecard')}</h3>
                  <RiskBadge level={profile.status} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{profile.name}</h4>
                  <span className="badge badge-neutral">{profile.type}</span>
                </div>

                {/* Risk Score Gauge */}
                <div style={{ textAlign: 'center', marginBottom: 20, padding: 20, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 900, color: profile.riskScore > 70 ? '#D63031' : profile.riskScore > 40 ? '#E17055' : '#00B894' }}>
                    {profile.riskScore}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('agency_risk_score')} / 100</div>
                  <div className="progress-bar" style={{ marginTop: 12, height: 10 }}>
                    <div className={`progress-fill ${profile.riskScore > 70 ? 'red' : profile.riskScore > 40 ? 'yellow' : 'green'}`} style={{ width: `${profile.riskScore}%` }}></div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: t('agency_on_time'), value: `${profile.onTimeRate}%`, color: profile.onTimeRate > 75 ? '#00B894' : '#E17055' },
                    { label: t('agency_within_budget'), value: `${profile.withinBudgetRate}%`, color: profile.withinBudgetRate > 75 ? '#00B894' : '#E17055' },
                    { label: t('agency_quality'), value: `${profile.qualityScore}%`, color: profile.qualityScore > 75 ? '#00B894' : '#E17055' },
                    { label: t('agency_red_flags'), value: profile.redFlags, color: profile.redFlags > 3 ? '#D63031' : profile.redFlags > 0 ? '#E17055' : '#00B894' },
                  ].map((stat, i) => (
                    <div key={i} style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* AI Recommendation */}
                <div style={{
                  padding: 16, borderRadius: 'var(--radius-md)',
                  background: profile.shouldRedFlag ? 'rgba(214,48,49,0.06)' : profile.riskScore > 40 ? 'rgba(253,203,110,0.1)' : 'rgba(0,184,148,0.06)',
                  border: `1px solid ${profile.shouldRedFlag ? 'rgba(214,48,49,0.2)' : profile.riskScore > 40 ? 'rgba(253,203,110,0.3)' : 'rgba(0,184,148,0.2)'}`,
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>{t('agency_recommend')}</div>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{profile.recommendation}</p>
                </div>

                {/* History */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>{t('agency_history')}</div>
                  {profile.history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: h.includes('red flag') || h.includes('fraud') || h.includes('investigation') || h.includes('Blacklisted') ? '#D63031' : h.includes('Excellent') || h.includes('Award') || h.includes('Model') ? '#00B894' : 'var(--text-tertiary)' }}>•</span>
                      {h}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {profile.shouldRedFlag ? (
                    <button className="btn btn-danger" style={{ flex: 1 }}>🚩 {t('agency_flag')}</button>
                  ) : (
                    <button className="btn btn-success" style={{ flex: 1 }}>✅ {t('agency_clear')}</button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Radar Comparison */}
        <motion.div variants={fadeUp} style={{ marginTop: 24 }}>
          <RadarChart
            title={t('agency_compare')}
            labels={[t('agency_on_time'), t('agency_within_budget'), t('agency_quality'), lang === 'hi' ? 'विश्वसनीयता' : 'Reliability', lang === 'hi' ? 'अनुपालन' : 'Compliance']}
            datasets={[
              { label: agencies[0].name.substring(0, 20), data: [agencies[0].onTimeRate, agencies[0].withinBudgetRate, agencies[0].qualityScore, 100 - agencies[0].riskScore, Math.max(0, 100 - agencies[0].redFlags * 10)] },
              { label: agencies[11].name.substring(0, 20), data: [agencies[11].onTimeRate, agencies[11].withinBudgetRate, agencies[11].qualityScore, 100 - agencies[11].riskScore, Math.max(0, 100 - agencies[11].redFlags * 10)] },
            ]}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
