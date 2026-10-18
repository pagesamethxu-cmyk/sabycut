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
  FileText
} from 'lucide-react';
import { t } from '../../i18n';
import { useIsMobile } from '../../hooks/useIsMobile';


export interface ClipProperties {
  // Video & Transform
  speed: number;
  scale: number;
  rotation: number;
  flipH: boolean;
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  filterPreset: string;
  chromaKey: boolean;

  // Audio
  volume: number;
  fadeIn: number;
  fadeOut: number;
  ducking: boolean;

  // Text
  text?: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  textAnimation: string;

  // Transition
  transitionType: string;
  transitionDuration: number;
}

interface ClipInspectorProps {
  clipType: 'video' | 'audio' | 'sfx' | 'text';
  clipTitle: string;
  properties: ClipProperties;
  onChange: (updated: Partial<ClipProperties>) => void;
  onClose: () => void;
}

export const ClipInspector: React.FC<ClipInspectorProps> = ({
  clipType,
  clipTitle,
  properties,
  onChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'transform' | 'color' | 'audio' | 'text' | 'transition'>(
    clipType === 'text' ? 'text' : clipType === 'sfx' || clipType === 'audio' ? 'audio' : 'transform'
  );

  const khmerFonts = [
    { id: 'Noto Sans Khmer', label: 'Noto Sans Khmer (Default Clean)' },
    { id: 'Kantumruy Pro', label: 'Kantumruy Pro (Modern Sans)' },
    { id: 'Battambang', label: 'Battambang (Standard Legible)' },
    { id: 'Moul', label: 'Moul (Header / Display Hook)' },
    { id: 'Siemreap', label: 'Siemreap (Traditional)' }
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
    { id: 'none', label: 'None (Hard Cut)' },
    { id: 'dissolve', label: 'Cross Dissolve' },
    { id: 'fade_black', label: 'Fade to Black' },
    { id: 'slide_left', label: 'Slide Left' },
    { id: 'slide_right', label: 'Slide Right' },
    { id: 'zoom_in', label: 'Zoom In' }
  ];

  const isMobile = useIsMobile();

  const inspectorCore = (
    <div style={{
      width: isMobile ? '100%' : '320px',
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
            padding: isMobile ? '6px 14px' : '4px 8px',
            borderRadius: '6px',
            backgroundColor: isMobile ? '#4f46e5' : 'transparent',
            color: isMobile ? '#ffffff' : '#94a3b8',
            fontSize: isMobile ? '12px' : '12px',
            fontWeight: isMobile ? 700 : 400
          }}
        >
          {isMobile ? 'Done' : 'Close'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: '#0c0d13',
        borderBottom: '1px solid #232738',
        padding: '4px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {clipType === 'video' && (

          <>
            <button
              onClick={() => setActiveTab('transform')}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'transform' ? '#232738' : 'transparent',
                color: activeTab === 'transform' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              Transform
            </button>
            <button
              onClick={() => setActiveTab('color')}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'color' ? '#232738' : 'transparent',
                color: activeTab === 'color' ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              Filter / Color
            </button>
          </>
        )}

        {(clipType === 'video' || clipType === 'audio' || clipType === 'sfx') && (
          <button
            onClick={() => setActiveTab('audio')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'audio' ? '#232738' : 'transparent',
              color: activeTab === 'audio' ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Audio
          </button>
        )}

        {clipType === 'text' && (
          <button
            onClick={() => setActiveTab('text')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'text' ? '#232738' : 'transparent',
              color: activeTab === 'text' ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Khmer Font
          </button>
        )}

        {clipType === 'video' && (
          <button
            onClick={() => setActiveTab('transition')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '6px',
              backgroundColor: activeTab === 'transition' ? '#232738' : 'transparent',
              color: activeTab === 'transition' ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Transition
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* TRANSFORM TAB */}
        {activeTab === 'transform' && (
          <>
            {/* Speed Control */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Gauge size={14} color="#818cf8" />
                  <span>Speed: {properties.speed.toFixed(1)}x</span>
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0.5, 1.0, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => onChange({ speed: s })}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: properties.speed === s ? '#4f46e5' : '#1e2130',
                        color: properties.speed === s ? '#ffffff' : '#94a3b8',
                        fontSize: '10px'
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
                max="5.0"
                step="0.1"
                value={properties.speed}
                onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Scale / Zoom */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                  Scale: {Math.round(properties.scale * 100)}%
                </label>
                <button
                  onClick={() => onChange({ scale: 1.0 })}
                  style={{ fontSize: '10px', color: '#818cf8', background: 'none' }}
                >
                  Reset
                </button>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={properties.scale}
                onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Rotation & Flip */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                Orientation
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => onChange({ rotation: (properties.rotation + 90) % 360 })}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: '#1b1d28',
                    border: '1px solid #2e3448',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCw size={14} />
                  <span>Rotate ({properties.rotation}deg)</span>
                </button>
                <button
                  onClick={() => onChange({ flipH: !properties.flipH })}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: properties.flipH ? 'rgba(99, 102, 241, 0.2)' : '#1b1d28',
                    border: properties.flipH ? '1px solid #818cf8' : '1px solid #2e3448',
                    color: properties.flipH ? '#a5b4fc' : '#cbd5e1',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <FlipHorizontal size={14} />
                  <span>Flip Horizontal</span>
                </button>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                Opacity: {Math.round(properties.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={properties.opacity}
                onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Chroma Key (Green Screen) */}
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#181a26',
              border: '1px solid #272c3d'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                    Chroma Key (Green Screen)
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Remove green background automatically
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={properties.chromaKey}
                  onChange={(e) => onChange({ chromaKey: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </div>
            </div>
          </>
        )}

        {/* COLOR & FILTER TAB */}
        {activeTab === 'color' && (
          <>
            {/* Filter Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                Filter Presets
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onChange({ filterPreset: f.id })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: properties.filterPreset === f.id ? 'rgba(99, 102, 241, 0.2)' : '#1b1d28',
                      border: properties.filterPreset === f.id ? '1px solid #818cf8' : '1px solid #2e3448',
                      color: properties.filterPreset === f.id ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      textAlign: 'left'
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
                <span style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sun size={14} color="#f59e0b" />
                  <span>Brightness: {properties.brightness}%</span>
                </span>
                <button onClick={() => onChange({ brightness: 100 })} style={{ fontSize: '10px', color: '#818cf8', background: 'none' }}>
                  Reset
                </button>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={properties.brightness}
                onChange={(e) => onChange({ brightness: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Contrast */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Contrast size={14} color="#818cf8" />
                  <span>Contrast: {properties.contrast}%</span>
                </span>
                <button onClick={() => onChange({ contrast: 100 })} style={{ fontSize: '10px', color: '#818cf8', background: 'none' }}>
                  Reset
                </button>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={properties.contrast}
                onChange={(e) => onChange({ contrast: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Saturation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplet size={14} color="#ec4899" />
                  <span>Saturation: {properties.saturation}%</span>
                </span>
                <button onClick={() => onChange({ saturation: 100 })} style={{ fontSize: '10px', color: '#818cf8', background: 'none' }}>
                  Reset
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={properties.saturation}
                onChange={(e) => onChange({ saturation: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>
          </>
        )}

        {/* AUDIO TAB */}
        {activeTab === 'audio' && (
          <>
            {/* Volume */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} color="#34d399" />
                  <span>Volume: {Math.round(properties.volume * 100)}%</span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                value={properties.volume}
                onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#34d399' }}
              />
            </div>

            {/* Fade In & Out */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Fade In: {properties.fadeIn}s
                </label>
                <input
                  type="range"
                  min="0"
                  max="3.0"
                  step="0.1"
                  value={properties.fadeIn}
                  onChange={(e) => onChange({ fadeIn: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#4f46e5' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Fade Out: {properties.fadeOut}s
                </label>
                <input
                  type="range"
                  min="0"
                  max="3.0"
                  step="0.1"
                  value={properties.fadeOut}
                  onChange={(e) => onChange({ fadeOut: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#4f46e5' }}
                />
              </div>
            </div>

            {/* Audio Ducking */}
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#181a26',
              border: '1px solid #272c3d'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                    Auto Audio Ducking
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Lower music when voice is active
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={properties.ducking}
                  onChange={(e) => onChange({ ducking: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#34d399', cursor: 'pointer' }}
                />
              </div>
            </div>
          </>
        )}

        {/* KHMER TEXT & SUBTITLE TAB */}
        {activeTab === 'text' && (
          <>
            {/* Text Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                Khmer Text Content
              </label>
              <textarea
                rows={2}
                value={properties.text || ''}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder="សរសេរចំណងជើងរងនៅទីនេះ..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: '#1b1d28',
                  border: '1px solid #2e3448',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: properties.fontFamily
                }}
              />
            </div>

            {/* Font Family Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                Khmer Font (ពុម្ពអក្សរខ្មែរ)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {khmerFonts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onChange({ fontFamily: f.id })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: properties.fontFamily === f.id ? 'rgba(99, 102, 241, 0.2)' : '#1b1d28',
                      border: properties.fontFamily === f.id ? '1px solid #818cf8' : '1px solid #2e3448',
                      color: properties.fontFamily === f.id ? '#ffffff' : '#94a3b8',
                      fontSize: '12px',
                      fontFamily: f.id,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{f.label}</span>
                    {properties.fontFamily === f.id && <Check size={14} color="#818cf8" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}>
                Font Size: {properties.fontSize}px
              </label>
              <input
                type="range"
                min="14"
                max="48"
                value={properties.fontSize}
                onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#4f46e5' }}
              />
            </div>

            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Text Color
                </label>
                <input
                  type="color"
                  value={properties.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #2e3448', background: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Outline / Stroke
                </label>
                <input
                  type="color"
                  value={properties.strokeColor}
                  onChange={(e) => onChange({ strokeColor: e.target.value })}
                  style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #2e3448', background: 'none' }}
                />
              </div>
            </div>
          </>
        )}

        {/* TRANSITION TAB */}
        {activeTab === 'transition' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
              Transition Effect
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {transitions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChange({ transitionType: t.id })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: properties.transitionType === t.id ? 'rgba(99, 102, 241, 0.2)' : '#1b1d28',
                    border: properties.transitionType === t.id ? '1px solid #818cf8' : '1px solid #2e3448',
                    color: properties.transitionType === t.id ? '#ffffff' : '#94a3b8',
                    fontSize: '12px',
                    textAlign: 'left'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );


  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(3px)'
        }}
        onClick={onClose}
      >
        <div
          style={{
            height: '62vh',
            maxHeight: '520px',
            backgroundColor: '#12141c',
            borderTop: '1px solid #333a50',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            paddingBottom: 'env(safe-area-inset-bottom, 12px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {inspectorCore}
        </div>
      </div>
    );
  }

  return (
    <div style={{ zIndex: 25, height: '100%' }}>
      {inspectorCore}
    </div>
  );
};

