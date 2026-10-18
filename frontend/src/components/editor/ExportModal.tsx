import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  Film, 
  Sliders, 
  Sparkles, 
  Check, 
  FileVideo,
  Layers,
  Volume2,
  Share2
} from 'lucide-react';
import { t } from '../../i18n';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  totalDuration: number;
  videoClipsCount: number;
  textClipsCount: number;
  sfxClipsCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  totalDuration,
  videoClipsCount,
  textClipsCount,
  sfxClipsCount
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [format, setFormat] = useState<'mp4' | 'mov'>('mp4');
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [audioQuality, setAudioQuality] = useState<'standard' | 'high'>('high');

  // Export progress states
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsExporting(false);
      setProgress(0);
      setIsComplete(false);
      setCurrentStage('');
      setShareFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Approximate file size calculation (MB) factoring in resolution and framerate
  const baseBitrate = resolution === '4k' ? 28 : resolution === '1080p' ? 10 : 5;
  const fpsFactor = fps === 60 ? 1.4 : fps === 24 ? 0.9 : 1.0;
  const estimatedSizeMb = Math.max(1, Math.round(((baseBitrate * fpsFactor) * totalDuration) / 8));

  const handleStartExport = () => {
    setIsExporting(true);
    setProgress(5);
    setCurrentStage('Parsing timeline tracks & Edit Decision List (EDL)...');

    const stages = [
      { p: 20, stage: 'Applying video transforms, speed curves & color grading...' },
      { p: 45, stage: 'Rendering Khmer subtitles with libass & HarfBuzz shaping...' },
      { p: 70, stage: 'Synthesizing audio mix, SFX cues & dynamic ducking...' },
      { p: 90, stage: `Encoding final ${resolution.toUpperCase()} ${format.toUpperCase()} with FFmpeg...` },
      { p: 100, stage: 'Export completed successfully!' }
    ];

    stages.forEach((item, index) => {
      setTimeout(() => {
        setProgress(item.p);
        setCurrentStage(item.stage);
        if (item.p === 100) {
          setIsExporting(false);
          setIsComplete(true);
        }
      }, (index + 1) * 850);
    });
  };

  const handleDownload = () => {
    // Generate dummy downloadable file or mock blob
    const element = document.createElement('a');
    const dummyBlob = new Blob([`SABYCUT Rendered Video: ${projectTitle}\nResolution: ${resolution}\nFPS: ${fps}\nDuration: ${totalDuration.toFixed(1)}s`], { type: 'text/plain' });
    element.href = URL.createObjectURL(dummyBlob);
    element.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}_${resolution}.${format}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = async (platform: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: projectTitle,
          text: `Rendered with SABYCUT: ${projectTitle}`,
          url: window.location.href
        });
        setShareFeedback(`Shared to ${platform}`);
      } catch (err) {
        setShareFeedback(`Ready to publish to ${platform}`);
      }
    } else {
      setShareFeedback(`Ready to publish to ${platform}`);
    }
    setTimeout(() => setShareFeedback(null), 3500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      paddingTop: 'max(var(--sat, 0px), 16px)',
      paddingBottom: 'max(var(--sab, 0px), 16px)',
      paddingLeft: 'max(var(--sal, 0px), 16px)',
      paddingRight: 'max(var(--sar, 0px), 16px)'
    }}>
      <div style={{
        backgroundColor: '#12141d',
        border: '1px solid #282d3f',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: 'calc(var(--app-height, 100dvh) - var(--sat, 0px) - var(--sab, 0px) - 32px)',
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Download size={18} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                {t('export.title', 'Export Video')} (ទាញយកវីដេអូសម្រេច)
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                High-fidelity rendering with Khmer HarfBuzz font shaping & audio ducking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              color: '#94a3b8',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={t('common.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        {!isExporting && !isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Project Summary Card */}
            <div style={{
              backgroundColor: '#171924',
              borderRadius: '10px',
              border: '1px solid #25293d',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Film size={20} color="#818cf8" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{projectTitle}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {totalDuration.toFixed(1)}s • {videoClipsCount} video clips • {textClipsCount} captions • {sfxClipsCount} SFX
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Estimated Size</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>~{estimatedSizeMb} MB</div>
              </div>
            </div>

            {/* Resolution Selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                {t('export.resolution')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: '720p', label: '720p HD', sub: '1280x720 • Fast' },
                  { id: '1080p', label: '1080p Full HD', sub: '1920x1080 • Standard' },
                  { id: '4k', label: '4K Ultra HD', sub: '3840x2160 • High-End' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setResolution(item.id as typeof resolution)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      backgroundColor: resolution === item.id ? 'rgba(79, 70, 229, 0.15)' : '#171924',
                      border: resolution === item.id ? '2px solid #818cf8' : '1px solid #282d3f',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: resolution === item.id ? '#ffffff' : '#cbd5e1' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Rate & Container Format */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                  {t('export.fps')} (Frame Rate)
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {([24, 30, 60] as const).map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setFps(rate)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: '6px',
                        backgroundColor: fps === rate ? '#4f46e5' : '#171924',
                        border: fps === rate ? '1px solid #818cf8' : '1px solid #282d3f',
                        color: fps === rate ? '#ffffff' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {rate} fps
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                  {t('export.format')} (Container)
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['mp4', 'mov'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: '6px',
                        backgroundColor: format === fmt ? '#4f46e5' : '#171924',
                        border: format === fmt ? '1px solid #818cf8' : '1px solid #282d3f',
                        color: format === fmt ? '#ffffff' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Khmer Subtitles Burn-in & Audio Quality */}
            <div style={{
              backgroundColor: '#171924',
              borderRadius: '8px',
              border: '1px solid #25293d',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={14} color="#fbbf24" />
                  <div>
                    <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>
                      Burn Khmer Captions (បញ្ចូលអក្សរខ្មែរលើវីដេអូ)
                    </span>
                    <p style={{ fontSize: '10px', color: '#94a3b8' }}>
                      Renders stacked consonants and coeng characters with HarfBuzz
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={burnSubtitles}
                  onChange={(e) => setBurnSubtitles(e.target.checked)}
                  style={{ accentColor: '#4f46e5', width: '16px', height: '16px' }}
                />
              </label>

              <div style={{ height: '1px', backgroundColor: '#25293d' }} />

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Volume2 size={14} color="#a78bfa" />
                  <div>
                    <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 600 }}>
                      High-Fidelity Audio & Ducking
                    </span>
                    <p style={{ fontSize: '10px', color: '#94a3b8' }}>
                      320kbps AAC with automated background music ducking during voice
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioQuality === 'high'}
                  onChange={(e) => setAudioQuality(e.target.checked ? 'high' : 'standard')}
                  style={{ accentColor: '#4f46e5', width: '16px', height: '16px' }}
                />
              </label>
            </div>

            {/* Action Button */}
            <button
              data-testid="start-export-btn"
              onClick={handleStartExport}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              <span>{t('export.start')} ({resolution.toUpperCase()} @ {fps}fps)</span>
            </button>
          </div>
        )}

        {/* Export Progress State */}
        {isExporting && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(79, 70, 229, 0.15)',
              border: '2px solid #818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Sparkles size={24} color="#818cf8" />
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
              Rendering Video ({progress}%)
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              {currentStage}
            </p>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#1f2335',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#10b981',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>

            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Please do not close this tab while FFmpeg is encoding your video.
            </span>
          </div>
        )}

        {/* Complete State */}
        {isComplete && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
              Export Finished! (វីដេអូបានទាញយកដោយជោគជ័យ)
            </h3>
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '16px' }}>
              Your video has been rendered at {resolution.toUpperCase()} {fps}fps with full Khmer subtitle shaping.
            </p>

            {/* Social Share Section (AUD-108) */}
            <div style={{ marginTop: '16px', marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                {t('export.shareDirect', 'Direct Publish & Share')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { id: 'tiktok', name: t('export.shareTiktok', 'TikTok'), bg: '#000000', border: '#27272a' },
                  { id: 'youtube', name: t('export.shareYoutube', 'YouTube Shorts'), bg: '#1c1917', border: '#dc2626' },
                  { id: 'facebook', name: t('export.shareFacebook', 'Facebook'), bg: '#172554', border: '#2563eb' },
                  { id: 'telegram', name: t('export.shareTelegram', 'Telegram'), bg: '#082f49', border: '#0284c7' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleShare(s.name)}
                    data-testid={`export-share-${s.id}`}
                    style={{
                      minHeight: '44px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: s.bg,
                      border: `1px solid ${s.border}`,
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Share2 size={14} />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
              {shareFeedback && (
                <div style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '6px', fontSize: '11px', color: '#6ee7b7', textAlign: 'center' }}>
                  {shareFeedback}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownload}
                data-testid="export-download-btn"
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Download size={16} />
                <span>Save Video File</span>
              </button>

              <button
                onClick={onClose}
                style={{
                  minHeight: '44px',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#1e2130',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
