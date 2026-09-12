import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Building2, SearchCheck, UserRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LoginPage from '../../pages/LoginPage';

export default function AuthModal({ isOpen, onClose, defaultRole = 'official' }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { lang, switchLanguage } = useLanguage();
  const hi = lang === 'hi';

  const [role, setRole] = useState(defaultRole); // 'official' | 'investigator' | 'citizen'
  const [email, setEmail] = useState('da@demo.com');
  const [password, setPassword] = useState('demo123');

  // If used as page component or not controlled by isOpen
  if (isOpen === undefined) {
    return <LoginPage />;
  }

  if (!isOpen) return null;

  const handleQuickLogin = (selectedRole) => {
    let emailToUse = 'da@demo.com';
    let roleToUse = 'district_authority';

    if (selectedRole === 'investigator') {
      emailToUse = 'investigator@demo.com';
      roleToUse = 'investigator';
    } else if (selectedRole === 'citizen') {
      emailToUse = 'citizen@demo.com';
      roleToUse = 'citizen';
    }

    login(emailToUse, 'demo123', roleToUse);
    if (onClose) onClose();

    if (roleToUse === 'investigator') {
      navigate('/official/investigations');
    } else if (roleToUse === 'citizen') {
      navigate('/citizen');
    } else {
      navigate('/official/dashboard');
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
        <motion.div 
          className="modal-window" 
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          style={{
            maxWidth: 480,
            background: '#1C1917',
            border: '1px solid #292524',
            color: '#F5F5F4',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="brand-lockup">
              <div 
                className="brand-mark" 
                style={{
                  background: '#1E3A2B',
                  color: '#34D399',
                  border: '1.5px solid #2D5A3E',
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 850,
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)'
                }}
              >
                P
              </div>
              <div>
                <div className="brand-name" style={{ color: '#F5F5F4' }}>PRAHARI</div>
                <div className="brand-sub" style={{ color: '#A8A29E' }}>
                  {hi ? 'सुरक्षित पोर्टल प्रवेश' : 'Secure Official & Public Portal'}
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 0,
                color: '#A8A29E',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ marginBottom: 18 }}>
            <span className="eyebrow" style={{ color: '#059669' }}>
              {hi ? 'भूमिका चयन' : 'SELECT ROLE TO PROCEED'}
            </span>
            <h3 style={{ margin: '6px 0', fontSize: 18, color: '#FAFAF9' }}>
              {hi ? 'डेमो वर्कस्पेस में प्रवेश करें' : 'Access PRAHARI Workspace'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#A8A29E', lineHeight: 1.5 }}>
              {hi 
                ? 'अपनी आवश्यक भूमिका चुनें और सीधे लाइव केस इंटेलिजेंस खोलें।' 
                : 'Select your role to unlock live case dossiers, ground verification, or citizen surveillance.'}
            </p>
          </div>

          {/* Role selection cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('investigator')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#292524',
                border: '1px solid #44403C',
                color: '#F5F5F4',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1E3A2B', color: '#34D399', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <SearchCheck size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13, display: 'block', color: '#FAFAF9' }}>
                  {hi ? 'जांच डेस्क / फील्ड ऑफिसर' : 'Investigation Centre'}
                </b>
                <span style={{ fontSize: 11, color: '#A8A29E' }}>
                  {hi ? 'सक्रिय केस, साक्ष्य और सत्यापन' : 'Active case review, evidence locker & field verification'}
                </span>
              </div>
              <ArrowRight size={16} style={{ color: '#34D399' }} />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('official')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#292524',
                border: '1px solid #44403C',
                color: '#F5F5F4',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#2D5A3E', color: '#34D399', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Building2 size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13, display: 'block', color: '#FAFAF9' }}>
                  {hi ? 'कमांड सेंटर / जिला प्राधिकरण' : 'Command Centre (District Authority)'}
                </b>
                <span style={{ fontSize: 11, color: '#A8A29E' }}>
                  {hi ? 'जिला निगरानी एवं जोखिम स्कोर' : 'Portfolio surveillance, risk correlation & KPIs'}
                </span>
              </div>
              <ArrowRight size={16} style={{ color: '#34D399' }} />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('citizen')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#292524',
                border: '1px solid #44403C',
                color: '#F5F5F4',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#44403C', color: '#E7E5E4', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <UserRound size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13, display: 'block', color: '#FAFAF9' }}>
                  {hi ? 'नागरिक पोर्टल' : 'Citizen Public Portal'}
                </b>
                <span style={{ fontSize: 11, color: '#A8A29E' }}>
                  {hi ? 'निकटवर्ती कार्य खोजें और अवलोकन दर्ज करें' : 'Explore local works & submit ground observations'}
                </span>
              </div>
              <ArrowRight size={16} style={{ color: '#A8A29E' }} />
            </button>
          </div>

          {/* Footer note */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #292524', paddingTop: 14 }}>
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                navigate('/login');
              }}
              style={{
                background: 'transparent',
                border: 0,
                color: '#34D399',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {hi ? 'पारंपरिक ईमेल लॉगिन का उपयोग करें →' : 'Use credentials login page instead →'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
