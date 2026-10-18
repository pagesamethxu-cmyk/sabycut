import React, { useState } from 'react';
import {
  FolderPlus,
  LayoutTemplate,
  Shapes,
  Music,
  Type,
  Subtitles,
  FileText,
  Sparkles,
  GitCommit,
  Palette,
  Briefcase,
  Layers,
  X,
  Search,
  Upload,
  QrCode,
  Cloud,
  Play,
  Volume2,
  Plus,
  Trash2,
  Check,
  Smartphone,
  Video,
  Image as ImageIcon,
  Bot,
  Wand2
} from 'lucide-react';
import { t } from '../../i18n';
import { sfxSynth } from '../../services/soundEffects';

export type TopLevelPanelId =
  | 'media'
  | 'templates'
  | 'elements'
  | 'audio'
  | 'text'
  | 'captions'
  | 'transcript'
  | 'effects'
  | 'transitions'
  | 'filters'
  | 'brandKit'
  | 'plugins';

interface EditorPanelsDockProps {
  isOpen: boolean;
  activePanel: TopLevelPanelId | null;
  onSelectPanel: (panel: TopLevelPanelId | null) => void;
  onAddMediaFile?: (file: File) => void;
  onAddTextClip?: (text: string, stylePreset?: string) => void;
  onAddSfxClip?: (type: string, title: string) => void;
  onAddMusicClip?: (title: string) => void;
  onApplyEffect?: (effectName: string) => void;
  onApplyFilter?: (filterName: string) => void;
  onApplyTransition?: (transitionName: string) => void;
  onLoadTemplate?: (templateId: string) => void;
  onImportSubtitle?: (subtitles: Array<{ start: number; end: number; text: string }>) => void;
  onTranscriptCut?: (wordIndex: number) => void;
  onWatermarkUpdate?: (url: string | null) => void;
  transcriptWords?: Array<{ word: string; start: number; end: number }>;
}

