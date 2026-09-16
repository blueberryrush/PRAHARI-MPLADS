import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const Footer = () => {
  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = themeContext?.isDark ?? false;
  } catch {
    // fallback if outside context
  }

  return (
    <footer 
      style={{ 
        width: '100%', 
        backgroundColor: isDark ? '#111A15' : '#FAF8F5', 
        borderTop: isDark ? '1px solid #1F2E25' : '1px solid #E5E7EB', 
        padding: '64px 0 40px 0',
        color: isDark ? '#D1D5DB' : '#374151',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'background-color 0.2s, border-color 0.2s, color 0.2s'
      }}
      className="dark:!bg-[#111A15] dark:!text-stone-300 dark:!border-stone-800"
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Strict 4-Column Horizontal Row via Pure Flexbox */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexWrap: 'wrap',
          gap: '32px' 
        }}>
          
          {/* Column 1: Brand & Identity (Width: ~30%) */}
          <div style={{ flex: '1 1 280px', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '8px', 
                backgroundColor: '#047857', 
                color: '#ffffff', 
                fontWeight: '900', 
                fontSize: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                P
              </div>
              <div>
                <h3 
                  style={{ 
                    margin: 0, 
                    fontSize: '20px', 
                    fontWeight: '800', 
                    letterSpacing: '-0.5px', 
                    color: isDark ? '#FFFFFF' : '#111827' 
                  }} 
                  className="dark:!text-white"
                >
                  PRAHARI
                </h3>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: isDark ? '#34D399' : '#047857', fontWeight: '700', letterSpacing: '1px' }}>
                  MPLADS RISK INTELLIGENCE
                </span>
              </div>
            </div>

            <p 
              style={{ 
                margin: 0, 
                fontSize: '13px', 
                lineHeight: '1.6', 
                color: isDark ? '#9CA3AF' : '#6B7280' 
              }} 
              className="dark:!text-stone-400"
            >
              AI-Powered Intelligence layer for explainable, high-fidelity MPLADS project monitoring and audit readiness.
            </p>

            <span style={{ 
              display: 'inline-block', 
              fontSize: '10px', 
              fontFamily: 'monospace', 
              fontWeight: '700', 
              color: isDark ? '#A7F3D0' : '#065F46', 
              backgroundColor: isDark ? 'rgba(6, 95, 70, 0.4)' : '#D1FAE5', 
              padding: '4px 10px', 
              borderRadius: '9999px', 
              width: 'fit-content',
              border: isDark ? '1px solid rgba(52, 211, 153, 0.25)' : 'none'
            }}>
              DETECT • ASSESS • VERIFY • PRIORITIZE
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <Link 
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  maxWidth: '220px',
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <span>Explore Dashboard</span>
                <span>→</span>
              </Link>
              <Link 
                to="/citizen"
                className="dark:!bg-stone-900 dark:!text-stone-200 dark:!border-stone-700"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isDark ? '#1C1917' : '#ffffff',
                  color: isDark ? '#E7E5E4' : '#1F2937',
                  border: isDark ? '1px solid #44403C' : '1px solid #D1D5DB',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  maxWidth: '220px',
                  textDecoration: 'none',
                }}
              >
                <span>Citizen Portal</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Column 2: Platform Links (Width: ~18%) */}
          <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
            <h4 
              style={{ 
                margin: '0 0 16px 0', 
                fontSize: '15px', 
                fontWeight: '700', 
                fontStyle: 'italic', 
                borderBottom: isDark ? '1px solid #1F2E25' : '1px solid #E5E7EB', 
                paddingBottom: '8px', 
                color: isDark ? '#FFFFFF' : '#111827' 
              }} 
              className="dark:!text-white dark:!border-stone-800"
            >
              Platform
            </h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li>
                <Link 
                  to="/dashboard" 
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer" 
                  style={{ textDecoration: 'none' }}
                >
                  Command Centre
                </Link>
              </li>
              <li>
                <Link 
                  to="/citizen" 
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer" 
                  style={{ textDecoration: 'none' }}
                >
                  Citizen Portal
                </Link>
              </li>
              <li>
                <Link 
                  to="/investigation" 
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer" 
                  style={{ textDecoration: 'none' }}
                >
                  Investigation Desk
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard" 
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer" 
                  style={{ textDecoration: 'none' }}
                >
                  Geospatial Command
                </Link>
              </li>
              <li>
                <Link 
                  to="/citizen" 
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer" 
                  style={{ textDecoration: 'none' }}
                >
                  Evidence Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Audit Framework (Width: ~22%) */}
          <div style={{ flex: '1 1 180px', minWidth: '170px' }}>
            <h4 
              style={{ 
                margin: '0 0 16px 0', 
                fontSize: '15px', 
                fontWeight: '700', 
                fontStyle: 'italic', 
                borderBottom: isDark ? '1px solid #1F2E25' : '1px solid #E5E7EB', 
                paddingBottom: '8px', 
                color: isDark ? '#FFFFFF' : '#111827' 
              }} 
              className="dark:!text-white dark:!border-stone-800"
            >
              Framework
            </h4>
            <ul 
              style={{ 
                listStyle: 'none', 
                margin: 0, 
                padding: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px', 
                fontSize: '13px', 
              }} 
            >
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Central_Vigilance_Commission"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  CVC Compliance Model
                </a>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/DBSCAN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  Spatial Clustering Engine
                </a>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Public_Financial_Management_System"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  Financial Velocity Tracking
                </a>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Earned_value_management"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  Temporal Delay Index
                </a>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Anomaly_detection"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  Multi-Signal Anomaly Scoring
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Governance & Standards (Width: ~24%) */}
          <div style={{ flex: '1 1 200px', minWidth: '190px' }}>
            <h4 
              style={{ 
                margin: '0 0 16px 0', 
                fontSize: '15px', 
                fontWeight: '700', 
                fontStyle: 'italic', 
                borderBottom: isDark ? '1px solid #1F2E25' : '1px solid #E5E7EB', 
                paddingBottom: '8px', 
                color: isDark ? '#FFFFFF' : '#111827' 
              }} 
              className="dark:!text-white dark:!border-stone-800"
            >
              Governance
            </h4>
            <ul 
              style={{ 
                listStyle: 'none', 
                margin: 0, 
                padding: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px', 
                fontSize: '13px', 
                marginBottom: '16px' 
              }} 
            >
              <li>
                <a
                  href="https://www.mospi.gov.in/about-us/mplads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  Audit Guidelines & Rules
                </a>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Ministry_of_Statistics_and_Programme_Implementation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  MoSPI Methodology
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@prahari.gov.in"
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-block cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  Contact & Helpdesk
                </a>
              </li>
            </ul>

            {/* Static MoSPI Verified Badge */}
            <div
              style={{ 
                padding: '12px 14px', 
                borderRadius: '10px', 
                border: isDark ? '1px solid #292524' : '1px solid #D1D5DB', 
                backgroundColor: isDark ? '#1C1917' : '#ffffff',
              }} 
              className="dark:!bg-stone-900 dark:!border-stone-700"
            >
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: isDark ? '#34D399' : '#065F46' 
                }} 
                className="dark:!text-emerald-400"
              >
                <span className="text-base">🛡️</span>
                <span>MoSPI VERIFIED</span>
              </div>
              <p 
                style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '11px', 
                  fontFamily: 'monospace', 
                  color: isDark ? '#9CA3AF' : '#6B7280' 
                }} 
                className="dark:!text-stone-400"
              >
                SIH26102 COMPLIANT
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div 
          style={{ 
            marginTop: '48px', 
            paddingTop: '24px', 
            borderTop: isDark ? '1px solid #1F2E25' : '1px solid #E5E7EB', 
            display: 'flex', 
            flexWrap: 'wrap',
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '16px',
            fontSize: '12px', 
            color: isDark ? '#9CA3AF' : '#6B7280' 
          }} 
          className="dark:!border-stone-800 dark:!text-stone-500"
        >
          <div>© 2026 PRAHARI • MPLADS Risk Intelligence Platform</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Use</span>
            <span style={{ cursor: 'pointer' }}>Accessibility Statement</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
