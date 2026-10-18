export type TrackType =
  | 'video'
  | 'overlay'
  | 'audio'
  | 'music'
  | 'sfx'
  | 'voiceover'
  | 'text'
  | 'sticker'
  | 'effect'
  | 'filter'
  | 'caption';

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | '3:4';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'add';

export type MaskShape =
  | 'none'
  | 'linear'
  | 'mirror'
  | 'circle'
  | 'rectangle'
  | 'heart'
  | 'star';

export interface KeyframePoint {
  time: number; // Normalized 0 to 1 relative to clip duration
  value: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface KeyframeTrack {
  property: 'positionX' | 'positionY' | 'scale' | 'rotation' | 'opacity' | 'volume' | 'maskPosition' | 'filterStrength';
  points: KeyframePoint[];
}

export interface ClipMask {
  shape: MaskShape;
  feather: number; // 0 to 100
  invert: boolean;
  x: number; // percentage
  y: number;
  scale: number;
  rotation: number;
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string; // Hex color (e.g. #00ff00)
  intensity: number; // 0 to 100
  shadow: number; // 0 to 100
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
  ratio?: 'free' | '16:9' | '9:16' | '1:1' | '4:5' | '3:4';
}

export interface SpeedCurvePoint {
  x: number; // 0 to 1 time
  y: number; // 0.1 to 10 speed multiplier
}

export interface SpeedCurve {
  preset: 'custom' | 'montage' | 'hero' | 'bullet' | 'jump_cut' | 'flash_in' | 'flash_out';
  points: SpeedCurvePoint[];
}

export interface ClipTransform {
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number; // degrees
  opacity: number; // 0 to 100
  flipH: boolean;
  flipV: boolean;
  crop?: CropRect;
}

export interface CanvasBackground {
  type: 'color' | 'image' | 'blur';
  value: string; // color hex, image url, or blur radius
}

export interface ClipTransition {
  type: 'none' | 'fade' | 'dissolve' | 'slide_left' | 'slide_right' | 'zoom_in' | 'wipe' | 'glitch' | 'spin' | 'blur';
  duration: number; // seconds
}

export interface ClipAnimation {
  inType: 'none' | 'fade_in' | 'slide_up' | 'zoom_in' | 'bounce';
  inDuration: number;
  outType: 'none' | 'fade_out' | 'slide_down' | 'zoom_out';
  outDuration: number;
  loopType: 'none' | 'pulse' | 'wave' | 'shake';
}

export interface ColorGrading {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number; // 0 to 100
  highlight: number; // -100 to 100
  shadow: number; // -100 to 100
  temperature: number; // -100 to 100
  tint: number; // -100 to 100
  fade: number; // 0 to 100
  vignette: number; // 0 to 100
  grain: number; // 0 to 100
  preset: string; // 'none', 'vibrant', 'film', 'warm', 'cool', 'bw'
  lutName?: string;
}

export interface EffectSettings {
  type: 'none' | 'blur' | 'glitch' | 'shake' | 'zoom_pulse' | 'rgb_split' | 'film_grain' | 'light_leak' | 'vhs' | 'flash' | 'mirror';
  intensity: number; // 0 to 100
  speed?: number; // 0 to 100
}

export interface TextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  gradient?: {
    enabled: boolean;
    startColor: string;
    endColor: string;
    direction: 'horizontal' | 'vertical';
  };
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  glowColor?: string;
  glowBlur?: number;
  backgroundColor: string;
  letterSpacing: number;
  lineHeight: number;
  alignment: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  underline: boolean;
  animation?: string;
}

export interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

export interface CaptionProperties {
  text: string;
  words?: CaptionWord[];
  speaker?: string;
  language?: 'km' | 'en';
}

