/**
 * Local storage utilities for project persistence
 */

import type { ProjectData } from '../project/Project';

const STORAGE_KEY = 'stationeers-build-planner-projects';
const CURRENT_PROJECT_KEY = 'stationeers-build-planner-current';

export interface StoredProject {
  id: string;
  name: string;
  modified: string;
  data: ProjectData;
}

/**
 * Generate a unique project ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all stored projects
 */
export function getStoredProjects(): StoredProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save a project to local storage
 */
export function saveProject(data: ProjectData, id?: string): string {
  const projects = getStoredProjects();
  const projectId = id || generateId();

  const existingIndex = projects.findIndex(p => p.id === projectId);
  const storedProject: StoredProject = {
    id: projectId,
    name: data.metadata.name,
    modified: data.metadata.modified,
    data
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = storedProject;
  } else {
    projects.push(storedProject);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  localStorage.setItem(CURRENT_PROJECT_KEY, projectId);

  return projectId;
}

/**
 * Load a project from local storage
 */
export function loadProject(id: string): ProjectData | null {
  const projects = getStoredProjects();
  const project = projects.find(p => p.id === id);
  if (project) {
    localStorage.setItem(CURRENT_PROJECT_KEY, id);
    return project.data;
  }
  return null;
}

/**
 * Delete a project from local storage
 */
export function deleteProject(id: string): void {
  const projects = getStoredProjects();
  const filtered = projects.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get the ID of the last opened project
 */
export function getCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_PROJECT_KEY);
}

/**
 * Quick save - saves current project to a single slot
 */
export function quickSave(data: ProjectData): void {
  const currentId = getCurrentProjectId();
  saveProject(data, currentId || 'autosave');
}

/**
 * Quick load - loads from the last saved project
 */
export function quickLoad(): ProjectData | null {
  const currentId = getCurrentProjectId();
  if (currentId) {
    return loadProject(currentId);
  }
  // Try autosave as fallback
  const projects = getStoredProjects();
  const autosave = projects.find(p => p.id === 'autosave');
  return autosave?.data || null;
}
