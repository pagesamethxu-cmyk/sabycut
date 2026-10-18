import React, { useState } from 'react';
import { 
  Sliders, 
  Volume2, 
  Type, 
  Layers, 
  RotateCw, 
  FlipHorizontal, 
  Gauge, 
  Sparkles, 
  Sun, 
  Contrast, 
  Droplet, 
  Palette,
  Check,
  Eye,
  FileText,
  Scissors,
  Zap,
  Shield,
  Circle,
  Square,
  Heart,
  Star,
  Activity
} from 'lucide-react';
import { t } from '../../i18n';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MaskShape, BlendMode } from '../../types/timeline';

export interface ClipProperties {
  // Video & Transform
  speed: number;
  speedCurvePreset?: string;
  isReversed?: boolean;
  scale: number;
  rotation: number;
  flipH: boolean;
  flipV?: boolean;
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  temperature?: number;
  vignette?: number;
  filterPreset: string;
  
  // Advanced Video Tools
  maskShape?: MaskShape;
  maskFeather?: number;
  maskInvert?: boolean;
  chromaKey: boolean;
  chromaColor?: string;
  chromaIntensity?: number;
  blendMode?: BlendMode;

  // Audio
  volume: number;
  fadeIn: number;
  fadeOut: number;
  ducking: boolean;
  pan?: number;
  voiceChanger?: string;

  // Text
  text?: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  shadowColor?: string;
  shadowBlur?: number;
  textAnimation: string;
  alignment?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;

  // Transition
  transitionType: string;
  transitionDuration: number;

  // Text extras (CapCut parity)
  curvedRadius?: number;
  motionTracking?: boolean;
  ttsVoice?: string;

  // Smart Tools (Beauty & Portrait)
  facialSmoothing?: number;
  teethWhitening?: number;
  faceSlimming?: number;
  portraitRelightPreset?: string;
  autoReframeRatio?: string;
}

interface ClipInspectorProps {
  clipType: 'video' | 'audio' | 'sfx' | 'text';
  clipTitle: string;
  properties: ClipProperties;
  onChange: (updated: Partial<ClipProperties>) => void;
  onClose: () => void;
  onApplyTransitionToAll?: () => void;
}

