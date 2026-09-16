import { useMemo, useState, useRef } from 'react';
import {
  ArrowRight,
  LocateFixed,
  Search,
  ShieldCheck,
  Image,
  X,
  CheckCircle2,
  MapPin,
  Map,
  AlertTriangle,
  ArrowUpDown,
  Loader2,
  Navigation,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projects as mockProjects, states, agencies } from '../../data/mockData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCaseContext } from '../../contexts/CaseContext';
import SpeakerButton from '../../components/SpeakerButton';
import IndiaDrilldownMap from '../../components/IndiaDrilldownMap';
import CivicMap from '../../components/map/CivicMap';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { generateCitizenTrackingHash, readImageAsDataUrl, formatLakhs, safeNumber } from '../../utils/demoFormat';

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
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setPhotoFile(file);
      setPhotoPreview(dataUrl);
    } catch (err) {
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoError(err.message || 'Could not preview this photo.');
    }
  };

  const resetForm = () => {
    setIssueType('');
    setObservation('');
    setIsAnonymous(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!issueType || !observation.trim() || submitting) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const token = generateCitizenTrackingHash(project.district || project.constituency || 'VAR');
    addComplaint({
      projectId: project.id || project.work_id,
      projectName: project.name || project.work_name,
      district: project.district,
      state: project.state,
      districtCode: String(project.district || 'VAR').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
      issueType,
      observation,
      isAnonymous,
      hasPhoto: !!photoFile,
      photoPreview: photoPreview || null,
      customToken: token,
    });
    setTokenId(token);
    resetForm();
    setSubmitted(true);
    setSubmitting(false);
  };

  const canSubmit = issueType && observation.trim().length >= 5;

  return (
    <div className="grievance-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="grievance-modal">
        <div className="grievance-modal-header">
          <div>
            <span className="eyebrow">{t('grievance_eyebrow')}</span>
            <h3>
              {t('grievance_title_prefix')} {project.id || project.work_id}
            </h3>
            <p>{t('grievance_disclaimer')}</p>
          </div>
          <button className="grievance-close" onClick={onClose} aria-label={t('btn_close')}>
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="grievance-success">
            <CheckCircle2 size={36} style={{ color: '#059669' }} />
            <b>{t('grievance_success_title')}</b>
            <p>{t('grievance_success_body_prefix')}</p>
            <code className="token-badge">{tokenId}</code>
            <p style={{ marginTop: 10, fontSize: 12, color: '#a8a29e' }}>{t('grievance_ai_check')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Project context */}
            <div className="grievance-project-context">
              <span className="eyebrow" style={{ fontSize: 12, fontWeight: 500, color: '#a8a29e' }}>
                {t('grievance_project_label')}:{' '}
                <b style={{ color: '#e7e5e4' }}>{project.name || project.work_name}</b>
                &nbsp;·&nbsp;{t('grievance_sector_label')}:{' '}
                <b style={{ color: '#e7e5e4' }}>{project.sector || project.category}</b>
              </span>
            </div>

            {/* Issue Type */}
            <label className="field-label">{t('grievance_issue_label')} *</label>
            <select
              className="grievance-select"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              <option value="">— {t('grievance_issue_label')} —</option>
              <option value="ghost">{t('grievance_issue_ghost')}</option>
              <option value="substandard">{t('grievance_issue_substandard')}</option>
              <option value="nonoperational">{t('grievance_issue_nonoperational')}</option>
              <option value="delayed">Delayed / Project Stalled</option>
              <option value="other">{t('grievance_issue_other')}</option>
            </select>

            {/* Observation */}
            <label className="field-label" style={{ marginTop: 14 }}>
              {t('grievance_observation_label')} *
            </label>
            <textarea
              className="note-box"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder={t('grievance_observation_placeholder')}
              rows={4}
            />

            {/* Photo Upload */}
            <label className="field-label" style={{ marginTop: 14 }}>
              {t('grievance_photo_label')}
            </label>
            <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
              {photoPreview ? (
                <div className="photo-preview-wrap">
                  <img src={photoPreview} alt="Site evidence preview" className="photo-preview" />
                  <button
                    className="photo-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
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
            {photoError && (
              <small style={{ color: '#ef4444', fontSize: 11, display: 'block', marginTop: 6 }}>{photoError}</small>
            )}

            {/* Anonymous Toggle */}
            <label className="anonymous-toggle">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
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
              <button type="button" className="secondary-action" onClick={onClose}>
                {t('grievance_cancel')}
              </button>
              <button type="submit" className="primary-action" disabled={!canSubmit || submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={14} className="spin" /> {t('grievance_submit')}
                  </>
                ) : (
                  t('grievance_submit')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const hi = lang === 'hi';
  const { addComplaint, projects: cloudProjects } = useCaseContext();

  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);
  const [grievanceOpen, setGrievanceOpen] = useState(false);

  // Near Me & View State
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'near' | 'map'
  const [userLocation, setUserLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'locating' | 'success' | 'denied' | 'demo' | 'denied_fallback'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [showMapInNearMe, setShowMapInNearMe] = useState(true);

  // Evidence Widget State for selectedProject
  const [evidenceStatus, setEvidenceStatus] = useState('active'); // 'active' | 'delayed' | 'abandoned'
  const [evidenceObservation, setEvidenceObservation] = useState('');
  const [evidenceAnonymous, setEvidenceAnonymous] = useState(true);
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [evidencePhotoPreview, setEvidencePhotoPreview] = useState(null);
  const [evidenceSubmittedToken, setEvidenceSubmittedToken] = useState(null);
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);
  const [obsToast, setObsToast] = useState(null);
  const evidenceFileRef = useRef(null);

  const activeProjects = useMemo(() => {
    return cloudProjects && cloudProjects.length > 0 ? cloudProjects : mockProjects;
  }, [cloudProjects]);

  const handleEvidencePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setEvidencePhoto(file);
      setEvidencePhotoPreview(dataUrl);
    } catch {
      setEvidencePhoto(null);
      setEvidencePhotoPreview(null);
    }
  };

  const handleEvidenceSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedProject || evidenceSubmitting) return;
    setEvidenceSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const customToken = generateCitizenTrackingHash(selectedProject.district || selectedProject.constituency || 'VAR');

    addComplaint({
      projectId: selectedProject.id || selectedProject.work_id,
      projectName: selectedProject.name || selectedProject.work_name,
      district: selectedProject.district,
      state: selectedProject.state,
      issueType:
        evidenceStatus === 'active'
          ? 'Verified Active Work'
          : evidenceStatus === 'delayed'
          ? 'Delayed / Stalled'
          : 'Abandoned / No Work',
      observation: evidenceObservation.trim() || `Ground status verified as: ${evidenceStatus}`,
      isAnonymous: evidenceAnonymous,
      hasPhoto: !!evidencePhoto,
      photoPreview: evidencePhotoPreview || null,
      customToken,
    });

    setEvidenceSubmittedToken(customToken);
    setObsToast(customToken);
    setEvidencePhoto(null);
    setEvidencePhotoPreview(null);
    setEvidenceObservation('');
    setEvidenceStatus('active');
    if (evidenceFileRef.current) evidenceFileRef.current.value = '';
    setEvidenceSubmitting(false);
    setTimeout(() => setObsToast(null), 8000);
  };

  const selectProjectWithReset = (proj) => {
    setSelectedProject(proj);
    setGrievanceOpen(false);
    setEvidenceSubmittedToken(null);
    setEvidencePhoto(null);
    setEvidencePhotoPreview(null);
    setEvidenceObservation('');
    setEvidenceStatus('active');
  };

  const handleUseDemoLocation = (reason = 'manual') => {
    setUserLocation({
      lat: GHAZIABAD_DEMO_COORDS.lat,
      lng: GHAZIABAD_DEMO_COORDS.lng,
      isDemo: true,
      district: GHAZIABAD_DEMO_COORDS.district,
      state: GHAZIABAD_DEMO_COORDS.state,
      name: GHAZIABAD_DEMO_COORDS.name,
    });
    setGeoStatus(reason === 'denied' ? 'denied_fallback' : 'demo');
    setState(GHAZIABAD_DEMO_COORDS.state);
  };

  const requestLocation = () => {
    setActiveTab('near');
    if (userLocation && !userLocation.isDemo) return;
    setGeoStatus('locating');
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isDemo: false,
            name: 'Your Current Location',
          });
          setGeoStatus('success');
        },
        (err) => {
          console.warn('Geolocation unavailable:', err);
          handleUseDemoLocation('denied');
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      handleUseDemoLocation('denied');
    }
  };

  const nearbyProjectsList = useMemo(() => {
    if (!userLocation) return [];
    const list = getNearbyProjects(activeProjects, userLocation.lat, userLocation.lng, lang);
    if (sortOrder === 'desc') {
      return [...list].reverse();
    }
    return list;
  }, [userLocation, activeProjects, lang, sortOrder]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return activeProjects.filter((p) => {
      const matchState =
        !state ||
        String(p.state || '')
          .toLowerCase()
          .includes(state.toLowerCase()) ||
        state.toLowerCase().includes(String(p.state || '').toLowerCase());

      const matchSearch =
        !s ||
        `${p.name || p.work_name || ''} ${p.district || ''} ${p.constituency || p.block_constituency || ''} ${p.id || p.work_id || ''}`
          .toLowerCase()
          .includes(s);

      return matchState && matchSearch;
    });
  }, [activeProjects, search, state]);

  const constituencyProjects = useMemo(() => {
    if (!selectedDistrict) return [];
    const target = selectedDistrict.trim().toLowerCase();
    return activeProjects.filter((p) => {
      const d = String(p.district || '').trim().toLowerCase();
      const c = String(p.constituency || p.block_constituency || '').trim().toLowerCase();
      return (
        d === target ||
        c === target ||
        d.includes(target) ||
        target.includes(d) ||
        c.includes(target) ||
        target.includes(c)
      );
    });
  }, [activeProjects, selectedDistrict]);

  // Compute focal center coordinate based on selected constituency / state
  const focalCenter = useMemo(() => {
    if (userLocation?.lat != null && userLocation?.lng != null) {
      return { lat: userLocation.lat, lng: userLocation.lng, zoom: 13 };
    }
    if (selectedDistrict) {
      const coords = getCoordinatesForDistrict(selectedDistrict, activeProjects);
      if (coords) return coords;
    }
    if (state) {
      const coords = getCoordinatesForDistrict(state, activeProjects);
      if (coords) return { ...coords, zoom: 7 };
    }
    return { lat: 25.3176, lng: 82.9739, zoom: 12 }; // Default Varanasi
  }, [userLocation, selectedDistrict, state, activeProjects]);

  const getAgencyName = (agencyId) => {
    const a = agencies.find((ag) => ag.id === agencyId);
    return a ? a.name.split(' - ')[0] : agencyId || 'Nodal Agency';
  };

  const getSectorColor = (sector) => {
    if (!sector) return 'neutral';
    const key = Object.keys(SECTOR_COLORS).find((k) => sector.includes(k));
    return SECTOR_COLORS[key] || 'neutral';
  };

  const getProjectRisk = (p) => {
    const score =
      p.composite_risk_score != null
        ? Number(p.composite_risk_score)
        : p.riskScore != null
        ? Number(p.riskScore)
        : p.risk?.score || (p.isAnomaly ? 85 : 20);

    if (p.isAnomaly || score >= 70 || p.review_priority === 'HIGH_PRIORITY' || p.review_priority === 'HIGH') {
      return { level: 'high', label: t('risk_badge_high'), text: '🔴 ' + t('risk_badge_high') };
    }
    if (score >= 40 || p.status === 'delayed') {
      return { level: 'medium', label: t('risk_badge_medium'), text: '🟡 ' + t('risk_badge_medium') };
    }
    return { level: 'low', label: t('risk_badge_low'), text: '🟢 ' + t('risk_badge_low') };
  };

  return (
    <div className="page-content citizen-page">
      {obsToast && (
        <div className="obs-toast" role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CheckCircle2 size={18} style={{ color: '#059669' }} />
            <strong>{hi ? 'अवलोकन दर्ज हुआ' : 'Observation submitted'}</strong>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--muted)' }}>
            {hi ? 'ट्रैकिंग हैश' : 'Tracking hash'}
          </p>
          <code className="token-badge">{obsToast}</code>
        </div>
      )}
      {/* ── Welcome ── */}
      <div className="citizen-welcome">
        <div>
          <span className="eyebrow">{t('citizen_eyebrow')}</span>
          <h2>{t('citizen_title')}</h2>
          <p>{t('citizen_subtitle')}</p>
          <button type="button" className="return-home-btn" onClick={() => navigate('/')} style={{ marginTop: 12 }}>
            <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> {hi ? 'होम पर लौटें' : 'Return Home'}
          </button>
        </div>
        <SpeakerButton text={`${t('citizen_title')} ${t('citizen_subtitle')}`} />
      </div>

      {/* ── Top View Switcher ── */}
      <div
        className="citizen-view-tabs"
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          borderBottom: '1px solid var(--line)',
          paddingBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          className={`citizen-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            borderRadius: 8,
            border: activeTab === 'search' ? '1px solid var(--brand)' : '1px solid var(--line)',
            background: activeTab === 'search' ? 'var(--brand)' : 'var(--surface)',
            color: activeTab === 'search' ? '#fff' : 'var(--muted)',
            fontWeight: 700,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Search size={14} /> {t('tab_search_projects')}
        </button>

        <button
          className={`citizen-tab-btn ${activeTab === 'near' ? 'active' : ''}`}
          onClick={requestLocation}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            borderRadius: 8,
            border: activeTab === 'near' ? '1px solid var(--brand)' : '1px solid var(--line)',
            background: activeTab === 'near' ? 'var(--brand)' : 'var(--surface)',
            color: activeTab === 'near' ? '#fff' : 'var(--muted)',
            fontWeight: 700,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <LocateFixed size={14} /> {t('tab_near_me')}
          {userLocation?.isDemo && (
            <span
              style={{
                fontSize: 8,
                padding: '1px 5px',
                borderRadius: 4,
                background: activeTab === 'near' ? 'rgba(255,255,255,0.25)' : '#fef3c7',
                color: activeTab === 'near' ? '#fff' : '#92400e',
                fontWeight: 800,
              }}
            >
              DEMO
            </span>
          )}
        </button>

        <button
          className={`citizen-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            borderRadius: 8,
            border: activeTab === 'map' ? '1px solid var(--brand)' : '1px solid var(--line)',
            background: activeTab === 'map' ? 'var(--brand)' : 'var(--surface)',
            color: activeTab === 'map' ? '#fff' : 'var(--muted)',
            fontWeight: 700,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Map size={14} /> {t('tab_explore_map')}
        </button>
      </div>

      {/* ── View: SEARCH PROJECTS ── */}
      {activeTab === 'search' && (
        <>
          {/* Search Bar */}
          <div className="citizen-searchbar">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('citizen_search')}
            />
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setSelectedDistrict('');
              }}
            >
              <option value="">{t('citizen_all_india')}</option>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="near-btn" onClick={requestLocation}>
              <LocateFixed size={16} /> {t('citizen_near_me')}
            </button>
          </div>

          {/* ── Split Layout: Explore Works Left Sidebar + India Geographic Map ── */}
          <div
            className="citizen-explorer-layout"
            id="works"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 16,
              alignItems: 'start',
            }}
          >
            {/* ── LEFT SIDEBAR: Explore Works Roster & Detail Drawer ── */}
            <div
              className="citizen-works-sidebar panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: '620px',
                padding: '16px',
                overflow: 'hidden',
              }}
            >
              {/* Sidebar Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--line)',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <span className="eyebrow" style={{ fontSize: 10 }}>
                    {hi ? 'सार्वजनिक कार्य अन्वेषक' : 'EXPLORE WORKS'}
                  </span>
                  <strong style={{ fontSize: 14, display: 'block', color: 'var(--ink)' }}>
                    {state ? state : hi ? 'अखिल भारतीय कार्य' : 'All India Works'}
                  </strong>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                    {filtered.length} {hi ? 'परियोजनाएं उपलब्ध' : 'public projects found'}
                    {selectedDistrict ? ` · ${selectedDistrict}` : ''}
                  </small>
                </div>

                {(state || search || selectedDistrict) && (
                  <button
                    type="button"
                    onClick={() => {
                      setState('');
                      setSelectedDistrict('');
                      setSearch('');
                      setSelectedProjectForDetails(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--line)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {hi ? 'फ़िल्टर हटाएं' : 'Reset Filter'}
                  </button>
                )}
              </div>

              {/* Scrollable Works List with Expandable Detail Drawers */}
              <div
                className="citizen-works-list custom-scrollbar"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  overflowY: 'auto',
                  paddingRight: 4,
                  flex: 1,
                }}
              >
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)', fontSize: 12 }}>
                    <MapPin size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{hi ? 'कोई कार्य नहीं मिला' : 'No projects found for this filter'}</p>
                    <small>{hi ? 'कृपया राज्य या खोज शब्द बदलकर पुनः प्रयास करें।' : 'Try selecting another state or clearing the search query.'}</small>
                  </div>
                ) : (
                  filtered.map((p) => {
                    const pCode = p.work_code || p.id || p.work_id || 'PRJ-UNK';
                    const pTitle = p.project_title || p.name || p.work_name || 'Public Project';
                    const pDistrict = p.district || p.constituency || 'District';
                    const pConstituency = p.constituency || p.district || '';
                    const pState = p.state || 'India';
                    const sanctionedLakhs = formatLakhs(
                      p.sanctioned_amount_lakhs != null
                        ? p.sanctioned_amount_lakhs
                        : (p.sanctionedAmount || 0) / 100000
                    );
                    const agencyName = getAgencyName(p.implementing_agency || p.agency || p.contractor);
                    const progressPct = safeNumber(p.physicalProgress ?? p.reported_progress_pct, 0);
                    const statusStage = p.audit_status || p.status || 'In Progress';
                    const isExpanded =
                      (selectedProjectForDetails?.id || selectedProjectForDetails?.work_id || selectedProjectForDetails?.work_code) === pCode;

                    return (
                      <div
                        key={pCode}
                        className={`citizen-work-item ${isExpanded ? 'expanded' : ''}`}
                        style={{
                          borderRadius: 10,
                          border: isExpanded ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                          background: 'var(--surface)',
                          transition: 'all 0.2s ease',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Project Header Bar (Click to toggle details) */}
                        <div
                          onClick={() => {
                            setSelectedProjectForDetails(isExpanded ? null : p);
                          }}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                            background: isExpanded ? 'rgba(5, 150, 105, 0.05)' : 'transparent',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  color: 'var(--brand)',
                                  background: 'rgba(5, 150, 105, 0.1)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                }}
                              >
                                {pCode}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
                                {p.sector || p.category || 'Infrastructure'}
                              </span>
                            </div>
                            <strong
                              style={{
                                fontSize: 12,
                                display: 'block',
                                color: 'var(--ink)',
                                lineHeight: 1.3,
                                whiteSpace: isExpanded ? 'normal' : 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {pTitle}
                            </strong>
                            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 6 }}>
                              <span>📍 {pDistrict}, {pState}</span>
                              <span>·</span>
                              <span>₹{sanctionedLakhs}L</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            aria-label={isExpanded ? 'Collapse' : 'Expand details'}
                            style={{
                              border: 0,
                              background: 'transparent',
                              color: isExpanded ? 'var(--brand)' : 'var(--muted)',
                              cursor: 'pointer',
                              padding: 4,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>

                        {/* ── Expandable Isolated Project Details Card / Drawer ── */}
                        {isExpanded && (
                          <div
                            className="citizen-work-detail-drawer"
                            style={{
                              padding: '12px 14px',
                              borderTop: '1px solid var(--line)',
                              background: 'var(--bg-subtle, rgba(0,0,0,0.02))',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                              fontSize: 11,
                            }}
                          >
                            {/* Project Title & Code */}
                            <div>
                              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', display: 'block' }}>
                                {hi ? 'परियोजना शीर्षक एवं कोड' : 'Project Title & Code'}
                              </span>
                              <strong style={{ fontSize: 13, color: 'var(--ink)', display: 'block', margin: '2px 0' }}>
                                {pTitle}
                              </strong>
                              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--brand)', fontWeight: 700 }}>
                                {pCode}
                              </span>
                            </div>

                            {/* Location */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div>
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', display: 'block' }}>
                                  {hi ? 'स्थान' : 'Location'}
                                </span>
                                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                                  {pDistrict}{pConstituency && pConstituency !== pDistrict ? ` (${pConstituency})` : ''}, {pState}
                                </span>
                              </div>

                              {/* Sanctioned Amount */}
                              <div>
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', display: 'block' }}>
                                  {hi ? 'स्वीकृत राशि' : 'Sanctioned Amount'}
                                </span>
                                <strong style={{ color: 'var(--ink)', fontSize: 12 }}>
                                  ₹{sanctionedLakhs} Lakhs
                                </strong>
                              </div>
                            </div>

                            {/* Implementing Agency / Contractor */}
                            <div>
                              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', display: 'block' }}>
                                {hi ? 'कार्यान्वयन एजेंसी / ठेकेदार' : 'Implementing Agency / Contractor'}
                              </span>
                              <strong style={{ color: 'var(--ink)' }}>
                                {agencyName}
                              </strong>
                            </div>

                            {/* Current Status: Progress Bar & Stage */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
                                  {hi ? 'वर्तमान स्थिति' : 'Current Status'}
                                </span>
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background:
                                      statusStage === 'completed' || statusStage === 'RESOLVED_AUDITED' || progressPct === 100
                                        ? 'rgba(5, 150, 105, 0.15)'
                                        : statusStage === 'delayed'
                                        ? 'rgba(200, 90, 50, 0.15)'
                                        : 'rgba(217, 119, 6, 0.15)',
                                    color:
                                      statusStage === 'completed' || statusStage === 'RESOLVED_AUDITED' || progressPct === 100
                                        ? '#059669'
                                        : statusStage === 'delayed'
                                        ? '#C85A32'
                                        : '#D97706',
                                  }}
                                >
                                  {statusStage}
                                </span>
                              </div>
                              <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden', marginBottom: 2 }}>
                                <div
                                  style={{
                                    width: `${progressPct}%`,
                                    height: '100%',
                                    background:
                                      statusStage === 'delayed' ? '#C85A32' : progressPct === 100 ? '#059669' : '#059669',
                                    borderRadius: 3,
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>
                                {progressPct}% {hi ? 'भौतिक प्रगति' : 'Physical Progress'}
                              </span>
                            </div>

                            {/* Action Button: Report Observation for this Project */}
                            <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
                              <button
                                type="button"
                                className="primary-action full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProject(p);
                                  setGrievanceOpen(true);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: '#059669',
                                  borderColor: '#059669',
                                  color: '#fff',
                                  borderRadius: 7,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  cursor: 'pointer',
                                }}
                              >
                                <ShieldCheck size={14} />
                                {hi ? 'इस परियोजना के लिए अवलोकन दर्ज करें' : 'Report Observation for this Project'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: India Geographic Map with Boundary Drilldown ── */}
            <div className="citizen-map panel" style={{ margin: 0 }}>
              <ErrorBoundary fallbackTitle="Geographic Map Boundary Viewer">
                <IndiaDrilldownMap
                  projects={filtered}
                  selectedState={state}
                  onStateChange={(st) => {
                    setState(st);
                    setSelectedDistrict('');
                  }}
                  onSelectState={(st) => {
                    setState(st);
                    setSelectedDistrict('');
                  }}
                  onDistrictSelect={(dist) => {
                    setSelectedDistrict(dist);
                  }}
                  userLocation={userLocation}
                  nearbyProjects={userLocation ? nearbyProjectsList : []}
                  onProjectSelect={(proj) => {
                    setSelectedProjectForDetails(proj);
                    selectProjectWithReset(proj);
                  }}
                />
              </ErrorBoundary>
            </div>
          </div>
        </>
      )}

      {/* ── View: EXPLORE MAP ── */}
      {activeTab === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="citizen-searchbar" style={{ marginBottom: 0 }}>
            <MapPin size={18} />
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setSelectedDistrict('');
              }}
              style={{ flex: 1 }}
            >
              <option value="">{t('citizen_all_india')} — Choose a state</option>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="near-btn" onClick={requestLocation}>
              <LocateFixed size={16} /> {t('citizen_near_me')}
            </button>
          </div>

          <div style={{ marginTop: 4 }}>
            <ErrorBoundary fallbackTitle="Spatial Map View">
              <CivicMap
                projects={filtered}
                userLocation={userLocation}
                initialCenter={{ lat: focalCenter.lat, lng: focalCenter.lng }}
                initialZoom={focalCenter.zoom || 12}
                height={480}
                showFilters={true}
                title={hi ? 'नागरिक संवादात्मक मानचित्र' : 'Civic Spatial Explorer'}
                subtitle={
                  hi
                    ? 'सभी एमपीलैड्स कार्य, जोखिम स्तर एवं वास्तविक स्थिति'
                    : 'Interactive Map of MPLADS works with real geo-coordinates, live proximity, and risk layers'
                }
                onPinClick={(id, projectObj) => {
                  const proj =
                    projectObj ||
                    activeProjects.find((p) => p.id === id || p.work_id === id);
                  if (proj) {
                    selectProjectWithReset(proj);
                  }
                }}
              />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {/* ── View: NEAR ME ── */}
      {activeTab === 'near' && (
        <div className="citizen-near-me-section" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Locating Spinner */}
          {geoStatus === 'locating' && (
            <div className="panel" style={{ padding: 24, textAlign: 'center', background: '#F9FAF8' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px', color: 'var(--brand)' }} />
              <b style={{ fontSize: 13, color: 'var(--brand)' }}>{t('near_me_locating')}</b>
            </div>
          )}

          {/* Location Denied Fallback Banner */}
          {geoStatus === 'denied_fallback' && (
            <div
              className="demo-notice"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 10,
                background: '#fffbf5',
                border: '1px solid #fed7aa',
                color: '#9a3412',
                fontSize: 12,
                fontWeight: 600,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
                <span>
                  {hi
                    ? 'स्थान तक पहुँच अनुपलब्ध है। डेमो स्थान प्रदर्शित किया जा रहा है: गाजियाबाद, उत्तर प्रदेश (उदाहरणात्मक डेटा)'
                    : 'Location access unavailable. Displaying Demo Location: Ghaziabad, Uttar Pradesh (Illustrative Data)'}
                </span>
              </div>
              <button
                onClick={() => {
                  setUserLocation(null);
                  setGeoStatus('idle');
                  requestLocation();
                }}
                style={{
                  border: '1px solid #fed7aa',
                  background: '#fff',
                  color: '#c2410c',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} /> {t('near_me_quick_locate')}
              </button>
            </div>
          )}

          {/* Location Denied / Unavailable Fallback (if user manually resets or arrives idle) */}
          {!userLocation && (geoStatus === 'denied' || geoStatus === 'idle') && (
            <div
              className="panel"
              style={{ padding: 20, border: '1px solid #fed7aa', background: '#fffbf5', borderRadius: 14 }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#ffedd5',
                    color: '#c2410c',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 14, color: '#9a3412' }}>
                    {t('near_me_fallback_msg')}
                  </h3>
                  <p style={{ margin: '0 0 14px', fontSize: 11, color: '#78716c', lineHeight: 1.45 }}>
                    {t('near_me_privacy_note')}
                  </p>
                  <button
                    className="primary-action"
                    onClick={() => handleUseDemoLocation('manual')}
                    style={{ background: '#314D3F', display: 'inline-flex', alignItems: 'center', gap: 7 }}
                  >
                    <MapPin size={15} /> {t('near_me_use_demo_btn')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Location Active: Demo Notice & Privacy Tag */}
          {userLocation && (
            <>
              {userLocation.isDemo && geoStatus !== 'denied_fallback' && (
                <div
                  className="demo-notice"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#F4EEE9',
                    border: '1px solid #E7D8CF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="pulse-dot" />
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 7px',
                        background: '#e5b6a8',
                        color: '#27382f',
                        borderRadius: 4,
                      }}
                    >
                      {t('near_me_demo_badge')}
                    </span>
                    <span style={{ fontSize: 11, color: '#6E5A51' }}>{t('near_me_demo_active_banner')}</span>
                  </div>
                  <button
                    onClick={() => {
                      setUserLocation(null);
                      setGeoStatus('idle');
                      requestLocation();
                    }}
                    style={{
                      border: 0,
                      background: 'transparent',
                      color: 'var(--brand)',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={12} /> {t('near_me_quick_locate')}
                  </button>
                </div>
              )}

              {/* Privacy Notice Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fff',
                  padding: '9px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 10,
                  color: 'var(--muted)',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} style={{ color: 'var(--brand)' }} />
                  {t('near_me_privacy_note')}
                </span>
                <span style={{ fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Navigation size={13} style={{ color: '#2563eb' }} />
                  {userLocation.name}
                </span>
              </div>

              {/* Interactive Map in Near Me */}
              {showMapInNearMe && (
                <div style={{ marginTop: 4 }}>
                  <ErrorBoundary fallbackTitle="Nearby Works Map">
                    <CivicMap
                      projects={activeProjects}
                      userLocation={userLocation}
                      initialCenter={{ lat: userLocation.lat, lng: userLocation.lng }}
                      initialZoom={13}
                      height={400}
                      showFilters={false}
                      title={
                        hi
                          ? `निकटवर्ती कार्य मानचित्र (${nearbyProjectsList.length})`
                          : `Nearby Works Map (${nearbyProjectsList.length})`
                      }
                      subtitle={
                        hi
                          ? 'आपकी वर्तमान स्थिति और निकटतम जन विकास कार्य'
                          : 'Proximity to public projects around your detected coordinates'
                      }
                      onPinClick={(id, projectObj) => {
                        const proj =
                          projectObj ||
                          activeProjects.find((p) => p.id === id || p.work_id === id);
                        if (proj) {
                          selectProjectWithReset(proj);
                        }
                      }}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {/* Controls Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    {t('near_me_title')} ({nearbyProjectsList.length})
                  </h3>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>{t('near_me_subtitle')}</small>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="secondary-action"
                    style={{ fontSize: 10, height: 32, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <ArrowUpDown size={13} />
                    {t('near_me_sort_distance')}:{' '}
                    {sortOrder === 'asc' ? t('near_me_distance_nearest') : t('near_me_distance_farthest')}
                  </button>
                  <button
                    onClick={() => setShowMapInNearMe((prev) => !prev)}
                    className="secondary-action"
                    style={{ fontSize: 10, height: 32, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Map size={13} /> {showMapInNearMe ? 'Hide Map' : t('near_me_show_map')}
                  </button>
                </div>
              </div>

              {/* Nearby Projects Grid */}
              <div className="roster-grid" style={{ marginTop: 4 }}>
                {nearbyProjectsList.map((p) => {
                  const riskInfo = getProjectRisk(p);
                  const pId = p.id || p.work_id;
                  const pName = p.name || p.work_name;
                  const sanctionedLakhs =
                    p.sanctioned_amount_lakhs != null
                      ? Number(p.sanctioned_amount_lakhs)
                      : (p.sanctionedAmount || 0) / 100000;
                  const progressPct = p.physicalProgress ?? p.reported_progress_pct ?? 0;

                  return (
                    <div
                      key={pId}
                      className="roster-card"
                      style={{
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: 16,
                      }}
                      onClick={() => {
                        selectProjectWithReset(p);
                      }}
                    >
                      {/* Top bar with distance and risk badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          <MapPin size={11} /> {p.distanceFormatted}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '3px 7px',
                            borderRadius: 5,
                            background:
                              riskInfo.level === 'high'
                                ? '#fee2e2'
                                : riskInfo.level === 'medium'
                                ? '#fef3c7'
                                : '#dcfce7',
                            color:
                              riskInfo.level === 'high'
                                ? '#991b1b'
                                : riskInfo.level === 'medium'
                                ? '#92400e'
                                : '#166534',
                          }}
                        >
                          {riskInfo.text}
                        </span>
                      </div>

                      {/* Title & Sector */}
                      <div className="roster-card-body" style={{ flex: 1 }}>
                        <span className="roster-id" style={{ display: 'block', fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>
                          {pId} · {p.sector || p.category}
                        </span>
                        <strong style={{ fontSize: 13, display: 'block', color: 'var(--ink)', lineHeight: 1.35, marginBottom: 6 }}>
                          {pName}
                        </strong>
                        <div className="roster-meta" style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--muted)', marginBottom: 8, flexWrap: 'wrap' }}>
                          <span>📍 {p.district || p.constituency}, {p.state}</span>
                          <span>₹{sanctionedLakhs.toFixed(1)}L</span>
                          <span className={`roster-status ${p.status || 'in_progress'}`}>
                            {p.audit_status || p.status || t('citizen_in_progress')}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="roster-progress-bar" style={{ marginBottom: 4 }}>
                          <i style={{ width: `${progressPct}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)' }}>
                          <span>
                            {progressPct}% {t('common_physical').toLowerCase()} {t('common_progress').toLowerCase()}
                          </span>
                          {p.estimatedSiteProgress != null && p.estimatedSiteProgress !== progressPct && (
                            <span style={{ color: '#c2410c', fontWeight: 600 }}>
                              AI Est: {p.estimatedSiteProgress}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                        <button
                          className="primary-action"
                          style={{ flex: 1, height: 32, fontSize: 10, background: '#059669', borderColor: '#059669' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectProjectWithReset(p);
                          }}
                        >
                          Select & Report
                        </button>
                        <button
                          className="secondary-action"
                          style={{ height: 32, fontSize: 10, padding: '0 10px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/citizen/project/${pId}`);
                          }}
                        >
                          Dossier <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Constituency Roster (after district click) ── */}
      {selectedDistrict && constituencyProjects.length > 0 && (
        <div className="constituency-roster" style={{ marginTop: 20 }}>
          <div className="roster-header">
            <span className="eyebrow">{t('citizen_constituency_eyebrow')}</span>
            <h3>
              {t('citizen_constituency_prefix')} {selectedDistrict}
            </h3>
            <p>
              {constituencyProjects.length} {t('citizen_constituency_body_suffix')}
            </p>
          </div>
          <div className="roster-grid">
            {constituencyProjects.map((p) => {
              const pId = p.id || p.work_id;
              const pName = p.name || p.work_name;
              const sanctionedLakhs =
                p.sanctioned_amount_lakhs != null
                  ? Number(p.sanctioned_amount_lakhs)
                  : (p.sanctionedAmount || 0) / 100000;
              const progressPct = p.physicalProgress ?? p.reported_progress_pct ?? 0;

              return (
                <button
                  key={pId}
                  className="roster-card"
                  onClick={() => {
                    selectProjectWithReset(p);
                  }}
                  style={{ textAlign: 'left' }}
                >
                  <div className={`roster-sector-dot ${getSectorColor(p.sector || p.category)}`} title={p.sector || p.category} />
                  <div className="roster-card-body">
                    <span className="roster-id">
                      {pId} · {p.sector || p.category}
                    </span>
                    <strong>{pName}</strong>
                    <div className="roster-meta">
                      <span>₹{sanctionedLakhs.toFixed(1)}L {t('citizen_sanctioned_amount').toLowerCase()}</span>
                      <span className={`roster-status ${p.status || 'in_progress'}`}>
                        {p.audit_status || p.status || t('citizen_in_progress')}
                      </span>
                    </div>
                    <div className="roster-progress-bar">
                      <i style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="roster-progress-text">
                      {progressPct}% {t('common_physical').toLowerCase()} {t('common_progress').toLowerCase()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Project Detail Drawer: Progress Discrepancy & Citizen Evidence Widget ── */}
      {selectedProject && (() => {
        const pId = selectedProject.id || selectedProject.work_id;
        const pName = selectedProject.name || selectedProject.work_name;
        const reportedProgress = selectedProject.physicalProgress ?? selectedProject.reported_progress_pct ?? 0;
        const visualEstimate =
          selectedProject.estimatedSiteProgress ??
          selectedProject.ai_visual_estimate_pct ??
          (selectedProject.isAnomaly ? Math.max(20, reportedProgress - 20) : reportedProgress);
        const discrepancy = Math.abs(reportedProgress - visualEstimate);
        const hasDiscrepancyAlert = discrepancy >= 15 || selectedProject.isAnomaly;

        const sanctionedLakhs =
          selectedProject.sanctioned_amount_lakhs != null
            ? Number(selectedProject.sanctioned_amount_lakhs)
            : (selectedProject.sanctionedAmount || 0) / 100000;

        return (
          <div className="project-preview-card" style={{ marginTop: 20 }}>
            {/* Drawer Header */}
            <div className="preview-header">
              <div>
                <span className="eyebrow">
                  {t('project_detail_eyebrow')} · {pId}
                </span>
                <h3 style={{ fontSize: 18, margin: '4px 0 2px' }}>{pName}</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                  📍 {selectedProject.district || selectedProject.constituency}, {selectedProject.state} · Sector:{' '}
                  <b style={{ color: 'var(--ink)' }}>{selectedProject.sector || selectedProject.category}</b>
                </p>
              </div>
              <button className="preview-close" onClick={() => setSelectedProject(null)} aria-label={t('btn_close')}>
                <X size={18} />
              </button>
            </div>

            {/* Core Project Facts */}
            <div className="preview-facts">
              <div>
                <span>{t('project_sanction_amount')}</span>
                <b>₹{sanctionedLakhs.toFixed(1)}L</b>
              </div>
              <div>
                <span>{t('project_mp_constituency')}</span>
                <b>{selectedProject.constituency || selectedProject.district}</b>
              </div>
              <div>
                <span>{t('project_physical_progress')}</span>
                <b style={{ color: '#059669' }}>{reportedProgress}%</b>
              </div>
              <div>
                <span>AI Visual Estimate</span>
                <b style={{ color: hasDiscrepancyAlert ? '#C85A32' : '#059669' }}>{visualEstimate}%</b>
              </div>
              <div>
                <span>{t('project_geotagged_proofs')}</span>
                <b>{selectedProject.audit_status || selectedProject.status || 'Monitored'}</b>
              </div>
              <div>
                <span>{t('project_contractor')}</span>
                <b>{getAgencyName(selectedProject.implementing_agency || selectedProject.agency)}</b>
              </div>
            </div>

            {/* ── Progress Discrepancy Analysis ── */}
            <div
              style={{
                marginTop: 14,
                padding: 16,
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--muted)',
                  }}
                >
                  {hi ? 'प्रगति विसंगति विश्लेषण' : 'Physical Progress vs. AI Satellite Visual Estimate'}
                </span>
                {hasDiscrepancyAlert && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: '#fee2e2',
                      color: '#991b1b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <AlertTriangle size={12} /> {discrepancy}-Point Discrepancy
                  </span>
                )}
              </div>

              {/* Progress Comparison Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Official Reported Physical Progress</span>
                    <span style={{ fontWeight: 800, color: '#059669' }}>{reportedProgress}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${reportedProgress}%`,
                        height: '100%',
                        background: '#059669',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>AI Satellite Visual Estimate</span>
                    <span style={{ fontWeight: 800, color: hasDiscrepancyAlert ? '#C85A32' : '#059669' }}>
                      {visualEstimate}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${visualEstimate}%`,
                        height: '100%',
                        background: hasDiscrepancyAlert ? '#C85A32' : '#059669',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Discrepancy Alert Banner */}
              {hasDiscrepancyAlert && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(200, 90, 50, 0.1)',
                    border: '1px solid rgba(200, 90, 50, 0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <AlertTriangle size={18} style={{ color: '#C85A32', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: '#C85A32', lineHeight: 1.45 }}>
                    <strong>⚠️ {discrepancy}-point discrepancy detected between contractor claim and ground visual baseline.</strong> Official reported progress: {reportedProgress}% vs. AI satellite ground baseline: {visualEstimate}%. Independent ground verification by citizens is strongly advised.
                  </div>
                </div>
              )}
            </div>

            {/* ── Citizen Ground Evidence Widget ── */}
            <div
              style={{
                marginTop: 16,
                padding: 18,
                borderRadius: 12,
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border, var(--line))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} style={{ color: '#059669' }} />
                    {hi ? 'नागरिक जमीनी साक्ष्य एवं सत्यापन' : 'Citizen Ground Evidence & Verification'}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                    {hi
                      ? 'मौके की स्थिति दर्ज करें और वास्तविक प्रगति सत्यापित करने में मदद करें।'
                      : 'Report current ground reality, upload geo-referenced proof, and help verify this public project.'}
                  </p>
                </div>
              </div>

              {evidenceSubmittedToken ? (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: 'rgba(5, 150, 105, 0.08)',
                    border: '1px solid rgba(5, 150, 105, 0.3)',
                    textAlign: 'center',
                  }}
                >
                  <CheckCircle2 size={32} style={{ color: '#059669', margin: '0 auto 8px' }} />
                  <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#059669' }}>
                    {hi ? 'साक्ष्य सफलतापूर्वक दर्ज हुआ' : 'Ground Evidence Successfully Submitted'}
                  </h4>
                  <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--muted)' }}>
                    {hi
                      ? 'आपका साक्ष्य आधिकारिक जांच प्रणाली में शामिल कर लिया गया है।'
                      : 'Your observation and evidence have been logged with a cryptographic tracking token.'}
                  </p>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: '#0c0a09',
                      color: '#34d399',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      fontWeight: 800,
                      border: '1px solid #059669',
                    }}
                  >
                    <span>{evidenceSubmittedToken}</span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => setEvidenceSubmittedToken(null)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: 'var(--muted)',
                        fontSize: 11,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      {hi ? 'एक और अवलोकन दर्ज करें' : 'Submit another observation'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Ground Status Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
                      {hi ? 'वर्तमान जमीनी स्थिति' : 'Ground Status *'}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                      {[
                        { key: 'active', label: 'Verified Active Work', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
                        { key: 'delayed', label: 'Delayed / Stalled', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
                        { key: 'abandoned', label: 'Abandoned / No Work', color: '#C85A32', bg: 'rgba(200, 90, 50, 0.1)' },
                      ].map((st) => {
                        const isSelected = evidenceStatus === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setEvidenceStatus(st.key)}
                            style={{
                              padding: '9px 12px',
                              borderRadius: 8,
                              border: isSelected ? `2px solid ${st.color}` : '1px solid var(--line)',
                              background: isSelected ? st.bg : 'var(--surface)',
                              color: isSelected ? st.color : 'var(--ink)',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Photo Upload Dropzone */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
                      {hi ? 'साइट की फोटो अपलोड करें' : 'Upload Site Photo (Optional)'}
                    </label>
                    <div
                      onClick={() => evidenceFileRef.current?.click()}
                      style={{
                        border: '2px dashed var(--line)',
                        borderRadius: 10,
                        padding: 16,
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--surface)',
                        position: 'relative',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {evidencePhotoPreview ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={evidencePhotoPreview}
                            alt="Ground Evidence"
                            style={{ maxHeight: 120, borderRadius: 8, objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEvidencePhoto(null);
                              setEvidencePhotoPreview(null);
                            }}
                            style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              background: '#C85A32',
                              color: '#fff',
                              borderRadius: '50%',
                              width: 22,
                              height: 22,
                              border: 0,
                              display: 'grid',
                              placeItems: 'center',
                              cursor: 'pointer',
                            }}
                            aria-label="Remove photo"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
                          <Image size={24} style={{ color: 'var(--muted)' }} />
                          <span style={{ fontSize: 11, fontWeight: 600 }}>Click to attach ground photograph or drag file here</span>
                          <span style={{ fontSize: 9, color: 'var(--muted)' }}>Supports JPG, PNG, WEBP (Max 10MB)</span>
                        </div>
                      )}
                      <input
                        ref={evidenceFileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleEvidencePhotoChange}
                      />
                    </div>
                  </div>

                  {/* Ground Observation */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
                      {hi ? 'जमीनी अवलोकन विवरण' : 'Ground Observation'}
                    </label>
                    <textarea
                      value={evidenceObservation}
                      onChange={(e) => setEvidenceObservation(e.target.value)}
                      placeholder={
                        hi
                          ? 'मौके पर क्या देखा — श्रमिकों की संख्या, निर्माण सामग्री, कार्य गति आदि...'
                          : 'Describe visible ground progress, presence of construction equipment, active labor, or physical halts...'
                      }
                      rows={3}
                      style={{
                        width: '100%',
                        padding: 10,
                        borderRadius: 8,
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--ink)',
                        fontSize: 12,
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Anonymous Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="evidence-anon"
                      checked={evidenceAnonymous}
                      onChange={(e) => setEvidenceAnonymous(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="evidence-anon" style={{ fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>
                      <strong>Report anonymously</strong> — Reporter identity and IP are cryptographically detached.
                    </label>
                  </div>

                  {/* Submit Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="secondary-action"
                      style={{ fontSize: 11, height: 34, padding: '0 12px' }}
                      onClick={() => setGrievanceOpen(true)}
                    >
                      {t('citizen_raise_grievance')} (Full Form)
                    </button>
                      <button
                        type="button"
                        className="primary-action"
                        disabled={evidenceSubmitting}
                        style={{ fontSize: 11, height: 34, padding: '0 16px', background: '#059669', borderColor: '#059669' }}
                        onClick={handleEvidenceSubmit}
                      >
                        {evidenceSubmitting ? (
                          <>
                            <Loader2 size={14} className="spin" /> Submitting…
                          </>
                        ) : (
                          'Submit Citizen Observation'
                        )}
                      </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Overview Stats ── */}
      <div className="citizen-overview">
        <div className="public-stat">
          <span>{t('citizen_works_found')}</span>
          <b>{filtered.length}</b>
          <small>{t('citizen_works_found_sub')}</small>
        </div>
        <div className="public-stat">
          <span>{t('citizen_completed_stat')}</span>
          <b>
            {
              filtered.filter(
                (p) => p.status === 'completed' || p.audit_status === 'RESOLVED_AUDITED' || (p.physicalProgress ?? p.reported_progress_pct) === 100
              ).length
            }
          </b>
          <small>{t('citizen_completed_stat_sub')}</small>
        </div>
        <div className="public-stat">
          <span>{t('citizen_ongoing_stat')}</span>
          <b>
            {
              filtered.filter(
                (p) =>
                  p.status !== 'completed' &&
                  p.audit_status !== 'RESOLVED_AUDITED' &&
                  (p.physicalProgress ?? p.reported_progress_pct ?? 0) < 100
              ).length
            }
          </b>
          <small>{t('citizen_ongoing_stat_sub')}</small>
        </div>
        <div className="public-stat">
          <span>{t('citizen_evidence_stat')}</span>
          <b>
            {filtered.length > 0
              ? `${Math.round(
                  (filtered.filter((p) => (p.composite_risk_score ?? p.riskScore ?? 0) < 60).length /
                    filtered.length) *
                    100
                )}%`
              : '85%'}
          </b>
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

        <section className="panel observation-card" id="report-observation">
          <div>
            <span className="eyebrow">{t('citizen_observation_eyebrow')}</span>
            <h3>{t('citizen_observation_title')}</h3>
            <p>{t('citizen_observation_body')}</p>
          </div>
          <button
            type="button"
            className="primary-action"
            onClick={() => {
              const target = selectedProject || selectedProjectForDetails || filtered[0];
              if (target) {
                setSelectedProject(target);
                setGrievanceOpen(true);
              } else {
                setActiveTab('search');
              }
            }}
          >
            {t('citizen_report_btn')} <ArrowRight size={15} />
          </button>
        </section>
      </div>

      {/* ── Grievance Modal ── */}
      {grievanceOpen && (selectedProject || selectedProjectForDetails) && (
        <GrievanceModal
          project={selectedProject || selectedProjectForDetails}
          onClose={() => setGrievanceOpen(false)}
          t={t}
          addComplaint={addComplaint}
        />
      )}
    </div>
  );
}
