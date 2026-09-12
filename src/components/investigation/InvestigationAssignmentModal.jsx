import React, { useState } from 'react';
import { X, UserRound, Calendar, AlertCircle, Building, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function InvestigationAssignmentModal({
  project,
  existingAssignment,
  onClose,
  onSaveAssignment,
}) {
  const { t } = useLanguage();
  const [officer, setOfficer] = useState(existingAssignment?.officer || 'Rajesh Kumar');
  const [department, setDepartment] = useState(existingAssignment?.department || 'District Engineering Vigilance Cell');
  const [priority, setPriority] = useState(existingAssignment?.priority || 'high');
  const [dueDate, setDueDate] = useState(existingAssignment?.dueDate || '2026-09-18');
  const [instructions, setInstructions] = useState(
    existingAssignment?.instructions ||
    'Conduct on-site culvert and bitumen measurement. Reconcile with PRJ001 GIS boundary.'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveAssignment) {
      onSaveAssignment({
        officer,
        role: officer.includes('Auditor') ? 'District Auditor' : 'Field Officer',
        department,
        priority,
        dueDate,
        instructions,
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{t('inv_workspace_eyebrow')}</span>
            <h3>{t('inv_assign_modal_title')}</h3>
            <p className="sub-text">Case {project?.id} · {project?.name}</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label className="field-label">{t('inv_assign_officer_label')}</label>
            <select
              className="select wide"
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              required
            >
              <option value="Rajesh Kumar">Rajesh Kumar (Lead Field Officer)</option>
              <option value="Priya Sharma">Priya Sharma (District Auditor)</option>
              <option value="Amit Singh">Amit Singh (Technical Quality Inspector)</option>
              <option value="Vikas Mishra">Vikas Mishra (GIS & Survey Engineer)</option>
            </select>

            <label className="field-label">{t('inv_assign_dept_label')}</label>
            <select
              className="select wide"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="District Engineering Vigilance Cell">District Engineering Vigilance Cell</option>
              <option value="Rural Works Inspection Wing">Rural Works Inspection Wing</option>
              <option value="District Accounts & Audit Cell">District Accounts & Audit Cell</option>
              <option value="State Nodal Vigilance Directorate">State Nodal Vigilance Directorate</option>
            </select>

            <div className="form-row-2">
              <div>
                <label className="field-label">{t('inv_assign_priority_label')}</label>
                <select
                  className="select wide"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="critical">Immediate / Critical</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Standard / Normal</option>
                </select>
              </div>

              <div>
                <label className="field-label">{t('inv_assign_due_label')}</label>
                <input
                  type="date"
                  className="input-text wide"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <label className="field-label">{t('inv_assign_notes_label')}</label>
            <textarea
              className="note-box"
              rows={3}
              placeholder="Specify scope of inspection, documents to scrutinize, or deadlines..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-action"
              onClick={onClose}
            >
              {t('btn_cancel')}
            </button>
            <button
              type="submit"
              className="primary-action"
            >
              <CheckCircle2 size={15} />
              {t('inv_confirm_assignment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
