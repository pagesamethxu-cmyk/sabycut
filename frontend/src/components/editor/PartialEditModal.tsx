import React, { useState } from 'react';
import { X, Sparkles, Sliders, Scissors, Volume2 } from 'lucide-react';
import { t } from '../../i18n';
import { Clip } from './EditorStudio';

interface PartialEditModalProps {
  isOpen: boolean;
  selectedClip: Clip | null;
  onClose: () => void;
  onApplyPartialEdit: (clipId: string, instruction: string) => void;
}

export const PartialEditModal: React.FC<PartialEditModalProps> = ({
  isOpen,
  selectedClip,
  onClose,
  onApplyPartialEdit
}) => {
  const [instruction, setInstruction] = useState('');

  if (!isOpen || !selectedClip) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    onApplyPartialEdit(selectedClip.id, instruction.trim());
    onClose();
  };

  const quickPrompts = [
    'Make this clip faster (1.5x speed)',
    'Remove silence in this clip',
    'Add punchy Khmer caption',
    'Slow down for dramatic effect'
  ];

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
        maxWidth: '480px',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#c084fc" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              {t('autocut.partialEdit')}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Clip Info Box */}
        <div style={{
          backgroundColor: '#181b28',
          border: '1px solid #262c42',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
              {selectedClip.title}
            </div>
            <div style={{ fontSize: '11px', color: '#818cf8', fontFamily: 'monospace', marginTop: '2px' }}>
              Range: {selectedClip.start.toFixed(1)}s - {selectedClip.end.toFixed(1)}s ({(selectedClip.end - selectedClip.start).toFixed(1)}s)
            </div>
          </div>
          <span style={{
            fontSize: '10px',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            textTransform: 'uppercase',
            fontWeight: 700
          }}>
            {selectedClip.type}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
            {t('autocut.promptLabel')} (Do not use emoji)
          </label>
          <textarea
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={t('autocut.partialPromptPlaceholder')}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#181b28',
              border: '1px solid #2d344d',
              color: '#ffffff',
              fontSize: '12px',
              lineHeight: '1.4',
              marginBottom: '10px',
              fontFamily: "'Noto Sans Khmer', sans-serif"
            }}
          />

          {/* Quick preset suggestion chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInstruction(q)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#1c2030',
                  border: '1px solid #2e3650',
                  color: '#94a3b8',
                  fontSize: '10px'
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={!instruction.trim()}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: instruction.trim() ? '#4f46e5' : '#292f44',
                color: instruction.trim() ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} />
              <span>Apply Partial Edit</span>
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
