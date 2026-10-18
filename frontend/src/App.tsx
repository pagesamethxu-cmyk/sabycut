import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Settings as SettingsIcon, 
  Film, 
  Sparkles,
  Plus,
  User as UserIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { initI18n, t, SupportedLanguage } from './i18n';
import { api, setAuthToken, clearAuthToken, getAuthToken } from './services/api';
import { User } from './types';
import { EditorStudio } from './components/editor/EditorStudio';
import { AutoCutModal, AutoCutResult } from './components/autocut/AutoCutModal';
import { SettingsPage, SettingsSection } from './components/settings/SettingsPage';
import { RecentProjects } from './components/home/RecentProjects';
import { AiKeyRequiredModal } from './components/autocut/AiKeyRequiredModal';
import { SafeAreaDebugOverlay } from './components/common/SafeAreaDebugOverlay';
import { initLifecycleManager } from './services/lifecycleManager';

export function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [initialAutoCutResult, setInitialAutoCutResult] = useState<AutoCutResult | null>(null);

  // Global modals and panels
  const [isAutoCutOpen, setIsAutoCutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('account');
  const [isAiKeyRequiredOpen, setIsAiKeyRequiredOpen] = useState(false);

  // Debug overlay
  const [safeAreaDebug, setSafeAreaDebug] = useState(() => localStorage.getItem('sabycut_debug_safe_areas') === 'true');

  // Form states for auth
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedLang = (localStorage.getItem('sabycut_lang') as SupportedLanguage) || 'km';
    initI18n(savedLang).then(() => {
      setIsI18nReady(true);
    });

    if (getAuthToken()) {
      api.auth.getMe()
        .then((userData) => setUser(userData))
        .catch(() => clearAuthToken());
    }

    initLifecycleManager(async () => {
      // Auto-save active project state on background
      try {
        const active = localStorage.getItem('sabycut_current_project');
        if (active) {
          localStorage.setItem('sabycut_autosave_backup', active);
        }
      } catch (err) {
        console.warn('Autosave snapshot failed:', err);
      }
    });

    const handleDebugChanged = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setSafeAreaDebug(Boolean(custom.detail));
    };
    window.addEventListener('sabycut_safe_area_debug_changed', handleDebugChanged);
    return () => {
      window.removeEventListener('sabycut_safe_area_debug_changed', handleDebugChanged);
    };
  }, []);

  const hasSavedAiKey = (): boolean => {
    try {
      const rawVault = localStorage.getItem('sabycut_vault_keys');
      if (rawVault) {
        const parsed = JSON.parse(rawVault);
        if (Array.isArray(parsed) && parsed.length > 0) return true;
      }
      const gemini = localStorage.getItem('sabycut_gemini_key') || localStorage.getItem('sabycut_gemini_lastfour');
      const openai = localStorage.getItem('sabycut_openai_key') || localStorage.getItem('sabycut_openai_lastfour');
      return Boolean((gemini && gemini.trim().length > 0) || (openai && openai.trim().length > 0));
    } catch {
      return false;
    }
  };

  const handleAutoCutClick = () => {
    if (hasSavedAiKey()) {
      setIsAutoCutOpen(true);
    } else {
      setIsAiKeyRequiredOpen(true);
    }
  };

  const handleOpenSettings = (section: SettingsSection = 'account') => {
    setSettingsSection(section);
    setIsSettingsOpen(true);
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

  if (!isI18nReady) {
    return (
      <div style={{
        display: 'flex',
        height: 'var(--app-height, 100dvh)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0b10',
        color: '#ffffff'
      }}>
        <span>Loading...</span>
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
    <div
      data-testid="app-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'var(--app-height, 100dvh)',
        backgroundColor: '#0a0b10',
        overflow: 'hidden'
      }}
    >
      {/* Safe Area Boundaries Debug Overlay */}
      <SafeAreaDebugOverlay enabled={safeAreaDebug} />

      {/* Top Header with Safe Area Handling */}
      <header
        data-testid="app-header"
        style={{
          height: 'calc(56px + var(--sat, env(safe-area-inset-top, 0px)))',
          paddingTop: 'var(--sat, env(safe-area-inset-top, 0px))',
          paddingLeft: 'max(var(--sal, env(safe-area-inset-left, 0px)), 16px)',
          paddingRight: 'max(var(--sar, env(safe-area-inset-right, 0px)), 16px)',
          backgroundColor: '#12141c',
          borderBottom: '1px solid #232738',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 30,
          boxSizing: 'border-box'
        }}
      >
        {/* Brand / Logo and App Name on the left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Scissors size={18} color="#ffffff" />
          </div>
          <span
            data-testid="app-brand-title"
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.5px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {t('app.title')}
          </span>
        </div>

        {/* Settings Icon Button on the right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => handleOpenSettings('account')}
            data-testid="settings-header-btn"
            title={t('nav.settings')}
            aria-label={t('nav.settings')}
            className="touch-target"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#1b1d28',
              border: '1px solid #2a2f42',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        data-testid="home-main-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: '20px',
          paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 24px)',
          paddingLeft: 'max(var(--sal, env(safe-area-inset-left, 0px)), 16px)',
          paddingRight: 'max(var(--sar, env(safe-area-inset-right, 0px)), 16px)',
          maxWidth: '1080px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Primary Actions: New Project and AI Auto Cut side by side in ONE ROW */}
        <section
          data-testid="primary-actions-section"
          className="primary-actions-row"
        >
          {/* Card Button 1: New Project */}
          <button
            type="button"
            data-testid="action-new-project-btn"
            onClick={() => setCurrentView('editor')}
            className="touch-target"
            style={{
              minHeight: '120px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              border: '1px solid rgba(165, 180, 252, 0.3)',
              boxShadow: '0 8px 24px -4px rgba(79, 70, 229, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Film size={26} />
            </div>
            <span style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}>
              {t('nav.newProject')}
            </span>
          </button>

          {/* Card Button 2: AI Auto Cut */}
          <button
            type="button"
            data-testid="action-auto-cut-btn"
            onClick={handleAutoCutClick}
            className="touch-target"
            style={{
              minHeight: '120px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #20183b 0%, #2e1065 100%)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              boxShadow: '0 8px 24px -4px rgba(168, 85, 247, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(168, 85, 247, 0.25)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c4b5fd'
            }}>
              <Sparkles size={26} />
            </div>
            <span style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}>
              {t('nav.autoCut')}
            </span>
          </button>
        </section>

        {/* Below the buttons: Recent Projects Grid and Empty State */}
        <RecentProjects
          onOpenProject={(_id) => setCurrentView('editor')}
          onNewProject={() => setCurrentView('editor')}
        />
      </main>

      {/* Global Modals & Pages */}
      <SettingsPage
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSection={settingsSection}
        onSafeAreaDebugChange={setSafeAreaDebug}
        user={user}
        onUserChange={setUser}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <AiKeyRequiredModal
        isOpen={isAiKeyRequiredOpen}
        onClose={() => setIsAiKeyRequiredOpen(false)}
        onOpenSettings={() => handleOpenSettings('aiProvider')}
      />

      <AutoCutModal
        isOpen={isAutoCutOpen}
        onClose={() => setIsAutoCutOpen(false)}
        onOpenSettings={() => handleOpenSettings('aiProvider')}
        onApply={(result) => {
          setInitialAutoCutResult(result);
          setIsAutoCutOpen(false);
          setCurrentView('editor');
        }}
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
          zIndex: 90,
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
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isSubmitting ? t('common.loading') : authMode === 'login' ? t('auth.login') : t('auth.register')}
              </button>
            </form>

            {/* Guest / Bypass Option */}
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setUser({ id: 'guest', username: 'Guest', email: 'guest@sabycut.local', role: 'ROLE_USER' });
                  setShowAuthModal(false);
                }}
                style={{
                  background: 'none',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  cursor: 'pointer'
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
                type="button"
                onClick={() => setShowAuthModal(false)}
                style={{ background: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
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
