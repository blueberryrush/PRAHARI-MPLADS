import { motion } from 'framer-motion';
import { ArrowRight, Building2, SearchCheck, UserRound, ShieldCheck, Network, Sparkles, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SpeakerButton from '../components/SpeakerButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const { lang, switchLanguage } = useLanguage();
  const hi = lang === 'hi';
  const cards = [
    { icon: Building2, title: hi ? 'कमांड सेंटर' : 'Command Centre', text: hi ? 'मॉनिटर करें और प्राथमिकता तय करें' : 'Monitor, correlate and prioritize', to: '/login?role=official' },
    { icon: SearchCheck, title: hi ? 'जांच केंद्र' : 'Investigation Centre', text: hi ? 'साक्ष्य देखें और सत्यापित करें' : 'Investigate evidence and verify', to: '/login?role=official' },
    { icon: UserRound, title: hi ? 'नागरिक पोर्टल' : 'Citizen Portal', text: hi ? 'काम देखें और अवलोकन साझा करें' : 'Explore works and report observations', to: '/login?role=citizen' },
  ];
  return <div className="landing">
    <header className="landing-nav">
      <div className="brand-lockup"><div className="brand-mark">P</div><div><div className="brand-name">PRAHARI</div><div className="brand-sub">Predictive Risk Analytics for Holistic Accountability & Real-time Intelligence</div></div></div>
      <div className="landing-tools">
        <SpeakerButton text={hi ? 'प्रहरी। एमपीएलएडीएस के लिए समझाने योग्य जोखिम इंटेलिजेंस।' : 'PRAHARI. Explainable risk intelligence for MPLADS.'}/>
        <div className="language-control"><span>EN</span><button className={lang==='en'?'active':''} onClick={()=>switchLanguage('en')}>EN</button><button className={lang==='hi'?'active':''} onClick={()=>switchLanguage('hi')}>हिं</button></div>
      </div>
    </header>
    <main>
      <section className="landing-hero">
        <div className="hero-grid"/>
        <motion.div className="hero-copy" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
          <div className="hero-kicker"><span className="pulse-dot"/> {hi ? 'एमपीएलएडीएस के लिए इंटेलिजेंस लेयर' : 'INTELLIGENCE LAYER FOR MPLADS'}</div>
          <h1>{hi ? 'रिकॉर्ड से आगे।' : 'Beyond the record.'}<br/><em>{hi ? 'कार्रवाई योग्य इंटेलिजेंस।' : 'Actionable intelligence.'}</em></h1>
          <p>{hi ? 'मौजूदा MPLADS डेटा को जोड़कर असामान्य पैटर्न पहचानें, कारण समझें, प्राथमिकता तय करें और मानव सत्यापन तक केस को ट्रैक करें।' : 'Connect existing MPLADS records to detect unusual patterns, understand why they matter, prioritize review, and close the loop with human verification.'}</p>
          <div className="hero-principle"><ShieldCheck size={17}/><span>AI identifies risk. <b>Humans verify.</b></span></div>
        </motion.div>
        <motion.div className="hero-visual" initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{duration:.8,delay:.15}}>
          <div className="intelligence-card">
            <div className="ic-top"><span>LIVE INTELLIGENCE VIEW</span><span className="live-tag"><i/> DEMO DATA</span></div>
            <div className="signal-ring"><div className="ring-core">86<small>/100</small><b>PRIORITY</b></div></div>
            <div className="signal-copy"><span>CASE MPL-4821</span><h3>Village Road Construction</h3><p>3 correlated signals require review</p></div>
            <div className="signal-list"><div><i className="dot red"/><span>Financial anomaly</span><b>HIGH</b></div><div><i className="dot amber"/><span>Spatial overlap</span><b>HIGH</b></div><div><i className="dot sage"/><span>Delay risk</span><b>MEDIUM</b></div></div>
            <div className="ic-flow"><span>DETECT</span><i>→</i><span>CONNECT</span><i>→</i><span>EXPLAIN</span><i>→</i><span>VERIFY</span></div>
          </div>
        </motion.div>
      </section>

      <section className="access-section">
        <div className="section-intro"><span className="eyebrow">ONE PLATFORM · THREE VIEWS</span><h2>{hi ? 'आप PRAHARI का उपयोग कैसे करना चाहते हैं?' : 'How would you like to access PRAHARI?'}</h2><p>{hi ? 'एक ही intelligence layer, भूमिका के अनुसार अलग अनुभव।' : 'One intelligence layer, tailored to the job at hand.'}</p></div>
        <div className="access-grid">{cards.map((c,i)=>{const I=c.icon;return <motion.button className="access-card" key={c.title} onClick={()=>navigate(c.to)} whileHover={{y:-5}} transition={{duration:.2}}><div className="access-number">0{i+1}</div><div className="access-icon"><I size={21}/></div><div className="access-text"><h3>{c.title}</h3><p>{c.text}</p></div><ArrowRight className="access-arrow" size={18}/></motion.button>})}</div>
      </section>

      <section className="story-strip">
        <div><Sparkles size={18}/><span>DETECT</span></div><i>→</i><div><Network size={18}/><span>CONNECT</span></div><i>→</i><div><SearchCheck size={18}/><span>EXPLAIN</span></div><i>→</i><div><ShieldCheck size={18}/><span>PRIORITIZE</span></div><i>→</i><div><UserRound size={18}/><span>VERIFY</span></div>
      </section>
    </main>
  </div>
}
