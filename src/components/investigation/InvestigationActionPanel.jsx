import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, UserPlus, Download, ShieldCheck, ArrowRight, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { downloadEvidenceReport } from '../../utils/reportExport';

export default function InvestigationActionPanel({
  project,
  caseData,
  investigatorRole,
  onPrioritize,
  onOpenAssignModal,
}) {
  const { t } = useLanguage();
  const [downloaded, setDownloaded] = useState(false);
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const status = caseData?.status || 'Detected';
  const isQueued = status === 'QUEUED_FOR_FIELD_INSPECTION' || status === 'UNDER_FIELD_INVESTIGATION' || status === 'Field Verification Dispatched';

  const handleDownloadReport = () => {
    downloadEvidenceReport(project, caseData);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 6000);
  };

  const handlePrioritizeClick = async () => {
    if (isPrioritizing) return;
    setIsPrioritizing(true);
    if (onPrioritize) {
      await onPrioritize();
    }
    setIsPrioritizing(false);
  };

  return (
    <section className="panel investigation-action-panel" style={{ padding: '20px 24px', background: '#fff', border: '1px solid var(--line)', borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <span className="eyebrow" style={{ letterSpacing: '0.06em', color: 'var(--brand)', fontWeight: 800 }}>
            ADMINISTRATIVE DISPOSITION CONTROLS
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 6px', color: 'var(--ink)' }}>
            Investigation Action Panel
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            Mandated supervisory actions to advance vigilance workflow, deploy field engineers, and archive evidence dockets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAFBF8', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Current Docket State:
          </span>
          <b style={{ fontSize: 12, color: 'var(--brand)' }}>
            {status === 'UNDER_FIELD_INVESTIGATION' ? 'Field Verification Dispatched' : status}
          </b>
        </div>
      </div>

      {/* 3 Prominent Operational Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        
        {/* BUTTON 1: PRIORITIZE FOR VERIFICATION */}
        <div style={{ padding: 16, borderRadius: 12, background: isQueued ? '#FAFBF8' : '#FFF9F6', border: `1px solid ${isQueued ? 'var(--line)' : '#FFCCBC'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: isQueued ? '#EEF3EF' : '#F8EAE7', display: 'grid', placeItems: 'center', color: isQueued ? '#059669' : '#C85A32' }}>
                {isQueued ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              </div>
              <b style={{ fontSize: 14, color: 'var(--ink)' }}>1. Statutory Prioritization</b>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
              Flag this case for mandatory on-site inspection in the District Vigilance registry.
            </p>
          </div>

          <button
            type="button"
            className={isQueued ? 'secondary-action' : 'primary-action'}
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontWeight: 800 }}
            onClick={handlePrioritizeClick}
            disabled={isPrioritizing || isQueued}
          >
            {isQueued ? (
              <>
                <CheckCircle2 size={15} style={{ color: '#059669' }} />
                <span>Queued for Field Inspection</span>
              </>
            ) : (
              <>
                <AlertCircle size={15} />
                <span>{isPrioritizing ? 'Queuing...' : 'Prioritize for Verification'}</span>
              </>
            )}
          </button>
        </div>

        {/* BUTTON 2: ASSIGN FIELD INSPECTION */}
        <div style={{ padding: 16, borderRadius: 12, background: '#FAFBF8', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F2', display: 'grid', placeItems: 'center', color: 'var(--brand)' }}>
                <UserPlus size={18} />
              </div>
              <b style={{ fontSize: 14, color: 'var(--ink)' }}>2. Field Officer Assignment</b>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
              Dispatch junior engineer / SDM with terms of reference, inspection checklist, and statutory due date.
            </p>
          </div>

          <button
            type="button"
            className="primary-action"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontWeight: 800, background: 'var(--brand)' }}
            onClick={onOpenAssignModal}
          >
            <UserPlus size={15} />
            <span>{caseData?.assignedOfficer ? 'Reassign / Update Directive' : 'Assign Field Inspection'}</span>
          </button>
        </div>

        {/* BUTTON 3: GENERATE EVIDENCE REPORT */}
        <div style={{ padding: 16, borderRadius: 12, background: '#FAFBF8', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF3EF', display: 'grid', placeItems: 'center', color: '#1B365D' }}>
                <FileText size={18} />
              </div>
              <b style={{ fontSize: 14, color: 'var(--ink)' }}>3. Official Evidence Docket</b>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
              Export cryptographic text dossier with financial records, GPS coordinates, and signal attribution.
            </p>
          </div>

          <button
            type="button"
            className="secondary-action"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontWeight: 800, border: '1px solid #1B365D', color: '#1B365D' }}
            onClick={handleDownloadReport}
          >
            {downloaded ? (
              <>
                <CheckCircle2 size={15} style={{ color: '#059669' }} />
                <span>Docket Downloaded!</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Generate Evidence Report</span>
              </>
            )}
          </button>
        </div>

      </div>

      {downloaded && (
        <div style={{ marginTop: 14, padding: '8px 14px', borderRadius: 8, background: '#E8F5E9', border: '1px solid #C8E6C9', color: '#2E7D32', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={15} />
          <span>
            <b>PRAHARI Evidence Docket</b> successfully generated and saved to your device for official archival.
          </span>
        </div>
      )}
    </section>
  );
}
