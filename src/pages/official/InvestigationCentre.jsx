import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Flag,
  MapPin,
  MessageSquare,
  Paperclip,
  Search,
  SearchCheck,
  ShieldAlert,
  Upload,
  UserRound,
  LockKeyhole,
  Clock3,
  Filter,
  CheckSquare,
  AlertTriangle,
  HelpCircle,
  Eye,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projects } from '../../data/mockData';
import { calculateRiskScore } from '../../data/aiEngine';
import { useCaseContext } from '../../contexts/CaseContext';
import { useLanguage } from '../../contexts/LanguageContext';

// Modular Investigation Sub-components
import CaseSummaryHeader, { getDueDateStatus } from '../../components/investigation/CaseSummaryHeader';
import InvestigationRiskSummary from '../../components/investigation/InvestigationRiskSummary';
import InvestigationSignalCards from '../../components/investigation/InvestigationSignalCards';
import LocationVerificationPanel from '../../components/investigation/LocationVerificationPanel';
import EvidenceLocker from '../../components/investigation/EvidenceLocker';
import InvestigationActionPanel from '../../components/investigation/InvestigationActionPanel';
import WhyFlaggedSection from '../../components/investigation/WhyFlaggedSection';
import InvestigationBrief from '../../components/investigation/InvestigationBrief';
import FinancialVerificationPanel from '../../components/investigation/FinancialVerificationPanel';
import DuplicateComparisonModal from '../../components/investigation/DuplicateComparisonModal';
import VerificationChecklistWidget from '../../components/investigation/VerificationChecklistWidget';
import InvestigationAssignmentModal from '../../components/investigation/InvestigationAssignmentModal';
import SupervisorReviewPanel from '../../components/investigation/SupervisorReviewPanel';
import DataFreshnessCard from '../../components/investigation/DataFreshnessCard';
import CaseTimelineAuditTrail from '../../components/investigation/CaseTimelineAuditTrail';
import GroundVerificationCapture from '../../components/investigation/GroundVerificationCapture';
import CalibrationToast from '../../components/CalibrationToast';

