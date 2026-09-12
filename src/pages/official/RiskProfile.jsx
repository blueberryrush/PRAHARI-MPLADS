import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  GitBranch,
  MapPin,
  Network,
  SearchCheck,
  ShieldAlert,
  UserRound,
  Building2,
  Landmark,
  FileText,
  AlertTriangle,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { projects, agencies } from '../../data/mockData';
import { calculateRiskScore } from '../../data/aiEngine';
import SpeakerButton from '../../components/SpeakerButton';
import EvidenceDrawer from '../../components/EvidenceDrawer';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCaseContext } from '../../contexts/CaseContext';
import { useAuth } from '../../contexts/AuthContext';

export default function RiskProfile() {
  const { id = 'PRJ002' } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { attachNode } = useCaseContext();

  const p =
    projects.find((x) => x.id.toUpperCase() === (id || '').toUpperCase()) ||
    projects.find((x) => x.id === 'PRJ002') ||
    projects[0];

  const risk = calculateRiskScore(p);
  const agency = agencies.find((a) => a.id === p.agency);

  const reportedProgress = p.physicalProgress ?? 75;
  const aiVisualEstimate = p.estimatedSiteProgress ?? (p.isAnomaly ? Math.max(20, reportedProgress - 20) : reportedProgress);
  const discrepancy = Math.abs(reportedProgress - aiVisualEstimate);

  const [node, setNode] = useState('Project');
  const [drawerOpen, setDrawerOpen] = useState(false);

  /*
   * Candidate related work.
   * This is intentionally presented as a relationship to review,
   * not as proof of duplication/fraud.
   */
  const relatedWork = useMemo(() => {
    const sameConstituency = projects.find(
      (x) =>
        x.id !== p.id &&
        x.constituency === p.constituency &&
        x.sector === p.sector
    );

    if (sameConstituency) return sameConstituency;

    return projects.find(
      (x) => x.id !== p.id && x.sector === p.sector
    );
  }, [p]);

  const signals = [
    {
      key: t('signal_financial_name'),
      nodeId: 'Financial anomaly',
      icon: CircleDollarSign,
      score: Math.min(32, risk.score),
      levelKey: p.spentAmount > p.sanctionedAmount * 1.1 ? 'high' : 'low',
      level:
        p.spentAmount > p.sanctionedAmount * 1.1 ? t('signal_high') : t('signal_low'),
      detail: `${t('signal_financial_finding')} (₹${(
        p.spentAmount / 100000
      ).toFixed(1)}L / ₹${(p.sanctionedAmount / 100000).toFixed(
        1
      )}L).`,
    },
    {
      key: t('signal_spatial_name'),
      nodeId: 'Spatial overlap',
      icon: MapPin,
      score: 28,
      levelKey: relatedWork ? 'high' : 'low',
      level: relatedWork ? t('signal_high') : t('signal_low'),
      detail: relatedWork
        ? t('signal_spatial_finding')
        : (t('risk_no_comparable') || 'No comparable work was found in the current dataset.'),
    },
    {
      key: t('signal_delay_name'),
      nodeId: 'Delay risk',
      icon: Clock3,
      score: p.status === 'delayed' ? 16 : 5,
      levelKey: p.status === 'delayed' ? 'medium' : 'low',
      level: p.status === 'delayed' ? t('signal_medium') : t('signal_low'),
      detail:
        p.status === 'delayed'
          ? t('signal_delay_finding')
          : (t('signal_delay_detail_normal') || 'No material delay signal in the record.'),
    },
    {
      key: t('signal_agency_name'),
      nodeId: 'Agency signal',
      icon: UserRound,
      score: Math.min(15, agency?.riskScore || 0),
      levelKey: (agency?.riskScore || 0) > 50 ? 'medium' : 'low',
      level: (agency?.riskScore || 0) > 50 ? t('signal_medium') : t('signal_low'),
      detail: t('signal_agency_finding'),
    },
  ];

  const graphNodes = [
    {
      id: 'MP / Constituency',
      label: t('node_mp'),
      type: t('type_context'),
      value: p.constituency,
      icon: Landmark,
      position: 'mp',
      description: t('node_mp_desc'),
      evidence: `${p.constituency}, ${p.state}`,
    },
    {
      id: 'Agency',
      label: t('node_agency'),
      type: t('type_agency'),
      value: agency?.name?.split(' - ')[0] || p.agency,
      icon: Building2,
      position: 'agency',
      description: t('node_agency_desc'),
      evidence: agency
        ? `${agency.totalProjects} projects · ${agency.onTimeRate}% on-time rate`
        : 'Agency record available in the project data.',
    },
    {
      id: 'Project',
      label: t('node_project'),
      type: t('type_project'),
      value: p.id,
      icon: FileText,
      position: 'project',
      description: t('node_project_desc'),
      evidence: `${p.name} · ${p.status}`,
    },
    {
      id: 'Payment',
      label: t('node_payment'),
      type: t('type_financial'),
      value: `₹${(p.spentAmount / 100000).toFixed(1)}L`,
      icon: CircleDollarSign,
      position: 'payment',
      description: t('node_payment_desc'),
      evidence: `Sanctioned ₹${(
        p.sanctionedAmount / 100000
      ).toFixed(1)}L · Reported ₹${(
        p.spentAmount / 100000
      ).toFixed(1)}L`,
    },
    {
      id: 'Location',
      label: t('node_location'),
      type: t('type_geospatial'),
      value: p.district,
      icon: MapPin,
      position: 'location',
      description: t('node_location_desc'),
      evidence: `${p.district}, ${p.state}`,
    },
    {
      id: 'Related Work',
      label: t('node_related'),
      type: t('type_relation'),
      value: relatedWork?.id || 'No match',
      icon: Network,
      position: 'related',
      description: t('node_related_desc'),
      evidence: relatedWork
        ? `${relatedWork.name} · ${relatedWork.constituency}`
        : 'No comparable record found.',
    },
  ];

  const selectedNode =
    graphNodes.find((n) => n.id === node) || graphNodes[2];

  return (
    <div className="page-content risk-page">

      <button
        className="back-link"
        onClick={() => {
          if (user?.role === 'citizen' || window.location.pathname.startsWith('/citizen')) {
            navigate('/citizen');
          } else {
            navigate('/official/dashboard');
          }
        }}
      >
        <ArrowLeft size={16} />
        {user?.role === 'citizen' || window.location.pathname.startsWith('/citizen')
          ? (t('btn_back_citizen') || 'Back to Citizen Portal')
          : t('btn_back_command')}
      </button>

      {/* HEADER */}
      <div className="risk-header">
        <div>
          <div className="eyebrow">
            {t('risk_eyebrow_prefix')} {p.id}
          </div>

          <h2>{p.name}</h2>

          <p>
            <MapPin size={14} /> {p.district}, {p.state} · {p.sector}
          </p>
        </div>

        <div className="risk-header-actions">
          <SpeakerButton
            text={`${p.name}. Risk score ${risk.score} out of 100. Requires human verification.`}
          />

          <button
            className="primary-action"
            onClick={() => navigate(`/official/investigation/${p.id}`)}
          >
            <SearchCheck size={16} />
            {t('btn_investigate')}
          </button>
        </div>
      </div>

      {/* RISK SUMMARY */}
      <div className="risk-summary">

        <div className="risk-score">
          <div className="score-circle">
            <strong>{risk.score}</strong>
            <span>/100</span>
          </div>

          <div>
            <span className="critical-label">{t('risk_high_label')}</span>

            <h3>{t('risk_requires_verif')}</h3>

            <p>
              {t('risk_not_fraud')}
            </p>
          </div>
        </div>

        <div className="risk-facts">

          <div>
            <span>{t('risk_sanctioned')}</span>
            <b>
              ₹{(p.sanctionedAmount / 100000).toFixed(1)}L
            </b>
          </div>

          <div>
            <span>{t('risk_reported_spend')}</span>
            <b>
              ₹{(p.spentAmount / 100000).toFixed(1)}L
            </b>
          </div>

          <div>
            <span>{t('risk_physical_progress')}</span>
            <b>{p.physicalProgress}%</b>
          </div>

          <div>
            <span>{t('risk_case_owner')}</span>
            <b>{t('risk_district_authority')}</b>
          </div>

        </div>
      </div>

      <div className="risk-layout">

        <main>

          {/* SIGNAL BREAKDOWN */}
          <section className="panel p-6" style={{ padding: '24px' }}>

            <div className="panel-head">
              <div>
                <span className="eyebrow">{t('risk_signal_breakdown_eyebrow')}</span>
                <h3>{t('risk_signal_breakdown_title')}</h3>
              </div>

              <ShieldAlert size={18} />
            </div>

            <div className="signal-grid">

              {signals.map((s) => {
                const I = s.icon;

                return (
                  <button
                    className="signal-card p-6"
                    style={{ padding: '24px' }}
                    key={s.key}
                    onClick={() => { setNode(s.nodeId || s.key); setDrawerOpen(true); }}
                  >

                    <div className="signal-top">
                      <I size={18} />

                      <span
                        className={`signal-level ${s.levelKey || 'low'}`}
                      >
                        {s.level}
                      </span>
                    </div>

                    <b className="text-base font-semibold text-stone-900 dark:text-stone-100" style={{ fontSize: '1rem', fontWeight: 600 }}>{s.key}</b>

                    <div className="signal-meter">
                      <i
                        style={{
                          width: `${Math.min(
                            100,
                            s.score * 2.5
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300" style={{ fontSize: '0.875rem', lineHeight: '1.625' }}>{s.detail}</p>

                    <span className="evidence-link">
                      {t('risk_view_evidence')}
                      <ChevronRight size={14} />
                    </span>

                  </button>
                );
              })}

            </div>
          </section>

          {/* =====================================================
              PHYSICAL VERIFICATION & PROGRESS DISCREPANCY
          ====================================================== */}
          <section className="panel p-6" style={{ padding: '24px' }}>
            <div className="panel-head">
              <div>
                <span className="eyebrow">{t('verif_physical_title')}</span>
                <h3>{t('verif_physical_title')}</h3>
                <p className="panel-subtitle" style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>
                  {t('verif_ground_truth_note')}
                </p>
              </div>
              <Camera size={20} style={{ color: 'var(--brand)' }} />
            </div>

            {/* Comparison Metrics Card */}
            <div style={{
              background: '#FAFAF7',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginTop: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('verif_reported_progress')}
                    </span>
                    <b style={{ fontSize: 26, fontWeight: 800, color: '#1c1917' }}>{reportedProgress}%</b>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('verif_ai_estimate')}
                    </span>
                    <b style={{ fontSize: 26, fontWeight: 800, color: '#c2410c' }}>{aiVisualEstimate}%</b>
                  </div>
                </div>

                {discrepancy > 0 && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: '#ffedd5',
                    border: '1px solid #fed7aa',
                    color: '#9a3412',
                    fontWeight: 800,
                    fontSize: 12,
                  }}>
                    <AlertTriangle size={15} />
                    <span>⚠️ {discrepancy}-{t('verif_discrepancy_badge')}</span>
                  </div>
                )}
              </div>

              {/* Progress Comparison Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: '#44403c' }}>{t('verif_reported_progress')} (DPR / Agency Filing)</span>
                    <span style={{ fontWeight: 700, color: '#1c1917' }}>{reportedProgress}%</span>
                  </div>
                  <div style={{ height: 10, background: '#e7e5e4', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${reportedProgress}%`, background: '#314D3F', borderRadius: 6, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: '#44403c' }}>{t('verif_ai_estimate')} (Satellite & Site Imagery)</span>
                    <span style={{ fontWeight: 700, color: '#c2410c' }}>{aiVisualEstimate}%</span>
                  </div>
                  <div style={{ height: 10, background: '#e7e5e4', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${aiVisualEstimate}%`, background: '#ea580c', borderRadius: 6, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>

              {/* Neutral Mismatch Warning Banner */}
              {discrepancy > 0 ? (
                <div style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginTop: 4,
                }}>
                  <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 2 }}>
                      ⚠️ {t('verif_mismatch_title')}
                    </strong>
                    <p style={{ margin: 0, fontSize: 11, color: '#78350f', lineHeight: 1.45 }}>
                      {t('verif_mismatch_desc')}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  background: '#f0fdf4',
                  border: '1px solid #dcfce7',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 11,
                  color: '#166534',
                }}>
                  <CheckCircle2 size={16} />
                  <span>Reported progress matches estimated site reality within standard tolerance.</span>
                </div>
              )}
            </div>
          </section>

          {/* =====================================================
              EVIDENCE GRAPH
          ====================================================== */}
          <section className="panel evidence-graph-panel">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  {t('risk_graph_eyebrow')}
                </span>

                <h3>
                  {t('risk_graph_title_prefix')} {p.id}
                </h3>

                <p className="panel-subtitle">
                  {t('risk_graph_subtitle')}
                </p>
              </div>

              <Network size={19} />

            </div>

            <div className="graph-legend">
              <span>
                <i className="graph-dot project" />
                {t('risk_graph_legend_project')}
              </span>

              <span>
                <i className="graph-dot context" />
                {t('risk_graph_legend_context')}
              </span>

              <span>
                <i className="graph-dot evidence" />
                {t('risk_graph_legend_evidence')}
              </span>

              <span>
                <i className="graph-dot relation" />
                {t('risk_graph_legend_relation')}
              </span>
            </div>

            <div className="evidence-graph-canvas">

              <svg
                className="graph-lines"
                viewBox="0 0 900 430"
                preserveAspectRatio="none"
              >

                {/* MP → PROJECT */}
                <line
                  x1="450"
                  y1="82"
                  x2="450"
                  y2="176"
                  className="graph-line"
                />

                {/* AGENCY → PROJECT */}
                <line
                  x1="180"
                  y1="215"
                  x2="370"
                  y2="215"
                  className="graph-line"
                />

                {/* PROJECT → PAYMENT */}
                <line
                  x1="530"
                  y1="215"
                  x2="720"
                  y2="215"
                  className="graph-line"
                />

                {/* PROJECT → LOCATION */}
                <line
                  x1="450"
                  y1="255"
                  x2="450"
                  y2="345"
                  className="graph-line"
                />

                {/* LOCATION → RELATED */}
                <line
                  x1="450"
                  y1="345"
                  x2="690"
                  y2="345"
                  className="graph-line relation-line"
                />

              </svg>

              {graphNodes.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    className={`graph-node-card ${item.position} ${
                      node === item.id ? 'selected' : ''
                    } ${
                      item.type === t('type_relation') || item.type === 'RELATION'
                        ? 'candidate'
                        : ''
                    }`}
                    onClick={() => { setNode(item.id); setDrawerOpen(true); }}
                  >

                    <div className="graph-node-icon">
                      <Icon size={17} />
                    </div>

                    <div className="graph-node-copy">

                      <span>{item.type}</span>

                      <strong>{item.value}</strong>

                    </div>

                  </button>
                );
              })}

            </div>

            {/* SELECTED NODE */}
            <div className="selected-evidence-card">

              <div className="selected-evidence-icon">
                <GitBranch size={17} />
              </div>

              <div className="selected-evidence-content">

                <div className="selected-evidence-heading">
                  <span>{t('risk_selected_evidence')}</span>

                  <b>{selectedNode.label || selectedNode.id}</b>
                </div>

                <p>
                  {selectedNode.description}
                </p>

                <div className="selected-evidence-source">

                  <span>{t('risk_record_context')}</span>

                  <strong>
                    {selectedNode.evidence}
                  </strong>

                </div>

              </div>

            </div>

            <div className="graph-governance-note">

              <ShieldAlert size={15} />

              <span>
                {t('disclaimer_investigation')}
              </span>

            </div>

          </section>

        </main>

        {/* RIGHT SIDE */}
        <aside className="side-stack">

          <section className="panel p-6" style={{ padding: '24px' }}>

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  {t('risk_evidence_completeness_eyebrow')}
                </span>

                <h3>72%</h3>
              </div>

            </div>

            <div className="completion-ring">
              <div>
                <b>72</b>
                <span>%</span>
              </div>
            </div>

            <ul className="check-list">
              <li className="done">{t('risk_checklist_project')}</li>
              <li className="done">{t('risk_checklist_financial')}</li>
              <li className="done">{t('risk_checklist_location')}</li>
              <li>{t('risk_checklist_field')}</li>
              <li>{t('risk_checklist_doc')}</li>
            </ul>

          </section>

          <section className="panel">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  {t('risk_recommended_eyebrow')}
                </span>

                <h3>{t('risk_recommended_title')}</h3>
              </div>

            </div>

            <div className="recommendation">

              <SearchCheck size={19} />

              <p>
                {t('risk_recommended_body')}
              </p>

              <button
                onClick={() =>
                  navigate(`/official/investigation/${p.id}`)
                }
                className="primary-action full"
              >
                {t('btn_assign_verification')}
                <ArrowRight size={15} />
              </button>

            </div>

          </section>

          <section className="panel">

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  {t('risk_case_history_eyebrow')}
                </span>

                <h3>{t('risk_case_history_title')}</h3>
              </div>

            </div>

            <div className="timeline">
              <span>
                {t('risk_detected')} <b>09 Sep</b>
              </span>

              <span>
                {t('risk_reviewed')} <b>{t('risk_pending')}</b>
              </span>

              <span>
                {t('risk_assigned')} <b>{t('risk_pending')}</b>
              </span>

              <span>
                {t('risk_field_verification')} <b>{t('risk_pending')}</b>
              </span>
            </div>

          </section>

        </aside>

      </div>
    
      <EvidenceDrawer
        node={selectedNode}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAttach={(n) => {
          attachNode(p.id, n.id, n.value || n.id);
          setDrawerOpen(false);
        }}
        agency={agency}
        project={p}
        relatedWork={relatedWork}
      />
    </div>
  );
}