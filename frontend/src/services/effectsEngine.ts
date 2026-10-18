import { ColorGrading, EffectSettings, ClipTransition, ClipAnimation } from '../types/timeline';

export interface EffectDefinition {
  id: string;
  name: string;
  category: 'blur' | 'distortion' | 'retro' | 'light' | 'motion';
  defaultIntensity: number;
  ffmpegFilter: string;
}

export const VIDEO_EFFECTS_CATALOG: EffectDefinition[] = [
  { id: 'blur', name: 'Gaussian Blur', category: 'blur', defaultIntensity: 40, ffmpegFilter: 'boxblur=luma_radius={val}:luma_power=2' },
  { id: 'glitch', name: 'Digital Glitch', category: 'distortion', defaultIntensity: 50, ffmpegFilter: 'frei0r=filter_name=glitch0r:filter_params={val}' },
  { id: 'shake', name: 'Camera Shake', category: 'motion', defaultIntensity: 30, ffmpegFilter: 'crop=w=in_w-30:h=in_h-30:x=(in_w-out_w)/2+sin(t*20)*{val}:y=(in_h-out_h)/2+cos(t*15)*{val}' },
  { id: 'zoom_pulse', name: 'Zoom Pulse', category: 'motion', defaultIntensity: 45, ffmpegFilter: 'zoompan=z=\'min(zoom+0.0015,1.15)\':d=1' },
  { id: 'rgb_split', name: 'RGB Split', category: 'distortion', defaultIntensity: 35, ffmpegFilter: 'rgbashift=rh={val}:bv=-{val}' },
  { id: 'film_grain', name: '35mm Film Grain', category: 'retro', defaultIntensity: 40, ffmpegFilter: 'noise=alls={val}:allf=t+u' },
  { id: 'light_leak', name: 'Warm Light Leak', category: 'light', defaultIntensity: 50, ffmpegFilter: 'colorchannelmixer=rr=1.2:rg=0.1:rb=0.0' },
  { id: 'vhs', name: 'Vintage VHS', category: 'retro', defaultIntensity: 60, ffmpegFilter: 'curves=vintage,noise=alls=15:allf=t' },
  { id: 'flash', name: 'White Flash', category: 'light', defaultIntensity: 70, ffmpegFilter: 'eq=brightness={val}' },
  { id: 'mirror', name: 'Mirror Reflection', category: 'distortion', defaultIntensity: 100, ffmpegFilter: 'crop=iw/2:ih:0:0,split[left][tmp];[tmp]hflip[right];[left][right]hstack' }
];

export class EffectsEngine {
  /**
   * Compiles CSS filter string for real-time video element or Canvas 2D
   */
  public static buildCssFilter(colorGrading?: ColorGrading, effect?: EffectSettings): string {
    const filters: string[] = [];

    if (colorGrading) {
      // Brightness (-100 to 100) -> 0 to 2
      if (colorGrading.brightness !== 0) {
        const b = 1 + colorGrading.brightness / 100;
        filters.push(`brightness(${b.toFixed(2)})`);
      }

      // Contrast (-100 to 100) -> 0 to 2
      if (colorGrading.contrast !== 0) {
        const c = 1 + colorGrading.contrast / 100;
        filters.push(`contrast(${c.toFixed(2)})`);
      }

      // Saturation (-100 to 100) -> 0 to 2
      if (colorGrading.saturation !== 0) {
        const s = 1 + colorGrading.saturation / 100;
        filters.push(`saturate(${s.toFixed(2)})`);
      }

      // Temperature / Tint (approximated via sepia and hue-rotate)
      if (colorGrading.temperature > 0) {
        filters.push(`sepia(${(colorGrading.temperature / 200).toFixed(2)})`);
      } else if (colorGrading.temperature < 0) {
        filters.push(`hue-rotate(${(colorGrading.temperature * 0.4).toFixed(1)}deg)`);
      }

      // Presets
      if (colorGrading.preset === 'vibrant') {
        filters.push('saturate(1.35) contrast(1.1)');
      } else if (colorGrading.preset === 'film') {
        filters.push('sepia(0.2) contrast(1.15) brightness(0.95)');
      } else if (colorGrading.preset === 'warm') {
        filters.push('sepia(0.3) saturate(1.2)');
      } else if (colorGrading.preset === 'cool') {
        filters.push('hue-rotate(20deg) saturate(1.1)');
      } else if (colorGrading.preset === 'bw') {
        filters.push('grayscale(1)');
      }
    }

    if (effect && effect.type !== 'none') {
      if (effect.type === 'blur') {
        const radius = (effect.intensity / 100) * 12;
        filters.push(`blur(${radius.toFixed(1)}px)`);
      } else if (effect.type === 'vhs') {
        filters.push('contrast(1.2) saturate(1.4) hue-rotate(-10deg)');
      } else if (effect.type === 'flash') {
        const flashB = 1 + (effect.intensity / 100) * 0.8;
        filters.push(`brightness(${flashB.toFixed(2)})`);
      }
    }

    return filters.join(' ');
  }

  /**
   * Evaluates transition progress between two clips (0 to 1)
   */
  public static calculateTransitionTransform(
    transition: ClipTransition,
    progress: number // 0 to 1
  ): { opacityA: number; opacityB: number; transformA: string; transformB: string } {
    const p = Math.max(0, Math.min(1, progress));

    switch (transition.type) {
      case 'fade':
      case 'dissolve':
        return {
          opacityA: 1 - p,
          opacityB: p,
          transformA: 'none',
          transformB: 'none'
        };

      case 'slide_left':
        return {
          opacityA: 1,
          opacityB: 1,
          transformA: `translateX(-${(p * 100).toFixed(1)}%)`,
          transformB: `translateX(${((1 - p) * 100).toFixed(1)}%)`
        };

      case 'slide_right':
        return {
          opacityA: 1,
          opacityB: 1,
          transformA: `translateX(${(p * 100).toFixed(1)}%)`,
          transformB: `translateX(-${((1 - p) * 100).toFixed(1)}%)`
        };

      case 'zoom_in':
        return {
          opacityA: 1 - p,
          opacityB: p,
          transformA: `scale(${(1 + p * 0.4).toFixed(2)})`,
          transformB: `scale(${(0.8 + p * 0.2).toFixed(2)})`
        };

      default:
        return {
          opacityA: 1,
          opacityB: 1,
          transformA: 'none',
          transformB: 'none'
        };
    }
  }

  /**
   * Parses 3D LUT (.cube) content into normalized RGB lookup values
   */
  public static parseCubeLut(cubeText: string): { size: number; table: Float32Array } {
    const lines = cubeText.split('\n');
    let size = 0;
    const values: number[] = [];

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('LUT_3D_SIZE')) {
        const parts = line.split(/\s+/);
        size = parseInt(parts[1], 10);
      } else {
        const parts = line.split(/\s+/).map((n) => parseFloat(n));
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          values.push(parts[0], parts[1], parts[2]);
        }
      }
    }

    return {
      size: size || Math.cbrt(values.length / 3) || 16,
      table: new Float32Array(values)
    };
  }
}
