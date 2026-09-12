import React, { useState } from 'react';
import { History, ShieldCheck, CheckCircle2, Clock, GitCommit, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CaseTimelineAuditTrail({ caseData, project }) {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('audit'); // 'timeline' | 'audit'

  const auditHistory = caseData?.auditHistory || [];
  const status = caseData?.status || 'Detected';

  // Chronological timeline steps
  const timelineEvents = [
    {
      title: 'Project Sanction Approved',
      date: project?.sanctionDate || '2024-01-20',
      actor: 'District Planning Committee',
      status: 'completed',
      detail: `Sanctioned amount ₹${((project?.sanctionedAmount || 1200000) / 100000).toFixed(1)}L under MPLADS Scheme.`,
    },
    {
      title: 'Work Order Issued & Commenced',
      date: project?.startDate || '2024-03-01',
      actor: `Agency ${project?.agency || 'AG003'}`,
      status: 'completed',
      detail: 'Mobilization advance disbursed. Site alignment commenced.',
    },
    {
      title: 'Analytical Risk Signal Surfaced',
      date: '2024-07-28',
      actor: 'PRAHARI AI Engine',
      status: 'completed',
      detail: 'Financial disbursement (183%) exceeded reported physical milestones (55%). Anomaly docket generated.',
    },
    {
      title: 'Case Assigned to Investigator',
      date: '2024-08-05',
      actor: 'District Authority, Varanasi',
      status: 'completed',
      detail: 'Assigned to Rajesh Kumar (Field Officer). Priority: High.',
    },
    {
      title: 'Field Verification & Evidence Inspection',
      date: '2024-08-18',
      actor: 'Investigator Desk',
      status: status === 'Field Verification Dispatched' || status === 'Under Review' || status === 'Resolved' ? 'completed' : 'active',
      detail: 'Physical coordinate drift measured. Measurement Book MB-42 audited.',
    },
    {
      title: 'Supervisor Review & Case Closure',
      date: 'Pending',
      actor: 'Competent Authority',
      status: status === 'Resolved' ? 'completed' : 'pending',
      detail: status === 'Resolved' ? 'Case resolved and corrective directives issued.' : 'Awaiting final administrative sign-off.',
    },
  ];

  return (
    <section className="panel timeline-audit-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('inv_audit_trail_label')}</span>
          <h3>{t('inv_audit_record_title')}</h3>
        </div>

        <div className="timeline-switcher-tabs">
          <button
            type="button"
            className={`sub-tab ${activeSubTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('audit')}
          >
            <ShieldCheck size={14} />
            <span>Audit Trail ({auditHistory.length})</span>
          </button>

          <button
            type="button"
            className={`sub-tab ${activeSubTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('timeline')}
          >
            <History size={14} />
            <span>Lifecycle Timeline</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'audit' ? (
        <div className="audit-trail-container">
          <div className="audit-trail">
            {auditHistory.slice().reverse().map((entry, i) => (
              <div key={i} className="audit-trail-row">
                <span className="audit-dot" />
                <div className="audit-row-content">
                  <div className="audit-row-header">
                    <b>{entry.action}</b>
                    <span className="audit-officer-tag">
                      {entry.officerName || 'System'} ({entry.role || 'Officer'})
                    </span>
                  </div>
                  <p className="audit-note">{entry.note}</p>
                  <div className="audit-meta">
                    <small>
                      <Clock size={11} />
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </small>
                    {entry.hash && (
                      <span className="crypto-hash-badge">
                        SHA-256: <code>#{entry.hash}</code>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="lifecycle-timeline-container">
          <div className="lifecycle-timeline">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className={`timeline-node-row status-${evt.status}`}>
                <div className="timeline-node-marker">
                  {evt.status === 'completed' ? (
                    <CheckCircle2 size={16} className="text-brand" />
                  ) : evt.status === 'active' ? (
                    <span className="active-pulsing-node" />
                  ) : (
                    <span className="pending-node" />
                  )}
                  {idx < timelineEvents.length - 1 && <div className="timeline-node-line" />}
                </div>

                <div className="timeline-node-content">
                  <div className="node-head">
                    <b>{evt.title}</b>
                    <span className="node-date">{evt.date}</span>
                  </div>
                  <small className="node-actor">{evt.actor}</small>
                  <p className="node-detail">{evt.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