export const EditorPanelsDock: React.FC<EditorPanelsDockProps> = ({
  isOpen,
  activePanel,
  onSelectPanel,
  onAddMediaFile,
  onAddTextClip,
  onAddSfxClip,
  onAddMusicClip,
  onApplyEffect,
  onApplyFilter,
  onApplyTransition,
  onLoadTemplate,
  onImportSubtitle,
  onTranscriptCut,
  onWatermarkUpdate,
  transcriptWords = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'project' | 'generated'>('project');
  const [activeElementsTab, setActiveElementsTab] = useState<'stock_video' | 'stock_photo' | 'avatars' | 'stickers'>('stock_video');
  const [activeCaptionsTab, setActiveCaptionsTab] = useState<'auto' | 'manual' | 'import'>('auto');
  const [manualCaptionText, setManualCaptionText] = useState('');
  const [brandColors, setBrandColors] = useState<string[]>(['#4f46e5', '#10b981', '#f59e0b', '#ef4444']);
  const [newColorInput, setNewColorInput] = useState('#6366f1');
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);

  const panelItems: { id: TopLevelPanelId; label: string; icon: React.ReactNode }[] = [
    { id: 'media', label: t('editor.panels.media', 'Media'), icon: <FolderPlus size={18} /> },
    { id: 'templates', label: t('editor.panels.templates', 'Templates'), icon: <LayoutTemplate size={18} /> },
    { id: 'elements', label: t('editor.panels.elements', 'Elements'), icon: <Shapes size={18} /> },
    { id: 'audio', label: t('editor.panels.audio', 'Audio'), icon: <Music size={18} /> },
    { id: 'text', label: t('editor.panels.text', 'Text'), icon: <Type size={18} /> },
    { id: 'captions', label: t('editor.panels.captions', 'Captions'), icon: <Subtitles size={18} /> },
    { id: 'transcript', label: t('editor.panels.transcript', 'Transcript'), icon: <FileText size={18} /> },
    { id: 'effects', label: t('editor.panels.effects', 'Effects'), icon: <Sparkles size={18} /> },
    { id: 'transitions', label: t('editor.panels.transitions', 'Transitions'), icon: <GitCommit size={18} /> },
    { id: 'filters', label: t('editor.panels.filters', 'Filters'), icon: <Palette size={18} /> },
    { id: 'brandKit', label: t('editor.panels.brandKit', 'Brand Kit'), icon: <Briefcase size={18} /> },
    { id: 'plugins', label: t('editor.panels.plugins', 'Plugins'), icon: <Layers size={18} /> }
  ];

  const handlePanelClick = (id: TopLevelPanelId) => {
    if (activePanel === id) {
      onSelectPanel(null);
    } else {
      onSelectPanel(id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onAddMediaFile) {
      onAddMediaFile(e.target.files[0]);
    }
  };

  const handleAddBrandColor = () => {
    if (!brandColors.includes(newColorInput)) {
      setBrandColors([...brandColors, newColorInput]);
    }
  };

  const handleRemoveBrandColor = (color: string) => {
    setBrandColors(brandColors.filter((c) => c !== color));
  };

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', zIndex: 10 }}>
      {/* Dock Icon Bar */}
      <aside
        style={{
          width: '54px',
          backgroundColor: '#0e111a',
          borderRight: '1px solid #1f2436',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          gap: '4px',
          flexShrink: 0,
          zIndex: 12
        }}
      >
        {panelItems.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              data-testid={`panel-tab-${item.id}`}
              data-dock-tab={item.id}
              onClick={() => handlePanelClick(item.id)}
              className="touch-target"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: isActive ? '#4f46e5' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={item.label}
              aria-label={item.label}
            >
              {item.icon}
              <span style={{ fontSize: '9px', fontWeight: isActive ? 700 : 500, lineHeight: 1 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* Expanded Active Panel Content Drawer */}
      {activePanel && (
        <div
          data-testid={`dock-panel-drawer-${activePanel}`}
          style={{
            width: '280px',
            backgroundColor: '#121522',
            borderRight: '1px solid #23283c',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
            zIndex: 11
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid #23283c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              {panelItems.find((p) => p.id === activePanel)?.label}
            </h3>
            <button
              onClick={() => onSelectPanel(null)}
              className="touch-target"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#1a1e2e',
                border: '1px solid #2b324a',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label={t('common.close', 'Close')}
            >
              <X size={15} />
            </button>
          </div>

          {/* Drawer Body Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {/* PANEL 1: MEDIA */}
            {activePanel === 'media' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0a0c12', padding: '2px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('project')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: activeMediaTab === 'project' ? '#4f46e5' : 'transparent',
                      color: activeMediaTab === 'project' ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Project Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('generated')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: activeMediaTab === 'generated' ? '#4f46e5' : 'transparent',
                      color: activeMediaTab === 'generated' ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    AI Generated
                  </button>
                </div>

                {activeMediaTab === 'project' ? (
                  <>
                    <label
                      className="touch-target"
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px dashed #3c4566',
                        backgroundColor: '#161a29',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={18} color="#818cf8" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                        Upload Media
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        MP4, MOV, PNG, JPG, MP3
                      </span>
                      <input type="file" accept="video/*,image/*,audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        data-testid="qr-mobile-import-btn"
                        onClick={() => setIsQrModalOpen(true)}
                        className="touch-target"
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: '#1a1f30',
                          border: '1px solid #2b334e',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <QrCode size={14} color="#38bdf8" />
                        <span>From Phone</span>
                      </button>
                      <button
                        type="button"
                        data-testid="cloud-drive-import-btn"
                        onClick={() => setIsCloudModalOpen(true)}
                        className="touch-target"
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: '#1a1f30',
                          border: '1px solid #2b334e',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Cloud size={14} color="#a78bfa" />
                        <span>Cloud Drives</span>
                      </button>
                    </div>

                    {/* AI Video Generation Box */}
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#181b2a', border: '1px solid #2d3450' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Wand2 size={13} color="#c084fc" />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>
                          Text-to-Video AI
                        </span>
                      </div>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe clip to generate with AI..."
                        style={{
                          width: '100%',
                          height: '50px',
                          borderRadius: '6px',
                          backgroundColor: '#0c0e15',
                          border: '1px solid #242a3e',
                          color: '#f8fafc',
                          fontSize: '11px',
                          padding: '6px',
                          resize: 'none',
                          marginBottom: '6px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsAiGenerating(true);
                          setTimeout(() => setIsAiGenerating(false), 2000);
                        }}
                        className="touch-target"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          backgroundColor: '#4f46e5',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {isAiGenerating ? 'Generating Video...' : 'Generate Clip'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '11px' }}>
                    No AI generated videos yet. Generate from prompt above.
                  </div>
                )}
              </div>
            )}

            {/* PANEL 2: TEMPLATES */}
            {activePanel === 'templates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: '8px',
                      backgroundColor: '#0c0e15',
                      border: '1px solid #242a3e',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {['all', 'vlog', 'intro', 'tiktok', 'gaming'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTemplateCategory(cat)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: templateCategory === cat ? '#4f46e5' : '#191e2e',
                        color: templateCategory === cat ? '#ffffff' : '#94a3b8',
                        fontSize: '10px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'tpl-1', title: 'Khmer TikTok Beat', dur: '12s' },
                    { id: 'tpl-2', title: 'Cinematic Travel VLOG', dur: '18s' },
                    { id: 'tpl-3', title: 'Fast Gaming Montage', dur: '15s' },
                    { id: 'tpl-4', title: 'Modern Business Promo', dur: '10s' }
                  ].map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => onLoadTemplate && onLoadTemplate(tpl.id)}
                      style={{
                        borderRadius: '8px',
                        backgroundColor: '#191e2e',
                        border: '1px solid #2b334e',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ height: '70px', borderRadius: '6px', backgroundColor: '#252d44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={20} color="#818cf8" />
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tpl.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{tpl.dur}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PANEL 3: ELEMENTS */}
            {activePanel === 'elements' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '3px', backgroundColor: '#0a0c12', padding: '2px', borderRadius: '6px' }}>
                  {[
                    { id: 'stock_video', label: 'Videos' },
                    { id: 'stock_photo', label: 'Photos' },
                    { id: 'avatars', label: 'Avatars' },
                    { id: 'stickers', label: 'Stickers' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveElementsTab(tab.id as typeof activeElementsTab)}
                      style={{
                        flex: 1,
                        padding: '5px 4px',
                        borderRadius: '4px',
                        backgroundColor: activeElementsTab === tab.id ? '#4f46e5' : 'transparent',
                        color: activeElementsTab === tab.id ? '#ffffff' : '#94a3b8',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {activeElementsTab === 'stock_video' && (
                    <>
                      <div style={{ borderRadius: '8px', backgroundColor: '#191e2e', padding: '8px', textAlign: 'center' }}>
                        <Video size={24} color="#38bdf8" style={{ margin: '0 auto 4px' }} />
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Countdown</span>
                      </div>
                      <div style={{ borderRadius: '8px', backgroundColor: '#191e2e', padding: '8px', textAlign: 'center' }}>
                        <Video size={24} color="#38bdf8" style={{ margin: '0 auto 4px' }} />
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Nature Forest</span>
                      </div>
                    </>
                  )}
                  {activeElementsTab === 'stock_photo' && (
                    <>
                      <div style={{ borderRadius: '8px', backgroundColor: '#191e2e', padding: '8px', textAlign: 'center' }}>
                        <ImageIcon size={24} color="#34d399" style={{ margin: '0 auto 4px' }} />
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Angkor Sunset</span>
                      </div>
                      <div style={{ borderRadius: '8px', backgroundColor: '#191e2e', padding: '8px', textAlign: 'center' }}>
                        <ImageIcon size={24} color="#34d399" style={{ margin: '0 auto 4px' }} />
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Urban Night</span>
                      </div>
                    </>
                  )}
                  {activeElementsTab === 'avatars' && (
                    <div style={{ gridColumn: 'span 2', padding: '12px', borderRadius: '8px', backgroundColor: '#191e2e', textAlign: 'center' }}>
                      <Bot size={28} color="#c084fc" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>AI Talking Avatar</div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Generate talking avatar speech with AI</span>
                    </div>
                  )}
                  {activeElementsTab === 'stickers' && (
                    <>
                      <div style={{ borderRadius: '8px', backgroundColor: '#191e2e', padding: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Like Badge</span>
                      </div>
                      <div style={{ borderRadius: '8px', backgroundColor: '#191e2e', padding: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Subscribe</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* PANEL 4: AUDIO */}
            {activePanel === 'audio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>SOUND EFFECTS (SFX)</div>
                {[
                  { type: 'whoosh', title: 'Whoosh' },
                  { type: 'ding', title: 'Ding' },
                  { type: 'riser', title: 'Cinematic Riser' },
                  { type: 'bass_drop', title: 'Bass Drop' },
                  { type: 'camera_click', title: 'Camera Shutter' }
                ].map((sfx) => (
                  <div
                    key={sfx.type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#191e2e',
                      border: '1px solid #282f46'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => sfxSynth.playByType(sfx.type as any)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          backgroundColor: '#4f46e5',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Play size={12} />
                      </button>
                      <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 600 }}>{sfx.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddSfxClip && onAddSfxClip(sfx.type, sfx.title)}
                      className="touch-target"
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#262d46',
                        color: '#cbd5e1',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* PANEL 5: TEXT */}
            {activePanel === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  data-testid="add-heading-text-btn"
                  onClick={() => onAddTextClip && onAddTextClip('ចំណងជើងធំ')}
                  className="touch-target"
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  Add Heading (ចំណងជើង)
                </button>
                <button
                  type="button"
                  data-testid="add-body-text-btn"
                  onClick={() => onAddTextClip && onAddTextClip('អត្ថបទពិពណ៌នា')}
                  className="touch-target"
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: '#1e2438',
                    border: '1px solid #333d5c',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  Add Body Text
                </button>

                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginTop: '6px' }}>
                  STYLED TEXT ART
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { id: 'neon', name: 'Neon Glow', color: '#38bdf8' },
                    { id: 'gold', name: 'Golden 3D', color: '#facc15' },
                    { id: 'bold_stroke', name: 'Outline Badge', color: '#ef4444' },
                    { id: 'gradient', name: 'Sunset Gradient', color: '#ec4899' }
                  ].map((art) => (
                    <button
                      key={art.id}
                      onClick={() => onAddTextClip && onAddTextClip('អក្សរស្ទីលថ្មី', art.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '8px',
                        backgroundColor: '#191e2e',
                        border: '1px solid #282f46',
                        color: art.color,
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {art.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PANEL 6: CAPTIONS */}
            {activePanel === 'captions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '3px', backgroundColor: '#0a0c12', padding: '2px', borderRadius: '6px' }}>
                  <button
                    onClick={() => setActiveCaptionsTab('auto')}
                    style={{
                      flex: 1,
                      padding: '5px',
                      borderRadius: '4px',
                      backgroundColor: activeCaptionsTab === 'auto' ? '#4f46e5' : 'transparent',
                      color: activeCaptionsTab === 'auto' ? '#ffffff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Auto Subtitles
                  </button>
                  <button
                    onClick={() => setActiveCaptionsTab('manual')}
                    style={{
                      flex: 1,
                      padding: '5px',
                      borderRadius: '4px',
                      backgroundColor: activeCaptionsTab === 'manual' ? '#4f46e5' : 'transparent',
                      color: activeCaptionsTab === 'manual' ? '#ffffff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setActiveCaptionsTab('import')}
                    style={{
                      flex: 1,
                      padding: '5px',
                      borderRadius: '4px',
                      backgroundColor: activeCaptionsTab === 'import' ? '#4f46e5' : 'transparent',
                      color: activeCaptionsTab === 'import' ? '#ffffff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Import SRT
                  </button>
                </div>

                {activeCaptionsTab === 'auto' && (
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#191e2e', textAlign: 'center' }}>
                    <Subtitles size={24} color="#818cf8" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                      AI Auto Speech Recognition
                    </div>
                    <p style={{ fontSize: '10px', color: '#94a3b8', margin: '6px 0 12px' }}>
                      Generate synchronized Khmer and English subtitles from timeline speech audio.
                    </p>
                    <button
                      type="button"
                      className="touch-target"
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Generate Captions
                    </button>
                  </div>
                )}

                {activeCaptionsTab === 'manual' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      value={manualCaptionText}
                      onChange={(e) => setManualCaptionText(e.target.value)}
                      placeholder="Type subtitle cue text here..."
                      style={{
                        width: '100%',
                        height: '60px',
                        borderRadius: '6px',
                        backgroundColor: '#0c0e15',
                        border: '1px solid #242a3e',
                        color: '#f8fafc',
                        fontSize: '11px',
                        padding: '6px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (manualCaptionText.trim() && onAddTextClip) {
                          onAddTextClip(manualCaptionText.trim());
                          setManualCaptionText('');
                        }
                      }}
                      className="touch-target"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Add Caption Cue
                    </button>
                  </div>
                )}

                {activeCaptionsTab === 'import' && (
                  <label
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px dashed #3c4566',
                      backgroundColor: '#161a29',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <FileText size={20} color="#818cf8" />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
                      Choose Subtitle File
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748b' }}>.SRT, .VTT, or .ASS</span>
                    <input
                      type="file"
                      accept=".srt,.vtt,.ass"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0] && onImportSubtitle) {
                          onImportSubtitle([
                            { start: 0.5, end: 3.5, text: 'ចំណងជើងរត់ពីឯកសារ SRT' }
                          ]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            )}

            {/* PANEL 7: TRANSCRIPT */}
            {activePanel === 'transcript' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Click words to trim video intervals:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', backgroundColor: '#0c0e15', padding: '10px', borderRadius: '8px', border: '1px solid #20263a' }}>
                  {(transcriptWords.length > 0 ? transcriptWords : [
                    { word: 'ស្វាគមន៍', start: 0, end: 0.8 },
                    { word: 'មកកាន់', start: 0.8, end: 1.4 },
                    { word: 'SABYCUT', start: 1.4, end: 2.2 },
                    { word: 'កាត់ត', start: 2.2, end: 2.8 },
                    { word: 'វីដេអូ', start: 2.8, end: 3.4 },
                    { word: 'តាម', start: 3.4, end: 3.9 },
                    { word: 'AI', start: 3.9, end: 4.5 }
                  ]).map((tw, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onTranscriptCut && onTranscriptCut(idx)}
                      style={{
                        padding: '3px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#1a1f30',
                        border: '1px solid #2d3550',
                        color: '#cbd5e1',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                      title={`Remove [${tw.start}s - ${tw.end}s]`}
                    >
                      {tw.word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PANEL 8: EFFECTS */}
            {activePanel === 'effects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>BODY TRACKING & SKELETON</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { id: 'neon_body', name: 'Neon Outline' },
                    { id: 'cyber_glow', name: 'Cyber Glow' },
                    { id: 'angel_wings', name: 'Angel Wings' },
                    { id: 'halo', name: 'Halo Light' }
                  ].map((ef) => (
                    <button
                      key={ef.id}
                      onClick={() => onApplyEffect && onApplyEffect(ef.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '8px',
                        backgroundColor: '#191e2e',
                        border: '1px solid #282f46',
                        color: '#f8fafc',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {ef.name}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginTop: '6px' }}>
                  VIDEO SHADERS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { id: 'vignette', name: 'Vignette' },
                    { id: 'glitch', name: 'Glitch Pass' },
                    { id: 'blur', name: 'Soft Blur' },
                    { id: 'film_grain', name: 'Film Grain' }
                  ].map((ef) => (
                    <button
                      key={ef.id}
                      onClick={() => onApplyEffect && onApplyEffect(ef.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '8px',
                        backgroundColor: '#191e2e',
                        border: '1px solid #282f46',
                        color: '#cbd5e1',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {ef.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PANEL 9: TRANSITIONS */}
            {activePanel === 'transitions' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'dissolve', name: 'Cross Dissolve' },
                  { id: 'fade_black', name: 'Fade to Black' },
                  { id: 'fade_white', name: 'Flash White' },
                  { id: 'zoom_in', name: 'Zoom Impact' },
                  { id: 'slide_left', name: 'Slide Left' },
                  { id: 'wipe', name: 'Smooth Wipe' }
                ].map((tr) => (
                  <button
                    key={tr.id}
                    onClick={() => onApplyTransition && onApplyTransition(tr.id)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#191e2e',
                      border: '1px solid #282f46',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {tr.name}
                  </button>
                ))}
              </div>
            )}

            {/* PANEL 10: FILTERS */}
            {activePanel === 'filters' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'vibrant', name: 'Vibrant Colors' },
                  { id: 'film', name: 'Classic Film' },
                  { id: 'warm', name: 'Warm Sunset' },
                  { id: 'cool', name: 'Cool Nordic' },
                  { id: 'bw', name: 'Black & White' },
                  { id: 'retro', name: 'Vintage 90s' }
                ].map((fl) => (
                  <button
                    key={fl.id}
                    onClick={() => onApplyFilter && onApplyFilter(fl.id)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#191e2e',
                      border: '1px solid #282f46',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {fl.name}
                  </button>
                ))}
              </div>
            )}

            {/* PANEL 11: BRAND KIT */}
            {activePanel === 'brandKit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    BRAND COLOR PALETTE
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {brandColors.map((color) => (
                      <div
                        key={color}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: color,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleRemoveBrandColor(color)}
                        title="Click to remove"
                      >
                        <X size={10} color="#ffffff" />
                      </div>
                    ))}
                    <input
                      type="color"
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddBrandColor}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#262d46',
                        color: '#f8fafc',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    WATERMARK LOGO
                  </div>
                  <label
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px dashed #3c4566',
                      backgroundColor: '#161a29',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={16} color="#818cf8" />
                    <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      {watermarkUrl ? 'Replace Watermark PNG' : 'Upload Logo PNG'}
                    </span>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const url = URL.createObjectURL(e.target.files[0]);
                          setWatermarkUrl(url);
                          if (onWatermarkUpdate) onWatermarkUpdate(url);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {watermarkUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setWatermarkUrl(null);
                        if (onWatermarkUpdate) onWatermarkUpdate(null);
                      }}
                      style={{
                        marginTop: '6px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#371e2e',
                        color: '#fca5a5',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove Watermark
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PANEL 12: PLUGINS */}
            {activePanel === 'plugins' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'Khmer Typographic Shaper', desc: 'HarfBuzz Khmer complex glyph engine', enabled: true },
                  { name: 'AI Voice Synthesizer', desc: 'TTS speech with Khmer natural prosody', enabled: true },
                  { name: 'Giphy Media Connect', desc: 'Direct search trending animated memes', enabled: true },
                  { name: 'Cloud Render Bridge', desc: 'Spring Boot FFmpeg 4K export farm', enabled: true }
                ].map((plugin, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: '#191e2e',
                      border: '1px solid #282f46',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>{plugin.name}</span>
                      <span style={{ fontSize: '9px', color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        ACTIVE
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{plugin.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Phone Import Modal */}
      {isQrModalOpen && (
        <div
          data-testid="qr-import-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 95,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#141826',
              border: '1px solid #2c344e',
              borderRadius: '16px',
              maxWidth: '380px',
              width: '100%',
              padding: '20px',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Upload from Mobile Phone
              </h3>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="touch-target"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#1b1f30',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                width: '160px',
                height: '160px',
                margin: '16px auto',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QrCode size={136} color="#000000" />
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
              Scan this QR code with your phone camera or SABYCUT mobile app to transfer videos wirelessly.
            </p>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#818cf8', backgroundColor: '#1a1f30', padding: '6px 12px', borderRadius: '6px', display: 'inline-block' }}>
              Pairing Code: SABY-7821
            </div>
          </div>
        </div>
      )}

      {/* Cloud Drives Import Modal */}
      {isCloudModalOpen && (
        <div
          data-testid="cloud-import-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 95,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#141826',
              border: '1px solid #2c344e',
              borderRadius: '16px',
              maxWidth: '380px',
              width: '100%',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Cloud Drive Import
              </h3>
              <button
                type="button"
                onClick={() => setIsCloudModalOpen(false)}
                className="touch-target"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#1b1f30',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsCloudModalOpen(false)}
                className="touch-target"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#191f30',
                  border: '1px solid #2c3550',
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Cloud size={18} color="#38bdf8" />
                <span>Google Drive</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCloudModalOpen(false)}
                className="touch-target"
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#191f30',
                  border: '1px solid #2c3550',
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Cloud size={18} color="#a78bfa" />
                <span>Dropbox</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPanelsDock;
