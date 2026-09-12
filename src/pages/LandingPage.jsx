import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Building2, SearchCheck, UserRound, ShieldCheck, 
  Network, Sparkles, MapPin, Eye, Filter, CheckCircle2, 
  AlertTriangle, DollarSign, Layers, ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SpeakerButton from '../components/SpeakerButton';
import AuthModal from '../components/auth/AuthModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const { lang, switchLanguage } = useLanguage();
  const hi = lang === 'hi';

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeSectorFilter, setActiveSectorFilter] = useState('all'); // 'all' | 'Roadways' | 'Drinking Water' | 'School Infrastructure'
  const [selectedPin, setSelectedPin] = useState(null);

  const cards = [
    { 
      icon: Building2, 
      title: hi ? 'कमांड सेंटर' : 'Command Centre', 
      text: hi ? 'मॉनिटर करें और प्राथमिकता तय करें' : 'Monitor, correlate and prioritize', 
      to: '/login?role=official' 
    },
    { 
      icon: SearchCheck, 
      title: hi ? 'जांच केंद्र' : 'Investigation Centre', 
      text: hi ? 'साक्ष्य देखें और सत्यापित करें' : 'Investigate evidence and verify', 
      to: '/login?role=investigator' 
    },
    { 
      icon: UserRound, 
      title: hi ? 'नागरिक पोर्टल' : 'Citizen Portal', 
      text: hi ? 'काम देखें और अवलोकन साझा करें' : 'Explore works and report observations', 
      to: '/login?role=citizen' 
    },
  ];

  // Varanasi Blocks Surveillance Works
  const districtWorks = [
    {
      id: 'MPL-VNS-0482',
      name: hi ? 'पंचक्रोशी ग्रामीण सड़क चौड़ीकरण' : 'Panchkroshi Rural Road Widening',
      block: 'Pindra',
      blockHi: 'पिंडरा',
      sector: 'Roadways',
      sectorHi: 'सड़क निर्माण',
      sanctioned: 24.0,
      spent: 44.0,
      status: 'priority',
      statusLabel: hi ? 'उच्च समीक्षा प्राथमिकता' : 'High Review Priority',
      statusColor: '#C85A32',
      x: 26,
      y: 28,
      lead: hi ? 'वित्तीय रिलीज भौतिक प्रगति से 183% अधिक' : 'Disbursement 183% ahead of physical progress'
    },
    {
      id: 'MPL-VNS-0219',
      name: hi ? 'सोलर पेयजल पंप एवं आरओ संयंत्र' : 'Solar Dual Pump Drinking Water Plant',
      block: 'Shivpur',
      blockHi: 'शिवपुर',
      sector: 'Drinking Water',
      sectorHi: 'पेयजल सुविधा',
      sanctioned: 14.5,
      spent: 14.5,
      status: 'moderate',
      statusLabel: hi ? 'सत्यापन प्रक्रियाधीन' : 'Verification Required',
      statusColor: '#D97706',
      x: 36,
      y: 52,
      lead: hi ? 'स्थानिक निर्देशांक में 180 मी का विचलन' : 'Observed 180m drift from DPR baseline'
    },
    {
      id: 'MPL-VNS-0104',
      name: hi ? 'स्मार्ट क्लासरूम विंग व प्रयोगशाला' : 'Smart Classroom Wing & Science Lab',
      block: 'Kashi',
      blockHi: 'काशी',
      sector: 'School Infrastructure',
      sectorHi: 'विद्यालय अवसंरचना',
      sanctioned: 35.0,
      spent: 31.5,
      status: 'stable',
      statusLabel: hi ? 'सत्यापित एवं स्थिर' : 'Verified & Stable',
      statusColor: '#059669',
      x: 58,
      y: 50,
      lead: hi ? '१००% माप पुस्तिका व फोटो सत्यापित' : 'MB measurements & geotagged photos verified'
    },
    {
      id: 'MPL-VNS-0781',
      name: hi ? 'संपर्क लिंक मार्ग व आरसीसी पुलिया' : 'Village Connector Link Road & Culvert',
      block: 'Rohaniya',
      blockHi: 'रोहनिया',
      sector: 'Roadways',
      sectorHi: 'सड़क निर्माण',
      sanctioned: 18.0,
      spent: 32.5,
      status: 'priority',
      statusLabel: hi ? 'उच्च समीक्षा प्राथमिकता' : 'High Review Priority',
      statusColor: '#C85A32',
      x: 64,
      y: 76,
      lead: hi ? 'समीपवर्ती कार्य से संभावित दोहराव' : 'Proximity overlap with candidate PRJ001'
    },
    {
      id: 'MPL-VNS-0312',
      name: hi ? 'सामुदायिक जल शुद्धिकरण केंद्र' : 'Community RO Water Filtration Unit',
      block: 'Pindra',
      blockHi: 'पिंडरा',
      sector: 'Drinking Water',
      sectorHi: 'पेयजल सुविधा',
      sanctioned: 8.0,
      spent: 7.2,
      status: 'stable',
      statusLabel: hi ? 'सत्यापित एवं स्थिर' : 'Verified & Stable',
      statusColor: '#059669',
      x: 20,
      y: 42,
      lead: hi ? 'सार्वजनिक पट्टिका एवं जल परीक्षण पूर्ण' : 'Public display installed & water tested'
    },
    {
      id: 'MPL-VNS-0556',
      name: hi ? 'बालिका उच्चतर माध्यमिक पुस्तकालय' : 'Girls Secondary School Library Block',
      block: 'Rohaniya',
      blockHi: 'रोहनिया',
      sector: 'School Infrastructure',
      sectorHi: 'विद्यालय अवसंरचना',
      sanctioned: 22.0,
      spent: 21.0,
      status: 'moderate',
      statusLabel: hi ? 'सत्यापन प्रक्रियाधीन' : 'Verification Required',
      statusColor: '#D97706',
      x: 74,
      y: 64,
      lead: hi ? 'अंतिम किस्त बिलिंग सत्यापन शेष' : 'Final tranche completion inspection pending'
    }
  ];

  const filteredWorks = activeSectorFilter === 'all'
    ? districtWorks
    : districtWorks.filter(w => w.sector === activeSectorFilter);

  const activeWork = selectedPin || filteredWorks[0];

  return (
    <div className="landing">
      {/* Navigation Bar */}
      <header className="landing-nav">
        <div className="brand-lockup" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          {/* Forest Emerald Logo Mark */}
          <div 
            className="brand-mark"
            style={{
              background: '#1E3A2B',
              color: '#34D399',
              border: '1.5px solid #2D5A3E',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)'
            }}
          >
            P
          </div>
          <div>
            <div className="brand-name">PRAHARI</div>
            <div className="brand-sub">
              {hi 
                ? 'समग्र जवाबदेही और वास्तविक समय इंटेलिजेंस के लिए भविष्यसूचक जोखिम विश्लेषण' 
                : 'Predictive Risk Analytics for Holistic Accountability & Real-time Intelligence'}
            </div>
          </div>
        </div>

        <div className="landing-tools">
          <SpeakerButton text={hi ? 'प्रहरी। एमपीएलएडीएस के लिए समझाने योग्य जोखिम इंटेलिजेंस।' : 'PRAHARI. Explainable risk intelligence for MPLADS.'}/>
          <div className="language-control">
            <span>EN</span>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLanguage('en')} type="button">EN</button>
            <button className={lang === 'hi' ? 'active' : ''} onClick={() => switchLanguage('hi')} type="button">हिं</button>
          </div>
          <button
            type="button"
            className="primary-action"
            onClick={() => setAuthModalOpen(true)}
            style={{ height: 34, padding: '0 14px', fontSize: 11, marginLeft: 6 }}
          >
            {hi ? 'प्रवेश करें →' : 'Sign In →'}
          </button>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="landing-hero">
          <div className="hero-grid"/>
          <motion.div className="hero-copy" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
            <div className="hero-kicker"><span className="pulse-dot"/> {hi ? 'एमपीएलएडीएस के लिए इंटेलिजेंस लेयर' : 'INTELLIGENCE LAYER FOR MPLADS'}</div>
            <h1>{hi ? 'रिकॉर्ड से आगे।' : 'Beyond the record.'}<br/><em>{hi ? 'कार्रवाई योग्य इंटेलिजेंस।' : 'Actionable intelligence.'}</em></h1>
            <p>{hi ? 'मौजूदा MPLADS डेटा को जोड़कर असामान्य पैटर्न पहचानें, कारण समझें, प्राथमिकता तय करें और मानव सत्यापन तक केस को ट्रैक करें।' : 'Connect existing MPLADS records to detect unusual patterns, understand why they matter, prioritize review, and close the loop with human verification.'}</p>
            <div className="hero-principle"><ShieldCheck size={17}/><span>{hi ? <>एआई जोखिम की पहचान करता है। <b>मानव सत्यापन करते हैं।</b></> : <>AI identifies risk. <b>Humans verify.</b></>}</span></div>
          </motion.div>

          <motion.div className="hero-visual" initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{duration:.8,delay:.15}}>
            <div className="intelligence-card">
              <div className="ic-top"><span>{hi ? 'सक्रिय इंटेलिजेंस दृश्य' : 'LIVE INTELLIGENCE VIEW'}</span><span className="live-tag"><i/> {hi ? 'डेमो डेटा' : 'DEMO DATA'}</span></div>
              <div className="signal-ring"><div className="ring-core">86<small>/100</small><b>{hi ? 'प्राथमिकता' : 'PRIORITY'}</b></div></div>
              <div className="signal-copy"><span>{hi ? 'केस MPL-4821' : 'CASE MPL-4821'}</span><h3>{hi ? 'ग्राम सड़क निर्माण कार्य' : 'Village Road Construction'}</h3><p>{hi ? '3 संबंधित संकेतों की समीक्षा आवश्यक है' : '3 correlated signals require review'}</p></div>
              <div className="signal-list">
                <div><i className="dot red"/><span>{hi ? 'वित्तीय असामान्यता' : 'Financial anomaly'}</span><b>{hi ? 'उच्च' : 'HIGH'}</b></div>
                <div><i className="dot amber"/><span>{hi ? 'स्थानिक दोहराव' : 'Spatial overlap'}</span><b>{hi ? 'उच्च' : 'HIGH'}</b></div>
                <div><i className="dot sage"/><span>{hi ? 'समयसीमा जोखिम' : 'Delay risk'}</span><b>{hi ? 'मध्यम' : 'MEDIUM'}</b></div>
              </div>
              <div className="ic-flow">
                <span>{hi ? 'पहचान' : 'DETECT'}</span><i>→</i>
                <span>{hi ? 'संबंध' : 'CONNECT'}</span><i>→</i>
                <span>{hi ? 'व्याख्या' : 'EXPLAIN'}</span><i>→</i>
                <span>{hi ? 'सत्यापन' : 'VERIFY'}</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* THREE PORTAL VIEWS */}
        <section className="access-section">
          <div className="section-intro">
            <span className="eyebrow">{hi ? 'एक मंच · तीन दृष्टिकोण' : 'ONE PLATFORM · THREE VIEWS'}</span>
            <h2>{hi ? 'आप PRAHARI का उपयोग कैसे करना चाहते हैं?' : 'How would you like to access PRAHARI?'}</h2>
            <p>{hi ? 'एक ही intelligence layer, भूमिका के अनुसार अलग अनुभव।' : 'One intelligence layer, tailored to the job at hand.'}</p>
          </div>
          <div className="access-grid">
            {cards.map((c,i)=>{
              const I=c.icon;
              return (
                <motion.button 
                  className="access-card" 
                  key={c.title} 
                  onClick={()=>navigate(c.to)} 
                  whileHover={{y:-5}} 
                  transition={{duration:.2}}
                >
                  <div className="access-number">0{i+1}</div>
                  <div className="access-icon"><I size={21}/></div>
                  <div className="access-text">
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </div>
                  <ArrowRight className="access-arrow" size={18}/>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* =============================================================
            4. PUBLIC INTERACTIVE MONITORING MAP SECTION (Prior to Login)
        ============================================================= */}
        <section className="public-surveillance-section" style={{ padding: '64px 8%', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span className="eyebrow" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="pulse-dot" style={{ background: '#059669' }} />
                  {hi ? 'पारदर्शी सार्वजनिक निगरानी' : 'LIVE DISTRICT SURVEILLANCE'}
                </span>
                <h2 style={{ fontSize: 28, letterSpacing: '-0.03em', margin: '6px 0 4px' }}>
                  {hi ? 'वाराणसी ब्लॉक स्तर निगरानी मानचित्र' : 'Varanasi District Public Monitoring Map'}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                  {hi 
                    ? 'पिंडरा, शिवपुर, काशी और रोहनिया ब्लॉकों में जारी विकास कार्यों की स्थिति देखें' 
                    : 'Explore public projects across Kashi, Pindra, Shivpur and Rohaniya blocks in real time'}
                </p>
              </div>

              {/* Quick Filter Chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: hi ? 'सभी कार्य' : 'All Works' },
                  { key: 'Roadways', label: hi ? 'सड़क निर्माण' : 'Roadways' },
                  { key: 'Drinking Water', label: hi ? 'पेयजल' : 'Drinking Water' },
                  { key: 'School Infrastructure', label: hi ? 'विद्यालय अवसंरचना' : 'School Infrastructure' },
                ].map(chip => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => {
                      setActiveSectorFilter(chip.key);
                      setSelectedPin(null);
                    }}
                    style={{
                      background: activeSectorFilter === chip.key ? '#1E3A2B' : '#fff',
                      color: activeSectorFilter === chip.key ? '#34D399' : 'var(--ink)',
                      border: activeSectorFilter === chip.key ? '1px solid #2D5A3E' : '1px solid var(--line)',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: activeSectorFilter === chip.key ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none'
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Canvas with Floating Card */}
            <div 
              style={{ 
                position: 'relative', 
                height: 480, 
                background: '#EDEBE6', 
                borderRadius: 20, 
                overflow: 'hidden',
                border: '1px solid var(--line)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              {/* SVG Map Canvas with Varanasi Block Contours */}
              <svg 
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                viewBox="0 0 800 480"
                preserveAspectRatio="none"
              >
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(60, 97, 78, 0.05)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Block Polygons */}
                {/* Block 1: Pindra (North/NW) */}
                <polygon 
                  points="60,40 320,30 290,210 90,230" 
                  fill="rgba(255, 255, 255, 0.65)" 
                  stroke="rgba(60, 97, 78, 0.2)" 
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text x="180" y="80" fill="rgba(60, 97, 78, 0.45)" fontSize="13" fontWeight="800" letterSpacing="0.1em">
                  PINDRA BLOCK / पिंडरा
                </text>

                {/* Block 2: Shivpur (Central-West) */}
                <polygon 
                  points="100,235 300,215 360,330 180,360" 
                  fill="rgba(255, 255, 255, 0.55)" 
                  stroke="rgba(60, 97, 78, 0.2)" 
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text x="210" y="270" fill="rgba(60, 97, 78, 0.45)" fontSize="13" fontWeight="800" letterSpacing="0.1em">
                  SHIVPUR BLOCK / शिवपुर
                </text>

                {/* Block 3: Kashi (East / Urban Core) */}
                <polygon 
                  points="330,35 600,40 640,280 370,320" 
                  fill="rgba(255, 255, 255, 0.75)" 
                  stroke="rgba(60, 97, 78, 0.2)" 
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text x="440" y="100" fill="rgba(60, 97, 78, 0.45)" fontSize="13" fontWeight="800" letterSpacing="0.1em">
                  KASHI URBAN / काशी
                </text>

                {/* Ganga River stylized curve */}
                <path 
                  d="M 640,60 Q 560,220 740,440" 
                  fill="none" 
                  stroke="#5B8F91" 
                  strokeWidth="10" 
                  strokeOpacity="0.35"
                />
                <text x="660" y="260" fill="#5B8F91" fontSize="11" fontWeight="700" opacity="0.6">
                  Ganga River ~ गंगा नदी
                </text>

                {/* Block 4: Rohaniya (South) */}
                <polygon 
                  points="375,325 635,285 710,450 310,440" 
                  fill="rgba(255, 255, 255, 0.6)" 
                  stroke="rgba(60, 97, 78, 0.2)" 
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text x="470" y="380" fill="rgba(60, 97, 78, 0.45)" fontSize="13" fontWeight="800" letterSpacing="0.1em">
                  ROHANIYA BLOCK / रोहनिया
                </text>
              </svg>

              {/* Interactive Pulsing Map Pins */}
              {filteredWorks.map((work) => {
                const isSelected = activeWork?.id === work.id;
                return (
                  <button
                    key={work.id}
                    type="button"
                    onClick={() => setSelectedPin(work)}
                    style={{
                      position: 'absolute',
                      left: `${work.x}%`,
                      top: `${work.y}%`,
                      transform: 'translate(-50%, -50%)',
                      border: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                      zIndex: isSelected ? 30 : 10
                    }}
                    title={`${work.name} (${work.statusLabel})`}
                  >
                    {/* Animated Pulsing Ring */}
                    <span 
                      style={{
                        position: 'absolute',
                        inset: -8,
                        borderRadius: '50%',
                        background: work.statusColor,
                        opacity: 0.25,
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    />

                    {/* Outer Circle */}
                    <div style={{
                      width: isSelected ? 34 : 28,
                      height: isSelected ? 34 : 28,
                      borderRadius: '50%',
                      background: work.statusColor,
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: `0 0 0 3px #fff, 0 4px 12px ${work.statusColor}88`,
                      transition: 'all 0.2s ease'
                    }}>
                      <MapPin size={isSelected ? 18 : 14} />
                    </div>
                  </button>
                );
              })}

              {/* Map Legend (Bottom-Left) */}
              <div 
                style={{
                  position: 'absolute',
                  left: 18,
                  bottom: 18,
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 11,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  zIndex: 20
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#C85A32', display: 'inline-block' }} />
                  <span>{hi ? 'उच्च समीक्षा प्राथमिकता' : 'High Review Priority'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                  <span>{hi ? 'सत्यापन प्रक्रियाधीन' : 'Verification Required'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                  <span>{hi ? 'सत्यापित एवं स्थिर' : 'Verified & Stable'}</span>
                </div>
              </div>

              {/* Floating Project Intelligence Card (Top-Right) */}
              {activeWork && (
                <motion.div
                  key={activeWork.id}
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: 18,
                    right: 18,
                    width: 320,
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 14,
                    padding: 18,
                    border: '1px solid var(--line)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 25
                  }}
                >
                  {/* Card Top: Code & Status Chip */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <code style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>{activeWork.id}</code>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: `${activeWork.statusColor}18`,
                      color: activeWork.statusColor
                    }}>
                      {activeWork.statusLabel}
                    </span>
                  </div>

                  {/* Title & Block */}
                  <h4 style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.3 }}>{activeWork.name}</h4>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
                    Block: <b>{hi ? activeWork.blockHi : activeWork.block}</b> · Sector: <b>{hi ? activeWork.sectorHi : activeWork.sector}</b>
                  </div>

                  {/* Financial Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    padding: 10,
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    marginBottom: 12
                  }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>{hi ? 'स्वीकृत राशि' : 'Sanctioned'}</span>
                      <b style={{ fontSize: 13, color: 'var(--ink)' }}>₹{activeWork.sanctioned.toFixed(1)} Lakh</b>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>{hi ? 'खर्च / रिलीज' : 'Spent Amount'}</span>
                      <b style={{ fontSize: 13, color: activeWork.spent > activeWork.sanctioned ? '#C85A32' : '#059669' }}>
                        ₹{activeWork.spent.toFixed(1)} Lakh
                      </b>
                    </div>
                  </div>

                  {/* Signal note */}
                  <p style={{ margin: '0 0 14px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    ℹ️ {activeWork.lead}
                  </p>

                  {/* Prompt Action: Login to View Full Case Dossier */}
                  <button
                    type="button"
                    className="primary-action full"
                    onClick={() => setAuthModalOpen(true)}
                    style={{
                      height: 38,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <span>{hi ? 'पूर्ण केस डोजियर देखें (लॉगिन) →' : 'Login to View Full Case Dossier →'}</span>
                  </button>
                </motion.div>
              )}

            </div>

          </div>
        </section>

        {/* WORKFLOW STORY STRIP */}
        <section className="story-strip">
          <div><Sparkles size={18}/><span>{hi ? 'पहचान' : 'DETECT'}</span></div><i>→</i>
          <div><Network size={18}/><span>{hi ? 'संबंध' : 'CONNECT'}</span></div><i>→</i>
          <div><SearchCheck size={18}/><span>{hi ? 'व्याख्या' : 'EXPLAIN'}</span></div><i>→</i>
          <div><ShieldCheck size={18}/><span>{hi ? 'प्राथमिकता' : 'PRIORITIZE'}</span></div><i>→</i>
          <div><UserRound size={18}/><span>{hi ? 'सत्यापन' : 'VERIFY'}</span></div>
        </section>
      </main>

      {/* Auth Modal Triggered from Public Portal Map */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultRole="official" 
      />
    </div>
  );
}
