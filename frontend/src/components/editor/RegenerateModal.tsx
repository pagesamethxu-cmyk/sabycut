import React, { useState } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { t } from '../../i18n';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (extraPrompt: string) => void;
}

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  isOpen,
  onClose,
  onRegenerate
}) => {
  const [extraPrompt, setExtraPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegenerate(extraPrompt.trim());
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#12141f',
        border: '1px solid #2e354f',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} color="#c084fc" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              {t('autocut.regenerate')}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '14px' }}>
          Regenerate the AI Cut with modified instructions while keeping your imported source videos.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
            {t('autocut.promptLabel')} (Do not use emoji)
          </label>
          <textarea
            rows={3}
            value={extraPrompt}
            onChange={(e) => setExtraPrompt(e.target.value)}
            placeholder="Type extra instructions (e.g. faster cuts, emphasize high energy action, add more whoosh and riser effects. Do not use emoji.)"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#181b28',
              border: '1px solid #2d344d',
              color: '#ffffff',
              fontSize: '12px',
              lineHeight: '1.4',
              marginBottom: '16px',
              fontFamily: "'Noto Sans Khmer', sans-serif"
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} />
              <span>{t('autocut.regenerate')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: '#1c2030',
                color: '#94a3b8',
                fontSize: '12px'
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
