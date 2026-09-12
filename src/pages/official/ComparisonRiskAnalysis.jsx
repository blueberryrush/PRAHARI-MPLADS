import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { projects, benchmarks } from '../../data/mockData';
import { findRedFlagScenarios, compareProjects } from '../../data/aiEngine';
import AnimatedCounter from '../../components/AnimatedCounter';
import { GitCompare, AlertTriangle, CheckCircle2, Flag, TrendingUp, ArrowRight, ShieldCheck, DollarSign, Clock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function ComparisonRiskAnalysis() {
  const { t, lang } = useLanguage();
  const hi = lang === 'hi';
  const redFlagScenarios = useMemo(() => findRedFlagScenarios(projects), []);
  const [selectedA, setSelectedA] = useState('PRJ001');
  const [selectedB, setSelectedB] = useState('PRJ002');

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
    <div className="page-content comparison-risk-page">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        
        {/* Workspace Head */}
        <motion.div className="workspace-head" variants={fadeUp}>
          <div>
            <div className="eyebrow" style={{ color: '#059669' }}>
              {hi ? 'सांख्यिकीय विचलन एवं बेंचमार्क' : 'BENCHMARK COMPARISON & ANOMALY DETECTION'}
            </div>
            <h2>{t('comp_title')}</h2>
            <p>{t('comp_subtitle')}</p>
          </div>

          <div className="demo-notice" style={{ margin: 0 }}>
            <span className="pulse-dot" style={{ background: '#C85A32' }} />
            <span>{totalRedFlags} {hi ? 'सक्रिय विचलन परिदृश्य पाए गए' : 'Active Deviation Scenarios Detected'}</span>
          </div>
        </motion.div>

        {/* KPI Strip */}
        <motion.div className="kpi-grid" variants={fadeUp} style={{ marginBottom: 20 }}>
          <div className="kpi-panel">
            <div className="kpi-accent critical" />
            <span className="kpi-label">{hi ? 'रेड फ्लैग परिदृश्य' : 'Red Flag Scenarios'}</span>
            <strong style={{ color: '#C85A32' }}><AnimatedCounter end={totalRedFlags} /></strong>
            <small>Disproportionate costs / delays</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent critical" />
            <span className="kpi-label">{t('comp_cost_deviation')}</span>
            <strong style={{ color: '#C85A32' }}><AnimatedCounter end={costFlags} /></strong>
            <small>Exceeds peer cost baseline</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent amber" />
            <span className="kpi-label">{t('comp_time_deviation')}</span>
            <strong style={{ color: '#D97706' }}><AnimatedCounter end={timeFlags} /></strong>
            <small>Schedule overrun detected</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent sage" />
            <span className="kpi-label">{t('comp_green')}</span>
            <strong style={{ color: '#059669' }}><AnimatedCounter end={projects.length - totalRedFlags} /></strong>
            <small>Within acceptable variance</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent teal" />
            <span className="kpi-label">{hi ? 'स्वीकृत बेंचमार्क' : 'Benchmark Profiles'}</span>
            <strong>{Object.keys(benchmarks).length}</strong>
            <small>Normative unit baselines</small>
          </div>
        </motion.div>

        {/* Interactive Manual Comparison Panel */}
        <motion.div variants={fadeUp} className="panel" style={{ padding: 24, marginBottom: 24 }}>
          <div className="panel-head" style={{ marginBottom: 18 }}>
            <div>
              <span className="eyebrow">{hi ? 'आमने-सामने तुलना' : 'HEAD-TO-HEAD PROJECT ARBITRATION'}</span>
              <h3>{t('comp_select_projects')}</h3>
            </div>
          </div>

          {/* Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'center', marginBottom: 20 }}>
            <select 
              className="select wide" 
              value={selectedA} 
              onChange={e => setSelectedA(e.target.value)}
              style={{ background: 'var(--surface)', height: 42, fontSize: 12, fontWeight: 600 }}
            >
              <option value="">{t('dup_project_a')}...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.name.substring(0, 45)}</option>
              ))}
            </select>

            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#1E3A2B',
              color: '#34D399',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 850,
              fontSize: 12,
              border: '1.5px solid #2D5A3E'
            }}>
              VS
            </div>

            <select 
              className="select wide" 
              value={selectedB} 
              onChange={e => setSelectedB(e.target.value)}
              style={{ background: 'var(--surface)', height: 42, fontSize: 12, fontWeight: 600 }}
            >
              <option value="">{t('dup_project_b')}...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.name.substring(0, 45)}</option>
              ))}
            </select>
          </div>

          {manualComparison && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              background: 'var(--surface)',
              borderRadius: 14,
              padding: 18,
              border: '1px solid var(--line)'
            }}>
              {/* Project A Box */}
              <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: 18,
                border: '1px solid var(--line)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <code style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>{manualComparison.projectA.id}</code>
                  <span style={{ fontSize: 10, background: 'rgba(5, 150, 105, 0.1)', color: '#059669', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                    Benchmark Reference
                  </span>
                </div>
                <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>{manualComparison.projectA.name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                  <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>{t('comp_actual_cost')}</span><b style={{ display: 'block' }}>₹{((manualComparison.projectA.spentAmount || 0) / 100000).toFixed(1)} Lakh</b></div>
                  <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>{hi ? 'अवधि' : 'Duration'}</span><b style={{ display: 'block' }}>{manualComparison.timeAMonths} {t('common_months')}</b></div>
                  <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>{t('common_sector')}</span><b style={{ display: 'block' }}>{manualComparison.projectA.sector}</b></div>
                  <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>{t('fin_status')}</span><b style={{ display: 'block' }}>{manualComparison.projectA.status}</b></div>
                </div>
              </div>

              {/* Project B Box */}
              <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: 18,
                border: `1px solid ${manualComparison.isRedFlag ? '#C85A32' : '#059669'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <code style={{ fontSize: 11, color: manualComparison.isRedFlag ? '#C85A32' : '#059669', fontWeight: 700 }}>
                    {manualComparison.projectB.id}
                  </code>
                  <span style={{
                    fontSize: 10,
                    background: manualComparison.isRedFlag ? 'rgba(200, 90, 50, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                    color: manualComparison.isRedFlag ? '#C85A32' : '#059669',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontWeight: 700
                  }}>
                    {manualComparison.isRedFlag ? 'Variance Flagged' : 'Normal Variance'}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>{manualComparison.projectB.name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>{t('comp_actual_cost')}</span>
                    <b style={{ display: 'block', color: manualComparison.costRedFlag ? '#C85A32' : 'inherit' }}>
                      ₹{((manualComparison.projectB.spentAmount || 0) / 100000).toFixed(1)} Lakh
                    </b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>{hi ? 'अवधि' : 'Duration'}</span>
                    <b style={{ display: 'block', color: manualComparison.timeRedFlag ? '#C85A32' : 'inherit' }}>
                      {manualComparison.timeBMonths} {t('common_months')}
                    </b>
                  </div>
                  <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>{t('common_sector')}</span><b style={{ display: 'block' }}>{manualComparison.projectB.sector}</b></div>
                  <div><span style={{ color: 'var(--muted)', fontSize: 11 }}>{t('fin_status')}</span><b style={{ display: 'block' }}>{manualComparison.projectB.status}</b></div>
                </div>

                {/* Variance Chips */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: manualComparison.costRedFlag ? 'rgba(200, 90, 50, 0.12)' : 'rgba(5, 150, 105, 0.1)',
                    color: manualComparison.costRedFlag ? '#C85A32' : '#059669'
                  }}>
                    Cost Variance: {manualComparison.costDiff > 0 ? '+' : ''}{manualComparison.costDiff}% {manualComparison.costRedFlag ? '⚠' : '✓'}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: manualComparison.timeRedFlag ? 'rgba(200, 90, 50, 0.12)' : 'rgba(5, 150, 105, 0.1)',
                    color: manualComparison.timeRedFlag ? '#C85A32' : '#059669'
                  }}>
                    Time Variance: {manualComparison.timeDiff > 0 ? '+' : ''}{manualComparison.timeDiff}% {manualComparison.timeRedFlag ? '⚠' : '✓'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Auto-detected Red Flags Split Cards */}
        <motion.div variants={fadeUp} className="panel" style={{ padding: 24, marginBottom: 24 }}>
          <div className="panel-head" style={{ marginBottom: 18 }}>
            <div>
              <span className="eyebrow" style={{ color: '#C85A32' }}>{hi ? 'स्वचालित विसंगति चेतावनी' : 'DETECTED PEER SKEW'}</span>
              <h3>🚩 {t('comp_scenario_title')}</h3>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(200, 90, 50, 0.1)', color: '#C85A32', padding: '4px 10px', borderRadius: 8 }}>
              {redFlagScenarios.length} {hi ? 'परिदृश्य पाए गए' : 'Anomalous Pairs'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {redFlagScenarios.slice(0, 5).map((scenario, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid rgba(200, 90, 50, 0.25)',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
                  gap: 16,
                  alignItems: 'center'
                }}
              >
                {/* Peer A: Baseline Project */}
                <div style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <code style={{ color: '#059669', fontWeight: 700 }}>✓ {scenario.projectA.id}</code>
                    <span style={{ color: 'var(--muted)' }}>{scenario.projectA.sector}</span>
                  </div>
                  <b style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{scenario.projectA.name}</b>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Cost: ₹{((scenario.projectA.spentAmount || 0) / 100000).toFixed(1)}L · Duration: {scenario.timeAMonths}m
                  </div>
                </div>

                {/* VS Badge with Variance Tag */}
                <div style={{ textAlign: 'center', padding: '0 8px' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#1E3A2B',
                    color: '#34D399',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    margin: '0 auto 6px'
                  }}>
                    VS
                  </div>
                  <b style={{ fontSize: 11, color: '#C85A32', display: 'block' }}>
                    {scenario.costDiff > 0 ? `+${scenario.costDiff}%` : `${scenario.costDiff}%`} Cost
                  </b>
                </div>

                {/* Peer B: Outlier Project */}
                <div style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid rgba(200, 90, 50, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <code style={{ color: '#C85A32', fontWeight: 700 }}>⚠ {scenario.projectB.id}</code>
                    <span style={{ color: '#C85A32', fontWeight: 700 }}>Overrun Alert</span>
                  </div>
                  <b style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{scenario.projectB.name}</b>
                  <div style={{ fontSize: 11, color: '#C85A32', fontWeight: 600 }}>
                    Cost: ₹{((scenario.projectB.spentAmount || 0) / 100000).toFixed(1)}L · Duration: {scenario.timeBMonths}m
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Normative Benchmark Database Table */}
        <motion.div variants={fadeUp} className="panel" style={{ padding: 24 }}>
          <div className="panel-head" style={{ marginBottom: 18 }}>
            <div>
              <span className="eyebrow">{hi ? 'मानक डेटाबेस' : 'GOVERNMENT NORMATIVE BENCHMARKS'}</span>
              <h3>📊 {t('comp_benchmark_db')}</h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              Source: MoSPI Official Cost Schedule & PWD Plinth Rates
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>{t('comp_project_type')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('comp_avg_cost')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('comp_avg_time')}</th>
                  <th style={{ padding: '10px 12px' }}>{hi ? 'लागत सीमा' : 'Cost Variance Cap'}</th>
                  <th style={{ padding: '10px 12px' }}>{hi ? 'समय सीमा' : 'Schedule Variance Cap'}</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(benchmarks).map(([sector, data]) => (
                  <tr key={sector} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{sector}</td>
                    <td style={{ padding: '12px' }}>
                      ₹{(data.avgCostPerKm || data.avgCostPerUnit || data.avgCostPerRoom || data.avgCostPerCenter || data.avgCostPerHall || data.avgCostPerLight || data.avgCostPerProject || data.avgCostPerFacility || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px' }}>{data.avgTimeMonths} {t('common_months')}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                        {(data.costThreshold * 100)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                        {(data.timeThreshold * 100)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#059669', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={13} /> Active Standard
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
