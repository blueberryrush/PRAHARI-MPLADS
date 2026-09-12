import React, { useState } from 'react';
import {
  X,
  UserRound,
  Calendar,
  AlertCircle,
  Building,
  CheckCircle2,
  Send,
  ShieldAlert,
  CheckSquare,
  Square,
  FileText,
  Compass,
  HardHat,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

// Standard field administrative inspection officers
export const SUBORDINATE_OFFICERS = [
  {
    name: 'Shri R.K. Verma',
    designation: 'Sub-Divisional Magistrate (SDM), Sadar',
    department: 'Revenue Administration & Executive Magistracy',
    role: 'Sub-Divisional Magistrate',
    jurisdiction: 'Varanasi Sadar Sub-Division',
    label: 'Shri R.K. Verma - Sub-Divisional Magistrate (SDM), Sadar',
    phone: '+91 94544 12301',
  },
  {
    name: 'Er. Priya Singh',
    designation: 'Assistant Engineer, Rural Engineering Dept (RED)',
    department: 'Rural Engineering Department (RED)',
    role: 'Assistant Engineer',
    jurisdiction: 'District Rural Works Circle',
    label: 'Er. Priya Singh - Assistant Engineer, Rural Engineering Dept (RED)',
    phone: '+91 94544 12302',
  },
  {
    name: 'Shri A.K. Tripathi',
    designation: 'Block Development Officer (BDO), Pindra',
    department: 'Rural Development & Panchayat Raj Cell',
    role: 'Block Development Officer',
    jurisdiction: 'Pindra Block',
    label: 'Shri A.K. Tripathi - Block Development Officer (BDO), Pindra',
    phone: '+91 94544 12303',
  },
  {
    name: 'Shri Mahendra Pratap',
    designation: 'Tehsildar & Executive Magistrate, Sadar',
    department: 'Land Records & Revenue Demarcation Wing',
    role: 'Tehsildar',
    jurisdiction: 'Sadar Tehsil',
    label: 'Shri Mahendra Pratap - Tehsildar, Varanasi Sadar',
    phone: '+91 94544 12304',
  },
  {
    name: 'Er. Rajesh Kumar',
    designation: 'Junior Engineer, Public Works Dept (PWD Division-1)',
    department: 'PWD Provincial Division',
    role: 'Junior Engineer',
    jurisdiction: 'Varanasi Infrastructure Division',
    label: 'Er. Rajesh Kumar - Junior Engineer, PWD Division-1',
    phone: '+91 94544 12305',
  },
  {
    name: 'Smt. Sunita Patel',
    designation: 'Assistant Development Officer (ADO - Panchayat)',
    department: 'District Panchayat Raj Office',
    role: 'Assistant Development Officer',
    jurisdiction: 'Harahua Block',
    label: 'Smt. Sunita Patel - ADO (Panchayat), Harahua',
    phone: '+91 94544 12306',
  },
];

// Mandated inspection focus areas
const MANDATED_FOCUS_ITEMS = [
  {
    id: 'milestone',
    label: 'Physical Milestone Progress',
    labelHi: 'भौतिक प्रगति व माइलस्टोन सत्यापन',
    desc: 'Reconcile on-site physical progress % against contractor billing tranches and Measurement Book (MB-42).',
    icon: HardHat,
  },
  {
    id: 'coords',
    label: 'Asset Existence & Geo-coordinates',
    labelHi: 'परिसंपत्ति का अस्तित्व एवं जीपीएस निर्देशांक',
    desc: 'Authenticate physical coordinates within ±50m of DPR sanction; verify zero spatial overlap with neighbouring schemes.',
    icon: Compass,
  },
  {
    id: 'quality',
    label: 'Material Quality / Core Sampling',
    labelHi: 'सामग्री गुणवत्ता व कोर सैंपलिंग',
    desc: 'Scrutinize bitumen layer thickness, concrete mix grade, and impound official laboratory test certificates.',
    icon: Scale,
  },
];

function getTPlus7Date() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export default function InvestigationAssignmentModal({
  project,
  existingAssignment,
  onClose,
  onSaveAssignment,
}) {
  const { t, lang } = useLanguage();
  const { user, getRoleLabel } = useAuth();

  const delegatingAuthority =
    user?.role === 'ministry'
      ? 'Director General (MPLADS), MoSPI'
      : user?.role === 'state_nodal'
        ? `State Nodal Monitoring Officer (${user?.state || 'Uttar Pradesh'})`
        : `District Magistrate & Collector, ${user?.district || project?.district || 'Varanasi'}`;

  // Default officer
  const defaultOfficer =
    existingAssignment?.officer ||
    SUBORDINATE_OFFICERS[0].label;

  const [officerLabel, setOfficerLabel] = useState(defaultOfficer);
  const [priority, setPriority] = useState(existingAssignment?.priority || 'high');
  const [dueDate, setDueDate] = useState(existingAssignment?.dueDate || getTPlus7Date());

  // Mandated Focus Checkboxes
  const [mandatedFocus, setMandatedFocus] = useState(() => {
    if (existingAssignment?.mandatedFocus && Array.isArray(existingAssignment.mandatedFocus)) {
      return existingAssignment.mandatedFocus;
    }
    return ['Physical Milestone Progress', 'Asset Existence & Geo-coordinates', 'Material Quality / Core Sampling'];
  });

  // Default Directives Text
  const defaultDirectives = () => {
    if (existingAssignment?.directives || existingAssignment?.instructions) {
      return existingAssignment.directives || existingAssignment.instructions;
    }
    const isOverlap = project?.id === 'PRJ002' || project?.isAnomaly;
    return `1. Carry out mandatory physical chainage and dimension inspection for ${project?.name || 'this work'}.
2. Capture timestamped geotagged photographs at 3 distinct project coordinates using the PRAHARI field tool.
3. Scrutinize Measurement Book (MB-42) entries and cross-verify with contractor invoice tranches.${isOverlap ? '\n4. Conduct ground boundary demarcation to verify zero overlap with adjacent sanction PRJ001.' : ''}
5. Submit final signed inspection report with photographic evidence within the statutory T+7 deadline.`;
  };

  const [directives, setDirectives] = useState(defaultDirectives);

  const selectedOfficerObj =
    SUBORDINATE_OFFICERS.find((o) => o.label === officerLabel) || SUBORDINATE_OFFICERS[0];

  const toggleFocus = (label) => {
    setMandatedFocus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveAssignment) {
      onSaveAssignment({
        officer: selectedOfficerObj.label,
        subordinateOfficer: selectedOfficerObj.name,
        designation: selectedOfficerObj.designation,
        role: selectedOfficerObj.role,
        department: selectedOfficerObj.department,
        jurisdiction: selectedOfficerObj.jurisdiction,
        priority,
        dueDate,
        mandatedFocus,
        directives,
        instructions: directives,
        dispatchedAt: new Date().toISOString(),
        delegatedBy: delegatingAuthority,
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-window wide dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', borderRadius: '16px' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '18px 24px' }}>
          <div>
            <div
              className="eyebrow"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--brand, #059669)',
                fontWeight: 700,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <ShieldAlert size={14} />
              <span>
                {lang === 'hi'
                  ? 'प्रशासनिक स्थलीय जांच आदेश · नियम 7(बी)'
                  : 'ADMINISTRATIVE INVESTIGATION DISPATCH · STATUTORY ORDER'}
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 2px' }}>
              {lang === 'hi'
                ? 'स्थलीय सत्यापन निर्देश जारी करें'
                : 'Dispatch Field Verification Directive'}
            </h3>
            <p className="sub-text" style={{ fontSize: '12px', color: 'var(--muted, #78716c)' }}>
              Case Ref: <b>{project?.id}</b> · {project?.name} · {project?.district || 'Varanasi'}
            </p>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
            style={{ cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px 24px', gap: '16px' }}>
            {/* Government Hierarchy Model Callout */}
            <div
              style={{
                background: 'rgba(5, 150, 105, 0.08)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <Building size={20} style={{ color: 'var(--brand, #059669)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', lineHeight: 1.45 }}>
                <div style={{ fontWeight: 700, color: 'var(--brand, #059669)', marginBottom: '2px' }}>
                  {lang === 'hi' ? 'उच्च प्राधिकारी प्रतिनिधि मंडल' : 'Administrative Delegation Protocol'}
                </div>
                <div style={{ color: 'var(--ink, #1c1917)' }}>
                  {lang === 'hi' ? (
                    <>
                      <b>{delegatingAuthority}</b> व्यक्तिगत रूप से स्थलीय जांच नहीं करते हैं। केंद्रीय एमपीलैड्स दिशानिर्देशों के तहत अधीनस्थ क्षेत्रीय अधिकारियों (SDM / AE / BDO) को भौतिक व तकनीकी जांच हेतु आदेशित किया जाता है।
                    </>
                  ) : (
                    <>
                      Higher Authority (<b>{delegatingAuthority}</b>) exercises supervisory oversight and formally delegates physical on-site measurement, GIS coordinate authentication, and material scrutiny to subordinate field inspection authorities.
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Field 1: Select Subordinate Officer */}
            <div>
              <label className="field-label" style={{ display: 'block', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                {lang === 'hi'
                  ? '1. अधीनस्थ जांच अधिकारी का चयन (Select Subordinate Officer)'
                  : '1. Select Subordinate Officer (Field Authority)'}
                <span style={{ color: 'var(--danger, #c85a32)', marginLeft: '4px' }}>*</span>
              </label>
              <select
                className="select wide"
                value={officerLabel}
                onChange={(e) => setOfficerLabel(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #e7e5e4)',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'var(--card-bg, #fff)',
                  color: 'var(--ink, #1c1917)',
                }}
              >
                {SUBORDINATE_OFFICERS.map((officer) => (
                  <option key={officer.name} value={officer.label}>
                    {officer.label}
                  </option>
                ))}
              </select>

              {/* Subordinate Officer Metadata Strip */}
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: 'var(--muted, #78716c)',
                  display: 'flex',
                  gap: '14px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.03)',
                }}
              >
                <span><b>Dept:</b> {selectedOfficerObj.department}</span>
                <span>·</span>
                <span><b>Jurisdiction:</b> {selectedOfficerObj.jurisdiction}</span>
                <span>·</span>
                <span><b>Contact:</b> {selectedOfficerObj.phone}</span>
              </div>
            </div>

            {/* Field 2: Mandated Inspection Focus (Checkboxes) */}
            <div>
              <label className="field-label" style={{ display: 'block', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                {lang === 'hi'
                  ? '2. अनिवार्य निरीक्षण बिंदु (Mandated Inspection Focus)'
                  : '2. Mandated Inspection Focus'}
                <span style={{ color: 'var(--danger, #c85a32)', marginLeft: '4px' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {MANDATED_FOCUS_ITEMS.map((item) => {
                  const isChecked = mandatedFocus.includes(item.label);
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFocus(item.label)}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleFocus(item.label);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isChecked
                          ? '1px solid var(--brand, #059669)'
                          : '1px solid var(--line, #e7e5e4)',
                        background: isChecked
                          ? 'rgba(5, 150, 105, 0.05)'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ marginTop: '2px', color: isChecked ? 'var(--brand, #059669)' : 'var(--muted, #78716c)' }}>
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconComp size={14} style={{ color: isChecked ? 'var(--brand, #059669)' : 'var(--muted, #78716c)' }} />
                          <b style={{ fontSize: '12px', color: isChecked ? 'var(--brand, #059669)' : 'var(--ink, #1c1917)' }}>
                            {lang === 'hi' ? item.labelHi : item.label}
                          </b>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--muted, #78716c)', margin: '2px 0 0', lineHeight: 1.35 }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field 3 & 4: Statutory Deadline (T+7) and Urgency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="field-label" style={{ fontWeight: 700, fontSize: '12px', margin: 0 }}>
                    {lang === 'hi' ? '3. सांविधिक समय-सीमा (Statutory Deadline)' : '3. Statutory Deadline'}
                    <span style={{ color: 'var(--danger, #c85a32)', marginLeft: '4px' }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      background: 'rgba(5, 150, 105, 0.12)',
                      color: 'var(--brand, #059669)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    Default: T+7 Days
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="input-text wide"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line, #e7e5e4)',
                      fontSize: '12px',
                      background: 'var(--card-bg, #fff)',
                      color: 'var(--ink, #1c1917)',
                    }}
                  />
                </div>
                <small style={{ fontSize: '10px', color: 'var(--muted, #78716c)', display: 'block', marginTop: '4px' }}>
                  Mandated timeline per District Vigilance Protocol.
                </small>
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  {lang === 'hi' ? 'प्राथमिकता स्तर (Urgency / Priority)' : 'Urgency / Priority'}
                </label>
                <select
                  className="select wide"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line, #e7e5e4)',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'var(--card-bg, #fff)',
                    color: 'var(--ink, #1c1917)',
                  }}
                >
                  <option value="critical">Immediate / Critical (48 Hours Inquiry)</option>
                  <option value="high">High Priority (Statutory T+7 Days)</option>
                  <option value="medium">Standard Routine Verification (T+14 Days)</option>
                </select>
                <small style={{ fontSize: '10px', color: 'var(--muted, #78716c)', display: 'block', marginTop: '4px' }}>
                  Escalates in monitoring queue if deadline passes.
                </small>
              </div>
            </div>

            {/* Field 5: Dispatch Directives (Textarea) */}
            <div>
              <label className="field-label" style={{ display: 'block', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                {lang === 'hi'
                  ? '4. प्रशासनिक जांच निर्देश (Dispatch Directives & Terms of Inquiry)'
                  : '4. Dispatch Directives & Specific Points of Inquiry'}
                <span style={{ color: 'var(--danger, #c85a32)', marginLeft: '4px' }}>*</span>
              </label>
              <textarea
                className="note-box"
                rows={4}
                placeholder="Specify inspection directives, boundary reconciliation instructions, documents to scrutinize..."
                value={directives}
                onChange={(e) => setDirectives(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #e7e5e4)',
                  fontSize: '12px',
                  lineHeight: 1.45,
                  fontFamily: 'inherit',
                  background: 'var(--card-bg, #fff)',
                  color: 'var(--ink, #1c1917)',
                  resize: 'vertical',
                }}
              />
              <small style={{ fontSize: '10px', color: 'var(--muted, #78716c)', display: 'block', marginTop: '4px' }}>
                Directives will be transmitted to the officer's PRAHARI mobile terminal and recorded on the immutable audit trail.
              </small>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer"
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--line, #e7e5e4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted, #78716c)' }}>
              Authority: <b>{delegatingAuthority}</b>
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="secondary-action"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--line, #e7e5e4)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {t('btn_cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                className="primary-action dispatch-directive-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--brand, #059669)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                }}
              >
                <Send size={15} />
                <span>
                  {lang === 'hi'
                    ? 'निर्देश जारी करें | Dispatch Directive'
                    : 'Dispatch Field Directive | निर्देश जारी करें'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