export interface StickerProperties {
  stickerId: string;
  stickerUrl: string;
  animated: boolean;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  sourceId?: string;
  title: string;
  type: TrackType;
  start: number; // Timeline start time in seconds
  end: number; // Timeline end time in seconds
  inPoint: number; // In-point in source media in seconds
  outPoint: number; // Out-point in source media in seconds
  duration: number; // Visible duration = end - start
  speed: number;
  speedCurve?: SpeedCurve;
  isReversed?: boolean;
  isFreezeFrame?: boolean;
  volume: number; // 0 to 200 (100 = 1.0 gain)
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  pan?: number; // -1 (left) to +1 (right)
  ducking?: boolean;
  preservesPitch?: boolean;
  transform: ClipTransform;
  canvasBackground?: CanvasBackground;
  keyframes?: KeyframeTrack[];
  mask?: ClipMask;
  chromaKey?: ChromaKeySettings;
  blendMode: BlendMode;
  transition?: ClipTransition;
  animation?: ClipAnimation;
  colorGrading?: ColorGrading;
  effect?: EffectSettings;
  textProperties?: TextProperties;
  captionProperties?: CaptionProperties;
  stickerProperties?: StickerProperties;
  // Free-form properties object for extensible data
  properties: Record<string, any>;
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  name: string;
  isLocked: boolean;
  isMuted: boolean;
  isHidden: boolean;
  magnetic: boolean;
  volume: number; // 0 to 100
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  type: 'normal' | 'beat';
}

export interface MediaSource {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  uri: string;
  proxyUri?: string;
  duration: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  waveFormData?: number[];
  createdAt: string;
}

export interface ProjectTimeline {
  schemaVersion: number;
  id: string;
  title: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: 24 | 30 | 60;
  duration: number;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  markers: TimelineMarker[];
  sources: MediaSource[];
  createdAt: string;
  updatedAt: string;
}

export const CURRENT_TIMELINE_SCHEMA_VERSION = 2;

export function createDefaultTransform(): ClipTransform {
  return {
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    opacity: 100,
    flipH: false,
    flipV: false
  };
}

export function createDefaultColorGrading(): ColorGrading {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    highlight: 0,
    shadow: 0,
    temperature: 0,
    tint: 0,
    fade: 0,
    vignette: 0,
    grain: 0,
    preset: 'none'
  };
}

export function createDefaultTextProperties(text: string = 'ចំណងជើងខ្មែរ'): TextProperties {
  return {
    text,
    fontFamily: 'Noto Sans Khmer',
    fontSize: 24,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 2,
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    shadowBlur: 4,
    backgroundColor: 'transparent',
    letterSpacing: 0,
    lineHeight: 1.2,
    alignment: 'center',
    bold: false,
    italic: false,
    underline: false
  };
}

