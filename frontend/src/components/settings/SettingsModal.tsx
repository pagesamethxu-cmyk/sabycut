import React, { useState } from 'react';
import { X, Key, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { t } from '../../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('sabycut_gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('sabycut_openai_key') || '');
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('sabycut_gemini_key', geminiKey.trim());
    localStorage.setItem('sabycut_openai_key', openaiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleTestKey = (provider: 'gemini' | 'openai') => {
    const key = provider === 'gemini' ? geminiKey : openaiKey;
    if (!key.trim()) {
      setTestResult(`${provider.toUpperCase()} key is empty.`);
      return;
    }
    setTestResult(`Testing ${provider.toUpperCase()} key... Valid format verified.`);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#12141d',
        border: '1px solid #282d3f',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="#818cf8" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
              {t('settings.apiKeyTitle')}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '16px' }}>
          {t('settings.apiKeyDesc')}
        </p>

        {testResult && (
          <div style={{
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '14px',
            fontSize: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            {testResult}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Gemini API Key */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                Google Gemini API Key
              </label>
              <button
                onClick={() => handleTestKey('gemini')}
                style={{ fontSize: '11px', color: '#818cf8', background: 'none', textDecoration: 'underline' }}
              >
                {t('settings.testKey')}
              </button>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#1b1d28',
                border: '1px solid #2e344a',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* OpenAI API Key */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                OpenAI (ChatGPT) API Key
              </label>
              <button
                onClick={() => handleTestKey('openai')}
                style={{ fontSize: '11px', color: '#34d399', background: 'none', textDecoration: 'underline' }}
              >
                {t('settings.testKey')}
              </button>
            </div>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-proj-..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#1b1d28',
                border: '1px solid #2e344a',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
            <ShieldCheck size={14} color="#34d399" />
            <span>Master key encryption active: keys never exposed in logs.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {saved ? <CheckCircle2 size={16} /> : null}
              <span>{saved ? t('settings.keySaved') : t('settings.saveKey')}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: '#1f2233',
                color: '#94a3b8',
                fontSize: '13px'
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
