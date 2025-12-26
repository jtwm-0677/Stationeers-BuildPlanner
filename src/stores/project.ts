/**
 * Project store - manages current project state
 */

import { writable, derived } from 'svelte/store';
import { Project, type ProjectMetadata } from '../engine';

// Current project instance
const projectInstance = writable<Project>(Project.create());

// Derived stores for specific state
export const project = {
  subscribe: projectInstance.subscribe,

  create(name: string = 'Untitled Project') {
    projectInstance.set(Project.create(name));
  },

  load(data: { metadata: ProjectMetadata; objects: any[] }) {
    projectInstance.set(Project.import(data));
  },

  update(fn: (p: Project) => void) {
    projectInstance.update(p => {
      fn(p);
      return p;
    });
  }
};

// Metadata as a derived store
export const projectMetadata = derived(projectInstance, $p => $p.metadata);

// Dirty flag as a derived store
export const projectIsDirty = derived(projectInstance, $p => $p.isDirty);
