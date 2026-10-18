export type DeviceTier = 'low' | 'mid' | 'high';
export type PerformanceMode = 'auto' | 'low' | 'mid' | 'high';

export interface StorageInfo {
  quotaMB: number;
  usageMB: number;
  availableMB: number;
}

export interface DeviceCapabilityReport {
  ramGB: number;
  cpuCores: number;
  webglVersion: 'webgl2' | 'webgl1' | 'canvas2d';
  gpuRenderer: string;
  maxTextureSize: number;
  webcodecsSupported: boolean;
  webaudioSupported: boolean;
  storage: StorageInfo;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  touchSupported: boolean;
  isOldAndroidWebView: boolean;
  androidWebViewVersion: number | null;
  inAppBrowser: 'facebook' | 'telegram' | 'tiktok' | 'instagram' | null;
  batteryLevel: number | null;
  isCharging: boolean | null;
  assignedTier: DeviceTier;
}

export interface QualityProfile {
  tier: DeviceTier;
  previewWidth: number;
  previewHeight: number;
  previewFps: number;
  maxConcurrentVideoLayers: number;
  shaderComplexity: 'basic' | 'standard' | 'full';
  waveformSamplePoints: number;
  filmstripIntervalSec: number;
  maxUndoHistory: number;
  defaultExportResolution: '720p' | '1080p' | '4k';
  allow4kExport: boolean;
  warnOn4kExport: boolean;
  renderEngine: 'webgl2' | 'webgl1' | 'canvas2d';
  decoderEngine: 'webcodecs' | 'html5video' | 'server';
}

const STORAGE_KEY_PERF_MODE = 'sabycut_performance_mode';
const STORAGE_KEY_CACHED_TIER = 'sabycut_device_tier';

const memoryStorage = new Map<string, string>();

function safeGetStorage(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) || null;
    }
  }
  return memoryStorage.get(key) || null;
}

function safeSetStorage(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      // Fallback
    }
  }
  memoryStorage.set(key, value);
}

export function clearCapabilityStorage(): void {
  memoryStorage.clear();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_PERF_MODE);
      localStorage.removeItem(STORAGE_KEY_CACHED_TIER);
    } catch {
      // Ignore
    }
  }
}

let cachedReport: DeviceCapabilityReport | null = null;
let cachedProfile: QualityProfile | null = null;

// Probe WebGL capabilities safely
function probeWebGL(): { version: 'webgl2' | 'webgl1' | 'canvas2d'; renderer: string; maxTextureSize: number } {
  if (typeof document === 'undefined') {
    return { version: 'canvas2d', renderer: 'Software 2D Rasterizer', maxTextureSize: 1024 };
  }
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      const dbg = gl2.getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg ? gl2.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'Generic WebGL2 GPU';
      const maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE) || 4096;
      return { version: 'webgl2', renderer, maxTextureSize };
    }

    const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl1) {
      const dbg = (gl1 as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg ? (gl1 as WebGLRenderingContext).getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'Generic WebGL1 GPU';
      const maxTextureSize = (gl1 as WebGLRenderingContext).getParameter((gl1 as WebGLRenderingContext).MAX_TEXTURE_SIZE) || 2048;
      return { version: 'webgl1', renderer, maxTextureSize };
    }
  } catch (err) {
    console.warn('WebGL initialization failed, falling back to Canvas 2D:', err);
  }

  return { version: 'canvas2d', renderer: 'Software 2D Rasterizer', maxTextureSize: 1024 };
}

// Detect Android System WebView version and in-app browser containers
function detectBrowserEnvironment(): {
  isOldAndroidWebView: boolean;
  androidWebViewVersion: number | null;
  inAppBrowser: 'facebook' | 'telegram' | 'tiktok' | 'instagram' | null;
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  // In-app browser detection
  let inAppBrowser: 'facebook' | 'telegram' | 'tiktok' | 'instagram' | null = null;
  if (/FBAN|FBAV/i.test(ua)) inAppBrowser = 'facebook';
  else if (/Telegram/i.test(ua)) inAppBrowser = 'telegram';
  else if (/musical_ly|ByteLocale|TikTok/i.test(ua)) inAppBrowser = 'tiktok';
  else if (/Instagram/i.test(ua)) inAppBrowser = 'instagram';

  // Android WebView version detection
  let isOldAndroidWebView = false;
  let androidWebViewVersion: number | null = null;

  if (/Android/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+)\./);
    if (match && match[1]) {
      androidWebViewVersion = parseInt(match[1], 10);
      if (androidWebViewVersion < 80) {
        isOldAndroidWebView = true;
      }
    }
  }

  return { isOldAndroidWebView, androidWebViewVersion, inAppBrowser };
}

