import { ProjectTimeline, createDefaultTimeline, migrateTimeline, validateTimeline } from '../types/timeline';

const STORAGE_PREFIX = 'sabycut_project_';
const PROJECT_LIST_KEY = 'sabycut_project_index';

// In-memory fallback for environments without window.localStorage (SSR, tests)
const memoryStorage = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStorage.get(key) || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  } else {
    memoryStorage.set(key, value);
  }
}

function removeStorageItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    memoryStorage.delete(key);
  }
}

export function clearProjectStorage(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  memoryStorage.clear();
}

export interface ProjectSummary {
  id: string;
  title: string;
  duration: number;
  aspectRatio: string;
  updatedAt: string;
  thumbnail?: string;
}

export class ProjectStorageService {
  public static listProjects(): ProjectSummary[] {
    try {
      const indexStr = getStorageItem(PROJECT_LIST_KEY);
      if (!indexStr) return [];
      const list = JSON.parse(indexStr);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  public static saveProject(timeline: ProjectTimeline): boolean {
    try {
      const validation = validateTimeline(timeline);
      if (!validation.valid) {
        console.warn('Timeline validation warning:', validation.errors);
      }

      timeline.updatedAt = new Date().toISOString();
      const serialized = JSON.stringify(timeline);
      setStorageItem(`${STORAGE_PREFIX}${timeline.id}`, serialized);

      // Update index
      const projects = this.listProjects();
      const existingIdx = projects.findIndex((p) => p.id === timeline.id);
      const summary: ProjectSummary = {
        id: timeline.id,
        title: timeline.title,
        duration: timeline.duration,
        aspectRatio: timeline.aspectRatio,
        updatedAt: timeline.updatedAt,
        thumbnail: timeline.sources[0]?.thumbnail
      };

      if (existingIdx >= 0) {
        projects[existingIdx] = summary;
      } else {
        projects.unshift(summary);
      }
      setStorageItem(PROJECT_LIST_KEY, JSON.stringify(projects));
      return true;
    } catch (err) {
      console.error('Failed to save project:', err);
      return false;
    }
  }

  public static loadProject(id: string): ProjectTimeline | null {
    try {
      const dataStr = getStorageItem(`${STORAGE_PREFIX}${id}`);
      if (!dataStr) return null;
      const raw = JSON.parse(dataStr);
      return migrateTimeline(raw);
    } catch (err) {
      console.error('Failed to load project:', err);
      return null;
    }
  }

  public static deleteProject(id: string): boolean {
    try {
      removeStorageItem(`${STORAGE_PREFIX}${id}`);
      const projects = this.listProjects().filter((p) => p.id !== id);
      setStorageItem(PROJECT_LIST_KEY, JSON.stringify(projects));
      return true;
    } catch {
      return false;
    }
  }

  public static duplicateProject(id: string, newTitle?: string): ProjectTimeline | null {
    const existing = this.loadProject(id);
    if (!existing) return null;

    const newId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: ProjectTimeline = {
      ...existing,
      id: newId,
      title: newTitle || `${existing.title} (ចម្លង)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveProject(duplicated);
    return duplicated;
  }

  public static renameProject(id: string, newTitle: string): boolean {
    const existing = this.loadProject(id);
    if (!existing) return false;
    existing.title = newTitle;
    return this.saveProject(existing);
  }

  public static exportTimelineJson(timeline: ProjectTimeline): string {
    return JSON.stringify(timeline, null, 2);
  }

  public static importTimelineJson(jsonString: string): ProjectTimeline {
    const parsed = JSON.parse(jsonString);
    const migrated = migrateTimeline(parsed);
    this.saveProject(migrated);
    return migrated;
  }
}
