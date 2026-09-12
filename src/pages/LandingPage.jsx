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
import CivicMap from '../components/map/CivicMap';

export default function LandingPage() {
  const navigate = useNavigate();
  const { lang, switchLanguage } = useLanguage();
  const hi = lang === 'hi';

  const [authModalOpen, setAuthModalOpen] = useState(false);

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

        {/* =============================================================
            LIVE DISTRICT SURVEILLANCE INTERACTIVE MAP (CIVICMAP)
        ============================================================= */}
        <section className="my-12 px-6 max-w-7xl mx-auto" style={{ width: '100%', boxSizing: 'border-box' }}>
          <CivicMap
            title={hi ? 'वाराणसी ब्लॉक स्तर निगरानी मानचित्र' : 'Varanasi District Public Monitoring Map'}
            subtitle={hi 
              ? 'पिंडरा, शिवपुर, काशी और रोहनिया ब्लॉकों में जारी विकास कार्यों की स्थिति देखें' 
              : 'Explore public projects across Kashi, Pindra, Shivpur and Rohaniya blocks in real time'}
            height={480}
            showFilters={true}
          />
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