export function createDefaultTimeline(id: string = 'proj-default', title: string = 'គម្រោងថ្មី'): ProjectTimeline {
  const tracks: TimelineTrack[] = [
    { id: 'track-v1', type: 'video', name: 'Main Video', isLocked: false, isMuted: false, isHidden: false, magnetic: true, volume: 100 },
    { id: 'track-v2', type: 'overlay', name: 'Overlay / PiP', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-t1', type: 'text', name: 'Text & Titles', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-c1', type: 'caption', name: 'Captions', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-e1', type: 'effect', name: 'Effects', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-f1', type: 'filter', name: 'Filters', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-s1', type: 'sticker', name: 'Stickers', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-a1', type: 'audio', name: 'Extracted Audio', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-m1', type: 'music', name: 'Background Music', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-x1', type: 'sfx', name: 'Sound Effects', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 },
    { id: 'track-vo', type: 'voiceover', name: 'Voiceover', isLocked: false, isMuted: false, isHidden: false, magnetic: false, volume: 100 }
  ];

  return {
    schemaVersion: CURRENT_TIMELINE_SCHEMA_VERSION,
    id,
    title,
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 18,
    tracks,
    clips: [],
    markers: [],
    sources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Migration function to upgrade previous schema versions to current version
 */
export function migrateTimeline(data: any): ProjectTimeline {
  if (!data || typeof data !== 'object') {
    return createDefaultTimeline();
  }

  // Version 1 to Version 2 migration
  if (!data.schemaVersion || data.schemaVersion === 1) {
    const defaultProj = createDefaultTimeline(data.id || 'proj-migrated', data.name || data.title || 'Migrated Project');
    const migratedClips: TimelineClip[] = [];

    // Migrate old flat clips array if present
    const oldClips = Array.isArray(data.clips) ? data.clips : [];
    for (const old of oldClips) {
      let targetTrackId = 'track-v1';
      if (old.type === 'text') targetTrackId = 'track-t1';
      else if (old.type === 'sfx') targetTrackId = 'track-x1';
      else if (old.type === 'audio') targetTrackId = 'track-a1';

      migratedClips.push({
        id: old.id || `clip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        trackId: old.trackId || targetTrackId,
        sourceId: old.sourceId,
        title: old.title || 'Clip',
        type: old.type || 'video',
        start: Number(old.start || 0),
        end: Number(old.end || 5),
        inPoint: Number(old.inPoint || 0),
        outPoint: Number(old.outPoint || (old.end ? old.end - (old.start || 0) : 5)),
        duration: Number((old.end || 5) - (old.start || 0)),
        speed: Number(old.speed || 1.0),
        volume: Number(old.volume !== undefined ? old.volume : 100),
        fadeIn: Number(old.fadeIn || 0),
        fadeOut: Number(old.fadeOut || 0),
        pan: 0,
        ducking: Boolean(old.ducking),
        preservesPitch: true,
        transform: {
          position: { x: 0, y: 0 },
          scale: { x: (old.scale || 100) / 100, y: (old.scale || 100) / 100 },
          rotation: Number(old.rotation || 0),
          opacity: Number(old.opacity !== undefined ? old.opacity : 100),
          flipH: Boolean(old.flipH),
          flipV: false
        },
        blendMode: 'normal',
        colorGrading: createDefaultColorGrading(),
        textProperties: old.type === 'text' ? createDefaultTextProperties(old.text || old.title) : undefined,
        properties: old.properties || {}
      });
    }

    return {
      schemaVersion: CURRENT_TIMELINE_SCHEMA_VERSION,
      id: data.id || defaultProj.id,
      title: data.name || data.title || defaultProj.title,
      aspectRatio: data.aspectRatio || '9:16',
      width: data.width || 1080,
      height: data.height || 1920,
      fps: data.fps || 30,
      duration: data.durationSeconds || data.duration || 18,
      tracks: Array.isArray(data.tracks) && data.tracks.length > 0 ? data.tracks : defaultProj.tracks,
      clips: migratedClips,
      markers: Array.isArray(data.markers) ? data.markers : [],
      sources: Array.isArray(data.sources) ? data.sources : [],
      createdAt: data.createdAt || defaultProj.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  // Already schema version 2 or newer
  return {
    ...data,
    schemaVersion: CURRENT_TIMELINE_SCHEMA_VERSION,
    tracks: data.tracks || createDefaultTimeline().tracks,
    clips: data.clips || [],
    markers: data.markers || [],
    sources: data.sources || [],
    updatedAt: new Date().toISOString()
  };
}

export function validateTimeline(timeline: ProjectTimeline): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!timeline) {
    return { valid: false, errors: ['Timeline object is null or undefined'] };
  }
  if (!timeline.schemaVersion || timeline.schemaVersion < 1) {
    errors.push('Invalid or missing schemaVersion');
  }
  if (!timeline.id) {
    errors.push('Missing timeline ID');
  }
  if (!Array.isArray(timeline.tracks)) {
    errors.push('Tracks must be an array');
  }
  if (!Array.isArray(timeline.clips)) {
    errors.push('Clips must be an array');
  }

  // Validate clips
  for (const clip of timeline.clips || []) {
    if (!clip.id) errors.push('Clip missing id');
    if (clip.start < 0) errors.push(`Clip ${clip.id} start time cannot be negative`);
    if (clip.end <= clip.start) errors.push(`Clip ${clip.id} end time must be greater than start time`);
    if (clip.properties && typeof clip.properties !== 'object') {
      errors.push(`Clip ${clip.id} properties must be an object`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
