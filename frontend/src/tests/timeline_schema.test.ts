import { describe, it, expect } from 'vitest';
import {
  CURRENT_TIMELINE_SCHEMA_VERSION,
  createDefaultTimeline,
  createDefaultTransform,
  createDefaultColorGrading,
  createDefaultTextProperties,
  migrateTimeline,
  validateTimeline,
  ProjectTimeline
} from '../types/timeline';

describe('Timeline Schema & Migration Engine', () => {
  it('creates valid default timeline with version 2 and all 11 tracks', () => {
    const timeline = createDefaultTimeline('proj-test-1', 'Test Project');
    expect(timeline.schemaVersion).toBe(CURRENT_TIMELINE_SCHEMA_VERSION);
    expect(timeline.schemaVersion).toBe(2);
    expect(timeline.id).toBe('proj-test-1');
    expect(timeline.title).toBe('Test Project');
    expect(timeline.aspectRatio).toBe('9:16');
    expect(timeline.tracks.length).toBe(11);

    const trackTypes = timeline.tracks.map((t) => t.type);
    expect(trackTypes).toContain('video');
    expect(trackTypes).toContain('overlay');
    expect(trackTypes).toContain('text');
    expect(trackTypes).toContain('caption');
    expect(trackTypes).toContain('effect');
    expect(trackTypes).toContain('filter');
    expect(trackTypes).toContain('sticker');
    expect(trackTypes).toContain('audio');
    expect(trackTypes).toContain('music');
    expect(trackTypes).toContain('sfx');
    expect(trackTypes).toContain('voiceover');

    const validation = validateTimeline(timeline);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('allows extensible free-form properties object on clips without breaking schema', () => {
    const timeline = createDefaultTimeline();
    timeline.clips.push({
      id: 'clip-custom-props',
      trackId: 'track-v1',
      title: 'Custom Props Clip',
      type: 'video',
      start: 0,
      end: 4.5,
      inPoint: 0,
      outPoint: 4.5,
      duration: 4.5,
      speed: 1.0,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      transform: createDefaultTransform(),
      blendMode: 'normal',
      colorGrading: createDefaultColorGrading(),
      properties: {
        customAIModel: 'gemini-1.5-pro',
        smartCropTrackId: 1042,
        renderEngineFlag: 'neon_opt',
        nestedData: { foo: 'bar', values: [1, 2, 3] }
      }
    });

    const validation = validateTimeline(timeline);
    expect(validation.valid).toBe(true);
    expect(timeline.clips[0].properties.customAIModel).toBe('gemini-1.5-pro');
    expect(timeline.clips[0].properties.nestedData.values).toEqual([1, 2, 3]);
  });

  it('migrates legacy v1 flat timeline format into v2 multi-track schema', () => {
    const legacyV1 = {
      schemaVersion: 1,
      id: 'legacy-proj-1',
      name: 'Legacy CapCut Style Project',
      aspectRatio: '16:9',
      durationSeconds: 15,
      clips: [
        { id: 'v1', type: 'video', title: 'Main Shot', start: 0, end: 5, scale: 100, rotation: 0 },
        { id: 't1', type: 'text', title: 'Khmer Title', start: 1, end: 4, text: 'ស្វាគមន៍' },
        { id: 's1', type: 'sfx', title: 'Whoosh', start: 0.5, end: 1.0 }
      ]
    };

    const migrated = migrateTimeline(legacyV1);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.id).toBe('legacy-proj-1');
    expect(migrated.title).toBe('Legacy CapCut Style Project');
    expect(migrated.aspectRatio).toBe('16:9');
    expect(migrated.tracks.length).toBe(11);
    expect(migrated.clips.length).toBe(3);

    // Verify clips assigned to proper tracks
    const videoClip = migrated.clips.find((c) => c.id === 'v1');
    expect(videoClip?.trackId).toBe('track-v1');
    expect(videoClip?.duration).toBe(5);

    const textClip = migrated.clips.find((c) => c.id === 't1');
    expect(textClip?.trackId).toBe('track-t1');
    expect(textClip?.textProperties?.text).toBe('ស្វាគមន៍');

    const sfxClip = migrated.clips.find((c) => c.id === 's1');
    expect(sfxClip?.trackId).toBe('track-x1');
  });

  it('detects and flags invalid timeline structures', () => {
    const invalidTimeline: any = {
      schemaVersion: 0,
      clips: [
        { id: 'bad-clip', start: 10, end: 5 } // end < start
      ]
    };

    const result = validateTimeline(invalidTimeline);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('schemaVersion'))).toBe(true);
    expect(result.errors.some((e) => e.includes('end time must be greater'))).toBe(true);
  });
});
