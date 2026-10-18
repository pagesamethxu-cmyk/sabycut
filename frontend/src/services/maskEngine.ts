import { ClipMask, MaskShape } from '../types/timeline';

export class MaskEngine {
  /**
   * Generates an SVG path or CSS clip-path polygon for a given mask configuration.
   */
  public static getClipPath(mask: ClipMask, width: number, height: number): string {
    if (!mask || mask.shape === 'none') {
      return 'none';
    }

    const cx = (width * (mask.x || 50)) / 100;
    const cy = (height * (mask.y || 50)) / 100;
    const s = (mask.scale || 100) / 100;
    const rot = mask.rotation || 0;

    switch (mask.shape) {
      case 'circle': {
        const radius = Math.min(width, height) * 0.35 * s;
        return `circle(${radius}px at ${cx}px ${cy}px)`;
      }
      case 'rectangle': {
        const w = width * 0.6 * s;
        const h = height * 0.6 * s;
        const left = cx - w / 2;
        const top = cy - h / 2;
        return `inset(${top}px ${width - (left + w)}px ${height - (top + h)}px ${left}px round 8px)`;
      }
      case 'linear': {
        // Linear split across canvas angle
        const rad = (rot * Math.PI) / 180;
        const dx = Math.cos(rad) * width;
        const dy = Math.sin(rad) * height;
        return `polygon(${cx - dy}px ${cy + dx}px, ${cx + dy}px ${cy - dx}px, ${width * 2}px ${height * 2}px, 0px ${height * 2}px)`;
      }
      case 'mirror': {
        const span = (height * 0.25 * s);
        return `inset(${Math.max(0, cy - span)}px 0px ${Math.max(0, height - (cy + span))}px 0px)`;
      }
      case 'heart': {
        // Approximated polygon for heart
        return `polygon(50% 15%, 80% 0%, 100% 25%, 100% 55%, 50% 95%, 0% 55%, 0% 25%, 20% 0%)`;
      }
      case 'star': {
        // 5-point star polygon
        return `polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)`;
      }
      default:
        return 'none';
    }
  }

  /**
   * Applies mask clipping directly to an HTML5 2D Canvas Context
   */
  public static applyToCanvas(ctx: CanvasRenderingContext2D, mask: ClipMask, width: number, height: number) {
    if (!mask || mask.shape === 'none') return;

    ctx.save();
    const cx = (width * (mask.x || 50)) / 100;
    const cy = (height * (mask.y || 50)) / 100;
    const s = (mask.scale || 100) / 100;

    ctx.translate(cx, cy);
    if (mask.rotation) {
      ctx.rotate((mask.rotation * Math.PI) / 180);
    }

    ctx.beginPath();
    switch (mask.shape) {
      case 'circle': {
        const radius = Math.min(width, height) * 0.35 * s;
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        break;
      }
      case 'rectangle': {
        const w = width * 0.6 * s;
        const h = height * 0.6 * s;
        ctx.rect(-w / 2, -h / 2, w, h);
        break;
      }
      case 'mirror': {
        const span = (height * 0.25 * s);
        ctx.rect(-width, -span, width * 2, span * 2);
        break;
      }
      case 'heart': {
        const r = Math.min(width, height) * 0.3 * s;
        ctx.moveTo(0, r * 0.8);
        ctx.bezierCurveTo(r, r * 0.2, r * 1.2, -r * 0.6, 0, -r * 0.3);
        ctx.bezierCurveTo(-r * 1.2, -r * 0.6, -r, r * 0.2, 0, r * 0.8);
        break;
      }
      case 'star': {
        const spikes = 5;
        const outer = Math.min(width, height) * 0.35 * s;
        const inner = outer * 0.5;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;

        ctx.moveTo(0, -outer);
        for (let i = 0; i < spikes; i++) {
          let x = Math.cos(rot) * outer;
          let y = Math.sin(rot) * outer;
          ctx.lineTo(x, y);
          rot += step;

          x = Math.cos(rot) * inner;
          y = Math.sin(rot) * inner;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(0, -outer);
        ctx.closePath();
        break;
      }
      default:
        break;
    }

    ctx.clip();
  }
}
