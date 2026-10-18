import { TimelineClip, TimelineTrack } from '../types/timeline';
import { KeyframeEngine } from './keyframeEngine';

export class AudioEngine {
  private ctx: AudioContext | null = null;

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Calculates dynamic ducking gain factor (0 to 1) for a background track.
   * When speech/voiceover is active, lowers background audio by ducking factor.
   */
  public static calculateDuckingGain(
    currentTime: number,
    clips: TimelineClip[],
    tracks: TimelineTrack[]
  ): number {
    // Find if any speech/voiceover clip is actively playing
    const speechTrackIds = new Set(
      tracks
        .filter((t) => (t.type === 'voiceover' || t.type === 'caption') && !t.isMuted)
        .map((t) => t.id)
    );

    const isSpeechActive = clips.some(
      (c) =>
        (speechTrackIds.has(c.trackId) || c.type === 'voiceover') &&
        currentTime >= c.start &&
        currentTime <= c.end
    );

    return isSpeechActive ? 0.3 : 1.0;
  }

  /**
   * Evaluates volume gain (0 to 2.0) and pan (-1 to +1) for a clip at a given timestamp.
   */
  public static evaluateClipAudio(
    clip: TimelineClip,
    currentTime: number,
    trackMuted: boolean,
    duckingFactor: number = 1.0
  ): { gain: number; pan: number } {
    if (trackMuted || currentTime < clip.start || currentTime > clip.end) {
      return { gain: 0, pan: 0 };
    }

    const relTime = currentTime - clip.start;
    const normTime = clip.duration > 0 ? relTime / clip.duration : 0;

    // Base volume
    let baseVol = (clip.volume !== undefined ? clip.volume : 100) / 100;

    // Fade in
    if (clip.fadeIn && clip.fadeIn > 0 && relTime < clip.fadeIn) {
      baseVol *= relTime / clip.fadeIn;
    }

    // Fade out
    const remainingTime = clip.end - currentTime;
    if (clip.fadeOut && clip.fadeOut > 0 && remainingTime < clip.fadeOut) {
      baseVol *= remainingTime / clip.fadeOut;
    }

    // Keyframes
    if (clip.keyframes) {
      const volKf = clip.keyframes.find((k) => k.property === 'volume');
      if (volKf) {
        baseVol = (KeyframeEngine.evaluate(volKf, normTime, clip.volume || 100) / 100);
      }
    }

    // Ducking
    if (clip.ducking) {
      baseVol *= duckingFactor;
    }

    const pan = clip.pan !== undefined ? clip.pan : 0;
    return { gain: Math.max(0, baseVol), pan };
  }

  /**
   * Synthesizes audio cues directly in browser
   */
  public playSoundEffect(type: 'whoosh' | 'ding' | 'bass_drop' | 'click' | 'riser') {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    switch (type) {
      case 'whoosh': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }
      case 'ding': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1760, now); // A6 note
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.81);
        break;
      }
      case 'bass_drop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 1.2);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.25);
        break;
      }
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }
      case 'riser': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 2.0);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 1.8);
        gain.gain.linearRampToValueAtTime(0.01, now + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.05);
        break;
      }
    }
  }

  /**
   * Voiceover recording helper
   */
  public static async recordVoiceover(
    onCountdown: (secondsLeft: number) => void,
    onRecordingStarted: () => void
  ): Promise<{ stop: () => Promise<{ blob: Blob; url: string; duration: number }> }> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 3-2-1 Countdown
    for (let c = 3; c > 0; c--) {
      onCountdown(c);
      await new Promise((res) => setTimeout(res, 1000));
    }
    onCountdown(0);
    onRecordingStarted();

    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];
    const startTime = performance.now();

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.start();

    return {
      stop: async () => {
        return new Promise((resolve) => {
          mediaRecorder.onstop = () => {
            const duration = (performance.now() - startTime) / 1000;
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            stream.getTracks().forEach((track) => track.stop());
            resolve({ blob, url, duration });
          };
          mediaRecorder.stop();
        });
      }
    };
  }
}

export const audioEngine = new AudioEngine();