// Estimate storage availability
async function getStorageEstimate(): Promise<StorageInfo> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const quotaMB = Math.round((est.quota || 0) / (1024 * 1024));
      const usageMB = Math.round((est.usage || 0) / (1024 * 1024));
      const availableMB = Math.max(0, quotaMB - usageMB);
      return { quotaMB, usageMB, availableMB };
    } catch {
      // Fallback
    }
  }
  return { quotaMB: 1024, usageMB: 0, availableMB: 1024 };
}

// Core device detection evaluator
export async function detectDeviceCapabilities(forceRefresh: boolean = false): Promise<DeviceCapabilityReport> {
  if (cachedReport && !forceRefresh) {
    return cachedReport;
  }

  const nav = typeof navigator !== 'undefined' ? navigator : ({} as Navigator);

  // RAM estimate
  let ramGB = 4;
  if ('deviceMemory' in nav) {
    ramGB = (nav as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  }

  // CPU cores
  const cpuCores = nav.hardwareConcurrency || 4;

  // WebGL & GPU
  const { version: webglVersion, renderer: gpuRenderer, maxTextureSize } = probeWebGL();

  // WebCodecs support
  const webcodecsSupported = typeof window !== 'undefined' && 'VideoDecoder' in window && 'VideoEncoder' in window;

  // WebAudio support
  const webaudioSupported = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);

  // Storage
  const storage = await getStorageEstimate();

  // Screen metrics
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 667;
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const touchSupported = typeof nav.maxTouchPoints === 'number' ? nav.maxTouchPoints > 0 : false;

  // Browser quirks
  const { isOldAndroidWebView, androidWebViewVersion, inAppBrowser } = detectBrowserEnvironment();

  // Battery status
  let batteryLevel: number | null = null;
  let isCharging: boolean | null = null;
  if ('getBattery' in nav) {
    try {
      const bat = await (nav as Navigator & { getBattery: () => Promise<{ level: number; charging: boolean }> }).getBattery();
      batteryLevel = bat.level;
      isCharging = bat.charging;
    } catch {
      // Ignore battery permission issues
    }
  }

  // Compute Device Tier
  let assignedTier: DeviceTier = 'mid';

  // Low Tier conditions: RAM <= 3GB, <= 4 CPU cores, WebGL1 only, or low storage
  if (ramGB <= 3 || cpuCores <= 4 || webglVersion !== 'webgl2' || (batteryLevel !== null && batteryLevel < 0.15 && !isCharging)) {
    assignedTier = 'low';
  } else if (ramGB >= 8 && cpuCores >= 8 && webglVersion === 'webgl2' && maxTextureSize >= 8192) {
    assignedTier = 'high';
  } else {
    assignedTier = 'mid';
  }

  cachedReport = {
    ramGB,
    cpuCores,
    webglVersion,
    gpuRenderer,
    maxTextureSize,
    webcodecsSupported,
    webaudioSupported,
    storage,
    screenWidth,
    screenHeight,
    pixelRatio,
    touchSupported,
    isOldAndroidWebView,
    androidWebViewVersion,
    inAppBrowser,
    batteryLevel,
    isCharging,
    assignedTier,
  };

  safeSetStorage(STORAGE_KEY_CACHED_TIER, assignedTier);

  return cachedReport;
}

