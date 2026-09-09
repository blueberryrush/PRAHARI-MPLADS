import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, SearchCheck, ShieldAlert, MapPinned, LogOut, X, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { lang } = useLanguage();
  const { user, logout, isOfficial } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const officialLinks = [
    { to: '/official/dashboard', icon: LayoutDashboard, label: lang === 'hi' ? 'कमांड सेंटर' : 'Command Centre' },
    { to: '/official/risk/PRJ002', icon: ShieldAlert, label: lang === 'hi' ? 'रिस्क प्रोफाइल' : 'Risk Profile' },
    { to: '/official/investigation', icon: SearchCheck, label: lang === 'hi' ? 'जांच केंद्र' : 'Investigation Centre' },
    { to: '/official/financial', icon: ShieldAlert, label: lang === 'hi' ? 'वित्तीय समीक्षा' : 'Financial Review' },
  ];
  const citizenLinks = [
    { to: '/citizen', icon: MapPinned, label: lang === 'hi' ? 'एक्सप्लोर मैप' : 'Explore Map' },
    { to: '/citizen/projects', icon: SearchCheck, label: lang === 'hi' ? 'वर्क एक्सप्लोरर' : 'Work Explorer' },
  ];
  const links = isOfficial ? officialLinks : citizenLinks;

  const close = () => setOpen(false);
  return (
    <>
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20}/></button>
      {open && <div className="sidebar-scrim" onClick={close}/>}
      <aside className={`sidebar ${open ? 'mobile-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark">P</div>
          <div><div className="brand-name">PRAHARI</div><div className="brand-sub">MPLADS Intelligence</div></div>
          <button className="mobile-close" onClick={close}><X size={19}/></button>
        </div>

        <div className="sidebar-context">
          <span className="status-pulse"/><div><b>{isOfficial ? 'Authority Workspace' : 'Public Access'}</b><small>{user?.state || 'India'}{user?.district ? ` · ${user.district}` : ''}</small></div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">{isOfficial ? 'WORKSPACE' : 'EXPLORE'}</span>
          {links.map(({to, icon: Icon, label}) => (
            <NavLink key={to} to={to} onClick={close} className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={18}/><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {isOfficial && <div className="sidebar-note"><span>AI</span><div><b>Human verification</b><small>Risk signals support review; they do not prove fraud.</small></div></div>}

        <div className="sidebar-bottom">
          <button className="sidebar-user" onClick={() => { logout(); navigate('/'); }}>
            <div className="avatar">{user?.name?.charAt(0) || 'U'}</div><div><b>{user?.name || 'User'}</b><small>Sign out</small></div><LogOut size={16}/>
          </button>
        </div>
      </aside>
    </>
  );
}
