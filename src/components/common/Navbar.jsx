import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import SpeakerButton from '../SpeakerButton';

export default function Navbar({ onOpenAuth, showAuthAction = true }) {
  const navigate = useNavigate();
  const { lang, switchLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const hi = lang === 'hi';

  return (
    <nav className="landing-nav" role="navigation" aria-label="Main Navigation">
      <div className="brand-lockup" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        {/* Forest Emerald Brand Logo Mark */}
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
          <div className="brand-name" style={{ color: 'var(--ink)' }}>PRAHARI</div>
          <div className="brand-sub">
            {hi 
              ? 'समग्र जवाबदेही और वास्तविक समय इंटेलिजेंस' 
              : 'Predictive Risk Analytics & Real-time Intelligence'}
          </div>
        </div>
      </div>

      <div className="landing-tools">
        <SpeakerButton 
          text={hi 
            ? 'प्रहरी। एमपीएलएडीएस के लिए समझाने योग्य जोखिम इंटेलिजेंस।' 
            : 'PRAHARI. Explainable risk intelligence for MPLADS.'} 
        />
        <div className="language-control">
          <span>EN</span>
          <button 
            className={lang === 'en' ? 'active' : ''} 
            onClick={() => switchLanguage('en')}
            type="button"
          >
            EN
          </button>
          <button 
            className={lang === 'hi' ? 'active' : ''} 
            onClick={() => switchLanguage('hi')}
            type="button"
          >
            हिं
          </button>
        </div>

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? (hi ? 'लाइट मोड चालू करें' : 'Switch to Light Mode') : (hi ? 'डार्क मोड चालू करें' : 'Switch to Dark Mode')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: '8px',
            border: '1px solid var(--border, #292524)',
            background: 'var(--bg-card, #1c1917)',
            color: isDark ? '#fbbf24' : '#d97706',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {showAuthAction && (
          <button
            type="button"
            className="primary-action"
            onClick={() => onOpenAuth ? onOpenAuth() : navigate('/login')}
            style={{ height: 34, padding: '0 14px', fontSize: 11, marginLeft: 6 }}
          >
            {hi ? 'पोर्टल प्रवेश →' : 'Access Portal →'}
          </button>
        )}
      </div>
    </nav>
  );
}
