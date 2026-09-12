import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Globe2, X, ArrowRight, CheckCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { alerts, projects, agencies } from '../data/mockData';
import SpeakerButton from './SpeakerButton';

export default function Header({ title }) {
  const { lang, switchLanguage, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  const [notifications, setNotifications] = useState(() =>
    alerts.map(a => ({
      ...a,
      project: a.project || (a.id === 'ALT003' ? 'PRJ002' : a.id === 'ALT007' ? 'PRJ004' : 'PRJ001'),
      caseTitle:
        a.project === 'PRJ002' ? 'PRJ002 · Village Road Construction' :
        a.project === 'PRJ046' ? 'PRJ046 · Ghat Embankment & Pitching' :
        a.project === 'PRJ030' ? 'PRJ030 · Rural Connectivity Project' :
        a.project === 'PRJ005' ? 'PRJ005 · Highway Connector' :
        a.project === 'PRJ014' ? 'PRJ014 · Health Sub-Center' :
        a.project === 'PRJ017' ? 'PRJ017 · Drainage System' :
        'PRJ002 · Village Road Construction',
    }))
  );

  const unreadCount = notifications.filter(a => !a.read).length;

  const agencyMap = useMemo(() => {
    const map = {};
    agencies.forEach(ag => { map[ag.id] = ag.name; });
    return map;
  }, []);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return projects
      .filter(p => {
        const agencyName = (agencyMap[p.agency] || '').toLowerCase();
        const fullStr = `${p.id} ${p.name} ${p.district} ${p.constituency} ${agencyName} ${p.description || ''}`.toLowerCase();
        return fullStr.includes(q);
      })
      .slice(0, 6);
  }, [searchQuery, agencyMap]);

  // Click outside listener for search popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (a) => {
    setNotifications(prev =>
      prev.map(item => (item.id === a.id ? { ...item, read: true } : item))
    );
    setShowNotifications(false);
    const targetId = a.project || 'PRJ002';
    navigate(`/official/risk/${targetId}`);
  };

  const handleSelectSearchResult = (projectId) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/official/risk/${projectId}`);
  };

  const markAllAsRead = (e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const workspace = location.pathname.startsWith('/citizen')
    ? t('header_workspace_citizen')
    : t('header_workspace_official');

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="eyebrow">{workspace}</span>
        <h1>{title || workspace}</h1>
      </div>
      <div className="topbar-actions">
        {/* Global Search Bar with Live Filter Dropdown */}
        <div className="global-search-container" ref={searchRef}>
          <label className="global-search">
            <Search size={17} />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchResults(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowSearchResults(false);
              }}
              placeholder={t('header_search_placeholder')}
            />
            {searchQuery ? (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <kbd>⌘ K</kbd>
            )}
          </label>

          {showSearchResults && searchQuery.trim() && (
            <div className="search-dropdown-popover">
              <div className="search-dropdown-header">
                <span>
                  {lang === 'hi' ? 'मिलती-जुलती परियोजनाएं' : 'Matching Projects'} ({searchMatches.length})
                </span>
                <button onClick={() => setShowSearchResults(false)}>
                  <X size={13} />
                </button>
              </div>
              {searchMatches.length === 0 ? (
                <div className="search-no-results">
                  <p>{lang === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No matching projects found'}</p>
                  <small>{lang === 'hi' ? 'आईडी, नाम या ठेकेदार द्वारा खोजें' : 'Search by ID (e.g. PRJ002), title, or contractor'}</small>
                </div>
              ) : (
                searchMatches.map((p) => (
                  <button
                    key={p.id}
                    className="search-result-row"
                    onClick={() => handleSelectSearchResult(p.id)}
                  >
                    <div className="result-main">
                      <div className="result-badge-row">
                        <span className="result-id">{p.id}</span>
                        <span className="result-loc">{p.district}</span>
                      </div>
                      <strong>{p.name}</strong>
                      <span className="result-agency">{agencyMap[p.agency] || p.sector}</span>
                    </div>
                    <ArrowRight size={15} className="result-arrow" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <SpeakerButton text={`${title || workspace}. ${lang === 'hi' ? 'PRAHARI में आपका स्वागत है।' : 'Welcome to PRAHARI.'}`} />

        <div className="language-control">
          <Globe2 size={15} />
          <button
            className={lang === 'en' ? 'active' : ''}
            onClick={() => switchLanguage('en')}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            className={lang === 'hi' ? 'active' : ''}
            onClick={() => switchLanguage('hi')}
            aria-label="हिंदी में बदलें"
          >
            हिं
          </button>
        </div>

        {/* Dynamic & Clickable Notification Bell */}
        <div className="notification-wrap">
          <button
            className="icon-button"
            onClick={() => setShowNotifications(v => !v)}
            aria-label={t('header_notifications')}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-dot">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-popover">
              <div className="popover-heading">
                <span>{t('header_notifications')}</span>
                <div className="popover-heading-actions">
                  {unreadCount > 0 && (
                    <span className="unread-tag">{unreadCount} {t('header_new')}</span>
                  )}
                  {unreadCount > 0 && (
                    <button
                      className="mark-read-text-btn"
                      onClick={markAllAsRead}
                      title={lang === 'hi' ? 'सभी को पढ़ा हुआ चिह्नित करें' : 'Mark all as read'}
                    >
                      <CheckCheck size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="notification-list">
                {notifications.slice(0, 5).map(a => (
                  <button
                    className={`notification-item ${a.read ? 'is-read' : 'is-unread'}`}
                    key={a.id}
                    onClick={() => handleNotificationClick(a)}
                  >
                    <span className={`mini-severity ${a.type}`} />
                    <div className="notif-content">
                      <div className="notif-header">
                        <strong>{a.title}</strong>
                        {a.project && (
                          <span className="notif-case-chip">{a.project}</span>
                        )}
                      </div>
                      <p>{a.message}</p>
                      <div className="notif-footer">
                        <span className="notif-action-prompt">
                          {lang === 'hi' ? 'केस डॉसियर खोलें →' : 'Open Case Dossier →'}
                        </span>
                        {!a.read && <span className="notif-unread-dot" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="profile-chip">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div className="profile-copy">
            <strong>{user?.name || 'Official'}</strong>
            <span>{user?.role?.replaceAll('_', ' ') || 'Official'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
