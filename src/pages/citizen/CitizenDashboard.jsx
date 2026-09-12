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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projects, states, agencies } from '../../data/mockData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCaseContext } from '../../contexts/CaseContext';
import SpeakerButton from '../../components/SpeakerButton';
import IndiaDrilldownMap from '../../components/IndiaDrilldownMap';
import CivicMap from '../../components/map/CivicMap';
import { GHAZIABAD_DEMO_COORDS, getNearbyProjects } from '../../utils/geo';

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
              <span className="eyebrow" style={{ fontSize: 12, fontWeight: 500, color: '#a8a29e' }}>
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
  const { t, lang } = useLanguage();
  const { addComplaint } = useCaseContext();

  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
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
  const evidenceFileRef = useRef(null);

  const handleEvidencePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidencePhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEvidencePhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleEvidenceSubmit = () => {
    if (!selectedProject) return;
    const dist = (selectedProject.district || 'GEN').slice(0, 3).toUpperCase();
    const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const customToken = `#CIT-${dist}-${hex}`;

    const token = addComplaint({
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      district: selectedProject.district,
      state: selectedProject.state,
      issueType: evidenceStatus === 'active' ? 'Verified Active Work' : evidenceStatus === 'delayed' ? 'Delayed / Stalled' : 'Abandoned / No Work',
      observation: evidenceObservation.trim() || `Ground status verified as: ${evidenceStatus}`,
      isAnonymous: evidenceAnonymous,
      hasPhoto: !!evidencePhoto,
      photoPreview: evidencePhotoPreview ? evidencePhotoPreview.slice(0, 100) : null,
      customToken,
    });

    setEvidenceSubmittedToken(customToken || token);
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
    const list = getNearbyProjects(projects, userLocation.lat, userLocation.lng, lang);
    if (sortOrder === 'desc') {
      return [...list].reverse();
    }
    return list;
  }, [userLocation, lang, sortOrder]);

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

  const getProjectRisk = (project) => {
    if (project.isAnomaly) return { level: 'high', label: t('risk_badge_high'), text: '🔴 ' + t('risk_badge_high') };
    const variance = (project.spentAmount - project.sanctionedAmount) / project.sanctionedAmount;
    if (variance > 0.3 || project.status === 'delayed') return { level: 'medium', label: t('risk_badge_medium'), text: '🟡 ' + t('risk_badge_medium') };
    return { level: 'low', label: t('risk_badge_low'), text: '🟢 ' + t('risk_badge_low') };
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

      {/* ── Top View Switcher ── */}
      <div className="citizen-view-tabs" style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        borderBottom: '1px solid var(--line)',
        paddingBottom: 10,
        flexWrap: 'wrap',
      }}>
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
            background: activeTab === 'search' ? 'var(--brand)' : '#fff',
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
            background: activeTab === 'near' ? 'var(--brand)' : '#fff',
            color: activeTab === 'near' ? '#fff' : 'var(--muted)',
            fontWeight: 700,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <LocateFixed size={14} /> {t('tab_near_me')}
          {userLocation?.isDemo && (
            <span style={{
              fontSize: 8,
              padding: '1px 5px',
              borderRadius: 4,
              background: activeTab === 'near' ? 'rgba(255,255,255,0.25)' : '#fef3c7',
              color: activeTab === 'near' ? '#fff' : '#92400e',
              fontWeight: 800,
            }}>
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
            background: activeTab === 'map' ? 'var(--brand)' : '#fff',
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
              onChange={e => setSearch(e.target.value)}
              placeholder={t('citizen_search')}
            />
            <select value={state} onChange={e => setState(e.target.value)}>
              <option value="">{t('citizen_all_india')}</option>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="near-btn" onClick={requestLocation}>
              <LocateFixed size={16} /> {t('citizen_near_me')}
            </button>
          </div>

          {/* India Map */}
          <div className="citizen-map panel">
            <IndiaDrilldownMap
              projects={filtered}
              selectedState={state}
              onStateChange={setState}
              onDistrictSelect={setSelectedDistrict}
              userLocation={userLocation}
              nearbyProjects={userLocation ? nearbyProjectsList : []}
              onProjectSelect={(proj) => {
                selectProjectWithReset(proj);
              }}
            />
          </div>
        </>
      )}

      {/* ── View: EXPLORE MAP ── */}
      {activeTab === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="citizen-searchbar" style={{ marginBottom: 0 }}>
            <MapPin size={18} />
            <select value={state} onChange={e => setState(e.target.value)} style={{ flex: 1 }}>
              <option value="">{t('citizen_all_india')} — Choose a state</option>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="near-btn" onClick={requestLocation}>
              <LocateFixed size={16} /> {t('citizen_near_me')}
            </button>
          </div>

          <div style={{ marginTop: 4 }}>
            <CivicMap
              projects={filtered}
              userLocation={userLocation}
              initialCenter={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: 25.3176, lng: 82.9739 }}
              initialZoom={userLocation ? 13 : 11}
              height={480}
              showFilters={true}
              title={hi ? 'नागरिक संवादात्मक मानचित्र' : 'Civic Spatial Explorer'}
              subtitle={hi ? 'सभी एमपीलैड्स कार्य, जोखिम स्तर एवं वास्तविक स्थिति' : 'Interactive Map of MPLADS works with real geo-coordinates, live proximity, and risk layers'}
              onPinClick={(id) => {
                const proj = projects.find(p => p.id === id);
                if (proj) {
                  selectProjectWithReset(proj);
                }
              }}
            />
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
            <div className="panel" style={{ padding: 20, border: '1px solid #fed7aa', background: '#fffbf5', borderRadius: 14 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ffedd5', color: '#c2410c', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 14, color: '#9a3412' }}>{t('near_me_fallback_msg')}</h3>
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
                <div className="demo-notice" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#F4EEE9', border: '1px solid #E7D8CF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="pulse-dot" />
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', background: '#e5b6a8', color: '#27382f', borderRadius: 4 }}>
                      {t('near_me_demo_badge')}
                    </span>
                    <span style={{ fontSize: 11, color: '#6E5A51' }}>{t('near_me_demo_active_banner')}</span>
                  </div>
                  <button
                    onClick={() => { setUserLocation(null); setGeoStatus('idle'); requestLocation(); }}
                    style={{ border: 0, background: 'transparent', color: 'var(--brand)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                  >
                    <RefreshCw size={12} /> {t('near_me_quick_locate')}
                  </button>
                </div>
              )}

              {/* Privacy Notice Bar */}
              <div style={{
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
              }}>
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
                  <CivicMap
                    projects={projects}
                    userLocation={userLocation}
                    initialCenter={{ lat: userLocation.lat, lng: userLocation.lng }}
                    initialZoom={13}
                    height={400}
                    showFilters={false}
                    title={hi ? `निकटवर्ती कार्य मानचित्र (${nearbyProjectsList.length})` : `Nearby Works Map (${nearbyProjectsList.length})`}
                    subtitle={hi ? 'आपकी वर्तमान स्थिति और निकटतम जन विकास कार्य' : 'Proximity to public projects around your detected coordinates'}
                    onPinClick={(id) => {
                      const proj = projects.find(p => p.id === id);
                      if (proj) {
                        selectProjectWithReset(proj);
                      }
                    }}
                  />
                </div>
              )}

              {/* Controls Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    {t('near_me_title')} ({nearbyProjectsList.length})
                  </h3>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>{t('near_me_subtitle')}</small>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="secondary-action"
                    style={{ fontSize: 10, height: 32, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <ArrowUpDown size={13} />
                    {t('near_me_sort_distance')}: {sortOrder === 'asc' ? t('near_me_distance_nearest') : t('near_me_distance_farthest')}
                  </button>
                  <button
                    onClick={() => setShowMapInNearMe(prev => !prev)}
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
                  return (
                    <div
                      key={p.id}
                      className="roster-card"
                      style={{ cursor: 'pointer', textAlign: 'left', position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}
                      onClick={() => { setSelectedProject(p); setGrievanceOpen(false); }}
                    >
                      {/* Top bar with distance and risk badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{
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
                        }}>
                          <MapPin size={11} /> {p.distanceFormatted}
                        </span>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '3px 7px',
                          borderRadius: 5,
                          background: riskInfo.level === 'high' ? '#fee2e2' : riskInfo.level === 'medium' ? '#fef3c7' : '#dcfce7',
                          color: riskInfo.level === 'high' ? '#991b1b' : riskInfo.level === 'medium' ? '#92400e' : '#166534',
                        }}>
                          {riskInfo.text}
                        </span>
                      </div>

                      {/* Title & Sector */}
                      <div className="roster-card-body" style={{ flex: 1 }}>
                        <span className="roster-id" style={{ display: 'block', fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>
                          {p.id} · {p.sector}
                        </span>
                        <strong style={{ fontSize: 13, display: 'block', color: 'var(--ink)', lineHeight: 1.35, marginBottom: 6 }}>
                          {p.name}
                        </strong>
                        <div className="roster-meta" style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--muted)', marginBottom: 8, flexWrap: 'wrap' }}>
                          <span>📍 {p.district || p.constituency}, {p.state}</span>
                          <span>₹{(p.sanctionedAmount / 100000).toFixed(1)}L</span>
                          <span className={`roster-status ${p.status}`}>
                            {p.status === 'completed' ? t('citizen_completed') :
                             p.status === 'in_progress' ? t('citizen_in_progress') :
                             p.status === 'delayed' ? t('citizen_delayed') :
                             t('citizen_under_review')}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="roster-progress-bar" style={{ marginBottom: 4 }}>
                          <i style={{ width: `${p.physicalProgress}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)' }}>
                          <span>{p.physicalProgress}% {t('common_physical').toLowerCase()} {t('common_progress').toLowerCase()}</span>
                          {p.estimatedSiteProgress != null && p.estimatedSiteProgress !== p.physicalProgress && (
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
                          style={{ flex: 1, height: 32, fontSize: 10 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/official/risk/${p.id}`);
                          }}
                        >
                          {t('near_me_view_project')} <ArrowRight size={13} />
                        </button>
                        <button
                          className="secondary-action"
                          style={{ height: 32, fontSize: 10, padding: '0 10px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectProjectWithReset(p);
                            setGrievanceOpen(true);
                          }}
                        >
                          {t('citizen_raise_grievance')}
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
                onClick={() => { selectProjectWithReset(p); }}
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

      {/* ── Project Detail Drawer: Progress Discrepancy & Citizen Evidence Widget ── */}
      {selectedProject && (() => {
        const reportedProgress = selectedProject.physicalProgress ?? 0;
        const visualEstimate = selectedProject.estimatedSiteProgress ?? (selectedProject.isAnomaly ? Math.max(20, reportedProgress - 20) : reportedProgress);
        const discrepancy = Math.abs(reportedProgress - visualEstimate);
        const hasDiscrepancyAlert = discrepancy >= 15;

        return (
          <div className="project-preview-card" style={{ marginTop: 20 }}>
            {/* Drawer Header */}
            <div className="preview-header">
              <div>
                <span className="eyebrow">{t('project_detail_eyebrow')} · {selectedProject.id}</span>
                <h3 style={{ fontSize: 18, margin: '4px 0 2px' }}>{selectedProject.name}</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                  📍 {selectedProject.district || selectedProject.constituency}, {selectedProject.state} · Sector: <b style={{ color: 'var(--ink)' }}>{selectedProject.sector}</b>
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
                <b>₹{(selectedProject.sanctionedAmount / 100000).toFixed(1)}L</b>
              </div>
              <div>
                <span>{t('project_mp_constituency')}</span>
                <b>{selectedProject.constituency}</b>
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
                <b>{selectedProject.status === 'completed' ? t('project_available') : t('project_pending')}</b>
              </div>
              <div>
                <span>{t('project_contractor')}</span>
                <b>{getAgencyName(selectedProject.agency)}</b>
              </div>
            </div>

            {/* ── Progress Discrepancy Analysis ── */}
            <div style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 12,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                  {hi ? 'प्रगति विसंगति विश्लेषण' : 'Physical Progress vs. AI Satellite Visual Estimate'}
                </span>
                {hasDiscrepancyAlert && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: '#fee2e2',
                    color: '#991b1b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
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
                    <div style={{ width: `${reportedProgress}%`, height: '100%', background: '#059669', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>AI Satellite Visual Estimate</span>
                    <span style={{ fontWeight: 800, color: hasDiscrepancyAlert ? '#C85A32' : '#059669' }}>{visualEstimate}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${visualEstimate}%`,
                      height: '100%',
                      background: hasDiscrepancyAlert ? '#C85A32' : '#059669',
                      borderRadius: 4,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Discrepancy Alert Banner */}
              {hasDiscrepancyAlert && (
                <div style={{
                  marginTop: 14,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(200, 90, 50, 0.1)',
                  border: '1px solid rgba(200, 90, 50, 0.3)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}>
                  <AlertTriangle size={18} style={{ color: '#C85A32', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: '#C85A32', lineHeight: 1.45 }}>
                    <strong>⚠️ {discrepancy}-point discrepancy detected between contractor claim and ground visual baseline.</strong> Official reported progress: {reportedProgress}% vs. AI satellite ground baseline: {visualEstimate}%. Independent ground verification by citizens is strongly advised.
                  </div>
                </div>
              )}
            </div>

            {/* ── Citizen Ground Evidence Widget ── */}
            <div style={{
              marginTop: 16,
              padding: 18,
              borderRadius: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} style={{ color: '#059669' }} />
                    {hi ? 'नागरिक जमीनी साक्ष्य एवं सत्यापन' : 'Citizen Ground Evidence & Verification'}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                    {hi ? 'मौके की स्थिति दर्ज करें और वास्तविक प्रगति सत्यापित करने में मदद करें।' : 'Report current ground reality, upload geo-referenced proof, and help verify this public project.'}
                  </p>
                </div>
              </div>

              {evidenceSubmittedToken ? (
                <div style={{
                  padding: 16,
                  borderRadius: 10,
                  background: 'rgba(5, 150, 105, 0.08)',
                  border: '1px solid rgba(5, 150, 105, 0.3)',
                  textAlign: 'center',
                }}>
                  <CheckCircle2 size={32} style={{ color: '#059669', margin: '0 auto 8px' }} />
                  <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#059669' }}>
                    {hi ? 'साक्ष्य सफलतापूर्वक दर्ज हुआ' : 'Ground Evidence Successfully Submitted'}
                  </h4>
                  <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--muted)' }}>
                    {hi ? 'आपका साक्ष्य आधिकारिक जांच प्रणाली में शामिल कर लिया गया है।' : 'Your observation and evidence have been logged with a cryptographic tracking token.'}
                  </p>
                  <div style={{
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
                  }}>
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
                        cursor: 'pointer'
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
                      placeholder={hi ? 'मौके पर क्या देखा — श्रमिकों की संख्या, निर्माण सामग्री, कार्य गति आदि...' : 'Describe visible ground progress, presence of construction equipment, active labor, or physical halts...'}
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
                      style={{ fontSize: 11, height: 34, padding: '0 16px', background: '#059669', borderColor: '#059669' }}
                      onClick={handleEvidenceSubmit}
                    >
                      Submit Citizen Observation
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
