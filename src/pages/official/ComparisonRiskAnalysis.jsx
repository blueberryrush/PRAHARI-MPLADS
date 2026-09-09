import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { projects, benchmarks } from '../../data/mockData';
import { findRedFlagScenarios, compareProjects } from '../../data/aiEngine';
import AnimatedCounter from '../../components/AnimatedCounter';
import { BarChart, ScatterChart } from '../../components/Charts';
import { GitCompare, AlertTriangle, CheckCircle, Flag, TrendingUp } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function ComparisonRiskAnalysis() {
  const { t, lang } = useLanguage();
  const redFlagScenarios = useMemo(() => findRedFlagScenarios(projects), []);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');

  const manualComparison = useMemo(() => {
    if (!selectedA || !selectedB || selectedA === selectedB) return null;
    const pA = projects.find(p => p.id === selectedA);
    const pB = projects.find(p => p.id === selectedB);
    if (!pA || !pB) return null;
    return compareProjects(pA, pB);
  }, [selectedA, selectedB]);

  const totalRedFlags = redFlagScenarios.length;
  const costFlags = redFlagScenarios.filter(s => s.costRedFlag).length;
  const timeFlags = redFlagScenarios.filter(s => s.timeRedFlag).length;

  return (
    <div className="page-content">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div className="page-header" variants={fadeUp}>
          <h1>{t('comp_title')}</h1>
          <p>{t('comp_subtitle')}</p>
        </motion.div>

        {/* KPIs */}
        <motion.div className="grid-4" variants={fadeUp} style={{ marginBottom: 24 }}>
          {[
            { icon: <Flag size={24} />, bg: 'rgba(214,48,49,0.1)', color: '#D63031', value: totalRedFlags, label: lang === 'hi' ? 'रेड फ्लैग परिदृश्य' : 'Red Flag Scenarios' },
            { icon: <TrendingUp size={24} />, bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B', value: costFlags, label: t('comp_cost_deviation') },
            { icon: <AlertTriangle size={24} />, bg: 'rgba(253,203,110,0.2)', color: '#E17055', value: timeFlags, label: t('comp_time_deviation') },
            { icon: <CheckCircle size={24} />, bg: 'rgba(0,184,148,0.1)', color: '#00B894', value: projects.length - totalRedFlags, label: t('comp_green') },
          ].map((card, i) => (
            <motion.div key={i} className="card-stat" variants={fadeUp}>
              <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
              <div className="stat-value"><AnimatedCounter end={card.value} /></div>
              <div className="stat-label">{card.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Manual Comparison */}
        <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
          <div className="chart-card">
            <div className="chart-header"><h3 className="chart-title">🔍 {t('comp_select_projects')}</h3></div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <select className="select" style={{ flex: 1, minWidth: 200 }} value={selectedA} onChange={e => setSelectedA(e.target.value)}>
                <option value="">{t('dup_project_a')}...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name.substring(0, 40)}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="vs-badge">VS</div>
              </div>
              <select className="select" style={{ flex: 1, minWidth: 200 }} value={selectedB} onChange={e => setSelectedB(e.target.value)}>
                <option value="">{t('dup_project_b')}...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name.substring(0, 40)}</option>)}
              </select>
            </div>

            {manualComparison && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <div className="comparison-container">
                  <div className={`comparison-card ${!manualComparison.isRedFlag ? 'green' : ''}`}>
                    <h4 style={{ marginBottom: 12, fontSize: '0.95rem' }}>{manualComparison.projectA.name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('comp_actual_cost')}</span><div style={{ fontWeight: 700 }}>₹{(manualComparison.projectA.spentAmount / 100000).toFixed(1)}L</div></div>
                      <div><span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{lang === 'hi' ? 'अवधि' : 'Duration'}</span><div style={{ fontWeight: 700 }}>{manualComparison.timeAMonths} {t('common_months')}</div></div>
                      <div><span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('common_sector')}</span><div style={{ fontWeight: 500 }}>{manualComparison.projectA.sector}</div></div>
                      <div><span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('fin_status')}</span><div style={{ fontWeight: 500 }}>{manualComparison.projectA.status}</div></div>
                    </div>
                  </div>

                  <div className="comparison-vs"><div className="vs-badge">VS</div></div>

                  <div className={`comparison-card ${manualComparison.isRedFlag ? 'red-flagged' : 'green'}`}>
                    <h4 style={{ marginBottom: 12, fontSize: '0.95rem' }}>{manualComparison.projectB.name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('comp_actual_cost')}</span><div style={{ fontWeight: 700, color: manualComparison.costRedFlag ? '#D63031' : 'inherit' }}>₹{(manualComparison.projectB.spentAmount / 100000).toFixed(1)}L</div></div>
                      <div><span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{lang === 'hi' ? 'अवधि' : 'Duration'}</span><div style={{ fontWeight: 700, color: manualComparison.timeRedFlag ? '#D63031' : 'inherit' }}>{manualComparison.timeBMonths} {t('common_months')}</div></div>
                      <div><span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('common_sector')}</span><div style={{ fontWeight: 500 }}>{manualComparison.projectB.sector}</div></div>
                      <div><span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{t('fin_status')}</span><div style={{ fontWeight: 500 }}>{manualComparison.projectB.status}</div></div>
                    </div>
                  </div>
                </div>

                {/* Deviation badges */}
                <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: manualComparison.costRedFlag ? 'rgba(214,48,49,0.1)' : 'rgba(0,184,148,0.1)', fontWeight: 700, fontSize: '0.85rem', color: manualComparison.costRedFlag ? '#D63031' : '#00B894' }}>
                    {t('comp_cost_deviation')}: {manualComparison.costDiff > 0 ? '+' : ''}{manualComparison.costDiff}% {manualComparison.costRedFlag ? '🚩' : '✅'}
                  </div>
                  <div style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: manualComparison.timeRedFlag ? 'rgba(214,48,49,0.1)' : 'rgba(0,184,148,0.1)', fontWeight: 700, fontSize: '0.85rem', color: manualComparison.timeRedFlag ? '#D63031' : '#00B894' }}>
                    {t('comp_time_deviation')}: {manualComparison.timeDiff > 0 ? '+' : ''}{manualComparison.timeDiff}% {manualComparison.timeRedFlag ? '🚩' : '✅'}
                  </div>
                </div>

                {manualComparison.reasons.length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(214,48,49,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(214,48,49,0.15)' }}>
                    {manualComparison.reasons.map((r, i) => <div key={i} style={{ fontSize: '0.85rem', color: '#D63031', marginBottom: 4 }}>⚠️ {r}</div>)}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Auto-detected Red Flags */}
        <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">🚩 {t('comp_scenario_title')}</h3>
              <span className="badge badge-critical">{redFlagScenarios.length} {lang === 'hi' ? 'पाए गए' : 'detected'}</span>
            </div>

            {redFlagScenarios.slice(0, 6).map((scenario, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  padding: 16, marginBottom: 12, borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(214,48,49,0.2)', background: 'rgba(214,48,49,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <span className="badge badge-critical" style={{ marginBottom: 8, display: 'inline-flex' }}>{t('comp_red_flag')}</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{scenario.projectA.sector}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    {scenario.costRedFlag && <div style={{ color: '#D63031', fontWeight: 700 }}>{t('comp_cost_deviation')}: {scenario.costDiff > 0 ? '+' : ''}{scenario.costDiff}%</div>}
                    {scenario.timeRedFlag && <div style={{ color: '#E17055', fontWeight: 700 }}>{t('comp_time_deviation')}: {scenario.timeDiff > 0 ? '+' : ''}{scenario.timeDiff}%</div>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                  <div style={{ padding: 10, background: 'rgba(0,184,148,0.05)', borderRadius: 8, border: '1px solid rgba(0,184,148,0.15)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>✅ {scenario.projectA.id}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 2 }}>{scenario.projectA.name.substring(0, 35)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹{(scenario.projectA.spentAmount / 100000).toFixed(1)}L • {scenario.timeAMonths}m</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--primary)' }}>VS</div>
                  <div style={{ padding: 10, background: 'rgba(214,48,49,0.05)', borderRadius: 8, border: '1px solid rgba(214,48,49,0.15)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D63031' }}>🚩 {scenario.projectB.id}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 2 }}>{scenario.projectB.name.substring(0, 35)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#D63031', fontWeight: 600 }}>₹{(scenario.projectB.spentAmount / 100000).toFixed(1)}L • {scenario.timeBMonths}m</div>
                  </div>
                </div>
                {scenario.reasons.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#D63031' }}>
                    {scenario.reasons.map((r, i) => <span key={i}>⚠️ {r}{i < scenario.reasons.length - 1 ? ' | ' : ''}</span>)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benchmark Database */}
        <motion.div variants={fadeUp}>
          <div className="chart-card">
            <div className="chart-header"><h3 className="chart-title">📊 {t('comp_benchmark_db')}</h3></div>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('comp_project_type')}</th>
                    <th>{t('comp_avg_cost')}</th>
                    <th>{t('comp_avg_time')}</th>
                    <th>{lang === 'hi' ? 'लागत सीमा' : 'Cost Threshold'}</th>
                    <th>{lang === 'hi' ? 'समय सीमा' : 'Time Threshold'}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(benchmarks).map(([sector, data]) => (
                    <tr key={sector}>
                      <td style={{ fontWeight: 600 }}>{sector}</td>
                      <td>₹{(data.avgCostPerKm || data.avgCostPerUnit || data.avgCostPerRoom || data.avgCostPerCenter || data.avgCostPerHall || data.avgCostPerLight || data.avgCostPerProject || data.avgCostPerFacility || 0).toLocaleString('en-IN')}</td>
                      <td>{data.avgTimeMonths} {t('common_months')}</td>
                      <td><span className="badge badge-warning">{(data.costThreshold * 100)}%</span></td>
                      <td><span className="badge badge-warning">{(data.timeThreshold * 100)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
