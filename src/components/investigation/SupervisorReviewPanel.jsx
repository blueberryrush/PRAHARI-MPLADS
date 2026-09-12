import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Send,
  UserCheck,
  FileCheck,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SupervisorReviewPanel({
  project,
  caseData,
  onSubmitAssessment,
  onSubmitSupervisorReview,
}) {
  const { t } = useLanguage();
  const [outcome, setOutcome] = useState(caseData?.investigatorFinding || '');
  const [findingsNote, setFindingsNote] = useState(caseData?.investigatorNote || '');
  const [isAssessmentSubmitted, setIsAssessmentSubmitted] = useState(
    caseData?.status === 'Under Review' ||
    caseData?.status === 'Resolved' ||
    caseData?.status === 'Escalated to State Vigilance'
  );

  // Supervisor actions state
  const [supervisorNote, setSupervisorNote] = useState('');

  const handleAssessmentSubmit = (e) => {
    e.preventDefault();
    if (!outcome) return;
    setIsAssessmentSubmitted(true);
    if (onSubmitAssessment) {
      onSubmitAssessment(outcome, findingsNote);
    }
  };

  const handleSupervisorAction = (actionKey, actionText) => {
    if (onSubmitSupervisorReview) {
      onSubmitSupervisorReview({
        action: actionKey,
        actionText,
        notes: supervisorNote,
      });
    }
  };

  return (
    <section className="panel supervisor-review-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('inv_review_attributable')}</span>
          <h3>{t('inv_supervisor_review_title')}</h3>
        </div>
        <span className="stage-flow-indicator">
          Stage 1: Investigator → Stage 2: Authority
        </span>
      </div>

      <div className="stages-container">
        {/* Stage 1: Investigator Assessment */}
        <div className={`stage-card ${isAssessmentSubmitted ? 'stage-completed' : 'stage-active'}`}>
          <div className="stage-card-head">
            <div className="stage-title-wrap">
              <span className="stage-pill">Stage 1</span>
              <h4>{t('inv_supervisor_stage1_title')}</h4>
            </div>
            {isAssessmentSubmitted && (
              <span className="status-submitted-chip">
                <CheckCircle2 size={13} /> Submitted for Authority Review
              </span>
            )}
          </div>

          <form onSubmit={handleAssessmentSubmit}>
            <label className="field-label">{t('inv_assessment_label')}</label>
            <select
              className="select wide"
              value={outcome}
              disabled={isAssessmentSubmitted}
              onChange={(e) => setOutcome(e.target.value)}
              required
            >
              <option value="">{t('inv_select_outcome')}</option>
              <option value="Verified / Legitimate">{t('inv_outcome_verified')}</option>
              <option value="Issue Found / Corrective Action">{t('inv_outcome_corrective')}</option>
              <option value="Insufficient Evidence">{t('inv_outcome_insufficient')}</option>
              <option value="Escalate to Vigilance">{t('inv_outcome_escalated')}</option>
            </select>

            <label className="field-label">{t('inv_note_label')}</label>
            <textarea
              className="note-box"
              rows={3}
              disabled={isAssessmentSubmitted}
              placeholder={t('inv_note_placeholder_full')}
              value={findingsNote}
              onChange={(e) => setFindingsNote(e.target.value)}
              required
            />

            {!isAssessmentSubmitted ? (
              <div className="stage-actions-row">
                <button
                  type="submit"
                  className="primary-action btn-submit-assessment"
                  disabled={!outcome}
                >
                  <Send size={14} />
                  Submit Finding to Supervisor
                </button>
              </div>
            ) : (
              <div className="submitted-summary">
                <b>Submitted Finding:</b> <span>{outcome}</span>
                <p>"{findingsNote || 'Evidence review completed without reservations.'}"</p>
              </div>
            )}
          </form>
        </div>

        {/* Stage 2: Supervisor Review & Adjudication */}
        <div className={`stage-card ${isAssessmentSubmitted ? 'stage-active' : 'stage-locked'}`}>
          <div className="stage-card-head">
            <div className="stage-title-wrap">
              <span className="stage-pill">Stage 2</span>
              <h4>{t('inv_supervisor_stage2_title')}</h4>
            </div>
            {caseData?.supervisorReview && (
              <span className="status-adjudicated-chip">
                <UserCheck size={13} /> Adjudicated by Authority
              </span>
            )}
          </div>

          {!isAssessmentSubmitted ? (
            <div className="stage-locked-message">
              <span>Complete and submit Stage 1 Investigator Findings to unlock authority disposition.</span>
            </div>
          ) : (
            <div className="supervisor-actions-body">
              <label className="field-label">Authority Sign-Off & Disposition Directives</label>
              <textarea
                className="note-box"
                rows={2}
                placeholder="Enter official directives, recovery instructions, or conditions for case closure..."
                value={supervisorNote}
                onChange={(e) => setSupervisorNote(e.target.value)}
              />

              <div className="supervisor-action-buttons-grid">
                <button
                  type="button"
                  className="supervisor-btn approve-btn"
                  onClick={() => handleSupervisorAction('approve_close', t('inv_btn_approve_close'))}
                >
                  <CheckCircle2 size={15} />
                  {t('inv_btn_approve_close')}
                </button>

                <button
                  type="button"
                  className="supervisor-btn request-btn"
                  onClick={() => handleSupervisorAction('request_evidence', t('inv_btn_request_evidence'))}
                >
                  <HelpCircle size={15} />
                  {t('inv_btn_request_evidence')}
                </button>

                <button
                  type="button"
                  className="supervisor-btn return-btn"
                  onClick={() => handleSupervisorAction('return_investigation', t('inv_btn_return_reinvestigate'))}
                >
                  <RotateCcw size={15} />
                  {t('inv_btn_return_reinvestigate')}
                </button>

                <button
                  type="button"
                  className="supervisor-btn escalate-btn"
                  onClick={() => handleSupervisorAction('escalate', t('inv_btn_escalate_vigilance'))}
                >
                  <ShieldAlert size={15} />
                  {t('inv_btn_escalate_vigilance')}
                </button>
              </div>

              {caseData?.supervisorReview && (
                <div className="supervisor-stamp-box">
                  <UserCheck size={16} className="text-brand" />
                  <div>
                    <b>Official Action Taken: {caseData.supervisorReview.actionText}</b>
                    <small>
                      Signed by: {caseData.supervisorReview.reviewer} ({caseData.supervisorReview.role}) ·{' '}
                      {new Date(caseData.supervisorReview.reviewedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
