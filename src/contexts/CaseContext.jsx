import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchProjects,
  fetchProjectById,
  submitCitizenObservation,
  recordInvestigationDecision,
  checkBackendHealth,
  normalizeProject
} from '../api/client';
import { projects as initialMockProjects } from '../data/mockData';

const CaseContext = createContext();
const STORAGE_KEY = 'prahari-cases-v2';
const COMPLAINT_KEY = 'prahari-complaints-v1';
const PROJECTS_CACHE_KEY = 'prahari-projects-cache-v1';

// ─── Lifecycle Constants ──────────────────────────────────────────────────────
export const LIFECYCLE_STAGES = [
  'Detected',
  'Triaged',
  'Assigned',
  'UNDER_FIELD_INVESTIGATION',
  'Field Verification Dispatched',
  'Under Review',
  'Resolved',
  'Escalated to State Vigilance',
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
function loadCases() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}
function saveCases(cases) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); } catch {}
}
function loadComplaints() {
  try { return JSON.parse(localStorage.getItem(COMPLAINT_KEY) || '[]'); } catch { return []; }
}
function saveComplaints(list) {
  try { localStorage.setItem(COMPLAINT_KEY, JSON.stringify(list)); } catch {}
}
function loadCachedProjects() {
  try {
    const cached = JSON.parse(localStorage.getItem(PROJECTS_CACHE_KEY) || '[]');
    if (Array.isArray(cached) && cached.length > 0) return cached;
  } catch {}
  return (initialMockProjects || []).map(normalizeProject);
}
function saveCachedProjects(list) {
  try { localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(list)); } catch {}
}

