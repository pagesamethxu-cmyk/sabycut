import React, { useState } from 'react';
import { Film, MoreVertical, Edit2, Copy, Trash2, FolderPlus, Play, Check, X } from 'lucide-react';
import { t } from '../../i18n';

export interface ProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  duration: string;
  aspectRatio: string;
  previewColor?: string;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    name: 'Phnom Penh Night Cityscape',
    updatedAt: '2026-10-18T14:30:00Z',
    duration: '00:45',
    aspectRatio: '9:16',
    previewColor: '#312e81'
  },
  {
    id: 'proj-2',
    name: 'Siem Reap Temple Sunrise',
    updatedAt: '2026-10-17T09:15:00Z',
    duration: '01:20',
    aspectRatio: '16:9',
    previewColor: '#1e3a5f'
  },
  {
    id: 'proj-3',
    name: 'Khmer Food Festival Reel',
    updatedAt: '2026-10-15T18:40:00Z',
    duration: '00:30',
    aspectRatio: '9:16',
    previewColor: '#3f2b96'
  }
];

interface RecentProjectsProps {
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({ onOpenProject, onNewProject }) => {
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem('sabycut_projects');
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem('sabycut_projects', JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  });

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const saveProjects = (updated: ProjectItem[]) => {
    setProjects(updated);
    try {
      localStorage.setItem('sabycut_projects', JSON.stringify(updated));
    } catch {
      // Storage full or restricted
    }
  };

  const handleDuplicate = (project: ProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    const copySuffix = t('projects.copySuffix', 'Copy');
    const newProj: ProjectItem = {
      ...project,
      id: `proj-${Date.now()}`,
      name: `${project.name} (${copySuffix})`,
      updatedAt: new Date().toISOString()
    };
    saveProjects([newProj, ...projects]);
  };

  const startRename = (project: ProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const confirmRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      const updated = projects.map(p => (p.id === renamingId ? { ...p, name: trimmed, updatedAt: new Date().toISOString() } : p));
      saveProjects(updated);
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(null);
    setRenameValue('');
  };

  const requestDelete = (project: ProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setDeletingId(project.id);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deletingId) return;
    const updated = projects.filter(p => p.id !== deletingId);
    saveProjects(updated);
    setDeletingId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ width: '100%', marginTop: '24px' }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        paddingLeft: '2px',
        paddingRight: '2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#f8fafc',
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap'
          }}>
            {t('projects.recentProjects')}
          </h2>
          {projects.length > 0 && (
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: '#1e2235',
              color: '#818cf8',
              fontWeight: 600
            }}>
              {projects.length}
            </span>
          )}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div
          data-testid="projects-empty-state"
          style={{
            backgroundColor: '#12141f',
            border: '1px dashed #282f49',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            backgroundColor: '#1a1e30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1'
          }}>
            <Film size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              {t('projects.emptyTitle')}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '320px', margin: '0 auto', lineHeight: '1.4' }}>
              {t('projects.emptySubtitle')}
            </p>
          </div>
          <button
            onClick={onNewProject}
            className="touch-target"
            style={{
              marginTop: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <FolderPlus size={15} />
            <span>{t('projects.startNewProject')}</span>
          </button>
        </div>
      ) : (
        <div
          data-testid="projects-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '14px'
          }}
        >
          {projects.map((proj) => (
            <div
              key={proj.id}
              data-testid={`project-card-${proj.id}`}
              onClick={() => onOpenProject(proj.id)}
              style={{
                backgroundColor: '#141724',
                border: '1px solid #23283c',
                borderRadius: '14px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Thumbnail Container */}
              <div style={{
                width: '100%',
                aspectRatio: '16 / 9',
                backgroundColor: proj.previewColor || '#1e1b4b',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* Visualizer Wave / Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: 0.6
                }}>
                  <div style={{ width: '4px', height: '24px', backgroundColor: '#818cf8', borderRadius: '2px' }} />
                  <div style={{ width: '4px', height: '40px', backgroundColor: '#a78bfa', borderRadius: '2px' }} />
                  <div style={{ width: '4px', height: '18px', backgroundColor: '#818cf8', borderRadius: '2px' }} />
                  <div style={{ width: '4px', height: '32px', backgroundColor: '#6366f1', borderRadius: '2px' }} />
                  <div style={{ width: '4px', height: '14px', backgroundColor: '#818cf8', borderRadius: '2px' }} />
                </div>

                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.2)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '18px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}>
                    <Play size={16} fill="#ffffff" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ffffff',
                  fontFamily: 'monospace'
                }}>
                  {proj.duration}
                </div>

                {/* Aspect Ratio Badge */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#94a3b8'
                }}>
                  {proj.aspectRatio}
                </div>
              </div>

              {/* Project Info & Menu Row */}
              <div style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {renamingId === proj.id ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <input
                        type="text"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename(e as unknown as React.MouseEvent);
                          if (e.key === 'Escape') cancelRename(e as unknown as React.MouseEvent);
                        }}
                        style={{
                          width: '100%',
                          backgroundColor: '#1b1f30',
                          border: '1px solid #4f46e5',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: '#ffffff',
                          fontSize: '13px'
                        }}
                      />
                      <button
                        onClick={confirmRename}
                        aria-label="Confirm Rename"
                        style={{
                          backgroundColor: '#4f46e5',
                          color: '#ffffff',
                          borderRadius: '6px',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelRename}
                        aria-label="Cancel Rename"
                        style={{
                          backgroundColor: '#272d42',
                          color: '#94a3b8',
                          borderRadius: '6px',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {proj.name}
                      </h4>
                      <p style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {formatDate(proj.updatedAt)}
                      </p>
                    </>
                  )}
                </div>

                {/* 3-dots Menu Button */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === proj.id ? null : proj.id);
                    }}
                    data-testid={`project-menu-btn-${proj.id}`}
                    aria-label="Project actions"
                    className="touch-target"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      backgroundColor: activeMenuId === proj.id ? '#252b40' : 'transparent',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === proj.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        right: 0,
                        bottom: '48px',
                        backgroundColor: '#1b1f30',
                        border: '1px solid #2d344d',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        zIndex: 20,
                        minWidth: '150px',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <button
                        onClick={(e) => startRename(proj, e)}
                        data-testid="menu-rename-btn"
                        className="touch-target"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: '#cbd5e1',
                          fontSize: '12px',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={14} color="#818cf8" />
                        <span>{t('projects.rename')}</span>
                      </button>

                      <button
                        onClick={(e) => handleDuplicate(proj, e)}
                        data-testid="menu-duplicate-btn"
                        className="touch-target"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: '#cbd5e1',
                          fontSize: '12px',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy size={14} color="#34d399" />
                        <span>{t('projects.duplicate')}</span>
                      </button>

                      <button
                        onClick={(e) => requestDelete(proj, e)}
                        data-testid="menu-delete-btn"
                        className="touch-target"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: '#f87171',
                          fontSize: '12px',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} color="#f87171" />
                        <span>{t('projects.delete')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div
          data-testid="delete-confirm-dialog"
          onClick={cancelDelete}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#141724',
              border: '1px solid #282f48',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              {t('projects.delete')}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '20px' }}>
              {t('projects.deleteConfirm')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={confirmDelete}
                data-testid="confirm-delete-btn"
                className="touch-target"
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {t('projects.delete')}
              </button>
              <button
                onClick={cancelDelete}
                className="touch-target"
                style={{
                  flex: 1,
                  backgroundColor: '#202538',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentProjects;
