import React from 'react';
import { CheckSquare, CheckCircle2, Square } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VerificationChecklistWidget({
  caseData,
  onToggleCheck,
}) {
  const { t } = useLanguage();
  const checklist = caseData?.checklist || {};

  const checkItems = [
    {
      key: 'check_pfms',
      label: 'Verify PFMS payment voucher trail against treasury releases',
      sub: 'Ensure all 4 release tranches match bank passbook entries',
    },
    {
      key: 'check_mb',
      label: 'Cross-verify reported 55% physical milestone with Measurement Book (MB)',
      sub: 'Check Junior Engineer signatures on MB-42, pages 14-22',
    },
    {
      key: 'check_coords',
      label: 'Complete on-site spatial coordinate verification',
      sub: 'Confirm asset sits within approved 50m tolerance perimeter',
    },
    {
      key: 'check_duplicate',
      label: 'Conduct duplicate comparison with adjacent candidate PRJ001',
      sub: 'Examine road chainage 0+000 to 2+000 for overlap',
    },
    {
      key: 'check_agency',
      label: 'Validate agency AG003 sub-contractor disclosures',
      sub: 'Verify work was not illegally sub-let to blacklisted entities',
    },
    {
      key: 'check_board',
      label: 'Inspect physical MPLADS public display signboard',
      sub: 'Confirm MP name, sanction amount, and completion date displayed',
    },
    {
      key: 'check_citizen',
      label: 'Review citizen reports and community grievances',
      sub: 'Address grievance token GRV-UP-VAR-2026-4192 regarding culvert width',
    },
  ];

  const total = checkItems.length;
  const completed = checkItems.filter((i) => checklist[i.key]).length;
  const pct = Math.round((completed / total) * 100);

  const handleToggle = (key) => {
    if (onToggleCheck) {
      onToggleCheck(key, !checklist[key]);
    }
  };

  return (
    <section className="panel verification-checklist-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">QUALITY ASSURANCE</span>
          <h3>{t('inv_checklist_title')}</h3>
        </div>

        <div className="checklist-counter-badge">
          <b>{completed} of {total}</b>
          <span>{t('inv_checklist_progress')} ({pct}%)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="checklist-progress-bar-container">
        <div
          className="checklist-progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="checklist-items-list">
        {checkItems.map((item) => {
          const isDone = !!checklist[item.key];
          return (
            <div
              key={item.key}
              className={`checklist-item-row ${isDone ? 'done' : ''}`}
              onClick={() => handleToggle(item.key)}
            >
              <button type="button" className="checkbox-btn">
                {isDone ? (
                  <CheckCircle2 size={17} className="text-brand" />
                ) : (
                  <Square size={17} className="text-muted" />
                )}
              </button>

              <div className="checklist-item-text">
                <b className={isDone ? 'line-through' : ''}>{item.label}</b>
                <small>{item.sub}</small>
              </div>

              <span className={`check-state-chip ${isDone ? 'state-done' : 'state-pending'}`}>
                {isDone ? 'Verified' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
