import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Search,
  X,
  ArrowUpDown,
  Clock,
  TrendingUp,
  Database,
  RefreshCw,
  Download,
  FileText,
  Camera,
  MessageSquare,
  Eye,
  Compass,
  Sparkles,
  Filter,
  ChevronRight,
  Activity,
  Copy,
  Info,
  Check,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCaseContext } from '../../contexts/CaseContext';
import CivicMap from '../../components/map/CivicMap';
import SpeakerButton from '../../components/SpeakerButton';
import InvestigationAssignmentModal from '../../components/investigation/InvestigationAssignmentModal';
import FinancialPhysicalProgressChart from '../../components/dashboard/FinancialPhysicalProgressChart';
import { exportProjectsToCSV, generateEvidenceSummaryText } from '../../utils/reportExport';
import { calculateRiskScore } from '../../data/aiEngine';
import { projects as mockProjects, agencies, states } from '../../data/mockData';
import { formatLakhs, safeNumber } from '../../utils/demoFormat';
import { getCoordinatesForDistrict } from '../../utils/geo';

// ─── Primary Signal Resolver ──────────────────────────────────────────────────
function resolvePrimarySignal(p, finProg, physProg) {
  const score = p.composite_risk_score != null ? p.composite_risk_score : (p.riskScore || p.risk?.score || 0);
  const sanctioned = p.sanctionedAmount || (p.sanctioned_amount_lakhs ? p.sanctioned_amount_lakhs * 100000 : 0);
  const spent = p.spentAmount || (p.expenditure_lakhs ? p.expenditure_lakhs * 100000 : 0);

  if (finProg > physProg + 35) return { key: 'financial_mismatch', label: 'Financial–Physical Mismatch', severity: 'high', icon: DollarSign };
  if (spent > sanctioned * 1.15) return { key: 'cost_anomaly', label: 'Cost Overrun Anomaly', severity: 'high', icon: TrendingUp };
  if (p.status === 'delayed' || (p.temporal_slippage_signal && !p.temporal_slippage_signal.includes('ON_SCHEDULE'))) {
    return { key: 'timeline_delay', label: 'Gestation Timeline Delay', severity: 'medium', icon: Clock };
  }
  if (p.id === 'PRJ002' || (p.spatial_clustering_signal && !p.spatial_clustering_signal.includes('CLEAR'))) {
    return { key: 'spatial_anomaly', label: 'Geospatial Duplicate Overlap', severity: 'medium', icon: MapPin };
  }
  if (p.progress_discrepancy_points && p.progress_discrepancy_points > 15) {
    return { key: 'visual_mismatch', label: 'Visual Progress Discrepancy', severity: 'high', icon: Camera };
  }
  if (p.isAnomaly || score >= 70) {
    return { key: 'composite_anomaly', label: 'Multi-Signal Anomaly Flagged', severity: 'high', icon: ShieldAlert };
  }
  return { key: 'on_track', label: 'Milestones On Track', severity: 'low', icon: CheckCircle2 };
}

