import { ProjectTimeline, TimelineClip, TimelineTrack, TimelineMarker, createDefaultTimeline, createDefaultTransform } from '../types/timeline';

export interface HistorySnapshot {
  timeline: ProjectTimeline;
  description: string;
}

export class TimelineHistoryManager {
  private undoStack: HistorySnapshot[] = [];
  private redoStack: HistorySnapshot[] = [];
  private currentTimeline: ProjectTimeline;
  private maxHistory: number = 100;
  private listeners: ((timeline: ProjectTimeline) => void)[] = [];

  constructor(initialTimeline?: ProjectTimeline) {
    this.currentTimeline = initialTimeline ? this.clone(initialTimeline) : createDefaultTimeline();
  }

  public getTimeline(): ProjectTimeline {
    return this.currentTimeline;
  }

  public subscribe(listener: (timeline: ProjectTimeline) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.currentTimeline.updatedAt = new Date().toISOString();
    for (const listener of this.listeners) {
      listener(this.currentTimeline);
    }
  }

  public clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  public pushState(newTimeline: ProjectTimeline, description: string = 'Edit') {
    this.undoStack.push({
      timeline: this.clone(this.currentTimeline),
      description
    });
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.currentTimeline = this.clone(newTimeline);
    this.notify();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): ProjectTimeline | null {
    if (!this.canUndo()) return null;
    const previous = this.undoStack.pop()!;
    this.redoStack.push({
      timeline: this.clone(this.currentTimeline),
      description: previous.description
    });
    this.currentTimeline = previous.timeline;
    this.notify();
    return this.currentTimeline;
  }

  public redo(): ProjectTimeline | null {
    if (!this.canRedo()) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push({
      timeline: this.clone(this.currentTimeline),
      description: next.description
    });
    this.currentTimeline = next.timeline;
    this.notify();
    return this.currentTimeline;
  }

  public reset(timeline: ProjectTimeline) {
    this.currentTimeline = this.clone(timeline);
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  // --- High-level timeline mutations ---

  public addClip(clip: TimelineClip): boolean {
    const updated = this.clone(this.currentTimeline);
    updated.clips.push(clip);
    this.recalculateDuration(updated);
    this.pushState(updated, `Add clip: ${clip.title}`);
    return true;
  }

  public splitClip(clipId: string, splitTime: number): boolean {
    const updated = this.clone(this.currentTimeline);
    const index = updated.clips.findIndex((c) => c.id === clipId);
    if (index === -1) return false;

    const clip = updated.clips[index];
    if (splitTime <= clip.start || splitTime >= clip.end) {
      return false;
    }

    const firstSegmentDuration = splitTime - clip.start;
    const firstSegmentOutPoint = clip.inPoint + (firstSegmentDuration * clip.speed);

    // Left clip
    const leftClip: TimelineClip = {
      ...clip,
      id: `clip-${Date.now()}-a`,
      end: splitTime,
      duration: firstSegmentDuration,
      outPoint: firstSegmentOutPoint
    };

    // Right clip
    const rightClipDuration = clip.end - splitTime;
    const rightClip: TimelineClip = {
      ...this.clone(clip),
      id: `clip-${Date.now()}-b`,
      start: splitTime,
      duration: rightClipDuration,
      inPoint: firstSegmentOutPoint
    };

    updated.clips.splice(index, 1, leftClip, rightClip);
    this.pushState(updated, `Split clip: ${clip.title}`);
    return true;
  }

  public trimClip(clipId: string, newStart: number, newEnd: number, newInPoint?: number, newOutPoint?: number): boolean {
    const updated = this.clone(this.currentTimeline);
    const clip = updated.clips.find((c) => c.id === clipId);
    if (!clip || newStart >= newEnd) return false;

    clip.start = newStart;
    clip.end = newEnd;
    clip.duration = newEnd - newStart;
    if (newInPoint !== undefined) clip.inPoint = newInPoint;
    if (newOutPoint !== undefined) clip.outPoint = newOutPoint;

    this.recalculateDuration(updated);
    this.pushState(updated, `Trim clip: ${clip.title}`);
    return true;
  }

  public deleteClip(clipId: string, ripple: boolean = false): boolean {
    const updated = this.clone(this.currentTimeline);
    const index = updated.clips.findIndex((c) => c.id === clipId);
    if (index === -1) return false;

    const deleted = updated.clips[index];
    const duration = deleted.duration;
    updated.clips.splice(index, 1);

    if (ripple) {
      // Shift downstream clips on the same track to close the gap
      for (const c of updated.clips) {
        if (c.trackId === deleted.trackId && c.start >= deleted.end) {
          c.start -= duration;
          c.end -= duration;
        }
      }
    }

    this.recalculateDuration(updated);
    this.pushState(updated, `Delete clip: ${deleted.title}`);
    return true;
  }

  public duplicateClip(clipId: string): TimelineClip | null {
    const updated = this.clone(this.currentTimeline);
    const clip = updated.clips.find((c) => c.id === clipId);
    if (!clip) return null;

    const newStart = clip.end;
    const newEnd = newStart + clip.duration;
    const duplicated: TimelineClip = {
      ...this.clone(clip),
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      start: newStart,
      end: newEnd
    };

    updated.clips.push(duplicated);
    this.recalculateDuration(updated);
    this.pushState(updated, `Duplicate clip: ${clip.title}`);
    return duplicated;
  }

  public updateClipProperties(clipId: string, patch: Partial<TimelineClip>): boolean {
    const updated = this.clone(this.currentTimeline);
    const clip = updated.clips.find((c) => c.id === clipId);
    if (!clip) return false;

    Object.assign(clip, patch);
    if (patch.start !== undefined || patch.end !== undefined) {
      clip.duration = clip.end - clip.start;
      this.recalculateDuration(updated);
    }

    this.pushState(updated, `Update properties: ${clip.title}`);
    return true;
  }

  public setTrackProperty(trackId: string, patch: Partial<TimelineTrack>): boolean {
    const updated = this.clone(this.currentTimeline);
    const track = updated.tracks.find((t) => t.id === trackId);
    if (!track) return false;

    Object.assign(track, patch);
    this.pushState(updated, `Update track: ${track.name}`);
    return true;
  }

  public addMarker(time: number, label: string, color: string = '#f59e0b', type: 'normal' | 'beat' = 'normal'): boolean {
    const updated = this.clone(this.currentTimeline);
    updated.markers.push({
      id: `marker-${Date.now()}`,
      time,
      label,
      color,
      type
    });
    this.pushState(updated, `Add marker: ${label}`);
    return true;
  }

  public removeMarker(markerId: string): boolean {
    const updated = this.clone(this.currentTimeline);
    updated.markers = updated.markers.filter((m) => m.id !== markerId);
    this.pushState(updated, 'Remove marker');
    return true;
  }

  public cutToBeat(beatTimes: number[]): boolean {
    if (!beatTimes || beatTimes.length === 0) return false;
    const updated = this.clone(this.currentTimeline);

    // Add beat markers
    for (const b of beatTimes) {
      if (!updated.markers.some((m) => Math.abs(m.time - b) < 0.05)) {
        updated.markers.push({
          id: `beat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          time: b,
          label: 'Beat',
          color: '#ec4899',
          type: 'beat'
        });
      }
    }

    this.pushState(updated, 'Cut to Beat markers added');
    return true;
  }

  private recalculateDuration(timeline: ProjectTimeline) {
    let maxEnd = 0;
    for (const c of timeline.clips) {
      if (c.end > maxEnd) maxEnd = c.end;
    }
    timeline.duration = Math.max(maxEnd, 5);
  }
}
