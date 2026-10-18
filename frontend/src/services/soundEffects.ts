// Web Audio API Sound Synthesizer for SABYCUT SFX

class SoundEffectSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Whoosh sound: Filtered noise sweep
  playWhoosh(volume = 0.8) {
    const ctx = this.getContext();
    const duration = 0.45;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0;

    const now = ctx.currentTime;
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(120, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  // Ding chime: Bell notification
  playDing(volume = 0.85) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 1.2;

    const freqs = [1046.5, 2093.0];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const initialVol = volume * (idx === 0 ? 0.8 : 0.4);
      gain.gain.setValueAtTime(initialVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // Pop sound
  playPop(volume = 0.8) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 0.12;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.8);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Bass Drop 808 sound
  playBassDrop(volume = 1.0) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 1.8;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + duration * 0.8);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playByType(type: string, volume = 0.8) {
    switch (type) {
      case 'whoosh':
        this.playWhoosh(volume);
        break;
      case 'ding':
        this.playDing(volume);
        break;
      case 'pop':
        this.playPop(volume);
        break;
      case 'bass_drop':
      case 'impact':
        this.playBassDrop(volume);
        break;
      default:
        this.playWhoosh(volume);
    }
  }
}

export const sfxSynth = new SoundEffectSynthesizer();
