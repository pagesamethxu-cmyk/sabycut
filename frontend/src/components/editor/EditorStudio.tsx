import React, { useState, useEffect, useRef } from 'react';
import { 
  Scissors, 
  Trash2, 
  Type, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  ArrowLeft, 
  Settings as SettingsIcon,
  Volume2,
  Film,
  Upload,
  Copy,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { t } from '../../i18n';
import { sfxSynth } from '../../services/soundEffects';
import { AutoCutModal, AutoCutResult } from '../autocut/AutoCutModal';
import { SettingsModal } from '../settings/SettingsModal';
import { ClipInspector, ClipProperties } from './ClipInspector';
import { ExportModal } from './ExportModal';
import { useIsMobile } from '../../hooks/useIsMobile';


export interface Clip {
  id: string;
  type: 'video' | 'audio' | 'sfx' | 'text';
  title: string;
  start: number;
  end: number;
  sfxType?: string;
  text?: string;
}

interface EditorStudioProps {
  onBack: () => void;
  initialAutoCutResult?: AutoCutResult | null;
}

const getDefaultProperties = (type: 'video' | 'audio' | 'sfx' | 'text', title?: string, text?: string): ClipProperties => ({
  speed: 1.0,
  scale: 100,
  rotation: 0,
  flipH: false,
  opacity: 100,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  filterPreset: 'none',
  chromaKey: false,
  volume: 100,
  fadeIn: 0,
  fadeOut: 0,
  ducking: false,
  text: text || (type === 'text' ? 'ចំណងជើងខ្មែរថ្មី' : ''),
  fontFamily: 'Noto Sans Khmer',
  fontSize: 22,
  color: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  strokeColor: '#000000',
  strokeWidth: 2,
  textAnimation: 'none',
  transitionType: 'none',
  transitionDuration: 0.5,
});

const getPresetFilterCss = (preset: string) => {
  switch (preset) {
    case 'vibrant': return 'saturate(1.4) contrast(1.1)';
    case 'film': return 'sepia(0.2) contrast(1.15) brightness(0.95)';
    case 'warm': return 'sepia(0.35) hue-rotate(-15deg) saturate(1.2)';
    case 'cool': return 'hue-rotate(25deg) saturate(1.1) brightness(1.05)';
    case 'bw': return 'grayscale(1)';
    default: return '';
  }
};

export const EditorStudio: React.FC<EditorStudioProps> = ({ onBack, initialAutoCutResult }) => {
  const isMobile = useIsMobile();
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-v1');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const [zoom, setZoom] = useState(35); // px per second
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Modals
  const [isAutoCutOpen, setIsAutoCutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Hidden direct file import input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clips state
  const [videoClips, setVideoClips] = useState<Clip[]>([
    { id: 'clip-v1', type: 'video', title: 'Hook Scene', start: 0, end: 4.5 },
    { id: 'clip-v2', type: 'video', title: 'Highlight Clip', start: 4.5, end: 11.0 },
    { id: 'clip-v3', type: 'video', title: 'Ending Scene', start: 11.0, end: 18.0 }
  ]);

  const [textClips, setTextClips] = useState<Clip[]>([
    { id: 'clip-t1', type: 'text', title: 'Intro Text', start: 0.5, end: 4.0, text: 'ស្វាគមន៍មកកាន់ SABYCUT' },
    { id: 'clip-t2', type: 'text', title: 'Feature Text', start: 5.0, end: 10.5, text: 'កាត់តវីដេអូស្វ័យប្រវត្តិតាម AI' }
  ]);

  const [sfxClips, setSfxClips] = useState<Clip[]>([
    { id: 'clip-s1', type: 'sfx', title: 'Whoosh', start: 0.1, end: 0.6, sfxType: 'whoosh' },
    { id: 'clip-s2', type: 'sfx', title: 'Ding', start: 4.4, end: 5.4, sfxType: 'ding' },
    { id: 'clip-s3', type: 'sfx', title: 'Bass Drop', start: 11.0, end: 12.8, sfxType: 'bass_drop' }
  ]);

  // Per-clip CapCut properties map
  const [clipPropsMap, setClipPropsMap] = useState<Record<string, ClipProperties>>({
    'clip-v1': getDefaultProperties('video', 'Hook Scene'),
    'clip-v2': getDefaultProperties('video', 'Highlight Clip'),
    'clip-v3': getDefaultProperties('video', 'Ending Scene'),
    'clip-t1': getDefaultProperties('text', 'Intro Text', 'ស្វាគមន៍មកកាន់ SABYCUT'),
    'clip-t2': getDefaultProperties('text', 'Feature Text', 'កាត់តវីដេអូស្វ័យប្រវត្តិតាម AI'),
    'clip-s1': getDefaultProperties('sfx', 'Whoosh'),
    'clip-s2': getDefaultProperties('sfx', 'Ding'),
    'clip-s3': getDefaultProperties('sfx', 'Bass Drop')
  });

  // Timeline resize drag state
  const [resizing, setResizing] = useState<{
    clipId: string;
    edge: 'left' | 'right';
    initialX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  const totalDuration = Math.max(
    ...videoClips.map((c) => c.end),
    ...textClips.map((c) => c.end),
    ...sfxClips.map((c) => c.end),
    18
  );

  const timelineRef = useRef<HTMLDivElement>(null);
  const triggeredSFXRef = useRef<Set<string>>(new Set());

  // Handle Initial AutoCut Result if passed from App
  useEffect(() => {
    if (initialAutoCutResult) {
      handleApplyAutoCut(initialAutoCutResult);
    }
  }, [initialAutoCutResult]);

  // Active clip at current playhead
  const activeVideoClip = videoClips.find((c) => currentTime >= c.start && currentTime <= c.end) || null;
  const activeTextClip = textClips.find((c) => currentTime >= c.start && currentTime <= c.end) || null;

  // Selected clip object
  const allClips = [...videoClips, ...textClips, ...sfxClips];
  const selectedClip = allClips.find((c) => c.id === selectedClipId) || null;

  // Selected or active video clip properties for preview rendering
  const activeVideoProps = activeVideoClip && clipPropsMap[activeVideoClip.id]
    ? clipPropsMap[activeVideoClip.id]
    : getDefaultProperties('video');

  const activeTextProps = activeTextClip && clipPropsMap[activeTextClip.id]
    ? clipPropsMap[activeTextClip.id]
    : getDefaultProperties('text', undefined, activeTextClip?.text);

  // Synchronize HTML5 video element with current timeline playhead and properties
  useEffect(() => {
    if (videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.25) {
        videoRef.current.currentTime = currentTime;
      }

      // Apply speed
      if (activeVideoProps?.speed) {
        videoRef.current.playbackRate = activeVideoProps.speed;
      }

      // Apply volume & audio ducking
      if (activeVideoProps?.volume !== undefined) {
        const duckingFactor = (activeVideoProps.ducking && activeTextClip) ? 0.35 : 1.0;
        videoRef.current.volume = Math.min(1, Math.max(0, (activeVideoProps.volume / 100) * duckingFactor));
      }

      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [currentTime, isPlaying, activeVideoProps, activeTextClip]);

  // Playback timer loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTime) / 1000;
        const currentSpeed = activeVideoProps?.speed || 1.0;
        setCurrentTime((prev) => {
          const next = prev + (delta * currentSpeed);
          if (next >= totalDuration) {
            setIsPlaying(false);
            triggeredSFXRef.current.clear();
            return 0;
          }

          // Trigger sound effects on exact timestamp match
          sfxClips.forEach((c) => {
            if (prev <= c.start && next >= c.start && !triggeredSFXRef.current.has(c.id)) {
              triggeredSFXRef.current.add(c.id);
              if (c.sfxType) sfxSynth.playByType(c.sfxType);
            }
          });

          return next;
        });
      }
      lastTime = now;
      if (isPlaying) {
        animId = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, totalDuration, sfxClips, activeVideoProps]);

  // Timeline Clip Drag Resizing Listener
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaSeconds = (e.clientX - resizing.initialX) / zoom;
      if (resizing.edge === 'left') {
        const newStart = Math.max(0, Math.min(resizing.initialEnd - 0.3, resizing.initialStart + deltaSeconds));
        updateClipBounds(resizing.clipId, Number(newStart.toFixed(2)), resizing.initialEnd);
      } else {
        const newEnd = Math.max(resizing.initialStart + 0.3, resizing.initialEnd + deltaSeconds);
        updateClipBounds(resizing.clipId, resizing.initialStart, Number(newEnd.toFixed(2)));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, zoom]);

  const updateClipBounds = (clipId: string, newStart: number, newEnd: number) => {
    setVideoClips((prev) => prev.map((c) => c.id === clipId ? { ...c, start: newStart, end: newEnd } : c));
    setTextClips((prev) => prev.map((c) => c.id === clipId ? { ...c, start: newStart, end: newEnd } : c));
    setSfxClips((prev) => prev.map((c) => c.id === clipId ? { ...c, start: newStart, end: newEnd } : c));
  };

  // Manual Video Import Handler
  const handleManualVideoImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setVideoSrc(url);

      const tempVideo = document.createElement('video');
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        const dur = tempVideo.duration || 18;
        const newClipId = `clip-v-imported-${Date.now()}`;
        setVideoClips([
          { id: newClipId, type: 'video', title: file.name, start: 0, end: dur }
        ]);
        setClipPropsMap((prev) => ({
          ...prev,
          [newClipId]: getDefaultProperties('video', file.name)
        }));
        setSelectedClipId(newClipId);
        setCurrentTime(0);
      };
    }
  };

  // Split clip at playhead
  const handleSplit = () => {
    if (!activeVideoClip) return;
    if (currentTime <= activeVideoClip.start + 0.3 || currentTime >= activeVideoClip.end - 0.3) return;

    const firstId = `clip-v-${Date.now()}-1`;
    const secondId = `clip-v-${Date.now()}-2`;

    const first: Clip = {
      ...activeVideoClip,
      id: firstId,
      end: currentTime
    };

    const second: Clip = {
      ...activeVideoClip,
      id: secondId,
      title: `${activeVideoClip.title} (Part 2)`,
      start: currentTime
    };

    const existingProps = clipPropsMap[activeVideoClip.id] || getDefaultProperties('video', activeVideoClip.title);

    setVideoClips((prev) =>
      prev.filter((c) => c.id !== activeVideoClip.id).concat([first, second]).sort((a, b) => a.start - b.start)
    );

    setClipPropsMap((prev) => ({
      ...prev,
      [firstId]: { ...existingProps },
      [secondId]: { ...existingProps }
    }));

    setSelectedClipId(second.id);
  };

  // Trim Left of selected clip to current playhead
  const handleTrimLeft = () => {
    if (!selectedClip) return;
    if (currentTime <= selectedClip.start || currentTime >= selectedClip.end) return;
    updateClipBounds(selectedClip.id, currentTime, selectedClip.end);
  };

  // Trim Right of selected clip to current playhead
  const handleTrimRight = () => {
    if (!selectedClip) return;
    if (currentTime <= selectedClip.start || currentTime >= selectedClip.end) return;
    updateClipBounds(selectedClip.id, selectedClip.start, currentTime);
  };

  // Duplicate selected clip
  const handleDuplicate = () => {
    if (!selectedClip) return;
    const dur = selectedClip.end - selectedClip.start;
    const newId = `${selectedClip.id}-dup-${Date.now()}`;
    const newClip: Clip = {
      ...selectedClip,
      id: newId,
      title: `${selectedClip.title} (Copy)`,
      start: selectedClip.end,
      end: selectedClip.end + dur
    };

    if (selectedClip.type === 'video') setVideoClips((prev) => [...prev, newClip]);
    else if (selectedClip.type === 'text') setTextClips((prev) => [...prev, newClip]);
    else setSfxClips((prev) => [...prev, newClip]);

    if (clipPropsMap[selectedClip.id]) {
      setClipPropsMap((prev) => ({ ...prev, [newId]: { ...prev[selectedClip.id] } }));
    }
    setSelectedClipId(newId);
  };

  // Delete selected clip
  const handleDelete = () => {
    if (!selectedClipId) return;
    setVideoClips((prev) => prev.filter((c) => c.id !== selectedClipId));
    setTextClips((prev) => prev.filter((c) => c.id !== selectedClipId));
    setSfxClips((prev) => prev.filter((c) => c.id !== selectedClipId));
    setSelectedClipId(null);
  };

  // Ripple Delete
  const handleRippleDelete = () => {
    if (!selectedClip) return;
    const dur = selectedClip.end - selectedClip.start;
    const clipStart = selectedClip.start;

    if (selectedClip.type === 'video') {
      setVideoClips((prev) =>
        prev
          .filter((c) => c.id !== selectedClip.id)
          .map((c) => c.start > clipStart ? { ...c, start: Math.max(0, c.start - dur), end: Math.max(0.3, c.end - dur) } : c)
      );
    } else if (selectedClip.type === 'text') {
      setTextClips((prev) =>
        prev
          .filter((c) => c.id !== selectedClip.id)
          .map((c) => c.start > clipStart ? { ...c, start: Math.max(0, c.start - dur), end: Math.max(0.3, c.end - dur) } : c)
      );
    } else {
      setSfxClips((prev) =>
        prev
          .filter((c) => c.id !== selectedClip.id)
          .map((c) => c.start > clipStart ? { ...c, start: Math.max(0, c.start - dur), end: Math.max(0.3, c.end - dur) } : c)
      );
    }
    setSelectedClipId(null);
  };

  // Add Khmer text overlay
  const handleAddText = () => {
    const newId = `clip-t-${Date.now()}`;
    const newTextClip: Clip = {
      id: newId,
      type: 'text',
      title: 'Khmer Caption',
      start: currentTime,
      end: Math.min(currentTime + 3.0, totalDuration),
      text: 'ចំណងជើងខ្មែរថ្មី'
    };
    setTextClips((prev) => [...prev, newTextClip]);
    setClipPropsMap((prev) => ({
      ...prev,
      [newId]: getDefaultProperties('text', 'Khmer Caption', 'ចំណងជើងខ្មែរថ្មី')
    }));
    setSelectedClipId(newId);
    setIsInspectorOpen(true);
  };

  // Add SFX clip
  const handleAddSFX = (type: 'whoosh' | 'ding' | 'pop' | 'bass_drop') => {
    const duration = type === 'bass_drop' ? 1.8 : type === 'ding' ? 1.0 : 0.5;
    const newId = `clip-s-${Date.now()}`;
    const newClip: Clip = {
      id: newId,
      type: 'sfx',
      title: type.toUpperCase(),
      sfxType: type,
      start: currentTime,
      end: currentTime + duration
    };
    setSfxClips((prev) => [...prev, newClip]);
    setClipPropsMap((prev) => ({
      ...prev,
      [newId]: getDefaultProperties('sfx', type.toUpperCase())
    }));
    setSelectedClipId(newId);
    sfxSynth.playByType(type);
  };

  // Timeline scrub click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const newTime = Math.max(0, Math.min(clickX / zoom, totalDuration));
    setCurrentTime(newTime);
    triggeredSFXRef.current.clear();
  };

  // Handle properties change from ClipInspector
  const handleClipPropsChange = (updated: Partial<ClipProperties>) => {
    if (!selectedClipId) return;
    setClipPropsMap((prev) => ({
      ...prev,
      [selectedClipId]: {
        ...(prev[selectedClipId] || getDefaultProperties(selectedClip?.type || 'video', selectedClip?.title, selectedClip?.text)),
        ...updated
      }
    }));

    // If text changed, sync with clip object
    if (updated.text !== undefined) {
      setTextClips((prev) =>
        prev.map((c) => c.id === selectedClipId ? { ...c, text: updated.text } : c)
      );
    }
  };

  // Apply Auto-Cut result from modal
  const handleApplyAutoCut = (res: AutoCutResult) => {
    if (res.videoUrl) {
      setVideoSrc(res.videoUrl);
    }

    const newVideo: Clip[] = res.cuts.map((c, idx) => ({
      id: `ai-v-${idx + 1}`,
      type: 'video',
      title: c.title,
      start: c.start,
      end: c.end
    }));

    const newSfx: Clip[] = res.sfx.map((s, idx) => ({
      id: `ai-s-${idx + 1}`,
      type: 'sfx',
      title: s.type.toUpperCase(),
      sfxType: s.type,
      start: s.time,
      end: s.time + 0.6
    }));

    const newText: Clip[] = res.captions.map((cap, idx) => ({
      id: `ai-t-${idx + 1}`,
      type: 'text',
      title: `Caption ${idx + 1}`,
      start: cap.start,
      end: cap.end,
      text: cap.text
    }));

    // Populate properties map with defaults
    const newPropsMap: Record<string, ClipProperties> = {};
    newVideo.forEach((c) => {
      newPropsMap[c.id] = getDefaultProperties('video', c.title);
    });
    newSfx.forEach((s) => {
      newPropsMap[s.id] = getDefaultProperties('sfx', s.title);
    });
    newText.forEach((t) => {
      newPropsMap[t.id] = getDefaultProperties('text', t.title, t.text);
    });

    setVideoClips(newVideo);
    setSfxClips(newSfx);
    setTextClips(newText);
    setClipPropsMap(newPropsMap);

    if (newVideo.length > 0) {
      setSelectedClipId(newVideo[0].id);
    }
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0a0b10', overflow: 'hidden' }}>
      {/* Hidden file input for manual video import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleManualVideoImport}
        style={{ display: 'none' }}
      />

      {/* Studio Header */}
      <header style={{
        height: isMobile ? 'auto' : '52px',
        paddingTop: isMobile ? 'max(env(safe-area-inset-top, 0px), 8px)' : '0px',
        paddingBottom: isMobile ? '8px' : '0px',
        paddingLeft: '12px',
        paddingRight: '12px',
        backgroundColor: '#12141c',
        borderBottom: '1px solid #232738',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20
      }}>
        {isMobile ? (
          <>
            {/* Mobile Header: Left (Back), Center (Aspect ratio), Right (AutoCut & Export) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={onBack}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  backgroundColor: '#1a1d2b',
                  color: '#cbd5e1',
                  border: '1px solid #292e44',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                SABYCUT
              </span>
            </div>

            {/* Center: Aspect Ratio Pill */}
            <div style={{ display: 'flex', gap: '2px', backgroundColor: '#1a1d2b', padding: '2px', borderRadius: '6px' }}>
              {(['9:16', '16:9', '1:1'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    backgroundColor: aspectRatio === r ? '#4f46e5' : 'transparent',
                    color: aspectRatio === r ? '#ffffff' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Right: AutoCut & Export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsAutoCutOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  color: '#c4b5fd',
                  fontSize: '11px',
                  fontWeight: 700
                }}
                title="AI Auto Cut"
              >
                <Sparkles size={12} />
                <span>AI</span>
              </button>

              <button
                onClick={() => setIsExportOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <Download size={13} />
                <span>{t('nav.export')}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Left: Back & Project Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={onBack}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  backgroundColor: '#1a1d2b',
                  color: '#cbd5e1',
                  border: '1px solid #292e44'
                }}
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
              </button>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                SABYCUT Studio
              </span>
              <span style={{ fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                CapCut Mode
              </span>
            </div>

            {/* Center: Play, Pause, Scrub Reset, Aspect Ratio */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  setCurrentTime(0);
                  triggeredSFXRef.current.clear();
                }}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#1a1d2b',
                  border: '1px solid #282d3f',
                  color: '#cbd5e1'
                }}
                title="Reset Playhead"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: isPlaying ? '#eab308' : '#4f46e5',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? t('editor.pause') : t('editor.play')}</span>
              </button>

              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#818cf8', marginLeft: '6px' }}>
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>

              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1a1d2b', padding: '3px', borderRadius: '6px', marginLeft: '6px' }}>
                {(['9:16', '16:9', '1:1'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: aspectRatio === r ? '#4f46e5' : 'transparent',
                      color: aspectRatio === r ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Import Video, AI Auto Cut, Inspector Toggle, Settings, Export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1b1d28',
                  border: '1px solid #2e344a',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <Upload size={14} />
                <span>Import Video</span>
              </button>

              <button
                onClick={() => setIsAutoCutOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  color: '#c4b5fd',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <Sparkles size={14} />
                <span>{t('autocut.title')}</span>
              </button>

              <button
                onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: isInspectorOpen ? 'rgba(99, 102, 241, 0.2)' : '#1a1d2b',
                  border: isInspectorOpen ? '1px solid #818cf8' : '1px solid #292e44',
                  color: isInspectorOpen ? '#818cf8' : '#cbd5e1',
                  fontSize: '12px'
                }}
                title="Toggle Inspector"
              >
                <Sliders size={14} />
                <span>Inspector</span>
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                style={{
                  padding: '7px',
                  borderRadius: '8px',
                  backgroundColor: '#1a1d2b',
                  border: '1px solid #292e44',
                  color: '#cbd5e1'
                }}
              >
                <SettingsIcon size={14} />
              </button>

              <button
                onClick={() => setIsExportOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <Download size={14} />
                <span>{t('nav.export')}</span>
              </button>
            </div>
          </>
        )}
      </header>


      {/* Main Center Area: Player Viewport + Clip Inspector */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
        {/* Center Viewport Preview */}
        <div style={{
          flex: 1,
          backgroundColor: '#07080c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Canvas Player Box */}
          <div style={{
            width: aspectRatio === '9:16' ? (isMobile ? '180px' : '280px') : aspectRatio === '16:9' ? (isMobile ? '310px' : '540px') : (isMobile ? '230px' : '360px'),
            height: aspectRatio === '9:16' ? (isMobile ? '320px' : '498px') : aspectRatio === '16:9' ? (isMobile ? '174px' : '304px') : (isMobile ? '230px' : '360px'),
            maxHeight: isMobile ? '38vh' : 'none',
            maxWidth: isMobile ? '92vw' : 'none',
            backgroundColor: '#0f1118',
            border: '1px solid #23273a',
            borderRadius: '12px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>

            {/* Real Video Player with live CSS Transform and Color Grading */}
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${activeVideoProps.flipH ? -activeVideoProps.scale / 100 : activeVideoProps.scale / 100}, ${activeVideoProps.scale / 100}) rotate(${activeVideoProps.rotation}deg)`,
                  filter: `brightness(${1 + (activeVideoProps.brightness || 0) / 100}) contrast(${1 + (activeVideoProps.contrast || 0) / 100}) saturate(${1 + (activeVideoProps.saturation || 0) / 100}) ${getPresetFilterCss(activeVideoProps.filterPreset)}`,
                  opacity: (activeVideoProps.opacity || 100) / 100,
                  transition: 'transform 0.15s ease, filter 0.15s ease'
                }}
                playsInline
                muted
              />
            ) : activeVideoClip ? (
              <div style={{
                textAlign: 'center',
                zIndex: 1,
                transform: `scale(${activeVideoProps.flipH ? -activeVideoProps.scale / 100 : activeVideoProps.scale / 100}, ${activeVideoProps.scale / 100}) rotate(${activeVideoProps.rotation}deg)`,
                filter: `brightness(${1 + (activeVideoProps.brightness || 0) / 100}) contrast(${1 + (activeVideoProps.contrast || 0) / 100}) saturate(${1 + (activeVideoProps.saturation || 0) / 100}) ${getPresetFilterCss(activeVideoProps.filterPreset)}`,
                opacity: (activeVideoProps.opacity || 100) / 100,
                transition: 'transform 0.15s ease, filter 0.15s ease'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  backgroundColor: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Film size={28} color="#ffffff" />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  {activeVideoClip.title}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>
                  {activeVideoClip.start.toFixed(1)}s - {activeVideoClip.end.toFixed(1)}s
                </div>
                {activeVideoProps.speed !== 1.0 && (
                  <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', backgroundColor: '#312e81', color: '#a5b4fc', padding: '2px 6px', borderRadius: '4px' }}>
                    {activeVideoProps.speed}x speed
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: '#64748b' }}>No clip at current position</span>
            )}

            {/* Active Subtitle Rendering with Selected Khmer font & styling */}
            {activeTextClip && (
              <div style={{
                position: 'absolute',
                bottom: '16%',
                width: '90%',
                textAlign: 'center',
                zIndex: 10,
                pointerEvents: 'none'
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: activeTextProps.backgroundColor || 'rgba(0, 0, 0, 0.75)',
                  color: activeTextProps.color || '#ffffff',
                  fontSize: `${activeTextProps.fontSize || 20}px`,
                  fontWeight: 600,
                  fontFamily: `'${activeTextProps.fontFamily || 'Noto Sans Khmer'}', sans-serif`,
                  WebkitTextStroke: activeTextProps.strokeWidth > 0 ? `${activeTextProps.strokeWidth}px ${activeTextProps.strokeColor}` : undefined,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  maxWidth: '92%',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {activeTextProps.text || activeTextClip.text}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Scrubber Controls Bar */}
        {isMobile && (
          <div style={{
            height: '44px',
            backgroundColor: '#0d0f16',
            borderTop: '1px solid #1f2334',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            flexShrink: 0
          }}>
            <button
              onClick={() => {
                setCurrentTime(0);
                triggeredSFXRef.current.clear();
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: '#1a1d2b',
                color: '#cbd5e1',
                border: '1px solid #282d3f',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px'
              }}
              title="Reset Playhead"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 20px',
                borderRadius: '20px',
                backgroundColor: isPlaying ? '#eab308' : '#4f46e5',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? t('editor.pause') : t('editor.play')}</span>
            </button>

            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        )}

        {/* Clip Inspector */}
        {isInspectorOpen && selectedClip && (
          <ClipInspector
            clipType={selectedClip.type}
            clipTitle={selectedClip.title}
            properties={clipPropsMap[selectedClip.id] || getDefaultProperties(selectedClip.type, selectedClip.title, selectedClip.text)}
            onChange={handleClipPropsChange}
            onClose={() => setIsInspectorOpen(false)}
          />
        )}
      </div>

      {/* Bottom Timeline Section (CapCut Multi-track) */}
      <div style={{
        height: isMobile ? '200px' : '240px',
        backgroundColor: '#10121a',
        borderTop: '1px solid #232738',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom, 0px), 8px)' : '0px'
      }}>
        {/* Timeline Tools */}
        <div style={{
          height: isMobile ? '46px' : '38px',
          backgroundColor: '#151722',
          borderBottom: '1px solid #232738',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          gap: '8px'
        }}>
          {/* Editing Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Mobile Inspector / Adjust Button */}
            {isMobile && selectedClip && (
              <button
                onClick={() => setIsInspectorOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                <Sliders size={13} />
                <span>Adjust</span>
              </button>
            )}

            <button
              onClick={handleSplit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 600
              }}
              title={t('editor.split')}
            >
              <Scissors size={13} color="#818cf8" />
              <span>{t('editor.split')}</span>
            </button>

            <button
              onClick={handleTrimLeft}
              disabled={!selectedClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: selectedClip ? '#38bdf8' : '#64748b',
                fontSize: '11px'
              }}
              title="Trim Left to Playhead"
            >
              <ChevronLeft size={13} />
              <span>Trim Left</span>
            </button>

            <button
              onClick={handleTrimRight}
              disabled={!selectedClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: selectedClip ? '#38bdf8' : '#64748b',
                fontSize: '11px'
              }}
              title="Trim Right to Playhead"
            >
              <span>Trim Right</span>
              <ChevronRight size={13} />
            </button>

            <button
              onClick={handleDuplicate}
              disabled={!selectedClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: selectedClip ? '#a78bfa' : '#64748b',
                fontSize: '11px'
              }}
              title="Duplicate Clip"
            >
              <Copy size={13} />
              <span>Duplicate</span>
            </button>

            <button
              onClick={handleRippleDelete}
              disabled={!selectedClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: selectedClip ? '#f87171' : '#64748b',
                fontSize: '11px'
              }}
              title="Ripple Delete"
            >
              <Trash2 size={13} />
              <span>Ripple Del</span>
            </button>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#2e3448', margin: '0 4px' }} />

            <button
              onClick={handleAddText}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#fbbf24',
                fontSize: '11px'
              }}
            >
              <Type size={13} />
              <span>+ Text (Khmer)</span>
            </button>

            <button
              onClick={() => handleAddSFX('whoosh')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#c084fc',
                fontSize: '11px'
              }}
            >
              <Volume2 size={13} />
              <span>SFX Whoosh</span>
            </button>

            <button
              onClick={() => handleAddSFX('ding')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#c084fc',
                fontSize: '11px'
              }}
            >
              <Volume2 size={13} />
              <span>SFX Ding</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setZoom(Math.max(15, zoom - 6))}
              style={{ background: 'none', color: '#94a3b8' }}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
              {zoom}px/s
            </span>
            <button
              onClick={() => setZoom(Math.min(80, zoom + 6))}
              style={{ background: 'none', color: '#94a3b8' }}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
          </div>
        </div>

        {/* Tracks Canvas */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
            backgroundColor: '#0c0d13',
            cursor: 'pointer'
          }}
        >
          {/* Time Ruler */}
          <div style={{
            height: '24px',
            backgroundColor: '#13151f',
            borderBottom: '1px solid #212433',
            position: 'relative',
            width: `${totalDuration * zoom}px`
          }}>
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, sec) => (
              <div
                key={sec}
                style={{
                  position: 'absolute',
                  left: `${sec * zoom}px`,
                  top: 0,
                  bottom: 0,
                  borderLeft: '1px solid #282c3f',
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#64748b',
                  paddingLeft: '3px'
                }}
              >
                {sec}s
              </div>
            ))}
          </div>

          {/* Red Playhead Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${currentTime * zoom}px`,
            width: '2px',
            backgroundColor: '#ef4444',
            zIndex: 30,
            pointerEvents: 'none',
            transform: 'translateX(-50%)'
          }} />

          {/* Tracks List */}
          <div style={{ padding: '8px 0', width: `${totalDuration * zoom}px`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Video Track */}
            <div style={{ height: '36px', backgroundColor: 'rgba(255,255,255,0.02)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '6px', top: '10px', fontSize: '10px', color: '#475569', fontWeight: 700 }}>
                VIDEO
              </div>
              {videoClips.map((c) => (
                <div
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClipId(c.id);
                    setIsInspectorOpen(true);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${c.start * zoom}px`,
                    width: `${Math.max(20, (c.end - c.start) * zoom)}px`,
                    top: '4px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: selectedClipId === c.id ? '#4f46e5' : '#272b3d',
                    border: selectedClipId === c.id ? '2px solid #818cf8' : '1px solid #3d4461',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                  }}
                >
                  {/* Left Trim Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizing({
                        clipId: c.id,
                        edge: 'left',
                        initialX: e.clientX,
                        initialStart: c.start,
                        initialEnd: c.end
                      });
                    }}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '6px',
                      cursor: 'ew-resize',
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    }}
                    title="Drag to trim start"
                  />

                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '4px' }}>
                    {c.title}
                  </span>
                  <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'monospace', paddingRight: '4px' }}>
                    {(c.end - c.start).toFixed(1)}s
                  </span>

                  {/* Right Trim Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizing({
                        clipId: c.id,
                        edge: 'right',
                        initialX: e.clientX,
                        initialStart: c.start,
                        initialEnd: c.end
                      });
                    }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '6px',
                      cursor: 'ew-resize',
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    }}
                    title="Drag to trim end"
                  />
                </div>
              ))}
            </div>

            {/* Subtitles Track */}
            <div style={{ height: '36px', backgroundColor: 'rgba(255,255,255,0.02)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '6px', top: '10px', fontSize: '10px', color: '#475569', fontWeight: 700 }}>
                TEXT
              </div>
              {textClips.map((c) => (
                <div
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClipId(c.id);
                    setIsInspectorOpen(true);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${c.start * zoom}px`,
                    width: `${Math.max(20, (c.end - c.start) * zoom)}px`,
                    top: '4px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: selectedClipId === c.id ? '#b45309' : '#3a301e',
                    border: selectedClipId === c.id ? '2px solid #fbbf24' : '1px solid #5a4928',
                    color: '#fef3c7',
                    fontSize: '11px',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    fontFamily: `'${clipPropsMap[c.id]?.fontFamily || 'Noto Sans Khmer'}', sans-serif`
                  }}
                >
                  {/* Left Trim Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizing({
                        clipId: c.id,
                        edge: 'left',
                        initialX: e.clientX,
                        initialStart: c.start,
                        initialEnd: c.end
                      });
                    }}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '6px',
                      cursor: 'ew-resize',
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    }}
                  />

                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '4px' }}>
                    {c.text || c.title}
                  </span>
                  <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'monospace', paddingRight: '4px' }}>
                    {(c.end - c.start).toFixed(1)}s
                  </span>

                  {/* Right Trim Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizing({
                        clipId: c.id,
                        edge: 'right',
                        initialX: e.clientX,
                        initialStart: c.start,
                        initialEnd: c.end
                      });
                    }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '6px',
                      cursor: 'ew-resize',
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* SFX Track */}
            <div style={{ height: '36px', backgroundColor: 'rgba(255,255,255,0.02)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '6px', top: '10px', fontSize: '10px', color: '#475569', fontWeight: 700 }}>
                SFX
              </div>
              {sfxClips.map((c) => (
                <div
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClipId(c.id);
                    setIsInspectorOpen(true);
                    if (c.sfxType) sfxSynth.playByType(c.sfxType);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${c.start * zoom}px`,
                    width: `${Math.max(20, (c.end - c.start) * zoom)}px`,
                    top: '4px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: selectedClipId === c.id ? '#7e22ce' : '#3b2a4d',
                    border: selectedClipId === c.id ? '2px solid #c084fc' : '1px solid #593d75',
                    color: '#f3e8ff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <span>{c.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AutoCutModal
        isOpen={isAutoCutOpen}
        onClose={() => setIsAutoCutOpen(false)}
        onApply={handleApplyAutoCut}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectTitle="SABYCUT Master"
        totalDuration={totalDuration}
        videoClipsCount={videoClips.length}
        textClipsCount={textClips.length}
        sfxClipsCount={sfxClips.length}
      />
    </div>
  );
};
