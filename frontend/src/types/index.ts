export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export interface Project {
  id: string;
  name: string;
  description?: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  timelineJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoForm {
  id: string;
  name: string;
  category: string;
  targetAspectRatio: AspectRatio;
  targetDurationSeconds: number;
  configJson: string;
  isSystem: boolean;
}

export interface Job {
  id: string;
  projectId?: string;
  type: 'AUTOCUT' | 'EXPORT' | 'ANALYSIS';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  currentStep?: string;
  progressPercentage: number;
  errorMessage?: string;
}
