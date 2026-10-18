import { MediaSource } from '../types/timeline';

export class MediaLibraryService {
  /**
   * Generates a video thumbnail client-side by seeking to 1 second and painting to a canvas
   */
  public static async generateVideoThumbnail(file: File): Promise<{ thumbnail: string; duration: number; width: number; height: number }> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const aspect = video.videoWidth / (video.videoHeight || 1);
        canvas.width = 160;
        canvas.height = Math.round(160 / aspect);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        resolve({
          thumbnail,
          duration: video.duration || 5,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080
        });
      };

      video.onerror = () => {
        resolve({
          thumbnail: '',
          duration: 5,
          width: 1920,
          height: 1080
        });
      };
    });
  }

  /**
   * Creates a MediaSource from a user uploaded file
   */
  public static async processImportedFile(file: File): Promise<MediaSource> {
    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    const isAudio = file.type.startsWith('audio');
    const type: 'video' | 'image' | 'audio' = isVideo ? 'video' : isImage ? 'image' : 'audio';

    let thumbnail = '';
    let duration = 5;
    let width = 1080;
    let height = 1920;

    const uri = URL.createObjectURL(file);

    if (isVideo) {
      const meta = await this.generateVideoThumbnail(file);
      thumbnail = meta.thumbnail;
      duration = meta.duration;
      width = meta.width;
      height = meta.height;
    } else if (isImage) {
      thumbnail = uri;
      duration = 5;
    } else if (isAudio) {
      duration = 15;
    }

    return {
      id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      type,
      uri,
      proxyUri: uri,
      duration,
      width,
      height,
      thumbnail,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Filter and sort media items
   */
  public static filterAndSort(
    items: MediaSource[],
    filterType: 'all' | 'video' | 'image' | 'audio',
    searchQuery: string,
    sortBy: 'date' | 'name' | 'duration'
  ): MediaSource[] {
    let result = items;

    if (filterType !== 'all') {
      result = result.filter((i) => i.type === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }

    return result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'duration') {
        return b.duration - a.duration;
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }
}
