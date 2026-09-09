import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

export default function SignupPage() {
  const { t, lang, switchLanguage } = useLanguage();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'citizen', state: '', district: '', constituency: '', otp: '' });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const steps = [
    { num: 1, label: t('auth_step_basic') },
    { num: 2, label: t('auth_step_role') },
    { num: 3, label: t('auth_step_verify') },
  ];

  const handleSubmit = () => {
    const result = signup(form);
    if (result.success) {
      navigate(form.role === 'citizen' ? '/citizen' : '/official/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <motion.div className="auth-left" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
        <div className="auth-illustration"><div className="shield">🇮🇳</div></div>
        <h2>{lang === 'hi' ? 'पारदर्शिता में शामिल हों' : 'Join Transparency'}</h2>
        <p>{lang === 'hi' ? 'MPLADS योजना की निगरानी में योगदान दें' : 'Contribute to monitoring of the MPLADS scheme'}</p>
      </motion.div>

      <motion.div className="auth-right" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
        <div className="auth-form">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h1>{t('auth_signup_title')}</h1>
              <p className="subtitle">{t('auth_signup_subtitle')}</p>
            </div>
            <div className="lang-switch">
              <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLanguage('en')}>EN</button>
              <button className={lang === 'hi' ? 'active' : ''} onClick={() => switchLanguage('hi')}>हिं</button>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="signup-steps">
            {steps.map(s => (
              <div key={s.num} className={`step ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
                <div className="step-circle">{step > s.num ? <Check size={16} /> : s.num}</div>
                <span className="step-label">{s.label}</span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div className="input-group"><label>{t('auth_name')}</label><input className="input" placeholder={lang === 'hi' ? 'आपका नाम' : 'Your full name'} value={form.name} onChange={e => updateForm('name', e.target.value)} /></div>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div className="input-group"><label>{t('auth_email')}</label><input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => updateForm('email', e.target.value)} /></div>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div className="input-group"><label>{t('auth_phone')}</label><input className="input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => updateForm('phone', e.target.value)} /></div>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div className="input-group"><label>{t('auth_password')}</label><input type="password" className="input" placeholder="••••••••" value={form.password} onChange={e => updateForm('password', e.target.value)} /></div>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep(2)}>
                  {lang === 'hi' ? 'अगला' : 'Next'} <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="role-selector" style={{ marginBottom: 16 }}>
                  {[
                    { id: 'citizen', icon: '👤', label: t('auth_role_citizen') },
                    { id: 'district_authority', icon: '🏢', label: t('auth_role_da') },
                    { id: 'state_nodal', icon: '🏛️', label: t('auth_role_state') },
                    { id: 'mp', icon: '🏅', label: t('auth_role_mp') },
                  ].map(r => (
                    <div key={r.id} className={`role-option ${form.role === r.id ? 'selected' : ''}`} onClick={() => updateForm('role', r.id)}>
                      <div className="role-icon">{r.icon}</div>
                      <div className="role-name">{r.label}</div>
                    </div>
                  ))}
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div className="input-group"><label>{t('auth_state')}</label>
                    <select className="select" value={form.state} onChange={e => updateForm('state', e.target.value)}>
                      <option value="">--</option>
                      {['Uttar Pradesh','Maharashtra','Bihar','Madhya Pradesh','Rajasthan','Tamil Nadu','Karnataka','Gujarat','West Bengal','Odisha'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}><ArrowLeft size={18} /> {lang === 'hi' ? 'पीछे' : 'Back'}</button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setStep(3)}>{lang === 'hi' ? 'अगला' : 'Next'} <ArrowRight size={18} /></button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 16 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{t('auth_otp_sent')}</p>
                  <div className="input-group" style={{ maxWidth: 200, margin: '0 auto' }}>
                    <input className="input" style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: 8, fontWeight: 700 }} maxLength={6} placeholder="------" value={form.otp} onChange={e => updateForm('otp', e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 8 }}>Demo: {lang === 'hi' ? 'कोई भी 6 अंक दर्ज करें' : 'Enter any 6 digits'}</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(2)}><ArrowLeft size={18} /> {lang === 'hi' ? 'पीछे' : 'Back'}</button>
                  <button className="btn btn-success btn-lg" style={{ flex: 1 }} onClick={handleSubmit}>{t('auth_verify')} <Check size={18} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="auth-footer">
            {t('auth_has_account')} <Link to="/login">{t('auth_login')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
