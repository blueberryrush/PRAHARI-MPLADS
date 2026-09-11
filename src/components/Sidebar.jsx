import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, SearchCheck, ShieldAlert, MapPinned,
  LogOut, X, Menu, CircleDollarSign, Copy, BarChart2, Activity,
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { t } = useLanguage();
  const { user, logout, isOfficial } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const officialLinks = [
    { to: '/official/dashboard',         icon: LayoutDashboard,    labelKey: 'nav_dashboard' },
    { to: '/official/risk/PRJ002',        icon: ShieldAlert,        labelKey: 'nav_risk' },
    { to: '/official/investigation',      icon: SearchCheck,        labelKey: 'nav_investigation' },
    { to: '/official/financial',          icon: CircleDollarSign,   labelKey: 'nav_financial' },
    { to: '/official/duplicate',          icon: Copy,               labelKey: 'nav_duplicate' },
    { to: '/official/agency',             icon: BarChart2,          labelKey: 'nav_agency' },
    { to: '/official/comparison',         icon: Activity,           labelKey: 'nav_comparison' },
  ];

  const citizenLinks = [
    { to: '/citizen',          icon: MapPinned,   labelKey: 'nav_citizen' },
    { to: '/citizen/projects', icon: SearchCheck, labelKey: 'nav_projects' },
  ];

  const links = isOfficial ? officialLinks : citizenLinks;
  const close = () => setOpen(false);

  return (
    <>
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>
      {open && <div className="sidebar-scrim" onClick={close} />}
      <aside className={`sidebar ${open ? 'mobile-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark">P</div>
          <div>
            <div className="brand-name">PRAHARI</div>
            <div className="brand-sub">MPLADS Intelligence</div>
          </div>
          <button className="mobile-close" onClick={close}><X size={19} /></button>
        </div>

        <div className="sidebar-context">
          <span className="status-pulse" />
          <div>
            <b>{isOfficial ? t('sidebar_authority_workspace') : t('sidebar_public_access')}</b>
            <small>
              {user?.state || 'India'}
              {user?.district ? ` · ${user.district}` : ''}
            </small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">
            {isOfficial ? t('nav_workspace') : t('nav_explore')}
          </span>
          {links.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {isOfficial && (
          <div className="sidebar-note">
            <span>AI</span>
            <div>
              <b>{t('sidebar_ai_note_title')}</b>
              <small>{t('sidebar_ai_note_body')}</small>
            </div>
          </div>
        )}

        <div className="sidebar-bottom">
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
        </div>
      </aside>
    </>
  );
}
