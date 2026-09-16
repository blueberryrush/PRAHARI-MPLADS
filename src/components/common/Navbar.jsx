import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCaseContext } from '../../contexts/CaseContext';
import SpeakerButton from '../SpeakerButton';

export default function Navbar() {
  const navigate = useNavigate();
  const { lang, switchLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();

  let caseContext = null;
  try {
    caseContext = useCaseContext();
  } catch {}

  const hi = lang === 'hi';
  const backendStatus = caseContext?.backendStatus || 'cloud_connected';
  const loading = caseContext?.loading || false;
  const refreshData = caseContext?.refreshData;

  const isConnected = backendStatus === 'cloud_connected' || backendStatus === 'local_backend';

  return (
    <nav className="landing-nav" role="navigation" aria-label="Main Navigation">
      <div
        className="brand-lockup flex items-center gap-3 min-w-0"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
        {/* Forest Emerald Brand Logo Mark */}
        <div
          className="brand-mark shrink-0"
          style={{
            background: '#1E3A2B',
            color: '#34D399',
            border: '1.5px solid #2D5A3E',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)',
          }}
        >
          P
        </div>
        <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2.5 min-w-0">
          <div className="brand-name text-base font-extrabold tracking-wider shrink-0" style={{ color: 'var(--ink)' }}>
            PRAHARI
          </div>
          <div className="brand-sub-full text-[11px] md:text-xs text-stone-600 dark:text-stone-300 font-medium whitespace-normal leading-tight">
            {hi
              ? 'समग्र जवाबदेही और वास्तविक समय इंटेलिजेंस'
              : 'Predictive Risk Analytics & Real-time Intelligence'}
          </div>
        </div>
      </div>

      <div className="landing-tools" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Live Supabase Connection Badge & Sync Button */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 9px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            background: isConnected ? 'rgba(5, 150, 105, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${isConnected ? 'rgba(5, 150, 105, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: isConnected ? (isDark ? '#34d399' : '#047857') : '#ef4444',
          }}
          title={isConnected ? 'Connected to Supabase PostgreSQL Database' : 'Operating in offline cache mode'}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#ef4444',
              boxShadow: isConnected ? '0 0 6px #10b981' : 'none',
              animation: isConnected ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span>
            {isConnected
              ? backendStatus === 'local_backend'
                ? 'FastAPI Local'
                : 'Supabase Cloud Live'
              : 'Offline Cache'}
          </span>
          {refreshData && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                refreshData();
              }}
              disabled={loading}
              aria-label="Refresh cloud database"
              title="Sync latest records from Supabase"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '0 0 0 4px',
                display: 'inline-flex',
                alignItems: 'center',
                color: 'inherit',
                opacity: loading ? 0.6 : 0.9,
              }}
            >
              <RefreshCw
                size={12}
                className={loading ? 'animate-spin' : ''}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
          )}
        </div>

        <SpeakerButton
          text={
            hi
              ? 'प्रहरी। एमपीएलएडीएस के लिए समझाने योग्य जोखिम इंटेलिजेंस।'
              : 'PRAHARI. Explainable risk intelligence for MPLADS.'
          }
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
          title={
            isDark
              ? hi
                ? 'लाइट मोड चालू करें'
                : 'Switch to Light Mode'
              : hi
              ? 'डार्क मोड चालू करें'
              : 'Switch to Dark Mode'
          }
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
      </div>
    </nav>
  );
}
