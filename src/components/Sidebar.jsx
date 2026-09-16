import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, SearchCheck, ShieldAlert, MapPinned,
  LogOut, X, Menu, CircleDollarSign, Copy, BarChart2, Activity, Home,
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { t, lang } = useLanguage();
  const { user, logout, isOfficial } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const officialLinks = [
    { to: '/',                            icon: Home,               labelKey: 'common_back', end: true },
    { to: '/dashboard',                   icon: LayoutDashboard,    labelKey: 'nav_dashboard' },
    { to: '/official/risk/PRJ002',        icon: ShieldAlert,        labelKey: 'nav_risk' },
    { to: '/official/financial',          icon: CircleDollarSign,   labelKey: 'nav_financial' },
    { to: '/official/duplicate',          icon: Copy,               labelKey: 'nav_duplicate' },
    { to: '/official/agency',             icon: BarChart2,          labelKey: 'nav_agency' },
    { to: '/official/comparison',         icon: Activity,           labelKey: 'nav_comparison' },
    { to: '/official/bottleneck',         icon: Activity,           labelKey: 'nav_bottleneck' },
  ];

  const investigatorLinks = [
    { to: '/',                            icon: Home,               labelKey: 'common_back', end: true },
    { to: '/investigation',               icon: SearchCheck,        labelKey: 'nav_investigation' },
    { to: '/official/risk/PRJ002',        icon: ShieldAlert,        labelKey: 'nav_risk' },
  ];

  const citizenLinks = [
    { to: '/',                 icon: Home,        labelKey: 'common_back', end: true },
    { to: '/citizen',          icon: MapPinned,   labelKey: 'nav_citizen' },
    { to: '/citizen/projects', icon: SearchCheck, labelKey: 'nav_projects' },
  ];

  const isInvestigationPath =
    location.pathname.startsWith('/investigation') ||
    location.pathname.startsWith('/cases') ||
    location.pathname.startsWith('/official/investigation');

  const isOfficialPath =
    location.pathname.startsWith('/official') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/command');

  const isCitizenPath = location.pathname.startsWith('/citizen');

  const links =
    user?.role === 'investigator' || (isInvestigationPath && !user)
      ? investigatorLinks
      : isOfficial || (isOfficialPath && !isCitizenPath && !user)
      ? officialLinks
      : citizenLinks;

  const close = () => setOpen(false);

  const displayWorkspace = (isOfficial || (isOfficialPath && !isCitizenPath) || isInvestigationPath)
    ? t('sidebar_authority_workspace')
    : t('sidebar_public_access');

  return (
    <>
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>
      {open && <div className="sidebar-scrim" onClick={close} />}
      <aside className={`sidebar ${open ? 'mobile-open' : ''}`}>
        <div className="brand-lockup" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-mark">P</div>
          <div>
            <div className="brand-name">PRAHARI</div>
            <div className="brand-sub">MPLADS Intelligence</div>
          </div>
          <button className="mobile-close" onClick={(e) => { e.stopPropagation(); close(); }}><X size={19} /></button>
        </div>

        <div className="sidebar-context">
          <span className="status-pulse" />
          <div>
            <b>{displayWorkspace}</b>
            <small>
              {user?.state || 'India'}
              {user?.district ? ` · ${user.district}` : ''}
            </small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">
            {(isOfficial || isOfficialPath || isInvestigationPath) ? t('nav_workspace') : t('nav_explore')}
          </span>
          {links.map(({ to, icon: Icon, labelKey, end }) => (
            <NavLink
              key={`${labelKey}-${to}`}
              to={to}
              end={!!end}
              onClick={close}
              className={({ isActive }) => `sidebar-link cursor-pointer transition-all ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{to === '/' ? (lang === 'hi' ? 'होम पर लौटें' : 'Return Home') : t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {(isOfficial || isOfficialPath || isInvestigationPath) && (
          <div className="sidebar-note">
            <span>AI</span>
            <div>
              <b>{t('sidebar_ai_note_title')}</b>
              <small>{t('sidebar_ai_note_body')}</small>
            </div>
          </div>
        )}

        <div className="sidebar-bottom">
          {user ? (
            <button
              className="sidebar-user"
              onClick={() => { logout(); navigate('/'); }}
            >
              <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
              <div>
                <b>{user?.name || 'User'}</b>
                <small>{t('header_sign_out')}</small>
              </div>
              <LogOut size={16} />
            </button>
          ) : (
            <button
              className="sidebar-user"
              onClick={() => navigate('/login')}
            >
              <div className="avatar">P</div>
              <div>
                <b>{(isOfficial || isOfficialPath || isInvestigationPath) ? 'Official Demo' : 'Public Access'}</b>
                <small>{t('header_sign_in') || 'Sign In'}</small>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
