/**
 * Stationeers Build Planner - Core Engine
 *
 * This module contains all game logic with ZERO framework dependencies.
 * It can be used standalone or wrapped by UI frameworks (Svelte, Tauri, etc.)
 */

// Grid system
export * from './grid/types';
export * from './grid/Grid';
export * from './grid/Cell';

// Game objects
export * from './objects/types';
export * from './objects/GameObject';

// Commands (undo/redo)
export * from './commands/Command';
export * from './commands/CommandStack';
export * from './commands/PlaceObjectCommand';
export * from './commands/RemoveObjectCommand';

// Project management
export * from './project/Project';

// Validation
export * from './validation/Validator';

// Storage
export * from './storage/Storage';

// Settings
export * from './settings';

// Collision
export * from './collision';

// Connections
export * from './connections';

// Sprites
export * from './sprites';

// 3D Renderer (GLB to orthographic 2D)
export * from './renderer';
