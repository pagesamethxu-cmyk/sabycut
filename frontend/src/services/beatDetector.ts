export class BeatDetector {
  /**
   * Fast peak energy beat detection on raw audio buffer or simulated PCM samples
   */
  public static detectBeatsFromBuffer(
    channelData: Float32Array,
    sampleRate: number,
    thresholdMultiplier: number = 1.25
  ): number[] {
    const windowSize = Math.floor(sampleRate * 0.04); // 40ms window
    const hopSize = Math.floor(sampleRate * 0.02); // 20ms hop
    const energies: number[] = [];

    // Calculate RMS energy per frame
    for (let i = 0; i <= channelData.length - windowSize; i += hopSize) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += channelData[i + j] * channelData[i + j];
      }
      energies.push(Math.sqrt(sum / windowSize));
    }

    if (energies.length === 0) return [];

    // Dynamic threshold peak detection
    const beats: number[] = [];
    const localWindow = 8; // 8 frames (approx 160ms)

    for (let i = localWindow; i < energies.length - localWindow; i++) {
      let localSum = 0;
      for (let j = i - localWindow; j <= i + localWindow; j++) {
        localSum += energies[j];
      }
      const localAvg = localSum / (localWindow * 2 + 1);
      const threshold = Math.max(localAvg * thresholdMultiplier, 0.02);

      // Local peak check
      if (
        energies[i] > threshold &&
        energies[i] >= energies[i - 1] &&
        energies[i] > energies[i + 1]
      ) {
        const time = (i * hopSize) / sampleRate;
        // Enforce minimum gap of 0.2s between beats
        if (beats.length === 0 || time - beats[beats.length - 1] > 0.2) {
          beats.push(parseFloat(time.toFixed(3)));
        }
      }
    }

    return beats;
  }

  /**
   * Generates rhythmic beat markers based on a specific BPM (beats per minute)
   */
  public static generateBeatsForBpm(bpm: number, totalDuration: number, offset: number = 0): number[] {
    if (bpm <= 0 || totalDuration <= 0) return [];
    const beatInterval = 60 / bpm;
    const beats: number[] = [];
    let current = offset;

    while (current < totalDuration) {
      if (current >= 0) {
        beats.push(parseFloat(current.toFixed(3)));
      }
      current += beatInterval;
    }

    return beats;
  }

  /**
   * Helper that finds the closest beat timestamp for magnetic snapping
   */
  public static snapToBeat(time: number, beats: number[], threshold: number = 0.15): number {
    let closest = time;
    let minDiff = threshold;

    for (const b of beats) {
      const diff = Math.abs(b - time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = b;
      }
    }

    return closest;
  }
}
