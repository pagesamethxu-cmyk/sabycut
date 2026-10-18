import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectStorageService, clearProjectStorage } from '../services/projectStorage';
import { createDefaultTimeline } from '../types/timeline';

describe('ProjectStorageService', () => {
  beforeEach(() => {
    clearProjectStorage();
  });

  it('saves and loads project correctly', () => {
    const timeline = createDefaultTimeline('proj-test-storage', 'My Khmer Montage');
    const saved = ProjectStorageService.saveProject(timeline);
    expect(saved).toBe(true);

    const loaded = ProjectStorageService.loadProject('proj-test-storage');
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe('proj-test-storage');
    expect(loaded?.title).toBe('My Khmer Montage');
  });

  it('lists saved projects summaries', () => {
    const t1 = createDefaultTimeline('p1', 'Project One');
    const t2 = createDefaultTimeline('p2', 'Project Two');

    ProjectStorageService.saveProject(t1);
    ProjectStorageService.saveProject(t2);

    const list = ProjectStorageService.listProjects();
    expect(list.length).toBe(2);
    expect(list.some((p) => p.id === 'p1')).toBe(true);
    expect(list.some((p) => p.id === 'p2')).toBe(true);
  });

  it('renames and duplicates projects', () => {
    const orig = createDefaultTimeline('p-orig', 'Original Video');
    ProjectStorageService.saveProject(orig);

    // Rename
    const renamed = ProjectStorageService.renameProject('p-orig', 'Renamed Video');
    expect(renamed).toBe(true);
    const loadedRenamed = ProjectStorageService.loadProject('p-orig');
    expect(loadedRenamed?.title).toBe('Renamed Video');

    // Duplicate
    const dup = ProjectStorageService.duplicateProject('p-orig');
    expect(dup).not.toBeNull();
    expect(dup?.id).not.toBe('p-orig');
    expect(dup?.title).toContain('ចម្លង');
  });

  it('deletes project cleanly', () => {
    const p = createDefaultTimeline('p-del', 'To Delete');
    ProjectStorageService.saveProject(p);
    expect(ProjectStorageService.listProjects().length).toBe(1);

    const deleted = ProjectStorageService.deleteProject('p-del');
    expect(deleted).toBe(true);
    expect(ProjectStorageService.listProjects().length).toBe(0);
    expect(ProjectStorageService.loadProject('p-del')).toBeNull();
  });

  it('exports and imports timeline JSON with schema migration guarantee', () => {
    const timeline = createDefaultTimeline('p-json', 'JSON Project');
    const jsonStr = ProjectStorageService.exportTimelineJson(timeline);
    expect(jsonStr).toContain('"schemaVersion": 2');

    const imported = ProjectStorageService.importTimelineJson(jsonStr);
    expect(imported.id).toBe('p-json');
    expect(imported.title).toBe('JSON Project');
  });
});