// Compute active Quality Profile based on tier and manual performance mode
export function getActiveQualityProfile(report?: DeviceCapabilityReport): QualityProfile {
  if (cachedProfile && !report) {
    return cachedProfile;
  }

  const actualReport = report || cachedReport;
  const rawTier = actualReport ? actualReport.assignedTier : 'mid';

  // Check user manual override
  const mode = getPerformanceMode();
  const effectiveTier: DeviceTier = mode === 'auto' ? rawTier : mode;

  let profile: QualityProfile;

  if (effectiveTier === 'low') {
    profile = {
      tier: 'low',
      previewWidth: 640,
      previewHeight: 360,
      previewFps: 24,
      maxConcurrentVideoLayers: 2,
      shaderComplexity: 'basic',
      waveformSamplePoints: 200,
      filmstripIntervalSec: 5,
      maxUndoHistory: 20,
      defaultExportResolution: '720p',
      allow4kExport: false,
      warnOn4kExport: true,
      renderEngine: actualReport && actualReport.webglVersion !== 'canvas2d' ? actualReport.webglVersion : 'webgl1',
      decoderEngine: actualReport && actualReport.webcodecsSupported ? 'webcodecs' : 'html5video',
    };
  } else if (effectiveTier === 'high') {
    profile = {
      tier: 'high',
      previewWidth: 1280,
      previewHeight: 720,
      previewFps: 60,
      maxConcurrentVideoLayers: 8,
      shaderComplexity: 'full',
      waveformSamplePoints: 1000,
      filmstripIntervalSec: 1,
      maxUndoHistory: 100,
      defaultExportResolution: '1080p',
      allow4kExport: true,
      warnOn4kExport: false,
      renderEngine: 'webgl2',
      decoderEngine: actualReport && actualReport.webcodecsSupported ? 'webcodecs' : 'html5video',
    };
  } else {
    // Mid tier
    profile = {
      tier: 'mid',
      previewWidth: 960,
      previewHeight: 540,
      previewFps: 30,
      maxConcurrentVideoLayers: 4,
      shaderComplexity: 'standard',
      waveformSamplePoints: 500,
      filmstripIntervalSec: 2,
      maxUndoHistory: 50,
      defaultExportResolution: '1080p',
      allow4kExport: true,
      warnOn4kExport: true,
      renderEngine: actualReport && actualReport.webglVersion === 'webgl2' ? 'webgl2' : 'webgl1',
      decoderEngine: actualReport && actualReport.webcodecsSupported ? 'webcodecs' : 'html5video',
    };
  }

  cachedProfile = profile;
  return profile;
}

// User performance mode settings
export function getPerformanceMode(): PerformanceMode {
  const val = safeGetStorage(STORAGE_KEY_PERF_MODE);
  if (val === 'low' || val === 'mid' || val === 'high' || val === 'auto') {
    return val;
  }
  return 'auto';
}

export function setPerformanceMode(mode: PerformanceMode): QualityProfile {
  safeSetStorage(STORAGE_KEY_PERF_MODE, mode);
  cachedProfile = null;
  return getActiveQualityProfile();
}

// Storage safety pre-flight check
export async function checkStorageAvailable(requiredMB: number = 100): Promise<{ hasSpace: boolean; availableMB: number }> {
  const est = await getStorageEstimate();
  return {
    hasSpace: est.availableMB >= requiredMB,
    availableMB: est.availableMB,
  };
}

// Feature flag validator
export function isFeatureAllowed(feature: '4k_export' | 'heavy_shaders' | 'multi_layer_pip' | 'local_ai'): {
  allowed: boolean;
  reason?: string;
} {
  const profile = getActiveQualityProfile();

  switch (feature) {
    case '4k_export':
      return {
        allowed: profile.allow4kExport,
        reason: profile.allow4kExport ? undefined : 'Your device memory tier recommends 1080p or server rendering for 4K video.',
      };
    case 'heavy_shaders':
      return {
        allowed: profile.shaderComplexity !== 'basic',
        reason: profile.shaderComplexity === 'basic' ? 'Shader simplified to maintain smooth real-time playback on this device.' : undefined,
      };
    case 'multi_layer_pip':
      return {
        allowed: profile.maxConcurrentVideoLayers > 2,
        reason: profile.maxConcurrentVideoLayers <= 2 ? 'Maximum 2 concurrent video overlay layers supported on this device tier.' : undefined,
      };
    case 'local_ai':
      return {
        allowed: profile.tier !== 'low',
        reason: profile.tier === 'low' ? 'Complex AI tasks are routed to the cloud service to prevent memory exhaustion.' : undefined,
      };
    default:
      return { allowed: true };
  }
}
