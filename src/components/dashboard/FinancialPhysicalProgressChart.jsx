import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function FinancialPhysicalProgressChart({
  projects = [],
  selectedProjectId,
  onSelectProject,
  onNavigateToProject
}) {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState('divergence'); // 'divergence' | 'all'

  // Sort projects by discrepancy gap (financial % - physical %)
  const sortedProjects = [...projects]
    .map(p => {
      const fin = p.financialProgress || 0;
      const phys = p.physicalProgress || 0;
      const gap = fin - phys;
      return { ...p, gap };
    })
    .sort((a, b) => b.gap - a.gap);

  const displayProjects = viewMode === 'divergence'
    ? sortedProjects.filter(p => p.gap > 0).slice(0, 7)
    : sortedProjects.slice(0, 7);

  // Portfolio-wide averages
  const avgFin = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.financialProgress || 0), 0) / projects.length)
    : 0;
  const avgPhys = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.physicalProgress || 0), 0) / projects.length)
    : 0;
  const severeDiscrepancyCount = projects.filter(p => (p.financialProgress || 0) > (p.physicalProgress || 0) + 20).length;

  return (
    <section className="panel financial-physical-progress-panel" style={{ padding: '24px', background: '#fff', border: '1px solid var(--line)', borderRadius: 14 }}>
      {/* Header with Title & View Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <span className="eyebrow" style={{ letterSpacing: '0.06em', color: 'var(--brand)', fontWeight: 800 }}>
            PORTFOLIO FIDELITY MATRIX
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 4px', color: 'var(--ink)' }}>
            Financial vs Physical Progress Analysis
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            Compares fund disbursement percentages (PFMS releases) with reported physical milestones (eSAKSHI filings).
          </p>
        </div>

        {/* Aggregate Summary Badges */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 14px', background: '#FAFBF8', border: '1px solid var(--line)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Avg Disbursed</div>
            <b style={{ fontSize: 16, color: '#C85A32' }}>{avgFin}%</b>
          </div>

          <div style={{ padding: '8px 14px', background: '#FAFBF8', border: '1px solid var(--line)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Avg Physical</div>
            <b style={{ fontSize: 16, color: 'var(--brand)' }}>{avgPhys}%</b>
          </div>

          <div style={{ padding: '8px 14px', background: severeDiscrepancyCount > 0 ? '#FDF4E7' : '#E8F5E9', border: `1px solid ${severeDiscrepancyCount > 0 ? '#FFE082' : '#C8E6C9'}`, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: severeDiscrepancyCount > 0 ? '#D97706' : '#2E7D32', textTransform: 'uppercase' }}>Discrepancies</div>
            <b style={{ fontSize: 16, color: severeDiscrepancyCount > 0 ? '#D97706' : '#2E7D32' }}>{severeDiscrepancyCount}</b>
          </div>
        </div>
      </div>

      {/* Progress Bars List for Ranked Projects */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayProjects.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No significant progress divergence detected in current portfolio scope.
          </div>
        ) : (
          displayProjects.map((proj) => {
            const isSelected = proj.id === selectedProjectId;
            const hasMismatch = proj.gap >= 15;
            const finPct = Math.min(100, Math.max(0, proj.financialProgress || 0));
            const physPct = Math.min(100, Math.max(0, proj.physicalProgress || 0));

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject && onSelectProject(proj.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: isSelected ? '1px solid var(--brand)' : '1px solid var(--line)',
                  background: isSelected ? '#F6F8F6' : '#FAFBF8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Top Row: ID, Name, District, Sector, Gap Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: '#EEF3EF',
                        color: 'var(--brand)'
                      }}
                    >
                      {proj.id}
                    </span>
                    <strong style={{ fontSize: 13, color: 'var(--ink)' }} className="truncate">
                      {proj.name}
                    </strong>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      · {proj.district}, {proj.state}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {hasMismatch ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#FFF8E1',
                          border: '1px solid #FFE082',
                          color: '#B78103',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        ⚠️ Potential Progress Mismatch (+{proj.gap} pp)
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#2E7D32',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <CheckCircle2 size={13} />
                        Balanced ({proj.gap >= 0 ? `+${proj.gap}` : proj.gap} pp)
                      </span>
                    )}

                    {onNavigateToProject && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToProject(proj.id);
                        }}
                        className="link-btn"
                        style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <span>Investigate</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Comparison Visual Bars */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Physical Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Reported Physical Progress</span>
                      <b style={{ color: 'var(--ink)' }}>{physPct}%</b>
                    </div>
                    <div style={{ height: 8, background: '#E2E6E2', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${physPct}%`,
                          background: 'var(--brand)',
                          borderRadius: 4,
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* Financial Disbursement Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Financial Disbursement Released</span>
                      <b style={{ color: hasMismatch ? '#C85A32' : 'var(--ink)' }}>{finPct}%</b>
                    </div>
                    <div style={{ height: 8, background: '#E2E6E2', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${finPct}%`,
                          background: hasMismatch ? '#C85A32' : '#2563EB',
                          borderRadius: 4,
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Note */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap', gap: 8 }}>
        <span>
          Showing top projects ranked by progress gap. Divergence &gt;15 percentage points triggers automated verification prioritization.
        </span>
        <button
          type="button"
          className="link-btn"
          onClick={() => setViewMode(prev => prev === 'divergence' ? 'all' : 'divergence')}
          style={{ fontSize: 11 }}
        >
          {viewMode === 'divergence' ? 'Show All Ranked Works →' : 'Show Only Divergent Works →'}
        </button>
      </div>
    </section>
  );
}
