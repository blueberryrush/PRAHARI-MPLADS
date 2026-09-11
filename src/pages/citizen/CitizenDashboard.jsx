import { useMemo, useState, useRef } from 'react';
import { ArrowRight, LocateFixed, Search, ShieldCheck, Image, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projects, states } from '../../data/mockData';
import { agencies } from '../../data/mockData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCaseContext } from '../../contexts/CaseContext';
import SpeakerButton from '../../components/SpeakerButton';
import IndiaDrilldownMap from '../../components/IndiaDrilldownMap';

// Sector color classes for roster pins
const SECTOR_COLORS = {
  'Roads': 'amber',
  'Drinking': 'teal',
  'Education': 'blue',
  'Health': 'emerald',
  'Sanitation': 'purple',
  'Community': 'orange',
  'Electrification': 'yellow',
  'Irrigation': 'cyan',
  'Sports': 'pink',
  'Digital': 'indigo',
};

// ─── Grievance Modal ──────────────────────────────────────────────────────────
function GrievanceModal({ project, onClose, t, addComplaint }) {
  const [issueType, setIssueType] = useState('');
  const [observation, setObservation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [tokenId, setTokenId] = useState('');
  const fileRef = useRef(null);

  const agencyInfo = agencies.find(a => a.id === project.agency);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!issueType || !observation.trim()) return;
    const stateCodes = { 'Uttar Pradesh': 'UP', 'Maharashtra': 'MH', 'Bihar': 'BR', 'Madhya Pradesh': 'MP', 'Rajasthan': 'RJ', 'Tamil Nadu': 'TN', 'Karnataka': 'KA', 'Gujarat': 'GJ', 'West Bengal': 'WB', 'Odisha': 'OD' };
    const stateCode = stateCodes[project.state] || 'IN';
    const districtCode = (project.district || 'GEN').slice(0, 3).toUpperCase();

    const token = addComplaint({
      projectId: project.id,
      projectName: project.name,
      district: project.district,
      state: project.state,
      stateCode,
      districtCode,
      issueType,
      observation,
      isAnonymous,
      hasPhoto: !!photoFile,
      photoPreview: photoPreview ? photoPreview.slice(0, 100) : null, // just a ref
    });
    setTokenId(token);
    setSubmitted(true);
  };

  const canSubmit = issueType && observation.trim().length >= 10;

  return (
    <div className="grievance-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="grievance-modal">
        <div className="grievance-modal-header">
          <div>
            <span className="eyebrow">{t('grievance_eyebrow')}</span>
            <h3>{t('grievance_title_prefix')} {project.id}</h3>
            <p>{t('grievance_disclaimer')}</p>
          </div>
          <button className="grievance-close" onClick={onClose} aria-label={t('btn_close')}><X size={18} /></button>
        </div>

        {submitted ? (
          <div className="grievance-success">
            <CheckCircle2 size={36} style={{ color: '#059669' }} />
            <b>{t('grievance_success_title')}</b>
            <p>{t('grievance_success_body_prefix')}</p>
            <code className="token-badge">{tokenId}</code>
            <p style={{ marginTop: 10, fontSize: 12, color: '#a8a29e' }}>
              {t('grievance_ai_check')}
            </p>
          </div>
        ) : (
          <>
            {/* Project context */}
            <div className="grievance-project-context">
              <span className="eyebrow" style={{ fontSize: 11, color: '#78716c' }}>
                {t('grievance_project_label')}: <b style={{ color: '#e7e5e4' }}>{project.name}</b>
                &nbsp;·&nbsp;{t('grievance_sector_label')}: <b style={{ color: '#e7e5e4' }}>{project.sector}</b>
              </span>
            </div>

            {/* Issue Type */}
            <label className="field-label">{t('grievance_issue_label')} *</label>
            <select
              className="grievance-select"
              value={issueType}
              onChange={e => setIssueType(e.target.value)}
            >
              <option value="">— {t('grievance_issue_label')} —</option>
              <option value="ghost">{t('grievance_issue_ghost')}</option>
              <option value="substandard">{t('grievance_issue_substandard')}</option>
              <option value="nonoperational">{t('grievance_issue_nonoperational')}</option>
              <option value="other">{t('grievance_issue_other')}</option>
            </select>

            {/* Observation */}
            <label className="field-label" style={{ marginTop: 14 }}>
              {t('grievance_observation_label')} *
            </label>
            <textarea
              className="note-box"
              value={observation}
              onChange={e => setObservation(e.target.value)}
              placeholder={t('grievance_observation_placeholder')}
              rows={4}
            />

            {/* Photo Upload */}
            <label className="field-label" style={{ marginTop: 14 }}>{t('grievance_photo_label')}</label>
            <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
              {photoPreview ? (
                <div className="photo-preview-wrap">
                  <img src={photoPreview} alt="Site evidence preview" className="photo-preview" />
                  <button
                    className="photo-remove"
                    onClick={e => { e.stopPropagation(); setPhotoPreview(null); setPhotoFile(null); }}
                    aria-label="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="photo-placeholder">
                  <Image size={22} style={{ color: '#78716c' }} />
                  <span>{t('grievance_photo_hint')}</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </div>

            {/* Anonymous Toggle */}
            <label className="anonymous-toggle">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
              />
              <span className="toggle-text">
                <b>{t('grievance_anonymous_label')}</b>
                <small>{t('grievance_anonymous_note')}</small>
              </span>
            </label>

            {/* Legal notice */}
            <div className="grievance-disclaimer" style={{ marginTop: 14 }}>
              {t('grievance_legal_notice')}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="secondary-action" onClick={onClose}>{t('grievance_cancel')}</button>
              <button
                className="primary-action"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {t('grievance_submit')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addComplaint } = useCaseContext();

  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [grievanceOpen, setGrievanceOpen] = useState(false);

  const filtered = useMemo(() =>
    projects.filter(p =>
      (!state || p.state === state) &&
      (!search || `${p.name} ${p.district} ${p.constituency}`.toLowerCase().includes(search.toLowerCase()))
    ),
    [search, state]
  );

  const constituencyProjects = useMemo(() =>
    selectedDistrict
      ? projects.filter(p => p.district?.toLowerCase() === selectedDistrict.toLowerCase())
      : [],
    [selectedDistrict]
  );

  const getAgencyName = (agencyId) => {
    const a = agencies.find(ag => ag.id === agencyId);
    return a ? a.name.split(' - ')[0] : agencyId;
  };

  const getSectorColor = (sector) => {
    const key = Object.keys(SECTOR_COLORS).find(k => sector.includes(k));
    return SECTOR_COLORS[key] || 'neutral';
  };

  return (
    <div className="page-content citizen-page">
      {/* ── Welcome ── */}
      <div className="citizen-welcome">
        <div>
          <span className="eyebrow">{t('citizen_eyebrow')}</span>
          <h2>{t('citizen_title')}</h2>
          <p>{t('citizen_subtitle')}</p>
        </div>
        <SpeakerButton text={`${t('citizen_title')} ${t('citizen_subtitle')}`} />
      </div>

      {/* ── Search Bar ── */}
      <div className="citizen-searchbar">
        <Search size={18} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('citizen_search')}
        />
        <select value={state} onChange={e => setState(e.target.value)}>
          <option value="">{t('citizen_all_india')}</option>
          {states.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="near-btn">
          <LocateFixed size={16} /> {t('citizen_near_me')}
        </button>
      </div>

      {/* ── India Map ── */}
      <div className="citizen-map panel">
        <IndiaDrilldownMap
          projects={filtered}
          selectedState={state}
          onStateChange={setState}
          onDistrictSelect={setSelectedDistrict}
        />
      </div>

      {/* ── Constituency Roster (after district click) ── */}
      {selectedDistrict && constituencyProjects.length > 0 && (
        <div className="constituency-roster">
          <div className="roster-header">
            <span className="eyebrow">{t('citizen_constituency_eyebrow')}</span>
            <h3>{t('citizen_constituency_prefix')} {selectedDistrict}</h3>
            <p>
              {constituencyProjects.length} {t('citizen_constituency_body_suffix')}
            </p>
          </div>
          <div className="roster-grid">
            {constituencyProjects.map(p => (
              <button
                key={p.id}
                className="roster-card"
                onClick={() => { setSelectedProject(p); setGrievanceOpen(false); }}
              >
                <div
                  className={`roster-sector-dot ${getSectorColor(p.sector)}`}
                  title={p.sector}
                />
                <div className="roster-card-body">
                  <span className="roster-id">{p.id} · {p.sector}</span>
                  <strong>{p.name}</strong>
                  <div className="roster-meta">
                    <span>₹{(p.sanctionedAmount / 100000).toFixed(1)}L {t('citizen_sanctioned_amount').toLowerCase()}</span>
                    <span className={`roster-status ${p.status}`}>
                      {p.status === 'completed' ? t('citizen_completed') :
                       p.status === 'in_progress' ? t('citizen_in_progress') :
                       p.status === 'delayed' ? t('citizen_delayed') :
                       t('citizen_under_review')}
                    </span>
                  </div>
                  <div className="roster-progress-bar">
                    <i style={{ width: `${p.physicalProgress}%` }} />
                  </div>
                  <span className="roster-progress-text">{p.physicalProgress}% {t('common_physical').toLowerCase()} {t('common_progress').toLowerCase()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Project Detail Drawer ── */}
      {selectedProject && (
        <div className="project-preview-card">
          <div className="preview-header">
            <div>
              <span className="eyebrow">{t('project_detail_eyebrow')} · {selectedProject.id}</span>
              <h3>{selectedProject.name}</h3>
            </div>
            <button className="preview-close" onClick={() => setSelectedProject(null)} aria-label={t('btn_close')}>
              <X size={18} />
            </button>
          </div>
          <div className="preview-facts">
            <div>
              <span>{t('project_sanction_amount')}</span>
              <b>₹{(selectedProject.sanctionedAmount / 100000).toFixed(1)}L</b>
            </div>
            <div>
              <span>{t('project_mp_constituency')}</span>
              <b>{selectedProject.constituency}</b>
            </div>
            <div>
              <span>{t('project_physical_progress')}</span>
              <b>{selectedProject.physicalProgress}%</b>
            </div>
            <div>
              <span>{t('project_geotagged_proofs')}</span>
              <b>{selectedProject.status === 'completed' ? t('project_available') : t('project_pending')}</b>
            </div>
            <div>
              <span>{t('project_status')}</span>
              <b>{selectedProject.status.replace('_', ' ')}</b>
            </div>
            <div>
              <span>{t('project_contractor')}</span>
              <b>{getAgencyName(selectedProject.agency)}</b>
            </div>
          </div>
          <div className="preview-actions">
            <button
              className="primary-action"
              onClick={() => { setGrievanceOpen(true); }}
            >
              {t('citizen_raise_grievance')}
            </button>
          </div>
        </div>
      )}

      {/* ── Overview Stats ── */}
      <div className="citizen-overview">
        <div className="public-stat">
          <span>{t('citizen_works_found')}</span>
          <b>{filtered.length}</b>
          <small>{t('citizen_works_found_sub')}</small>
        </div>
        <div className="public-stat">
          <span>{t('citizen_completed_stat')}</span>
          <b>{filtered.filter(p => p.status === 'completed').length}</b>
          <small>{t('citizen_completed_stat_sub')}</small>
        </div>
        <div className="public-stat">
          <span>{t('citizen_ongoing_stat')}</span>
          <b>{filtered.filter(p => p.status === 'in_progress').length}</b>
          <small>{t('citizen_ongoing_stat_sub')}</small>
        </div>
        <div className="public-stat">
          <span>{t('citizen_evidence_stat')}</span>
          <b>72%</b>
          <small>{t('citizen_evidence_stat_sub')}</small>
        </div>
      </div>

      {/* ── Journey + Observation ── */}
      <div className="citizen-cards">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">{t('citizen_journey_eyebrow')}</span>
              <h3>{t('citizen_journey_title')}</h3>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="journey">
            <span className="done">{t('citizen_journey_recommended')}</span>
            <i>→</i>
            <span className="done">{t('citizen_journey_sanctioned')}</span>
            <i>→</i>
            <span className="done">{t('citizen_journey_started')}</span>
            <i>→</i>
            <span>{t('citizen_journey_progress')}</span>
            <i>→</i>
            <span>{t('citizen_journey_completed')}</span>
            <i>→</i>
            <span>{t('citizen_journey_verified')}</span>
          </div>
        </section>

        <section className="panel observation-card">
          <div>
            <span className="eyebrow">{t('citizen_observation_eyebrow')}</span>
            <h3>{t('citizen_observation_title')}</h3>
            <p>{t('citizen_observation_body')}</p>
          </div>
          <button className="primary-action" onClick={() => navigate('/citizen/projects')}>
            {t('citizen_report_btn')} <ArrowRight size={15} />
          </button>
        </section>
      </div>

      {/* ── Grievance Modal ── */}
      {grievanceOpen && selectedProject && (
        <GrievanceModal
          project={selectedProject}
          onClose={() => setGrievanceOpen(false)}
          t={t}
          addComplaint={addComplaint}
        />
      )}
    </div>
  );
}
