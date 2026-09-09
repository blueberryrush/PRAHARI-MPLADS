import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { bottleneckData } from '../../data/mockData';
import { predictBottlenecks } from '../../data/aiEngine';
import AnimatedCounter from '../../components/AnimatedCounter';
import { LineChart } from '../../components/Charts';
import { TrendingUp, AlertTriangle, Clock, CheckCircle, Zap, CloudRain, Landmark, Users } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const bottleneckIcons = {
  funding: { icon: <Zap size={18} />, color: '#FDCB6E', bg: 'rgba(253,203,110,0.2)' },
  seasonal: { icon: <CloudRain size={18} />, color: '#74B9FF', bg: 'rgba(116,185,255,0.15)' },
  regulatory: { icon: <Landmark size={18} />, color: '#A29BFE', bg: 'rgba(162,155,254,0.15)' },
  agency_capacity: { icon: <Users size={18} />, color: '#FD79A8', bg: 'rgba(253,121,168,0.15)' },
};

export default function PredictiveBottleneck() {
  const { t, lang } = useLanguage();
  const predictions = useMemo(() => predictBottlenecks(), []);

  const critical = predictions.filter(p => p.riskLevel === 'critical');
  const atRisk = predictions.filter(p => p.riskLevel === 'at_risk');
  const onTrack = predictions.filter(p => p.riskLevel === 'on_track');

  return (
    <div className="page-content">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div className="page-header" variants={fadeUp}>
          <h1>{t('bot_title')}</h1>
          <p>{t('bot_subtitle')}</p>
        </motion.div>

        {/* KPIs */}
        <motion.div className="grid-4" variants={fadeUp} style={{ marginBottom: 24 }}>
          {[
            { icon: <CheckCircle size={24} />, bg: 'rgba(0,184,148,0.1)', color: '#00B894', value: onTrack.length, label: t('bot_on_track') },
            { icon: <AlertTriangle size={24} />, bg: 'rgba(253,203,110,0.2)', color: '#E17055', value: atRisk.length, label: t('bot_at_risk') },
            { icon: <Clock size={24} />, bg: 'rgba(214,48,49,0.1)', color: '#D63031', value: critical.length, label: t('bot_critical') },
            { icon: <TrendingUp size={24} />, bg: 'rgba(0,102,255,0.1)', color: '#0066FF', value: predictions.length, label: lang === 'hi' ? 'कुल ट्रैक किए' : 'Total Tracked' },
          ].map((card, i) => (
            <motion.div key={i} className="card-stat" variants={fadeUp}>
              <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
              <div className="stat-value"><AnimatedCounter end={card.value} /></div>
              <div className="stat-label">{card.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Early Warning Cards */}
        <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">🔮 {t('bot_early_warning')}</h3>
            </div>

            <div className="grid-3" style={{ marginBottom: 0 }}>
              {predictions.slice(0, 9).map((pred, idx) => {
                const riskColors = {
                  critical: { bg: 'rgba(214,48,49,0.06)', border: 'rgba(214,48,49,0.2)', color: '#D63031', dot: '🔴' },
                  at_risk: { bg: 'rgba(253,203,110,0.08)', border: 'rgba(253,203,110,0.3)', color: '#E17055', dot: '🟡' },
                  on_track: { bg: 'rgba(0,184,148,0.06)', border: 'rgba(0,184,148,0.2)', color: '#00B894', dot: '🟢' },
                };
                const rc = riskColors[pred.riskLevel] || riskColors.on_track;

                return (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      padding: 16, borderRadius: 'var(--radius-md)',
                      background: rc.bg, border: `1px solid ${rc.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{pred.id}</div>
                      <span style={{ fontSize: '0.8rem' }}>{rc.dot}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, lineHeight: 1.3 }}>{pred.name.substring(0, 40)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{lang === 'hi' ? 'वास्तविक' : 'ACTUAL'}</div>
                        <div style={{ fontWeight: 700, color: rc.color }}>{pred.physicalProgress}%</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{lang === 'hi' ? 'अपेक्षित' : 'EXPECTED'}</div>
                        <div style={{ fontWeight: 700 }}>{pred.expectedProgress}%</div>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <div className={`progress-fill ${pred.riskLevel === 'critical' ? 'red' : pred.riskLevel === 'at_risk' ? 'yellow' : 'green'}`} style={{ width: `${pred.physicalProgress}%` }}></div>
                    </div>
                    {pred.predictedDelayDays > 0 && (
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: rc.color }}>
                        ⏱ {t('bot_predicted_delay')}: {pred.predictedDelayDays} {t('common_days')}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Bottleneck Identifier */}
        <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
          <div className="chart-card">
            <div className="chart-header"><h3 className="chart-title">🔍 {t('bot_bottleneck_id')}</h3></div>

            {bottleneckData.map((bn, idx) => {
              const iconConfig = bottleneckIcons[bn.type] || bottleneckIcons.funding;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  style={{
                    display: 'flex', gap: 16, padding: 16, marginBottom: 8,
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'var(--bg-card)', alignItems: 'start',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: iconConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconConfig.color, flexShrink: 0 }}>
                    {iconConfig.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{bn.projectId}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="badge badge-warning">{bn.type.replace('_', ' ')}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: bn.probability > 0.6 ? '#D63031' : '#E17055' }}>
                          {(bn.probability * 100).toFixed(0)}% {lang === 'hi' ? 'संभावना' : 'likely'}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{bn.description}</p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#D63031' }}>⏱ +{bn.predictedDelay} {t('common_days')}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>|</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600 }}>💡 {bn.recommendation.substring(0, 60)}...</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Progress Trajectory Chart */}
        <motion.div variants={fadeUp}>
          <LineChart
            title={`📈 ${t('bot_progress_trajectory')}`}
            labels={['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']}
            datasets={[
              { label: t('bot_planned'), data: [8, 17, 25, 33, 42, 50, 58, 67, 75, 83, 92, 100], borderColor: '#0066FF' },
              { label: t('bot_actual'), data: [5, 12, 18, 22, 28, 35, 42, 48, 55, null, null, null], borderColor: '#FF6B6B' },
              { label: t('bot_predicted'), data: [null, null, null, null, null, null, null, null, 55, 60, 68, 78], borderColor: '#FDCB6E', borderDash: [5, 5] },
            ]}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
