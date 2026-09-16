import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCaseContext } from '../../contexts/CaseContext';
import { projects as fallbackProjects } from '../../data/mockData';
import { detectDuplicates } from '../../data/aiEngine';
import AnimatedCounter from '../../components/AnimatedCounter';
import { Copy, Search, CheckCircle2, AlertTriangle, Globe, Percent, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function DuplicateVerification() {
  const { t, lang } = useLanguage();
  const { projects: cloudProjects } = useCaseContext();
  const activeProjects = useMemo(() => {
    return (cloudProjects && cloudProjects.length > 0) ? cloudProjects : fallbackProjects;
  }, [cloudProjects]);

  const hi = lang === 'hi';
  const duplicates = useMemo(() => detectDuplicates(activeProjects, 0.55), [activeProjects]);
  const [actions, setActions] = useState({});

  const crossConstituency = duplicates.filter(d => d.isCrossConstituency);
  const avgSimilarity = duplicates.length > 0 ? (duplicates.reduce((s, d) => s + d.combinedScore, 0) / duplicates.length) : 0;

  const handleAction = (idx, action) => {
    setActions(prev => ({ ...prev, [idx]: action }));
  };

  return (
    <div className="page-content duplicate-verification-page">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        
        {/* Workspace Head */}
        <motion.div className="workspace-head" variants={fadeUp}>
          <div>
            <div className="eyebrow" style={{ color: '#059669' }}>
              {hi ? 'स्थानिक व विवरण दोहराव निगरानी' : 'SPATIAL & SEMANTIC DUPLICATION SURVEILLANCE'}
            </div>
            <h2>{t('dup_title')}</h2>
            <p>{t('dup_subtitle')}</p>
          </div>

          <div className="demo-notice" style={{ margin: 0 }}>
            <span className="pulse-dot" style={{ background: '#C85A32' }} />
            <span>{duplicates.length} {hi ? 'संदिग्ध दोहराव पहचाने गए' : 'Suspected Overlaps Identified'}</span>
          </div>
        </motion.div>

        {/* KPI Strip */}
        <motion.div className="kpi-grid" variants={fadeUp} style={{ marginBottom: 20 }}>
          <div className="kpi-panel">
            <div className="kpi-accent teal" />
            <span className="kpi-label">{t('dup_total_scanned')}</span>
            <strong><AnimatedCounter end={projects.length} /></strong>
            <small>Active district projects</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent critical" />
            <span className="kpi-label">{t('dup_duplicates_found')}</span>
            <strong style={{ color: '#C85A32' }}><AnimatedCounter end={duplicates.length} /></strong>
            <small>Score exceeds 55% similarity</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent amber" />
            <span className="kpi-label">{t('dup_similarity_score')}</span>
            <strong style={{ color: '#D97706' }}>
              <AnimatedCounter end={avgSimilarity} suffix="%" decimals={1} />
            </strong>
            <small>Mean semantic + spatial overlap</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent critical" />
            <span className="kpi-label">{t('dup_cross_constituency')}</span>
            <strong style={{ color: '#C85A32' }}><AnimatedCounter end={crossConstituency.length} /></strong>
            <small>Inter-boundary potential conflict</small>
          </div>

          <div className="kpi-panel">
            <div className="kpi-accent sage" />
            <span className="kpi-label">{hi ? 'समीक्षित जोड़े' : 'Audited Pairs'}</span>
            <strong style={{ color: '#059669' }}>{Object.keys(actions).length}</strong>
            <small>Adjudicated by authority</small>
          </div>
        </motion.div>

        {/* Duplicate Pairs Panel */}
        <motion.div variants={fadeUp} className="panel" style={{ padding: 24 }}>
          <div className="panel-head" style={{ marginBottom: 18 }}>
            <div>
              <span className="eyebrow">{hi ? 'सत्यापन कतार' : 'COMPARATIVE ADJUDICATION QUEUE'}</span>
              <h3>{t('dup_pair_title')}</h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {duplicates.length} candidate pairs requiring GIS boundary & tender reconciliation
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {duplicates.map((dup, idx) => {
              const isHigh = dup.combinedScore > 80;
              const isMed = dup.combinedScore > 65 && dup.combinedScore <= 80;
              const simColor = isHigh ? '#C85A32' : isMed ? '#D97706' : '#059669';

              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 14,
                    padding: 20,
                    border: `1px solid ${isHigh ? 'rgba(200, 90, 50, 0.35)' : 'var(--line)'}`,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.2fr) auto minmax(0, 1.2fr) minmax(140px, auto)',
                    gap: 18,
                    alignItems: 'center'
                  }}
                >
                  {/* Project A Card */}
                  <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: '#059669' }}>{t('dup_project_a').toUpperCase()}</span>
                      <code>{dup.projectA.id}</code>
                    </div>
                    <b style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>{dup.projectA.name}</b>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                      {dup.projectA.constituency} · {dup.projectA.state}
                      <br />
                      ₹{((dup.projectA.sanctionedAmount || 0) / 100000).toFixed(1)}L · {dup.projectA.sector}
                    </div>
                  </div>

                  {/* Similarity Badge */}
                  <div style={{ textAlign: 'center', minWidth: 90 }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      background: isHigh ? 'rgba(200, 90, 50, 0.15)' : 'rgba(5, 150, 105, 0.12)',
                      border: `1.5px solid ${simColor}`,
                      color: simColor,
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 900,
                      fontSize: 14,
                      margin: '0 auto 4px'
                    }}>
                      {dup.combinedScore}%
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
                      {t('dup_similarity')}
                    </span>
                  </div>

                  {/* Project B Card */}
                  <div style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${isHigh ? 'rgba(200, 90, 50, 0.3)' : 'var(--line)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: simColor }}>{t('dup_project_b').toUpperCase()}</span>
                      <code>{dup.projectB.id}</code>
                    </div>
                    <b style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>{dup.projectB.name}</b>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                      {dup.projectB.constituency} · {dup.projectB.state}
                      <br />
                      ₹{((dup.projectB.sanctionedAmount || 0) / 100000).toFixed(1)}L · {dup.projectB.sector}
                    </div>
                  </div>

                  {/* Adjudication Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {actions[idx] ? (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: actions[idx] === 'duplicate' ? 'rgba(200, 90, 50, 0.12)' : actions[idx] === 'dismiss' ? 'rgba(5, 150, 105, 0.12)' : '#1E3A2B',
                        color: actions[idx] === 'duplicate' ? '#C85A32' : actions[idx] === 'dismiss' ? '#059669' : '#34D399',
                        fontSize: 11,
                        fontWeight: 800,
                        textAlign: 'center'
                      }}>
                        {actions[idx] === 'duplicate' ? '🚩 Flagged Duplicate' : actions[idx] === 'dismiss' ? '✓ Cleared Different' : '🔍 In Investigation'}
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="primary-action"
                          onClick={() => handleAction(idx, 'duplicate')}
                          style={{ background: '#C85A32', borderColor: '#C85A32', height: 32, fontSize: 10 }}
                        >
                          {t('dup_mark_duplicate')}
                        </button>
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => handleAction(idx, 'investigate')}
                          style={{ height: 32, fontSize: 10 }}
                        >
                          {t('dup_investigate')}
                        </button>
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => handleAction(idx, 'dismiss')}
                          style={{ height: 30, fontSize: 10, opacity: 0.8 }}
                        >
                          {t('dup_dismiss')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {duplicates.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                <CheckCircle2 size={32} style={{ color: '#059669', marginBottom: 10 }} />
                <h4>{hi ? 'कोई संभावित दोहराव नहीं मिला' : 'No Suspected Duplicates Found'}</h4>
                <p style={{ fontSize: 12 }}>All projects conform to unique geographic and tender specifications.</p>
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
