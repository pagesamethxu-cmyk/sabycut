// Web Audio API Sound Synthesizer for SABYCUT Tagged Local SFX Library:
// whoosh, hit, pop, click, riser, impact

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

  // 1. Whoosh sound: Filtered noise frequency sweep
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

  // 2. Hit sound: Punchy punch transient with bass body
  playHit(volume = 0.85) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 0.35;

    // Pitch envelope
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + duration * 0.7);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Quick click transient burst
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(800, now);
    clickGain.gain.setValueAtTime(volume * 0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
  }

  // 3. Pop sound: Fast frequency bubble pop
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

  // 4. Click sound: Subtle UI / mechanical switch tick
  playClick(volume = 0.7) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 0.04;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // 5. Riser sound: Pitch build-up tension swell
  playRiser(volume = 0.8, duration = 1.6) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + duration);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(volume, now + duration * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Filter to smooth high frequencies
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // 6. Impact sound: Deep cinematic sub bass boom
  playImpact(volume = 1.0) {
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

  playByType(type: string, volume = 0.8) {
    const t = type.toLowerCase();
    switch (t) {
      case 'whoosh':
        this.playWhoosh(volume);
        break;
      case 'hit':
        this.playHit(volume);
        break;
      case 'pop':
        this.playPop(volume);
        break;
      case 'click':
        this.playClick(volume);
        break;
      case 'riser':
        this.playRiser(volume);
        break;
      case 'impact':
      case 'bass_drop':
        this.playImpact(volume);
        break;
      case 'ding':
        this.playDing(volume);
        break;
      default:
        this.playWhoosh(volume);
    }
  }
}

export const sfxSynth = new SoundEffectSynthesizer();
