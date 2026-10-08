/**
 * PB CivilLab — Authoritative Versioned Persistence & Storage Engine
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * ARCHITECTURAL CONSTITUTION:
 * 1. Single Source of Truth: Projects own their calculation history.
 * 2. Zero Fabricated Metadata: Initial project has clean, unpopulated optional fields.
 * 3. Schema Versioning & Safe Migration: Migrates v1 storage to v2 seamlessly.
 * 4. Deterministic UUIDs: Uses crypto.randomUUID() across all records.
 * 5. Safe Malformed JSON Handling: Never crashes the application on corrupted local state.
 */

import { AppSettings, ProjectWorkspace, ReportProjectMeta, HistoryItem } from '../types';
import { APP_VERSION } from '../constants/version';
import { REGIONAL_PROFILES } from '../constants/engineering';

export const CURRENT_SCHEMA_VERSION = 2;

export const STORAGE_KEYS = {
  VERSIONED_STATE: 'pb_civillab_v2_state',
  SETTINGS: 'pb_civillab_settings',
  PROJECTS: 'pb_civillab_projects',
  ACTIVE_PROJECT_ID: 'pb_civillab_active_project_id',
  FAVORITES: 'pb_civillab_favorites',
  THEME: 'pb_civillab_theme',
  ACCENT_THEME: 'pb_civillab_accent_theme',
  LEGACY_HISTORY: 'pb_civillab_history',
};

/**
 * Standard RFC4122 compliant UUID generator
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Clean default initial project with ZERO fabricated clients, locations, or sign-offs.
 */
export function createBlankProject(name: string = 'Default Engineering Workspace'): ProjectWorkspace {
  const year = new Date().getFullYear();
  const id = generateUUID();
  const shortCode = id.slice(0, 8).toUpperCase();

  return {
    id,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meta: {
      projectName: name,
      documentNumber: `PBCL-${year}-${shortCode}`,
      reportStatus: 'Draft',
      // client, location, consultant, contractor, preparedBy left undefined/empty
    },
    history: [],
    currency: 'BDT',
    currencySymbol: '৳',
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  currency: 'BDT',
  currencySymbol: '৳',
  unitSystem: 'metric',
  decimalPrecision: 2,
  defaultCementBagKg: 50,
  defaultDryFactorConcrete: 1.54,
  defaultDryFactorPlaster: 1.33,
  defaultConcreteWastage: 3,
  regionalProfile: REGIONAL_PROFILES.bd_standard,
};

export interface PersistedAppStateV2 {
  schemaVersion: number;
  appVersion: string;
  updatedAt: string;
  activeProjectId: string;
  projects: ProjectWorkspace[];
  settings: AppSettings;
  favorites: string[];
}

/**
 * Strips legacy fabricated mock metadata from project records
 */
function sanitizeProjectMeta(meta?: ReportProjectMeta): ReportProjectMeta {
  if (!meta) return {};
  const cleaned: ReportProjectMeta = { ...meta };

  // Strip known old template mock values
  if (cleaned.client === 'Site Engineering Office' || cleaned.client === 'Civil Infrastructure Client') {
    delete cleaned.client;
  }
  if (cleaned.location === 'Jobsite Location' || cleaned.location === 'Dhaka Central Jobsite') {
    delete cleaned.location;
  }
  if (cleaned.preparedBy === 'Prokash Biswas, Lead Engineer') {
    // Keep preparedBy only if user explicitly typed it; remove if default template
    delete cleaned.preparedBy;
  }

  return cleaned;
}

/**
 * Migrates v1 unversioned storage into Schema v2
 */
export function migrateV1ToV2(): PersistedAppStateV2 {
  let settings: AppSettings = DEFAULT_APP_SETTINGS;
  try {
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) settings = { ...DEFAULT_APP_SETTINGS, ...JSON.parse(rawSettings) };
  } catch (e) {
    console.warn('[PB CivilLab Storage] Failed to load legacy settings, using defaults', e);
  }

  let projects: ProjectWorkspace[] = [];
  try {
    const rawProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (rawProjects) {
      const parsed = JSON.parse(rawProjects);
      if (Array.isArray(parsed) && parsed.length > 0) {
        projects = parsed.map((p: any) => ({
          ...p,
          id: p.id || generateUUID(),
          meta: sanitizeProjectMeta(p.meta),
          history: Array.isArray(p.history) ? p.history : [],
        }));
      }
    }
  } catch (e) {
    console.warn('[PB CivilLab Storage] Failed to load legacy projects', e);
  }

  // Check legacy global history and consolidate under active project
  let legacyHistory: HistoryItem[] = [];
  try {
    const rawHistory = localStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY);
    if (rawHistory) {
      const parsed = JSON.parse(rawHistory);
      if (Array.isArray(parsed)) legacyHistory = parsed;
    }
  } catch (e) {}

  if (projects.length === 0) {
    const initialProject = createBlankProject();
    if (legacyHistory.length > 0) {
      initialProject.history = legacyHistory;
    }
    projects = [initialProject];
  } else if (legacyHistory.length > 0) {
    // Merge any missing history items into the first project without duplication
    const firstProj = projects[0];
    const existingIds = new Set(firstProj.history.map(h => h.id));
    for (const item of legacyHistory) {
      if (!existingIds.has(item.id)) {
        firstProj.history.push(item);
      }
    }
  }

  let activeProjectId = projects[0].id;
  try {
    const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    if (savedActiveId && projects.some(p => p.id === savedActiveId)) {
      activeProjectId = savedActiveId;
    }
  } catch (e) {}

  let favorites: string[] = ['rebar-weight', 'concrete-mix', 'brickwork', 'unit-converter'];
  try {
    const rawFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (rawFavs) {
      const parsed = JSON.parse(rawFavs);
      if (Array.isArray(parsed)) favorites = parsed;
    }
  } catch (e) {}

  const state: PersistedAppStateV2 = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    updatedAt: new Date().toISOString(),
    activeProjectId,
    projects,
    settings,
    favorites,
  };

  savePersistedState(state);
  return state;
}

