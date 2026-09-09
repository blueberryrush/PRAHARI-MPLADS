import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { projects } from '../../data/mockData';
import { detectDuplicates } from '../../data/aiEngine';
import AnimatedCounter from '../../components/AnimatedCounter';
import { Copy, Search, CheckCircle, AlertTriangle, Globe, Percent } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function DuplicateVerification() {
  const { t, lang } = useLanguage();
  const duplicates = useMemo(() => detectDuplicates(projects, 0.55), []);
  const [actions, setActions] = useState({});

  const crossConstituency = duplicates.filter(d => d.isCrossConstituency);
  const avgSimilarity = duplicates.length > 0 ? (duplicates.reduce((s, d) => s + d.combinedScore, 0) / duplicates.length) : 0;

  const handleAction = (idx, action) => {
    setActions(prev => ({ ...prev, [idx]: action }));
  };

  return (
    <div className="page-content">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div className="page-header" variants={fadeUp}>
          <h1>{t('dup_title')}</h1>
          <p>{t('dup_subtitle')}</p>
        </motion.div>

        {/* KPI */}
        <motion.div className="grid-4" variants={fadeUp} style={{ marginBottom: 24 }}>
          {[
            { icon: <Search size={24} />, bg: 'rgba(0,102,255,0.1)', color: '#0066FF', value: projects.length, label: t('dup_total_scanned') },
            { icon: <Copy size={24} />, bg: 'rgba(255,107,107,0.1)', color: '#FF6B6B', value: duplicates.length, label: t('dup_duplicates_found') },
            { icon: <Percent size={24} />, bg: 'rgba(108,92,231,0.1)', color: '#6C5CE7', value: avgSimilarity, label: t('dup_similarity_score'), suffix: '%', decimals: 1 },
            { icon: <Globe size={24} />, bg: 'rgba(253,203,110,0.2)', color: '#E17055', value: crossConstituency.length, label: t('dup_cross_constituency') },
          ].map((card, i) => (
            <motion.div key={i} className="card-stat" variants={fadeUp}>
              <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
              <div className="stat-value"><AnimatedCounter end={card.value} suffix={card.suffix || ''} decimals={card.decimals || 0} /></div>
              <div className="stat-label">{card.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Duplicate Pairs */}
        <motion.div variants={fadeUp}>
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">{t('dup_pair_title')}</h3>
            </div>

            {duplicates.map((dup, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 16,
                  padding: 20, marginBottom: 12, borderRadius: 'var(--radius-md)',
                  border: `1px solid ${dup.combinedScore > 80 ? 'var(--risk-critical)' : dup.combinedScore > 65 ? 'var(--risk-medium)' : 'var(--border)'}`,
                  background: dup.combinedScore > 80 ? 'rgba(214,48,49,0.03)' : 'var(--bg-card)',
                  alignItems: 'center',
                }}
              >
                {/* Project A */}
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 4 }}>{t('dup_project_a')}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{dup.projectA.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {dup.projectA.constituency} • {dup.projectA.state}<br />
                    ₹{(dup.projectA.sanctionedAmount / 100000).toFixed(1)}L • {dup.projectA.sector}
                  </div>
                </div>

                {/* Similarity Score */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: dup.combinedScore > 80 ? 'var(--gradient-danger)' : dup.combinedScore > 65 ? 'var(--gradient-warning)' : 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.9rem',
                    margin: '0 auto 4px', boxShadow: 'var(--shadow-md)',
                  }}>
                    {dup.combinedScore}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{t('dup_similarity')}</div>
                </div>

                {/* Project B */}
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 4 }}>{t('dup_project_b')}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{dup.projectB.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {dup.projectB.constituency} • {dup.projectB.state}<br />
                    ₹{(dup.projectB.sanctionedAmount / 100000).toFixed(1)}L • {dup.projectB.sector}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {actions[idx] ? (
                    <div style={{ padding: '8px 14px', borderRadius: 8, background: actions[idx] === 'duplicate' ? 'rgba(214,48,49,0.1)' : actions[idx] === 'dismiss' ? 'rgba(0,184,148,0.1)' : 'rgba(0,102,255,0.1)', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
                      {actions[idx] === 'duplicate' ? '🚩 Marked' : actions[idx] === 'dismiss' ? '✅ Dismissed' : '🔍 Investigating'}
                    </div>
                  ) : (
                    <>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(idx, 'duplicate')}>{t('dup_mark_duplicate')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleAction(idx, 'investigate')}>{t('dup_investigate')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleAction(idx, 'dismiss')}>{t('dup_dismiss')}</button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}

            {duplicates.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <p>{lang === 'hi' ? 'कोई डुप्लिकेट नहीं मिला' : 'No duplicates detected'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
