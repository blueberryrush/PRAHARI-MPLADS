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
  const [officialRole,setOfficialRole] = useState('district_authority');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [show,setShow]=useState(false);
  const [error,setError]=useState('');
  const hi=lang==='hi';
  useEffect(()=>{
    if (params.get('role') === 'citizen') setRole('citizen');
    else if (params.get('role') === 'official') setRole('official');
  },[params]);

  const submit=e=>{e.preventDefault(); if(!email||!password){setError(hi?'ईमेल और पासवर्ड भरें':'Enter email and password');return;} const finalRole=role==='official'?officialRole:'citizen'; const r=login(email,password,finalRole); if(r.success) navigate(finalRole==='citizen'?'/citizen':'/official/dashboard');};
  return <div className="auth-modern">
    <button className="auth-back" onClick={()=>navigate('/')}><ArrowLeft size={16}/> Back to PRAHARI</button>
    <div className="auth-shell">
      <motion.section className="auth-brand-panel" initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}}>
        <div className="brand-lockup"><div className="brand-mark">P</div><div><div className="brand-name">PRAHARI</div><div className="brand-sub">MPLADS Intelligence</div></div></div>
        <div className="auth-visual"><div className="auth-orbit"/><div className="auth-core"><ShieldCheck size={28}/><span>VERIFY</span></div><div className="auth-node a"><Building2 size={16}/></div><div className="auth-node b"><MapPin size={16}/></div><div className="auth-node c"><UserRound size={16}/></div></div>
        <div><span className="eyebrow">ONE INTELLIGENCE LAYER</span><h2>Find what needs attention.<br/><em>Then prove it.</em></h2><p>Risk signals connect financial, spatial, temporal and evidence patterns so reviewers can spend time where it matters.</p></div>
      </motion.section>
      <motion.section className="auth-form-panel" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}>
        <div className="auth-top"><div><span className="eyebrow">{hi?'सुरक्षित डेमो एक्सेस':'SECURE DEMO ACCESS'}</span><h1>{hi?'PRAHARI में प्रवेश करें':'Enter PRAHARI'}</h1><p>{hi?'अपनी भूमिका चुनें और डेमो वर्कस्पेस खोलें।':'Choose your role to open the right workspace.'}</p></div><div className="language-control"><Globe2 size={15}/><button className={lang==='en'?'active':''} onClick={()=>switchLanguage('en')}>EN</button><button className={lang==='hi'?'active':''} onClick={()=>switchLanguage('hi')}>हिं</button></div></div>
        <SpeakerButton text={hi?'PRAHARI में प्रवेश करें। अपनी भूमिका चुनें और डेमो वर्कस्पेस खोलें।':'Enter PRAHARI. Choose your role to open the right workspace.'}/>
        <div className="login-context">
          {role==='official' ? (
            <>
              <div className="context-icon"><Building2 size={17}/></div>
              <div><span>AUTHORITY ACCESS</span><b>Official workspace</b><small>Command Centre & Investigation Centre</small></div>
            </>
          ) : (
            <>
              <div className="context-icon"><UserRound size={17}/></div>
              <div><span>CITIZEN ACCESS</span><b>Public workspace</b><small>Explore works & submit observations</small></div>
            </>
          )}
        </div>
        {role==='official'&&<div className="official-role"><label>Authority context</label><select value={officialRole} onChange={e=>setOfficialRole(e.target.value)}><option value="district_authority">District Authority · Varanasi</option><option value="state_nodal">State Nodal Authority · Uttar Pradesh</option><option value="ministry">Central / Ministry View</option><option value="mp">MP Office · Varanasi</option></select></div>}
        <form onSubmit={submit}>
          <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="demo@example.com"/></label>
          <label>Password<div className="password-input"><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
          {error&&<div className="form-error">{error}</div>}
          <button className="primary-action full" type="submit">Continue <ArrowRight size={16}/></button>
        </form>
        <div className="auth-foot"><Link to="/">Return home</Link><span>·</span><span>Human verification is always required for conclusions.</span></div>
      </motion.section>
    </div>
  </div>
}