/**
 * Loads persisted app state, automatically executing migrations if needed.
 */
export function loadPersistedState(): PersistedAppStateV2 {
  try {
    const rawState = localStorage.getItem(STORAGE_KEYS.VERSIONED_STATE);
    if (rawState) {
      const state: PersistedAppStateV2 = JSON.parse(rawState);
      if (state && state.schemaVersion === CURRENT_SCHEMA_VERSION && Array.isArray(state.projects)) {
        return state;
      }
    }
  } catch (err) {
    console.error('[PB CivilLab Storage] Malformed state JSON encountered. Migrating cleanly.', err);
  }

  // Fallback or legacy v1 detection
  return migrateV1ToV2();
}

/**
 * Saves versioned app state into localStorage with error resilience.
 */
export function savePersistedState(state: PersistedAppStateV2): void {
  try {
    const serialized = JSON.stringify({
      ...state,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.VERSIONED_STATE, serialized);

    // Keep activeProjectId and settings easily accessible
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, state.activeProjectId);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
  } catch (err) {
    console.warn('[PB CivilLab Storage] Failed to write state to localStorage (storage quota):', err);
  }
}

/**
 * Validates and imports a JSON project backup without destroying existing workspaces.
 */
export function validateAndImportBackup(jsonString: string): {
  success: boolean;
  importedProject?: ProjectWorkspace;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Backup file does not contain a valid JSON object.' };
    }

    const projectCandidate: ProjectWorkspace = data.project || data;
    if (!projectCandidate.name || typeof projectCandidate.name !== 'string') {
      return { success: false, error: 'Backup does not contain a valid project workspace name.' };
    }

    // Ensure safe clean IDs
    const importedProject: ProjectWorkspace = {
      ...projectCandidate,
      id: generateUUID(),
      name: `${projectCandidate.name} (Restored)`,
      updatedAt: new Date().toISOString(),
      history: Array.isArray(projectCandidate.history) ? projectCandidate.history : [],
      meta: sanitizeProjectMeta(projectCandidate.meta),
    };

    return { success: true, importedProject };
  } catch (err) {
    return { success: false, error: `Invalid JSON syntax: ${(err as Error).message}` };
  }
}
