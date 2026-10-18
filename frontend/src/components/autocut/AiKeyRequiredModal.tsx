import React from 'react';
import { Key, X, ArrowRight } from 'lucide-react';
import { t } from '../../i18n';

interface AiKeyRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const AiKeyRequiredModal: React.FC<AiKeyRequiredModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="ai-key-required-dialog"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        padding: '16px',
        paddingTop: 'max(var(--sat, 0px), 16px)',
        paddingBottom: 'max(var(--sab, 0px), 16px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#131622',
          border: '1px solid #282f46',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          padding: '24px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'rgba(167, 139, 250, 0.15)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa'
          }}>
            <Key size={22} />
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.cancel')}
            className="touch-target"
            style={{
              background: 'none',
              color: '#94a3b8',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          {t('autocut.keyRequiredTitle')}
        </h3>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '22px' }}>
          {t('autocut.keyRequiredDesc')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            data-testid="configure-ai-provider-btn"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="touch-target"
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <span>{t('autocut.configureKeyBtn')}</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="touch-target"
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#1b1f30',
              border: '1px solid #282f46',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiKeyRequiredModal;