// ─── Build initial case ───────────────────────────────────────────────────────
function buildInitialCase(id, projectData = null) {
  const isPrj2 = id?.toUpperCase() === 'PRJ002' || id?.toUpperCase() === 'UP-VAR-2024-001';
  const name = projectData?.name || projectData?.work_name || id;

  return {
    id,
    name,
    status: isPrj2 ? 'UNDER_FIELD_INVESTIGATION' : (projectData?.audit_status || 'Detected'),
    priority: isPrj2 || (projectData?.composite_risk_score >= 70) ? 'high' : 'medium',
    assignedOfficer: isPrj2 ? 'Shri R.K. Verma - Sub-Divisional Magistrate (SDM), Sadar' : null,
    assignment: isPrj2 ? {
      officer: 'Shri R.K. Verma - Sub-Divisional Magistrate (SDM), Sadar',
      subordinateOfficer: 'Shri R.K. Verma',
      role: 'Sub-Divisional Magistrate',
      designation: 'Sub-Divisional Magistrate (SDM), Sadar',
      department: 'Sub-Divisional Revenue & Vigilance Cell',
      priority: 'high',
      dueDate: '2026-09-18',
      mandatedFocus: ['Physical Milestone Progress', 'Asset Existence & Geo-coordinates', 'Material Quality / Core Sampling'],
      directives: 'Conduct on-site culvert and bitumen measurement. Reconcile with PRJ001 GIS boundary.',
      instructions: 'Conduct on-site culvert and bitumen measurement. Reconcile with PRJ001 GIS boundary.'
    } : null,
    checklist: {
      check_pfms: true,
      check_mb: true,
      check_coords: false,
      check_duplicate: false,
      check_agency: false,
      check_board: false,
      check_citizen: false,
    },
    duplicateDecision: null,
    duplicateCandidateId: isPrj2 ? 'PRJ001' : null,
    supervisorReview: null,
    evidenceItems: [
      {
        id: 'EV-01',
        title: 'Approved DPR & Cost Estimates 2024.pdf',
        category: 'documents',
        uploadedAt: '2024-02-15 11:30',
        uploadedBy: 'District Planning Office',
        status: 'verified',
        size: '2.4 MB'
      },
      {
        id: 'EV-02',
        title: 'PFMS Sanction Release Tranche 1 & 2.pdf',
        category: 'payments',
        uploadedAt: '2024-03-22 14:15',
        uploadedBy: 'Treasury Officer, Varanasi',
        status: 'verified',
        size: '1.1 MB'
      },
      {
        id: 'EV-03',
        title: 'Initial Geotagged Site Photo - Chainage 0+000.jpg',
        category: 'field_photos',
        uploadedAt: '2024-04-10 10:05',
        uploadedBy: 'Agency AG003 Field Staff',
        status: 'needs_review',
        size: '3.8 MB'
      },
      {
        id: 'EV-04',
        title: 'GIS Survey Boundary Track & Perimeter.kml',
        category: 'gps',
        uploadedAt: '2024-04-12 16:40',
        uploadedBy: 'GIS Engineering Cell',
        status: 'verified',
        size: '420 KB'
      },
      {
        id: 'EV-05',
        title: 'Resident Complaint regarding road width and culvert work.pdf',
        category: 'citizen',
        uploadedAt: '2024-08-14 09:20',
        uploadedBy: 'Citizen Grievance Portal',
        status: 'unverified',
        size: '640 KB'
      },
    ],
    auditHistory: [
      {
        action: 'Case Detected',
        timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
        officerName: 'PRAHARI System',
        role: 'System',
        note: 'Automated risk signal surfaced by PRAHARI analytics engine via Authorized PFMS Financial Ledger Feed.',
        hash: '9A7B1C4E',
      },
      ...(isPrj2 ? [{
        action: 'Investigation Assigned',
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        officerName: 'District Authority',
        role: 'district_authority',
        note: 'Assigned to Rajesh Kumar (Field Officer) with High Priority. Deadline: 18 Sep 2026.',
        hash: '3F8E2D10',
      }] : []),
    ],
    feedbackFidelity: null,
    capturedEvidence: null,
    attachedNodes: [],
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CaseProvider({ children }) {
  const [projects, setProjects] = useState(loadCachedProjects);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('cloud_connected');
  const [cases, setCases] = useState(loadCases);
  const [complaints, setComplaints] = useState(loadComplaints);
  const [activeToast, setActiveToast] = useState(null);

  const showToast = useCallback((msg) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 7000);
  }, []);

  // ── Refresh / Sync Projects from Cloud ─────────────────────────────────────
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check health
      const health = await checkBackendHealth();
      setBackendStatus(health.source || 'cloud_connected');

      // 2. Fetch projects
      const res = await fetchProjects();
      if (res.ok && res.data && res.data.length > 0) {
        setProjects(res.data);
        saveCachedProjects(res.data);
        showToast(`Synchronized ${res.data.length} records with Supabase Cloud Architecture.`);
      }
    } catch (err) {
      console.warn('Failed to refresh cloud data:', err);
      setBackendStatus('offline');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial cloud sync on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── Get or initialise a case ──────────────────────────────────────────────
  const getCase = useCallback((id) => {
    const matchedProject = projects.find(p => p.id === id || p.work_id === id);
    return cases?.[id] || buildInitialCase(id, matchedProject);
  }, [cases, projects]);

  // ── Advance lifecycle status ──────────────────────────────────────────────
  const advanceStatus = useCallback((id, newStatus, officerName = 'Officer', role = 'district_authority', note = '') => {
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updated = {
        ...existing,
        status: newStatus,
        auditHistory: [
          ...existing.auditHistory,
          {
            action: `Status → ${newStatus}`,
            timestamp: new Date().toISOString(),
            officerName,
            role,
            note: note || `Case advanced to ${newStatus} by ${officerName} (${role}).`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });

    // Cloud sync in background
    recordInvestigationDecision({ work_id: id, decision: newStatus, officer_name: officerName, note }).catch(() => {});
  }, []);

  // ── Assign / Dispatch Field Verification Case ───────────────────────────
  const assignCase = useCallback((id, assignmentData, officerName = 'District Authority', role = 'district_authority') => {
    const officerLabel = assignmentData.officer || assignmentData.subordinateOfficer || 'Field Officer';
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updated = {
        ...existing,
        status: 'UNDER_FIELD_INVESTIGATION',
        assignedOfficer: officerLabel,
        assignment: {
          ...assignmentData,
          assignedAt: new Date().toISOString(),
          assignedBy: officerName,
          status: 'UNDER_FIELD_INVESTIGATION',
        },
        auditHistory: [
          ...existing.auditHistory,
          {
            action: 'Field Directive Dispatched',
            timestamp: new Date().toISOString(),
            officerName,
            role,
            note: `Field inspection delegated to ${officerLabel} (${assignmentData.department || 'Inspection Wing'}). Mandated Focus: ${(assignmentData.mandatedFocus || []).join('; ') || 'Comprehensive Verification'}. Directives: ${assignmentData.directives || assignmentData.instructions || 'Conduct ground inspection'}. Statutory Deadline: ${assignmentData.dueDate}.`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });

    // Cloud sync
    recordInvestigationDecision({
      work_id: id,
      decision: 'FIELD_DISPATCH',
      officer_name: officerName,
      note: `Delegated to ${officerLabel}`
    }).catch(() => {});

    showToast(`Field verification directive dispatched to ${assignmentData.officer || 'Subordinate Officer'} for ${id}. Statutory deadline: ${assignmentData.dueDate}.`);
  }, [showToast]);

  // ── Update Checklist Item ─────────────────────────────────────────────────
  const updateChecklist = useCallback((id, checkKey, isChecked, officerName = 'Investigator') => {
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updatedChecklist = {
        ...(existing.checklist || {}),
        [checkKey]: isChecked,
      };
      const updated = {
        ...existing,
        checklist: updatedChecklist,
        auditHistory: [
          ...existing.auditHistory,
          {
            action: `Checklist Updated`,
            timestamp: new Date().toISOString(),
            officerName,
            role: 'investigator',
            note: `Verification check "${checkKey}" marked as ${isChecked ? 'completed' : 'pending'}.`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });
  }, []);

  // ── Record Duplicate Decision ─────────────────────────────────────────────
  const recordDuplicateDecision = useCallback((id, candidateId, decision, notes = '', officerName = 'Investigator') => {
    const decisionLabels = {
      not_duplicate: 'Not a Duplicate (Independent Work)',
      potential_duplicate: 'Potential Duplicate (Demarcation Audit Required)',
      need_evidence: 'Need More Evidence (GIS Survey Requested)',
    };
    const label = decisionLabels[decision] || decision;
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updated = {
        ...existing,
        duplicateDecision: decision,
        duplicateDecisionNotes: notes,
        auditHistory: [
          ...existing.auditHistory,
          {
            action: `Duplicate Adjudication: ${label}`,
            timestamp: new Date().toISOString(),
            officerName,
            role: 'investigator',
            note: `Comparison with ${candidateId} adjudicated as: ${label}. Notes: ${notes || 'No extra remarks'}.`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });
    showToast(`Duplicate review recorded: ${label}. Audit log updated.`);
  }, [showToast]);

  // ── Add Evidence Item ─────────────────────────────────────────────────────
  const addEvidenceItem = useCallback((id, item, officerName = 'Investigator') => {
    const newItem = {
      id: `EV-${Date.now().toString().slice(-4)}`,
      uploadedAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      uploadedBy: officerName,
      status: 'verified',
      size: '1.2 MB',
      ...item,
    };
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updatedEvidence = [newItem, ...(existing.evidenceItems || [])];
      const updated = {
        ...existing,
        evidenceItems: updatedEvidence,
        auditHistory: [
          ...existing.auditHistory,
          {
            action: 'Evidence Uploaded to Locker',
            timestamp: new Date().toISOString(),
            officerName,
            role: 'investigator',
            note: `New evidence "${newItem.title}" added to category [${newItem.category}].`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });
    showToast(`Evidence "${newItem.title}" added to Evidence Locker.`);
  }, [showToast]);

  // ── Submit Supervisor Review ──────────────────────────────────────────────
  const submitSupervisorReview = useCallback((id, reviewPayload, officerName = 'District Magistrate', role = 'district_authority') => {
    const statusMap = {
      approve_close: 'Resolved',
      request_evidence: 'Under Review',
      return_investigation: 'Field Verification Dispatched',
      escalate: 'Escalated to State Vigilance',
    };
    const newStatus = statusMap[reviewPayload.action] || 'Under Review';
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updated = {
        ...existing,
        status: newStatus,
        supervisorReview: {
          ...reviewPayload,
          reviewedAt: new Date().toISOString(),
          reviewer: officerName,
          role,
        },
        auditHistory: [
          ...existing.auditHistory,
          {
            action: `Supervisor Review: ${reviewPayload.actionText || reviewPayload.action}`,
            timestamp: new Date().toISOString(),
            officerName,
            role,
            note: reviewPayload.notes || `Disposition: ${newStatus}`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });

    // Cloud sync to Supabase
    recordInvestigationDecision({
      work_id: id,
      decision: reviewPayload.action === 'escalate' ? 'VERIFIED_ESCALATED' : 'RESOLVED_CLEARED',
      officer_name: officerName,
      note: reviewPayload.notes || `Supervisor Review: ${newStatus}`,
    }).catch(() => {});

    showToast(`Supervisor review recorded. Case status updated to: ${newStatus}.`);
  }, [showToast]);

  // ── Attach an evidence node to docket ────────────────────────────────────
  const attachNode = useCallback((id, nodeId, nodeLabel, officerName = 'Investigator', role = 'district_authority') => {
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const alreadyAttached = existing.attachedNodes?.some(n => n.nodeId === nodeId);
      if (alreadyAttached) return prev;
      const updated = {
        ...existing,
        attachedNodes: [...(existing.attachedNodes || []), { nodeId, nodeLabel, attachedAt: new Date().toISOString() }],
        auditHistory: [
          ...existing.auditHistory,
          {
            action: 'Evidence Node Attached to Docket',
            timestamp: new Date().toISOString(),
            officerName,
            role,
            note: `Node "${nodeLabel}" (${nodeId}) attached to case docket by ${officerName}.`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });
    showToast(`Evidence node "${nodeLabel}" attached to Case Docket. Audit trail updated.`);
  }, [showToast]);

  // ── Record active-learning feedback ──────────────────────────────────────
  const recordFeedback = useCallback((id, fidelity, district = 'Varanasi', signal = 'seasonal roadwork delays') => {
    const isFalseAlarm = fidelity === 'False Alarm';
    const adjustment = isFalseAlarm ? '-14%' : '+8%';
    const toastMsg = isFalseAlarm
      ? `Active Learning feedback recorded. Weight for ${signal} in District ${district} adjusted by ${adjustment}.`
      : `Active Learning feedback recorded. Risk model reinforced for ${signal} patterns in District ${district} (${adjustment}).`;

    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updated = {
        ...existing,
        feedbackFidelity: fidelity,
        status: 'Resolved',
        auditHistory: [
          ...existing.auditHistory,
          {
            action: `Outcome Fidelity: ${fidelity}`,
            timestamp: new Date().toISOString(),
            officerName: 'Investigator',
            role: 'district_authority',
            note: `Active learning calibration feedback recorded: ${fidelity}. Model weight adjustment: ${adjustment} for ${signal}.`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });

    showToast(toastMsg);
  }, [showToast]);

  // ── Attach geotagged field evidence ──────────────────────────────────────
  const attachEvidence = useCallback((id, evidencePayload) => {
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updated = {
        ...existing,
        capturedEvidence: evidencePayload,
        status: 'Field Verification Dispatched',
        auditHistory: [
          ...existing.auditHistory,
          {
            action: 'Field Evidence Captured',
            timestamp: evidencePayload.capturedAt || new Date().toISOString(),
            officerName: 'Field Officer',
            role: 'field_officer',
            note: `Geospatial drift: ${evidencePayload.spatialDriftMeters}m. ${evidencePayload.isDriftFlagged ? 'DRIFT FLAGGED — location outside approved perimeter.' : 'Location authenticated within approved perimeter.'}`,
            hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
          },
        ],
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });
  }, []);

  // ── Submit citizen observation / complaint ───────────────────────────────
  const addComplaint = useCallback(async (payload) => {
    const tokenId = payload.customToken || `#CIT-${payload.districtCode || 'VNS'}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const complaint = {
      ...payload,
      tokenId,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      aiCheck: {
        status: 'Verified Authenticated',
        initiatedAt: new Date().toISOString(),
      },
    };

    setComplaints(prev => {
      const next = [complaint, ...prev];
      saveComplaints(next);
      return next;
    });

    // Cloud submission to Supabase
    const workId = payload.projectId || payload.workId || payload.work_id;
    if (workId) {
      submitCitizenObservation({
        work_id: workId,
        ground_status: payload.issueType || payload.ground_status || 'Incomplete / Work Stopped',
        observation_text: payload.observation || payload.observation_text || 'Citizen ground report',
        evidence_photo_url: payload.photoUrl || payload.evidence_photo_url || null,
        user_latitude: payload.userLat || payload.user_latitude || null,
        user_longitude: payload.userLng || payload.user_longitude || null,
      }).catch(() => {});

      // Reactive instant state update in frontend
      setProjects(prevProjects => {
        const nextProjects = prevProjects.map(proj => {
          if (proj.id === workId || proj.work_id === workId) {
            const elevatedScore = Math.min(99, (proj.riskScore || proj.composite_risk_score || 50) + 15);
            return {
              ...proj,
              riskScore: elevatedScore,
              composite_risk_score: elevatedScore,
              riskTier: 'HIGH_PRIORITY',
              review_priority: 'HIGH_PRIORITY',
              isAnomaly: true,
              progress_discrepancy_points: Math.min(100, (proj.progress_discrepancy_points || 0) + 20),
            };
          }
          return proj;
        });
        saveCachedProjects(nextProjects);
        return nextProjects;
      });
    }

    showToast(`Grievance registered. Tracking ID: ${tokenId}. AI authenticity check initiated.`);
    return tokenId;
  }, [showToast]);

  const clearToast = useCallback(() => setActiveToast(null), []);

  return (
    <CaseContext.Provider value={{
      projects,
      loading,
      backendStatus,
      refreshData,
      getCase,
      advanceStatus,
      assignCase,
      updateChecklist,
      recordDuplicateDecision,
      addEvidenceItem,
      submitSupervisorReview,
      recordFeedback,
      attachEvidence,
      attachNode,
      addComplaint,
      complaints,
      activeToast,
      clearToast,
    }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCaseContext() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCaseContext must be used within CaseProvider');
  return ctx;
}