export const ClipInspector: React.FC<ClipInspectorProps> = ({
  clipType,
  clipTitle,
  properties,
  onChange,
  onClose,
  onApplyTransitionToAll,
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'transform' | 'speed' | 'mask' | 'chroma' | 'color' | 'audio' | 'text' | 'transition' | 'smartTools'>(
    clipType === 'text' ? 'text' : clipType === 'sfx' || clipType === 'audio' ? 'audio' : 'transform'
  );

  const khmerFonts = [
    { id: 'Noto Sans Khmer', label: 'Noto Sans Khmer' },
    { id: 'Battambang', label: 'Battambang' },
    { id: 'Siemreap', label: 'Siemreap' },
    { id: 'Moul', label: 'Moul' },
    { id: 'Koulen', label: 'Koulen' }
  ];

  const filters = [
    { id: 'none', label: 'Normal' },
    { id: 'vibrant', label: 'Vibrant' },
    { id: 'film', label: 'Cinematic Film' },
    { id: 'warm', label: 'Warm Sun' },
    { id: 'cool', label: 'Cool Ocean' },
    { id: 'bw', label: 'Monochrome' }
  ];

  const transitions = [
    { id: 'none', label: t('transitions.none', 'Hard Cut') },
    { id: 'fade', label: t('transitions.fade', 'Fade') },
    { id: 'dissolve', label: t('transitions.dissolve', 'Dissolve') },
    { id: 'slide_left', label: t('transitions.slideLeft', 'Slide Left') },
    { id: 'slide_right', label: t('transitions.slideRight', 'Slide Right') },
    { id: 'zoom_in', label: t('transitions.zoomIn', 'Zoom In') },
    { id: 'wipe', label: t('transitions.wipe', 'Wipe') },
    { id: 'glitch', label: t('transitions.glitch', 'Glitch') },
    { id: 'spin', label: t('transitions.spin', 'Spin') },
    { id: 'blur', label: t('transitions.blur', 'Blur') }
  ];

  const maskShapes: { id: MaskShape; label: string }[] = [
    { id: 'none', label: t('mask.none', 'None') },
    { id: 'circle', label: t('mask.circle', 'Circle') },
    { id: 'rectangle', label: t('mask.rectangle', 'Rectangle') },
    { id: 'linear', label: t('mask.linear', 'Linear') },
    { id: 'mirror', label: t('mask.mirror', 'Mirror') },
    { id: 'heart', label: t('mask.heart', 'Heart') },
    { id: 'star', label: t('mask.star', 'Star') }
  ];

  const blendModes: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'add'];

  const speedPresets = [
    { id: 'normal', label: t('speed.normal', 'Normal') },
    { id: 'montage', label: 'Montage' },
    { id: 'hero', label: 'Hero' },
    { id: 'bullet', label: 'Bullet' },
    { id: 'jump_cut', label: 'Jump Cut' },
    { id: 'flash_in', label: 'Flash In' },
    { id: 'flash_out', label: 'Flash Out' }
  ];

  const inspectorCore = (
    <div style={{
      width: isMobile ? '100%' : '340px',
      backgroundColor: '#12141c',
      borderLeft: isMobile ? 'none' : '1px solid #232738',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Mobile Drag Handle */}
      {isMobile && (
        <div style={{
          width: '38px',
          height: '4px',
          borderRadius: '2px',
          backgroundColor: '#475569',
          margin: '8px auto 2px auto'
        }} />
      )}

      {/* Inspector Header */}
      <div style={{
        padding: isMobile ? '10px 16px' : '12px 16px',
        borderBottom: '1px solid #232738',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <span style={{ fontSize: isMobile ? '14px' : '13px', fontWeight: 800, color: '#ffffff' }}>
            {clipTitle}
          </span>
          <span style={{ marginLeft: '8px', fontSize: '10px', color: '#818cf8', fontWeight: 700, backgroundColor: 'rgba(129, 140, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
            {clipType.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            minHeight: '44px',
            minWidth: '44px',
            padding: '8px 14px',
            borderRadius: '6px',
            backgroundColor: isMobile ? '#4f46e5' : 'transparent',
            color: isMobile ? '#ffffff' : '#94a3b8',
            fontSize: isMobile ? '13px' : '12px',
            fontWeight: isMobile ? 700 : 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isMobile ? t('common.done', 'Done') : t('common.close', 'Close')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: '#0c0d13',
        borderBottom: '1px solid #232738',
        padding: '4px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        gap: '4px'
      }}>
        {clipType === 'video' && (
          <>
            <button
              onClick={() => setActiveTab('transform')}
              style={{
                minHeight: '44px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'transform' ? '#232738' : 'transparent',
                color: activeTab === 'transform' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {t('tabs.transform', 'Transform')}
            </button>
            <button
              onClick={() => setActiveTab('speed')}
              style={{
                minHeight: '44px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'speed' ? '#232738' : 'transparent',
                color: activeTab === 'speed' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {t('tabs.speed', 'Speed')}
            </button>
            <button
              onClick={() => setActiveTab('color')}
              style={{
                minHeight: '44px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'color' ? '#232738' : 'transparent',
                color: activeTab === 'color' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {t('tabs.color', 'Color')}
            </button>
            <button
              onClick={() => setActiveTab('mask')}
              style={{
                minHeight: '44px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'mask' ? '#232738' : 'transparent',
                color: activeTab === 'mask' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {t('tabs.mask', 'Mask')}
            </button>
            <button
              onClick={() => setActiveTab('chroma')}
              style={{
                minHeight: '44px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'chroma' ? '#232738' : 'transparent',
                color: activeTab === 'chroma' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {t('tabs.chromaKey', 'Chroma')}
            </button>
            <button
              onClick={() => setActiveTab('transition')}
              style={{
                minHeight: '44px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'transition' ? '#232738' : 'transparent',
                color: activeTab === 'transition' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {t('tabs.transition', 'Transition')}
            </button>
            <button
              data-testid="inspector-tab-smartTools"
              onClick={() => setActiveTab('smartTools')}
              style={{
                minHeight: '44px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'smartTools' ? '#232738' : 'transparent',
                color: activeTab === 'smartTools' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              Smart Tools
            </button>
          </>
        )}

        {(clipType === 'video' || clipType === 'audio' || clipType === 'sfx') && (
          <button
            onClick={() => setActiveTab('audio')}
            style={{
              minHeight: '44px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'audio' ? '#232738' : 'transparent',
              color: activeTab === 'audio' ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {t('tabs.audio', 'Audio')}
          </button>
        )}

        {clipType === 'text' && (
          <button
            onClick={() => setActiveTab('text')}
            style={{
              minHeight: '44px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'text' ? '#232738' : 'transparent',
              color: activeTab === 'text' ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {t('tabs.text', 'Text')}
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* TRANSFORM TAB */}
        {activeTab === 'transform' && (
          <>
            {/* Scale */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('transform.scale', 'Scale')}: {Math.round(properties.scale * 100)}%
                </label>
                <button
                  onClick={() => onChange({ scale: 1.0 })}
                  style={{ fontSize: '11px', color: '#818cf8', background: 'none', minHeight: '32px', cursor: 'pointer' }}
                >
                  {t('common.cancel', 'Reset')}
                </button>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={properties.scale}
                onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Rotation & Flip */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                {t('transform.rotate', 'Rotation & Orientation')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onChange({ rotation: (properties.rotation + 90) % 360 })}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: '#1e2130',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCw size={15} />
                  <span>{properties.rotation}°</span>
                </button>
                <button
                  onClick={() => onChange({ flipH: !properties.flipH })}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: properties.flipH ? '#4f46e5' : '#1e2130',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <FlipHorizontal size={15} />
                  <span>{t('transform.flipH', 'Flip H')}</span>
                </button>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('transform.opacity', 'Opacity')}: {properties.opacity}%
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={properties.opacity}
                onChange={(e) => onChange({ opacity: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Blend Mode */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                {t('blend.mode', 'Blend Mode')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {blendModes.map((bm) => (
                  <button
                    key={bm}
                    onClick={() => onChange({ blendMode: bm })}
                    style={{
                      minHeight: '44px',
                      borderRadius: '6px',
                      backgroundColor: properties.blendMode === bm ? '#4f46e5' : '#1e2130',
                      color: properties.blendMode === bm ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {bm}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* SPEED TAB */}
        {activeTab === 'speed' && (
          <>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('speed.normal', 'Constant Speed')}: {properties.speed.toFixed(1)}x
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0.5, 1.0, 1.5, 2.0, 4.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => onChange({ speed: s })}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        backgroundColor: properties.speed === s ? '#4f46e5' : '#1e2130',
                        color: properties.speed === s ? '#ffffff' : '#94a3b8',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={properties.speed}
                onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Speed Curve Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                {t('speed.curve', 'Speed Curve Presets')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {speedPresets.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => onChange({ speedCurvePreset: sp.id })}
                    style={{
                      minHeight: '44px',
                      borderRadius: '6px',
                      backgroundColor: properties.speedCurvePreset === sp.id ? '#4f46e5' : '#1e2130',
                      color: properties.speedCurvePreset === sp.id ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reverse Video */}
            <div>
              <button
                onClick={() => onChange({ isReversed: !properties.isReversed })}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: properties.isReversed ? '#4f46e5' : '#1e2130',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Activity size={16} />
                <span>{t('speed.reverse', 'Reverse Playback')}</span>
              </button>
            </div>
          </>
        )}

        {/* MASK TAB */}
        {activeTab === 'mask' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                {t('mask.shape', 'Mask Shape')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {maskShapes.map((ms) => (
                  <button
                    key={ms.id}
                    onClick={() => onChange({ maskShape: ms.id })}
                    style={{
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      borderRadius: '6px',
                      backgroundColor: (properties.maskShape || 'none') === ms.id ? '#4f46e5' : '#1e2130',
                      color: '#ffffff',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{ms.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {properties.maskShape && properties.maskShape !== 'none' && (
              <>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                      {t('mask.feather', 'Feather')}: {properties.maskFeather || 0}%
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={properties.maskFeather || 0}
                    onChange={(e) => onChange({ maskFeather: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', accentColor: '#4f46e5' }}
                  />
                </div>

                <button
                  onClick={() => onChange({ maskInvert: !properties.maskInvert })}
                  style={{
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: properties.maskInvert ? '#4f46e5' : '#1e2130',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t('mask.invert', 'Invert Mask')}
                </button>
              </>
            )}
          </>
        )}

        {/* CHROMA KEY TAB */}
        {activeTab === 'chroma' && (
          <>
            <button
              onClick={() => onChange({ chromaKey: !properties.chromaKey })}
              style={{
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: properties.chromaKey ? '#4f46e5' : '#1e2130',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Shield size={16} />
              <span>{t('chromaKey.enable', 'Enable Chroma Key')}</span>
            </button>

            {properties.chromaKey && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                    {t('chromaKey.color', 'Key Color')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {['#00ff00', '#0000ff', '#ff0000', '#000000'].map((hex) => (
                      <button
                        key={hex}
                        onClick={() => onChange({ chromaColor: hex })}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          backgroundColor: hex,
                          border: properties.chromaColor === hex ? '3px solid #ffffff' : '1px solid #334155',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                      {t('chromaKey.intensity', 'Intensity')}: {properties.chromaIntensity || 40}%
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={properties.chromaIntensity || 40}
                    onChange={(e) => onChange({ chromaIntensity: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', accentColor: '#4f46e5' }}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* COLOR & FILTERS TAB */}
        {activeTab === 'color' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                {t('editor.addFilter', 'Presets')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onChange({ filterPreset: f.id })}
                    style={{
                      minHeight: '44px',
                      borderRadius: '6px',
                      backgroundColor: properties.filterPreset === f.id ? '#4f46e5' : '#1e2130',
                      color: properties.filterPreset === f.id ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brightness */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('color.brightness', 'Brightness')}: {properties.brightness}
                </label>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={properties.brightness}
                onChange={(e) => onChange({ brightness: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Contrast */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('color.contrast', 'Contrast')}: {properties.contrast}
                </label>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={properties.contrast}
                onChange={(e) => onChange({ contrast: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Saturation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('color.saturation', 'Saturation')}: {properties.saturation}
                </label>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={properties.saturation}
                onChange={(e) => onChange({ saturation: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>
          </>
        )}

        {/* AUDIO TAB */}
        {activeTab === 'audio' && (
          <>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('audio.volume', 'Volume')}: {properties.volume}%
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={properties.volume}
                onChange={(e) => onChange({ volume: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('audio.fadeIn', 'Fade In')}: {properties.fadeIn}s
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="5.0"
                step="0.5"
                value={properties.fadeIn}
                onChange={(e) => onChange({ fadeIn: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('audio.fadeOut', 'Fade Out')}: {properties.fadeOut}s
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="5.0"
                step="0.5"
                value={properties.fadeOut}
                onChange={(e) => onChange({ fadeOut: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            <button
              onClick={() => onChange({ ducking: !properties.ducking })}
              style={{
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: properties.ducking ? '#4f46e5' : '#1e2130',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('audio.ducking', 'Audio Ducking')}
            </button>

            {/* Voice Effects & Pitch Modulation */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                Voice Effects (ប្ដូរសំឡេង)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['none', 'chipmunk', 'deep', 'robot', 'echo', 'telephone'].map((eff) => (
                  <button
                    key={eff}
                    type="button"
                    onClick={() => onChange({ voiceChanger: eff })}
                    className="touch-target"
                    style={{
                      padding: '8px 4px',
                      borderRadius: '6px',
                      backgroundColor: properties.voiceChanger === eff ? '#4f46e5' : '#1e2130',
                      color: properties.voiceChanger === eff ? '#ffffff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 600,
                      border: '1px solid #2e354e',
                      cursor: 'pointer'
                    }}
                  >
                    {eff.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TEXT & KHMER TYPOGRAPHY TAB */}
        {activeTab === 'text' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                {t('editor.addText', 'Text Content')}
              </label>
              <textarea
                value={properties.text || ''}
                onChange={(e) => onChange({ text: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#0c0d13',
                  border: '1px solid #232738',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: properties.fontFamily
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                {t('text.font', 'Khmer Font')}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {khmerFonts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onChange({ fontFamily: f.id })}
                    style={{
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderRadius: '6px',
                      backgroundColor: properties.fontFamily === f.id ? '#4f46e5' : '#1e2130',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontFamily: f.id,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{f.label}</span>
                    {properties.fontFamily === f.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('text.size', 'Font Size')}: {properties.fontSize}px
                </label>
              </div>
              <input
                type="range"
                min="12"
                max="72"
                step="2"
                value={properties.fontSize}
                onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Curved Text Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('text.curvedRadius', 'Curved Text')}: {properties.curvedRadius || 0}°
                </label>
                {properties.curvedRadius ? (
                  <button
                    onClick={() => onChange({ curvedRadius: 0 })}
                    style={{ fontSize: '11px', color: '#818cf8', background: 'none', cursor: 'pointer' }}
                  >
                    {t('common.cancel', 'Reset')}
                  </button>
                ) : null}
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={properties.curvedRadius || 0}
                onChange={(e) => onChange({ curvedRadius: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Motion Tracking Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#1e2130', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', display: 'block' }}>
                  {t('text.motionTracking', 'Motion Tracking')}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Pin text position to detected moving object
                </span>
              </div>
              <button
                onClick={() => onChange({ motionTracking: !properties.motionTracking })}
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: properties.motionTracking ? '#4f46e5' : '#282d3f',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {properties.motionTracking ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Text to Speech Voice */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                {t('text.ttsVoice', 'Text to Speech Voice')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '6px' }}>
                {[
                  { id: 'none', label: t('text.voiceNone', 'None (Silent)') },
                  { id: 'female_km', label: t('text.voiceFemaleKm', 'Khmer Female (Sreypov)') },
                  { id: 'male_km', label: t('text.voiceMaleKm', 'Khmer Male (Dara)') },
                  { id: 'calm_km', label: t('text.voiceCalmKm', 'Khmer Calm') },
                  { id: 'narrator_en', label: t('text.voiceNarratorEn', 'English Narrator') }
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => onChange({ ttsVoice: v.id })}
                    style={{
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderRadius: '6px',
                      backgroundColor: (properties.ttsVoice || 'none') === v.id ? '#4f46e5' : '#1e2130',
                      color: '#ffffff',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{v.label}</span>
                    {(properties.ttsVoice || 'none') === v.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* SMART TOOLS TAB (Beauty, Retouch & Auto Reframe) */}
        {activeTab === 'smartTools' && (
          <>
            <div style={{ padding: '8px 12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#c7d2fe', lineHeight: 1.4, display: 'block' }}>
                {t('smartTools.smartToolsDesc', 'Hardware-accelerated AI beauty, lighting and subject reframing.')}
              </span>
            </div>

            {/* Facial Smoothing */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('smartTools.facialSmoothing', 'Facial Smoothing')}: {properties.facialSmoothing || 0}%
                </label>
                {(properties.facialSmoothing || 0) > 0 && (
                  <button
                    onClick={() => onChange({ facialSmoothing: 0 })}
                    style={{ fontSize: '11px', color: '#818cf8', background: 'none', cursor: 'pointer' }}
                  >
                    {t('common.cancel', 'Reset')}
                  </button>
                )}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={properties.facialSmoothing || 0}
                onChange={(e) => onChange({ facialSmoothing: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Teeth Whitening */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('smartTools.teethWhitening', 'Teeth Whitening')}: {properties.teethWhitening || 0}%
                </label>
                {(properties.teethWhitening || 0) > 0 && (
                  <button
                    onClick={() => onChange({ teethWhitening: 0 })}
                    style={{ fontSize: '11px', color: '#818cf8', background: 'none', cursor: 'pointer' }}
                  >
                    {t('common.cancel', 'Reset')}
                  </button>
                )}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={properties.teethWhitening || 0}
                onChange={(e) => onChange({ teethWhitening: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Face Slimming */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('smartTools.faceSlimming', 'Face Slimming')}: {properties.faceSlimming || 0}%
                </label>
                {(properties.faceSlimming || 0) > 0 && (
                  <button
                    onClick={() => onChange({ faceSlimming: 0 })}
                    style={{ fontSize: '11px', color: '#818cf8', background: 'none', cursor: 'pointer' }}
                  >
                    {t('common.cancel', 'Reset')}
                  </button>
                )}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={properties.faceSlimming || 0}
                onChange={(e) => onChange({ faceSlimming: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* AI Portrait Relight Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                {t('smartTools.portraitRelight', 'AI Portrait Relight')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {[
                  { id: 'none', label: t('smartTools.relightNone', 'None') },
                  { id: 'studio', label: t('smartTools.relightStudio', 'Studio Soft') },
                  { id: 'rembrandt', label: t('smartTools.relightRembrandt', 'Rembrandt') },
                  { id: 'sunset', label: t('smartTools.relightSunset', 'Golden Sunset') },
                  { id: 'cyberpunk', label: t('smartTools.relightCyberpunk', 'Cyberpunk Neon') }
                ].map((rl) => (
                  <button
                    key={rl.id}
                    onClick={() => onChange({ portraitRelightPreset: rl.id })}
                    style={{
                      minHeight: '44px',
                      borderRadius: '6px',
                      backgroundColor: (properties.portraitRelightPreset || 'none') === rl.id ? '#4f46e5' : '#1e2130',
                      color: (properties.portraitRelightPreset || 'none') === rl.id ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      padding: '4px 8px'
                    }}
                  >
                    {rl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Reframe */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                {t('smartTools.autoReframe', 'Auto Reframe')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { id: 'original', label: t('smartTools.original', 'Original') },
                  { id: '9:16', label: '9:16 TikTok' },
                  { id: '16:9', label: '16:9 YouTube' },
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:5', label: '4:5 Feed' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onChange({ autoReframeRatio: r.id })}
                    style={{
                      minHeight: '44px',
                      borderRadius: '6px',
                      backgroundColor: (properties.autoReframeRatio || 'original') === r.id ? '#4f46e5' : '#1e2130',
                      color: (properties.autoReframeRatio || 'original') === r.id ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      padding: '4px 6px'
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TRANSITION TAB */}
        {activeTab === 'transition' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                {t('transitions.title', 'Transition Type')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {transitions.map((tr) => (
                  <button
                    key={tr.id}
                    onClick={() => onChange({ transitionType: tr.id })}
                    style={{
                      minHeight: '44px',
                      borderRadius: '6px',
                      backgroundColor: properties.transitionType === tr.id ? '#4f46e5' : '#1e2130',
                      color: properties.transitionType === tr.id ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  {t('transitions.duration', 'Duration')}: {properties.transitionDuration.toFixed(1)}s
                </label>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={properties.transitionDuration}
                onChange={(e) => onChange({ transitionDuration: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {onApplyTransitionToAll && (
              <button
                onClick={onApplyTransitionToAll}
                style={{
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#232738',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t('transitions.applyToAll', 'Apply to All Cuts')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}>
        <div style={{
          backgroundColor: '#12141c',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          maxHeight: '75vh',
          height: '75vh',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)'
        }}>
          {inspectorCore}
        </div>
      </div>
    );
  }

  return inspectorCore;
};
