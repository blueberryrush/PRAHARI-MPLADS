import React, { useState } from 'react';
import {
  X,
  CopyCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { projects } from '../../data/mockData';

export default function DuplicateComparisonModal({
  currentProject,
  candidateProject,
  existingDecision,
  onClose,
  onRecordDecision,
}) {
  const { t } = useLanguage();
  const [decisionNotes, setDecisionNotes] = useState('');
  const [selectedDecision, setSelectedDecision] = useState(existingDecision || null);

  const pA = currentProject || {};
  const pB = candidateProject || projects.find((p) => p.id === 'PRJ001') || projects[0] || {};

  const handleAction = (decisionKey) => {
    setSelectedDecision(decisionKey);
    if (onRecordDecision && pA.id && pB.id) {
      onRecordDecision(pA.id, pB.id, decisionKey, decisionNotes);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window extra-wide" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <span className="eyebrow">{t('signal_spatial_name')}</span>
            <h3>{t('inv_dup_modal_title')}</h3>
            <p className="sub-text">{t('inv_dup_modal_sub')}</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Similarity Metrics Bar */}
          <div className="similarity-metrics-bar">
            <span className="metrics-title">{t('inv_similarity_metrics')}:</span>
            <div className="metric-tag">
              <span>{t('inv_sim_location')}</span>
              <b className="text-danger">94% (180m)</b>
            </div>
            <div className="metric-tag">
              <span>{t('inv_sim_description')}</span>
              <b className="text-danger">91% match</b>
            </div>
            <div className="metric-tag">
              <span>{t('inv_sim_agency')}</span>
              <b className="text-amber">Different ({pA.agency} vs {pB.agency})</b>
            </div>
            <div className="metric-tag">
              <span>{t('inv_sim_work_type')}</span>
              <b className="text-danger">100% Identical</b>
            </div>
            <div className="metric-tag">
              <span>{t('inv_sim_timeline')}</span>
              <b className="text-brand">85% Overlap</b>
            </div>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="comparison-columns-grid">
            {/* Column 1: Current Case */}
            <div className="comparison-col current-case-col">
              <div className="col-badge current">
                <span>{t('inv_current_case')}</span>
                <b>{pA.id}</b>
              </div>

              <h4 className="col-project-title">{pA.name}</h4>

              <div className="attr-list">
                <div className="attr-row">
                  <span className="attr-name">Sector</span>
                  <span className="attr-value">{pA?.sector || 'Infrastructure'}</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Location</span>
                  <span className="attr-value">{pA?.district}, {pA?.state}</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Coordinates</span>
                  <span className="attr-value">
                    {pA?.latitude || 25.3176}° N, {pA?.longitude || 82.9739}° E
                  </span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Sanction Amount</span>
                  <span className="attr-value">₹{((pA?.sanctionedAmount || 0) / 100000).toFixed(1)} Lakh</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Reported Spend</span>
                  <span className="attr-value text-danger">₹{((pA?.spentAmount || 0) / 100000).toFixed(1)} Lakh</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Physical Progress</span>
                  <span className="attr-value">{pA?.physicalProgress || 0}%</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Implementing Agency</span>
                  <span className="attr-value"><b>{pA?.agency || 'N/A'}</b></span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Sanction Date</span>
                  <span className="attr-value">{pA?.sanctionDate || '2024-01-01'}</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Work Scope</span>
                  <span className="attr-value">{pA?.description || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Candidate Project */}
            <div className="comparison-col candidate-case-col">
              <div className="col-badge candidate">
                <span>{t('inv_candidate_match')}</span>
                <b>{pB?.id}</b>
              </div>

              <h4 className="col-project-title">{pB?.name}</h4>

              <div className="attr-list">
                <div className="attr-row">
                  <span className="attr-name">Sector</span>
                  <span className="attr-value">{pB?.sector || 'Infrastructure'}</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Location</span>
                  <span className="attr-value">{pB?.district}, {pB?.state}</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Coordinates</span>
                  <span className="attr-value">
                    {pB?.latitude || 25.3188}° N, {pB?.longitude || 82.9749}° E
                  </span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Sanction Amount</span>
                  <span className="attr-value">₹{((pB?.sanctionedAmount || 0) / 100000).toFixed(1)} Lakh</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Reported Spend</span>
                  <span className="attr-value">₹{((pB?.spentAmount || 0) / 100000).toFixed(1)} Lakh</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Physical Progress</span>
                  <span className="attr-value text-brand">{pB?.physicalProgress || 0}%</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Implementing Agency</span>
                  <span className="attr-value"><b>{pB?.agency || 'N/A'}</b></span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Sanction Date</span>
                  <span className="attr-value">{pB.sanctionDate}</span>
                </div>
                <div className="attr-row">
                  <span className="attr-name">Work Scope</span>
                  <span className="attr-value">{pB.description}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Adjudication Notes */}
          <div className="decision-notes-section">
            <label className="field-label">Investigator Adjudication Rationale / Notes</label>
            <textarea
              className="note-box"
              rows={2}
              placeholder="Record rationale for duplicate determination, field observations, or boundary survey notes..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
            />
          </div>

          {/* Current Decision Status if set */}
          {selectedDecision && (
            <div className="current-decision-banner">
              <CheckCircle2 size={16} />
              <span>
                {t('inv_decision_recorded')}: <b>{selectedDecision.replace('_', ' ').toUpperCase()}</b>
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer with Decision Buttons */}
        <div className="modal-footer duplicate-footer">
          <div className="decision-buttons">
            <button
              type="button"
              className={`btn-decision btn-not-duplicate ${selectedDecision === 'not_duplicate' ? 'active' : ''}`}
              onClick={() => handleAction('not_duplicate')}
            >
              <CheckCircle2 size={15} />
              {t('inv_decision_not_duplicate')}
            </button>

            <button
              type="button"
              className={`btn-decision btn-potential-dup ${selectedDecision === 'potential_duplicate' ? 'active' : ''}`}
              onClick={() => handleAction('potential_duplicate')}
            >
              <AlertTriangle size={15} />
              {t('inv_decision_potential_dup')}
            </button>

            <button
              type="button"
              className={`btn-decision btn-need-evidence ${selectedDecision === 'need_evidence' ? 'active' : ''}`}
              onClick={() => handleAction('need_evidence')}
            >
              <HelpCircle size={15} />
              {t('inv_decision_need_evidence')}
            </button>
          </div>

          <button type="button" className="secondary-action" onClick={onClose}>
            {t('btn_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
