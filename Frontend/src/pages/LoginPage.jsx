import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginSuccess } from '../features/auth/authSlice';
import { loginAPI, registerAPI } from '../services/api';
import { Shield, Camera, BarChart3, CreditCard, AlertCircle, Loader2, Globe, Mail, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
];

export default function LoginPage() {
  const { t, i18n } = useTranslation();

  // ── Auth mode: 'login' or 'signup' ──
  const [mode, setMode] = useState('login');

  // ── Shared state ──
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // ── Sign-up only ──
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Role (for login tab selection) ──
  const [role, setRole] = useState('admin');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const handleLangChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('viris_lang', code);
    setLangOpen(false);
  };

  // ── Google OAuth callback ──
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleUsername = params.get('username');
    const googleRole = params.get('role');
    if (googleUsername && googleRole) {
      dispatch(loginSuccess({ username: googleUsername, role: googleRole }));
      toast.success(t('login.welcomeToast', { name: googleUsername }));
      navigate(googleRole === 'admin' ? '/admin/dashboard' : '/user/my-violations');
    }
  }, [location, dispatch, navigate, t]);

  // ── Reset errors when switching mode ──
  useEffect(() => {
    setError('');
  }, [mode]);

  // ── Handle Login ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError(t('login.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await loginAPI({ username, password });
      const { access_token, role: userRole, username: uname } = res.data;

      // Validate selected role matches actual role from database
      if (role === 'admin' && userRole !== 'admin') {
        setError(t('login.notAdmin'));
        setLoading(false);
        return;
      }
      if (role === 'user' && userRole === 'admin') {
        // Admin can still log in as citizen view if they want, but redirect to user pages
      }

      dispatch(loginSuccess({ username: uname, role: userRole, token: access_token }));
      toast.success(t('login.welcomeToast', { name: uname }));

      // Redirect based on selected role tab
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/portal');
      }
    } catch (err) {
      setError(err.response?.data?.detail || t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Signup ──
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('login.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('login.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('login.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const res = await registerAPI({ username, email, password, role: 'user' });
      const { access_token, role: userRole, username: uname } = res.data;
      dispatch(loginSuccess({ username: uname, role: userRole, email, token: access_token }));
      toast.success(t('login.signupSuccess', { name: uname }));
      navigate('/user/portal');
    } catch (err) {
      setError(err.response?.data?.detail || t('login.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:9000/auth/google/login';
  };

  return (
    <div className="login-page">
      <div className="login-bg-layer" />
      <div className="login-overlay" />

      <div className="login-content-container">
        {/* Left: Hero Section */}
        <div className="login-hero-section">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <Shield size={32} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>VIRIS</div>
          </div>

          {/* <h1>Sentinel AI</h1> */}
          <div className="full-system-title">
            Vision-Based Rider Safety Monitoring and Identification System
          </div>
          
          <p>
            An intelligent AI-powered ecosystem designed to enhance road safety through real-time helmet detection, 
            automated plate recognition, and seamless violation management.
          </p>

          <div className="login-features-grid">
            <div className="login-feature-pill">
              <div className="icon"><Camera size={20} /></div>
              <span>Smart Analysis</span>
            </div>
            <div className="login-feature-pill">
              <div className="icon"><BarChart3 size={20} /></div>
              <span>Real-time Data</span>
            </div>
            <div className="login-feature-pill">
              <div className="icon"><Shield size={20} /></div>
              <span>Secure Systems</span>
            </div>
          </div>
        </div>

        {/* Right: Auth Card */}
        <form className="login-card" onSubmit={mode === 'login' ? handleLogin : handleSignup}>
          
          {/* ── Language Selector ── */}
          <div className="lang-selector-wrapper" style={{ position: 'absolute', top: 24, right: 24, zIndex: 100 }}>
            <button
              type="button"
              className="lang-selector-btn"
              onClick={() => setLangOpen(!langOpen)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 16px', borderRadius: '12px' }}
            >
              <Globe size={16} />
              <span>{currentLang.flag} {currentLang.label}</span>
            </button>
            {langOpen && (
              <div className="lang-dropdown" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', marginTop: 8 }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className="lang-option"
                    style={{ color: 'white', padding: '12px 20px' }}
                    onClick={() => handleLangChange(lang.code)}
                  >
                    <span>{lang.flag} {lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <h3>{mode === 'login' ? t('login.welcomeBack') : t('login.createAccount')}</h3>
          <div className="subtitle">
            {mode === 'login' ? t('login.signInToContinue') : t('login.signUpToContinue')}
          </div>

          {/* ── Sign In / Sign Up Toggle (Simple link at bottom instead) ── */}

          {/* ── Role Tabs (Login only) ── */}
          {mode === 'login' && (
            <div className="role-tabs">
              <button
                type="button"
                className={`role-tab ${role === 'admin' ? 'active' : ''}`}
                style={{ flex: 1, border: 'none', background: role === 'admin' ? 'var(--primary)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setRole('admin')}
              >
                {t('login.govtOfficer')}
              </button>
              <button
                type="button"
                className={`role-tab ${role === 'user' ? 'active' : ''}`}
                style={{ flex: 1, border: 'none', background: role === 'user' ? 'var(--primary)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setRole('user')}
              >
                {t('login.citizen')}
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="login-error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* ── Username ── */}
          <div className="input-group">
            <label htmlFor="auth-username">
              <User size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: '-1px' }} />
              {t('login.username')}
            </label>
            <input
              id="auth-username"
              className="input"
              type="text"
              placeholder={t('login.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={{ width: '100%' }}
            />
          </div>

          {/* ── Email (Signup only) ── */}
          {mode === 'signup' && (
            <div className="input-group">
              <label htmlFor="auth-email">
                <Mail size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: '-1px' }} />
                {t('login.email')}
              </label>
              <input
                id="auth-email"
                className="input"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* ── Password ── */}
          <div className="input-group">
            <label htmlFor="auth-password">
              <Lock size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: '-1px' }} />
              {t('login.password')}
            </label>
            <input
              id="auth-password"
              className="input"
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{ width: '100%' }}
            />
          </div>

          {/* ── Confirm Password (Signup only) ── */}
          {mode === 'signup' && (
            <div className="input-group">
              <label htmlFor="auth-confirm-password">
                <Lock size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: '-1px' }} />
                {t('login.confirmPassword')}
              </label>
              <input
                id="auth-confirm-password"
                className="input"
                type="password"
                placeholder={t('login.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            className="btn login-btn-primary"
            disabled={loading}
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {loading ? (
              <><Loader2 size={18} className="spin-icon" /> {mode === 'login' ? t('login.signingIn') : t('login.signingUp')}</>
            ) : (
              mode === 'login' ? t('login.signIn') : t('login.signUp')
            )}
          </button>

          {/* ── Switch mode prompt ── */}
          <div className="auth-switch" style={{ marginTop: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
            {mode === 'login' ? (
              <span>
                {t('login.noAccount')}{' '}
                <button type="button" className="auth-switch-link" style={{ color: 'var(--secondary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMode('signup')}>
                  {t('login.signUp')}
                </button>
              </span>
            ) : (
              <span>
                {t('login.haveAccount')}{' '}
                <button type="button" className="auth-switch-link" style={{ color: 'var(--secondary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMode('login')}>
                  {t('login.signIn')}
                </button>
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Footer ── */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10, color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
        © 2024 VIRIS Sentinel AI Ecosystem. All Rights Reserved.
      </div>
    </div>
  );
}
