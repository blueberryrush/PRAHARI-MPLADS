import React, { useState } from 'react';
import {
  FolderLock,
  FileText,
  Camera,
  MapPin,
  CreditCard,
  ClipboardList,
  Users,
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function EvidenceLocker({
  caseData,
  onAddEvidence,
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal form state
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceCategory, setEvidenceCategory] = useState('project_records');
  const [evidenceNotes, setEvidenceNotes] = useState('');

  const evidenceList = caseData?.evidenceItems || [];

  const categories = [
    { key: 'all', label: 'All Evidence', icon: FolderLock },
    { key: 'project_records', label: 'Project Records', icon: FileText },
    { key: 'financial_data', label: 'Financial Data', icon: CreditCard },
    { key: 'site_images', label: 'Site Images', icon: Camera },
    { key: 'citizen_observations', label: 'Citizen Observations', icon: Users },
  ];

  const normalizeCategory = (cat) => {
    if (!cat) return 'project_records';
    if (cat === 'documents' || cat === 'project_records' || cat === 'gps') return 'project_records';
    if (cat === 'payments' || cat === 'financial_data' || cat === 'financial') return 'financial_data';
    if (cat === 'field_photos' || cat === 'site_images' || cat === 'photos') return 'site_images';
    if (cat === 'citizen' || cat === 'citizen_observations' || cat === 'observations') return 'citizen_observations';
    return 'project_records';
  };

  const filteredEvidence = activeTab === 'all'
    ? evidenceList
    : evidenceList.filter((e) => normalizeCategory(e.category) === activeTab);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!evidenceTitle) return;
    if (onAddEvidence) {
      onAddEvidence({
        title: evidenceTitle,
        category: evidenceCategory,
        notes: evidenceNotes,
      });
    }
    setEvidenceTitle('');
    setEvidenceNotes('');
    setShowUploadModal(false);
  };

  const getStatusBadge = (status) => {
    if (status === 'verified') {
      return (
        <span className="ev-badge status-verified">
          <CheckCircle2 size={12} /> {t('inv_status_verified')}
        </span>
      );
    }
    if (status === 'needs_review') {
      return (
        <span className="ev-badge status-review">
          <AlertCircle size={12} /> {t('inv_status_needs_review')}
        </span>
      );
    }
    return (
      <span className="ev-badge status-unverified">
        <Clock size={12} /> {t('inv_status_unverified')}
      </span>
    );
  };

  return (
    <section className="panel evidence-locker-panel">
      {/* Panel Header */}
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('inv_evidence_eyebrow')}</span>
          <h3>{t('inv_evidence_locker_title')}</h3>
        </div>

        <button
          type="button"
          className="primary-action btn-add-evidence"
          onClick={() => setShowUploadModal(true)}
        >
          <Plus size={14} />
          <span>{t('inv_upload_evidence')}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="locker-tabs-bar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const count = cat.key === 'all'
            ? evidenceList.length
            : evidenceList.filter((e) => e.category === cat.key).length;

          return (
            <button
              key={cat.key}
              type="button"
              className={`locker-tab ${activeTab === cat.key ? 'active' : ''}`}
              onClick={() => setActiveTab(cat.key)}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Evidence Items List */}
      <div className="evidence-items-grid">
        {filteredEvidence.length === 0 ? (
          <div className="empty-locker-state">
            <FolderLock size={28} className="text-muted" />
            <p>No evidence items cataloged in this category yet.</p>
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowUploadModal(true)}
            >
              + Upload first item
            </button>
          </div>
        ) : (
          filteredEvidence.map((item) => (
            <div key={item.id} className="evidence-item-card">
              <div className="ev-card-top">
                <span className="ev-category-tag">{item.category.replace('_', ' ')}</span>
                {getStatusBadge(item.status)}
              </div>

              <h4 className="ev-title">{item.title}</h4>

              <div className="ev-meta">
                <span><b>Uploaded:</b> {item.uploadedAt}</span>
                <span><b>By:</b> {item.uploadedBy}</span>
                {item.size && <span><b>Size:</b> {item.size}</span>}
              </div>

              <div className="ev-actions">
                <button type="button" className="btn-ev-action">
                  <Eye size={13} /> View
                </button>
                <button type="button" className="btn-ev-action">
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">CASE DOCKET</span>
                <h3>{t('inv_upload_modal_title')}</h3>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <label className="field-label">{t('inv_file_title_label')}</label>
                <input
                  type="text"
                  className="input-text wide"
                  placeholder="e.g., Measurement Book MB-42 Verified Page 18"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  required
                />

                <label className="field-label">{t('inv_category_label')}</label>
                <select
                  className="select wide"
                  value={evidenceCategory}
                  onChange={(e) => setEvidenceCategory(e.target.value)}
                >
                  <option value="project_records">Project Records (DPR, Sanction Order, Work Order)</option>
                  <option value="financial_data">Financial Data (PFMS Vouchers, MB-42, UCs)</option>
                  <option value="site_images">Site Images (Drone / Satellite / Geo-tagged Photos)</option>
                  <option value="citizen_observations">Citizen Observations (Public Field Reports, Grievances)</option>
                </select>

                <label className="field-label">Remarks / Findings from this Document</label>
                <textarea
                  className="note-box"
                  rows={3}
                  placeholder="Summarize what this evidence proves, discrepancies observed, or official sign-offs..."
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setShowUploadModal(false)}
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="primary-action"
                  disabled={!evidenceTitle}
                >
                  {t('btn_submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
