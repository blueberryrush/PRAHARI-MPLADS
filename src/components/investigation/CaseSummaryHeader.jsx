import React from 'react';
import { MapPin, UserRound, Calendar, AlertCircle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function getDueDateStatus(dueDateStr) {
  if (!dueDateStr) return { labelKey: 'inv_on_track', cls: 'on-track', text: 'On track' };
  const target = new Date(dueDateStr);
  const now = new Date();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { labelKey: 'inv_overdue', cls: 'overdue', text: 'Overdue' };
  if (diffDays <= 3) return { labelKey: 'inv_due_soon', cls: 'due-soon', text: 'Due soon' };
  return { labelKey: 'inv_on_track', cls: 'on-track', text: 'On track' };
}

export default function CaseSummaryHeader({
  project,
  risk,
  caseData,
  onOpenAssign,
}) {
  const { t } = useLanguage();
  const p = project;
  const assignment = caseData?.assignment;
  const status = caseData?.status || 'Detected';
  const dueDate = assignment?.dueDate || '2026-09-18';
  const dueStatus = getDueDateStatus(dueDate);

  const formattedSanctioned = ((p?.sanctionedAmount || 0) / 100000).toFixed(1);
  const formattedSpent = ((p?.spentAmount || 0) / 100000).toFixed(1);

  return (
    <div className="panel compact-case-summary">
      {/* Top Banner: Project Title, ID, Location, and Core Status */}
      <div className="summary-main-row">
        <div className="summary-ident">
          <div className="summary-chips">
            <span className="case-id-badge">
              {t('inv_case')} {p.id}
            </span>
            <span className={`case-status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
              {status === 'UNDER_FIELD_INVESTIGATION' ? 'Field Verification Dispatched' : status}
            </span>
            <span className={`case-priority-badge priority-${risk.level}`}>
              {risk.level === 'critical' || risk.level === 'high'
                ? t('risk_high_priority')
                : t('risk_requires_verification')}
            </span>
          </div>

          <h2 className="summary-title">{p.name}</h2>

          <div className="summary-location">
            <MapPin size={13} />
            <span>
              {p.district}, {p.state} {p.constituency ? `· ${p.constituency}` : ''}
            </span>
            <span className="separator">·</span>
            <span className="agency-sub">
              {t('type_agency')}: <b>{p.agency}</b>
            </span>
          </div>
        </div>

        {/* Investigator & Due Date Card */}
        <div className="summary-assignment-card">
          <div className="assignment-info">
            <div className="assignment-officer-row">
              <UserRound size={14} className="officer-icon" />
              <div>
                <span className="sub-label">{t('inv_assigned_investigator')}</span>
                <b className="officer-name">
                  {caseData?.assignedOfficer || assignment?.officer || t('inv_unassigned')}
                </b>
                <small className="dept-tag">
                  {assignment?.department || 'District Engineering Vigilance Cell'}
                </small>
              </div>
            </div>

            <button
              type="button"
              className="quick-assign-btn"
              onClick={onOpenAssign}
            >
              {assignment ? t('inv_btn_assigned') : t('inv_quick_assign')}
            </button>
          </div>

          <div className="due-date-row">
            <div className="due-date-left">
              <Calendar size={13} />
              <span>
                {t('inv_due_date')}: <b>{dueDate}</b>
              </span>
            </div>
            <span className={`due-status-pill ${dueStatus.cls}`}>
              <span className="status-dot" />
              {t(dueStatus.labelKey)}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Strip (Sanctioned, Physical, Financial, Priority, Status) */}
      <div className="summary-metrics-strip">
        <div className="metric-cell">
          <span className="metric-label">{t('inv_sanctioned')}</span>
          <b className="metric-val">₹{formattedSanctioned} L</b>
          <small className="metric-hint">{p.sector}</small>
        </div>

        <div className="metric-cell">
          <span className="metric-label">{t('inv_financial_prog')}</span>
          <b className={`metric-val ${p.financialProgress > 100 ? 'text-danger' : ''}`}>
            {p.financialProgress}% <small>(₹{formattedSpent} L)</small>
          </b>
          <small className="metric-hint">PFMS Released</small>
        </div>

        <div className="metric-cell">
          <span className="metric-label">{t('inv_physical_prog')}</span>
          <b className="metric-val">{p.physicalProgress}%</b>
          <small className="metric-hint">Reported DPR</small>
        </div>

        <div className="metric-cell">
          <span className="metric-label">{t('inv_review_priority')}</span>
          <b className={`metric-val ${risk.level === 'critical' || risk.level === 'high' ? 'text-danger' : 'text-amber'}`}>
            {risk.score}/100 · {risk.level.toUpperCase()}
          </b>
          <small className="metric-hint">Analytical Model</small>
        </div>

        <div className="metric-cell">
          <span className="metric-label">{t('inv_case_status')}</span>
          <b className="metric-val status-text">{status === 'UNDER_FIELD_INVESTIGATION' ? 'Field Verification Dispatched' : status}</b>
          <small className="metric-hint">Workflow State</small>
        </div>
      </div>
    </div>
  );
}
