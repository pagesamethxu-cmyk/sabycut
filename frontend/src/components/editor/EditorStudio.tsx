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
  Maximize2,
  History,
  RefreshCw,
  Music,
  Wand2,
  Eye,
  EyeOff,
  Layers,
  MousePointer,
  Hand,
  PictureInPicture,
  FolderPlus
} from 'lucide-react';
import { t } from '../../i18n';
import { sfxSynth } from '../../services/soundEffects';
import { AutoCutModal, AutoCutResult } from '../autocut/AutoCutModal';
import { SettingsModal } from '../settings/SettingsModal';
import { ClipInspector, ClipProperties } from './ClipInspector';
import { ExportModal } from './ExportModal';
import { EditorPanelsDock, TopLevelPanelId } from './EditorPanelsDock';
import { useIsMobile, useViewport } from '../../hooks/useIsMobile';
import { PartialEditModal } from './PartialEditModal';
import { VersionHistoryModal, TimelineSnapshot } from './VersionHistoryModal';
import { RegenerateModal } from './RegenerateModal';


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
  const viewport = useViewport();
  const isLandscape = viewport.isLandscape;
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '4:5' | '3:4'>('9:16');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showRatioGuides, setShowRatioGuides] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-v1');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // CapCut 12-Panel Dock and Preview Tools States
  const [activePanel, setActivePanel] = useState<TopLevelPanelId | null>(isMobile ? null : 'media');
  const [isPanelsDockOpen, setIsPanelsDockOpen] = useState(true);
  const [previewTool, setPreviewTool] = useState<'pointer' | 'hand'>('pointer');
  const [aiCredits, setAiCredits] = useState<number>(50);
  const [brandWatermark, setBrandWatermark] = useState<string | null>(null);

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
    'clip-s3': getDefaultProperties('sfx', 'Bass Drop'),
    'clip-m1': getDefaultProperties('audio', 'Background Rhythm')
  });

  const [musicClips, setMusicClips] = useState<Clip[]>([
    { id: 'clip-m1', type: 'audio', title: 'Background Rhythm', start: 0, end: 18.0 }
  ]);

  // AI Cut Banner and Version States
  const [showAiBanner, setShowAiBanner] = useState<boolean>(Boolean(initialAutoCutResult));
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [originalVideoDuration, setOriginalVideoDuration] = useState<number>(18.0);
  const [aiVersionSnapshot, setAiVersionSnapshot] = useState<TimelineSnapshot | null>(null);
  const [historySnapshots, setHistorySnapshots] = useState<TimelineSnapshot[]>([]);
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string | null>(null);

  // Modals for Partial Edit, Version History, Regenerate, Quick Fix
  const [isPartialEditOpen, setIsPartialEditOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [isQuickFixMenuOpen, setIsQuickFixMenuOpen] = useState(false);

  // Timeline resize drag state
  const [resizing, setResizing] = useState<{
    clipId: string;
    edge: 'left' | 'right';
    initialX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  const totalDuration = isComparingOriginal
    ? originalVideoDuration
    : Math.max(
        ...videoClips.map((c) => c.end),
        ...textClips.map((c) => c.end),
        ...sfxClips.map((c) => c.end),
        ...musicClips.map((c) => c.end),
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
  const allClips = [...videoClips, ...textClips, ...sfxClips, ...musicClips];
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
            triggeredSFXRef.current.clear();
            if (isLooping) {
              return 0;
            }
            setIsPlaying(false);
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
  }, [isPlaying, totalDuration, sfxClips, activeVideoProps, isLooping]);

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
      if (resizing) {
        saveSnapshot('Trim Clip Bounds');
      }
      setResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, zoom]);

  const saveSnapshot = (
    label: string,
    override?: {
      video?: Clip[];
      text?: Clip[];
      sfx?: Clip[];
      music?: Clip[];
      props?: Record<string, ClipProperties>;
      aspect?: '9:16' | '16:9' | '1:1' | '4:5' | '3:4';
    }
  ) => {
    const v = override?.video ?? videoClips;
    const t = override?.text ?? textClips;
    const s = override?.sfx ?? sfxClips;
    const m = override?.music ?? musicClips;
    const p = override?.props ?? clipPropsMap;
    const a = override?.aspect ?? aspectRatio;

    const snap: TimelineSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      videoClips: JSON.parse(JSON.stringify(v)),
      textClips: JSON.parse(JSON.stringify(t)),
      sfxClips: JSON.parse(JSON.stringify(s)),
      musicClips: JSON.parse(JSON.stringify(m)),
      clipPropsMap: JSON.parse(JSON.stringify(p)),
      aspectRatio: a
    };

    setHistorySnapshots((prev) => [snap, ...prev].slice(0, 50));
    setCurrentSnapshotId(snap.id);
    return snap;
  };

  const updateClipBounds = (clipId: string, newStart: number, newEnd: number) => {
    setVideoClips((prev) => prev.map((c) => c.id === clipId ? { ...c, start: newStart, end: newEnd } : c));
    setTextClips((prev) => prev.map((c) => c.id === clipId ? { ...c, start: newStart, end: newEnd } : c));
    setSfxClips((prev) => prev.map((c) => c.id === clipId ? { ...c, start: newStart, end: newEnd } : c));
    setMusicClips((prev) => prev.map((c) => c.id === clipId ? { ...c, start: newStart, end: newEnd } : c));
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
        setOriginalVideoDuration(dur);
        const newClipId = `clip-v-imported-${Date.now()}`;
        const newVClips: Clip[] = [
          { id: newClipId, type: 'video', title: file.name, start: 0, end: dur }
        ];
        const newProps = {
          [newClipId]: getDefaultProperties('video', file.name)
        };
        setVideoClips(newVClips);
        setClipPropsMap((prev) => ({
          ...prev,
          ...newProps
        }));
        setSelectedClipId(newClipId);
        setCurrentTime(0);
        saveSnapshot(`Import Video: ${file.name}`, { video: newVClips, props: { ...clipPropsMap, ...newProps } });
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

    const updatedClips = videoClips
      .filter((c) => c.id !== activeVideoClip.id)
      .concat([first, second])
      .sort((a, b) => a.start - b.start);

    const updatedProps = {
      ...clipPropsMap,
      [firstId]: { ...existingProps },
      [secondId]: { ...existingProps }
    };

    setVideoClips(updatedClips);
    setClipPropsMap(updatedProps);
    setSelectedClipId(second.id);
    saveSnapshot('Split Clip', { video: updatedClips, props: updatedProps });
  };

  // Trim Left of selected clip to current playhead
  const handleTrimLeft = () => {
    if (!selectedClip) return;
    if (currentTime <= selectedClip.start || currentTime >= selectedClip.end) return;
    updateClipBounds(selectedClip.id, currentTime, selectedClip.end);
    saveSnapshot(`Trim Left (${selectedClip.title})`);
  };

  // Trim Right of selected clip to current playhead
  const handleTrimRight = () => {
    if (!selectedClip) return;
    if (currentTime <= selectedClip.start || currentTime >= selectedClip.end) return;
    updateClipBounds(selectedClip.id, selectedClip.start, currentTime);
    saveSnapshot(`Trim Right (${selectedClip.title})`);
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

    let updatedVideo = videoClips;
    let updatedText = textClips;
    let updatedSfx = sfxClips;
    let updatedMusic = musicClips;

    if (selectedClip.type === 'video') {
      updatedVideo = [...videoClips, newClip];
      setVideoClips(updatedVideo);
    } else if (selectedClip.type === 'text') {
      updatedText = [...textClips, newClip];
      setTextClips(updatedText);
    } else if (selectedClip.type === 'sfx') {
      updatedSfx = [...sfxClips, newClip];
      setSfxClips(updatedSfx);
    } else if (selectedClip.type === 'audio') {
      updatedMusic = [...musicClips, newClip];
      setMusicClips(updatedMusic);
    }

    const updatedProps = { ...clipPropsMap };
    if (clipPropsMap[selectedClip.id]) {
      updatedProps[newId] = { ...clipPropsMap[selectedClip.id] };
      setClipPropsMap(updatedProps);
    }
    setSelectedClipId(newId);
    saveSnapshot(`Duplicate ${selectedClip.type} Clip`, {
      video: updatedVideo,
      text: updatedText,
      sfx: updatedSfx,
      music: updatedMusic,
      props: updatedProps
    });
  };

  // Delete selected clip
  const handleDelete = () => {
    if (!selectedClipId) return;
    const updatedVideo = videoClips.filter((c) => c.id !== selectedClipId);
    const updatedText = textClips.filter((c) => c.id !== selectedClipId);
    const updatedSfx = sfxClips.filter((c) => c.id !== selectedClipId);
    const updatedMusic = musicClips.filter((c) => c.id !== selectedClipId);

    setVideoClips(updatedVideo);
    setTextClips(updatedText);
    setSfxClips(updatedSfx);
    setMusicClips(updatedMusic);
    setSelectedClipId(null);
    saveSnapshot('Delete Clip', {
      video: updatedVideo,
      text: updatedText,
      sfx: updatedSfx,
      music: updatedMusic
    });
  };

  // Ripple Delete
  const handleRippleDelete = () => {
    if (!selectedClip) return;
    const dur = selectedClip.end - selectedClip.start;
    const clipStart = selectedClip.start;

    let updatedVideo = videoClips;
    let updatedText = textClips;
    let updatedSfx = sfxClips;
    let updatedMusic = musicClips;

    if (selectedClip.type === 'video') {
      updatedVideo = videoClips
        .filter((c) => c.id !== selectedClip.id)
        .map((c) => c.start > clipStart ? { ...c, start: Math.max(0, c.start - dur), end: Math.max(0.3, c.end - dur) } : c);
      setVideoClips(updatedVideo);
    } else if (selectedClip.type === 'text') {
      updatedText = textClips
        .filter((c) => c.id !== selectedClip.id)
        .map((c) => c.start > clipStart ? { ...c, start: Math.max(0, c.start - dur), end: Math.max(0.3, c.end - dur) } : c);
      setTextClips(updatedText);
    } else if (selectedClip.type === 'sfx') {
      updatedSfx = sfxClips
        .filter((c) => c.id !== selectedClip.id)
        .map((c) => c.start > clipStart ? { ...c, start: Math.max(0, c.start - dur), end: Math.max(0.3, c.end - dur) } : c);
      setSfxClips(updatedSfx);
    } else {
      updatedMusic = musicClips
        .filter((c) => c.id !== selectedClip.id)
        .map((c) => c.start > clipStart ? { ...c, start: Math.max(0, c.start - dur), end: Math.max(0.3, c.end - dur) } : c);
      setMusicClips(updatedMusic);
    }

    setSelectedClipId(null);
    saveSnapshot('Ripple Delete', {
      video: updatedVideo,
      text: updatedText,
      sfx: updatedSfx,
      music: updatedMusic
    });
  };

  const handleToggleFullscreen = () => {
    const previewContainer = document.getElementById('sabycut-preview-container');
    if (!previewContainer) return;
    if (!document.fullscreenElement) {
      previewContainer.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
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
    const updatedText = [...textClips, newTextClip];
    const updatedProps = {
      ...clipPropsMap,
      [newId]: getDefaultProperties('text', 'Khmer Caption', 'ចំណងជើងខ្មែរថ្មី')
    };
    setTextClips(updatedText);
    setClipPropsMap(updatedProps);
    setSelectedClipId(newId);
    setIsInspectorOpen(true);
    saveSnapshot('Add Khmer Text', { text: updatedText, props: updatedProps });
  };

  // Add SFX clip
  const handleAddSFX = (type: 'whoosh' | 'ding' | 'pop' | 'hit' | 'riser' | 'impact') => {
    const duration = type === 'riser' || type === 'impact' ? 1.5 : type === 'ding' ? 1.0 : 0.5;
    const newId = `clip-s-${Date.now()}`;
    const newClip: Clip = {
      id: newId,
      type: 'sfx',
      title: type.toUpperCase(),
      sfxType: type,
      start: currentTime,
      end: currentTime + duration
    };
    const updatedSfx = [...sfxClips, newClip];
    const updatedProps = {
      ...clipPropsMap,
      [newId]: getDefaultProperties('sfx', type.toUpperCase())
    };
    setSfxClips(updatedSfx);
    setClipPropsMap(updatedProps);
    setSelectedClipId(newId);
    sfxSynth.playByType(type);
    saveSnapshot(`Add SFX: ${type.toUpperCase()}`, { sfx: updatedSfx, props: updatedProps });
  };

  // Add Music Track
  const handleAddMusic = () => {
    const newId = `clip-m-${Date.now()}`;
    const newClip: Clip = {
      id: newId,
      type: 'audio',
      title: 'Soundtrack Track',
      start: currentTime,
      end: Math.min(currentTime + 15.0, totalDuration)
    };
    const updatedMusic = [...musicClips, newClip];
    const updatedProps = {
      ...clipPropsMap,
      [newId]: getDefaultProperties('audio', 'Soundtrack Track')
    };
    setMusicClips(updatedMusic);
    setClipPropsMap(updatedProps);
    setSelectedClipId(newId);
    saveSnapshot('Add Music Track', { music: updatedMusic, props: updatedProps });
  };

  // Picture in Picture Toggle (AUD-046)
  const handleTogglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('Picture in Picture failed:', e);
    }
  };

  // EditorPanelsDock Handlers
  const handleAddMediaFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const newId = `clip-v-${Date.now()}`;
    setVideoSrc(url);
    const newClip: Clip = {
      id: newId,
      type: 'video',
      title: file.name.replace(/\.[^/.]+$/, ''),
      start: currentTime,
      end: currentTime + 5.0
    };
    const updated = [...videoClips, newClip];
    const updatedProps = {
      ...clipPropsMap,
      [newId]: getDefaultProperties('video', newClip.title)
    };
    setVideoClips(updated);
    setClipPropsMap(updatedProps);
    setSelectedClipId(newId);
    saveSnapshot(`Add Media: ${newClip.title}`, { video: updated, props: updatedProps });
  };

  const handleAddTextClipFromDock = (text: string, stylePreset?: string) => {
    const newId = `clip-t-${Date.now()}`;
    const newClip: Clip = {
      id: newId,
      type: 'text',
      title: 'Khmer Text',
      start: currentTime,
      end: currentTime + 3.0,
      text: text
    };
    const props = getDefaultProperties('text', 'Khmer Text', text);
    if (stylePreset === 'neon') {
      props.color = '#38bdf8';
      props.shadowColor = '#0284c7';
      props.shadowBlur = 15;
    } else if (stylePreset === 'gold') {
      props.color = '#fbbf24';
      props.strokeColor = '#78350f';
      props.strokeWidth = 2;
    }
    const updatedText = [...textClips, newClip];
    const updatedProps = { ...clipPropsMap, [newId]: props };
    setTextClips(updatedText);
    setClipPropsMap(updatedProps);
    setSelectedClipId(newId);
    saveSnapshot('Add Text from Dock', { text: updatedText, props: updatedProps });
  };

  const handleAddSfxClipFromDock = (type: string, title: string) => {
    const newId = `clip-s-${Date.now()}`;
    const newClip: Clip = {
      id: newId,
      type: 'sfx',
      title: title,
      start: currentTime,
      end: currentTime + 1.0,
      sfxType: type
    };
    const updated = [...sfxClips, newClip];
    const updatedProps = {
      ...clipPropsMap,
      [newId]: getDefaultProperties('sfx', title)
    };
    setSfxClips(updated);
    setClipPropsMap(updatedProps);
    setSelectedClipId(newId);
    sfxSynth.playByType(type as any);
    saveSnapshot(`Add SFX: ${title}`, { sfx: updated, props: updatedProps });
  };

  const handleAddMusicClipFromDock = (title: string) => {
    const newId = `clip-m-${Date.now()}`;
    const newClip: Clip = {
      id: newId,
      type: 'audio',
      title: title,
      start: 0,
      end: totalDuration
    };
    const updated = [newClip];
    const updatedProps = {
      ...clipPropsMap,
      [newId]: getDefaultProperties('audio', title)
    };
    setMusicClips(updated);
    setClipPropsMap(updatedProps);
    saveSnapshot(`Set Music: ${title}`, { music: updated, props: updatedProps });
  };

  const handleApplyFilterFromDock = (filterName: string) => {
    if (!selectedClipId) return;
    setClipPropsMap((prev) => ({
      ...prev,
      [selectedClipId]: {
        ...(prev[selectedClipId] || getDefaultProperties('video')),
        filterPreset: filterName
      }
    }));
  };

  const handleApplyTransitionFromDock = (transitionName: string) => {
    if (!selectedClipId) return;
    setClipPropsMap((prev) => ({
      ...prev,
      [selectedClipId]: {
        ...(prev[selectedClipId] || getDefaultProperties('video')),
        transitionType: transitionName
      }
    }));
  };

  const handleApplyEffectFromDock = (effectName: string) => {
    if (!selectedClipId) return;
    setClipPropsMap((prev) => ({
      ...prev,
      [selectedClipId]: {
        ...(prev[selectedClipId] || getDefaultProperties('video')),
        filterPreset: effectName
      }
    }));
  };

  const handleImportSubtitleFromDock = (subtitles: Array<{ start: number; end: number; text: string }>) => {
    const imported: Clip[] = subtitles.map((s, idx) => ({
      id: `clip-srt-${Date.now()}-${idx}`,
      type: 'text',
      title: `Sub ${idx + 1}`,
      start: s.start,
      end: s.end,
      text: s.text
    }));
    const updatedText = [...textClips, ...imported];
    const updatedProps = { ...clipPropsMap };
    imported.forEach((c) => {
      updatedProps[c.id] = getDefaultProperties('text', c.title, c.text);
    });
    setTextClips(updatedText);
    setClipPropsMap(updatedProps);
    saveSnapshot('Import Subtitles', { text: updatedText, props: updatedProps });
  };

  const handleLoadTemplateFromDock = (templateId: string) => {
    const tId = Date.now();
    const newClips: Clip[] = [
      { id: `tmpl-v1-${tId}`, type: 'video', title: 'Template Intro', start: 0, end: 3.5 },
      { id: `tmpl-v2-${tId}`, type: 'video', title: 'Template Body', start: 3.5, end: 8.5 },
      { id: `tmpl-v3-${tId}`, type: 'video', title: 'Template Outro', start: 8.5, end: 12.0 }
    ];
    const newTexts: Clip[] = [
      { id: `tmpl-t1-${tId}`, type: 'text', title: 'Template Title', start: 0.5, end: 4.0, text: 'ចំណងជើងទម្រង់គំរូ' }
    ];
    setVideoClips(newClips);
    setTextClips(newTexts);
    const updatedProps = { ...clipPropsMap };
    newClips.forEach((c) => {
      updatedProps[c.id] = getDefaultProperties('video', c.title);
    });
    newTexts.forEach((c) => {
      updatedProps[c.id] = getDefaultProperties('text', c.title, c.text);
    });
    setClipPropsMap(updatedProps);
    saveSnapshot(`Load Template: ${templateId}`, { video: newClips, text: newTexts, props: updatedProps });
  };

  // Revert to initial AI version
  const handleRevertToAi = () => {
    if (!aiVersionSnapshot) return;
    setVideoClips(JSON.parse(JSON.stringify(aiVersionSnapshot.videoClips)));
    setTextClips(JSON.parse(JSON.stringify(aiVersionSnapshot.textClips)));
    setSfxClips(JSON.parse(JSON.stringify(aiVersionSnapshot.sfxClips)));
    if (aiVersionSnapshot.musicClips) {
      setMusicClips(JSON.parse(JSON.stringify(aiVersionSnapshot.musicClips)));
    }
    setClipPropsMap(JSON.parse(JSON.stringify(aiVersionSnapshot.clipPropsMap)));
    setAspectRatio(aiVersionSnapshot.aspectRatio);
    setCurrentSnapshotId(aiVersionSnapshot.id);
    setIsComparingOriginal(false);
    saveSnapshot('Reverted to AI Version', {
      video: aiVersionSnapshot.videoClips,
      text: aiVersionSnapshot.textClips,
      sfx: aiVersionSnapshot.sfxClips,
      music: aiVersionSnapshot.musicClips,
      props: aiVersionSnapshot.clipPropsMap,
      aspect: aiVersionSnapshot.aspectRatio
    });
  };

  // Restore snapshot from version history modal
  const handleRestoreSnapshot = (snap: TimelineSnapshot) => {
    setVideoClips(JSON.parse(JSON.stringify(snap.videoClips)));
    setTextClips(JSON.parse(JSON.stringify(snap.textClips)));
    setSfxClips(JSON.parse(JSON.stringify(snap.sfxClips)));
    if (snap.musicClips) {
      setMusicClips(JSON.parse(JSON.stringify(snap.musicClips)));
    }
    setClipPropsMap(JSON.parse(JSON.stringify(snap.clipPropsMap)));
    setAspectRatio(snap.aspectRatio);
    setCurrentSnapshotId(snap.id);
    setIsComparingOriginal(false);
    setIsVersionHistoryOpen(false);
  };

  // Apply partial edit on selected clip or range
  const handleApplyPartialEdit = (clipId: string, instruction: string) => {
    const targetClip = allClips.find((c) => c.id === clipId);
    if (!targetClip) return;

    const lower = instruction.toLowerCase();

    if (lower.includes('fast') || lower.includes('speed') || lower.includes('quick')) {
      const newSpeed = 1.5;
      const oldDur = targetClip.end - targetClip.start;
      const newDur = Math.max(0.4, Number((oldDur / 1.5).toFixed(2)));
      const newEnd = Number((targetClip.start + newDur).toFixed(2));

      const updatedClips = videoClips.map((c) => c.id === clipId ? { ...c, end: newEnd } : c);
      const updatedProps = {
        ...clipPropsMap,
        [clipId]: {
          ...(clipPropsMap[clipId] || getDefaultProperties(targetClip.type, targetClip.title)),
          speed: newSpeed
        }
      };
      setVideoClips(updatedClips);
      setClipPropsMap(updatedProps);
      saveSnapshot(`Partial AI: 1.5x Speed on ${targetClip.title}`, { video: updatedClips, props: updatedProps });
    } else if (lower.includes('slow') || lower.includes('dramatic')) {
      const newSpeed = 0.75;
      const oldDur = targetClip.end - targetClip.start;
      const newDur = Number((oldDur * 1.33).toFixed(2));
      const newEnd = Number((targetClip.start + newDur).toFixed(2));

      const updatedClips = videoClips.map((c) => c.id === clipId ? { ...c, end: newEnd } : c);
      const updatedProps = {
        ...clipPropsMap,
        [clipId]: {
          ...(clipPropsMap[clipId] || getDefaultProperties(targetClip.type, targetClip.title)),
          speed: newSpeed
        }
      };
      setVideoClips(updatedClips);
      setClipPropsMap(updatedProps);
      saveSnapshot(`Partial AI: Slow motion on ${targetClip.title}`, { video: updatedClips, props: updatedProps });
    } else if (lower.includes('silence') || lower.includes('trim')) {
      const dur = targetClip.end - targetClip.start;
      const trimAmount = Number((dur * 0.15).toFixed(2));
      const newStart = Number((targetClip.start + trimAmount).toFixed(2));
      const newEnd = Number((targetClip.end - trimAmount).toFixed(2));
      const updatedClips = videoClips.map((c) => c.id === clipId ? { ...c, start: newStart, end: newEnd } : c);
      setVideoClips(updatedClips);
      saveSnapshot(`Partial AI: Remove silence from ${targetClip.title}`, { video: updatedClips });
    } else if (lower.includes('caption') || lower.includes('text') || lower.includes('khmer')) {
      const newCapId = `clip-t-partial-${Date.now()}`;
      const newCap: Clip = {
        id: newCapId,
        type: 'text',
        title: 'AI Caption',
        start: targetClip.start,
        end: targetClip.end,
        text: 'ប្លង់សំខាន់នៃវីដេអូ'
      };
      const updatedText = [...textClips, newCap];
      const updatedProps = {
        ...clipPropsMap,
        [newCapId]: getDefaultProperties('text', 'AI Caption', 'ប្លង់សំខាន់នៃវីដេអូ')
      };
      setTextClips(updatedText);
      setClipPropsMap(updatedProps);
      setSelectedClipId(newCapId);
      saveSnapshot(`Partial AI: Add Khmer caption to ${targetClip.title}`, { text: updatedText, props: updatedProps });
    } else {
      const updatedProps = {
        ...clipPropsMap,
        [clipId]: {
          ...(clipPropsMap[clipId] || getDefaultProperties(targetClip.type, targetClip.title)),
          saturation: 20,
          contrast: 15
        }
      };
      setClipPropsMap(updatedProps);
      saveSnapshot(`Partial AI: Enhance ${targetClip.title}`, { props: updatedProps });
    }
  };

  // Quick Fix Tools
  const handleQuickFix = (fixType: 'silence' | 'captions' | 'sfx' | 'music' | 'pacing' | 'aspect') => {
    setIsQuickFixMenuOpen(false);
    switch (fixType) {
      case 'silence': {
        let currentPos = 0;
        const newVideoClips: Clip[] = [];
        for (const c of videoClips) {
          const originalDur = c.end - c.start;
          const trimmedDur = Math.max(0.6, Number((originalDur * 0.85).toFixed(2)));
          newVideoClips.push({
            ...c,
            start: Number(currentPos.toFixed(2)),
            end: Number((currentPos + trimmedDur).toFixed(2))
          });
          currentPos += trimmedDur;
        }
        setVideoClips(newVideoClips);
        saveSnapshot('Quick Fix: Remove Silence', { video: newVideoClips });
        break;
      }
      case 'captions': {
        const newProps = { ...clipPropsMap };
        textClips.forEach((t) => {
          newProps[t.id] = {
            ...(newProps[t.id] || getDefaultProperties('text', t.title, t.text)),
            fontFamily: 'Noto Sans Khmer',
            fontSize: 22,
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            strokeWidth: 2,
            strokeColor: '#000000'
          };
        });
        setClipPropsMap(newProps);
        saveSnapshot('Quick Fix: Standardize Khmer Captions', { props: newProps });
        break;
      }
      case 'sfx': {
        const sfxCycle: Record<string, 'whoosh' | 'ding' | 'pop' | 'hit' | 'riser' | 'impact'> = {
          whoosh: 'pop',
          pop: 'hit',
          hit: 'ding',
          ding: 'riser',
          riser: 'impact',
          impact: 'whoosh'
        };
        const newSfxClips = sfxClips.map((s) => {
          const currentType = (s.sfxType || 'whoosh') as keyof typeof sfxCycle;
          const nextType = sfxCycle[currentType] || 'whoosh';
          return {
            ...s,
            title: nextType.toUpperCase(),
            sfxType: nextType
          };
        });
        setSfxClips(newSfxClips);
        sfxSynth.playByType('ding');
        saveSnapshot('Quick Fix: Swapped SFX Types', { sfx: newSfxClips });
        break;
      }
      case 'music': {
        const titles = ['Energetic Beat', 'Lofi Ambient Groove', 'Cinematic Pulse', 'Background Rhythm'];
        const newMusic = musicClips.map((m) => {
          const currentIndex = titles.indexOf(m.title);
          const nextTitle = titles[(currentIndex + 1) % titles.length] || 'Dynamic Rhythm';
          return {
            ...m,
            title: nextTitle
          };
        });
        setMusicClips(newMusic);
        saveSnapshot('Quick Fix: Change Music Track', { music: newMusic });
        break;
      }
      case 'pacing': {
        const newProps = { ...clipPropsMap };
        videoClips.forEach((v) => {
          const curSpeed = newProps[v.id]?.speed || 1.0;
          const nextSpeed = curSpeed === 1.0 ? 1.25 : curSpeed === 1.25 ? 1.5 : 1.0;
          newProps[v.id] = {
            ...(newProps[v.id] || getDefaultProperties('video', v.title)),
            speed: nextSpeed
          };
        });
        setClipPropsMap(newProps);
        saveSnapshot('Quick Fix: Change Pacing', { props: newProps });
        break;
      }
      case 'aspect': {
        const nextAspect = aspectRatio === '9:16' ? '16:9' : aspectRatio === '16:9' ? '1:1' : '9:16';
        setAspectRatio(nextAspect);
        saveSnapshot(`Quick Fix: Change Aspect Ratio (${nextAspect})`, { aspect: nextAspect });
        break;
      }
    }
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
    if (res.videoDuration) {
      setOriginalVideoDuration(res.videoDuration);
    }
    if (res.aspectRatio) {
      setAspectRatio(res.aspectRatio);
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
      title: s.title || s.type.toUpperCase(),
      sfxType: s.type,
      start: s.time,
      end: s.time + (s.type === 'riser' || s.type === 'impact' ? 1.5 : 0.6)
    }));

    const newText: Clip[] = res.captions.map((cap, idx) => ({
      id: `ai-t-${idx + 1}`,
      type: 'text',
      title: cap.title || `Caption ${idx + 1}`,
      start: cap.start,
      end: cap.end,
      text: cap.text
    }));

    const totalDur = Math.max(
      ...newVideo.map((c) => c.end),
      res.videoDuration || 18
    );

    const newMusic: Clip[] = [
      { id: 'ai-m-1', type: 'audio', title: 'Background Score', start: 0, end: totalDur }
    ];

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
    newMusic.forEach((m) => {
      newPropsMap[m.id] = getDefaultProperties('audio', m.title);
    });

    setVideoClips(newVideo);
    setSfxClips(newSfx);
    setTextClips(newText);
    setMusicClips(newMusic);
    setClipPropsMap(newPropsMap);

    const initialAiSnap: TimelineSnapshot = {
      id: `ai-initial-${Date.now()}`,
      label: 'Initial AI Auto Cut',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      videoClips: newVideo,
      textClips: newText,
      sfxClips: newSfx,
      musicClips: newMusic,
      clipPropsMap: newPropsMap,
      aspectRatio: res.aspectRatio || aspectRatio
    };

    setAiVersionSnapshot(initialAiSnap);
    setHistorySnapshots([initialAiSnap]);
    setCurrentSnapshotId(initialAiSnap.id);
    setShowAiBanner(true);
    setIsComparingOriginal(false);

    if (newVideo.length > 0) {
      setSelectedClipId(newVideo[0].id);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'var(--app-height, 100dvh)', width: '100%', backgroundColor: '#0a0b10', overflow: 'hidden' }}>
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
        paddingTop: isMobile ? 'max(var(--sat, 0px), 8px)' : 'max(var(--sat, 0px), 6px)',
        paddingBottom: '8px',
        paddingLeft: 'max(var(--sal, 0px), 12px)',
        paddingRight: 'max(var(--sar, 0px), 12px)',
        backgroundColor: '#12141c',
        borderBottom: '1px solid #232738',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
        flexShrink: 0
      }}>
        {isMobile ? (
          <>
            {/* Mobile Header: Left (Back), Center (Aspect ratio), Right (AutoCut & Export) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={onBack}
                style={{
                  padding: '6px',
                  minWidth: '44px',
                  minHeight: '44px',
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
                <ArrowLeft size={18} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                SABYCUT
              </span>
            </div>

            {/* Center: Aspect Ratio Pill */}
            <div style={{ display: 'flex', gap: '2px', backgroundColor: '#1a1d2b', padding: '2px', borderRadius: '6px' }}>
              {(['9:16', '16:9', '1:1', '4:5', '3:4'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  style={{
                    padding: '6px 8px',
                    minWidth: '38px',
                    minHeight: '38px',
                    borderRadius: '4px',
                    backgroundColor: aspectRatio === r ? '#4f46e5' : 'transparent',
                    color: aspectRatio === r ? '#ffffff' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  color: '#c4b5fd',
                  fontSize: '11px',
                  fontWeight: 700
                }}
                title="AI Auto Cut"
              >
                <Sparkles size={14} />
                <span>AI</span>
              </button>

              <button
                data-testid="export-modal-trigger-btn"
                onClick={() => setIsExportOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  minHeight: '44px',
                  borderRadius: '6px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <Download size={15} />
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
                Studio Mode
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

              {/* Frame Step Back */}
              <button
                onClick={() => setCurrentTime((p) => Math.max(0, p - 1/30))}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#1a1d2b',
                  border: '1px solid #282d3f',
                  color: '#cbd5e1'
                }}
                title={t('editor.frameStepBack', 'Step Backward')}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Frame Step Forward */}
              <button
                onClick={() => setCurrentTime((p) => Math.min(totalDuration, p + 1/30))}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#1a1d2b',
                  border: '1px solid #282d3f',
                  color: '#cbd5e1'
                }}
                title={t('editor.frameStepFwd', 'Step Forward')}
              >
                <ChevronRight size={14} />
              </button>

              {/* Loop Toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: isLooping ? 'rgba(16, 185, 129, 0.2)' : '#1a1d2b',
                  border: isLooping ? '1px solid #10b981' : '1px solid #282d3f',
                  color: isLooping ? '#10b981' : '#cbd5e1'
                }}
                title={t('editor.loop', 'Loop Playback')}
              >
                <RefreshCw size={14} />
              </button>

              {/* Ratio Guides Toggle */}
              <button
                onClick={() => setShowRatioGuides(!showRatioGuides)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: showRatioGuides ? 'rgba(99, 102, 241, 0.2)' : '#1a1d2b',
                  border: showRatioGuides ? '1px solid #818cf8' : '1px solid #282d3f',
                  color: showRatioGuides ? '#818cf8' : '#cbd5e1'
                }}
                title="Ratio Guides"
              >
                <Eye size={14} />
              </button>

              {/* Fullscreen Preview */}
              <button
                onClick={handleToggleFullscreen}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: isFullscreen ? 'rgba(99, 102, 241, 0.2)' : '#1a1d2b',
                  border: isFullscreen ? '1px solid #818cf8' : '1px solid #282d3f',
                  color: isFullscreen ? '#818cf8' : '#cbd5e1'
                }}
                title={t('editor.fullscreen', 'Fullscreen')}
              >
                <Maximize2 size={14} />
              </button>

              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#818cf8', marginLeft: '6px' }}>
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>

              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1a1d2b', padding: '3px', borderRadius: '6px', marginLeft: '6px' }}>
                {(['9:16', '16:9', '1:1', '4:5', '3:4'] as const).map((r) => (
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

              {/* CapCut AI Generation Credit Counter (AUD-103) */}
              <div
                data-testid="ai-credit-counter"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#a5b4fc',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                <Sparkles size={13} color="#818cf8" />
                <span>{aiCredits} {t('preview.credits', 'Credits')}</span>
              </div>

              <button
                onClick={() => setIsPanelsDockOpen(!isPanelsDockOpen)}
                data-testid="toggle-panels-dock-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: isPanelsDockOpen ? 'rgba(99, 102, 241, 0.2)' : '#1a1d2b',
                  border: isPanelsDockOpen ? '1px solid #818cf8' : '1px solid #292e44',
                  color: isPanelsDockOpen ? '#818cf8' : '#cbd5e1',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Toggle Panels Dock"
              >
                <FolderPlus size={14} />
                <span>Panels</span>
              </button>

              <button
                data-testid="export-modal-trigger-btn"
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

      {/* AI Cut Notification Banner */}
      {showAiBanner && (
        <div style={{
          backgroundColor: '#161426',
          borderBottom: '1px solid #382d56',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          zIndex: 15
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={15} color="#c084fc" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f3e8ff' }}>
                {t('autocut.bannerTitle')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsRegenerateOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: '#29213d',
                border: '1px solid #4a386c',
                color: '#e9d5ff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} />
              <span>{t('autocut.regenerate')}</span>
            </button>

            <button
              onClick={() => setIsComparingOriginal(!isComparingOriginal)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: isComparingOriginal ? '#4338ca' : '#1e2436',
                border: isComparingOriginal ? '1px solid #818cf8' : '1px solid #2e3954',
                color: isComparingOriginal ? '#ffffff' : '#93c5fd',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isComparingOriginal ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{isComparingOriginal ? 'Stop Compare' : t('autocut.compareOriginal')}</span>
            </button>

            <button
              onClick={handleRevertToAi}
              disabled={!aiVersionSnapshot}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: '#1b2420',
                border: '1px solid #28543b',
                color: '#86efac',
                fontSize: '11px',
                fontWeight: 600,
                cursor: aiVersionSnapshot ? 'pointer' : 'not-allowed',
                opacity: aiVersionSnapshot ? 1 : 0.5
              }}
            >
              <RotateCcw size={13} />
              <span>{t('autocut.revertAi')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Center Area: Player Viewport + Clip Inspector */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile && !isLandscape ? 'column' : 'row',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* CapCut-style 12-Panel Dock */}
        <EditorPanelsDock
          isOpen={isPanelsDockOpen}
          activePanel={activePanel}
          onSelectPanel={setActivePanel}
          onAddMediaFile={handleAddMediaFile}
          onAddTextClip={handleAddTextClipFromDock}
          onAddSfxClip={handleAddSfxClipFromDock}
          onAddMusicClip={handleAddMusicClipFromDock}
          onApplyEffect={handleApplyEffectFromDock}
          onApplyFilter={handleApplyFilterFromDock}
          onApplyTransition={handleApplyTransitionFromDock}
          onLoadTemplate={handleLoadTemplateFromDock}
          onImportSubtitle={handleImportSubtitleFromDock}
          onTranscriptCut={() => handleSplit()}
          onWatermarkUpdate={setBrandWatermark}
          transcriptWords={[
            { word: 'ស្វាគមន៍', start: 0.5, end: 1.2 },
            { word: 'មកកាន់', start: 1.2, end: 2.0 },
            { word: 'SABYCUT', start: 2.0, end: 3.5 },
            { word: 'កាត់ត', start: 5.0, end: 6.2 },
            { word: 'វីដេអូ', start: 6.2, end: 7.5 },
            { word: 'AI', start: 7.5, end: 8.5 }
          ]}
        />

        {/* Center Viewport Preview */}
        <div style={{
          flex: 1,
          backgroundColor: '#07080c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '8px',
          minHeight: 0
        }}>
          {/* Comparison Mode Watermark / Overlay */}
          {isComparingOriginal && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 35,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
            }}>
              <Eye size={14} />
              <span>COMPARING: Original Footage (Uncut)</span>
            </div>
          )}
          {/* Canvas Player Box */}
          <div
            id="sabycut-preview-container"
            style={{
              width: aspectRatio === '9:16' ? (isMobile ? (isLandscape ? '140px' : '180px') : '280px') : aspectRatio === '16:9' ? (isMobile ? (isLandscape ? '240px' : '310px') : '540px') : aspectRatio === '4:5' ? (isMobile ? (isLandscape ? '160px' : '200px') : '320px') : aspectRatio === '3:4' ? (isMobile ? (isLandscape ? '165px' : '210px') : '330px') : (isMobile ? (isLandscape ? '170px' : '230px') : '360px'),
              height: aspectRatio === '9:16' ? (isMobile ? (isLandscape ? '248px' : '320px') : '498px') : aspectRatio === '16:9' ? (isMobile ? (isLandscape ? '135px' : '174px') : '304px') : aspectRatio === '4:5' ? (isMobile ? (isLandscape ? '200px' : '250px') : '400px') : aspectRatio === '3:4' ? (isMobile ? (isLandscape ? '220px' : '280px') : '440px') : (isMobile ? (isLandscape ? '170px' : '230px') : '360px'),
              maxHeight: isMobile ? (isLandscape ? '46vh' : '38vh') : 'none',
              maxWidth: isMobile ? (isLandscape ? '45vw' : '92vw') : 'none',
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
            }}
          >
            {/* Ratio Guides Overlay */}
            {showRatioGuides && (
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 15,
                border: '1px dashed rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div style={{ position: 'absolute', top: '50%', left: '46%', width: '8%', height: '1px', backgroundColor: 'rgba(99, 102, 241, 0.8)' }} />
                <div style={{ position: 'absolute', left: '50%', top: '46%', height: '8%', width: '1px', backgroundColor: 'rgba(99, 102, 241, 0.8)' }} />
                <div style={{
                  position: 'absolute',
                  inset: '10%',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  borderRadius: '4px'
                }} />
              </div>
            )}

            {/* In-Canvas Floating Context Action Bar (AUD-042) */}
            {selectedClip && (
              <div
                data-testid="canvas-floating-context-bar"
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 25,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(18, 20, 29, 0.92)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                }}
              >
                <button
                  onClick={handleSplit}
                  data-testid="floating-action-split"
                  style={{
                    minWidth: '44px',
                    minHeight: '32px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Split"
                >
                  <Scissors size={13} />
                  <span>{t('preview.contextSplit', 'Split')}</span>
                </button>

                <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

                <button
                  onClick={handleDuplicate}
                  data-testid="floating-action-duplicate"
                  style={{
                    minWidth: '44px',
                    minHeight: '32px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Duplicate"
                >
                  <Copy size={13} />
                  <span>{t('preview.contextDuplicate', 'Duplicate')}</span>
                </button>

                <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

                <button
                  onClick={handleDelete}
                  data-testid="floating-action-delete"
                  style={{
                    minWidth: '44px',
                    minHeight: '32px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  title="Delete"
                >
                  <Trash2 size={13} />
                  <span>{t('preview.contextDelete', 'Delete')}</span>
                </button>
              </div>
            )}

            {/* Brand Kit Watermark (AUD-036) */}
            {brandWatermark && (
              <img
                src={brandWatermark}
                alt="Brand Watermark"
                data-testid="brand-watermark-overlay"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  maxWidth: '44px',
                  maxHeight: '44px',
                  opacity: 0.85,
                  zIndex: 14,
                  pointerEvents: 'none'
                }}
              />
            )}

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

            {/* Active Subtitle Rendering with Selected Khmer font & styling (AUD-058 Curved Text) */}
            {activeTextClip && (
              <div style={{
                position: 'absolute',
                bottom: '16%',
                width: '90%',
                textAlign: 'center',
                zIndex: 10,
                pointerEvents: 'none'
              }}>
                {activeTextProps.curvedRadius && activeTextProps.curvedRadius !== 0 ? (
                  <svg
                    width="260"
                    height="90"
                    viewBox="0 0 260 90"
                    data-testid="curved-text-svg"
                    style={{ overflow: 'visible', margin: '0 auto', display: 'block' }}
                  >
                    <path
                      id="text-curve-path"
                      d={activeTextProps.curvedRadius > 0
                        ? `M 10,75 Q 130,${75 - activeTextProps.curvedRadius * 0.35} 250,75`
                        : `M 10,25 Q 130,${25 - activeTextProps.curvedRadius * 0.35} 250,25`}
                      fill="transparent"
                    />
                    <text
                      fill={activeTextProps.color || '#ffffff'}
                      fontSize={`${activeTextProps.fontSize || 20}px`}
                      fontFamily={`'${activeTextProps.fontFamily || 'Noto Sans Khmer'}', sans-serif`}
                      textAnchor="middle"
                      stroke={activeTextProps.strokeWidth > 0 ? activeTextProps.strokeColor : undefined}
                      strokeWidth={activeTextProps.strokeWidth > 0 ? activeTextProps.strokeWidth : undefined}
                    >
                      <textPath href="#text-curve-path" startOffset="50%">
                        {activeTextProps.text || activeTextClip.text}
                      </textPath>
                    </text>
                  </svg>
                ) : (
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
                )}
              </div>
            )}
          </div>
        </div>

        {/* Universal Scrubber & Preview Controls Bar (AUD-040, AUD-043, AUD-046) */}
        <div style={{
          height: '48px',
          backgroundColor: '#0d0f16',
          borderTop: '1px solid #1f2334',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 'max(var(--sal, 0px), 16px)',
          paddingRight: 'max(var(--sar, 0px), 16px)',
          flexShrink: 0,
          gap: '8px',
          overflowX: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => {
                setCurrentTime(0);
                triggeredSFXRef.current.clear();
              }}
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: '#1a1d2b',
                color: '#cbd5e1',
                border: '1px solid #282d3f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Reset Playhead"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={() => setCurrentTime((p) => Math.max(0, p - 1/30))}
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: '#1a1d2b',
                color: '#cbd5e1',
                border: '1px solid #282d3f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={t('editor.frameStepBack', 'Step Backward')}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => setCurrentTime((p) => Math.min(totalDuration, p + 1/30))}
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: '#1a1d2b',
                color: '#cbd5e1',
                border: '1px solid #282d3f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={t('editor.frameStepFwd', 'Step Forward')}
            >
              <ChevronRight size={16} />
            </button>

            {/* Pointer vs Hand Pan Tool (AUD-040) */}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#151722', borderRadius: '8px', border: '1px solid #232738', padding: '2px', marginLeft: '4px' }}>
              <button
                onClick={() => setPreviewTool('pointer')}
                data-testid="preview-tool-pointer"
                style={{
                  minWidth: '36px',
                  minHeight: '36px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: previewTool === 'pointer' ? '#4f46e5' : 'transparent',
                  color: previewTool === 'pointer' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={t('preview.pointerTool', 'Pointer Tool')}
              >
                <MousePointer size={15} />
              </button>
              <button
                onClick={() => setPreviewTool('hand')}
                data-testid="preview-tool-hand"
                style={{
                  minWidth: '36px',
                  minHeight: '36px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: previewTool === 'hand' ? '#4f46e5' : 'transparent',
                  color: previewTool === 'hand' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={t('preview.handTool', 'Hand Tool (Pan)')}
              >
                <Hand size={15} />
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              minHeight: '44px',
              minWidth: '88px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '22px',
              backgroundColor: isPlaying ? '#eab308' : '#4f46e5',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? t('editor.pause') : t('editor.play')}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setIsLooping(!isLooping)}
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: isLooping ? 'rgba(16, 185, 129, 0.2)' : '#1a1d2b',
                color: isLooping ? '#10b981' : '#cbd5e1',
                border: isLooping ? '1px solid #10b981' : '1px solid #282d3f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={t('editor.loop', 'Loop Playback')}
            >
              <RefreshCw size={14} />
            </button>

            <button
              onClick={() => setShowRatioGuides(!showRatioGuides)}
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: showRatioGuides ? 'rgba(99, 102, 241, 0.2)' : '#1a1d2b',
                color: showRatioGuides ? '#818cf8' : '#cbd5e1',
                border: showRatioGuides ? '1px solid #818cf8' : '1px solid #282d3f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Ratio Guides"
            >
              <Eye size={14} />
            </button>

            {/* Picture in Picture Window Toggle (AUD-046) */}
            <button
              onClick={handleTogglePiP}
              data-testid="preview-pip-btn"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: '#1a1d2b',
                color: '#cbd5e1',
                border: '1px solid #282d3f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={t('preview.pipToggle', 'Picture in Picture')}
            >
              <PictureInPicture size={14} />
            </button>

            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

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
        height: isMobile ? (isLandscape ? '160px' : '200px') : '240px',
        backgroundColor: '#10121a',
        borderTop: '1px solid #232738',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: isMobile ? 'max(var(--sab, 0px), 8px)' : '0px',
        flexShrink: 0
      }}>
        {/* Timeline Tools */}
        <div style={{
          height: isMobile ? '48px' : '38px',
          backgroundColor: '#151722',
          borderBottom: '1px solid #232738',
          paddingLeft: 'max(var(--sal, 0px), 12px)',
          paddingRight: 'max(var(--sar, 0px), 12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          gap: '8px',
          flexShrink: 0
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
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  minHeight: '40px',
                  borderRadius: '6px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                <Sliders size={14} />
                <span>Adjust</span>
              </button>
            )}

            <button
              onClick={handleSplit}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: isMobile ? '6px 12px' : '4px 8px',
                minHeight: isMobile ? '44px' : 'auto',
                minWidth: isMobile ? '44px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title={t('editor.split')}
            >
              <Scissors size={14} color="#818cf8" />
              <span>{t('editor.split')}</span>
            </button>

            <button
              onClick={handleTrimLeft}
              disabled={!selectedClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: isMobile ? '6px 12px' : '4px 8px',
                minHeight: isMobile ? '44px' : 'auto',
                minWidth: isMobile ? '44px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: selectedClip ? '#38bdf8' : '#64748b',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title={t('editor.trim', 'Trim')}
            >
              <ChevronLeft size={14} />
              <span>{t('editor.trim')}</span>
            </button>

            <button
              onClick={handleTrimRight}
              disabled={!selectedClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: isMobile ? '6px 12px' : '4px 8px',
                minHeight: isMobile ? '44px' : 'auto',
                minWidth: isMobile ? '44px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: selectedClip ? '#38bdf8' : '#64748b',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title={t('editor.trim', 'Trim')}
            >
              <span>{t('editor.trim')}</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={handleDuplicate}
              disabled={!selectedClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: isMobile ? '6px 12px' : '4px 8px',
                minHeight: isMobile ? '44px' : 'auto',
                minWidth: isMobile ? '44px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: selectedClip ? '#a78bfa' : '#64748b',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title={t('editor.duplicate', 'Duplicate')}
            >
              <Copy size={14} />
              <span>{t('editor.duplicate')}</span>
            </button>

            <button
              onClick={handleRippleDelete}
              disabled={!selectedClip}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: isMobile ? '6px 12px' : '4px 8px',
                minHeight: isMobile ? '44px' : 'auto',
                minWidth: isMobile ? '44px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: selectedClip ? '#f87171' : '#64748b',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title={t('editor.rippleDelete', 'Ripple Delete')}
            >
              <Trash2 size={14} />
              <span>{t('editor.rippleDelete')}</span>
            </button>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#2e3448', margin: '0 4px' }} />

            <button
              onClick={handleAddText}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: isMobile ? '6px 12px' : '4px 8px',
                minHeight: isMobile ? '40px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              <Type size={14} />
              <span>+ Text (Khmer)</span>
            </button>

            <button
              onClick={() => handleAddSFX('whoosh')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: isMobile ? '6px 10px' : '4px 8px',
                minHeight: isMobile ? '40px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#c084fc',
                fontSize: '11px'
              }}
            >
              <Volume2 size={14} />
              <span>SFX Whoosh</span>
            </button>

            <button
              onClick={() => handleAddSFX('ding')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: isMobile ? '6px 10px' : '4px 8px',
                minHeight: isMobile ? '40px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#c084fc',
                fontSize: '11px'
              }}
            >
              <Volume2 size={14} />
              <span>SFX Ding</span>
            </button>

            <button
              onClick={handleAddMusic}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: isMobile ? '6px 10px' : '4px 8px',
                minHeight: isMobile ? '40px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#34d399',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <Music size={14} />
              <span>+ Music</span>
            </button>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#2e3448', margin: '0 4px' }} />

            {/* Partial AI Edit Button */}
            <button
              onClick={() => {
                if (!selectedClipId && videoClips.length > 0) {
                  setSelectedClipId(videoClips[0].id);
                }
                setIsPartialEditOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: isMobile ? '6px 10px' : '4px 8px',
                minHeight: isMobile ? '40px' : 'auto',
                borderRadius: '6px',
                backgroundColor: 'rgba(167, 139, 250, 0.15)',
                border: '1px solid rgba(167, 139, 250, 0.4)',
                color: '#c4b5fd',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title={t('autocut.partialEdit')}
            >
              <Wand2 size={13} />
              <span>{t('autocut.partialEdit')}</span>
            </button>

            {/* Quick Fix Dropdown Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsQuickFixMenuOpen(!isQuickFixMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: isMobile ? '6px 10px' : '4px 8px',
                  minHeight: isMobile ? '40px' : 'auto',
                  borderRadius: '6px',
                  backgroundColor: isQuickFixMenuOpen ? '#3730a3' : '#1e2130',
                  border: isQuickFixMenuOpen ? '1px solid #6366f1' : '1px solid #2e3448',
                  color: isQuickFixMenuOpen ? '#ffffff' : '#818cf8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title={t('autocut.quickFixTitle')}
              >
                <Sparkles size={13} />
                <span>{t('autocut.quickFixTitle')}</span>
              </button>

              {isQuickFixMenuOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: '8px',
                  backgroundColor: '#181b28',
                  border: '1px solid #2f364f',
                  borderRadius: '10px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '190px',
                  zIndex: 80,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', padding: '4px 8px' }}>
                    {t('autocut.quickFixTitle')}
                  </div>
                  <button
                    onClick={() => handleQuickFix('silence')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#252a3d')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Scissors size={13} color="#38bdf8" />
                    <span>{t('autocut.removeSilence')}</span>
                  </button>
                  <button
                    onClick={() => handleQuickFix('captions')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#252a3d')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Type size={13} color="#fbbf24" />
                    <span>{t('autocut.fixCaptions')}</span>
                  </button>
                  <button
                    onClick={() => handleQuickFix('sfx')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#252a3d')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Volume2 size={13} color="#c084fc" />
                    <span>{t('autocut.swapSfx')}</span>
                  </button>
                  <button
                    onClick={() => handleQuickFix('music')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#252a3d')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Music size={13} color="#34d399" />
                    <span>{t('autocut.changeMusic')}</span>
                  </button>
                  <button
                    onClick={() => handleQuickFix('pacing')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#252a3d')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Sliders size={13} color="#f472b6" />
                    <span>{t('autocut.changePacing')}</span>
                  </button>
                  <button
                    onClick={() => handleQuickFix('aspect')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#252a3d')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Maximize2 size={13} color="#a78bfa" />
                    <span>{t('autocut.changeAspect')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Version History Button */}
            <button
              onClick={() => setIsVersionHistoryOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: isMobile ? '6px 10px' : '4px 8px',
                minHeight: isMobile ? '40px' : 'auto',
                borderRadius: '6px',
                backgroundColor: '#1e2130',
                border: '1px solid #2e3448',
                color: '#cbd5e1',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title={t('autocut.versionHistory')}
            >
              <History size={13} color="#818cf8" />
              <span>{t('autocut.versionHistory')}</span>
              {historySnapshots.length > 0 && (
                <span style={{
                  fontSize: '9px',
                  backgroundColor: '#3730a3',
                  color: '#e0e7ff',
                  padding: '1px 5px',
                  borderRadius: '10px'
                }}>
                  {historySnapshots.length}
                </span>
              )}
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

            {/* Music / Audio Track */}
            <div style={{ height: '36px', backgroundColor: 'rgba(255,255,255,0.02)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '6px', top: '10px', fontSize: '10px', color: '#475569', fontWeight: 700 }}>
                MUSIC
              </div>
              {musicClips.map((c) => (
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
                    backgroundColor: selectedClipId === c.id ? '#047857' : '#14382c',
                    border: selectedClipId === c.id ? '2px solid #34d399' : '1px solid #1f5a45',
                    color: '#a7f3d0',
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                    <Music size={12} color="#34d399" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'monospace' }}>
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
          </div>
        </div>
      </div>

      {/* Modals */}
      <AutoCutModal
        isOpen={isAutoCutOpen}
        onClose={() => setIsAutoCutOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onApply={handleApplyAutoCut}
      />

      <PartialEditModal
        isOpen={isPartialEditOpen}
        selectedClip={selectedClip || videoClips[0] || null}
        onClose={() => setIsPartialEditOpen(false)}
        onApplyPartialEdit={handleApplyPartialEdit}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        snapshots={historySnapshots}
        currentSnapshotId={currentSnapshotId || undefined}
        onRestore={handleRestoreSnapshot}
        onClose={() => setIsVersionHistoryOpen(false)}
      />

      <RegenerateModal
        isOpen={isRegenerateOpen}
        onClose={() => setIsRegenerateOpen(false)}
        onRegenerate={() => {
          setIsAutoCutOpen(true);
        }}
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
