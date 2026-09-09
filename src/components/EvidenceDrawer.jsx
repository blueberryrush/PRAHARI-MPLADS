import { X, ShieldAlert, Paperclip, CheckCircle2 } from 'lucide-react';

const SEVERITY_STYLE = {
  HIGH:     { bg: 'rgba(220,38,38,0.12)',   color: '#dc2626', border: 'rgba(220,38,38,0.3)' },
  ELEVATED: { bg: 'rgba(217,119,6,0.12)',   color: '#d97706', border: 'rgba(217,119,6,0.3)' },
  MODERATE: { bg: 'rgba(37,99,235,0.12)',   color: '#3b82f6', border: 'rgba(37,99,235,0.3)' },
  LOW:      { bg: 'rgba(5,150,105,0.12)',   color: '#10b981', border: 'rgba(5,150,105,0.3)' },
};

function buildNodeMeta(node, agency, project, relatedWork) {
  if (!node) return { fields: [], anomalies: [] };

  switch (node.id) {
    case 'Agency': return {
      fields: [
        { label: 'Entity Type',       value: 'Implementing Agency' },
        { label: 'GSTIN Reference',   value: `GSTIN-${(agency?.id || 'NA').replace('AG','UP')}XXXXXX` },
        { label: 'Total Projects',    value: agency?.totalProjects ?? '—' },
        { label: 'On-Time Rate',      value: agency ? `${agency.onTimeRate}%` : '—' },
        { label: 'Risk Assessment',   value: agency ? `${agency.riskScore}/100` : '—' },
        { label: 'Data Source',       value: 'eSAKSHI Ingestion Pipeline' },
      ],
      anomalies: [
        ...(agency?.redFlags > 0 ? [{ rule: `${agency.redFlags} red flags recorded in audit period`, severity: 'HIGH' }] : []),
        ...(agency?.riskScore > 60 ? [{ rule: 'Agency performance trend declining vs. district baseline', severity: 'ELEVATED' }] : []),
        ...(agency?.riskScore > 75 ? [{ rule: 'Contractor blacklist cross-check recommended', severity: 'ELEVATED' }] : []),
      ],
    };

    case 'Payment': return {
      fields: [
        { label: 'Entity Type',        value: 'PFMS Financial Record' },
        { label: 'PFMS Transaction',   value: `PFMS-2024-${project?.id || 'NA'}-TXN-001` },
        { label: 'Sanctioned Amount',  value: `₹${((project?.sanctionedAmount || 0)/100000).toFixed(1)}L` },
        { label: 'Reported Spend',     value: `₹${((project?.spentAmount || 0)/100000).toFixed(1)}L` },
        { label: 'Variance',           value: `${(((project?.spentAmount || 0)/(project?.sanctionedAmount || 1) - 1)*100).toFixed(1)}%` },
        { label: 'Data Source',        value: 'Authorized PFMS Feed' },
      ],
      anomalies: [
        ...((project?.spentAmount > project?.sanctionedAmount * 1.1) ? [
          { rule: 'Expenditure exceeds sanction ceiling by >10%', severity: 'HIGH' },
          { rule: 'Financial progress decoupled from physical milestone baseline', severity: 'ELEVATED' },
        ] : []),
      ],
    };

    case 'Location': return {
      fields: [
        { label: 'Entity Type',          value: 'Geospatial Record' },
        { label: 'GPS Reference',         value: '25.3176°N, 82.9739°E' },
        { label: 'District',              value: project?.district || '—' },
        { label: 'State',                 value: project?.state || '—' },
        { label: 'Coordinate Drift',      value: '< 50m — within approved perimeter' },
        { label: 'Data Source',           value: 'eSAKSHI Ingestion Pipeline' },
      ],
      anomalies: [],
    };

    case 'Project': return {
      fields: [
        { label: 'Entity Type',         value: 'MPLADS Project Record' },
        { label: 'DPR Approval Date',   value: project?.sanctionDate || '—' },
        { label: 'Physical Progress',   value: `${project?.physicalProgress || 0}%` },
        { label: 'Expected Completion', value: project?.expectedCompletion || '—' },
        { label: 'eSAKSHI Status',      value: project?.status === 'completed' ? 'Geotagged Proof Available' : 'Pending Field Upload' },
        { label: 'Data Source',         value: 'Audit Registry Sandbox' },
      ],
      anomalies: [
        ...(project?.status === 'delayed' ? [{ rule: 'Physical execution behind approved DPR timeline', severity: 'ELEVATED' }] : []),
        ...((project?.spentAmount > project?.sanctionedAmount * 1.1) ? [{ rule: 'Spending rate exceeds physical milestone baseline', severity: 'HIGH' }] : []),
      ],
    };

    case 'MP / Constituency': return {
      fields: [
        { label: 'Entity Type',   value: 'Constituency Context' },
        { label: 'Constituency',  value: node.value || '—' },
        { label: 'State',         value: project?.state || '—' },
        { label: 'Data Source',   value: 'Authorized PFMS Feed' },
        { label: 'Note',          value: 'Context node — not an anomaly indicator' },
      ],
      anomalies: [],
    };

    case 'Related Work': return {
      fields: [
        { label: 'Entity Type',    value: 'Candidate Relation' },
        { label: 'Related ID',     value: relatedWork?.id || node.value || '—' },
        { label: 'Sector',         value: relatedWork?.sector || '—' },
        { label: 'Constituency',   value: relatedWork?.constituency || '—' },
        { label: 'Review Status',  value: 'Surfaced for investigator review — not confirmed' },
        { label: 'Data Source',    value: 'Audit Registry Sandbox' },
      ],
      anomalies: relatedWork ? [
        { rule: 'Shared sector + constituency attributes — candidate spatial overlap', severity: 'MODERATE' },
      ] : [],
    };

    default: return { fields: [], anomalies: [] };
  }
}

