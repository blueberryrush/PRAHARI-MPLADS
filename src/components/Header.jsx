import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Globe2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { alerts } from '../data/mockData';
import SpeakerButton from './SpeakerButton';

export default function Header({ title }) {
  const { lang, switchLanguage } = useLanguage();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = alerts.filter(a => !a.read).length;
  const location = useLocation();
  const workspace = location.pathname.startsWith('/citizen') ? 'Citizen Portal' : 'Command Center';

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="eyebrow">{workspace}</span>
        <h1>{title || workspace}</h1>
      </div>
      <div className="topbar-actions">
        <label className="global-search">
          <Search size={17} />
          <input placeholder={lang === 'hi' ? 'परियोजना, केस या स्थान खोजें' : 'Search project, case or place'} />
          <kbd>⌘ K</kbd>
        </label>
        <SpeakerButton text={`${title || workspace}. ${lang === 'hi' ? 'PRAHARI में आपका स्वागत है।' : 'Welcome to PRAHARI.'}`} />
        <div className="language-control">
          <Globe2 size={15} />
          <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLanguage('en')}>EN</button>
          <button className={lang === 'hi' ? 'active' : ''} onClick={() => switchLanguage('hi')}>हिं</button>
        </div>
        <div className="notification-wrap">
          <button className="icon-button" onClick={() => setShowNotifications(v => !v)} aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="notification-popover">
              <div className="popover-heading">Notifications <span>{unreadCount} new</span></div>
              {alerts.slice(0, 4).map(a => (
                <div className="notification-item" key={a.id}>
                  <span className={`mini-severity ${a.type}`} />
                  <div><strong>{a.title}</strong><p>{a.message}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="profile-chip">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="profile-copy"><strong>{user?.name || 'Demo User'}</strong><span>{user?.role?.replaceAll('_',' ') || 'Official'}</span></div>
        </div>
      </div>
    </header>
  );
}
