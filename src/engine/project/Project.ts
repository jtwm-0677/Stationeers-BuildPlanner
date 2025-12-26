/**
 * Project - top-level container for a build plan
 */

import { Grid } from '../grid/Grid';
import { CommandStack } from '../commands/CommandStack';
import { MAIN_GRID } from '../grid/types';
import type { GameObject } from '../objects/types';
import type { Grid3 } from '../grid/types';
import { getSpawnpoint, getDefaultSpawnpoint } from '../../data';

export const PROJECT_VERSION = '2.0';

export interface ProjectMetadata {
  name: string;
  version: string;
  created: string;
  modified: string;
  map: string;               // Map ID (e.g., 'mars')
  spawnpoint: string;        // Spawnpoint ID
  spawnCoords: Grid3;        // World coordinates of spawnpoint
  // Legacy fields (kept for compatibility)
  description?: string;
  planet?: string;
}

export interface ProjectData {
  version: string;
  metadata: ProjectMetadata;
  objects: GameObject[];
}

/**
 * A build planning project
 */
export class Project {
  private grid: Grid;
  private commands: CommandStack;
  private _metadata: ProjectMetadata;
  private _isDirty: boolean = false;

  private constructor(metadata: ProjectMetadata) {
    this.grid = new Grid();
    this.commands = new CommandStack();
    this._metadata = metadata;

    // Track changes via command stack
    this.commands.setOnChange(() => {
      this._isDirty = true;
      this._metadata.modified = new Date().toISOString();
    });
  }

  /**
   * Get the grid
   */
  getGrid(): Grid {
    return this.grid;
  }

  /**
   * Get the command stack
   */
  getCommandStack(): CommandStack {
    return this.commands;
  }

  /**
   * Get metadata
   */
  get metadata(): ProjectMetadata {
    return { ...this._metadata };
  }

  /**
   * Update metadata
   */
  setMetadata(updates: Partial<ProjectMetadata>): void {
    this._metadata = {
      ...this._metadata,
      ...updates,
      modified: new Date().toISOString()
    };
    this._isDirty = true;
  }

  /**
   * Check if project has unsaved changes
   */
  get isDirty(): boolean {
    return this._isDirty;
  }

  /**
   * Mark project as saved
   */
  markSaved(): void {
    this._isDirty = false;
  }

  /**
   * Export project to JSON-serializable data
   */
  export(): ProjectData {
    return {
      version: PROJECT_VERSION,
      metadata: {
        ...this._metadata,
        modified: new Date().toISOString()
      },
      objects: this.grid.getAllObjects()
    };
  }

  /**
   * Import project from data (with migration support)
   */
  static import(data: unknown): Project {
    const migratedData = migrateProjectData(data);

    const project = new Project(migratedData.metadata);

    for (const obj of migratedData.objects) {
      project.grid.place(obj);
    }

    project._isDirty = false;
    return project;
  }

  /**
   * Create a new empty project
   */
  static create(name: string = 'Untitled Project', mapId: string = 'Mars2', spawnpointId?: string): Project {
    // If no spawnpoint specified, use the first one for the map
    const spawnpoint = spawnpointId
      ? getSpawnpoint(mapId, spawnpointId)
      : getDefaultSpawnpoint(mapId);
    const spawnCoords = spawnpoint?.coords ?? { x: 0, y: 0, z: 0 };
    const actualSpawnpointId = spawnpoint?.id ?? 'unknown';

    return new Project({
      name,
      version: PROJECT_VERSION,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      map: mapId,
      spawnpoint: actualSpawnpointId,
      spawnCoords
    });
  }
}

/**
 * Migrate legacy project data to current version
 */
function migrateProjectData(data: unknown): ProjectData {
  const obj = data as Record<string, unknown>;

  // Check version
  const version = (obj.version as string) ||
    ((obj.metadata as Record<string, unknown>)?.version as string) ||
    '1.0';

  if (version === PROJECT_VERSION) {
    return data as ProjectData;
  }

  // Migrate from v1.x (or no version)
  if (version.startsWith('1.') || version === '1.0.0' || !obj.version) {
    console.log('Migrating project from v1.x to v2.0');

    const oldMetadata = obj.metadata as Record<string, unknown> || {};
    const oldObjects = (obj.objects as unknown[]) || [];

    return {
      version: PROJECT_VERSION,
      metadata: {
        name: (oldMetadata.name as string) || 'Migrated Project',
        version: PROJECT_VERSION,
        created: (oldMetadata.created as string) || new Date().toISOString(),
        modified: new Date().toISOString(),
        map: (oldMetadata.planet as string)?.toLowerCase() || 'mars',
        spawnpoint: 'origin',
        spawnCoords: { x: 0, y: 0, z: 0 },
        description: oldMetadata.description as string,
        planet: oldMetadata.planet as string
      },
      objects: oldObjects.map((oldObj: unknown) => {
        const o = oldObj as Record<string, unknown>;
        const oldPos = o.position as { x: number; y: number; z: number };
        return {
          ...o,
          position: {
            x: oldPos.x * MAIN_GRID,
            y: oldPos.y * MAIN_GRID,
            z: oldPos.z * MAIN_GRID
          }
        } as GameObject;
      })
    };
  }

  // Unknown version, return as-is and hope for the best
  console.warn(`Unknown project version: ${version}`);
  return data as ProjectData;
}
