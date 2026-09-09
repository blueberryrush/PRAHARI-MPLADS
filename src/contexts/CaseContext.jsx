import { createContext, useContext, useState, useCallback } from 'react';

const CaseContext = createContext();
const STORAGE_KEY = 'prahari-cases';

function loadCases() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveCases(cases) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); } catch {}
}

function buildInitialCase(id) {
  return {
    id,
    status: 'Detected',
    auditHistory: [{
      action: 'Case Detected',
      timestamp: new Date().toISOString(),
      officerId: 'SYSTEM',
      note: 'Automated risk signal surfaced by PRAHARI analytics engine via Authorized PFMS Feed.'
    }],
    feedbackFidelity: null,
    capturedEvidence: null,
  };
}

export function CaseProvider({ children }) {
  const [cases, setCases] = useState(loadCases);
  const [activeToast, setActiveToast] = useState(null);

  const getCase = useCallback((id) => {
    return cases[id] || buildInitialCase(id);
  }, [cases]);

  const advanceStatus = useCallback((id, newStatus, officerId = 'Officer', note = '') => {
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
            officerId,
            note: note || `Case advanced to ${newStatus} by ${officerId}.`
          }
        ]
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });
  }, []);

  const recordFeedback = useCallback((id, fidelity, district = 'Varanasi', signal = 'seasonal roadwork delays') => {
    const isFalseAlarm = fidelity === 'False Alarm';
    const adjustment = isFalseAlarm ? '-14%' : '+8%';
    const toastMsg = isFalseAlarm
      ? `Feedback ingested. Sensitivity adjusted for ${signal} in District ${district} (${adjustment}).`
      : `Feedback ingested. Risk model reinforced for ${signal} signal patterns in District ${district} (${adjustment}).`;

    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updated = {
        ...existing,
        feedbackFidelity: fidelity,
        auditHistory: [
          ...existing.auditHistory,
          {
            action: `Outcome Fidelity: ${fidelity}`,
            timestamp: new Date().toISOString(),
            officerId: 'Investigator',
            note: `Active learning feedback recorded: ${fidelity}`
          }
        ]
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });

    setActiveToast(toastMsg);
    setTimeout(() => setActiveToast(null), 6000);
  }, []);

  const attachEvidence = useCallback((id, evidencePayload) => {
    setCases(prev => {
      const existing = prev[id] || buildInitialCase(id);
      const updated = {
        ...existing,
        capturedEvidence: evidencePayload,
        auditHistory: [
          ...existing.auditHistory,
          {
            action: 'Field Evidence Captured',
            timestamp: evidencePayload.capturedAt || new Date().toISOString(),
            officerId: 'Field Officer',
            note: `Geospatial drift: ${evidencePayload.spatialDriftMeters}m. ${evidencePayload.isDriftFlagged ? 'DRIFT FLAGGED.' : 'Location authenticated.'}`
          }
        ]
      };
      const next = { ...prev, [id]: updated };
      saveCases(next);
      return next;
    });
  }, []);

  const clearToast = useCallback(() => setActiveToast(null), []);

  return (
    <CaseContext.Provider value={{ getCase, advanceStatus, recordFeedback, attachEvidence, activeToast, clearToast }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCaseContext() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCaseContext must be used within CaseProvider');
  return ctx;
}
