import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Globe2, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import SpeakerButton from '../components/SpeakerButton';

export default function LoginPage() {
  const { lang, switchLanguage } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedRole = params.get('role');
  const [role,setRole] = useState(requestedRole === 'citizen' ? 'citizen' : 'official');
  const [officialRole,setOfficialRole] = useState(requestedRole === 'investigator' ? 'investigator' : 'district_authority');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [show,setShow]=useState(false);
  const [error,setError]=useState('');
  const hi=lang==='hi';
  useEffect(()=>{
    if (params.get('role') === 'citizen') {
      setRole('citizen');
    } else if (params.get('role') === 'investigator') {
      setRole('official');
      setOfficialRole('investigator');
    } else if (params.get('role') === 'official') {
      setRole('official');
      setOfficialRole('district_authority');
    }
  },[params]);

  const submit=e=>{
    e.preventDefault();
    if(!email||!password){
      setError(hi?'ईमेल और पासवर्ड भरें':'Enter email and password');
      return;
    }
    const finalRole=role==='official'?officialRole:'citizen';
    const r=login(email,password,finalRole);
    if(r.success) {
      if (finalRole === 'investigator') {
        navigate('/official/investigations');
      } else if (finalRole === 'citizen') {
        navigate('/citizen');
      } else {
        navigate('/official/dashboard');
      }
    }
  };
  return <div className="auth-modern">
    <button className="auth-back" onClick={()=>navigate('/')}><ArrowLeft size={16}/> {hi ? 'PRAHARI पर वापस जाएं' : 'Back to PRAHARI'}</button>
    <div className="auth-shell">
      <motion.section className="auth-brand-panel" initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}}>
        <div className="brand-lockup"><div className="brand-mark">P</div><div><div className="brand-name">PRAHARI</div><div className="brand-sub">{hi ? 'एमपीएलएडीएस इंटेलिजेंस' : 'MPLADS Intelligence'}</div></div></div>
        <div className="auth-visual"><div className="auth-orbit"/><div className="auth-core"><ShieldCheck size={28}/><span>{hi ? 'सत्यापन' : 'VERIFY'}</span></div><div className="auth-node a"><Building2 size={16}/></div><div className="auth-node b"><MapPin size={16}/></div><div className="auth-node c"><UserRound size={16}/></div></div>
        <div>
          <span className="eyebrow">{hi ? 'एकीकृत इंटेलिजेंस परत' : 'ONE INTELLIGENCE LAYER'}</span>
          <h2>{hi ? <>पहचानें क्या ध्यान देने योग्य है।<br/><em>फिर सत्यापित करें।</em></> : <>Find what needs attention.<br/><em>Then prove it.</em></>}</h2>
          <p>{hi ? 'जोखिम संकेत वित्तीय, स्थानिक, समयसीमा और साक्ष्य पैटर्न को जोड़ते हैं ताकि समीक्षक अपना समय वहीं लगाएं जहां यह सबसे अधिक मायने रखता है।' : 'Risk signals connect financial, spatial, temporal and evidence patterns so reviewers can spend time where it matters.'}</p>
        </div>
      </motion.section>
      <motion.section className="auth-form-panel" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}>
        <div className="auth-top"><div><span className="eyebrow">{hi?'सुरक्षित डेमो एक्सेस':'SECURE DEMO ACCESS'}</span><h1>{hi?'PRAHARI में प्रवेश करें':'Enter PRAHARI'}</h1><p>{hi?'अपनी भूमिका चुनें और डेमो वर्कस्पेस खोलें।':'Choose your role to open the right workspace.'}</p></div><div className="language-control"><Globe2 size={15}/><button className={lang==='en'?'active':''} onClick={()=>switchLanguage('en')}>EN</button><button className={lang==='hi'?'active':''} onClick={()=>switchLanguage('hi')}>हिं</button></div></div>
        <SpeakerButton text={hi?'PRAHARI में प्रवेश करें। अपनी भूमिका चुनें और डेमो वर्कस्पेस खोलें।':'Enter PRAHARI. Choose your role to open the right workspace.'}/>
        <div className="login-context">
          {role==='official' && officialRole === 'investigator' ? (
            <>
              <div className="context-icon"><SearchCheck size={17}/></div>
              <div>
                <span>{hi ? 'जांच डेस्क पहुंच' : 'INVESTIGATION DESK'}</span>
                <b>{hi ? 'जांच अधिकारी कार्यक्षेत्र' : 'Investigator / Field Officer'}</b>
                <small>{hi ? 'सक्रिय केस समीक्षा, साक्ष्य सत्यापन एवं फील्ड निष्कर्ष' : 'Active Case Review, Evidence & On-site Outcomes'}</small>
              </div>
            </>
          ) : role==='official' ? (
            <>
              <div className="context-icon"><Building2 size={17}/></div>
              <div>
                <span>{hi ? 'प्राधिकरण पहुंच' : 'AUTHORITY ACCESS'}</span>
                <b>{hi ? 'जिला प्राधिकरण कार्यक्षेत्र' : 'District Authority Workspace'}</b>
                <small>{hi ? 'कमांड सेंटर एवं जिला निगरानी' : 'Command Centre & District Monitoring'}</small>
              </div>
            </>
          ) : (
            <>
              <div className="context-icon"><UserRound size={17}/></div>
              <div><span>{hi ? 'नागरिक पहुंच' : 'CITIZEN ACCESS'}</span><b>{hi ? 'सार्वजनिक कार्यक्षेत्र' : 'Public workspace'}</b><small>{hi ? 'कार्य देखें और अवलोकन प्रस्तुत करें' : 'Explore works & submit observations'}</small></div>
            </>
          )}
        </div>
        {role==='official'&&<div className="official-role">
          <label>{hi ? 'प्राधिकरण संदर्भ' : 'Authority context'}</label>
          <select value={officialRole} onChange={e=>setOfficialRole(e.target.value)}>
            <option value="district_authority">{hi ? 'जिला प्राधिकरण · वाराणसी (कमांड सेंटर)' : 'District Authority · Varanasi (Command Centre)'}</option>
            <option value="investigator">{hi ? 'जांच डेस्क / फील्ड ऑफिसर (जांच केंद्र)' : 'Investigation Desk / Field Officer (Workspace)'}</option>
            <option value="state_nodal">{hi ? 'राज्य नोडल प्राधिकरण · उत्तर प्रदेश' : 'State Nodal Authority · Uttar Pradesh'}</option>
            <option value="ministry">{hi ? 'केंद्रीय / मंत्रालय दृश्य' : 'Central / Ministry View'}</option>
            <option value="mp">{hi ? 'सांसद कार्यालय · वाराणसी' : 'MP Office · Varanasi'}</option>
          </select>
        </div>}
        <form onSubmit={submit}>
          <label>{hi ? 'ईमेल' : 'Email'}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="demo@example.com"/></label>
          <label>{hi ? 'पासवर्ड' : 'Password'}<div className="password-input"><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
          {error&&<div className="form-error">{error}</div>}
          <button className="primary-action full" type="submit">{hi ? 'आगे बढ़ें' : 'Continue'} <ArrowRight size={16}/></button>
        </form>
        <div className="auth-foot"><Link to="/">{hi ? 'होमपेज पर वापस जाएं' : 'Return home'}</Link><span>·</span><span>{hi ? 'निष्कर्षों के लिए हमेशा मानवीय सत्यापन आवश्यक है।' : 'Human verification is always required for conclusions.'}</span></div>
      </motion.section>
    </div>
  </div>
}
