import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Globe, 
  User as UserIcon, 
  LogOut, 
  Settings as SettingsIcon, 
  FolderPlus, 
  Sparkles, 
  Film, 
  ShieldCheck, 
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { initI18n, setLanguage, t, SupportedLanguage } from './i18n';
import { api, setAuthToken, clearAuthToken, getAuthToken } from './services/api';
import { User } from './types';
import { EditorStudio } from './components/editor/EditorStudio';
import { AutoCutModal, AutoCutResult } from './components/autocut/AutoCutModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { useIsMobile } from './hooks/useIsMobile';

export function App() {
  const isMobile = useIsMobile();
  const [lang, setLang] = useState<SupportedLanguage>('km');
  const [isI18nReady, setIsI18nReady] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [initialAutoCutResult, setInitialAutoCutResult] = useState<AutoCutResult | null>(null);

  // Global modals
  const [isAutoCutOpen, setIsAutoCutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedLang = (localStorage.getItem('sabycut_lang') as SupportedLanguage) || 'km';
    initI18n(savedLang).then(() => {
      setLang(savedLang);
      setIsI18nReady(true);
    });

    if (getAuthToken()) {
      api.auth.getMe()
        .then((userData) => setUser(userData))
        .catch(() => clearAuthToken());
    }
  }, []);

  const handleLanguageToggle = async () => {
    const nextLang: SupportedLanguage = lang === 'km' ? 'en' : 'km';
    await setLanguage(nextLang);
    setLang(nextLang);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'register') {
        const res = await api.auth.register({ username, email, password });
        setAuthToken(res.accessToken);
        setUser(res.user);
        setStatusMessage({ text: t('auth.registerSuccess'), isError: false });
        setTimeout(() => setShowAuthModal(false), 800);
      } else {
        const res = await api.auth.login({ usernameOrEmail: username, password });
        setAuthToken(res.accessToken);
        setUser(res.user);
        setStatusMessage({ text: t('auth.loginSuccess'), isError: false });
        setTimeout(() => setShowAuthModal(false), 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setStatusMessage({ text: msg, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
  };

  if (!isI18nReady) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <span>Loading SABYCUT...</span>
      </div>
    );
  }

  // Switch to Full Timeline Editor Studio
  if (currentView === 'editor') {
    return (
      <EditorStudio
        onBack={() => {
          setInitialAutoCutResult(null);
          setCurrentView('dashboard');
        }}
        initialAutoCutResult={initialAutoCutResult}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0a0b10' }}>
      {/* Top Navigation */}
      <header style={{
        height: isMobile ? 'auto' : '56px',
        paddingTop: isMobile ? 'max(env(safe-area-inset-top, 0px), 12px)' : '0px',
        paddingBottom: isMobile ? '12px' : '0px',
        paddingLeft: '16px',
        paddingRight: '16px',
        backgroundColor: '#12141c',
        borderBottom: '1px solid #232738',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Scissors size={18} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
              SABYCUT
            </span>
            {!isMobile && (
              <span style={{
                marginLeft: '8px',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 600
              }}>
                Core Engine
              </span>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isMobile && (
            <>
              {/* Open Editor Studio Directly */}
              <button
                onClick={() => setCurrentView('editor')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <Film size={14} />
                <span>{t('nav.newProject')}</span>
              </button>

              {/* AI Auto Cut Button */}
              <button
                onClick={() => setIsAutoCutOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  color: '#c4b5fd',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <Sparkles size={14} />
                <span>{t('nav.autoCut')}</span>
              </button>
            </>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title={t('nav.settings')}
            style={{
              padding: '7px',
              borderRadius: '8px',
              backgroundColor: '#1b1d28',
              border: '1px solid #2a2f42',
              color: '#cbd5e1'
            }}
          >
            <SettingsIcon size={14} />
          </button>

          {/* Language Toggle */}
          <button
            onClick={handleLanguageToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#1b1d28',
              border: '1px solid #2a2f42',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Globe size={13} color="#818cf8" />
            <span>{lang === 'km' ? 'ខ្មែរ' : 'EN'}</span>
          </button>

          {/* User Status / Login Button */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {!isMobile && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1b1d28',
                  border: '1px solid #2a2f42',
                  color: '#e2e8f0',
                  fontSize: '12px'
                }}>
                  <UserIcon size={14} color="#34d399" />
                  <span>{user.username}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                title={t('auth.logout')}
                style={{
                  padding: '7px',
                  borderRadius: '8px',
                  backgroundColor: '#1b1d28',
                  border: '1px solid #2a2f42',
                  color: '#f87171'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setStatusMessage(null);
                setShowAuthModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: '#1b1d28',
                border: '1px solid #2a2f42',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <UserIcon size={14} />
              {!isMobile && <span>{t('auth.login')}</span>}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '16px' : '30px 20px',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom, 0px), 24px)' : '30px'
      }}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Big Blue CapCut Style "New Project" Hero Button */}
            <div
              onClick={() => setCurrentView('editor')}
              style={{
                backgroundColor: '#4f46e5',
                borderRadius: '20px',
                padding: '30px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Film size={32} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                  {t('nav.newProject')}
                </h2>
                <p style={{ fontSize: '12px', color: '#c7d2fe', marginTop: '4px' }}>
                  {lang === 'km' ? 'ចុចទីនេះដើម្បីចាប់ផ្ដើមកាត់តវីដេអូ' : 'Tap to start editing your video'}
                </p>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => setIsAutoCutOpen(true)}
                style={{
                  backgroundColor: '#161926',
                  border: '1px solid #282f47',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={20} color="#a78bfa" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    {t('autocut.title')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Auto Cut AI
                  </div>
                </div>
              </div>

              <div
                onClick={() => setIsSettingsOpen(true)}
                style={{
                  backgroundColor: '#161926',
                  border: '1px solid #282f47',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(52, 211, 153, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <SettingsIcon size={20} color="#34d399" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    {t('settings.title')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    API Keys
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Highlights Pill */}
            <div style={{
              backgroundColor: '#12141d',
              border: '1px solid #222638',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                <ShieldCheck size={14} color="#34d399" />
                <span>Spring Boot Core (Java 21)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                <Sparkles size={14} color="#a78bfa" />
                <span>HarfBuzz Khmer Subtitle Shaping</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                <Smartphone size={14} color="#38bdf8" />
                <span>iOS Native App Package (SABYCUT.ipa)</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div style={{
              backgroundColor: '#13151f',
              borderRadius: '16px',
              border: '1px solid #23273a',
              padding: '28px',
              marginBottom: '24px'
            }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                {t('app.title')}
              </h1>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                {t('app.subtitle')}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#1a1d2b',
                  border: '1px solid #292e44',
                  fontSize: '12px',
                  color: '#cbd5e1'
                }}>
                  <ShieldCheck size={16} color="#34d399" />
                  <span>Backend Core: Spring Boot (Java 21)</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#1a1d2b',
                  border: '1px solid #292e44',
                  fontSize: '12px',
                  color: '#cbd5e1'
                }}>
                  <Sparkles size={16} color="#a78bfa" />
                  <span>AI Service: Flask + PySceneDetect + Whisper</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#1a1d2b',
                  border: '1px solid #292e44',
                  fontSize: '12px',
                  color: '#cbd5e1'
                }}>
                  <Smartphone size={16} color="#38bdf8" />
                  <span>Packaging: PWA + Capacitor (Android / iOS)</span>
                </div>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Card 1: Project Creator -> Opens EditorStudio */}
              <div style={{
                backgroundColor: '#13151f',
                borderRadius: '14px',
                border: '1px solid #23273a',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <FolderPlus size={20} color="#818cf8" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                    {t('nav.newProject')}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '16px' }}>
                  {t('editor.tracks')} - Multi-track timeline (Video, Audio, SFX, Text/Captions).
                </p>
                <button
                  onClick={() => setCurrentView('editor')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Film size={16} />
                  <span>{t('nav.newProject')} (Open Editor)</span>
                </button>
              </div>

              {/* Card 2: AI Auto Cut -> Opens AutoCutModal */}
              <div style={{
                backgroundColor: '#13151f',
                borderRadius: '14px',
                border: '1px solid #23273a',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Sparkles size={20} color="#a78bfa" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                    {t('autocut.title')}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '16px' }}>
                  {t('autocut.description')}
                </p>
                <button
                  onClick={() => setIsAutoCutOpen(true)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1f2233',
                    border: '1px solid #323852',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} color="#a78bfa" />
                  <span>{t('autocut.selectForm')}</span>
                </button>
              </div>

              {/* Card 3: Encrypted Vault Settings -> Opens SettingsModal */}
              <div style={{
                backgroundColor: '#13151f',
                borderRadius: '14px',
                border: '1px solid #23273a',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <SettingsIcon size={20} color="#34d399" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                    {t('settings.apiKeyTitle')}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '16px' }}>
                  {t('settings.apiKeyDesc')}
                </p>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1f2233',
                    border: '1px solid #323852',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <SettingsIcon size={16} color="#34d399" />
                  <span>{t('settings.title')}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </main>


      {/* Global Modals */}
      <AutoCutModal
        isOpen={isAutoCutOpen}
        onClose={() => setIsAutoCutOpen(false)}
        onApply={(result) => {
          setInitialAutoCutResult(result);
          setIsAutoCutOpen(false);
          setCurrentView('editor');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#13151f',
            border: '1px solid #2a2f44',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              {authMode === 'login' ? t('auth.login') : t('auth.register')}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
              Spring Boot Core Authentication (JWT)
            </p>

            {statusMessage && (
              <div style={{
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: statusMessage.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                color: statusMessage.isError ? '#f87171' : '#34d399',
                border: `1px solid ${statusMessage.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
              }}>
                {statusMessage.isError ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  {t('auth.username')}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1b1d28',
                    border: '1px solid #2e344a',
                    color: '#ffffff',
                    fontSize: '13px'
                  }}
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#1b1d28',
                      border: '1px solid #2e344a',
                      color: '#ffffff',
                      fontSize: '13px'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1b1d28',
                    border: '1px solid #2e344a',
                    color: '#ffffff',
                    fontSize: '13px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {isSubmitting ? t('common.loading') : authMode === 'login' ? t('auth.login') : t('auth.register')}
              </button>
            </form>

            {/* Guest / Bypass Option */}
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setUser({ id: 'guest', username: 'Guest', email: 'guest@sabycut.local', role: 'ROLE_USER' });
                  setShowAuthModal(false);
                }}
                style={{
                  background: 'none',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  textDecoration: 'underline'
                }}
              >
                {t('auth.guestMode')}
              </button>
            </div>

            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              {authMode === 'login' ? (
                <span>
                  {t('auth.noAccount')}{' '}
                  <span
                    onClick={() => {
                      setStatusMessage(null);
                      setAuthMode('register');
                    }}
                    style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {t('auth.register')}
                  </span>
                </span>
              ) : (
                <span>
                  {t('auth.haveAccount')}{' '}
                  <span
                    onClick={() => {
                      setStatusMessage(null);
                      setAuthMode('login');
                    }}
                    style={{ color: '#818cf8', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {t('auth.login')}
                  </span>
                </span>
              )}
            </div>

            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{ background: 'none', color: '#64748b', fontSize: '12px' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
