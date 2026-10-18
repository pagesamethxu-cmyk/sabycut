import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Sparkles,
  Globe,
  Palette,
  HardDrive,
  Film,
  Keyboard,
  Info,
  Bug,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Check,
  ChevronRight,
  Lock
} from 'lucide-react';
import { t, getCurrentLanguage, setLanguage, SupportedLanguage } from '../../i18n';
import { api, KeyInfo } from '../../services/api';
import { User } from '../../types';

export type SettingsSection =
  | 'account'
  | 'aiProvider'
  | 'language'
  | 'appearance'
  | 'storage'
  | 'exportDefaults'
  | 'keyboardShortcuts'
  | 'about'
  | 'debug';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SettingsSection;
  onSafeAreaDebugChange?: (enabled: boolean) => void;
  user: User | null;
  onUserChange?: (user: User | null) => void;
  onOpenAuth?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isOpen,
  onClose,
  initialSection = 'account',
  onSafeAreaDebugChange,
  user,
  onUserChange,
  onOpenAuth
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  // Sync initialSection when opened
  useEffect(() => {
    if (isOpen && initialSection) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);

  // AI Provider State
  const [selectedProvider, setSelectedProvider] = useState<'GEMINI' | 'OPENAI'>('GEMINI');
  const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem('sabycut_gemini_model') || 'gemini-1.5-flash');
  const [openaiModel, setOpenaiModel] = useState(() => localStorage.getItem('sabycut_openai_model') || 'gpt-4o-mini');
  const [inputKey, setInputKey] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [vaultKeys, setVaultKeys] = useState<KeyInfo[]>([]);
  const [aiMessage, setAiMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Language State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(getCurrentLanguage());

  // Appearance State
  const [theme, setTheme] = useState(() => localStorage.getItem('sabycut_theme') || 'dark');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('sabycut_font') || 'noto');

  // Storage State
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [projectsCount, setProjectsCount] = useState(0);

  // Export Defaults State
  const [exportRes, setExportRes] = useState(() => localStorage.getItem('sabycut_export_res') || '1080p');
  const [exportFps, setExportFps] = useState(() => localStorage.getItem('sabycut_export_fps') || '30');
  const [exportFormat, setExportFormat] = useState(() => localStorage.getItem('sabycut_export_format') || 'mp4');
  const [exportBitrate, setExportBitrate] = useState(() => localStorage.getItem('sabycut_export_bitrate') || 'high');
  const [exportSavedNotice, setExportSavedNotice] = useState(false);

  // Debug State
  const [safeAreaDebug, setSafeAreaDebug] = useState(() => localStorage.getItem('sabycut_debug_safe_areas') === 'true');
  const [simulatedInset, setSimulatedInset] = useState<string>('none');

  // Load keys on open
  useEffect(() => {
    if (isOpen) {
      loadKeys();
      updateProjectsCount();
    }
  }, [isOpen]);

  const updateProjectsCount = () => {
    try {
      const raw = localStorage.getItem('sabycut_projects');
      if (raw) {
        const parsed = JSON.parse(raw);
        setProjectsCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      setProjectsCount(0);
    }
  };

  const loadKeys = async () => {
    try {
      const keys = await api.keys.getKeys();
      setVaultKeys(keys);
    } catch {
      // Fallback
    }
  };

  const getSavedKeyForProvider = (provider: 'GEMINI' | 'OPENAI') => {
    return vaultKeys.find(k => k.provider.toUpperCase() === provider);
  };

  if (!isOpen) return null;

  // AI Key Handlers
  const handleSaveKey = async () => {
    if (!inputKey.trim()) {
      setAiMessage({ text: t('common.error'), isError: true });
      return;
    }
    setIsAiLoading(true);
    setAiMessage(null);
    const model = selectedProvider === 'GEMINI' ? geminiModel : openaiModel;

    try {
      const res = await api.keys.saveKey(selectedProvider, inputKey, model);
      await loadKeys();
      setInputKey('');
      setAiMessage({ text: t('settings.aiProvider.saveSuccess'), isError: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setAiMessage({ text: msg, isError: true });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTestKey = async () => {
    const saved = getSavedKeyForProvider(selectedProvider);
    const keyToTest = inputKey.trim() || (saved ? `saved-${saved.lastFour}` : '');

    if (!inputKey.trim() && !saved) {
      setAiMessage({ text: t('settings.aiProvider.testFailure'), isError: true });
      return;
    }

    setIsAiLoading(true);
    setAiMessage(null);
    try {
      await api.keys.testKey(selectedProvider, inputKey.trim() || 'placeholder-to-verify');
      setAiMessage({ text: t('settings.aiProvider.testSuccess'), isError: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('settings.aiProvider.testFailure');
      setAiMessage({ text: msg, isError: true });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    setIsAiLoading(true);
    setAiMessage(null);
    try {
      await api.keys.deleteKey(selectedProvider);
      await loadKeys();
      setInputKey('');
      setAiMessage({ text: t('settings.aiProvider.deleteSuccess'), isError: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setAiMessage({ text: msg, isError: true });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Language Handler
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    setCurrentLang(lang);
  };

  // Appearance Handler
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('sabycut_theme', newTheme);
  };

  const handleFontChange = (newFont: string) => {
    setFontFamily(newFont);
    localStorage.setItem('sabycut_font', newFont);
  };

  // Storage Handlers
  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      setStorageNotice(t('settings.storage.clearSuccess'));
      setTimeout(() => setStorageNotice(null), 3000);
    } catch {
      // Storage issue
    }
  };

  const handleResetData = () => {
    if (window.confirm(t('settings.storage.resetConfirm'))) {
      localStorage.removeItem('sabycut_projects');
      localStorage.removeItem('sabycut_vault_keys');
      localStorage.removeItem('sabycut_gemini_key');
      localStorage.removeItem('sabycut_openai_key');
      updateProjectsCount();
      loadKeys();
      setStorageNotice(t('settings.storage.clearSuccess'));
      setTimeout(() => setStorageNotice(null), 3000);
    }
  };

  // Export Defaults Handler
  const handleSaveExportDefaults = (res: string, fps: string, fmt: string, br: string) => {
    setExportRes(res);
    setExportFps(fps);
    setExportFormat(fmt);
    setExportBitrate(br);
    localStorage.setItem('sabycut_export_res', res);
    localStorage.setItem('sabycut_export_fps', fps);
    localStorage.setItem('sabycut_export_format', fmt);
    localStorage.setItem('sabycut_export_bitrate', br);
    setExportSavedNotice(true);
    setTimeout(() => setExportSavedNotice(false), 2000);
  };

  // Debug Handler
  const handleToggleSafeAreaDebug = () => {
    const nextVal = !safeAreaDebug;
    setSafeAreaDebug(nextVal);
    localStorage.setItem('sabycut_debug_safe_areas', String(nextVal));
    window.dispatchEvent(new CustomEvent('sabycut_safe_area_debug_changed', { detail: nextVal }));
    if (onSafeAreaDebugChange) {
      onSafeAreaDebugChange(nextVal);
    }
  };

  const simulateInsets = (type: 'island' | 'notch' | 'reset') => {
    setSimulatedInset(type);
    if (type === 'island') {
      document.documentElement.style.setProperty('--sat', '59px');
      document.documentElement.style.setProperty('--sab', '34px');
      document.documentElement.style.setProperty('--sal', '0px');
      document.documentElement.style.setProperty('--sar', '0px');
    } else if (type === 'notch') {
      document.documentElement.style.setProperty('--sat', '47px');
      document.documentElement.style.setProperty('--sab', '34px');
      document.documentElement.style.setProperty('--sal', '0px');
      document.documentElement.style.setProperty('--sar', '0px');
    } else {
      document.documentElement.style.removeProperty('--sat');
      document.documentElement.style.removeProperty('--sab');
      document.documentElement.style.removeProperty('--sal');
      document.documentElement.style.removeProperty('--sar');
    }
  };

  const sectionsList: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: t('settings.sections.account'), icon: <UserIcon size={16} /> },
    { id: 'aiProvider', label: t('settings.sections.aiProvider'), icon: <Sparkles size={16} /> },
    { id: 'language', label: t('settings.sections.language'), icon: <Globe size={16} /> },
    { id: 'appearance', label: t('settings.sections.appearance'), icon: <Palette size={16} /> },
    { id: 'storage', label: t('settings.sections.storage'), icon: <HardDrive size={16} /> },
    { id: 'exportDefaults', label: t('settings.sections.exportDefaults'), icon: <Film size={16} /> },
    { id: 'keyboardShortcuts', label: t('settings.sections.keyboardShortcuts'), icon: <Keyboard size={16} /> },
    { id: 'about', label: t('settings.sections.about'), icon: <Info size={16} /> },
    { id: 'debug', label: t('settings.sections.debug'), icon: <Bug size={16} /> }
  ];

  const savedKeyForSelected = getSavedKeyForProvider(selectedProvider);

  return (
    <div
      data-testid="settings-page"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0c0e15',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        height: 'var(--app-height, 100dvh)',
        overflow: 'hidden'
      }}
    >
      {/* Top Header with safe area padding */}
      <header
        style={{
          height: 'calc(56px + var(--sat, env(safe-area-inset-top, 0px)))',
          paddingTop: 'var(--sat, env(safe-area-inset-top, 0px))',
          paddingLeft: 'max(var(--sal, env(safe-area-inset-left, 0px)), 16px)',
          paddingRight: 'max(var(--sar, env(safe-area-inset-right, 0px)), 16px)',
          backgroundColor: '#121520',
          borderBottom: '1px solid #23283c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap'
            }}
          >
            {t('settings.title')}
          </h1>
          <span
            style={{
              fontSize: '11px',
              color: '#818cf8',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {sectionsList.find(s => s.id === activeSection)?.label}
          </span>
        </div>

        <button
          onClick={onClose}
          data-testid="close-settings-btn"
          aria-label={t('nav.close')}
          className="touch-target"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#1b1f30',
            border: '1px solid #2b334d',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>
      </header>

      {/* Main Settings Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          paddingBottom: 'var(--sab, env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'var(--sal, env(safe-area-inset-left, 0px))',
          paddingRight: 'var(--sar, env(safe-area-inset-right, 0px))'
        }}
      >
        {/* Navigation Tabs (Sidebar on wide screens, Horizontal bar on narrow screens) */}
        <aside
          className="settings-nav"
          style={{
            width: '240px',
            backgroundColor: '#10131d',
            borderRight: '1px solid #20263a',
            overflowY: 'auto',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flexShrink: 0
          }}
        >
          {sectionsList.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                data-testid={`settings-tab-${sec.id}`}
                onClick={() => setActiveSection(sec.id)}
                className="touch-target"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#4f46e5' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ color: isActive ? '#ffffff' : '#818cf8', flexShrink: 0 }}>
                  {sec.icon}
                </div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sec.label}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Content Pane */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* SECTION 1: ACCOUNT */}
          {activeSection === 'account' && (
            <div data-testid="section-account" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '28px',
                    backgroundColor: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}>
                    <UserIcon size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                      {user ? user.username : t('settings.account.guestUser')}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                      {user ? user.email : t('settings.account.guestNote')}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: user ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: user ? '#34d399' : '#fbbf24',
                      border: `1px solid ${user ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}>
                      {user ? user.role : t('settings.account.guestUser')}
                    </span>
                  </div>
                </div>

                {user ? (
                  <button
                    onClick={() => {
                      if (onUserChange) onUserChange(null);
                    }}
                    className="touch-target"
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#202538',
                      border: '1px solid #2f3854',
                      color: '#f87171',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('settings.account.signOut')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="touch-target"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('settings.account.signIn')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: AI PROVIDER */}
          {activeSection === 'aiProvider' && (
            <div data-testid="section-aiProvider" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={20} color="#a78bfa" />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                    {t('settings.aiProvider.title')}
                  </h2>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '16px' }}>
                  {t('settings.aiProvider.desc')}
                </p>

                {/* Feedback Message */}
                {aiMessage && (
                  <div
                    data-testid="ai-feedback-banner"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: aiMessage.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                      color: aiMessage.isError ? '#f87171' : '#34d399',
                      border: `1px solid ${aiMessage.isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
                    }}
                  >
                    {aiMessage.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                    <span>{aiMessage.text}</span>
                  </div>
                )}

                {/* Provider Selector Tabs */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    {t('settings.aiProvider.selectProvider')}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      data-testid="provider-gemini-btn"
                      onClick={() => {
                        setSelectedProvider('GEMINI');
                        setAiMessage(null);
                      }}
                      className="touch-target"
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: selectedProvider === 'GEMINI' ? '#4f46e5' : '#191d2c',
                        border: `1px solid ${selectedProvider === 'GEMINI' ? '#6366f1' : '#2b334d'}`,
                        color: selectedProvider === 'GEMINI' ? '#ffffff' : '#cbd5e1',
                        fontSize: '13px',
                        fontWeight: selectedProvider === 'GEMINI' ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      Google Gemini
                    </button>
                    <button
                      type="button"
                      data-testid="provider-openai-btn"
                      onClick={() => {
                        setSelectedProvider('OPENAI');
                        setAiMessage(null);
                      }}
                      className="touch-target"
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: selectedProvider === 'OPENAI' ? '#4f46e5' : '#191d2c',
                        border: `1px solid ${selectedProvider === 'OPENAI' ? '#6366f1' : '#2b334d'}`,
                        color: selectedProvider === 'OPENAI' ? '#ffffff' : '#cbd5e1',
                        fontSize: '13px',
                        fontWeight: selectedProvider === 'OPENAI' ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      OpenAI (ChatGPT)
                    </button>
                  </div>
                </div>

                {/* Model Selector */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    {t('settings.aiProvider.selectModel')}
                  </label>
                  {selectedProvider === 'GEMINI' ? (
                    <select
                      data-testid="gemini-model-select"
                      value={geminiModel}
                      onChange={(e) => {
                        setGeminiModel(e.target.value);
                        localStorage.setItem('sabycut_gemini_model', e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1b1f30',
                        border: '1px solid #2e3650',
                        color: '#ffffff',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="gemini-1.5-flash">{t('settings.aiProvider.models.gemini15Flash')}</option>
                      <option value="gemini-1.5-pro">{t('settings.aiProvider.models.gemini15Pro')}</option>
                      <option value="gemini-2.0-flash">{t('settings.aiProvider.models.gemini20Flash')}</option>
                    </select>
                  ) : (
                    <select
                      data-testid="openai-model-select"
                      value={openaiModel}
                      onChange={(e) => {
                        setOpenaiModel(e.target.value);
                        localStorage.setItem('sabycut_openai_model', e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1b1f30',
                        border: '1px solid #2e3650',
                        color: '#ffffff',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="gpt-4o-mini">{t('settings.aiProvider.models.gpt4oMini')}</option>
                      <option value="gpt-4o">{t('settings.aiProvider.models.gpt4o')}</option>
                      <option value="o1-mini">{t('settings.aiProvider.models.o1Mini')}</option>
                    </select>
                  )}
                </div>

                {/* Vault Key Status (Masked last 4 characters) */}
                {savedKeyForSelected && (
                  <div
                    data-testid="vault-key-status"
                    style={{
                      marginBottom: '18px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(52, 211, 153, 0.1)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="#34d399" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                          {t('settings.aiProvider.statusConfigured')}
                        </span>
                      </div>
                      <div style={{
                        marginTop: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: '#f8fafc',
                        letterSpacing: '1px'
                      }}>
                        •••• •••• •••• {savedKeyForSelected.lastFour}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="delete-key-btn"
                      onClick={handleDeleteKey}
                      disabled={isAiLoading}
                      title={t('settings.aiProvider.deleteKey')}
                      className="touch-target"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{t('settings.aiProvider.deleteKey')}</span>
                    </button>
                  </div>
                )}

                {/* Paste API Key Field */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    {savedKeyForSelected ? t('settings.aiProvider.pasteKey') : t('settings.aiProvider.pasteKey')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showKeyText ? 'text' : 'password'}
                      data-testid="ai-key-input"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder={selectedProvider === 'GEMINI' ? 'AIzaSy...' : 'sk-proj-...'}
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1b1f30',
                        border: '1px solid #2e3650',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="touch-target"
                      style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        color: '#94a3b8',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Test Key, Save Key */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    data-testid="test-key-btn"
                    onClick={handleTestKey}
                    disabled={isAiLoading}
                    className="touch-target"
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#22273a',
                      border: '1px solid #333d5c',
                      color: '#cbd5e1',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{t('settings.aiProvider.testKey')}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="save-key-btn"
                    onClick={handleSaveKey}
                    disabled={isAiLoading || !inputKey.trim()}
                    className="touch-target"
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: !inputKey.trim() ? 0.6 : 1
                    }}
                  >
                    <Lock size={14} />
                    <span>{t('settings.aiProvider.saveKey')}</span>
                  </button>
                </div>

                {/* Encryption Security Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  fontSize: '11px',
                  color: '#64748b'
                }}>
                  <ShieldCheck size={14} color="#34d399" />
                  <span>{t('settings.aiProvider.encryptionNotice')}</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: LANGUAGE */}
          {activeSection === 'language' && (
            <div data-testid="section-language" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  {t('settings.language.title')}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
                  {t('settings.language.desc')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    data-testid="lang-km-btn"
                    onClick={() => handleLanguageChange('km')}
                    className="touch-target"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: currentLang === 'km' ? '#1c223a' : '#171b2a',
                      border: `1px solid ${currentLang === 'km' ? '#4f46e5' : '#262d46'}`,
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{t('settings.language.km')}</span>
                    {currentLang === 'km' && <Check size={18} color="#818cf8" />}
                  </button>

                  <button
                    type="button"
                    data-testid="lang-en-btn"
                    onClick={() => handleLanguageChange('en')}
                    className="touch-target"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: currentLang === 'en' ? '#1c223a' : '#171b2a',
                      border: `1px solid ${currentLang === 'en' ? '#4f46e5' : '#262d46'}`,
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{t('settings.language.en')}</span>
                    {currentLang === 'en' && <Check size={18} color="#818cf8" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: APPEARANCE */}
          {activeSection === 'appearance' && (
            <div data-testid="section-appearance" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                  {t('settings.appearance.themeTitle')}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                  {[
                    { id: 'dark', label: t('settings.appearance.themeDark') },
                    { id: 'oled', label: t('settings.appearance.themeOled') },
                    { id: 'light', label: t('settings.appearance.themeLight') }
                  ].map((thm) => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => handleThemeChange(thm.id)}
                      className="touch-target"
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: theme === thm.id ? '#4f46e5' : '#191d2c',
                        border: `1px solid ${theme === thm.id ? '#6366f1' : '#2b334d'}`,
                        color: theme === thm.id ? '#ffffff' : '#cbd5e1',
                        fontSize: '12px',
                        fontWeight: theme === thm.id ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {thm.label}
                    </button>
                  ))}
                </div>

                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                  {t('settings.appearance.fontTitle')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { id: 'noto', label: t('settings.appearance.fontNoto'), sample: 'កម្ពុជា ប្រទេសកំណើតនៃសេចក្ដីសុខ' },
                    { id: 'kantumruy', label: t('settings.appearance.fontKantumruy'), sample: 'កម្ពុជា ប្រទេសកំណើតនៃសេចក្ដីសុខ' },
                    { id: 'battambang', label: t('settings.appearance.fontBattambang'), sample: 'កម្ពុជា ប្រទេសកំណើតនៃសេចក្ដីសុខ' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFontChange(f.id)}
                      className="touch-target"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: fontFamily === f.id ? '#1c223a' : '#171b2a',
                        border: `1px solid ${fontFamily === f.id ? '#4f46e5' : '#262d46'}`,
                        color: '#ffffff',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{f.label}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{f.sample}</div>
                      </div>
                      {fontFamily === f.id && <Check size={16} color="#818cf8" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: STORAGE */}
          {activeSection === 'storage' && (
            <div data-testid="section-storage" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  {t('settings.storage.title')}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
                  {t('settings.storage.desc')}
                </p>

                {storageNotice && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.3)'
                  }}>
                    {storageNotice}
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: '#1b1f30',
                    border: '1px solid #282f46'
                  }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('settings.storage.cacheSize')}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                      8.4 MB
                    </div>
                  </div>
                  <div style={{
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: '#1b1f30',
                    border: '1px solid #282f46'
                  }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('settings.storage.projectsStored')}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                      {projectsCount}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    data-testid="clear-cache-btn"
                    onClick={handleClearCache}
                    className="touch-target"
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#21273a',
                      border: '1px solid #313a57',
                      color: '#cbd5e1',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('settings.storage.clearCache')}
                  </button>

                  <button
                    type="button"
                    data-testid="reset-data-btn"
                    onClick={handleResetData}
                    className="touch-target"
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('settings.storage.resetData')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: EXPORT DEFAULTS */}
          {activeSection === 'exportDefaults' && (
            <div data-testid="section-exportDefaults" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  {t('settings.exportDefaults.title')}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
                  {t('settings.exportDefaults.desc')}
                </p>

                {exportSavedNotice && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    fontSize: '12px',
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.3)'
                  }}>
                    {t('settings.exportDefaults.saved')}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      {t('settings.exportDefaults.resolution')}
                    </label>
                    <select
                      value={exportRes}
                      onChange={(e) => handleSaveExportDefaults(e.target.value, exportFps, exportFormat, exportBitrate)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1b1f30',
                        border: '1px solid #2e3650',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    >
                      <option value="1080p">1080p (Full HD - 1920x1080)</option>
                      <option value="4k">4K (Ultra HD - 3840x2160)</option>
                      <option value="720p">720p (HD - 1280x720)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      {t('settings.exportDefaults.framerate')}
                    </label>
                    <select
                      value={exportFps}
                      onChange={(e) => handleSaveExportDefaults(exportRes, e.target.value, exportFormat, exportBitrate)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1b1f30',
                        border: '1px solid #2e3650',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    >
                      <option value="30">30 FPS</option>
                      <option value="60">60 FPS</option>
                      <option value="24">24 FPS</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      {t('settings.exportDefaults.format')}
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) => handleSaveExportDefaults(exportRes, exportFps, e.target.value, exportBitrate)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1b1f30',
                        border: '1px solid #2e3650',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    >
                      <option value="mp4">MP4 (H.264)</option>
                      <option value="mov">MOV (Apple ProRes)</option>
                      <option value="webm">WebM (VP9)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      {t('settings.exportDefaults.bitrate')}
                    </label>
                    <select
                      value={exportBitrate}
                      onChange={(e) => handleSaveExportDefaults(exportRes, exportFps, exportFormat, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#1b1f30',
                        border: '1px solid #2e3650',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    >
                      <option value="high">{t('settings.exportDefaults.high')}</option>
                      <option value="standard">{t('settings.exportDefaults.standard')}</option>
                      <option value="low">{t('settings.exportDefaults.low')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: KEYBOARD SHORTCUTS */}
          {activeSection === 'keyboardShortcuts' && (
            <div data-testid="section-keyboardShortcuts" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                  {t('settings.shortcuts.title')}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: t('settings.shortcuts.space'), desc: t('settings.shortcuts.spaceDesc') },
                    { key: t('settings.shortcuts.split'), desc: t('settings.shortcuts.splitDesc') },
                    { key: t('settings.shortcuts.delete'), desc: t('settings.shortcuts.deleteDesc') },
                    { key: t('settings.shortcuts.undo'), desc: t('settings.shortcuts.undoDesc') },
                    { key: t('settings.shortcuts.redo'), desc: t('settings.shortcuts.redoDesc') },
                    { key: t('settings.shortcuts.mute'), desc: t('settings.shortcuts.muteDesc') },
                    { key: t('settings.shortcuts.step'), desc: t('settings.shortcuts.stepDesc') }
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#191d2c',
                        border: '1px solid #262c42'
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{s.desc}</span>
                      <kbd style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#272e44',
                        border: '1px solid #3c4667',
                        color: '#f8fafc',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontWeight: 700
                      }}>
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: ABOUT (Includes technology list moved from home screen) */}
          {activeSection === 'about' && (
            <div data-testid="section-about" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                    {t('settings.about.appName')}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600, marginTop: '2px' }}>
                    {t('settings.about.version')}
                  </p>
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginTop: '8px' }}>
                    {t('settings.about.tagline')}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #262d46', paddingTop: '18px', marginTop: '18px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
                    {t('settings.about.techStackTitle')}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#191d2c',
                      border: '1px solid #282f48',
                      fontSize: '12px',
                      color: '#cbd5e1'
                    }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>Spring Boot Core (Java 21)</div>
                      <div style={{ color: '#94a3b8' }}>{t('settings.about.backendCore')}</div>
                    </div>

                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#191d2c',
                      border: '1px solid #282f48',
                      fontSize: '12px',
                      color: '#cbd5e1'
                    }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>AI Service (Flask + PySceneDetect + Whisper)</div>
                      <div style={{ color: '#94a3b8' }}>{t('settings.about.aiService')}</div>
                    </div>

                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#191d2c',
                      border: '1px solid #282f48',
                      fontSize: '12px',
                      color: '#cbd5e1'
                    }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>Khmer Subtitle Engine (HarfBuzz + ICU)</div>
                      <div style={{ color: '#94a3b8' }}>{t('settings.about.subtitleEngine')}</div>
                    </div>

                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#191d2c',
                      border: '1px solid #282f48',
                      fontSize: '12px',
                      color: '#cbd5e1'
                    }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>Native Mobile Packaging (Capacitor 6 / SABYCUT.ipa)</div>
                      <div style={{ color: '#94a3b8' }}>{t('settings.about.packaging')}</div>
                    </div>

                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#191d2c',
                      border: '1px solid #282f48',
                      fontSize: '12px',
                      color: '#cbd5e1'
                    }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>Encrypted Key Vault (AES-256-GCM)</div>
                      <div style={{ color: '#94a3b8' }}>{t('settings.about.encryption')}</div>
                    </div>

                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#191d2c',
                      border: '1px solid #282f48',
                      fontSize: '12px',
                      color: '#cbd5e1'
                    }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>Frontend Architecture</div>
                      <div style={{ color: '#94a3b8' }}>{t('settings.about.frontend')}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                  {t('settings.about.copyright')}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: DEBUG (Safe area boundaries overlay toggle & simulated insets) */}
          {activeSection === 'debug' && (
            <div data-testid="section-debug" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#141826',
                border: '1px solid #262d46',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  {t('settings.debug.title')}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
                  {t('settings.debug.safeAreaDesc')}
                </p>

                {/* Safe Area Boundaries Overlay Toggle Switch */}
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: '#1b1f30',
                  border: '1px solid #2c344e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {t('settings.debug.safeAreaToggle')}
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {safeAreaDebug ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid="safe-area-debug-toggle"
                    onClick={handleToggleSafeAreaDebug}
                    aria-label={t('settings.debug.safeAreaToggle')}
                    className="touch-target"
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      backgroundColor: safeAreaDebug ? '#3b82f6' : '#272b3b',
                      position: 'relative',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        transform: safeAreaDebug ? 'translateX(22px)' : 'translateX(0px)',
                        transition: 'transform 0.2s'
                      }}
                    />
                  </button>
                </div>

                {/* Simulated Inset Helpers for Testing */}
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                  Simulated Safe Area Insets
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  <button
                    type="button"
                    data-testid="simulate-island-btn"
                    onClick={() => simulateInsets('island')}
                    className="touch-target"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: simulatedInset === 'island' ? '#3b82f6' : '#1e2437',
                      border: '1px solid #333d5c',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('settings.debug.simulateIsland')}
                  </button>

                  <button
                    type="button"
                    data-testid="simulate-notch-btn"
                    onClick={() => simulateInsets('notch')}
                    className="touch-target"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: simulatedInset === 'notch' ? '#3b82f6' : '#1e2437',
                      border: '1px solid #333d5c',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('settings.debug.simulateNotch')}
                  </button>

                  <button
                    type="button"
                    data-testid="reset-insets-btn"
                    onClick={() => simulateInsets('reset')}
                    className="touch-target"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: simulatedInset === 'reset' ? '#3b82f6' : '#1e2437',
                      border: '1px solid #333d5c',
                      color: '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('settings.debug.resetInsets')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .settings-nav {
            width: 100% !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            border-right: none !important;
            border-bottom: 1px solid #20263a !important;
            white-space: nowrap !important;
            padding: 8px !important;
          }
          .settings-nav button {
            width: auto !important;
            flex-shrink: 0 !important;
          }
          div[style*="flex-direction: row"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
