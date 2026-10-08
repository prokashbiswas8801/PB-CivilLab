import React, { useState, useRef } from 'react';
import { ProjectWorkspace, ExportedProjectData, AppSettings } from '../../types';
import { FolderKanban, Plus, Download, Upload, Trash2, Check, X, AlertTriangle, Calendar, FileText, ChevronRight, Edit3 } from 'lucide-react';
import { useToast } from './Toast';

interface ProjectWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectWorkspace[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, meta?: any) => void;
  onUpdateProject: (project: ProjectWorkspace) => void;
  onDeleteProject: (projectId: string) => void;
  onImportProject: (data: ProjectWorkspace) => void;
  settings: AppSettings;
}

export const ProjectWorkspaceModal: React.FC<ProjectWorkspaceModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onImportProject,
  settings,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    onCreateProject(trimmed);
    setNewProjectName('');
    setIsCreating(false);
    toast.success(`Project "${trimmed}" created successfully`);
  };

  const handleExport = (project: ProjectWorkspace) => {
    const exportPayload: ExportedProjectData = {
      version: '2.0.0',
      app: 'PB CivilLab',
      exportedAt: new Date().toISOString(),
      project: {
        ...project,
        updatedAt: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `PBCL_Project_${safeName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.info(`Exported "${project.name}" as JSON file`);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File does not contain valid JSON data.');
        }

        // Schema & signature verification
        if (parsed.app !== 'PB CivilLab' && !parsed.project) {
          throw new Error('Unsupported file signature. Must be a PB CivilLab Project JSON.');
        }

        const proj = parsed.project || parsed;
        if (!proj.id || !proj.name) {
          throw new Error('Incompatible project schema: Missing project ID or Name.');
        }

        const validatedProject: ProjectWorkspace = {
          id: proj.id.startsWith('proj_') ? `${proj.id}_imported_${Date.now()}` : `proj_${Date.now()}`,
          name: `${proj.name} (Imported)`,
          createdAt: proj.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          meta: proj.meta || {},
          history: Array.isArray(proj.history) ? proj.history : [],
          boqItems: Array.isArray(proj.boqItems) ? proj.boqItems : [],
          takeoffItems: Array.isArray(proj.takeoffItems) ? proj.takeoffItems : [],
          unitPreferences: proj.unitPreferences || settings.unitPreferences,
          currency: proj.currency || settings.currency,
          currencySymbol: proj.currencySymbol || settings.currencySymbol,
        };

        onImportProject(validatedProject);
        toast.success(`Project "${validatedProject.name}" imported with ${validatedProject.history.length} calculations`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setImportError(err?.message || 'Failed to parse project file');
        toast.error('Project import failed');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveRename = (project: ProjectWorkspace) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onUpdateProject({
        ...project,
        name: trimmed,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Renamed project to "${trimmed}"`);
    }
    setEditingProjectId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#151D2C]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Project Workspaces
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organize calculation history, takeoff sheets, and QA sign-offs by project
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-3 bg-slate-100 dark:bg-[#111827] border-b border-slate-200 dark:border-white/5 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Named Project</span>
          </button>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFileChange}
              accept=".json,application/json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#151D2C] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-500" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Import Error Banner */}
        {importError && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 px-5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Create Project Input Form */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border-b border-cyan-500/20 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="e.g. Metro Line Bridge Pier 14, Commercial Tower 2"
              className="flex-1 rounded-xl border border-cyan-500/30 bg-white dark:bg-[#0F172A] px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-medium"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              Save Project
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Project List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100 dark:divide-white/5">
          {projects.map(proj => {
            const isActive = proj.id === activeProjectId;
            const isEditing = editingProjectId === proj.id;

            return (
              <div
                key={proj.id}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isActive
                    ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#111827] hover:border-slate-300 dark:hover:border-white/15'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        className="rounded-lg border border-cyan-500 bg-white dark:bg-[#0F172A] px-2 py-1 text-xs text-slate-900 dark:text-white font-semibold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(proj)}
                        className="p-1 text-cyan-600 hover:text-cyan-500"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProjectId(null)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {proj.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-600 text-white font-semibold">
                          Active
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProjectId(proj.id);
                          setEditingName(proj.name);
                        }}
                        title="Rename Project"
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>{proj.history.length} calculations</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(proj.id);
                        toast.info(`Switched to "${proj.name}"`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Switch To
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleExport(proj)}
                    title="Export Project to Portable JSON"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete project "${proj.name}"?`)) {
                          onDeleteProject(proj.id);
                          toast.info(`Deleted "${proj.name}"`);
                        }
                      }}
                      title="Delete Project"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#151D2C] border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Active: <strong className="text-slate-800 dark:text-slate-200">{activeProject?.name}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