export default function EvidenceDrawer({ node, isOpen, onClose, onAttach, agency, project, relatedWork }) {
  if (!isOpen || !node) return null;

  const { fields, anomalies } = buildNodeMeta(node, agency, project, relatedWork);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className={`evidence-drawer ${isOpen ? 'open' : ''}`} aria-label="Evidence node detail">

        <div className="drawer-header">
          <div>
            <span className="eyebrow">EVIDENCE NODE</span>
            <h3>{node.id}</h3>
            <p className="drawer-subtitle">{node.description}</p>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close evidence drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-section">
          <span className="eyebrow">ENTITY METADATA</span>
          <div className="entity-meta-grid">
            {fields.map(f => (
              <div key={f.label} className="entity-meta-row">
                <span className="meta-label">{f.label}</span>
                <strong className="meta-value">{f.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {anomalies.length > 0 && (
          <div className="drawer-section">
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldAlert size={11} /> ANOMALY RULES BREACHED
            </span>
            <div className="anomaly-breach-list">
              {anomalies.map((a, i) => {
                const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.LOW;
                return (
                  <div key={i} className="anomaly-breach-row">
                    <span
                      className="anomaly-severity-chip"
                      style={{ background: s.bg, color: s.color, borderColor: s.border }}
                    >
                      {a.severity}
                    </span>
                    <span className="anomaly-rule-text">{a.rule}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {anomalies.length === 0 && (
          <div className="drawer-no-anomaly">
            <CheckCircle2 size={14} />
            <span>No specific anomaly rules triggered for this node. It serves as contextual evidence for the investigation.</span>
          </div>
        )}

        <div className="drawer-governance">
          <ShieldAlert size={13} />
          <span>Node evidence is an investigation lead. It does not independently establish fraud or wrongdoing. Human review is required.</span>
        </div>

        <div className="drawer-actions">
          <button
            className="attach-docket-btn"
            onClick={() => { onAttach?.(node); onClose(); }}
          >
            <Paperclip size={15} />
            Attach Node Evidence to Case Docket
          </button>
        </div>

      </aside>
    </>
  );
}