export default function InvestigationCentre() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getRoleLabel } = useAuth();
  const { t } = useLanguage();
  const safeT = (key, fallback = '') => (t(key) || fallback || key);

  const {
    getCase,
    advanceStatus,
    assignCase,
    updateChecklist,
    recordDuplicateDecision,
    addEvidenceItem,
    submitSupervisorReview,
    recordFeedback,
    attachEvidence,
    projects: cloudProjects,
  } = useCaseContext();

  const allProjects = useMemo(() => {
    return (cloudProjects && cloudProjects.length > 0) ? cloudProjects : projects;
  }, [cloudProjects]);

  const [selected, setSelected] = useState(() => {
    if (id) return id.toUpperCase();
    if (cloudProjects && cloudProjects.length > 0) return cloudProjects[0].id || cloudProjects[0].work_id;
    return 'UP-VAR-2024-001';
  });
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'financial' | 'spatial' | 'evidence' | 'field' | 'review' | 'history'

  // Queue state
  const [searchQuery, setSearchQuery] = useState('');
  const [queueFilter, setQueueFilter] = useState('all');

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showGVC, setShowGVC] = useState(false);
  const [showSupervisorReview, setShowSupervisorReview] = useState(false);
  const [showFieldWorkflow, setShowFieldWorkflow] = useState(false);

  // Field Verification Stepper state
  const [fieldStep, setFieldStep] = useState(1);
  const [fieldStarted, setFieldStarted] = useState(false);
  const [fieldChecklist, setFieldChecklist] = useState({
    item_exists: true,
    item_dpr: true,
    item_progress: false,
    item_plaque: false,
    item_no_overlap: false,
    item_quality: false,
  });
  const [fieldOutcome, setFieldOutcome] = useState('');
  const [fieldRemarks, setFieldRemarks] = useState('');
  const [fieldOutcomeRecorded, setFieldOutcomeRecorded] = useState(false);

  // Model Feedback state
  const [feedback, setFeedback] = useState('');

  // Find target project
  const targetProject = useMemo(() => {
    const targetId = (id || selected || '').toUpperCase();
    return allProjects.find(
      (x) => (x.id || x.work_id || '').toUpperCase() === targetId
    ) || allProjects[0];
  }, [allProjects, id, selected]);

  // Scoped projects based on user authority
  const scopedProjects = useMemo(() => {
    return allProjects.filter((x) => {
      if (user?.role === 'ministry') return true;
      if (user?.role === 'state_nodal') {
        return x.state?.toLowerCase() === (user?.state || 'Uttar Pradesh').toLowerCase();
      }
      if (user?.role === 'mp') {
        return (x.constituency || x.block_constituency)?.toLowerCase() === (user?.constituency || 'Varanasi').toLowerCase();
      }
      return (x.district || '').toLowerCase() === (user?.district || 'Varanasi').toLowerCase();
    });
  }, [user, allProjects]);

  // Base list of anomalous / priority projects
  const baseCases = useMemo(() => {
    let list = scopedProjects.filter((x) => x.isAnomaly || (x.composite_risk_score >= 70) || x.status === 'delayed' || x.id === 'PRJ002' || x.work_id === 'UP-VAR-2024-001');
    if (targetProject && !list.some((c) => (c.id || c.work_id || '').toUpperCase() === (targetProject.id || targetProject.work_id || '').toUpperCase())) {
      list = [targetProject, ...list];
    }
    if (list.length === 0) list = scopedProjects.slice(0, 6);
    return list;
  }, [scopedProjects, targetProject]);

  // Sync route param with state
  useEffect(() => {
    if (id) {
      const match = projects.find((x) => x.id.toUpperCase() === id.toUpperCase());
      if (match && match.id !== selected) {
        setSelected(match.id);
        resetCaseState();
      }
    }
  }, [id]);

  const resetCaseState = () => {
    setFieldStep(1);
    setFieldStarted(false);
    setFieldOutcome('');
    setFieldRemarks('');
    setFieldOutcomeRecorded(false);
    setFeedback('');
  };

  const activeCases = baseCases && baseCases.length > 0 ? baseCases : (projects && projects.length > 0 ? projects : [targetProject].filter(Boolean));
  const selectedCase =
    activeCases.find((x) => String(x.id).toUpperCase() === String(selected).toUpperCase()) ||
    activeCases.find((x) => String(x.id).toUpperCase() === String(id).toUpperCase()) ||
    targetProject ||
    activeCases[0] ||
    {};

  const p = selectedCase;
  const signals = selectedCase?.signals || (p?.id === 'PRJ002' ? ['financial', 'spatial', 'timeline'] : ['verification']);
  const risk = p?.id ? calculateRiskScore(p) : { score: 0, level: 'low', factors: [] };
  const caseData = getCase(p?.id || 'PRJ002');

  const investigatorContext =
    user?.role === 'ministry'
      ? 'Central Review Cell'
      : user?.role === 'state_nodal'
        ? `State Investigation Desk · ${user?.state || 'Uttar Pradesh'}`
        : user?.role === 'mp'
          ? `Constituency Review Desk · ${user?.constituency || 'Varanasi'}`
          : `District Investigation Desk · ${user?.district || 'Varanasi'}`;

  const investigatorRole = getRoleLabel ? getRoleLabel(user?.role || 'district_authority') : (user?.role || 'Investigator');

  // Filter queue logic across 11 filters + search query
  const filteredQueue = useMemo(() => {
    return baseCases.filter((c) => {
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          (c.id || '').toLowerCase().includes(q) ||
          (c.name || '').toLowerCase().includes(q) ||
          (c.district || '').toLowerCase().includes(q) ||
          (c.agency || '').toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      const cData = getCase(c.id);
      const cRisk = calculateRiskScore(c);

      switch (queueFilter) {
        case 'high':
          return (cRisk?.score || 0) >= 50 || cRisk?.level === 'high' || cRisk?.level === 'critical';
        case 'financial':
          return (c?.spentAmount || 0) > (c?.sanctionedAmount || 0) || (((c?.financialProgress || 0) - (c?.physicalProgress || 0)) > 30);
        case 'spatial':
          return c?.id === 'PRJ002' || c?.id === 'PRJ046' || c?.id === 'PRJ047' || (c?.description && c.description.includes('SIMILAR'));
        case 'progress':
          return c?.status === 'delayed' || (c?.physicalProgress || 0) < 50;
        case 'awaiting':
          return (cData?.evidenceItems || []).length < 3 || cData?.status === 'Detected';
        case 'field':
          return cData?.status === 'UNDER_FIELD_INVESTIGATION' || cData?.status === 'Field Verification Dispatched' || !!c?.isAnomaly;
        case 'overdue':
          return getDueDateStatus(cData?.assignment?.dueDate)?.cls === 'overdue';
        case 'assigned_me':
          return !!cData?.assignment;
        case 'escalated':
          return cData?.status?.toLowerCase().includes('escalated');
        case 'resolved':
          return cData?.status === 'Resolved';
        case 'all':
        default:
          return true;
      }
    });
  }, [baseCases, searchQuery, queueFilter, getCase]);

  // Early return if no projects available at all
  if (!p || !p.id) {
    return (
      <div className="page-content investigation-page">
        <div className="workspace-head">
          <div>
            <div className="eyebrow">{safeT('inv_workspace_eyebrow', 'INVESTIGATION DOSSIER')}</div>
            <h2>{safeT('inv_title', 'Investigation Centre')}</h2>
            <p>{safeT('inv_subtitle', 'Review flagged anomalies and verify project integrity')}</p>
          </div>
        </div>
        <div className="panel" style={{ padding: 32, textAlign: 'center' }}>
          <AlertTriangle size={28} style={{ marginBottom: 12, opacity: 0.5 }} />
          <h3>No Cases Available</h3>
          <p style={{ opacity: 0.7 }}>No flagged projects found in your jurisdiction. Check back later or adjust your review filters.</p>
        </div>
      </div>
    );
  }

  const handleSelectCase = (caseId) => {
    setSelected(caseId);
    resetCaseState();
    const prefix = location.pathname.startsWith('/official/investigations')
      ? '/official/investigations'
      : location.pathname.startsWith('/official/investigation')
      ? '/official/investigation'
      : location.pathname.startsWith('/investigations')
      ? '/investigations'
      : location.pathname.startsWith('/cases')
      ? '/cases'
      : '/investigation';
    navigate(`${prefix}/${caseId}`);
  };

  // Checklist for Step 3 in Field Verification
  const fieldChecklistItems = [
    { key: 'item_exists', label: '1. Asset physically exists at approved site coordinates' },
    { key: 'item_dpr', label: '2. Work conforms to approved DPR specifications (width, grade, material)' },
    { key: 'item_progress', label: `3. Physical progress matches reported milestone (${p?.physicalProgress || 0}%)` },
    { key: 'item_plaque', label: '4. Mandatory MPLADS citizen display signboard / plaque installed' },
    { key: 'item_no_overlap', label: '5. No overlapping construction with candidate project PRJ001' },
    { key: 'item_quality', label: '6. Quality of bitumen / concrete complies with state PWD standards' },
  ];

  const allFieldChecksComplete = Object.values(fieldChecklist).every(Boolean);

  const handleToggleFieldCheck = (key) => {
    setFieldChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRecordFieldOutcome = () => {
    if (!fieldOutcome) return;
    setFieldOutcomeRecorded(true);
    advanceStatus(
      p.id,
      fieldOutcome === 'Verified / Legitimate' ? 'Resolved' : 'Under Review',
      caseData.assignedOfficer || investigatorRole,
      'investigator',
      `Field verification outcome: ${fieldOutcome}. Remarks: ${fieldRemarks || 'Checklist completed.'}`
    );
  };

  const handlePrioritizeCase = () => {
    advanceStatus(
      p.id,
      'QUEUED_FOR_FIELD_INSPECTION',
      caseData.assignedOfficer || investigatorRole,
      'investigator',
      'Case prioritized for statutory field inspection based on multi-signal anomaly triggers.'
    );
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="page-content investigation-page">
      <CalibrationToast />

      {/* HEADER */}
      <div className="workspace-head">
        <div>
          <div className="eyebrow">
            {t('inv_workspace_eyebrow')} · {investigatorContext.toUpperCase()}
          </div>
          <h2>{t('inv_title')}</h2>
          <p>{t('inv_subtitle')}</p>
        </div>

        <div className="queue-summary">
          <span>
            {t('inv_open_count')} <b>{baseCases.length || 12}</b>
          </span>
          <span>
            {t('inv_field_count')} <b>{baseCases.filter(c => { const s = getCase(c.id)?.status; return s === 'UNDER_FIELD_INVESTIGATION' || s === 'Field Verification Dispatched'; }).length || 6}</b>
          </span>
          <span>
            {t('inv_overdue_count')} <b>2</b>
          </span>
        </div>
      </div>

      {/* INVESTIGATOR CONTEXT BANNER */}
      <div className="investigator-context">
        <span className="context-dot" />
        <div>
          <span>{t('inv_case_owner')}</span>
          <b>{investigatorRole}</b>
          <small>{investigatorContext} · Cases assigned to this review desk</small>
        </div>
      </div>

      <div className="invest-layout">
        {/* =====================================================
            CASE QUEUE SIDEBAR (WITH SEARCH & 11 FILTERS)
        ====================================================== */}
        <aside className="case-queue panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('inv_my_queue')}</span>
              <h3>{t('dash_priority_cases')}</h3>
            </div>
            <span className="queue-total-badge">{filteredQueue.length}</span>
          </div>

          {/* Search Box */}
          <div className="queue-search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="queue-search-input"
              placeholder={t('inv_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 11 Functional Filters */}
          <div className="queue-filter-pills-scroll">
            <button
              type="button"
              className={queueFilter === 'all' ? 'selected' : ''}
              onClick={() => setQueueFilter('all')}
            >
              {t('inv_filter_all')} ({baseCases.length})
            </button>
            <button
              type="button"
              className={queueFilter === 'high' ? 'selected' : ''}
              onClick={() => setQueueFilter('high')}
            >
              {t('inv_filter_high')}
            </button>
            <button
              type="button"
              className={queueFilter === 'financial' ? 'selected' : ''}
              onClick={() => setQueueFilter('financial')}
            >
              {t('inv_filter_fin_anomaly')}
            </button>
            <button
              type="button"
              className={queueFilter === 'spatial' ? 'selected' : ''}
              onClick={() => setQueueFilter('spatial')}
            >
              {t('inv_filter_spatial_dup')}
            </button>
            <button
              type="button"
              className={queueFilter === 'progress' ? 'selected' : ''}
              onClick={() => setQueueFilter('progress')}
            >
              {t('inv_filter_progress_anomaly')}
            </button>
            <button
              type="button"
              className={queueFilter === 'field' ? 'selected' : ''}
              onClick={() => setQueueFilter('field')}
            >
              {t('inv_filter_field')}
            </button>
            <button
              type="button"
              className={queueFilter === 'awaiting' ? 'selected' : ''}
              onClick={() => setQueueFilter('awaiting')}
            >
              {t('inv_filter_awaiting_evidence')}
            </button>
            <button
              type="button"
              className={queueFilter === 'overdue' ? 'selected' : ''}
              onClick={() => setQueueFilter('overdue')}
            >
              {t('inv_filter_overdue')}
            </button>
            <button
              type="button"
              className={queueFilter === 'assigned_me' ? 'selected' : ''}
              onClick={() => setQueueFilter('assigned_me')}
            >
              {t('inv_filter_assigned_me')}
            </button>
            <button
              type="button"
              className={queueFilter === 'escalated' ? 'selected' : ''}
              onClick={() => setQueueFilter('escalated')}
            >
              {t('inv_filter_escalated')}
            </button>
            <button
              type="button"
              className={queueFilter === 'resolved' ? 'selected' : ''}
              onClick={() => setQueueFilter('resolved')}
            >
              {t('inv_filter_closed')}
            </button>
          </div>

          {/* Cases List */}
          <div className="queue-cases-list custom-scrollbar overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: 0 }}>
            {filteredQueue.length === 0 ? (
              <div className="queue-empty-msg">
                <Filter size={18} className="text-muted" />
                <p>No cases match selected filter criteria.</p>
              </div>
            ) : (
              filteredQueue.map((c) => {
                const cRisk = calculateRiskScore(c);
                const cData = getCase(c.id);
                const isSelected = selected === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`queue-case-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectCase(c.id)}
                  >
                    <div className="card-top-row">
                      <span className={`queue-score ${cRisk.level}`}>
                        {cRisk.score}
                      </span>
                      <div className="card-top-info">
                        <b>{c.id}</b>
                        <span className="card-status-badge">
                          {cData.status === 'UNDER_FIELD_INVESTIGATION' ? 'Field Verification Dispatched' : cData.status}
                        </span>
                      </div>
                    </div>

                    <p className="case-card-title">{c.name}</p>

                    <div className="card-meta-row">
                      <span>{c.district}</span>
                      <span>·</span>
                      <span className="cost-tag">₹{((c.sanctionedAmount || 0) / 100000).toFixed(1)}L</span>
                      {c.spentAmount > c.sanctionedAmount && (
                        <span className="overrun-tag">Overrun</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* =====================================================
            MAIN WORKSPACE AREA
        ====================================================== */}
        <main className="invest-workspace">
          {/* 1. COMPACT CASE SUMMARY AT TOP */}
          <CaseSummaryHeader
            project={p}
            risk={risk}
            caseData={caseData}
            onOpenAssign={() => setShowAssignModal(true)}
          />

          {/* QUICK ANCHOR SHORTCUT STRIP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', padding: '10px 0', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginRight: 4, flexShrink: 0 }}>
              Dossier Sections:
            </span>
            <button type="button" className="link-btn" onClick={() => scrollToSection('section-risk-summary')}>
              Risk Summary
            </button>
            <span style={{ color: 'var(--line)' }}>·</span>
            <button type="button" className="link-btn" onClick={() => scrollToSection('section-signals')}>
              Signal Breakdown
            </button>
            <span style={{ color: 'var(--line)' }}>·</span>
            <button type="button" className="link-btn" onClick={() => scrollToSection('section-gis-map')}>
              GIS Verification
            </button>
            <span style={{ color: 'var(--line)' }}>·</span>
            <button type="button" className="link-btn" onClick={() => scrollToSection('section-evidence-vault')}>
              Evidence Vault
            </button>
            <span style={{ color: 'var(--line)' }}>·</span>
            <button type="button" className="link-btn" onClick={() => scrollToSection('section-actions')}>
              Action Panel
            </button>
            <span style={{ color: 'var(--line)' }}>·</span>
            <button type="button" className="link-btn" onClick={() => scrollToSection('section-timeline')}>
              Timeline & Audit
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                className="secondary-action"
                style={{ fontSize: 11, padding: '4px 10px', height: 28 }}
                onClick={() => setShowFieldWorkflow(!showFieldWorkflow)}
              >
                <Camera size={13} />
                <span>{showFieldWorkflow ? 'Hide Field Tool' : 'Field Inspection Stepper'}</span>
              </button>
              <button
                type="button"
                className="secondary-action"
                style={{ fontSize: 11, padding: '4px 10px', height: 28 }}
                onClick={() => setShowSupervisorReview(!showSupervisorReview)}
              >
                <FileText size={13} />
                <span>{showSupervisorReview ? 'Hide Supervisor' : 'Supervisor Review'}</span>
              </button>
            </div>
          </div>

          {/* 2. RISK SUMMARY */}
          <section id="section-risk-summary">
            <InvestigationRiskSummary
              project={p}
              risk={risk}
              caseData={caseData}
            />
          </section>

          {/* 3. SIGNAL BREAKDOWN (4 CARDS: FINANCIAL, PROGRESS, TIMELINE, SPATIAL) */}
          <section id="section-signals">
            <InvestigationSignalCards
              project={p}
              caseData={caseData}
              onOpenDuplicateModal={() => setShowDuplicateModal(true)}
            />
          </section>

          {/* 4. PHYSICAL / GIS VERIFICATION (EMBEDDED CIVICMAP) */}
          <section id="section-gis-map">
            <LocationVerificationPanel
              project={p}
              caseData={caseData}
              candidateProject={allProjects.find((pr) => pr.id === 'PRJ001') || null}
              onOpenDuplicateModal={() => setShowDuplicateModal(true)}
              onStartFieldVerification={() => {
                setShowFieldWorkflow(true);
                setFieldStarted(true);
                setFieldStep(2);
                scrollToSection('section-field-tool');
              }}
            />
          </section>

          {/* OPTIONAL FIELD INSPECTION CAMERA STEPPER DRAWER */}
          {showFieldWorkflow && (
            <section id="section-field-tool" className="panel field-verification" style={{ padding: '20px 24px', background: '#FAFBF8', border: '2px solid var(--brand)', borderRadius: 14 }}>
              <div className="panel-head" style={{ marginBottom: 14 }}>
                <div>
                  <span className="eyebrow">{t('inv_field_eyebrow')}</span>
                  <h3>{t('inv_close_loop')}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                    Mobile on-site photo capture, GPS spoof verification, and statutory inspection checklist.
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-action"
                  style={{ fontSize: 11, height: 28 }}
                  onClick={() => setShowFieldWorkflow(false)}
                >
                  Close Drawer ✕
                </button>
              </div>

              {/* 4-Step Header Bar */}
              <div className="field-steps">
                <button
                  type="button"
                  className={`field-step ${fieldStep === 1 ? 'active' : ''} ${fieldStep > 1 ? 'completed' : ''}`}
                  onClick={() => setFieldStep(1)}
                >
                  <span>01</span>
                  <b>{t('inv_step1_title')}</b>
                  <small>{t('inv_step1_sub')}</small>
                </button>

                <button
                  type="button"
                  className={`field-step ${fieldStep === 2 ? 'active' : ''} ${fieldStep > 2 ? 'completed' : ''}`}
                  onClick={() => setFieldStep(2)}
                >
                  <span>02</span>
                  <b>{t('inv_step2_title')}</b>
                  <small>{t('inv_step2_sub')}</small>
                </button>

                <button
                  type="button"
                  className={`field-step ${fieldStep === 3 ? 'active' : ''} ${fieldStep > 3 ? 'completed' : ''}`}
                  onClick={() => setFieldStep(3)}
                >
                  <span>03</span>
                  <b>{t('inv_step3_title')}</b>
                  <small>{t('inv_step3_sub')}</small>
                </button>

                <button
                  type="button"
                  className={`field-step ${fieldStep === 4 ? 'active' : ''}`}
                  onClick={() => setFieldStep(4)}
                >
                  <span>04</span>
                  <b>{t('inv_step4_title')}</b>
                  <small>{t('inv_step4_sub')}</small>
                </button>
              </div>

              {/* STEP 1: EXPECTED LOCATION */}
              {fieldStep === 1 && (
                <div className="step-content-box" style={{ marginTop: 14 }}>
                  <h4>Step 01: Expected Project Coordinates & Boundary</h4>
                  <p>
                    Inspect approved site baseline coordinates from the District Engineering registry.
                  </p>
                  <div className="step1-coords-display">
                    <div>
                      <span>Latitude:</span> <b>{p.latitude || 25.3176}° N</b>
                    </div>
                    <div>
                      <span>Longitude:</span> <b>{p.longitude || 82.9739}° E</b>
                    </div>
                    <div>
                      <span>Permitted Perimeter:</span> <b>50 meters</b>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="primary-action"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      setFieldStarted(true);
                      setFieldStep(2);
                    }}
                  >
                    Proceed to Step 02 (Capture Evidence) →
                  </button>
                </div>
              )}

              {/* STEP 2: CAPTURE EVIDENCE */}
              {fieldStep === 2 && (
                <div className="step-content-box" style={{ marginTop: 14 }}>
                  <h4>Step 02: Capture Geotagged Field Evidence</h4>
                  <p>
                    Activate device camera to capture timestamped, geotagged on-site reality.
                  </p>
                  {caseData?.capturedEvidence ? (
                    <div className="captured-preview-box" style={{ marginBottom: 12 }}>
                      <CheckCircle2 size={16} className="text-brand" />
                      <div>
                        <b>Geotagged Photo Captured</b>
                        <small>
                          Drift: {caseData.capturedEvidence.spatialDriftMeters}m · Timestamp:{' '}
                          {caseData.capturedEvidence.capturedAt}
                        </small>
                      </div>
                    </div>
                  ) : null}
                  <div className="action-row" style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => setShowGVC(true)}
                    >
                      <Camera size={15} />
                      Launch Camera / Ground Verification Tool
                    </button>
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => setFieldStep(3)}
                    >
                      Proceed to Step 03 (Checklist) →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: VERIFY CHECKLIST */}
              {fieldStep === 3 && (
                <div className="step-content-box" style={{ marginTop: 14 }}>
                  <h4>Step 03: Mandatory 6-Item Field Inspection Checklist</h4>
                  <p>
                    Inspectors must review each field parameter before recording final determination.
                  </p>

                  <div className="field-checklist-items">
                    {fieldChecklistItems.map((item) => {
                      const checked = !!fieldChecklist[item.key];
                      return (
                        <div
                          key={item.key}
                          className={`field-check-row ${checked ? 'checked' : ''}`}
                          onClick={() => handleToggleFieldCheck(item.key)}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleFieldCheck(item.key)}
                          />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="action-row" style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => setFieldStep(4)}
                    >
                      Proceed to Step 04 (Record Outcome) →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: RECORD OUTCOME */}
              {fieldStep === 4 && (
                <div className="step-content-box" style={{ marginTop: 14 }}>
                  <h4>Step 04: Record Field Verification Outcome</h4>
                  <p>
                    Select final field determination. Marking "Verified / Legitimate" requires all 6 checklist items in Step 03.
                  </p>

                  <label className="field-label">Field Determination</label>
                  <select
                    className="select wide"
                    value={fieldOutcome}
                    onChange={(e) => setFieldOutcome(e.target.value)}
                  >
                    <option value="">Select an outcome…</option>
                    <option
                      value="Verified / Legitimate"
                      disabled={!allFieldChecksComplete}
                    >
                      Verified / Legitimate {!allFieldChecksComplete ? '(Requires all 6 checks)' : ''}
                    </option>
                    <option value="Issue Found / Deficiency Noted">
                      Issue Found / Deficiency Noted
                    </option>
                    <option value="Insufficient Evidence / Access Obstructed">
                      Insufficient Evidence / Access Obstructed
                    </option>
                  </select>

                  <label className="field-label" style={{ marginTop: 10 }}>Field Notes & Observations</label>
                  <textarea
                    className="note-box"
                    rows={3}
                    placeholder="Record verified measurements, culvert dimensions, bitumen thickness, or deficiencies..."
                    value={fieldRemarks}
                    onChange={(e) => setFieldRemarks(e.target.value)}
                  />

                  <div className="action-row" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="primary-action"
                      disabled={!fieldOutcome || fieldOutcomeRecorded}
                      onClick={handleRecordFieldOutcome}
                    >
                      {fieldOutcomeRecorded ? (
                        <>
                          <CheckCircle2 size={15} /> Outcome Recorded on Docket
                        </>
                      ) : (
                        'Save & Record Field Outcome'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 5. EVIDENCE VAULT (4 CATEGORIES) */}
          <section id="section-evidence-vault">
            <EvidenceLocker
              caseData={caseData}
              onAddEvidence={(item) =>
                addEvidenceItem(p.id, item, investigatorRole)
              }
            />
          </section>

          {/* 6. ACTION PANEL (3 PROMINENT OPERATIONAL BUTTONS) */}
          <section id="section-actions">
            <InvestigationActionPanel
              project={p}
              caseData={caseData}
              investigatorRole={investigatorRole}
              onPrioritize={handlePrioritizeCase}
              onOpenAssignModal={() => setShowAssignModal(true)}
            />
          </section>

          {/* OPTIONAL SUPERVISOR REVIEW PANEL */}
          {showSupervisorReview && (
            <section id="section-supervisor-review">
              <SupervisorReviewPanel
                project={p}
                caseData={caseData}
                onSubmitAssessment={(outcomeVal, noteVal) => {
                  advanceStatus(
                    p.id,
                    'Under Review',
                    caseData.assignedOfficer || investigatorRole,
                    'investigator',
                    `Investigator assessment: ${outcomeVal}. Note: ${noteVal}`
                  );
                }}
                onSubmitSupervisorReview={(payload) => {
                  submitSupervisorReview(
                    p.id,
                    payload,
                    user?.name || 'District Magistrate (Varanasi)',
                    user?.role || 'district_authority'
                  );
                }}
              />
            </section>
          )}

          {/* 7. TIMELINE & AUDIT TRAIL */}
          <section id="section-timeline">
            <CaseTimelineAuditTrail
              caseData={caseData}
              project={p}
            />
          </section>
        </main>
      </div>

      {/* =========================================================
          MODALS
      ========================================================= */}

      {/* 6. SPATIAL / DUPLICATE COMPARISON MODAL */}
      {showDuplicateModal && (
        <DuplicateComparisonModal
          currentProject={p}
          candidateProject={projects.find((pr) => pr.id === 'PRJ001') || projects[0]}
          existingDecision={caseData?.duplicateDecision}
          onClose={() => setShowDuplicateModal(false)}
          onRecordDecision={(currentId, candId, decision, notes) => {
            recordDuplicateDecision(currentId, candId, decision, notes, investigatorRole);
            setShowDuplicateModal(false);
          }}
        />
      )}

      {/* 10. INVESTIGATION ASSIGNMENT MODAL */}
      {showAssignModal && (
        <InvestigationAssignmentModal
          project={p}
          existingAssignment={caseData?.assignment}
          onClose={() => setShowAssignModal(false)}
          onSaveAssignment={(assignmentData) => {
            assignCase(p.id, assignmentData, user?.name || 'District Authority', user?.role || 'district_authority');
          }}
        />
      )}

      {/* GROUND VERIFICATION CAPTURE (CAMERA STREAM) */}
      {showGVC && (
        <GroundVerificationCapture
          sanctionCoordinates={{ lat: p.latitude || 25.3176, lng: p.longitude || 82.9739 }}
          claimedCategory={p.sector}
          onCaptureComplete={(payload) => {
            attachEvidence(p.id, payload);
            setShowGVC(false);
            setFieldStep(3);
          }}
          onClose={() => setShowGVC(false)}
        />
      )}
    </div>
  );
}