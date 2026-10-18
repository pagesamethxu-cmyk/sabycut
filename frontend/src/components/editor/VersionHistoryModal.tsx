import React from 'react';
import { X, History, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { t } from '../../i18n';
import { Clip } from './EditorStudio';
import { ClipProperties } from './ClipInspector';

export interface TimelineSnapshot {
  id: string;
  label: string;
  timestamp: string;
  videoClips: Clip[];
  textClips: Clip[];
  sfxClips: Clip[];
  musicClips?: Clip[];
  clipPropsMap: Record<string, ClipProperties>;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '3:4';
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  snapshots: TimelineSnapshot[];
  currentSnapshotId?: string;
  onRestore: (snapshot: TimelineSnapshot) => void;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  snapshots,
  currentSnapshotId,
  onRestore,
  onClose
}) => {
  if (!isOpen) return null;

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
        maxWidth: '520px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #23283c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="#818cf8" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              {t('autocut.versionHistory')}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        {/* Snapshots List */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {snapshots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
              No snapshots recorded yet.
            </div>
          ) : (
            snapshots.map((snap) => {
              const isCurrent = snap.id === currentSnapshotId;
              const isAi = snap.label.toLowerCase().includes('ai');

              return (
                <div
                  key={snap.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.12)' : '#181b28',
                    border: isCurrent ? '1px solid #818cf8' : '1px solid #262c42'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isAi ? 'rgba(167, 139, 250, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isAi ? <Sparkles size={16} color="#c4b5fd" /> : <History size={16} color="#818cf8" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        {snap.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {snap.timestamp} • {snap.videoClips.length} clips • {snap.aspectRatio}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onRestore(snap);
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#272d42',
                          border: '1px solid #373e5b',
                          color: '#e2e8f0',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        <RotateCcw size={12} />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
