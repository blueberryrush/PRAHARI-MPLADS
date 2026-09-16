import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  SearchCheck,
  UserRound,
  ShieldCheck,
  Network,
  Sparkles,
  MapPin,
  AlertTriangle,
  Layers,
  Activity,
  BarChart3,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCaseContext } from '../contexts/CaseContext';
import { projects as mockProjects } from '../data/mockData';
import { fetchProjects } from '../api/client';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import IndiaDrilldownMap from '../components/IndiaDrilldownMap';
import ErrorBoundary from '../components/common/ErrorBoundary';
import AuthModal from '../components/auth/AuthModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isOfficial, isCommandOfficer, isInvestigationOfficer } = useAuth();
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const hi = lang === 'hi';

  const [projectsData, setProjectsData] = useState([]);

  useEffect(() => {
    let isCancelled = false;
    async function loadAllProjects() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects?limit=5000`);
        if (res.ok) {
          const data = await res.json();
          const allWorks = Array.isArray(data) ? data : (data?.projects || data?.works || []);
          if (!isCancelled && allWorks.length > 0) {
            setProjectsData(allWorks);
            return;
          }
        }
      } catch {
        // Fallback to client bridge
      }

      try {
        const clientRes = await fetchProjects();
        if (!isCancelled && clientRes.ok && clientRes.data?.length > 0) {
          setProjectsData(clientRes.data);
        }
      } catch {
        // Fallback to mock data if offline
      }
    }

    loadAllProjects();
    return () => {
      isCancelled = true;
    };
  }, []);

  let caseContext = null;
  try {
    caseContext = useCaseContext();
  } catch {}

  const activeProjects = useMemo(() => {
    if (projectsData && projectsData.length > 0) return projectsData;
    const cp = caseContext?.projects;
    return cp && cp.length > 0 ? cp : mockProjects;
  }, [projectsData, caseContext?.projects]);

  const totalAnomaliesCount = useMemo(() => {
    return (activeProjects || []).filter((p) => {
      const score = Number(p.composite_risk_score ?? p.riskScore ?? 0);
      return score >= 60 || p.isAnomaly || String(p.review_priority || '').includes('HIGH');
    }).length;
  }, [activeProjects]);

  // Selected or hovered project in the live split-screen radar
  const [hoveredProject, setHoveredProject] = useState(null);
  const [selectedMapState, setSelectedMapState] = useState('');

  // Official & Citizen Role-Based Authentication & Clearance Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTarget, setAuthModalTarget] = useState('COMMAND_CENTER');

  const openAuthModal = (target = 'COMMAND_CENTER') => {
    setAuthModalTarget(target);
    setAuthModalOpen(true);
  };

  // Check URL query param for auth requests e.g. /?auth=citizen
  useEffect(() => {
    const authQuery = searchParams.get('auth');
    if (authQuery) {
      const q = authQuery.toLowerCase();
      if (q === 'citizen') {
        openAuthModal('CITIZEN');
      } else if (q === 'investigation' || q === 'investigator') {
        openAuthModal('INVESTIGATION_CENTER');
      } else if (q === 'command' || q === 'official' || q === 'da') {
        openAuthModal('COMMAND_CENTER');
      }
    }
  }, [searchParams]);

  const handleCardClick = (card) => {
    if (card.portal === 'COMMAND_CENTER') {
      if (user && (isCommandOfficer || user.role === 'district_authority')) {
        navigate('/dashboard');
      } else {
        openAuthModal('COMMAND_CENTER');
      }
    } else if (card.portal === 'INVESTIGATION_CENTER') {
      if (user && (isInvestigationOfficer || user.role === 'investigator')) {
        navigate('/investigation');
      } else {
        openAuthModal('INVESTIGATION_CENTER');
      }
    } else {
      // Citizen portal
      if (user) {
        navigate('/citizen');
      } else {
        openAuthModal('CITIZEN');
      }
    }
  };

  const cards = [
    {
      step: '01',
      icon: Building2,
      portal: 'COMMAND_CENTER',
      title: hi ? 'कमांड सेंटर' : 'Command Centre',
      text: hi
        ? 'परियोजनाओं की निगरानी, सहसंबंध विश्लेषण और प्राथमिकता निर्धारण।'
        : 'Monitor, correlate and prioritize high-risk public works across districts.',
      to: '/dashboard',
      cta: hi ? 'कमांड सेंटर खोलें' : 'Open Command Centre',
    },
    {
      step: '02',
      icon: SearchCheck,
      portal: 'INVESTIGATION_CENTER',
      title: hi ? 'जांच केंद्र' : 'Investigation Centre',
      text: hi
        ? 'स्थानिक विसंगतियों की जांच करें, साक्ष्य का विश्लेषण करें और सत्यापन पूर्ण करें।'
        : 'Investigate evidence and verify geospatial anomalies, duplicate works, and directives.',
      to: '/investigation',
      cta: hi ? 'जांच डेस्क खोलें' : 'Open Investigation Desk',
    },
    {
      step: '03',
      icon: UserRound,
      portal: 'CITIZEN',
      title: hi ? 'नागरिक पोर्टल' : 'Citizen Portal',
      text: hi
        ? 'अपने क्षेत्र के कार्य देखें और जमीनी साक्ष्य एवं फोटो साझा करें।'
        : 'Explore works and report observations with live geospatial maps and ground evidence.',
      to: '/citizen',
      cta: hi ? 'नागरिक पोर्टल खोलें' : 'Open Citizen Portal',
    },
  ];

  return (
    <div className="landing">
      {/* ── UNIFIED NAVBAR (No Sign In Button) ── */}
      <Navbar />

      <main>
        {/* ── HERO SECTION ── */}
        <section className="landing-hero">
          <div className="hero-grid" />
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="hero-kicker">
              <span className="pulse-dot" />{' '}
              {hi ? 'एमपीएलएडीएस के लिए इंटेलिजेंस लेयर' : 'INTELLIGENCE LAYER FOR MPLADS'}
            </div>
            <h1 className="text-stone-900 dark:text-stone-100">
              {hi ? 'रिकॉर्ड से आगे।' : 'Beyond the record.'}
              <br />
              <em>{hi ? 'कार्रवाई योग्य इंटेलिजेंस।' : 'Actionable intelligence.'}</em>
            </h1>
            <p className="text-stone-600 dark:text-stone-400">
              {hi
                ? 'मौजूदा MPLADS डेटा को जोड़कर असामान्य पैटर्न पहचानें, कारण समझें, प्राथमिकता तय करें और मानव सत्यापन तक केस को ट्रैक करें।'
                : 'Connect existing MPLADS records to detect unusual patterns, understand why they matter, prioritize review, and close the loop with human verification.'}
            </p>
            <div className="hero-principle">
              <ShieldCheck size={17} />
              <span>
                {hi ? (
                  <>
                    एआई जोखिम की पहचान करता है। <b>मानव सत्यापन करते हैं।</b>
                  </>
                ) : (
                  <>
                    AI identifies risk. <b>Humans verify.</b>
                  </>
                )}
              </span>
            </div>
          </motion.div>

          {/* ── HERO FLOATING INTELLIGENCE CARD (Always High-Contrast Forest Terminal) ── */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <div
              className="intelligence-card"
              style={{
                background: '#153428',
                border: '1.5px solid #2D5A3E',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
                color: '#FFFFFF',
              }}
            >
              {/* Card Header */}
              <div
                className="ic-top"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#6EE7B7',
                }}
              >
                <span>{hi ? 'सक्रिय इंटेलिजेंस दृश्य' : 'LIVE INTELLIGENCE VIEW'}</span>
                <span
                  className="live-tag"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(5, 150, 105, 0.35)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    color: '#A7F3D0',
                    fontSize: '9px',
                    fontWeight: 800,
                  }}
                >
                  <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                  {hi ? 'सत्यापित लाइव डेटा' : 'LIVE RADAR'}
                </span>
              </div>

              {/* Signal Ring & Big Score */}
              <div
                className="signal-ring"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  border: '2.5px solid rgba(248, 113, 113, 0.75)',
                  borderLeftColor: 'transparent',
                  borderBottomColor: 'rgba(52, 211, 153, 0.8)',
                  margin: '22px auto 14px',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 0 20px rgba(248, 113, 113, 0.2)',
                }}
              >
                <div className="ring-core" style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'monospace' }}>
                    86
                  </span>
                  <small style={{ fontSize: '11px', fontWeight: 700, color: '#A7F3D0', marginLeft: '1px' }}>
                    /100
                  </small>
                  <b
                    style={{
                      display: 'block',
                      fontSize: '8.5px',
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      color: '#F87171',
                      marginTop: '2px',
                    }}
                  >
                    {hi ? 'उच्च प्राथमिकता' : 'PRIORITY'}
                  </b>
                </div>
              </div>

              {/* Signal Copy */}
              <div className="signal-copy" style={{ textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#6EE7B7',
                    fontFamily: 'monospace',
                  }}
                >
                  {hi ? 'केस UP-VAR-2024-001' : 'CASE UP-VAR-2024-001'}
                </span>
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    margin: '4px 0 2px',
                    color: '#FFFFFF',
                    lineHeight: 1.3,
                  }}
                >
                  {hi ? 'ग्राम सड़क निर्माण कार्य' : 'Village Road Construction'}
                </h3>
                <p style={{ fontSize: '11px', color: '#D1FAE5', margin: 0, opacity: 0.9 }}>
                  {hi ? '3 संबंधित संकेतों की समीक्षा आवश्यक है' : '3 correlated signals require human review'}
                </p>
              </div>

              {/* Signal List Rows */}
              <div
                className="signal-list"
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  marginTop: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i style={{ width: 7, height: 7, borderRadius: '50%', background: '#F87171', display: 'inline-block' }} />
                    <span style={{ color: '#ECFDF5', fontWeight: 600 }}>
                      {hi ? 'वित्तीय असामान्यता' : 'Financial anomaly'}
                    </span>
                  </div>
                  <b
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#FCA5A5',
                      background: 'rgba(153, 27, 27, 0.6)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(248, 113, 113, 0.4)',
                    }}
                  >
                    HIGH
                  </b>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i style={{ width: 7, height: 7, borderRadius: '50%', background: '#FBBF24', display: 'inline-block' }} />
                    <span style={{ color: '#ECFDF5', fontWeight: 600 }}>
                      {hi ? 'स्थानिक दोहराव' : 'Spatial overlap'}
                    </span>
                  </div>
                  <b
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#FCD34D',
                      background: 'rgba(146, 64, 14, 0.6)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                    }}
                  >
                    HIGH
                  </b>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                    <span style={{ color: '#ECFDF5', fontWeight: 600 }}>
                      {hi ? 'समयसीमा जोखिम' : 'Delay risk'}
                    </span>
                  </div>
                  <b
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#6EE7B7',
                      background: 'rgba(6, 95, 70, 0.6)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                    }}
                  >
                    MEDIUM
                  </b>
                </div>
              </div>

              {/* Bottom Flow */}
              <div
                className="ic-flow"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#6EE7B7',
                  fontFamily: 'monospace',
                }}
              >
                <span>{hi ? 'पहचान' : 'DETECT'}</span>
                <i style={{ fontStyle: 'normal', color: '#F87171' }}>→</i>
                <span>{hi ? 'संबंध' : 'CONNECT'}</span>
                <i style={{ fontStyle: 'normal', color: '#F87171' }}>→</i>
                <span>{hi ? 'व्याख्या' : 'EXPLAIN'}</span>
                <i style={{ fontStyle: 'normal', color: '#F87171' }}>→</i>
                <span>{hi ? 'सत्यापन' : 'VERIFY'}</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* --- MAIN GEOSPATIAL SECTION WRAPPER --- */}
        <section
          style={{
            backgroundColor: '#FAF9F5',
            borderTop: '1px solid #E5E7EB',
            borderBottom: '1px solid #E5E7EB',
            padding: '60px 24px',
            color: '#111827',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '1380px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'row',
              gap: '32px',
              alignItems: 'stretch',
              flexWrap: 'wrap',
            }}
          >
            {/* ===== LEFT COLUMN: KPI METRICS PANEL (FIXED WIDTH) ===== */}
            <div
              style={{
                flex: '0 0 380px',
                minWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Title & Badge */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      display: 'inline-block',
                    }}
                  />
                  Live Geospatial Audit
                </div>

                <h2
                  style={{
                    fontSize: '26px',
                    fontWeight: '800',
                    letterSpacing: '-0.02em',
                    textTransform: 'uppercase',
                    color: '#111827',
                    margin: '0 0 8px 0',
                    lineHeight: '1.2',
                  }}
                >
                  Geospatial Risk Monitor
                </h2>

                <p
                  style={{
                    fontSize: '13px',
                    color: '#4B5563',
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  Geospatial tracking of sanctioned MPLADS infrastructure across parliamentary constituencies.
                </p>
              </div>

              {/* Metric Card 1 */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#6B7280',
                    }}
                  >
                    Total Monitored Works
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    Live from Supabase
                  </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginTop: '6px' }}>
                  {activeProjects.length.toLocaleString()}
                </div>
              </div>

              {/* Metric Card 2 */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#6B7280',
                    }}
                  >
                    Flagged Anomalies
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#FFFBEB',
                      color: '#B45309',
                      border: '1px solid #FDE68A',
                    }}
                  >
                    Sites Requiring Audit
                  </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#D97706', marginTop: '6px' }}>
                  {totalAnomaliesCount.toLocaleString()}
                </div>
              </div>

              {/* Metric Card 3 */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#6B7280',
                    }}
                  >
                    Geo-demarcated Coverage
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                    }}
                  >
                    Constituency Jittered
                  </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginTop: '6px' }}>
                  98.4%
                </div>
              </div>

              {/* Instructions Box */}
              <div
                style={{
                  backgroundColor: '#F3F4F6',
                  border: '1px dashed #D1D5DB',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '12px',
                  color: '#4B5563',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>💡</span>
                <span>Click any state (e.g. Bihar, Uttar Pradesh) to drill down into localized constituency points.</span>
              </div>
            </div>

            {/* ===== RIGHT COLUMN: FRAMED MAP CONTAINER ===== */}
            <div
              style={{
                flex: '1 1 650px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '24px',
                padding: '24px',
                position: 'relative',
                minHeight: '620px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'none',
                overflow: 'hidden',
              }}
            >
              <ErrorBoundary fallbackTitle="Geographic Map Boundary Viewer">
                <IndiaDrilldownMap
                  projects={activeProjects}
                  selectedState={selectedMapState}
                  onProjectHover={(p) => {
                    if (p) setHoveredProject(p);
                  }}
                  onProjectSelect={(p) => {
                    if (p) setHoveredProject(p);
                  }}
                  onStateChange={(state) => {
                    setSelectedMapState(state || '');
                    if (!state) setHoveredProject(null);
                  }}
                  onSelectState={(state) => {
                    setSelectedMapState(state || '');
                    if (!state) setHoveredProject(null);
                  }}
                  hidePopup={false}
                  borderless={true}
                  hideToolbar={true}
                  hideSelectionCard={true}
                />
              </ErrorBoundary>
            </div>
          </div>
        </section>

        {/* ── THREE PORTAL VIEWS ── */}
        <section className="access-section">
          <div className="section-intro">
            <span className="eyebrow">{hi ? 'एक मंच · तीन दृष्टिकोण' : 'ONE PLATFORM · THREE VIEWS'}</span>
            <h2 className="text-stone-900 dark:text-stone-100">
              {hi ? 'आप PRAHARI का उपयोग कैसे करना चाहते हैं?' : 'How would you like to access PRAHARI?'}
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              {hi
                ? 'एक ही intelligence layer, भूमिका के अनुसार अलग अनुभव।'
                : 'One intelligence layer, tailored to the job at hand.'}
            </p>
          </div>
          <div className="access-grid">
            {cards.map((c) => {
              const I = c.icon;
              return (
                <motion.button
                  className="access-card"
                  key={c.title}
                  onClick={() => handleCardClick(c)}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: isDark ? '#1c1917' : '#FFFFFF',
                    border: isDark ? '1px solid #292524' : '1px solid #E7E5E4',
                  }}
                >
                  <div className="access-number text-xs font-mono font-semibold text-stone-400 dark:text-stone-500">
                    {c.step}
                  </div>
                  <div
                    className="access-icon"
                    style={{
                      background: isDark ? 'rgba(5, 150, 105, 0.2)' : '#E8EFE9',
                      color: '#059669',
                    }}
                  >
                    <I size={22} />
                  </div>
                  <div className="access-text">
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white">{c.title}</h3>
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mt-1">{c.text}</p>
                  </div>
                  <div
                    style={{
                      marginTop: 16,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#059669',
                    }}
                  >
                    <span>{c.cta}</span>
                    <ArrowRight size={14} className="access-arrow" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ── WORKFLOW STEP RIBBON (Positioned directly under 3 cards) ── */}
          <div
            className="story-strip text-xs font-semibold tracking-wider text-stone-700 dark:text-stone-300"
            style={{
              background: isDark ? '#141210' : '#F7F6F2',
              border: isDark ? '1px solid #292524' : '1px solid var(--line)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              margin: '32px 0 0 0',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: '#059669' }} />
              <span>{hi ? 'पहचान' : 'DETECT'}</span>
            </div>
            <i style={{ color: '#059669', fontStyle: 'normal' }}>→</i>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Network size={16} style={{ color: '#059669' }} />
              <span>{hi ? 'संबंध' : 'CONNECT'}</span>
            </div>
            <i style={{ color: '#059669', fontStyle: 'normal' }}>→</i>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SearchCheck size={16} style={{ color: '#059669' }} />
              <span>{hi ? 'व्याख्या' : 'EXPLAIN'}</span>
            </div>
            <i style={{ color: '#059669', fontStyle: 'normal' }}>→</i>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} style={{ color: '#059669' }} />
              <span>{hi ? 'प्राथमिकता' : 'PRIORITIZE'}</span>
            </div>
            <i style={{ color: '#059669', fontStyle: 'normal' }}>→</i>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserRound size={16} style={{ color: '#059669' }} />
              <span>{hi ? 'सत्यापन' : 'VERIFY'}</span>
            </div>
          </div>
        </section>
      </main>

      {/* ── PRAHARI CIVIC ENTERPRISE FOOTER ── */}
      <Footer />

      {/* ── ROLE-BASED AUTHENTICATION & CLEARANCE MODAL ── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        targetPortal={authModalTarget}
      />
    </div>
  );
}