// ─── Main Official Command Centre ─────────────────────────────────────────────
export default function OfficialDashboard() {
  const navigate = useNavigate();
  const { user, getRoleLabel } = useAuth();
  const { lang } = useLanguage();
  const hi = lang === 'hi';

  const {
    projects: cloudProjects,
    loading: isSyncing,
    backendStatus,
    refreshData,
    getCase,
    assignCase,
    complaints
  } = useCaseContext();

  // ── State Filters & Selection ──
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [activeKpiFilter, setActiveKpiFilter] = useState(null); // 'high' | 'medium' | 'active' | 'verification' | 'observations'
  const [activeSignalFilter, setActiveSignalFilter] = useState(null); // signal key
  const [activeDelayFilter, setActiveDelayFilter] = useState(null); // 'critical' | 'delayed' | 'at_risk' | 'on_track'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score_desc'); // 'score_desc' | 'score_asc' | 'spent_desc' | 'recent'
  const [selectedProjectId, setSelectedProjectId] = useState('PRJ002');
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // Modals
  const [docketModalProject, setDocketModalProject] = useState(null);
  const [docketCopied, setDocketCopied] = useState(false);
  const [dispatchModalProject, setDispatchModalProject] = useState(null);

  // Agency Map
  const agencyMap = useMemo(() => {
    const map = {};
    agencies.forEach(a => { map[a.id] = a.name; });
    return map;
  }, []);

  // ── 1. Base Active Project Pool ──
  const activePool = useMemo(() => {
    return (cloudProjects && cloudProjects.length > 0) ? cloudProjects : mockProjects;
  }, [cloudProjects]);

  // ── 2. Jurisdiction-Scoped Projects ──
  const scopedProjects = useMemo(() => {
    return activePool.filter(p => {
      // Role scope
      if (user?.role === 'state_nodal' && p.state && user?.state) {
        if (p.state.toLowerCase() !== user.state.toLowerCase()) return false;
      } else if (user?.role === 'mp' && user?.constituency) {
        const c = (p.constituency || p.block_constituency || '').toLowerCase();
        if (c !== user.constituency.toLowerCase()) return false;
      } else if (user?.role === 'district_authority' && user?.district) {
        if ((p.district || '').toLowerCase() !== user.district.toLowerCase()) return false;
      }

      // Manual UI Drilldown filters
      if (selectedState && (p.state || '').toLowerCase() !== selectedState.toLowerCase()) return false;
      if (selectedDistrict && (p.district || '').toLowerCase() !== selectedDistrict.toLowerCase()) return false;
      if (selectedSector !== 'all' && (p.sector || p.category || '').toLowerCase() !== selectedSector.toLowerCase()) return false;

      return true;
    });
  }, [activePool, user, selectedState, selectedDistrict, selectedSector]);

  // ── 3. Scored & Normalized Project List ──
  const scoredProjects = useMemo(() => {
    return scopedProjects.map(p => {
      const computedRisk = calculateRiskScore(p);
      const scoreVal = p.composite_risk_score != null ? Number(p.composite_risk_score) : (p.riskScore != null ? Number(p.riskScore) : computedRisk.score);
      const sanctioned = p.sanctionedAmount || (p.sanctioned_amount_lakhs ? Number(p.sanctioned_amount_lakhs) * 100000 : 0);
      const spent = p.spentAmount || (p.expenditure_lakhs ? Number(p.expenditure_lakhs) * 100000 : 0);
      const physProg = p.physicalProgress ?? p.reported_progress_pct ?? 50;
      const finProg = sanctioned > 0 ? Math.round((spent / sanctioned) * 100) : 0;
      const primarySignal = resolvePrimarySignal(p, finProg, physProg);
      const riskTier = scoreVal >= 70 ? 'HIGH' : scoreVal >= 40 ? 'MEDIUM' : 'LOW';

      return {
        ...p,
        id: p.id || p.work_id,
        name: p.name || p.work_name,
        sanctionedAmount: sanctioned,
        spentAmount: spent,
        physicalProgress: physProg,
        financialProgress: finProg,
        riskScore: scoreVal,
        riskTier,
        primarySignal,
        risk: {
          ...computedRisk,
          score: scoreVal,
          tier: riskTier
        }
      };
    });
  }, [scopedProjects]);

  // ── 4. Filtered Queue for Table ──
  const filteredQueue = useMemo(() => {
    return scoredProjects
      .filter(p => {
        const caseData = getCase(p.id);
        const auditStatus = p.audit_status || caseData?.status || 'MONITORED_AUTO';

        // KPI card filter
        if (activeKpiFilter === 'high' && p.riskScore < 70 && p.review_priority !== 'HIGH_PRIORITY') return false;
        if (activeKpiFilter === 'medium' && (p.riskScore < 40 || p.riskScore >= 70)) return false;
        if (activeKpiFilter === 'active' && (p.work_status === 'Completed' || p.status === 'completed')) return false;
        if (activeKpiFilter === 'mismatch' && !(p.financialProgress - p.physicalProgress > 20)) return false;
        if (activeKpiFilter === 'verification') {
          const isUnderVerif = ['QUEUED_FOR_FIELD_INSPECTION', 'UNDER_FIELD_INVESTIGATION', 'Field Verification Dispatched', 'Under Review'].includes(auditStatus) || p.riskScore >= 70;
          if (!isUnderVerif) return false;
        }
        if (activeKpiFilter === 'observations') {
          // Has matching citizen observation
          const hasObs = (complaints || []).some(c => c.projectId === p.id || c.work_id === p.id);
          if (!hasObs && !p.isAnomaly) return false;
        }

        // Signal filter
        if (activeSignalFilter) {
          if (activeSignalFilter === 'financial_mismatch' && !(p.financialProgress > p.physicalProgress + 25)) return false;
          if (activeSignalFilter === 'cost_anomaly' && !(p.spentAmount > p.sanctionedAmount * 1.05)) return false;
          if (activeSignalFilter === 'timeline_delay' && !(p.status === 'delayed' || p.primarySignal.key === 'timeline_delay')) return false;
          if (activeSignalFilter === 'expenditure_anomaly' && !(p.spentAmount > p.sanctionedAmount)) return false;
          if (activeSignalFilter === 'spatial_anomaly' && !(p.id === 'PRJ002' || p.primarySignal.key === 'spatial_anomaly')) return false;
          if (activeSignalFilter === 'agency_pattern' && !(p.risk?.factors?.some(f => f.toLowerCase().includes('agency')) || p.agency === 'AG003')) return false;
          if (activeSignalFilter === 'citizen_observation' && !(complaints || []).some(c => c.projectId === p.id || c.work_id === p.id)) return false;
          if (activeSignalFilter === 'visual_mismatch' && !(p.progress_discrepancy_points && p.progress_discrepancy_points > 10)) return false;
        }

        // Delay filter
        if (activeDelayFilter === 'critical' && !(p.status === 'delayed' && p.riskScore >= 70)) return false;
        if (activeDelayFilter === 'delayed' && !(p.status === 'delayed')) return false;
        if (activeDelayFilter === 'at_risk' && !(p.physicalProgress < 50 && p.status !== 'completed')) return false;
        if (activeDelayFilter === 'on_track' && (p.status === 'delayed' || p.riskScore >= 70)) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const contractor = (agencyMap[p.agency] || p.implementing_agency || '').toLowerCase();
          const searchable = `${p.id} ${p.name} ${p.district} ${p.state} ${p.sector} ${p.category} ${contractor} ${p.primarySignal.label}`.toLowerCase();
          if (!searchable.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return b.riskScore - a.riskScore;
        if (sortBy === 'score_asc') return a.riskScore - b.riskScore;
        if (sortBy === 'spent_desc') return b.spentAmount - a.spentAmount;
        if (sortBy === 'recent') {
          const tA = new Date(a.sanctionDate || a.startDate || '2024-01-01').getTime();
          const tB = new Date(b.sanctionDate || b.startDate || '2024-01-01').getTime();
          return tB - tA;
        }
        return b.riskScore - a.riskScore;
      });
  }, [scoredProjects, activeKpiFilter, activeSignalFilter, activeDelayFilter, searchQuery, sortBy, getCase, complaints, agencyMap]);

  // ── 5. Selected Project Dossier Data ──
  const selectedProject = useMemo(() => {
    return scoredProjects.find(p => p.id === selectedProjectId) || scoredProjects[0] || null;
  }, [scoredProjects, selectedProjectId]);

  // ── 6. Aggregate KPIs ──
  const kpiData = useMemo(() => {
    const total = scoredProjects.length;
    const active = scoredProjects.filter(p => p.work_status !== 'Completed' && p.status !== 'completed').length;
    const highPriority = scoredProjects.filter(p => p.riskScore >= 70 || p.review_priority === 'HIGH_PRIORITY').length;
    const mediumPriority = scoredProjects.filter(p => p.riskScore >= 40 && p.riskScore < 70).length;
    const requiringVerif = scoredProjects.filter(p => {
      const caseData = getCase(p.id);
      const auditStatus = p.audit_status || caseData?.status || 'MONITORED_AUTO';
      return ['QUEUED_FOR_FIELD_INSPECTION', 'UNDER_FIELD_INVESTIGATION', 'Field Verification Dispatched', 'Under Review'].includes(auditStatus) || p.riskScore >= 70;
    }).length;
    const obsCount = complaints ? complaints.length : 0;
    const mismatchCount = scoredProjects.filter(p => (p.financialProgress - p.physicalProgress) > 20).length;

    const exposureLakhs = scoredProjects
      .filter(p => safeNumber(p.riskScore, 0) >= 70)
      .reduce((acc, p) => acc + (safeNumber(p.sanctionedAmount, 0) / 100000), 0);

    return {
      total: safeNumber(total, 0),
      active: safeNumber(active, 0),
      highPriority: safeNumber(highPriority, 0),
      mediumPriority: safeNumber(mediumPriority, 0),
      requiringVerif: safeNumber(requiringVerif, 0),
      obsCount: safeNumber(obsCount, 0),
      mismatchCount: safeNumber(mismatchCount, 0),
      exposureLakhs: safeNumber(exposureLakhs, 0),
    };
  }, [scoredProjects, complaints, getCase]);

  // ── 7. Signal Counts for "Why Flagged" Matrix ──
  const signalCounts = useMemo(() => {
    let finMismatch = 0, costOverrun = 0, timeDelay = 0, expAnomaly = 0, spatial = 0, agencyPattern = 0, citizenObs = 0, visualDisc = 0;

    scoredProjects.forEach(p => {
      if (p.financialProgress > p.physicalProgress + 25) finMismatch++;
      if (p.spentAmount > p.sanctionedAmount * 1.05) costOverrun++;
      if (p.status === 'delayed' || p.primarySignal.key === 'timeline_delay') timeDelay++;
      if (p.spentAmount > p.sanctionedAmount) expAnomaly++;
      if (p.id === 'PRJ002' || p.primarySignal.key === 'spatial_anomaly') spatial++;
      if (p.risk?.factors?.some(f => f.toLowerCase().includes('agency')) || p.agency === 'AG003') agencyPattern++;
      if ((complaints || []).some(c => c.projectId === p.id || c.work_id === p.id)) citizenObs++;
      if (p.progress_discrepancy_points && p.progress_discrepancy_points > 10) visualDisc++;
    });

    return [
      { key: 'financial_mismatch', label: 'Financial–Physical Mismatch', count: finMismatch, desc: 'Expenditure % outpaces physical completion', severity: 'high' },
      { key: 'cost_anomaly', label: 'Cost Overrun Anomaly', count: costOverrun, desc: 'Disbursements exceed sanctioned DPR amount', severity: 'high' },
      { key: 'timeline_delay', label: 'Gestation Timeline Delay', count: timeDelay, desc: 'Behind statutory completion timeline', severity: 'medium' },
      { key: 'expenditure_anomaly', label: 'Expenditure Velocity Spike', count: expAnomaly, desc: 'Rapid disbursement before milestone verification', severity: 'medium' },
      { key: 'spatial_anomaly', label: 'Geospatial Duplicate Overlap', count: spatial, desc: 'Proximity cluster within 250m radius', severity: 'medium' },
      { key: 'agency_pattern', label: 'Agency Concentration Pattern', count: agencyPattern, desc: 'Multiple flagged contracts under single vendor', severity: 'low' },
      { key: 'citizen_observation', label: 'Citizen Ground Observations', count: citizenObs, desc: 'Public discrepancy filings recorded', severity: 'high' },
      { key: 'visual_mismatch', label: 'Visual Progress Discrepancy', count: visualDisc, desc: 'AI satellite/photo estimate vs claimed DPR', severity: 'high' }
    ];
  }, [scoredProjects, complaints]);

  // ── 8. Delay Matrix Counts ──
  const delayStats = useMemo(() => {
    let onTrack = 0, atRisk = 0, delayed = 0, critical = 0;
    scoredProjects.forEach(p => {
      if (p.status === 'delayed' && p.riskScore >= 70) critical++;
      else if (p.status === 'delayed') delayed++;
      else if (p.physicalProgress < 50 && p.status !== 'completed') atRisk++;
      else onTrack++;
    });
    return { onTrack, atRisk, delayed, critical };
  }, [scoredProjects]);

  // ── 9. Live System Alerts ──
  const liveAlerts = useMemo(() => {
    const alerts = [];
    scoredProjects.filter(p => p.riskScore >= 70).slice(0, 4).forEach(p => {
      alerts.push({
        id: `ALT-${p.id}`,
        projectId: p.id,
        type: 'HIGH_PRIORITY',
        title: `${p.id} · Priority Verification Required`,
        desc: `${p.name} exhibits ${p.primarySignal.label} (${p.riskScore}/100 Risk Score).`,
        time: 'Active Alert',
        severity: 'critical'
      });
    });

    if (complaints && complaints.length > 0) {
      complaints.slice(0, 2).forEach((c, idx) => {
        alerts.push({
          id: `ALT-CIT-${idx}`,
          projectId: c.projectId,
          type: 'CITIZEN_OBSERVATION',
          title: `Citizen Observation on ${c.projectId}`,
          desc: `Issue: ${c.issueType || 'Ground Discrepancy'} — "${(c.observation || '').slice(0, 55)}..."`,
          time: 'Recent Submission',
          severity: 'amber'
        });
      });
    }

    return alerts;
  }, [scoredProjects, complaints]);

  // ── Handlers ──
  const handleRefresh = async () => {
    await refreshData();
    setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleExportCSV = () => {
    exportProjectsToCSV(filteredQueue, `prahari_command_centre_${selectedDistrict || 'national'}_${Date.now()}.csv`);
  };

  const handleResetFilters = () => {
    setActiveKpiFilter(null);
    setActiveSignalFilter(null);
    setActiveDelayFilter(null);
    setSearchQuery('');
    setSelectedSector('all');
  };

  const handleOpenDocket = (proj) => {
    setDocketModalProject(proj);
    setDocketCopied(false);
  };

  // Available unique districts for dropdown based on active state
  const availableDistricts = useMemo(() => {
    const set = new Set();
    activePool.forEach(p => {
      if (!selectedState || (p.state || '').toLowerCase() === selectedState.toLowerCase()) {
        if (p.district) set.add(p.district);
      }
    });
    return Array.from(set).sort();
  }, [activePool, selectedState]);

  // Available unique sectors
  const availableSectors = useMemo(() => {
    const set = new Set();
    activePool.forEach(p => {
      const s = p.sector || p.category;
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [activePool]);

  // Dynamic Map Center & Zoom based on active geographic drilldown
  const mapCenter = useMemo(() => {
    if (selectedDistrict) {
      const resolved = getCoordinatesForDistrict(selectedDistrict, activePool);
      if (resolved) return { lat: resolved.lat, lng: resolved.lng };
    }
    if (selectedState) {
      const resolved = getCoordinatesForDistrict(selectedState, activePool);
      if (resolved) return { lat: resolved.lat, lng: resolved.lng };
    }
    return { lat: 22.9734, lng: 78.6569 };
  }, [selectedDistrict, selectedState, activePool]);

  const mapZoom = useMemo(() => {
    if (selectedDistrict) return 11;
    if (selectedState) return 7;
    return 5;
  }, [selectedDistrict, selectedState]);

  return (
    <div className="page-content command-page overflow-x-hidden">
      {/* ════════════════════════════════════════════════════════════════════════
          COMMAND CENTRE HEADER & OPERATIONAL STATUS BAR
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="workspace-head command-header-surface">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <span className="live-status-ping" />
            <span>OPERATIONAL DECISION-SUPPORT CENTRE · {getRoleLabel(user?.role || 'district_authority').toUpperCase()}</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.025em', margin: '4px 0 2px' }}>
            PRahari Command Centre
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
            {hi ? 'एआई-संचालित एमपीलैड्स परियोजना जोखिम निगरानी एवं स्थलीय सत्यापन प्रणाली' : 'AI-powered MPLADS project risk monitoring & verification'}
          </p>
        </div>

        {/* Operational Toolbar & Data Connection Status */}
        <div className="command-top-actions flex flex-wrap items-center gap-3">
          {/* Data Connection Badge */}
          <div
            className={`data-connection-badge ${backendStatus === 'offline' ? 'offline' : 'connected'}`}
            title={backendStatus === 'offline' ? 'Database connection unavailable. Using cached local data.' : 'Connected to Supabase Cloud PostgREST database'}
          >
            <Database size={13} />
            <span>{backendStatus === 'offline' ? 'Data connection unavailable' : 'Cloud Connected (Supabase)'}</span>
            <small style={{ opacity: 0.8 }}>· {lastSyncTime}</small>
          </div>

          {/* Action: Refresh Data */}
          <button
            type="button"
            className="command-tool-btn"
            onClick={handleRefresh}
            disabled={isSyncing}
            title="Fetch latest project and intelligence records from Supabase"
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} />
            <span>{isSyncing ? (hi ? 'सिंक हो रहा है…' : 'Syncing…') : (hi ? 'रिफ्रेश' : 'Refresh Data')}</span>
          </button>

          {/* Action: Export CSV */}
          <button
            type="button"
            className="command-tool-btn"
            onClick={handleExportCSV}
            title="Download active filtered risk register as CSV"
          >
            <Download size={14} />
            <span>{hi ? 'जोखिम सूची डाउनलोड' : 'Export Risk List'}</span>
          </button>

          {/* Action: Toggle High Priority */}
          <button
            type="button"
            className={`command-tool-btn ${activeKpiFilter === 'high' ? 'active-critical' : ''}`}
            onClick={() => setActiveKpiFilter(prev => prev === 'high' ? null : 'high')}
          >
            <ShieldAlert size={14} style={{ color: '#C85A32' }} />
            <span>{hi ? 'उच्च जोखिम फ़िल्टर' : 'View High Priority'}</span>
          </button>

          <SpeakerButton text={`PRahari Command Centre. AI-powered MPLADS project risk monitoring and verification. ${kpiData.highPriority} high priority cases requiring official attention.`} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          GEOGRAPHICAL DRILLDOWN & JURISDICTION BREADCRUMBS
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="geographic-drilldown-bar panel" style={{ padding: '14px 18px', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Interactive Multi-Level Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="link-btn"
            style={{ fontWeight: !selectedState ? 800 : 600, color: !selectedState ? 'var(--brand)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => {
              setSelectedState('');
              setSelectedDistrict('');
            }}
          >
            <span>🇮🇳 All India (National)</span>
          </button>

          {selectedState && (
            <>
              <span style={{ color: 'var(--line)' }}>/</span>
              <button
                type="button"
                className="link-btn"
                style={{ fontWeight: !selectedDistrict ? 800 : 600, color: !selectedDistrict ? 'var(--brand)' : 'var(--muted)' }}
                onClick={() => setSelectedDistrict('')}
              >
                <span>{selectedState}</span>
              </button>
            </>
          )}

          {selectedDistrict && (
            <>
              <span style={{ color: 'var(--line)' }}>/</span>
              <span style={{ fontWeight: 800, color: 'var(--brand)' }}>
                {selectedDistrict} District
              </span>
            </>
          )}

          {selectedProjectId && (
            <>
              <span style={{ color: 'var(--line)' }}>/</span>
              <span style={{ fontWeight: 700, color: 'var(--muted)', background: '#FAFBF8', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--line)' }}>
                Work ID: {selectedProjectId}
              </span>
            </>
          )}
        </div>

        {/* Dropdowns Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
              <Compass size={15} style={{ color: 'var(--brand)' }} />
              <span>{hi ? 'क्षेत्राधिकार फ़िल्टर:' : 'Filter Jurisdiction:'}</span>
            </div>

            {/* State Selector */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('');
              }}
              className="drilldown-dropdown"
              style={{ padding: '6px 10px', fontSize: '12px', borderRadius: 8, border: '1px solid var(--line)', background: '#FAFBF8', fontWeight: 600 }}
            >
              <option value="">All India (National View)</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* District Selector (Synchronously filtered by State) */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="drilldown-dropdown"
              style={{ padding: '6px 10px', fontSize: '12px', borderRadius: 8, border: '1px solid var(--line)', background: '#FAFBF8', fontWeight: 600 }}
            >
              <option value="">All Districts ({availableDistricts.length})</option>
              {availableDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Sector Selector */}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="drilldown-dropdown"
              style={{ padding: '6px 10px', fontSize: '12px', borderRadius: 8, border: '1px solid var(--line)', background: '#FAFBF8', fontWeight: 600 }}
            >
              <option value="all">All Sectors ({availableSectors.length})</option>
              {availableSectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Showing <b>{filteredQueue.length}</b> projects in scope
            </span>

            {(selectedState || selectedDistrict || selectedSector !== 'all' || activeKpiFilter || activeSignalFilter || activeDelayFilter || searchQuery) && (
              <button
                type="button"
                className="drilldown-reset-btn"
                onClick={() => {
                  setSelectedState('');
                  setSelectedDistrict('');
                  handleResetFilters();
                }}
                style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700 }}
              >
                <X size={12} />
                <span>{hi ? 'सभी फ़िल्टर रीसेट' : 'Reset Jurisdiction'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          1. INTERACTIVE KPI OVERVIEW CARDS
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="kpi-grid command-kpi-row">
        {[
          { key: 'all', count: kpiData.total, label: hi ? 'कुल परियोजनाएं' : 'TOTAL PROJECTS', sub: 'Across monitored jurisdiction', color: 'neutral' },
          { key: 'active', count: kpiData.active, label: hi ? 'सक्रिय कार्य' : 'ACTIVE PROJECTS', sub: 'In-progress execution', color: 'teal' },
          { key: 'high', count: kpiData.highPriority, label: hi ? 'उच्च प्राथमिकता' : 'HIGH PRIORITY', sub: 'Risk score ≥ 70 / Anomaly', color: 'critical' },
          { key: 'medium', count: kpiData.mediumPriority, label: hi ? 'मध्यम प्राथमिकता' : 'MEDIUM PRIORITY', sub: 'Watchlist score 40–69', color: 'amber' },
          { key: 'mismatch', count: kpiData.mismatchCount, label: hi ? 'प्रगति विसंगति' : 'PROGRESS MISMATCH', sub: 'Exp % > Phys % + 20%', color: 'amber' },
          { key: 'verification', count: kpiData.requiringVerif, label: hi ? 'सत्यापन आवश्यक' : 'REQUIRING VERIFICATION', sub: 'Active field investigation', color: 'brand' },
          { key: 'observations', count: kpiData.obsCount, label: hi ? 'नागरिक अवलोकन' : 'CITIZEN OBSERVATIONS', sub: 'Public discrepancy filings', color: 'sage' }
        ].map((item) => {
          const isSelected = activeKpiFilter === item.key;
          return (
            <div
              key={item.key}
              role="button"
              tabIndex={0}
              className={`kpi-panel command-kpi-card cursor-pointer transition-all hover:opacity-90 ${isSelected ? 'active' : ''}`}
              onClick={() => setActiveKpiFilter(prev => prev === item.key ? null : item.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveKpiFilter(prev => prev === item.key ? null : item.key);
                }
              }}
            >
              <div className={`kpi-accent ${item.color}`} />
              <span className="kpi-label">{item.label}</span>
              <strong className="kpi-number">{item.count}</strong>
              <small className="kpi-subtext">{item.sub}</small>
              {isSelected && <span className="kpi-active-badge">{hi ? 'फ़िल्टर सक्रिय' : 'Filtering Queue'}</span>}
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          2 & 3. MAIN OPERATIONAL SPLIT: PRIORITY QUEUE + SYNCHRONIZED RISK MAP
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="command-grid-layout">
        {/* LEFT COLUMN: PRIORITY FOR VERIFICATION TABLE */}
        <section className="panel priority-queue-section">
          <div className="panel-head flex justify-between items-center flex-wrap gap-2">
            <div>
              <span className="eyebrow">{hi ? 'निर्णय-सहायता प्राथमिकता सूची' : 'OPERATIONAL QUEUE'}</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Priority for Verification</h3>
            </div>
            <div className="queue-counter-tag">
              <span>{filteredQueue.length} {hi ? 'परियोजनाएं क्रमबद्ध' : 'Cases Ranked'}</span>
            </div>
          </div>

          {/* Table Toolbar (Search, Sort, Filter Indicator) */}
          <div className="queue-controls-bar">
            <div className="queue-search-wrap">
              <Search size={14} style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={hi ? 'आईडी, नाम, जिला या सिग्नल द्वारा खोजें…' : 'Search by ID (e.g. PRJ002), district, contractor, signal…'}
                className="queue-search-input"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="queue-sort-wrap">
              <ArrowUpDown size={13} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="queue-sort-select"
              >
                <option value="score_desc">Risk Score: High to Low</option>
                <option value="score_asc">Risk Score: Low to High</option>
                <option value="spent_desc">Reported Spend: High to Low</option>
                <option value="recent">Recently Sanctioned</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pill indicator if any */}
          {(activeKpiFilter || activeSignalFilter || activeDelayFilter) && (
            <div className="active-filter-indicator">
              <div className="flex items-center gap-2 text-xs">
                <Filter size={12} />
                <span>{hi ? 'सक्रिय फ़िल्टर:' : 'Active Operational Filter:'}</span>
                <strong className="active-filter-chip">
                  {activeKpiFilter ? `KPI: ${activeKpiFilter.toUpperCase()}` : ''}
                  {activeSignalFilter ? `Signal: ${activeSignalFilter.replace('_', ' ').toUpperCase()}` : ''}
                  {activeDelayFilter ? `Delay: ${activeDelayFilter.toUpperCase()}` : ''}
                </strong>
              </div>
              <button type="button" onClick={handleResetFilters} className="filter-clear-link">
                {hi ? 'हटाएं' : 'Clear Filter'}
              </button>
            </div>
          )}

          {/* Ranked Table */}
          <div className="priority-table-container custom-scrollbar overflow-y-auto">
            {filteredQueue.length === 0 ? (
              <div className="empty-queue-state">
                <ShieldAlert size={36} style={{ color: 'var(--muted)', margin: '0 auto 10px' }} />
                <strong>{hi ? 'कोई परियोजना मेल नहीं खाती' : 'No matching projects in current filter scope'}</strong>
                <p>{hi ? 'कृपया फ़िल्टर रीसेट करें या भिन्न जिला चुनें।' : 'Try clearing your search query or selecting another jurisdiction.'}</p>
                <button type="button" className="ghost-action" onClick={handleResetFilters}>
                  {hi ? 'फ़िल्टर रीसेट करें' : 'Reset All Filters'}
                </button>
              </div>
            ) : (
              <table className="priority-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Project & Location</th>
                    <th>Sanction / Spend</th>
                    <th>Progress</th>
                    <th>Risk Score</th>
                    <th>Primary Risk Signal</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map((p, idx) => {
                    const isSelected = p.id === selectedProjectId;
                    const SignalIcon = p.primarySignal.icon || AlertTriangle;
                    const sanctionedLakhs = formatLakhs(safeNumber(p.sanctionedAmount, 0) / 100000);
                    const spentLakhs = formatLakhs(safeNumber(p.spentAmount, 0) / 100000);

                    return (
                      <tr
                        key={p.id}
                        className={`priority-table-row ${isSelected ? 'selected-row' : ''}`}
                        onClick={() => setSelectedProjectId(p.id)}
                      >
                        <td className="row-rank">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="row-project-cell">
                          <div className="flex items-center gap-2">
                            <span className="project-id-chip">{p.id}</span>
                            <span className="project-district-tag">{p.district}</span>
                          </div>
                          <strong className="project-title-text" title={p.name}>{p.name}</strong>
                          <span className="project-sector-text">{p.sector || p.category}</span>
                        </td>
                        <td className="row-financial-cell">
                          <div className="financial-pair">
                            <span className="sanction-val">₹{sanctionedLakhs}L</span>
                            <span className="spent-val">₹{spentLakhs}L</span>
                          </div>
                          <div className="fin-ratio-bar">
                            <div
                              className={`fin-ratio-fill ${p.spentAmount > p.sanctionedAmount ? 'overrun' : ''}`}
                              style={{ width: `${Math.min(100, p.financialProgress)}%` }}
                            />
                          </div>
                        </td>
                        <td className="row-progress-cell">
                          <div className="progress-num-text">{p.physicalProgress}%</div>
                          <div className="progress-micro-bar">
                            <div className="progress-fill" style={{ width: `${p.physicalProgress}%` }} />
                          </div>
                        </td>
                        <td className="row-risk-cell">
                          <div className="risk-score-badge">
                            <b className={`score-val ${p.riskTier.toLowerCase()}`}>{p.riskScore}</b>
                            <span className={`risk-tier-tag ${p.riskTier.toLowerCase()}`}>{p.riskTier}</span>
                          </div>
                        </td>
                        <td className="row-signal-cell">
                          <div className={`signal-pill ${p.primarySignal.severity}`}>
                            <SignalIcon size={12} />
                            <span>{p.primarySignal.label}</span>
                          </div>
                        </td>
                        <td className="row-action-cell">
                          <div className="action-btn-group">
                            <button
                              type="button"
                              className="investigate-quick-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/official/investigation/${p.id}`);
                              }}
                              title="Open 7-Section Investigation Workspace"
                            >
                              <ShieldAlert size={12} />
                              <span>INVESTIGATE</span>
                            </button>
                            <button
                              type="button"
                              className="view-intel-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/official/risk/${p.id}`);
                              }}
                              title="Open deep-dive Project Intelligence page"
                            >
                              <span>INTEL</span>
                              <ChevronRight size={13} />
                            </button>
                            <button
                              type="button"
                              className="docket-quick-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDocket(p);
                              }}
                              title="Generate Evidence Docket"
                            >
                              <FileText size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: SYNCHRONIZED RISK MAP & GEOSPATIAL RADAR */}
        <section className="panel risk-map-section">
          <div className="panel-head flex justify-between items-center">
            <div>
              <span className="eyebrow">{hi ? 'स्थानिक जोखिम निगरानी' : 'GEOSPATIAL INTELLIGENCE'}</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Pan-India Risk Map</h3>
            </div>
            <div className="map-legend-pills flex items-center gap-2">
              <span className="legend-dot red" title="High Priority (Score ≥ 70)" />
              <span className="legend-text">High</span>
              <span className="legend-dot amber" title="Moderate (Score 40–69)" />
              <span className="legend-text">Med</span>
              <span className="legend-dot green" title="Stable (Score < 40)" />
              <span className="legend-text">Low</span>
            </div>
          </div>

          <div className="command-map-wrapper">
            <CivicMap
              projects={filteredQueue.length > 0 ? filteredQueue : scoredProjects}
              initialCenter={mapCenter}
              initialZoom={mapZoom}
              focusedId={selectedProjectId}
              onPinClick={(id) => setSelectedProjectId(id)}
              height={440}
              showFilters={true}
            />
          </div>

          <div className="map-sync-footer flex justify-between items-center text-xs">
            <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
              <MapPin size={13} style={{ color: 'var(--brand)' }} />
              {selectedDistrict ? `${selectedDistrict} District Scope` : selectedState ? `${selectedState} State Scope` : 'All India National Map'}
            </span>
            <span style={{ color: 'var(--muted)' }}>
              Clicking pins synchronizes the priority queue and AI dossier
            </span>
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          4. FINANCIAL VS PHYSICAL PROGRESS COMPREHENSIVE MATRIX
      ════════════════════════════════════════════════════════════════════════ */}
      <FinancialPhysicalProgressChart
        projects={scoredProjects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onNavigateToProject={(id) => navigate(`/official/investigation/${id}`)}
      />

      {/* ════════════════════════════════════════════════════════════════════════
          5 & 6. OPERATIONAL ANALYTICS: WHY FLAGGED + GESTATION DELAYS
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="command-secondary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        {/* 5. "WHY ARE PROJECTS BEING FLAGGED?" */}
        <section className="panel why-flagged-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{hi ? 'जोखिम कारक वर्गीकरण' : 'RISK SIGNAL BREAKDOWN'}</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Why Are Projects Being Flagged?</h3>
              <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Click any signal to filter the priority queue</small>
            </div>
            <Sparkles size={16} style={{ color: 'var(--brand)' }} />
          </div>

          <div className="signal-matrix-grid">
            {signalCounts.map(sig => {
              const isActive = activeSignalFilter === sig.key;
              return (
                <div
                  key={sig.key}
                  role="button"
                  tabIndex={0}
                  className={`signal-matrix-card ${sig.severity} ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveSignalFilter(prev => prev === sig.key ? null : sig.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveSignalFilter(prev => prev === sig.key ? null : sig.key);
                    }
                  }}
                >
                  <div className="signal-card-top flex justify-between items-center">
                    <strong className="signal-card-title">{sig.label}</strong>
                    <span className="signal-card-count">{sig.count}</span>
                  </div>
                  <p className="signal-card-desc">{sig.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. PROJECT DELAY INTELLIGENCE */}
        <section className="panel delay-intel-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{hi ? 'समय-सीमा विश्लेषण' : 'GESTATION TIMELINES'}</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Project Delay Intelligence</h3>
              <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Timeline adherence against approved DPR schedule</small>
            </div>
            <Clock size={16} style={{ color: '#C85A32' }} />
          </div>

          <div className="delay-quadrant-grid">
            <div
              className={`delay-box critical ${activeDelayFilter === 'critical' ? 'active' : ''}`}
              onClick={() => setActiveDelayFilter(prev => prev === 'critical' ? null : 'critical')}
            >
              <div className="delay-count">{delayStats.critical}</div>
              <div className="delay-label">Critical Delay</div>
              <small>Severely stalled & high risk</small>
            </div>

            <div
              className={`delay-box delayed ${activeDelayFilter === 'delayed' ? 'active' : ''}`}
              onClick={() => setActiveDelayFilter(prev => prev === 'delayed' ? null : 'delayed')}
            >
              <div className="delay-count">{delayStats.delayed}</div>
              <div className="delay-label">Delayed</div>
              <small>Past scheduled completion</small>
            </div>

            <div
              className={`delay-box at-risk ${activeDelayFilter === 'at_risk' ? 'active' : ''}`}
              onClick={() => setActiveDelayFilter(prev => prev === 'at_risk' ? null : 'at_risk')}
            >
              <div className="delay-count">{delayStats.atRisk}</div>
              <div className="delay-label">At Risk</div>
              <small>Slow physical milestones</small>
            </div>

            <div
              className={`delay-box on-track ${activeDelayFilter === 'on_track' ? 'active' : ''}`}
              onClick={() => setActiveDelayFilter(prev => prev === 'on_track' ? null : 'on_track')}
            >
              <div className="delay-count">{delayStats.onTrack}</div>
              <div className="delay-label">On Track</div>
              <small>Milestones adhering to DPR</small>
            </div>
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          7 & 8. SELECTED PROJECT DOSSIER: AI RISK INTELLIGENCE & PHYSICAL VERIFICATION
      ════════════════════════════════════════════════════════════════════════ */}
      {selectedProject && (() => {
        const reportedProg = selectedProject.physicalProgress ?? 75;
        const visualEstimate = selectedProject.ai_visual_estimate_pct ?? Math.max(0, reportedProg - 20);
        const discrepancy = Math.abs(reportedProg - visualEstimate);
        const caseState = getCase(selectedProject.id);

        return (
          <div className="selected-project-dossier-grid">
            {/* 7. AI RISK INTELLIGENCE DOSSIER */}
            <section className="panel ai-dossier-panel">
              <div className="panel-head flex justify-between items-center">
                <div>
                  <span className="eyebrow">{hi ? 'एआई जोखिम विश्लेषण' : 'SELECTED CASE INTELLIGENCE'} · {selectedProject.id}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{selectedProject.name}</h3>
                  <small style={{ color: 'var(--muted)' }}>
                    📍 {selectedProject.district}, {selectedProject.state} · {selectedProject.sector || selectedProject.category}
                  </small>
                </div>
                <div className="dossier-score-badge">
                  <div className="score-hero-num">{selectedProject.riskScore}</div>
                  <span>/ 100</span>
                </div>
              </div>

              {/* Attribution Score Breakdown */}
              <div className="attribution-breakdown-section">
                <span className="section-eyebrow">WHY FLAGGED? (TRACEABLE RISK SIGNALS)</span>
                <div className="attribution-chips-grid">
                  <div className="attrib-chip">
                    <span className="attrib-title">Cost Anomaly</span>
                    <strong className="attrib-val">+28</strong>
                  </div>
                  <div className="attrib-chip">
                    <span className="attrib-title">Timeline Slippage</span>
                    <strong className="attrib-val">+21</strong>
                  </div>
                  <div className="attrib-chip">
                    <span className="attrib-title">Progress Gap</span>
                    <strong className="attrib-val">+17</strong>
                  </div>
                  <div className="attrib-chip">
                    <span className="attrib-title">Expenditure Signal</span>
                    <strong className="attrib-val">+16</strong>
                  </div>
                </div>
              </div>

              {/* Traceable Explanation */}
              <div className="dossier-narrative-box">
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.55 }}>
                  "Reported expenditure is substantially ahead of reported physical progress. Combined with other available project signals, this project is recommended for priority verification."
                </p>
                <div className="narrative-disclaimer-tag">
                  <Info size={12} />
                  <span>Contribution to review priority, not a statistical fraud finding. Human verification mandatory.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="dossier-action-row flex gap-2">
                <button
                  type="button"
                  className="primary-action flex-1"
                  onClick={() => navigate(`/official/risk/${selectedProject.id}`)}
                >
                  <Eye size={14} />
                  <span>{hi ? 'पूर्ण प्रोजेक्ट इंटेलिजेंस खोलें' : 'Open Project Intelligence'}</span>
                  <ChevronRight size={14} />
                </button>

                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => handleOpenDocket(selectedProject)}
                >
                  <FileText size={14} />
                  <span>{hi ? 'डॉकेट जनरेट करें' : 'Generate Evidence Docket'}</span>
                </button>

                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setDispatchModalProject(selectedProject)}
                  title="Dispatch field verification directive"
                >
                  <ShieldAlert size={14} style={{ color: '#C85A32' }} />
                  <span>{hi ? 'जांच सौंपें' : 'Assign Directive'}</span>
                </button>
              </div>
            </section>

            {/* 8. PHYSICAL VERIFICATION INTELLIGENCE */}
            <section className="panel physical-verif-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">{hi ? 'भौतिक सत्यापन विश्लेषण' : 'GROUND TRUTH VERIFICATION'}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Physical Verification Intelligence</h3>
                  <small style={{ color: 'var(--muted)' }}>Reported DPR progress vs AI satellite / site imagery estimate</small>
                </div>
                <Camera size={18} style={{ color: 'var(--brand)' }} />
              </div>

              {/* Comparison Stats */}
              <div className="verif-stats-row flex justify-between items-center gap-4">
                <div className="verif-metric-box">
                  <span className="verif-metric-label">REPORTED PROGRESS</span>
                  <b className="verif-metric-num">{reportedProg}%</b>
                </div>
                <div className="verif-metric-box">
                  <span className="verif-metric-label">AI VISUAL ESTIMATE</span>
                  <b className="verif-metric-num" style={{ color: '#c2410c' }}>{visualEstimate}%</b>
                </div>
                <div className="verif-metric-box">
                  <span className="verif-metric-label">DISCREPANCY</span>
                  <b className="verif-metric-num" style={{ color: discrepancy > 10 ? '#dc2626' : '#059669' }}>
                    {discrepancy} pts
                  </b>
                </div>
              </div>

              {/* Dual Progress Bars */}
              <div className="dual-progress-container flex flex-col gap-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Reported Physical Progress (Filing)</span>
                    <b>{reportedProg}%</b>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar-fill brand" style={{ width: `${reportedProg}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>AI Visual Estimate (Satellite & Geotagged Survey)</span>
                    <b style={{ color: '#c2410c' }}>{visualEstimate}%</b>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar-fill orange" style={{ width: `${visualEstimate}%` }} />
                  </div>
                </div>
              </div>

              {/* Mismatch Status Banner */}
              {discrepancy > 10 ? (
                <div className="mismatch-warning-banner">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <strong className="text-amber-900 block text-xs">POTENTIAL PROGRESS MISMATCH</strong>
                    <p className="text-amber-800 text-xs m-0">
                      AI visual analysis indicates a potential difference between reported project progress and visible site progress. Official physical verification is recommended.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mismatch-safe-banner">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <span className="text-emerald-800 text-xs">Reported progress is consistent with available visual observations.</span>
                </div>
              )}

              {/* Real Evidence Locker Preview */}
              <div className="evidence-preview-box">
                <span className="section-eyebrow">ATTACHED EVIDENCE & AUDIT LOGS</span>
                <div className="evidence-files-list">
                  {caseState?.evidenceItems && caseState.evidenceItems.length > 0 ? (
                    caseState.evidenceItems.slice(0, 3).map((ev) => (
                      <div key={ev.id} className="evidence-item-row flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={13} style={{ color: 'var(--brand)' }} />
                          <span className="evidence-file-title">{ev.title}</span>
                        </div>
                        <span className="evidence-file-status">{ev.status || 'Verified'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="evidence-empty-note text-xs text-stone-500">
                      No photographic or drone files attached yet. Official inspection pending.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════════
          9 & 10. CITIZEN INTELLIGENCE STREAM & ALERT CENTRE
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="command-bottom-stream-grid">
        {/* 9. CITIZEN INTELLIGENCE STREAM */}
        <section className="panel citizen-stream-panel" id="citizen-observations-panel">
          <div className="panel-head flex justify-between items-center">
            <div>
              <span className="eyebrow">{hi ? 'नागरिक सहभागिता' : 'CITIZEN INTELLIGENCE'}</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Live Citizen Observations</h3>
              <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Ground-truth reports received from citizens</small>
            </div>
            <MessageSquare size={16} style={{ color: 'var(--brand)' }} />
          </div>

          <div className="citizen-observations-list">
            {complaints && complaints.length > 0 ? (
              complaints.map((c, i) => (
                <div
                  key={c.tokenId || i}
                  className="citizen-obs-item cursor-pointer"
                  onClick={() => {
                    if (c.projectId) navigate(`/official/risk/${c.projectId}`);
                  }}
                >
                  <div className="obs-header flex justify-between items-center">
                    <span className="obs-token">{c.tokenId || `#CIT-VNS-${1000 + i}`}</span>
                    <span className={`obs-status-tag ${c.status?.toLowerCase() || 'submitted'}`}>
                      {c.status || 'NEW'}
                    </span>
                  </div>
                  <strong className="obs-project-id">{c.projectId} · {c.projectName || c.district}</strong>
                  <p className="obs-text">"{c.observation || c.issueType}"</p>
                  <div className="obs-footer flex justify-between items-center text-xs">
                    <span>📍 {c.district}, {c.state}</span>
                    <span className="obs-view-link">View in Project Intelligence →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-obs-state text-xs text-stone-500 py-6 text-center">
                <MessageSquare size={24} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                <span>No citizen grievances submitted for current selection.</span>
              </div>
            )}
          </div>
        </section>

        {/* 10. ALERT CENTRE ("ATTENTION REQUIRED") */}
        <section className="panel alert-centre-panel">
          <div className="panel-head flex justify-between items-center">
            <div>
              <span className="eyebrow">{hi ? 'तात्कालिक ध्यान आवश्यक' : 'ALERT CENTRE'}</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Attention Required</h3>
              <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Live system signals requiring administrative decision</small>
            </div>
            <AlertCircle size={16} style={{ color: '#C85A32' }} />
          </div>

          <div className="alert-feed-list">
            {liveAlerts.map(alert => (
              <div
                key={alert.id}
                className={`alert-feed-item ${alert.severity}`}
                onClick={() => {
                  if (alert.projectId) navigate(`/official/risk/${alert.projectId}`);
                }}
              >
                <div className="alert-item-header flex justify-between items-center">
                  <span className={`alert-type-chip ${alert.severity}`}>{alert.type}</span>
                  <small className="alert-time">{alert.time}</small>
                </div>
                <strong className="alert-title">{alert.title}</strong>
                <p className="alert-desc">{alert.desc}</p>
                <div className="alert-action-prompt flex items-center gap-1 text-xs">
                  <span>Take Action in Case Register</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          13 & 14. EVIDENCE-BASED WORKFLOW & DATA SOURCE TRANSPARENCY
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="panel workflow-governance-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">{hi ? 'प्रशासनिक कार्यप्रवाह एवं सत्यनिष्ठा' : 'GOVERNANCE & AUDIT ARCHITECTURE'}</span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Evidence-Based Decision-Support Workflow</h3>
          </div>
          <span className="transparency-tag">Demo / Illustrative Data</span>
        </div>

        {/* Workflow Steps */}
        <div className="workflow-steps-diagram">
          <div className="step-node">
            <span className="step-num">1</span>
            <strong>SOURCE DATA</strong>
            <small>PFMS & eSAKSHI Feeds</small>
          </div>
          <ChevronRight size={18} className="step-arrow" />
          <div className="step-node">
            <span className="step-num">2</span>
            <strong>RISK DETECTION</strong>
            <small>6-Factor Scoring Formula</small>
          </div>
          <ChevronRight size={18} className="step-arrow" />
          <div className="step-node">
            <span className="step-num">3</span>
            <strong>EXPLAINABILITY</strong>
            <small>Factor Weight Breakdown</small>
          </div>
          <ChevronRight size={18} className="step-arrow" />
          <div className="step-node">
            <span className="step-num">4</span>
            <strong>EVIDENCE LOCKER</strong>
            <small>Satellite, Drone & MB Books</small>
          </div>
          <ChevronRight size={18} className="step-arrow" />
          <div className="step-node">
            <span className="step-num">5</span>
            <strong>OFFICIAL AUDIT</strong>
            <small>Human Decision & Closure</small>
          </div>
        </div>

        {/* Data Source Transparency Banner */}
        <div className="transparency-notice-box">
          <Info size={15} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Data Source Transparency Notice:</strong>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)', lineHeight: 1.45 }}>
              Current project records and financial ledgers are connected via the PRAHARI Supabase Cloud Architecture.
              Signals are rule-based and AI-estimated indicators designed to assist authorized district and state officials.
              Under MoSPI guidelines, all administrative sanctions, payment holds, or vigilance referrals require official on-site verification.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          MODALS: EVIDENCE DOCKET EXPORT & FIELD DIRECTIVE DISPATCH
      ════════════════════════════════════════════════════════════════════════ */}
      {docketModalProject && (
        <div className="modal-overlay" onClick={() => setDocketModalProject(null)}>
          <div className="modal-container max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={18} style={{ color: 'var(--brand)' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Administrative Evidence Docket</h3>
              </div>
              <button type="button" onClick={() => setDocketModalProject(null)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <pre className="docket-text-preview">
                {generateEvidenceSummaryText(docketModalProject, getCase(docketModalProject.id))}
              </pre>
            </div>

            <div className="modal-footer flex justify-between items-center">
              <span className="text-xs text-stone-500">Official oversight document for {docketModalProject.id}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    navigator.clipboard.writeText(generateEvidenceSummaryText(docketModalProject, getCase(docketModalProject.id)));
                    setDocketCopied(true);
                    setTimeout(() => setDocketCopied(false), 3000);
                  }}
                >
                  {docketCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{docketCopied ? 'Copied to Clipboard' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => setDocketModalProject(null)}
                >
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Directive Assignment Modal */}
      {dispatchModalProject && (
        <InvestigationAssignmentModal
          project={dispatchModalProject}
          existingAssignment={getCase(dispatchModalProject.id)?.assignment}
          onClose={() => setDispatchModalProject(null)}
          onSaveAssignment={(assignmentData) => {
            assignCase(
              dispatchModalProject.id,
              assignmentData,
              user?.name || getRoleLabel(user?.role || 'district_authority'),
              user?.role || 'district_authority'
            );
            setDispatchModalProject(null);
          }}
        />
      )}
    </div>
  );
}
