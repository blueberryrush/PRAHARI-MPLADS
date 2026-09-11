import { createContext, useContext, useState, useCallback } from 'react';

const CaseContext = createContext();
const STORAGE_KEY = 'prahari-cases-v2';
const COMPLAINT_KEY = 'prahari-complaints-v1';

// ─── Lifecycle Constants ──────────────────────────────────────────────────────
export const LIFECYCLE_STAGES = [
  'Detected',
  'Triaged',
  'Assigned',
  'Field Verification Dispatched',
  'Under Review',
  'Resolved',
  'Escalated to State Vigilance',
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
function loadCases() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
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

// ─── Build initial case ───────────────────────────────────────────────────────
function buildInitialCase(id) {
  return {
    id,
    status: 'Detected',
    auditHistory: [{
      action: 'Case Detected',
      timestamp: new Date().toISOString(),
      officerName: 'PRAHARI System',
      role: 'System',
      note: 'Automated risk signal surfaced by PRAHARI analytics engine via Authorized PFMS Financial Ledger Feed.',
      hash: Math.random().toString(36).slice(2, 10).toUpperCase(),
    }],
    feedbackFidelity: null,
    capturedEvidence: null,
    attachedNodes: [],
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CaseProvider({ children }) {
  const [cases, setCases] = useState(loadCases);
  const [complaints, setComplaints] = useState(loadComplaints);
  const [activeToast, setActiveToast] = useState(null);

  const showToast = useCallback((msg) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 7000);
  }, []);

  // ── Get or initialise a case ──────────────────────────────────────────────
  const getCase = useCallback((id) => {
    return cases[id] || buildInitialCase(id);
  }, [cases]);

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
  }, []);

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

  // ── Submit citizen complaint ──────────────────────────────────────────────
  const addComplaint = useCallback((payload) => {
    const tokenId = `GRV-${payload.stateCode || 'IN'}-${payload.districtCode || 'VAR'}-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const complaint = {
      ...payload,
      tokenId,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      aiCheck: {
        status: 'Pending',
        initiatedAt: new Date().toISOString(),
      },
    };

    setComplaints(prev => {
      const next = [complaint, ...prev];
      saveComplaints(next);
      return next;
    });

    showToast(`Grievance registered. Tracking ID: ${tokenId}. AI authenticity check initiated.`);
    return tokenId;
  }, [showToast]);

  const clearToast = useCallback(() => setActiveToast(null), []);

  return (
    <CaseContext.Provider value={{
      getCase,
      advanceStatus,
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
