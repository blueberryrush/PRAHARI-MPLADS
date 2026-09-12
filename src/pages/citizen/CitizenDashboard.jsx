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
  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'locating' | 'success' | 'denied' | 'demo'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [showMapInNearMe, setShowMapInNearMe] = useState(true);

  const requestLocation = () => {
    setActiveTab('near');
    if (userLocation) return;
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
          setGeoStatus('denied');
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setGeoStatus('denied');
    }
  };

  const handleUseDemoLocation = () => {
    setUserLocation({
      lat: GHAZIABAD_DEMO_COORDS.lat,
      lng: GHAZIABAD_DEMO_COORDS.lng,
      isDemo: true,
      district: GHAZIABAD_DEMO_COORDS.district,
      state: GHAZIABAD_DEMO_COORDS.state,
      name: GHAZIABAD_DEMO_COORDS.name,
    });
    setGeoStatus('demo');
    setState(GHAZIABAD_DEMO_COORDS.state);
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
                setSelectedProject(proj);
                setGrievanceOpen(false);
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
              <option value="">{t('citizen_all_india')} — Choose a state to drilldown</option>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="near-btn" onClick={requestLocation}>
              <LocateFixed size={16} /> {t('citizen_near_me')}
            </button>
          </div>

          <div className="citizen-map panel" style={{ height: 440 }}>
            <IndiaDrilldownMap
              projects={filtered}
              selectedState={state}
              onStateChange={setState}
              onDistrictSelect={setSelectedDistrict}
              userLocation={userLocation}
              nearbyProjects={userLocation ? nearbyProjectsList : []}
              onProjectSelect={(proj) => {
                setSelectedProject(proj);
                setGrievanceOpen(false);
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

          {/* Location Denied / Unavailable Fallback */}
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
                    onClick={handleUseDemoLocation}
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
              {userLocation.isDemo && (
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

              {/* Interactive Map */}
              {showMapInNearMe && (
                <div className="citizen-map panel">
                  <IndiaDrilldownMap
                    projects={projects}
                    selectedState={userLocation.state || state}
                    onStateChange={setState}
                    onDistrictSelect={setSelectedDistrict}
                    userLocation={userLocation}
                    nearbyProjects={nearbyProjectsList}
                    onProjectSelect={(proj) => {
                      setSelectedProject(proj);
                      setGrievanceOpen(false);
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
                            setSelectedProject(p);
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
