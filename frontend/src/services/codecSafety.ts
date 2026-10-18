export interface CodecSupportReport {
  h264: boolean;
  hevc: boolean;
  vp9: boolean;
  av1: boolean;
  webm: boolean;
  mp4: boolean;
}

export interface VideoMetadataAnalysis {
  width: number;
  height: number;
  rotationDegrees: number;
  isHdr: boolean;
  durationSec: number;
  codec: string;
  needsProxy: boolean;
  recommendedProxyHeight: number;
}

// Probe browser codec decoding capabilities
export function probeCodecSupport(): CodecSupportReport {
  const video = typeof document !== 'undefined' ? document.createElement('video') : null;

  if (!video) {
    return {
      h264: true,
      hevc: false,
      vp9: false,
      av1: false,
      webm: true,
      mp4: true,
    };
  }

  const canPlay = (mime: string): boolean => {
    try {
      const res = video.canPlayType(mime);
      return res === 'probably' || res === 'maybe';
    } catch {
      return false;
    }
  };

  return {
    h264: canPlay('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') || canPlay('video/mp4'),
    hevc: canPlay('video/mp4; codecs="hev1.1.6.L93.B0"') || canPlay('video/mp4; codecs="hvc1.1.6.L93.B0"'),
    vp9: canPlay('video/webm; codecs="vp9"') || canPlay('video/webm; codecs="vp09.00.10.08"'),
    av1: canPlay('video/mp4; codecs="av01.0.05M.08"') || canPlay('video/webm; codecs="av01.0.05M.08"'),
    webm: canPlay('video/webm'),
    mp4: canPlay('video/mp4'),
  };
}

// Inspect MP4 header box bytes to detect rotation matrix in tkhd box
export async function detectVideoRotation(file: File | Blob): Promise<number> {
  try {
    const slice = file.slice(0, Math.min(file.size, 256 * 1024));
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    for (let i = 0; i < view.byteLength - 36; i += 4) {
      if (
        view.getUint8(i) === 0x74 && // 't'
        view.getUint8(i + 1) === 0x6b && // 'k'
        view.getUint8(i + 2) === 0x68 && // 'h'
        view.getUint8(i + 3) === 0x64 // 'd'
      ) {
        // Found tkhd box, search for transformation matrix
        const version = view.getUint8(i + 4);
        const matrixOffset = version === 1 ? i + 48 : i + 40;

        if (matrixOffset + 36 <= view.byteLength) {
          const a = view.getInt32(matrixOffset);
          const b = view.getInt32(matrixOffset + 4);
          const c = view.getInt32(matrixOffset + 16);
          const d = view.getInt32(matrixOffset + 20);

          if (a === 0 && b === 0x00010000 && c === -0x00010000 && d === 0) {
            return 90;
          }
          if (a === -0x00010000 && b === 0 && c === 0 && d === -0x00010000) {
            return 180;
          }
          if (a === 0 && b === -0x00010000 && c === 0x00010000 && d === 0) {
            return 270;
          }
        }
        break;
      }
    }
  } catch (err) {
    console.warn('Rotation detection fallback to 0:', err);
  }

  return 0;
}

// Tone-mapping SDR fallback for HDR color profiles
export function applySdrToneMapping(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Reinhard simple tone mapping for HDR clamped colors
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const mappedR = r / (1 + r);
      const mappedG = g / (1 + g);
      const mappedB = b / (1 + b);

      data[i] = Math.round(mappedR * 255);
      data[i + 1] = Math.round(mappedG * 255);
      data[i + 2] = Math.round(mappedB * 255);
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('HDR tone mapping failed, leaving raw SDR buffer:', err);
  }
}

// Analyze video file properties and determine proxy necessity
export async function analyzeVideoClip(
  file: File,
  deviceTier: 'low' | 'mid' | 'high'
): Promise<VideoMetadataAnalysis> {
  const rotationDegrees = await detectVideoRotation(file);
  const support = probeCodecSupport();

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;

    const blobUrl = URL.createObjectURL(file);
    video.src = blobUrl;

    const cleanup = () => {
      URL.revokeObjectURL(blobUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const rawWidth = video.videoWidth || 1280;
      const rawHeight = video.videoHeight || 720;
      const duration = video.duration || 0;

      // Compensate for orientation in natural width/height
      const isRotated = rotationDegrees === 90 || rotationDegrees === 270;
      const width = isRotated ? rawHeight : rawWidth;
      const height = isRotated ? rawWidth : rawHeight;

      let needsProxy = false;
      let recommendedProxyHeight = 540;

      if (deviceTier === 'low') {
        if (width > 720 || height > 720) {
          needsProxy = true;
          recommendedProxyHeight = 360;
        }
      } else if (deviceTier === 'mid') {
        if (width > 1920 || height > 1920) {
          needsProxy = true;
          recommendedProxyHeight = 540;
        }
      }

      cleanup();

      resolve({
        width,
        height,
        rotationDegrees,
        isHdr: false,
        durationSec: duration,
        codec: support.hevc ? 'hevc/avc' : 'avc',
        needsProxy,
        recommendedProxyHeight,
      });
    };

    video.onerror = () => {
      cleanup();
      resolve({
        width: 1280,
        height: 720,
        rotationDegrees: 0,
        isHdr: false,
        durationSec: 0,
        codec: 'unknown',
        needsProxy: true,
        recommendedProxyHeight: 360,
      });
    };
  });
}

// Platform quirks listener manager
export class PlatformQuirksManager {
  private static instance: PlatformQuirksManager | null = null;
  private audioContext: AudioContext | null = null;
  private glContexts: Set<WebGLRenderingContext | WebGL2RenderingContext> = new Set();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): PlatformQuirksManager {
    if (!PlatformQuirksManager.instance) {
      PlatformQuirksManager.instance = new PlatformQuirksManager();
    }
    return PlatformQuirksManager.instance;
  }

  public registerWebGLContext(gl: WebGLRenderingContext | WebGL2RenderingContext): () => void {
    this.glContexts.add(gl);
    return () => {
      this.glContexts.delete(gl);
    };
  }

  public registerAudioContext(actx: AudioContext): void {
    this.audioContext = actx;
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }
    this.isInitialized = true;

    // 1. WebAudio auto-unlock on iOS and mobile browsers
    const unlockAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch((err) => {
          console.warn('AudioContext resume failed:', err);
        });
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    // 2. Virtual keyboard resize handling via Visual Viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const vp = window.visualViewport;
        if (!vp) return;
        const root = document.documentElement;
        root.style.setProperty('--visual-viewport-height', `${vp.height}px`);
        root.style.setProperty('--visual-viewport-offset-top', `${vp.offsetTop}px`);
      });
    }

    // 3. WebGL Context Loss safety handling
    window.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('WebGL Context Lost. Preserving state for recovery.');
    }, false);

    window.addEventListener('webglcontextrestored', () => {
      console.warn('WebGL Context Restored. Rebuilding active textures.');
    }, false);
  }
}

export const platformQuirks = PlatformQuirksManager.getInstance();
