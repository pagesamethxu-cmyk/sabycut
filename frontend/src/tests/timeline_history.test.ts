import { describe, it, expect } from 'vitest';
import { TimelineHistoryManager } from '../services/timelineHistory';
import { createDefaultTimeline, createDefaultTransform, TimelineClip } from '../types/timeline';

describe('TimelineHistoryManager (Undo/Redo & Operations)', () => {
  it('supports undo and redo state stack', () => {
    const timeline = createDefaultTimeline('proj-history', 'History Test');
    const manager = new TimelineHistoryManager(timeline);

    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(false);

    // Add clip
    const clip1: TimelineClip = {
      id: 'clip-1',
      trackId: 'track-v1',
      title: 'First Clip',
      type: 'video',
      start: 0,
      end: 5,
      inPoint: 0,
      outPoint: 5,
      duration: 5,
      speed: 1,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      transform: createDefaultTransform(),
      blendMode: 'normal',
      properties: {}
    };

    manager.addClip(clip1);
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);
    expect(manager.getTimeline().clips.length).toBe(1);

    // Undo
    manager.undo();
    expect(manager.getTimeline().clips.length).toBe(0);
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(true);

    // Redo
    manager.redo();
    expect(manager.getTimeline().clips.length).toBe(1);
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);
  });

  it('splits clip accurately into two clips at playhead', () => {
    const timeline = createDefaultTimeline();
    const manager = new TimelineHistoryManager(timeline);

    const clip: TimelineClip = {
      id: 'clip-split-test',
      trackId: 'track-v1',
      title: 'To Split',
      type: 'video',
      start: 2,
      end: 10,
      inPoint: 0,
      outPoint: 8,
      duration: 8,
      speed: 1,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      transform: createDefaultTransform(),
      blendMode: 'normal',
      properties: {}
    };

    manager.addClip(clip);
    const splitSuccess = manager.splitClip('clip-split-test', 6);
    expect(splitSuccess).toBe(true);

    const clips = manager.getTimeline().clips;
    expect(clips.length).toBe(2);

    // First half: 2 to 6
    expect(clips[0].start).toBe(2);
    expect(clips[0].end).toBe(6);
    expect(clips[0].duration).toBe(4);
    expect(clips[0].inPoint).toBe(0);
    expect(clips[0].outPoint).toBe(4);

    // Second half: 6 to 10
    expect(clips[1].start).toBe(6);
    expect(clips[1].end).toBe(10);
    expect(clips[1].duration).toBe(4);
    expect(clips[1].inPoint).toBe(4);
    expect(clips[1].outPoint).toBe(8);
  });

  it('performs ripple delete closing gaps downstream', () => {
    const timeline = createDefaultTimeline();
    const manager = new TimelineHistoryManager(timeline);

    const clipA: TimelineClip = {
      id: 'clip-a',
      trackId: 'track-v1',
      title: 'A',
      type: 'video',
      start: 0,
      end: 4,
      inPoint: 0,
      outPoint: 4,
      duration: 4,
      speed: 1,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      transform: createDefaultTransform(),
      blendMode: 'normal',
      properties: {}
    };

    const clipB: TimelineClip = {
      id: 'clip-b',
      trackId: 'track-v1',
      title: 'B',
      type: 'video',
      start: 4,
      end: 9,
      inPoint: 0,
      outPoint: 5,
      duration: 5,
      speed: 1,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      transform: createDefaultTransform(),
      blendMode: 'normal',
      properties: {}
    };

    const clipC: TimelineClip = {
      id: 'clip-c',
      trackId: 'track-v1',
      title: 'C',
      type: 'video',
      start: 9,
      end: 14,
      inPoint: 0,
      outPoint: 5,
      duration: 5,
      speed: 1,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      transform: createDefaultTransform(),
      blendMode: 'normal',
      properties: {}
    };

    manager.addClip(clipA);
    manager.addClip(clipB);
    manager.addClip(clipC);

    // Ripple delete clipB (duration 5s, start 4s, end 9s)
    manager.deleteClip('clip-b', true);

    const clips = manager.getTimeline().clips;
    expect(clips.length).toBe(2);
    expect(clips.find((c) => c.id === 'clip-a')?.start).toBe(0);

    const updatedC = clips.find((c) => c.id === 'clip-c');
    expect(updatedC?.start).toBe(4); // Was 9, shifted left by 5
    expect(updatedC?.end).toBe(9);
  });

  it('adds and removes markers and supports cut to beat', () => {
    const timeline = createDefaultTimeline();
    const manager = new TimelineHistoryManager(timeline);

    manager.addMarker(3.5, 'Action Point', '#3b82f6', 'normal');
    expect(manager.getTimeline().markers.length).toBe(1);
    expect(manager.getTimeline().markers[0].time).toBe(3.5);

    manager.cutToBeat([1.0, 2.0, 3.0, 4.0]);
    const beats = manager.getTimeline().markers.filter((m) => m.type === 'beat');
    expect(beats.length).toBe(4);
  });
});
